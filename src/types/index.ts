/**
 * Comprehensive Type Definitions for ResearchIntel AI Platform
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  institution?: string;
  research_interests?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ResearchPaper {
  id: string;
  dataset_id?: string;
  title: string;
  abstract: string;
  publication_year: number;
  category: string;
  keywords: string[];
  authors: string[];
  doi?: string;
  source_url?: string;
  source_type?: 'dataset' | 'pdf_upload' | 'openalex' | 'manual';
  created_by?: string;
  created_at?: string;
  // NLP & ML computed fields
  cleaned_abstract?: string;
  tokens?: string[];
  predicted_category?: string;
  prediction_confidence?: number;
  prediction_probabilities?: Record<string, number>;
  user_corrected_category?: string;
  topic_id?: number;
  topic_label?: string;
  tfidf_top_terms?: { term: string; score: number }[];
  similarityScore?: number; // for similar papers search
}

export interface SavedPaperRecord {
  id: string;
  user_id: string;
  paper_id: string;
  notes?: string;
  tags: string[];
  created_at: string;
  paper?: ResearchPaper;
}

export interface SearchHistoryRecord {
  id: string;
  user_id: string;
  query_text: string;
  filters?: {
    category?: string;
    yearMin?: number;
    yearMax?: number;
    source?: string;
  };
  result_count: number;
  created_at: string;
}

export interface DatasetMeta {
  id: string;
  name: string;
  filename: string;
  recordCount: number;
  categories: string[];
  yearRange: [number, number];
  hasLabels: boolean;
  uploadedAt: string;
  status: 'raw' | 'preprocessed' | 'trained' | 'analyzed';
  isSyntheticSample?: boolean;
}

export interface ColumnMapping {
  titleField: string;
  abstractField: string;
  yearField: string;
  categoryField: string;
  keywordsField: string;
  authorsField: string;
  doiField?: string;
  sourceUrlField?: string;
}

export interface ValidationIssue {
  type: 'missing_field' | 'invalid_year' | 'duplicate_record' | 'short_abstract';
  recordIndex: number;
  paperTitle: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  missingAbstractCount: number;
  missingTitleCount: number;
  invalidYearCount: number;
  duplicateCount: number;
  shortAbstractCount: number;
  categoriesFound: string[];
  detectedYears: number[];
  issues: ValidationIssue[];
  isValid: boolean;
}

export interface PreprocessingConfig {
  lowercase: boolean;
  removePunctuation: boolean;
  removeStopwords: boolean;
  lemmatize: boolean;
  preserveScientificTerms: boolean;
  minTokenLength: number;
  customStopwords: string[];
}

export interface TfidfConfig {
  maxFeatures: number;
  minDf: number;
  maxDf: number;
  useBigrams: boolean;
  sublinearTf: boolean;
}

export type ModelType = 'multinomial_nb' | 'logistic_regression' | 'linear_svm';

export interface PerClassMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface EvaluationResults {
  modelType: ModelType;
  modelName: string;
  trainCount: number;
  testCount: number;
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  weightedF1: number;
  perClass: Record<string, PerClassMetrics>;
  confusionMatrix: {
    labels: string[];
    matrix: number[][]; // [actualIndex][predictedIndex]
  };
  trainedAt: string;
  featureCount: number;
  vocabularySample: { term: string; idf: number }[];
}

export interface DiscoveredTopic {
  id: number;
  label: string;
  topTerms: { term: string; score: number }[];
  paperCount: number;
  percentage: number;
  yearDistribution: Record<number, number>;
  representativePapers: {
    id: string;
    title: string;
    similarity: number;
  }[];
}

export interface EmergingTopicCandidate {
  topicId: number;
  label: string;
  topTerms: string[];
  emergingScore: number;
  growthRate: number; // percentage
  recentShare: number;
  historicalShare: number;
  recentCount: number;
  totalCount: number;
  isEmerging: boolean;
  momentumBadge: 'High Momentum' | 'Emerging' | 'Steady' | 'Mature';
  explanation: string;
}

export interface TrendAnalysisResult {
  years: number[];
  yearlyPublicationCounts: { year: number; count: number }[];
  categoryGrowthOverTime: {
    year: number;
    [category: string]: number;
  }[];
  topicActivityOverTime: {
    year: number;
    [topicLabel: string]: number;
  }[];
  categoryTotals: { category: string; count: number; percentage: number }[];
  emergingCandidates: EmergingTopicCandidate[];
  formulaDetails: {
    name: string;
    description: string;
    recentWindow: string;
    baselineWindow: string;
    threshold: number;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'document' | 'category' | 'topic' | 'keyword';
  val: number;
  color?: string;
  group: string;
  category?: string;
  topicId?: number;
  year?: number;
  abstractPreview?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'belongs_to_category' | 'assigned_to_topic' | 'has_keyword' | 'semantic_similarity';
  weight: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories: string[];
  topics: { id: number; label: string }[];
}

export interface StructuredPaperSummary {
  conciseSummary: string;
  researchProblem: string;
  mainObjective: string;
  methodology: string;
  keyFindings: string;
  limitations: string;
  futureDirections: string[];
  suggestedKeywords: string[];
  generatedBy: 'gemini' | 'heuristic_nlp';
  generatedAt: string;
}

export interface OpenAlexWork {
  id: string;
  doi?: string;
  title: string;
  display_name: string;
  publication_year: number;
  authorships?: { author: { display_name: string } }[];
  abstract_inverted_index?: Record<string, number[]>;
  concepts?: { display_name: string; score: number }[];
  primary_location?: { source?: { display_name: string }; landing_page_url?: string };
}

export interface AiInsightSummary {
  dominantCategories: { category: string; percentage: number; insight: string }[];
  fastestGrowingDomains: { name: string; growthRate: string; rationale: string }[];
  underrepresentedAreas: { category: string; count: number; potentialGaps: string }[];
  researchGaps: {
    title: string;
    categoriesInvolved: string[];
    description: string;
    hypothesis: string;
  }[];
  literatureReviewRoadmap: { direction: string; suggestedFocus: string; impactPotential: 'Transformative' | 'High' | 'Medium' }[];
  narrativeOverview: string;
  generatedBy: 'statistical_nlp' | 'gemini';
  timestamp: string;
}
