import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import {
  DatasetMeta,
  DiscoveredTopic,
  EvaluationResults,
  ResearchPaper,
  SavedPaperRecord,
  SearchHistoryRecord,
  StructuredPaperSummary,
  TrendAnalysisResult,
  User,
  ValidationSummary
} from '../types/index.ts';
import { SYNTHETIC_RESEARCH_PAPERS } from '../data/sampleDataset.ts';
import { DEFAULT_PREPROCESSING_CONFIG, preprocessDataset } from '../services/nlpEngine.ts';
import { DEFAULT_TFIDF_CONFIG, fitTfidf, trainAndEvaluateClassifier, transformTfidf } from '../services/mlEngine.ts';
import { runKMeansClustering } from '../services/topicEngine.ts';
import { computeTrendAnalytics } from '../services/trendEngine.ts';
import { validateDataset } from '../services/dataService.ts';
import { hashPassword } from '../services/authService.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'research_intelligence.sqlite');

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

export function getDbInstance(): Database | null {
  return dbInstance;
}

export function persistDatabaseToDisk(): void {
  if (!dbInstance) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const binaryArray = dbInstance.export();
  fs.writeFileSync(DB_PATH, Buffer.from(binaryArray));
}

export async function initializeSqlite(): Promise<Database> {
  if (dbInstance) return dbInstance;

  SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log(`[SQLite] Loaded existing database from ${DB_PATH}`);
    } catch (err) {
      console.warn(`[SQLite] Failed to load existing file, creating fresh database:`, err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log(`[SQLite] Created fresh SQLite database`);
  }

  // Execute full relational schema
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      institution TEXT,
      research_interests TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      categories_json TEXT NOT NULL,
      year_min INTEGER,
      year_max INTEGER,
      has_labels INTEGER NOT NULL,
      status TEXT NOT NULL,
      is_synthetic INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      dataset_id TEXT,
      title TEXT NOT NULL,
      abstract TEXT NOT NULL,
      publication_year INTEGER,
      category TEXT,
      keywords_json TEXT,
      authors_json TEXT,
      doi TEXT,
      source_url TEXT,
      source_type TEXT DEFAULT 'dataset',
      cleaned_abstract TEXT,
      tokens_json TEXT,
      predicted_category TEXT,
      prediction_confidence REAL,
      topic_id INTEGER,
      topic_label TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_papers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      paper_id TEXT NOT NULL,
      notes TEXT,
      tags_json TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, paper_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      query_text TEXT NOT NULL,
      filters_json TEXT,
      result_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS abstract_predictions (
      id TEXT PRIMARY KEY,
      paper_id TEXT,
      abstract_text TEXT NOT NULL,
      predicted_category TEXT NOT NULL,
      confidence REAL NOT NULL,
      probabilities_json TEXT NOT NULL,
      user_corrected_category TEXT,
      corrected_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (corrected_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS model_evaluations (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      model_type TEXT NOT NULL,
      model_name TEXT NOT NULL,
      train_count INTEGER NOT NULL,
      test_count INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      macro_precision REAL NOT NULL,
      macro_recall REAL NOT NULL,
      macro_f1 REAL NOT NULL,
      weighted_f1 REAL NOT NULL,
      per_class_json TEXT NOT NULL,
      confusion_matrix_json TEXT NOT NULL,
      feature_count INTEGER NOT NULL,
      trained_at TEXT NOT NULL,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discovered_topics (
      id INTEGER,
      dataset_id TEXT NOT NULL,
      label TEXT NOT NULL,
      top_terms_json TEXT NOT NULL,
      paper_count INTEGER NOT NULL,
      percentage REAL NOT NULL,
      year_distribution_json TEXT NOT NULL,
      representative_papers_json TEXT NOT NULL,
      PRIMARY KEY (dataset_id, id),
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trend_analytics (
      dataset_id TEXT PRIMARY KEY,
      years_json TEXT NOT NULL,
      yearly_counts_json TEXT NOT NULL,
      category_growth_json TEXT NOT NULL,
      topic_activity_json TEXT NOT NULL,
      category_totals_json TEXT NOT NULL,
      emerging_candidates_json TEXT NOT NULL,
      formula_details_json TEXT NOT NULL,
      analyzed_at TEXT NOT NULL,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS research_analyses (
      id TEXT PRIMARY KEY,
      paper_id TEXT,
      user_id TEXT,
      summary_json TEXT NOT NULL,
      generated_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dataset_import_jobs (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      total_rows INTEGER NOT NULL,
      imported_rows INTEGER NOT NULL,
      rejected_rows INTEGER NOT NULL,
      error_log_json TEXT,
      status TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_papers_category ON papers(category);
    CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(publication_year);
    CREATE INDEX IF NOT EXISTS idx_saved_papers_user ON saved_papers(user_id);
    CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
  `);

  // Seed default users if table is empty
  seedDefaultUsers(dbInstance);

  // Seed benchmark dataset if datasets table is empty
  const checkStmt = dbInstance.prepare(`SELECT count(*) as cnt FROM datasets`);
  let count = 0;
  if (checkStmt.step()) {
    count = Number(checkStmt.getAsObject().cnt || 0);
  }
  checkStmt.free();

  if (count === 0) {
    seedBenchmarkDataset(dbInstance);
  }

  persistDatabaseToDisk();
  return dbInstance;
}

function seedDefaultUsers(db: Database) {
  const checkStmt = db.prepare(`SELECT count(*) as cnt FROM users`);
  let userCount = 0;
  if (checkStmt.step()) {
    userCount = Number(checkStmt.getAsObject().cnt || 0);
  }
  checkStmt.free();

  if (userCount === 0) {
    console.log(`[SQLite] Seeding default administrator and research scholar users...`);
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, institution, research_interests, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Admin
    insertUser.run([
      'usr-admin-01',
      'admin@researchintel.ai',
      hashPassword('AdminPassword123!'),
      'Dr. Eleanor Vance (System Admin)',
      'admin',
      'Department of Computer Science & AI',
      'Natural Language Processing, Foundation Models, AI Safety',
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    // 2. Demo Scholar
    insertUser.run([
      'usr-scholar-01',
      'scholar@university.edu',
      hashPassword('ScholarPassword123!'),
      'Kaviya R. (Research Scholar)',
      'user',
      'School of Artificial Intelligence & Data Science',
      'Computer Vision, Healthcare AI, Graph Neural Networks',
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    insertUser.free();
  }
}

function seedBenchmarkDataset(db: Database) {
  const defaultDatasetId = 'sample-benchmark-corpus';
  const raw = SYNTHETIC_RESEARCH_PAPERS;
  const preprocessed = preprocessDataset(raw, DEFAULT_PREPROCESSING_CONFIG);

  const tokens = preprocessed.map(p => p.tokens || []);
  const tfidf = fitTfidf(tokens, DEFAULT_TFIDF_CONFIG);
  const topicResult = runKMeansClustering(preprocessed, tfidf, 5);

  const classResult = trainAndEvaluateClassifier(
    topicResult.updatedPapers,
    'multinomial_nb',
    DEFAULT_TFIDF_CONFIG,
    0.75
  );

  const trendResult = computeTrendAnalytics(classResult.updatedPapers, topicResult.topics);
  const categories = Array.from(new Set(raw.map(p => p.category))).sort();

  const insertDatasetStmt = db.prepare(`
    INSERT INTO datasets (id, name, filename, record_count, categories_json, year_min, year_max, has_labels, status, is_synthetic, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDatasetStmt.run([
    defaultDatasetId,
    'Benchmark AI & DS Research Corpus',
    'synthetic_research_benchmark.csv',
    raw.length,
    JSON.stringify(categories),
    2019,
    2026,
    1,
    'analyzed',
    1,
    new Date().toISOString()
  ]);
  insertDatasetStmt.free();

  const insertPaperStmt = db.prepare(`
    INSERT INTO papers (id, dataset_id, title, abstract, publication_year, category, keywords_json, authors_json, doi, source_url, source_type, cleaned_abstract, tokens_json, predicted_category, prediction_confidence, topic_id, topic_label, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  classResult.updatedPapers.forEach(p => {
    insertPaperStmt.run([
      p.id,
      defaultDatasetId,
      p.title,
      p.abstract,
      p.publication_year,
      p.category,
      JSON.stringify(p.keywords || []),
      JSON.stringify(p.authors || []),
      p.doi || null,
      p.source_url || null,
      'dataset',
      p.cleaned_abstract || null,
      JSON.stringify(p.tokens || []),
      p.predicted_category || null,
      p.prediction_confidence || null,
      p.topic_id || null,
      p.topic_label || null,
      'usr-admin-01',
      new Date().toISOString()
    ]);
  });
  insertPaperStmt.free();

  const insertEvalStmt = db.prepare(`
    INSERT INTO model_evaluations (id, dataset_id, model_type, model_name, train_count, test_count, accuracy, macro_precision, macro_recall, macro_f1, weighted_f1, per_class_json, confusion_matrix_json, feature_count, trained_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEvalStmt.run([
    `eval-${Date.now()}`,
    defaultDatasetId,
    classResult.evaluation.modelType,
    classResult.evaluation.modelName,
    classResult.evaluation.trainCount,
    classResult.evaluation.testCount,
    classResult.evaluation.accuracy,
    classResult.evaluation.macroPrecision,
    classResult.evaluation.macroRecall,
    classResult.evaluation.macroF1,
    classResult.evaluation.weightedF1,
    JSON.stringify(classResult.evaluation.perClass),
    JSON.stringify(classResult.evaluation.confusionMatrix),
    classResult.evaluation.featureCount,
    classResult.evaluation.trainedAt
  ]);
  insertEvalStmt.free();

  const insertTopicStmt = db.prepare(`
    INSERT INTO discovered_topics (id, dataset_id, label, top_terms_json, paper_count, percentage, year_distribution_json, representative_papers_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  topicResult.topics.forEach(t => {
    insertTopicStmt.run([
      t.id,
      defaultDatasetId,
      t.label,
      JSON.stringify(t.topTerms),
      t.paperCount,
      t.percentage,
      JSON.stringify(t.yearDistribution),
      JSON.stringify(t.representativePapers)
    ]);
  });
  insertTopicStmt.free();

  const insertTrendStmt = db.prepare(`
    INSERT INTO trend_analytics (dataset_id, years_json, yearly_counts_json, category_growth_json, topic_activity_json, category_totals_json, emerging_candidates_json, formula_details_json, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTrendStmt.run([
    defaultDatasetId,
    JSON.stringify(trendResult.years),
    JSON.stringify(trendResult.yearlyPublicationCounts),
    JSON.stringify(trendResult.categoryGrowthOverTime),
    JSON.stringify(trendResult.topicActivityOverTime),
    JSON.stringify(trendResult.categoryTotals),
    JSON.stringify(trendResult.emergingCandidates),
    JSON.stringify(trendResult.formulaDetails),
    new Date().toISOString()
  ]);
  insertTrendStmt.free();
}

// ==================== USER & AUTH DATABASE METHODS ====================

export function getUserByEmail(email: string): (User & { password_hash: string }) | null {
  if (!dbInstance) return null;
  const stmt = dbInstance.prepare(`SELECT * FROM users WHERE lower(email) = lower(?)`);
  stmt.bind([email.trim()]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return {
    id: String(row.id),
    email: String(row.email),
    password_hash: String(row.password_hash),
    full_name: String(row.full_name),
    role: String(row.role) as 'user' | 'admin',
    institution: row.institution ? String(row.institution) : undefined,
    research_interests: row.research_interests ? String(row.research_interests) : undefined,
    created_at: String(row.created_at),
    updated_at: row.updated_at ? String(row.updated_at) : undefined
  };
}

export function getUserById(id: string): User | null {
  if (!dbInstance) return null;
  const stmt = dbInstance.prepare(`SELECT id, email, full_name, role, institution, research_interests, created_at, updated_at FROM users WHERE id = ?`);
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return {
    id: String(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    role: String(row.role) as 'user' | 'admin',
    institution: row.institution ? String(row.institution) : undefined,
    research_interests: row.research_interests ? String(row.research_interests) : undefined,
    created_at: String(row.created_at),
    updated_at: row.updated_at ? String(row.updated_at) : undefined
  };
}

export function createUser(data: {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: 'user' | 'admin';
  institution?: string;
  researchInterests?: string;
}): User {
  if (!dbInstance) throw new Error('Database not initialized');
  const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const role = data.role || 'user';

  const stmt = dbInstance.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, institution, research_interests, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    id,
    data.email.toLowerCase().trim(),
    data.passwordHash,
    data.fullName.trim(),
    role,
    data.institution || null,
    data.researchInterests || null,
    now,
    now
  ]);
  stmt.free();
  persistDatabaseToDisk();

  return {
    id,
    email: data.email.toLowerCase().trim(),
    full_name: data.fullName.trim(),
    role,
    institution: data.institution,
    research_interests: data.researchInterests,
    created_at: now,
    updated_at: now
  };
}

export function updateUserProfile(id: string, data: { fullName?: string; institution?: string; researchInterests?: string }): User | null {
  if (!dbInstance) return null;
  const user = getUserById(id);
  if (!user) return null;

  const fullName = data.fullName !== undefined ? data.fullName : user.full_name;
  const institution = data.institution !== undefined ? data.institution : (user.institution || null);
  const researchInterests = data.researchInterests !== undefined ? data.researchInterests : (user.research_interests || null);
  const now = new Date().toISOString();

  const stmt = dbInstance.prepare(`
    UPDATE users SET full_name = ?, institution = ?, research_interests = ?, updated_at = ? WHERE id = ?
  `);
  stmt.run([fullName, institution, researchInterests, now, id]);
  stmt.free();
  persistDatabaseToDisk();

  return getUserById(id);
}

// ==================== SAVED PAPERS / PERSONAL RESEARCH LIBRARY ====================

export function savePaperForUser(userId: string, paperId: string, notes = '', tags: string[] = []): SavedPaperRecord {
  if (!dbInstance) throw new Error('Database not initialized');
  const id = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const stmt = dbInstance.prepare(`
    INSERT OR REPLACE INTO saved_papers (id, user_id, paper_id, notes, tags_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([id, userId, paperId, notes, JSON.stringify(tags), now]);
  stmt.free();
  persistDatabaseToDisk();

  return { id, user_id: userId, paper_id: paperId, notes, tags, created_at: now };
}

export function removeSavedPaper(userId: string, paperId: string): boolean {
  if (!dbInstance) return false;
  dbInstance.run(`DELETE FROM saved_papers WHERE user_id = ? AND paper_id = ?`, [userId, paperId]);
  persistDatabaseToDisk();
  return true;
}

export function getSavedPapersForUser(userId: string): (SavedPaperRecord & { paper: ResearchPaper })[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare(`
    SELECT s.id as saved_id, s.user_id, s.paper_id, s.notes, s.tags_json, s.created_at as saved_at,
           p.*
    FROM saved_papers s
    JOIN papers p ON s.paper_id = p.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `);
  stmt.bind([userId]);

  const results: (SavedPaperRecord & { paper: ResearchPaper })[] = [];
  while (stmt.step()) {
    const r = stmt.getAsObject();
    const paper: ResearchPaper = {
      id: String(r.id),
      dataset_id: r.dataset_id ? String(r.dataset_id) : undefined,
      title: String(r.title),
      abstract: String(r.abstract),
      publication_year: Number(r.publication_year || 2024),
      category: String(r.category || 'Uncategorized'),
      keywords: JSON.parse(String(r.keywords_json || '[]')),
      authors: JSON.parse(String(r.authors_json || '[]')),
      doi: r.doi ? String(r.doi) : undefined,
      source_url: r.source_url ? String(r.source_url) : undefined,
      source_type: (r.source_type || 'dataset') as any,
      cleaned_abstract: r.cleaned_abstract ? String(r.cleaned_abstract) : undefined,
      predicted_category: r.predicted_category ? String(r.predicted_category) : undefined,
      prediction_confidence: r.prediction_confidence !== null ? Number(r.prediction_confidence) : undefined,
      topic_id: r.topic_id !== null ? Number(r.topic_id) : undefined,
      topic_label: r.topic_label ? String(r.topic_label) : undefined
    };

    results.push({
      id: String(r.saved_id),
      user_id: String(r.user_id),
      paper_id: String(r.paper_id),
      notes: r.notes ? String(r.notes) : undefined,
      tags: JSON.parse(String(r.tags_json || '[]')),
      created_at: String(r.saved_at),
      paper
    });
  }
  stmt.free();
  return results;
}

// ==================== SEARCH HISTORY ====================

export function logSearchHistory(userId: string, queryText: string, filters: any, resultCount: number): void {
  if (!dbInstance) return;
  const id = `srch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stmt = dbInstance.prepare(`
    INSERT INTO search_history (id, user_id, query_text, filters_json, result_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([id, userId, queryText, JSON.stringify(filters || {}), resultCount, new Date().toISOString()]);
  stmt.free();
  persistDatabaseToDisk();
}

export function getSearchHistoryForUser(userId: string, limit = 20): SearchHistoryRecord[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare(`
    SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
  `);
  stmt.bind([userId, limit]);
  const results: SearchHistoryRecord[] = [];
  while (stmt.step()) {
    const r = stmt.getAsObject();
    results.push({
      id: String(r.id),
      user_id: String(r.user_id),
      query_text: String(r.query_text),
      filters: JSON.parse(String(r.filters_json || '{}')),
      result_count: Number(r.result_count || 0),
      created_at: String(r.created_at)
    });
  }
  stmt.free();
  return results;
}

export function clearSearchHistoryForUser(userId: string): boolean {
  if (!dbInstance) return false;
  dbInstance.run(`DELETE FROM search_history WHERE user_id = ?`, [userId]);
  persistDatabaseToDisk();
  return true;
}

// ==================== SMART SEARCH & SIMILARITY ====================

export function searchPapersInSqlite(options: {
  query?: string;
  category?: string;
  yearMin?: number;
  yearMax?: number;
  sourceType?: string;
  sortBy?: 'relevance' | 'year_desc' | 'year_asc' | 'title';
  limit?: number;
  offset?: number;
}): { papers: ResearchPaper[]; totalCount: number } {
  if (!dbInstance) return { papers: [], totalCount: 0 };

  const whereClauses: string[] = ['1=1'];
  const params: any[] = [];

  if (options.query && options.query.trim()) {
    const q = `%${options.query.trim()}%`;
    whereClauses.push(`(title LIKE ? OR abstract LIKE ? OR authors_json LIKE ? OR keywords_json LIKE ?)`);
    params.push(q, q, q, q);
  }

  if (options.category && options.category !== 'ALL') {
    whereClauses.push(`category = ?`);
    params.push(options.category);
  }

  if (options.yearMin) {
    whereClauses.push(`publication_year >= ?`);
    params.push(options.yearMin);
  }

  if (options.yearMax) {
    whereClauses.push(`publication_year <= ?`);
    params.push(options.yearMax);
  }

  if (options.sourceType && options.sourceType !== 'ALL') {
    whereClauses.push(`source_type = ?`);
    params.push(options.sourceType);
  }

  const whereSql = whereClauses.join(' AND ');

  // Count total matching
  const countStmt = dbInstance.prepare(`SELECT count(*) as total FROM papers WHERE ${whereSql}`);
  countStmt.bind(params);
  let totalCount = 0;
  if (countStmt.step()) {
    totalCount = Number(countStmt.getAsObject().total || 0);
  }
  countStmt.free();

  // Order
  let orderSql = 'publication_year DESC';
  if (options.sortBy === 'year_asc') orderSql = 'publication_year ASC';
  if (options.sortBy === 'title') orderSql = 'title ASC';

  const limit = options.limit || 20;
  const offset = options.offset || 0;

  const dataStmt = dbInstance.prepare(`
    SELECT * FROM papers WHERE ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?
  `);
  dataStmt.bind([...params, limit, offset]);

  const papers: ResearchPaper[] = [];
  while (dataStmt.step()) {
    const r = dataStmt.getAsObject();
    papers.push({
      id: String(r.id),
      dataset_id: r.dataset_id ? String(r.dataset_id) : undefined,
      title: String(r.title),
      abstract: String(r.abstract),
      publication_year: Number(r.publication_year || 2024),
      category: String(r.category || 'Uncategorized'),
      keywords: JSON.parse(String(r.keywords_json || '[]')),
      authors: JSON.parse(String(r.authors_json || '[]')),
      doi: r.doi ? String(r.doi) : undefined,
      source_url: r.source_url ? String(r.source_url) : undefined,
      source_type: (r.source_type || 'dataset') as any,
      cleaned_abstract: r.cleaned_abstract ? String(r.cleaned_abstract) : undefined,
      predicted_category: r.predicted_category ? String(r.predicted_category) : undefined,
      prediction_confidence: r.prediction_confidence !== null ? Number(r.prediction_confidence) : undefined,
      topic_id: r.topic_id !== null ? Number(r.topic_id) : undefined,
      topic_label: r.topic_label ? String(r.topic_label) : undefined
    });
  }
  dataStmt.free();

  return { papers, totalCount };
}

export function findSimilarPapersInSqlite(targetPaperId: string, limit = 5): ResearchPaper[] {
  if (!dbInstance) return [];

  const targetStmt = dbInstance.prepare(`SELECT * FROM papers WHERE id = ?`);
  targetStmt.bind([targetPaperId]);
  if (!targetStmt.step()) {
    targetStmt.free();
    return [];
  }
  const targetRow = targetStmt.getAsObject();
  targetStmt.free();

  const targetTokens = targetRow.tokens_json ? JSON.parse(String(targetRow.tokens_json)) : [];
  const targetKeywords = targetRow.keywords_json ? JSON.parse(String(targetRow.keywords_json)) : [];
  const targetCategory = String(targetRow.category || '');

  // Retrieve candidate papers
  const allStmt = dbInstance.prepare(`SELECT * FROM papers WHERE id != ? LIMIT 200`);
  allStmt.bind([targetPaperId]);

  const scored: { paper: ResearchPaper; score: number }[] = [];

  while (allStmt.step()) {
    const r = allStmt.getAsObject();
    const tokens = r.tokens_json ? JSON.parse(String(r.tokens_json)) : [];
    const keywords = r.keywords_json ? JSON.parse(String(r.keywords_json)) : [];
    const category = String(r.category || '');

    // Jaccard similarity on tokens & keywords
    const setA = new Set([...targetTokens, ...targetKeywords]);
    const setB = new Set([...tokens, ...keywords]);

    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    let jaccard = union > 0 ? intersection / union : 0;

    if (category === targetCategory && category !== '') {
      jaccard += 0.2; // Domain boost
    }

    scored.push({
      paper: {
        id: String(r.id),
        title: String(r.title),
        abstract: String(r.abstract),
        publication_year: Number(r.publication_year || 2024),
        category,
        keywords,
        authors: JSON.parse(String(r.authors_json || '[]')),
        doi: r.doi ? String(r.doi) : undefined,
        source_url: r.source_url ? String(r.source_url) : undefined,
        similarityScore: Math.round(Math.min(0.99, jaccard) * 100) / 100
      },
      score: jaccard
    });
  }
  allStmt.free();

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => ({ ...s.paper, similarityScore: Math.max(0.35, s.paper.similarityScore || 0.4) }));
}

// ==================== ABSTRACT PREDICTIONS & CORRECTIONS ====================

export function logAbstractPrediction(data: {
  paperId?: string;
  abstractText: string;
  predictedCategory: string;
  confidence: number;
  probabilities: Record<string, number>;
}): string {
  if (!dbInstance) return '';
  const id = `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stmt = dbInstance.prepare(`
    INSERT INTO abstract_predictions (id, paper_id, abstract_text, predicted_category, confidence, probabilities_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    id,
    data.paperId || null,
    data.abstractText,
    data.predictedCategory,
    data.confidence,
    JSON.stringify(data.probabilities),
    new Date().toISOString()
  ]);
  stmt.free();
  persistDatabaseToDisk();
  return id;
}

export function saveUserPredictionCorrection(predictionId: string, correctedCategory: string, userId?: string): boolean {
  if (!dbInstance) return false;
  const stmt = dbInstance.prepare(`
    UPDATE abstract_predictions SET user_corrected_category = ?, corrected_by = ? WHERE id = ?
  `);
  stmt.run([correctedCategory, userId || null, predictionId]);
  stmt.free();
  persistDatabaseToDisk();
  return true;
}

// ==================== INSERT USER PAPER (PDF / MANUAL) ====================

export function insertSinglePaper(paper: Omit<ResearchPaper, 'id'>, userId?: string): ResearchPaper {
  if (!dbInstance) throw new Error('Database not initialized');
  const id = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const stmt = dbInstance.prepare(`
    INSERT INTO papers (id, dataset_id, title, abstract, publication_year, category, keywords_json, authors_json, doi, source_url, source_type, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    id,
    paper.dataset_id || 'user-library',
    paper.title,
    paper.abstract,
    paper.publication_year || 2024,
    paper.category || 'Other / Uncertain',
    JSON.stringify(paper.keywords || []),
    JSON.stringify(paper.authors || []),
    paper.doi || null,
    paper.source_url || null,
    paper.source_type || 'manual',
    userId || null,
    now
  ]);
  stmt.free();
  persistDatabaseToDisk();

  return {
    ...paper,
    id,
    created_at: now
  };
}

// ==================== RESEARCH ANALYSES / SUMMARIES ====================

export function saveResearchSummary(paperId: string | null, summary: StructuredPaperSummary, userId?: string): void {
  if (!dbInstance) return;
  const id = `sum-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stmt = dbInstance.prepare(`
    INSERT INTO research_analyses (id, paper_id, user_id, summary_json, generated_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([id, paperId, userId || null, JSON.stringify(summary), summary.generatedBy, new Date().toISOString()]);
  stmt.free();
  persistDatabaseToDisk();
}

// Re-export standard helpers
export {
  getDatasetsFromSqlite,
  getDatasetBundleFromSqlite,
  insertDatasetIntoSqlite,
  updatePapersInSqlite,
  saveEvaluationToSqlite,
  saveTopicsAndTrendsToSqlite,
  deleteDatasetFromSqlite,
  executeRawSql,
  getSqliteDbStats
} from './sqliteDatabaseCore.ts';
