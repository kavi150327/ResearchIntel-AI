import {
  EvaluationResults,
  ModelType,
  PerClassMetrics,
  ResearchPaper,
  TfidfConfig
} from '../types';

export interface TfidfVector {
  indices: number[];
  values: number[];
}

export interface FittedTfidfModel {
  vocabulary: Map<string, number>; // term -> index
  featureNames: string[];          // index -> term
  idf: number[];                   // index -> idf weight
  config: TfidfConfig;
}

/**
 * Generate 1-grams and optional 2-grams from a token sequence
 */
export function extractNgrams(tokens: string[], useBigrams: boolean): string[] {
  const ngrams = [...tokens];
  if (useBigrams && tokens.length > 1) {
    for (let i = 0; i < tokens.length - 1; i++) {
      ngrams.push(`${tokens[i]}_${tokens[i + 1]}`);
    }
  }
  return ngrams;
}

/**
 * Fit a TF-IDF vectorizer strictly on training documents to prevent data leakage
 */
export function fitTfidf(documents: string[][], config: TfidfConfig): FittedTfidfModel {
  const N = documents.length;
  const docFrequency = new Map<string, number>();

  // Count document frequencies
  for (const docTokens of documents) {
    const docNgrams = new Set(extractNgrams(docTokens, config.useBigrams));
    for (const term of docNgrams) {
      docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
    }
  }

  // Filter terms by minDf and maxDf
  const candidateTerms: { term: string; df: number; score: number }[] = [];
  for (const [term, df] of docFrequency.entries()) {
    if (df < config.minDf) continue;
    if (df > config.maxDf * N && N > 5) continue;

    // Smooth IDF score: ln((1 + N) / (1 + df)) + 1
    const idf = Math.log((1 + N) / (1 + df)) + 1;
    candidateTerms.push({ term, df, score: df * idf });
  }

  // Sort by term frequency-IDF importance and truncate to maxFeatures
  candidateTerms.sort((a, b) => b.score - a.score);
  const selectedTerms = candidateTerms.slice(0, config.maxFeatures);

  const vocabulary = new Map<string, number>();
  const featureNames: string[] = [];
  const idf: number[] = [];

  selectedTerms.forEach((item, idx) => {
    vocabulary.set(item.term, idx);
    featureNames.push(item.term);
    idf.push(Math.log((1 + N) / (1 + item.df)) + 1);
  });

  return {
    vocabulary,
    featureNames,
    idf,
    config
  };
}

/**
 * Transform tokenized document into a sparse L2-normalized TF-IDF vector
 */
export function transformTfidf(
  docTokens: string[],
  model: FittedTfidfModel
): { vector: Float32Array; topTerms: { term: string; score: number }[] } {
  const ngrams = extractNgrams(docTokens, model.config.useBigrams);
  const termCounts = new Map<number, number>();

  for (const term of ngrams) {
    const termIndex = model.vocabulary.get(term);
    if (termIndex !== undefined) {
      termCounts.set(termIndex, (termCounts.get(termIndex) || 0) + 1);
    }
  }

  const numFeatures = model.featureNames.length;
  const vector = new Float32Array(numFeatures);
  let squaredNorm = 0;

  for (const [idx, count] of termCounts.entries()) {
    let tf = count;
    if (model.config.sublinearTf) {
      tf = 1 + Math.log(count);
    }
    const tfidfVal = tf * model.idf[idx];
    vector[idx] = tfidfVal;
    squaredNorm += tfidfVal * tfidfVal;
  }

  // L2 Normalization
  if (squaredNorm > 0) {
    const norm = Math.sqrt(squaredNorm);
    for (let i = 0; i < numFeatures; i++) {
      if (vector[i] !== 0) {
        vector[i] /= norm;
      }
    }
  }

  // Extract top terms for document
  const topTerms: { term: string; score: number }[] = [];
  for (const [idx] of termCounts.entries()) {
    topTerms.push({
      term: model.featureNames[idx],
      score: vector[idx]
    });
  }
  topTerms.sort((a, b) => b.score - a.score);

  return { vector, topTerms: topTerms.slice(0, 6) };
}

