import {
  DatasetMeta,
  DiscoveredTopic,
  EvaluationResults,
  ModelType,
  PreprocessingConfig,
  ResearchPaper,
  SavedPaperRecord,
  SearchHistoryRecord,
  StructuredPaperSummary,
  TfidfConfig,
  TrendAnalysisResult,
  User,
  ValidationSummary
} from '../types/index.ts';

export interface DatasetBundle {
  meta: DatasetMeta;
  papers: ResearchPaper[];
  validation: ValidationSummary;
  evaluation: EvaluationResults | null;
  topics: DiscoveredTopic[];
  trends: TrendAnalysisResult | null;
}

let authToken: string | null = null;
try {
  authToken = localStorage.getItem('researchintel_auth_token');
} catch {
  // SSR or storage blocked
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

/**
 * Full-Stack API client for communication with Express backend & SQLite database
 */
export const apiClient = {
  // Auth state management
  setToken(token: string | null) {
    authToken = token;
    try {
      if (token) {
        localStorage.setItem('researchintel_auth_token', token);
      } else {
        localStorage.removeItem('researchintel_auth_token');
      }
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  },

  getToken(): string | null {
    return authToken;
  },

  /**
   * Health check and SQLite engine diagnostics
   */
  async checkHealth(): Promise<{
    status: string;
    engine: string;
    database: { type: string; filePath: string; fileSizeBytes: number; tables: any[] };
    hasGeminiKey: boolean;
  }> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`Health check failed (HTTP ${res.status})`);
    return res.json();
  },

  // ==================== AUTHENTICATION ====================
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');
    apiClient.setToken(data.token);
    return data;
  },

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    institution?: string;
    researchInterests?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    apiClient.setToken(result.token);
    return result;
  },

  async getMe(): Promise<{ user: User } | null> {
    if (!authToken) return null;
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      apiClient.setToken(null);
      return null;
    }
    return res.json();
  },

  async updateProfile(data: { fullName?: string; institution?: string; researchInterests?: string }): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update profile');
    return result.user;
  },

  // ==================== SMART SEARCH & PAPERS ====================
  async searchPapers(params: {
    query?: string;
    category?: string;
    yearMin?: number;
    yearMax?: number;
    sourceType?: string;
    sortBy?: 'relevance' | 'year_desc' | 'year_asc' | 'title';
    page?: number;
    limit?: number;
  }): Promise<{ papers: ResearchPaper[]; totalCount: number; source: string }> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('query', params.query);
    if (params.category && params.category !== 'ALL') searchParams.set('category', params.category);
    if (params.yearMin) searchParams.set('yearMin', String(params.yearMin));
    if (params.yearMax) searchParams.set('yearMax', String(params.yearMax));
    if (params.sourceType) searchParams.set('sourceType', params.sourceType);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const res = await fetch(`/api/papers/search?${searchParams.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Paper search failed');
    }
    return res.json();
  },

  async getSimilarPapers(paperId: string, limit = 5): Promise<ResearchPaper[]> {
    const res = await fetch(`/api/papers/${paperId}/similar?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to find similar papers');
    const data = await res.json();
    return data.similarPapers || [];
  },

  // ==================== PDF UPLOAD & PARSING ====================
  async uploadPdfPaper(file: File): Promise<{
    message: string;
    paper: ResearchPaper;
    extracted: {
      title: string;
      abstract: string;
      authors: string[];
      publication_year: number;
      keywords: string[];
      doi?: string;
    };
  }> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:application/pdf;base64, prefix
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/papers/upload-pdf', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        filename: file.name,
        fileData: base64Data,
        fileSize: file.size
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'PDF extraction failed');
    return result;
  },

  // ==================== RESEARCH LIBRARY / BOOKMARKS ====================
  async savePaperToLibrary(paperId: string, notes?: string, tags?: string[]): Promise<SavedPaperRecord> {
    const res = await fetch('/api/library/save', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paperId, notes, tags })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save paper to library');
    return result.savedRecord;
  },

  async getLibrary(): Promise<(SavedPaperRecord & { paper: ResearchPaper })[]> {
    const res = await fetch('/api/library', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load research library');
    const data = await res.json();
    return data.savedPapers || [];
  },

  async removeFromLibrary(paperId: string): Promise<boolean> {
    const res = await fetch(`/api/library/${paperId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.ok;
  },

  // ==================== SEARCH HISTORY ====================
  async getSearchHistory(): Promise<SearchHistoryRecord[]> {
    const res = await fetch('/api/history', {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  },

  async clearSearchHistory(): Promise<boolean> {
    const res = await fetch('/api/history', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.ok;
  },

  // ==================== PREDICTION CORRECTION FEEDBACK ====================
  async submitCorrection(predictionId: string, correctedCategory: string): Promise<boolean> {
    const res = await fetch('/api/classify/correct', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ predictionId, correctedCategory })
    });
    return res.ok;
  },

  // ==================== AI SUMMARY & RESEARCH ASSISTANT ====================
  async summarizePaper(title: string, abstract: string): Promise<StructuredPaperSummary> {
    const res = await fetch('/api/papers/summarize', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, abstract })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate paper summary');
    return data.summary;
  },

  // ==================== DATASET CRUD & ML ====================
  async listDatasets(): Promise<DatasetMeta[]> {
    const res = await fetch('/api/datasets');
    if (!res.ok) throw new Error('Failed to fetch dataset list');
    const data = await res.json();
    return data.datasets || [];
  },

  async getDataset(id: string): Promise<DatasetBundle> {
    const res = await fetch(`/api/datasets/${id}`);
    if (!res.ok) throw new Error(`Failed to load dataset '${id}'`);
    return res.json();
  },

  async uploadDataset(
    name: string,
    filename: string,
    papers: ResearchPaper[]
  ): Promise<{ datasetId: string; meta: DatasetMeta; validation: ValidationSummary }> {
    const res = await fetch('/api/datasets/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, filename, papers })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload dataset');
    }
    return res.json();
  },

  async preprocess(
    datasetId: string,
    config: PreprocessingConfig
  ): Promise<{ message: string; recordCount: number; sampleProcessed: any[] }> {
    const res = await fetch(`/api/datasets/${datasetId}/preprocess`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ config })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Preprocessing failed');
    }
    return res.json();
  },

  async trainClassifier(
    datasetId: string,
    modelType: ModelType,
    tfidfConfig: TfidfConfig,
    trainRatio = 0.75
  ): Promise<{ message: string; evaluation: EvaluationResults }> {
    const res = await fetch(`/api/datasets/${datasetId}/classify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ modelType, tfidfConfig, trainRatio })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Model training failed');
    }
    return res.json();
  },

  async discoverTopics(
    datasetId: string,
    k: number,
    tfidfConfig: TfidfConfig
  ): Promise<{ message: string; topics: DiscoveredTopic[]; trends: TrendAnalysisResult }> {
    const res = await fetch(`/api/datasets/${datasetId}/topics/discover`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ k, tfidfConfig })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Topic discovery failed');
    }
    return res.json();
  },

  async analyzeTrends(datasetId: string): Promise<{ message: string; trends: TrendAnalysisResult }> {
    const res = await fetch(`/api/datasets/${datasetId}/trends/analyze`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Trend analysis failed');
    }
    return res.json();
  },

  async deleteDataset(datasetId: string): Promise<{ message: string }> {
    const res = await fetch(`/api/datasets/${datasetId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Delete failed');
    }
    return res.json();
  },

  async querySql(sql: string): Promise<{ columns: string[]; values: any[][] }[]> {
    const res = await fetch('/api/db/query', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sql })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'SQL execution failed');
    }
    return data.result || [];
  }
};
