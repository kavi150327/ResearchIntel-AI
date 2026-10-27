import express, { Request, Response } from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  initializeSqlite,
  getDatasetsFromSqlite,
  getDatasetBundleFromSqlite,
  insertDatasetIntoSqlite,
  updatePapersInSqlite,
  saveEvaluationToSqlite,
  saveTopicsAndTrendsToSqlite,
  deleteDatasetFromSqlite,
  executeRawSql,
  getSqliteDbStats,
  getUserByEmail,
  getUserById,
  createUser,
  updateUserProfile,
  savePaperForUser,
  removeSavedPaper,
  getSavedPapersForUser,
  logSearchHistory,
  getSearchHistoryForUser,
  clearSearchHistoryForUser,
  searchPapersInSqlite,
  findSimilarPapersInSqlite,
  logAbstractPrediction,
  saveUserPredictionCorrection,
  insertSinglePaper,
  saveResearchSummary
} from './src/db/sqliteDatabase.ts';
import {
  DEFAULT_PREPROCESSING_CONFIG,
  preprocessDataset,
  preprocessText
} from './src/services/nlpEngine.ts';
import {
  DEFAULT_TFIDF_CONFIG,
  trainAndEvaluateClassifier,
  fitTfidf
} from './src/services/mlEngine.ts';
import { runKMeansClustering } from './src/services/topicEngine.ts';
import { computeTrendAnalytics } from './src/services/trendEngine.ts';
import { buildKnowledgeGraph } from './src/services/graphEngine.ts';
import { validateDataset } from './src/services/dataService.ts';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from './src/services/authService.ts';
import { extractMetadataFromPdf } from './src/services/pdfService.ts';
import { generateStructuredSummary } from './src/services/summaryService.ts';
import { DatasetMeta, DiscoveredTopic, ResearchPaper, User } from './src/types/index.ts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.disable('x-powered-by');
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 1000 }));

// Small per-process rate limiter for sensitive authentication endpoints.
const authAttempts = new Map<string, { count: number; resetAt: number }>();
app.use('/api/auth', (req: Request, res: Response, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const current = authAttempts.get(key);
  if (!current || current.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  if (current.count >= 30) return res.status(429).json({ error: 'Too many authentication attempts. Please try again in 15 minutes.' });
  current.count += 1;
  next();
});

// Helper: Extract user from Bearer token
function getAuthenticatedUser(req: Request): { userId: string; email: string; role: 'user' | 'admin'; name: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return verifySessionToken(token);
}

// Helper: Reconstruct abstract from OpenAlex inverted index
function reconstructOpenAlexAbstract(invertedIndex?: Record<string, number[]>): string {
  if (!invertedIndex) return 'Abstract not indexed in OpenAlex record.';
  const positions: [number, string][] = [];
  for (const [word, indices] of Object.entries(invertedIndex)) {
    for (const idx of indices) {
      positions.push([idx, word]);
    }
  }
  positions.sort((a, b) => a[0] - b[0]);
  return positions.map(p => p[1]).join(' ');
}

// ==================== REST API WITH REAL SQLITE DATABASE ====================

// 1. Health check with SQLite engine diagnostics
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStats = getSqliteDbStats();
  res.json({
    status: 'healthy',
    platform: 'Research Abstract Classification & Trend Discovery Platform',
    productName: 'ResearchIntel AI',
    engine: 'Express Full-Stack Server + Real SQLite 3.x Engine',
    database: {
      type: 'SQLite 3.x (WASM/Node Persistent Disk Database)',
      filePath: dbStats.filePath,
      fileSizeBytes: dbStats.fileSizeBytes,
      tables: dbStats.tables
    },
    hasGeminiKey: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.length > 10 &&
      !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY')
    ),
    timestamp: new Date().toISOString()
  });
});

// 2. Database statistics & SQL inspector
app.get('/api/db/stats', (_req: Request, res: Response) => {
  const stats = getSqliteDbStats();
  res.json(stats);
});