export interface TrainedClassifier {
  modelType: ModelType;
  classes: string[];
  classIndices: Map<string, number>;
  predict: (vector: Float32Array) => { predictedClass: string; confidence: number; probabilities: Record<string, number> };
}

/**
 * Softmax function for logit normalization into probabilities
 */
function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => (sum > 0 ? e / sum : 1 / scores.length));
}

/**
 * Train a Multinomial Naive Bayes classifier
 */
function trainMultinomialNaiveBayes(
  X_train: Float32Array[],
  y_train: string[],
  classes: string[],
  featureCount: number,
  alpha = 1.0
): TrainedClassifier {
  const K = classes.length;
  const classCounts = new Array(K).fill(0);
  const featureTotalsPerClass = new Array(K).fill(0);
  // featureSums[c][f]
  const featureSums: Float32Array[] = Array.from({ length: K }, () => new Float32Array(featureCount));

  const classIndices = new Map<string, number>();
  classes.forEach((c, i) => classIndices.set(c, i));

  // Accumulate counts
  for (let i = 0; i < X_train.length; i++) {
    const cIdx = classIndices.get(y_train[i]);
    if (cIdx === undefined) continue;
    classCounts[cIdx]++;

    const vec = X_train[i];
    for (let f = 0; f < featureCount; f++) {
      const val = vec[f];
      if (val > 0) {
        featureSums[cIdx][f] += val;
        featureTotalsPerClass[cIdx] += val;
      }
    }
  }

  const N = X_train.length;
  const logPriors = classCounts.map(count => Math.log((count + 1) / (N + K)));

  // Precompute log feature likelihoods with Laplace smoothing
  const logFeatureLikelihoods: Float32Array[] = Array.from({ length: K }, (_, c) => {
    const denom = featureTotalsPerClass[c] + alpha * featureCount;
    const logs = new Float32Array(featureCount);
    for (let f = 0; f < featureCount; f++) {
      logs[f] = Math.log((featureSums[c][f] + alpha) / denom);
    }
    return logs;
  });

  const predict = (vec: Float32Array) => {
    const logPosteriors = new Array(K).fill(0);
    for (let c = 0; c < K; c++) {
      let score = logPriors[c];
      const likelihoods = logFeatureLikelihoods[c];
      for (let f = 0; f < featureCount; f++) {
        if (vec[f] > 0) {
          score += vec[f] * likelihoods[f];
        }
      }
      logPosteriors[c] = score;
    }

    const probs = softmax(logPosteriors);
    let bestIdx = 0;
    let maxProb = probs[0];
    for (let c = 1; c < K; c++) {
      if (probs[c] > maxProb) {
        maxProb = probs[c];
        bestIdx = c;
      }
    }

    const probabilityMap: Record<string, number> = {};
    classes.forEach((cName, idx) => {
      probabilityMap[cName] = Math.round(probs[idx] * 1000) / 1000;
    });

    return {
      predictedClass: classes[bestIdx],
      confidence: Math.round(maxProb * 1000) / 1000,
      probabilities: probabilityMap
    };
  };

  return {
    modelType: 'multinomial_nb',
    classes,
    classIndices,
    predict
  };
}

/**
 * Train a Logistic Regression Classifier (One-vs-Rest) with L2 regularization
 */
