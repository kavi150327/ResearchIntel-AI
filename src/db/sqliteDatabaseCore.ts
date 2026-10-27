import fs from 'fs';
import path from 'path';
import { Database } from 'sql.js';
import {
  DatasetMeta,
  DiscoveredTopic,
  EvaluationResults,
  ResearchPaper,
  TrendAnalysisResult,
  ValidationSummary
} from '../types/index.ts';
import { validateDataset } from '../services/dataService.ts';
import { getDbInstance, persistDatabaseToDisk } from './sqliteDatabase.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'research_intelligence.sqlite');

/**
 * Get all datasets from SQLite database
 */
export function getDatasetsFromSqlite(): DatasetMeta[] {
  const db = getDbInstance();
  if (!db) return [];

  const stmt = db.prepare(`SELECT * FROM datasets ORDER BY uploaded_at DESC`);
  const datasets: DatasetMeta[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    datasets.push({
      id: String(row.id),
      name: String(row.name),
      filename: String(row.filename),
      recordCount: Number(row.record_count),
      categories: JSON.parse(String(row.categories_json || '[]')),
      yearRange: [Number(row.year_min || 2019), Number(row.year_max || 2026)],
      hasLabels: Boolean(row.has_labels),
      uploadedAt: String(row.uploaded_at),
      status: String(row.status) as any,
      isSyntheticSample: Boolean(row.is_synthetic)
    });
  }
  stmt.free();
  return datasets;
}

/**
 * Get complete dataset bundle (meta, papers, validation, evaluation, topics, trends) by ID
 */
export function getDatasetBundleFromSqlite(datasetId: string): {
  meta: DatasetMeta;
  papers: ResearchPaper[];
  validation: ValidationSummary;
  evaluation: EvaluationResults | null;
  topics: DiscoveredTopic[];
  trends: TrendAnalysisResult | null;
} | null {
  const db = getDbInstance();
  if (!db) return null;

  // 1. Dataset metadata
  const metaStmt = db.prepare(`SELECT * FROM datasets WHERE id = ?`);
  metaStmt.bind([datasetId]);
  if (!metaStmt.step()) {
    metaStmt.free();
    return null;
  }
  const metaRow = metaStmt.getAsObject();
  metaStmt.free();

  const meta: DatasetMeta = {
    id: String(metaRow.id),
    name: String(metaRow.name),
    filename: String(metaRow.filename),
    recordCount: Number(metaRow.record_count),
    categories: JSON.parse(String(metaRow.categories_json || '[]')),
    yearRange: [Number(metaRow.year_min || 2019), Number(metaRow.year_max || 2026)],
    hasLabels: Boolean(metaRow.has_labels),
    uploadedAt: String(metaRow.uploaded_at),
    status: String(metaRow.status) as any,
    isSyntheticSample: Boolean(metaRow.is_synthetic)
  };

  // 2. Papers
  const papersStmt = db.prepare(`SELECT * FROM papers WHERE dataset_id = ? ORDER BY publication_year DESC`);
  papersStmt.bind([datasetId]);
  const papers: ResearchPaper[] = [];

  while (papersStmt.step()) {
    const r = papersStmt.getAsObject();
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
      tokens: r.tokens_json ? JSON.parse(String(r.tokens_json)) : undefined,
      predicted_category: r.predicted_category ? String(r.predicted_category) : undefined,
      prediction_confidence: r.prediction_confidence !== null ? Number(r.prediction_confidence) : undefined,
      topic_id: r.topic_id !== null ? Number(r.topic_id) : undefined,
      topic_label: r.topic_label ? String(r.topic_label) : undefined
    });
  }
  papersStmt.free();

  // 3. Validation
  const validation = validateDataset(papers);

  // 4. Evaluation
  let evaluation: EvaluationResults | null = null;
  const evalStmt = db.prepare(`SELECT * FROM model_evaluations WHERE dataset_id = ? ORDER BY trained_at DESC LIMIT 1`);
  evalStmt.bind([datasetId]);
  if (evalStmt.step()) {
    const ev = evalStmt.getAsObject();
    evaluation = {
      modelType: String(ev.model_type) as any,
      modelName: String(ev.model_name),
      trainCount: Number(ev.train_count),
      testCount: Number(ev.test_count),
      accuracy: Number(ev.accuracy),
      macroPrecision: Number(ev.macro_precision),
      macroRecall: Number(ev.macro_recall),
      macroF1: Number(ev.macro_f1),
      weightedF1: Number(ev.weighted_f1),
      perClass: JSON.parse(String(ev.per_class_json || '{}')),
      confusionMatrix: JSON.parse(String(ev.confusion_matrix_json || '{"labels":[],"matrix":[]}')),
      featureCount: Number(ev.feature_count),
      trainedAt: String(ev.trained_at),
      vocabularySample: []
    };
  }
  evalStmt.free();

  // 5. Topics
  const topicStmt = db.prepare(`SELECT * FROM discovered_topics WHERE dataset_id = ? ORDER BY id ASC`);
  topicStmt.bind([datasetId]);
  const topics: DiscoveredTopic[] = [];
  while (topicStmt.step()) {
    const t = topicStmt.getAsObject();
    topics.push({
      id: Number(t.id),
      label: String(t.label),
      topTerms: JSON.parse(String(t.top_terms_json || '[]')),
      paperCount: Number(t.paper_count),
      percentage: Number(t.percentage),
      yearDistribution: JSON.parse(String(t.year_distribution_json || '{}')),
      representativePapers: JSON.parse(String(t.representative_papers_json || '[]'))
    });
  }
  topicStmt.free();

  // 6. Trends
  let trends: TrendAnalysisResult | null = null;
  const trendStmt = db.prepare(`SELECT * FROM trend_analytics WHERE dataset_id = ? LIMIT 1`);
  trendStmt.bind([datasetId]);
  if (trendStmt.step()) {
    const tr = trendStmt.getAsObject();
    trends = {
      years: JSON.parse(String(tr.years_json || '[]')),
      yearlyPublicationCounts: JSON.parse(String(tr.yearly_counts_json || '[]')),
      categoryGrowthOverTime: JSON.parse(String(tr.category_growth_json || '[]')),
      topicActivityOverTime: JSON.parse(String(tr.topic_activity_json || '[]')),
      categoryTotals: JSON.parse(String(tr.category_totals_json || '[]')),
      emergingCandidates: JSON.parse(String(tr.emerging_candidates_json || '[]')),
      formulaDetails: JSON.parse(String(tr.formula_details_json || '{}'))
    };
  }
  trendStmt.free();

  return { meta, papers, validation, evaluation, topics, trends };
}

