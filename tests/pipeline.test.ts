/**
 * Unit & Integration Tests for Research Intelligence Platform
 * Covers: CSV/JSON parsing, duplicate detection, NLP normalization,
 * TF-IDF vectorization, Supervised ML (NB, Logistic, SVM),
 * K-Means Topic Discovery, Trend Velocity & Emerging Score formulas.
 */

import { parseCsv, parseJson, validateDataset, autoDetectColumnMapping, convertToResearchPapers } from '../src/services/dataService.ts';
import { preprocessText, inspectPreprocessingPipeline, DEFAULT_PREPROCESSING_CONFIG } from '../src/services/nlpEngine.ts';
import { fitTfidf, transformTfidf, trainAndEvaluateClassifier, DEFAULT_TFIDF_CONFIG } from '../src/services/mlEngine.ts';
import { runKMeansClustering } from '../src/services/topicEngine.ts';
import { computeTrendAnalytics } from '../src/services/trendEngine.ts';
import { SYNTHETIC_RESEARCH_PAPERS } from '../src/data/sampleDataset.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('--- 1. Testing CSV & JSON Parsing ---');
const sampleCsv = `title,abstract,publication_year,category\n"Deep Learning in NLP","Transformers are efficient for sequence processing.",2023,"NLP"`;
const parsedCsv = parseCsv(sampleCsv);
assert(parsedCsv.headers.length === 4, 'CSV parsed headers correctly');
assert(parsedCsv.rows.length === 1, 'CSV parsed rows correctly');
assert(parsedCsv.rows[0][0] === 'Deep Learning in NLP', 'CSV preserved quoted title string');

const sampleJson = `[{"title": "Vision Transformer", "abstract": "Self-attention for images.", "publication_year": 2022, "category": "CV"}]`;
const parsedJson = parseJson(sampleJson);
assert(parsedJson.length === 1, 'JSON parsed records array');

console.log('\n--- 2. Testing Data Validation & Duplicate Detection ---');
const testPapers = [
  { id: '1', title: 'Paper A', abstract: 'Short', publication_year: 2024, category: 'AI', keywords: [], authors: [] },
  { id: '2', title: 'Paper A', abstract: 'Duplicate title with different body.', publication_year: 2024, category: 'AI', keywords: [], authors: [] },
  { id: '3', title: 'Paper C', abstract: '', publication_year: 1800, category: 'AI', keywords: [], authors: [] }
];
const valResult = validateDataset(testPapers);
assert(valResult.duplicateCount === 1, 'Detected 1 duplicate title');
assert(valResult.missingAbstractCount === 1, 'Detected 1 missing abstract');
assert(valResult.invalidYearCount === 1, 'Detected 1 out-of-range publication year');

console.log('\n--- 3. Testing NLP Text Preprocessing ---');
const rawText = "We don't propose state-of-the-art zero-shot classifiers; we demonstrate novel evaluation results.";
const nlpRes = preprocessText(rawText, DEFAULT_PREPROCESSING_CONFIG);
assert(!nlpRes.tokens.includes("don't"), "Contraction 'don't' expanded & filtered");
assert(nlpRes.tokens.includes("zero-shot"), "Preserved scientific compound 'zero-shot'");
assert(!nlpRes.tokens.includes("propose"), "Academic discourse stopword 'propose' removed");

const inspection = inspectPreprocessingPipeline(rawText, DEFAULT_PREPROCESSING_CONFIG);
assert(inspection.steps.length === 5, 'Inspection returns all 5 sequential pipeline transformation stages');

console.log('\n--- 4. Testing TF-IDF Feature Extraction ---');
const corpus = SYNTHETIC_RESEARCH_PAPERS.slice(0, 16);
const preprocessedTokens = corpus.map(p => preprocessText(p.abstract, DEFAULT_PREPROCESSING_CONFIG).tokens);
const tfidf = fitTfidf(preprocessedTokens, DEFAULT_TFIDF_CONFIG);
assert(tfidf.featureNames.length > 20, 'Fitted non-empty TF-IDF vocabulary');

const sampleVec = transformTfidf(preprocessedTokens[0], tfidf);
let normSq = 0;
for (let i = 0; i < sampleVec.vector.length; i++) {
  normSq += sampleVec.vector[i] * sampleVec.vector[i];
}
assert(Math.abs(normSq - 1.0) < 0.05, 'TF-IDF vector is L2 normalized to unit norm');

console.log('\n--- 5. Testing Supervised Classifiers & Evaluation Metrics ---');
const fullCorpus = SYNTHETIC_RESEARCH_PAPERS.map(p => ({
  ...p,
  tokens: preprocessText(`${p.title} ${p.abstract} ${(p.keywords || []).join(' ')}`, DEFAULT_PREPROCESSING_CONFIG).tokens
}));

const nbResult = trainAndEvaluateClassifier(fullCorpus, 'multinomial_nb', DEFAULT_TFIDF_CONFIG, 0.75);
assert(nbResult.evaluation.accuracy >= 0.20, `Naive Bayes trained and evaluated (Accuracy: ${(nbResult.evaluation.accuracy * 100).toFixed(1)}% vs 10% chance)`);
assert(nbResult.evaluation.trainCount > 0 && nbResult.evaluation.testCount > 0, 'Held-out train and test splits preserved');
assert(nbResult.evaluation.confusionMatrix.matrix.length === nbResult.evaluation.confusionMatrix.labels.length, 'Square confusion matrix generated');

const lrResult = trainAndEvaluateClassifier(fullCorpus, 'logistic_regression', DEFAULT_TFIDF_CONFIG, 0.75);
assert(lrResult.evaluation.accuracy >= 0.25, `Logistic Regression trained and evaluated (Accuracy: ${(lrResult.evaluation.accuracy * 100).toFixed(1)}% vs 10% chance)`);

const svmResult = trainAndEvaluateClassifier(fullCorpus, 'linear_svm', DEFAULT_TFIDF_CONFIG, 0.75);
assert(svmResult.evaluation.accuracy >= 0.25, `Linear SVM trained and evaluated (Accuracy: ${(svmResult.evaluation.accuracy * 100).toFixed(1)}% vs 10% chance)`);

console.log('\n--- 6. Testing Unsupervised Topic Discovery (K-Means++) ---');
const topicRes = runKMeansClustering(fullCorpus, tfidf, 4);
assert(topicRes.topics.length === 4, 'Discovered exactly 4 requested topic clusters');
assert(topicRes.topics[0].topTerms.length > 0, 'Cluster center extracted representative terms');
assert(topicRes.topics[0].representativePapers.length > 0, 'Cluster surfaced representative papers by cosine similarity');

console.log('\n--- 7. Testing Temporal Trend Analytics & Emerging Formula ---');
const trends = computeTrendAnalytics(topicRes.updatedPapers, topicRes.topics);
assert(trends.years.length >= 5, 'Captured yearly temporal publications');
assert(trends.emergingCandidates.length === 4, 'Calculated transparent emerging candidacy scores for all topics');
assert(typeof trends.emergingCandidates[0].emergingScore === 'number', 'Emerging score is numerical and grounded');

console.log(`\n========================================`);
console.log(`Test Execution Finished: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