function trainLogisticRegression(
  X_train: Float32Array[],
  y_train: string[],
  classes: string[],
  featureCount: number,
  epochs = 60,
  learningRate = 0.4,
  l2Lambda = 0.001
): TrainedClassifier {
  const K = classes.length;
  const classIndices = new Map<string, number>();
  classes.forEach((c, i) => classIndices.set(c, i));

  // Weights and biases for each binary classifier (One-vs-Rest)
  const weights: Float32Array[] = Array.from({ length: K }, () => new Float32Array(featureCount));
  const biases = new Float32Array(K);

  const N = X_train.length;

  for (let c = 0; c < K; c++) {
    const w = weights[c];
    let b = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      const lr = learningRate / (1 + 0.01 * epoch);

      for (let i = 0; i < N; i++) {
        const x = X_train[i];
        const yBinary = y_train[i] === classes[c] ? 1 : 0;

        // Compute dot product
        let z = b;
        for (let f = 0; f < featureCount; f++) {
          if (x[f] !== 0) z += w[f] * x[f];
        }

        // Sigmoid
        const p = 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, z))));
        const error = p - yBinary;

        // Gradient update with L2 regularization
        b -= lr * error;
        for (let f = 0; f < featureCount; f++) {
          if (x[f] !== 0) {
            const grad = error * x[f] + l2Lambda * w[f];
            w[f] -= lr * grad;
          }
        }
      }
    }
    biases[c] = b;
  }

  const predict = (vec: Float32Array) => {
    const rawScores = new Array(K).fill(0);
    for (let c = 0; c < K; c++) {
      let z = biases[c];
      const w = weights[c];
      for (let f = 0; f < featureCount; f++) {
        if (vec[f] !== 0) z += w[f] * vec[f];
      }
      rawScores[c] = z;
    }

    const probs = softmax(rawScores);
    let bestIdx = 0;
    let maxProb = probs[0];
    for (let c = 1; c < K; c++) {
      if (probs[c] > maxProb) {
        maxProb = probs[c];
        bestIdx = c;
      }
    }

    const probabilityMap: Record<string, number> = {};
    classes.forEach((cName, idx) => {
      probabilityMap[cName] = Math.round(probs[idx] * 1000) / 1000;
    });

    return {
      predictedClass: classes[bestIdx],
      confidence: Math.round(maxProb * 1000) / 1000,
      probabilities: probabilityMap
    };
  };

  return {
    modelType: 'logistic_regression',
    classes,
    classIndices,
    predict
  };
}

/**
 * Train a Linear SVM (One-vs-Rest Pegasos subgradient optimization)
 */
function trainLinearSVM(
  X_train: Float32Array[],
  y_train: string[],
  classes: string[],
  featureCount: number,
  epochs = 75,
  lambda = 0.005
): TrainedClassifier {
  const K = classes.length;
  const classIndices = new Map<string, number>();
  classes.forEach((c, i) => classIndices.set(c, i));

  const weights: Float32Array[] = Array.from({ length: K }, () => new Float32Array(featureCount));
  const biases = new Float32Array(K);
  const N = X_train.length;

  const posWeight = Math.max(1.5, K - 1);

  for (let c = 0; c < K; c++) {
    const w = weights[c];
    let b = 0;
    let t = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      const lr = 0.5 / (1 + 0.02 * epoch);

      for (let i = 0; i < N; i++) {
        t++;
        const x = X_train[i];
        const isPos = y_train[i] === classes[c];
        const yLabel = isPos ? 1 : -1;
        const weightFactor = isPos ? posWeight : 1.0;

        let margin = b;
        for (let f = 0; f < featureCount; f++) {
          if (x[f] !== 0) margin += w[f] * x[f];
        }

        if (yLabel * margin < 1) {
          // Subgradient update
          b += lr * yLabel * 0.1 * weightFactor;
          for (let f = 0; f < featureCount; f++) {
            if (x[f] !== 0) {
              w[f] = (1 - lr * lambda) * w[f] + lr * yLabel * x[f] * weightFactor;
            } else {
              w[f] = (1 - lr * lambda) * w[f];
            }
          }
        } else {
          for (let f = 0; f < featureCount; f++) {
            w[f] = (1 - lr * lambda) * w[f];
          }
        }
      }
    }
    biases[c] = b;
  }

  const predict = (vec: Float32Array) => {
    const margins = new Array(K).fill(0);
    for (let c = 0; c < K; c++) {
      let score = biases[c];
      const w = weights[c];
      for (let f = 0; f < featureCount; f++) {
        if (vec[f] !== 0) score += w[f] * vec[f];
      }
      margins[c] = score;
    }

    const probs = softmax(margins);
    let bestIdx = 0;
    let maxVal = margins[0];
    for (let c = 1; c < K; c++) {
      if (margins[c] > maxVal) {
        maxVal = margins[c];
        bestIdx = c;
      }
    }

    const probabilityMap: Record<string, number> = {};
    classes.forEach((cName, idx) => {
      probabilityMap[cName] = Math.round(probs[idx] * 1000) / 1000;
    });

    return {
      predictedClass: classes[bestIdx],
      confidence: Math.round(probs[bestIdx] * 1000) / 1000,
      probabilities: probabilityMap
    };
  };

  return {
    modelType: 'linear_svm',
    classes,
    classIndices,
    predict
  };
}