/**
 * Insert new dataset and all associated papers into SQLite
 */
export function insertDatasetIntoSqlite(meta: DatasetMeta, papers: ResearchPaper[]): void {
  const db = getDbInstance();
  if (!db) throw new Error('SQLite database not initialized');

  const insertMeta = db.prepare(`
    INSERT INTO datasets (id, name, filename, record_count, categories_json, year_min, year_max, has_labels, status, is_synthetic, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMeta.run([
    meta.id,
    meta.name,
    meta.filename,
    meta.recordCount,
    JSON.stringify(meta.categories),
    meta.yearRange[0],
    meta.yearRange[1],
    meta.hasLabels ? 1 : 0,
    meta.status,
    meta.isSyntheticSample ? 1 : 0,
    meta.uploadedAt
  ]);
  insertMeta.free();

  const insertPaper = db.prepare(`
    INSERT INTO papers (id, dataset_id, title, abstract, publication_year, category, keywords_json, authors_json, doi, source_url, source_type, cleaned_abstract, tokens_json, predicted_category, prediction_confidence, topic_id, topic_label, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  papers.forEach(p => {
    insertPaper.run([
      p.id,
      meta.id,
      p.title,
      p.abstract,
      p.publication_year || 2024,
      p.category || 'Other / Uncertain',
      JSON.stringify(p.keywords || []),
      JSON.stringify(p.authors || []),
      p.doi || null,
      p.source_url || null,
      p.source_type || 'dataset',
      p.cleaned_abstract || null,
      JSON.stringify(p.tokens || []),
      p.predicted_category || null,
      p.prediction_confidence !== undefined ? p.prediction_confidence : null,
      p.topic_id !== undefined ? p.topic_id : null,
      p.topic_label || null,
      new Date().toISOString()
    ]);
  });
  insertPaper.free();

  persistDatabaseToDisk();
}

/**
 * Update papers in SQLite (tokens, cleaned abstracts, predictions, topics)
 */
export function updatePapersInSqlite(datasetId: string, papers: ResearchPaper[]): void {
  const db = getDbInstance();
  if (!db) return;

  const updateStmt = db.prepare(`
    UPDATE papers SET
      cleaned_abstract = ?,
      tokens_json = ?,
      predicted_category = ?,
      prediction_confidence = ?,
      topic_id = ?,
      topic_label = ?
    WHERE id = ?
  `);

  papers.forEach(p => {
    updateStmt.run([
      p.cleaned_abstract || null,
      JSON.stringify(p.tokens || []),
      p.predicted_category || null,
      p.prediction_confidence !== undefined ? p.prediction_confidence : null,
      p.topic_id !== undefined ? p.topic_id : null,
      p.topic_label || null,
      p.id
    ]);
  });
  updateStmt.free();

  // Update dataset status if preprocessed
  db.run(`UPDATE datasets SET status = 'preprocessed' WHERE id = ? AND status = 'raw'`, [datasetId]);
  persistDatabaseToDisk();
}

/**
 * Save evaluation results to SQLite
 */
export function saveEvaluationToSqlite(datasetId: string, evaluation: EvaluationResults): void {
  const db = getDbInstance();
  if (!db) return;

  const evalId = `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stmt = db.prepare(`
    INSERT INTO model_evaluations (id, dataset_id, model_type, model_name, train_count, test_count, accuracy, macro_precision, macro_recall, macro_f1, weighted_f1, per_class_json, confusion_matrix_json, feature_count, trained_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    evalId,
    datasetId,
    evaluation.modelType,
    evaluation.modelName,
    evaluation.trainCount,
    evaluation.testCount,
    evaluation.accuracy,
    evaluation.macroPrecision,
    evaluation.macroRecall,
    evaluation.macroF1,
    evaluation.weightedF1,
    JSON.stringify(evaluation.perClass),
    JSON.stringify(evaluation.confusionMatrix),
    evaluation.featureCount,
    evaluation.trainedAt
  ]);
  stmt.free();

  db.run(`UPDATE datasets SET status = 'trained' WHERE id = ?`, [datasetId]);
  persistDatabaseToDisk();
}

/**
 * Save topics and trends to SQLite
 */
export function saveTopicsAndTrendsToSqlite(
  datasetId: string,
  topics: DiscoveredTopic[],
  trends: TrendAnalysisResult
): void {
  const db = getDbInstance();
  if (!db) return;

  // Clear existing topics for dataset
  db.run(`DELETE FROM discovered_topics WHERE dataset_id = ?`, [datasetId]);

  const insertTopic = db.prepare(`
    INSERT INTO discovered_topics (id, dataset_id, label, top_terms_json, paper_count, percentage, year_distribution_json, representative_papers_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  topics.forEach(t => {
    insertTopic.run([
      t.id,
      datasetId,
      t.label,
      JSON.stringify(t.topTerms),
      t.paperCount,
      t.percentage,
      JSON.stringify(t.yearDistribution),
      JSON.stringify(t.representativePapers)
    ]);
  });
  insertTopic.free();

  // Insert or replace trends
  const insertTrends = db.prepare(`
    INSERT OR REPLACE INTO trend_analytics (dataset_id, years_json, yearly_counts_json, category_growth_json, topic_activity_json, category_totals_json, emerging_candidates_json, formula_details_json, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrends.run([
    datasetId,
    JSON.stringify(trends.years),
    JSON.stringify(trends.yearlyPublicationCounts),
    JSON.stringify(trends.categoryGrowthOverTime),
    JSON.stringify(trends.topicActivityOverTime),
    JSON.stringify(trends.categoryTotals),
    JSON.stringify(trends.emergingCandidates),
    JSON.stringify(trends.formulaDetails),
    new Date().toISOString()
  ]);
  insertTrends.free();

  db.run(`UPDATE datasets SET status = 'analyzed' WHERE id = ?`, [datasetId]);
  persistDatabaseToDisk();
}

/**
 * Delete a dataset and cascade its papers, evaluations, topics, and trends
 */
export function deleteDatasetFromSqlite(datasetId: string): boolean {
  const db = getDbInstance();
  if (!db) return false;

  db.run(`DELETE FROM papers WHERE dataset_id = ?`, [datasetId]);
  db.run(`DELETE FROM model_evaluations WHERE dataset_id = ?`, [datasetId]);
  db.run(`DELETE FROM discovered_topics WHERE dataset_id = ?`, [datasetId]);
  db.run(`DELETE FROM trend_analytics WHERE dataset_id = ?`, [datasetId]);
  db.run(`DELETE FROM datasets WHERE id = ?`, [datasetId]);

  persistDatabaseToDisk();
  return true;
}

/**
 * Execute raw SQL query against SQLite database
 */
export function executeRawSql(sql: string): { columns: string[]; values: any[][] }[] {
  const db = getDbInstance();
  if (!db) throw new Error('Database not initialized');
  return db.exec(sql);
}

/**
 * Retrieve database stats and table row counts
 */
export function getSqliteDbStats(): {
  filePath: string;
  fileSizeBytes: number;
  tables: { name: string; rowCount: number }[];
} {
  const db = getDbInstance();
  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(DB_PATH)) {
      fileSizeBytes = fs.statSync(DB_PATH).size;
    }
  } catch (e) {
    console.error('Failed to get file stats:', e);
  }

  const tableNames = [
    'users',
    'datasets',
    'papers',
    'saved_papers',
    'search_history',
    'abstract_predictions',
    'model_evaluations',
    'discovered_topics',
    'trend_analytics',
    'research_analyses'
  ];

  const tables: { name: string; rowCount: number }[] = [];

  if (db) {
    for (const tbl of tableNames) {
      try {
        const stmt = db.prepare(`SELECT count(*) as cnt FROM ${tbl}`);
        if (stmt.step()) {
          tables.push({ name: tbl, rowCount: Number(stmt.getAsObject().cnt || 0) });
        }
        stmt.free();
      } catch {
        tables.push({ name: tbl, rowCount: 0 });
      }
    }
  }

  return {
    filePath: DB_PATH,
    fileSizeBytes,
    tables
  };
}