// 3. Raw SQL execution endpoint
app.post('/api/db/query', (req: Request, res: Response) => {
  // Arbitrary SQL is powerful and must never be exposed to unauthenticated users.
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required.' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required for SQL inspection.' });
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query string required.' });
    }
    const result = executeRawSql(sql);
    res.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'SQL query execution failed.';
    res.status(400).json({ error: message });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { password, institution, researchInterests } = req.body;
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || typeof password !== 'string' || !fullName) {
      return res.status(400).json({ error: 'A valid email, password, and full name are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (fullName.length > 100 || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Name must be 100 characters or fewer and password must be 8–128 characters.' });
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = hashPassword(password);
    const user = createUser({
      email,
      passwordHash,
      fullName,
      institution,
      researchInterests
    });

    const token = createSessionToken(user);
    res.status(201).json({ user, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Email or password is too long.' });
    }

    const userWithHash = getUserByEmail(email);
    if (!userWithHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, userWithHash.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user: User = {
      id: userWithHash.id,
      email: userWithHash.email,
      full_name: userWithHash.full_name,
      role: userWithHash.role,
      institution: userWithHash.institution,
      research_interests: userWithHash.research_interests,
      created_at: userWithHash.created_at,
      updated_at: userWithHash.updated_at
    };

    const token = createSessionToken(user);
    res.json({ user, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }

  const user = getUserById(auth.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ user });
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { fullName, institution, researchInterests } = req.body;
  const updated = updateUserProfile(auth.userId, { fullName, institution, researchInterests });
  if (!updated) {
    return res.status(404).json({ error: 'User profile update failed.' });
  }

  res.json({ user: updated });
});

// ==================== SMART RESEARCH PAPER SEARCH ====================

app.get('/api/papers/search', async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const yearMin = req.query.yearMin ? parseInt(String(req.query.yearMin), 10) : undefined;
    const yearMax = req.query.yearMax ? parseInt(String(req.query.yearMax), 10) : undefined;
    const sourceType = typeof req.query.sourceType === 'string' ? req.query.sourceType : 'ALL';
    const sortBy = (typeof req.query.sortBy === 'string' ? req.query.sortBy : 'relevance') as any;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '15'), 10)));
    const offset = (page - 1) * limit;

    const auth = getAuthenticatedUser(req);
    if (auth && query) {
      logSearchHistory(auth.userId, query, { category, yearMin, yearMax, sourceType }, 0);
    }

    // Branch A: Querying OpenAlex
    if (sourceType === 'openalex' && query) {
      try {
        const openAlexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${limit}&page=${page}`;
        const oaRes = await fetch(openAlexUrl, { headers: { 'User-Agent': 'ResearchIntelAI/1.0 (mailto:scholar@researchintel.ai)' } });
        if (oaRes.ok) {
          const oaData = await oaRes.json();
          const openAlexPapers: ResearchPaper[] = (oaData.results || []).map((work: any) => {
            const rawAbstract = reconstructOpenAlexAbstract(work.abstract_inverted_index);
            const authors = (work.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean);
            const concepts = (work.concepts || []).map((c: any) => c.display_name).slice(0, 5);
            const primaryConcept = concepts[0] || 'Artificial Intelligence';

            return {
              id: `oa-${work.id?.split('/').pop() || Math.random().toString(36).slice(2, 7)}`,
              title: work.title || work.display_name || 'Academic Publication',
              abstract: rawAbstract,
              publication_year: work.publication_year || 2024,
              category: primaryConcept,
              keywords: concepts,
              authors: authors.length > 0 ? authors : ['OpenAlex Contributor'],
              doi: work.doi ? work.doi.replace('https://doi.org/', '') : undefined,
              source_url: work.primary_location?.landing_page_url || (work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : undefined),
              source_type: 'openalex'
            };
          });

          return res.json({
            papers: openAlexPapers,
            totalCount: oaData.meta?.count || openAlexPapers.length,
            page,
            limit,
            source: 'openalex'
          });
        }
      } catch (oaErr) {
        console.warn('OpenAlex search failed, falling back to SQLite database:', oaErr);
      }
    }

    // Branch B: Querying Crossref Live Academic Metadata API
    if (sourceType === 'crossref' && query) {
      try {
        const crossrefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&offset=${offset}&mailto=scholar@researchintel.ai`;
        const crRes = await fetch(crossrefUrl, { headers: { 'User-Agent': 'ResearchIntelAI/1.0 (mailto:scholar@researchintel.ai)' } });
        if (crRes.ok) {
          const crData = await crRes.json();
          const items = crData.message?.items || [];
          const crossrefPapers: ResearchPaper[] = items.map((item: any) => {
            const authors = (item.author || []).map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean);
            const rawYear = item.issued?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0] || 2024;
            const cleanAbstract = item.abstract ? item.abstract.replace(/<[^>]*>/g, '').trim() : `Academic metadata indexed by Crossref under DOI ${item.DOI || 'N/A'}.`;
            return {
              id: `cr-${(item.DOI || Math.random().toString(36).slice(2, 7)).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
              title: Array.isArray(item.title) ? item.title[0] : (item.title || 'Academic Publication'),
              abstract: cleanAbstract,
              publication_year: Number(rawYear) || 2024,
              category: (item.subject && item.subject[0]) || 'Other / Uncertain',
              keywords: item.subject ? item.subject.slice(0, 5) : [],
              authors: authors.length > 0 ? authors : ['Crossref Author'],
              doi: item.DOI,
              source_url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : undefined),
              source_type: 'crossref'
            };
          });

          return res.json({
            papers: crossrefPapers,
            totalCount: crData.message?.['total-results'] || crossrefPapers.length,
            page,
            limit,
            source: 'crossref'
          });
        }
      } catch (crErr) {
        console.warn('Crossref search failed, falling back to SQLite database:', crErr);
      }
    }

    // Branch C: Querying Local SQLite Database
    const { papers, totalCount } = searchPapersInSqlite({
      query,
      category,
      yearMin,
      yearMax,
      sourceType,
      sortBy,
      limit,
      offset
    });

    res.json({
      papers,
      totalCount,
      page,
      limit,
      source: 'sqlite'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed.';
    res.status(500).json({ error: message });
  }
});

// Find similar papers using text similarity
app.get('/api/papers/:id/similar', (req: Request, res: Response) => {
  try {
    const limit = parseInt(String(req.query.limit || '5'), 10);
    const similarPapers = findSimilarPapersInSqlite(req.params.id, limit);
    res.json({ targetId: req.params.id, similarPapers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to find similar papers.';
    res.status(500).json({ error: message });
  }
});

// ==================== PDF UPLOAD & PARSING ====================

app.post('/api/papers/upload-pdf', async (req: Request, res: Response) => {
  try {
    const { filename, fileData } = req.body;
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ error: 'Base64 encoded PDF file data is required.' });
    }

    const pdfBuffer = Buffer.from(fileData, 'base64');
    const extracted = await extractMetadataFromPdf(pdfBuffer);

    const auth = getAuthenticatedUser(req);

    // Save paper directly into SQLite
    const newPaper = insertSinglePaper(
      {
        title: extracted.title,
        abstract: extracted.abstract,
        publication_year: extracted.publication_year,
        category: 'Other / Uncertain',
        keywords: extracted.keywords,
        authors: extracted.authors,
        doi: extracted.doi,
        source_type: 'pdf_upload'
      },
      auth?.userId
    );

    res.status(201).json({
      message: 'PDF extracted and paper cataloged in database.',
      paper: newPaper,
      extracted
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF processing failed.';
    res.status(500).json({ error: message });
  }
});

// ==================== SAVED PAPERS / PERSONAL RESEARCH LIBRARY ====================

app.post('/api/library/save', (req: Request, res: Response) => {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Please sign in to save papers to your research library.' });
  }

  const { paperId, notes, tags } = req.body;
  if (!paperId) {
    return res.status(400).json({ error: 'Paper ID is required.' });
  }

  const savedRecord = savePaperForUser(auth.userId, paperId, notes || '', tags || []);
  res.json({ message: 'Paper bookmarked to library.', savedRecord });
});

app.get('/api/library', (req: Request, res: Response) => {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const savedPapers = getSavedPapersForUser(auth.userId);
  res.json({ savedPapers });
});

app.delete('/api/library/:paperId', (req: Request, res: Response) => {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  removeSavedPaper(auth.userId, req.params.paperId);
  res.json({ success: true, message: 'Removed from library.' });
});

// ==================== SEARCH HISTORY ====================

app.get('/api/history', (req: Request, res: Response) => {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.json({ history: [] });
  }

  const history = getSearchHistoryForUser(auth.userId, 25);
  res.json({ history });
});

app.delete('/api/history', (req: Request, res: Response) => {
  const auth = getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  clearSearchHistoryForUser(auth.userId);
  res.json({ success: true });
});

// ==================== PREDICTION CORRECTION FEEDBACK ====================

app.post('/api/classify/correct', (req: Request, res: Response) => {
  const { predictionId, correctedCategory } = req.body;
  if (!predictionId || !correctedCategory) {
    return res.status(400).json({ error: 'Prediction ID and corrected category are required.' });
  }

  const auth = getAuthenticatedUser(req);
  saveUserPredictionCorrection(predictionId, correctedCategory, auth?.userId);
  res.json({ success: true, message: 'Feedback recorded for active model refinement.' });
});

// ==================== AI ABSTRACT SUMMARY & RESEARCH ASSISTANT ====================

app.post('/api/papers/summarize', async (req: Request, res: Response) => {
  try {
    const { title, abstract, paperId } = req.body;
    if (!abstract || typeof abstract !== 'string') {
      return res.status(400).json({ error: 'Abstract text is required for structured summarization.' });
    }

    const auth = getAuthenticatedUser(req);
    const summary = await generateStructuredSummary(title || 'Academic Paper', abstract);

    saveResearchSummary(paperId || null, summary, auth?.userId);

    res.json({ summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Summarization failed.';
    res.status(500).json({ error: message });
  }
});

// ==================== DATASET MANAGEMENT & PIPELINE ====================

app.get('/api/datasets', (_req: Request, res: Response) => {
  const datasets = getDatasetsFromSqlite();
  res.json({ datasets });
});

app.get('/api/datasets/:id', (req: Request, res: Response) => {
  const bundle = getDatasetBundleFromSqlite(req.params.id);
  if (!bundle) {
    return res.status(404).json({ error: `Dataset '${req.params.id}' not found in SQLite database.` });
  }
  res.json(bundle);
});

app.post('/api/datasets/upload', (req: Request, res: Response) => {
  try {
    const { name, filename, papers } = req.body;
    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return res.status(400).json({ error: 'Uploaded data must contain a non-empty array of papers.' });
    }

    const validation = validateDataset(papers);
    const id = `ds-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const categories = Array.from(new Set(papers.map((p: ResearchPaper) => p.category).filter(Boolean))).sort();
    const years = papers.map((p: ResearchPaper) => p.publication_year).filter((y: number) => y > 1900);
    const minYear = years.length > 0 ? Math.min(...years) : 2024;
    const maxYear = years.length > 0 ? Math.max(...years) : 2024;

    const meta: DatasetMeta = {
      id,
      name: name || filename || `Uploaded Dataset (${papers.length} abstracts)`,
      filename: filename || 'uploaded_data.csv',
      recordCount: papers.length,
      categories,
      yearRange: [minYear, maxYear],
      hasLabels: categories.length > 1,
      uploadedAt: new Date().toISOString(),
      status: 'raw',
      isSyntheticSample: false
    };

    insertDatasetIntoSqlite(meta, papers);

    res.status(201).json({
      message: 'Dataset uploaded and persisted to SQLite database successfully.',
      datasetId: id,
      meta,
      validation
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload processing failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/datasets/:id/preprocess', (req: Request, res: Response) => {
  const bundle = getDatasetBundleFromSqlite(req.params.id);
  if (!bundle) {
    return res.status(404).json({ error: 'Dataset not found in SQLite database.' });
  }

  const config = req.body.config || DEFAULT_PREPROCESSING_CONFIG;
  const preprocessed = preprocessDataset(bundle.papers, config);

  updatePapersInSqlite(req.params.id, preprocessed);

  res.json({
    message: 'NLP preprocessing executed and persisted to SQLite.',
    recordCount: preprocessed.length,
    sampleProcessed: preprocessed.slice(0, 3).map(p => ({
      id: p.id,
      title: p.title,
      tokensCount: p.tokens?.length || 0,
      cleanedPreview: p.cleaned_abstract?.slice(0, 100)
    }))
  });
});

app.post('/api/datasets/:id/classify', (req: Request, res: Response) => {
  const bundle = getDatasetBundleFromSqlite(req.params.id);
  if (!bundle) {
    return res.status(404).json({ error: 'Dataset not found in SQLite database.' });
  }

  const modelType = req.body.modelType || 'multinomial_nb';
  const tfidfConfig = req.body.tfidfConfig || DEFAULT_TFIDF_CONFIG;
  const trainRatio = req.body.trainRatio || 0.75;

  try {
    const result = trainAndEvaluateClassifier(bundle.papers, modelType, tfidfConfig, trainRatio);

    saveEvaluationToSqlite(req.params.id, result.evaluation);
    updatePapersInSqlite(req.params.id, result.updatedPapers);

    res.json({
      message: `Trained ${result.evaluation.modelName} successfully on ${result.evaluation.trainCount} instances and saved to SQLite.`,
      evaluation: result.evaluation
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Model training failed.';
    res.status(400).json({ error: message });
  }
});

app.post('/api/datasets/:id/topics/discover', (req: Request, res: Response) => {
  const bundle = getDatasetBundleFromSqlite(req.params.id);
  if (!bundle) {
    return res.status(404).json({ error: 'Dataset not found in SQLite database.' });
  }

  const k = parseInt(req.body.k || '5', 10);
  const tfidfConfig = req.body.tfidfConfig || DEFAULT_TFIDF_CONFIG;

  try {
    const tokens = bundle.papers.map(p => p.tokens || []);
    const tfidfModel = fitTfidf(tokens, tfidfConfig);
    const result = runKMeansClustering(bundle.papers, tfidfModel, k);
    const trends = computeTrendAnalytics(result.updatedPapers, result.topics);

    saveTopicsAndTrendsToSqlite(req.params.id, result.topics, trends);
    updatePapersInSqlite(req.params.id, result.updatedPapers);

    res.json({
      message: `Discovered ${result.topics.length} topic clusters and saved to SQLite.`,
      topics: result.topics,
      trends
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Topic discovery failed.';
    res.status(400).json({ error: message });
  }
});

app.post('/api/datasets/:id/trends/analyze', (req: Request, res: Response) => {
  const bundle = getDatasetBundleFromSqlite(req.params.id);
  if (!bundle) {
    return res.status(404).json({ error: 'Dataset not found in SQLite database.' });
  }

  const trends = computeTrendAnalytics(bundle.papers, bundle.topics);
  saveTopicsAndTrendsToSqlite(req.params.id, bundle.topics, trends);

  res.json({
    message: 'Trend analysis completed and persisted to SQLite.',
    trends
  });
});

app.get('/api/datasets/:id/graph', (req: Request, res: Response) => {
  const bundle = getDatasetBundleFromSqlite(req.params.id);
  if (!bundle) {
    return res.status(404).json({ error: 'Dataset not found in SQLite database.' });
  }

  const graph = buildKnowledgeGraph(bundle.papers, bundle.topics);
  res.json(graph);
});

// Gemini AI Insights
app.post('/api/insights/gemini', async (req: Request, res: Response) => {
  try {
    const { datasetSummary, topics, emergingCandidates } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment. The platform will use the local statistical intelligence engine.',
        isFallback: true
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are a Senior Principal AI & Data Science Researcher evaluating an academic literature corpus stored in a SQLite database.
Analyze the following empirical metrics from our Research Abstract Classification & Trend Discovery Platform.

Dataset Facts:
- Total Papers: ${datasetSummary?.totalPapers || 0}
- Categories: ${JSON.stringify(datasetSummary?.categories || [])}
- Discovered Topics: ${JSON.stringify(topics?.map((t: DiscoveredTopic) => ({ id: t.id, label: t.label, terms: t.topTerms.map(x => x.term) })) || [])}
- Emerging Candidates: ${JSON.stringify(emergingCandidates?.slice(0, 4) || [])}

Instructions:
1. Provide a rigorous, academic narrative overview (3 paragraphs) summarizing thematic convergence and rapid acceleration domains.
2. Formulate 3 distinct cross-disciplinary research gap hypotheses (concrete, actionable research directions where two domains could synergize).
3. Strictly adhere to the provided counts and topics. Do NOT fabricate citations, authors, or external metrics.
4. Output valid JSON in the exact structure:
{
  "narrativeOverview": "...",
  "researchGaps": [
    {
      "title": "...",
      "categoriesInvolved": ["...", "..."],
      "description": "...",
      "hypothesis": "..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    res.json({
      ...parsed,
      generatedBy: 'gemini',
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gemini call failed.';
    res.status(500).json({ error: msg, isFallback: true });
  }
});

// Delete dataset
app.delete('/api/datasets/:id', (req: Request, res: Response) => {
  if (req.params.id === 'sample-benchmark-corpus') {
    return res.status(403).json({ error: 'Cannot delete the built-in benchmark dataset.' });
  }
  const deleted = deleteDatasetFromSqlite(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Dataset not found in SQLite database.' });
  }
  res.json({ message: 'Dataset deleted from SQLite database successfully.' });
});

// Initialize SQLite on boot and start server
async function startServer() {
  try {
    await initializeSqlite();
    console.log('[SQLite] Database initialized and verified.');
  } catch (err) {
    console.error('[SQLite] Initialization error:', err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Research Intelligence Platform server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