/**
 * Stratified train/test split ensuring proportional representation per category
 */
export function stratifiedSplit(
  papers: ResearchPaper[],
  trainRatio = 0.75
): { train: ResearchPaper[]; test: ResearchPaper[] } {
  const byCategory = new Map<string, ResearchPaper[]>();
  papers.forEach(p => {
    const list = byCategory.get(p.category) || [];
    list.push(p);
    byCategory.set(p.category, list);
  });

  const train: ResearchPaper[] = [];
  const test: ResearchPaper[] = [];

  for (const [, list] of byCategory.entries()) {
    // Deterministic pseudo-shuffle based on paper ID length and index to remain reproducible
    const shuffled = [...list].sort((a, b) => a.id.localeCompare(b.id));
    const trainCount = Math.max(1, Math.round(shuffled.length * trainRatio));

    train.push(...shuffled.slice(0, trainCount));
    test.push(...shuffled.slice(trainCount));
  }

  // If test set ended up empty due to very small dataset, fallback to 1 item per category in test
  if (test.length === 0 && papers.length >= 4) {
    const splitIndex = Math.floor(papers.length * trainRatio);
    return {
      train: papers.slice(0, splitIndex),
      test: papers.slice(splitIndex)
    };
  }

  return { train, test };
}

/**
 * Execute full supervised classification training and rigorous held-out evaluation
 */
export function trainAndEvaluateClassifier(
  papers: ResearchPaper[],
  modelType: ModelType,
  tfidfConfig: TfidfConfig,
  trainRatio = 0.75
): {
  evaluation: EvaluationResults;
  classifier: TrainedClassifier;
  tfidfModel: FittedTfidfModel;
  updatedPapers: ResearchPaper[];
} {
  // Validate that papers have labels
  const labeledPapers = papers.filter(p => p.category && p.category.trim() !== '' && p.tokens && p.tokens.length > 0);
  if (labeledPapers.length < 4) {
    throw new Error('Dataset contains insufficient labeled papers (minimum 4 required for train/test split).');
  }

  const { train, test } = stratifiedSplit(labeledPapers, trainRatio);

  // Extract unique classes sorted alphabetically
  const classes = Array.from(new Set(labeledPapers.map(p => p.category))).sort();
  if (classes.length < 2) {
    throw new Error('Classification requires at least 2 distinct category classes.');
  }

  // 1. Fit TF-IDF solely on training set (No Data Leakage)
  const trainTokens = train.map(p => p.tokens || []);
  const tfidfModel = fitTfidf(trainTokens, tfidfConfig);

  // 2. Transform train and test documents
  const X_train = trainTokens.map(t => transformTfidf(t, tfidfModel).vector);
  const y_train = train.map(p => p.category);

  const testTokens = test.map(p => p.tokens || []);
  const X_test = testTokens.map(t => transformTfidf(t, tfidfModel).vector);
  const y_test = test.map(p => p.category);

  const featureCount = tfidfModel.featureNames.length;

  // 3. Train chosen model
  let classifier: TrainedClassifier;
  let modelName = '';

  if (modelType === 'multinomial_nb') {
    classifier = trainMultinomialNaiveBayes(X_train, y_train, classes, featureCount);
    modelName = 'Multinomial Naive Bayes';
  } else if (modelType === 'logistic_regression') {
    classifier = trainLogisticRegression(X_train, y_train, classes, featureCount);
    modelName = 'Logistic Regression (One-vs-Rest)';
  } else {
    classifier = trainLinearSVM(X_train, y_train, classes, featureCount);
    modelName = 'Linear Support Vector Machine (Linear SVM)';
  }

  // 4. Evaluate strictly on held-out test set
  const K = classes.length;
  const classIndexMap = new Map<string, number>();
  classes.forEach((c, i) => classIndexMap.set(c, i));

  // Initialize confusion matrix [actual][predicted]
  const matrix: number[][] = Array.from({ length: K }, () => new Array(K).fill(0));
  let correctPredictions = 0;

  for (let i = 0; i < test.length; i++) {
    const actualClass = y_test[i];
    const actualIdx = classIndexMap.get(actualClass)!;
    const predResult = classifier.predict(X_test[i]);
    const predIdx = classIndexMap.get(predResult.predictedClass);

    if (predIdx !== undefined) {
      matrix[actualIdx][predIdx]++;
      if (actualIdx === predIdx) {
        correctPredictions++;
      }
    }
  }

  const accuracy = test.length > 0 ? correctPredictions / test.length : 0;

  // 5. Compute Per-Class Precision, Recall, F1
  const perClass: Record<string, PerClassMetrics> = {};
  let macroP = 0;
  let macroR = 0;
  let macroF = 0;
  let weightedF = 0;

  for (let i = 0; i < K; i++) {
    const cName = classes[i];
    const tp = matrix[i][i];
    let fp = 0;
    let fn = 0;

    for (let r = 0; r < K; r++) {
      if (r !== i) fp += matrix[r][i];
    }
    for (let c = 0; c < K; c++) {
      if (c !== i) fn += matrix[i][c];
    }

    const support = tp + fn;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    perClass[cName] = {
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1: Math.round(f1 * 1000) / 1000,
      support
    };

    macroP += precision;
    macroR += recall;
    macroF += f1;
    weightedF += f1 * support;
  }

  macroP /= K;
  macroR /= K;
  macroF /= K;
  weightedF = test.length > 0 ? weightedF / test.length : 0;

  // 6. Predict on ALL papers to enrich the dataset explorer
  const updatedPapers = papers.map(paper => {
    if (!paper.tokens || paper.tokens.length === 0) return paper;
    const { vector, topTerms } = transformTfidf(paper.tokens, tfidfModel);
    const prediction = classifier.predict(vector);
    return {
      ...paper,
      predicted_category: prediction.predictedClass,
      prediction_confidence: prediction.confidence,
      prediction_probabilities: prediction.probabilities,
      tfidf_top_terms: topTerms
    };
  });

  // Top vocabulary items sample
  const vocabularySample = tfidfModel.featureNames.slice(0, 15).map((term, i) => ({
    term,
    idf: Math.round(tfidfModel.idf[i] * 100) / 100
  }));

  const evaluation: EvaluationResults = {
    modelType,
    modelName,
    trainCount: train.length,
    testCount: test.length,
    accuracy: Math.round(accuracy * 1000) / 1000,
    macroPrecision: Math.round(macroP * 1000) / 1000,
    macroRecall: Math.round(macroR * 1000) / 1000,
    macroF1: Math.round(macroF * 1000) / 1000,
    weightedF1: Math.round(weightedF * 1000) / 1000,
    perClass,
    confusionMatrix: {
      labels: classes,
      matrix
    },
    trainedAt: new Date().toISOString(),
    featureCount,
    vocabularySample
  };

  return {
    evaluation,
    classifier,
    tfidfModel,
    updatedPapers
  };
}

export const DEFAULT_TFIDF_CONFIG: TfidfConfig = {
  maxFeatures: 350,
  minDf: 1,
  maxDf: 0.85,
  useBigrams: true,
  sublinearTf: true
};
