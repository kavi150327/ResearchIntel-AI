import { PreprocessingConfig, ResearchPaper } from '../types';

/**
 * Standard English stop words combined with academic/research meta-vocabulary
 * that commonly dilute scientific topical signals without conveying subject domain.
 */
export const STANDARD_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
  'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
  'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
  'yourself', 'yourselves',
  // Common research paper narrative discourse words (academic stop words)
  'paper', 'present', 'propose', 'proposed', 'work', 'study', 'approach', 'method',
  'methodology', 'framework', 'demonstrate', 'show', 'shows', 'shown', 'results',
  'evaluate', 'evaluation', 'evaluated', 'experiments', 'experimental', 'achieve',
  'achieves', 'achieved', 'conduct', 'conducted', 'significant', 'significantly',
  'based', 'using', 'used', 'state-of-the-art', 'also', 'novel', 'new', 'well',
  'furthermore', 'moreover', 'therefore', 'thus', 'specifically', 'overall'
]);

/**
 * Key technical acronyms and scientific compound terms to preserve intact
 */
export const PRESERVED_SCIENTIFIC_TERMS = new Set([
  'zero-shot', 'few-shot', 'sim-to-real', 'real-time', 'self-supervised', 'spatio-temporal',
  'end-to-end', 'transformer', 'transformers', 'bert', 'gpt', 'llm', 'llms', 'rag', 'lora',
  'nerf', 'cnn', 'svm', 'ode', '3d', '2d', 'uav', 'gps', 'icu', 'hipaa', 'dns', 'fpga',
  'admm', 'dbscan', 'knn', 'mice', 'rouge', 'iou', 'bleu', 'zk-snarks'
]);

const CONTRACTION_MAP: Record<string, string> = {
  "can't": 'cannot',
  "won't": 'will not',
  "n't": ' not',
  "'re": ' are',
  "'s": ' is',
  "'d": ' would',
  "'ll": ' will',
  "'ve": ' have',
  "'m": ' am'
};

/**
 * Expand standard English contractions
 */
export function expandContractions(text: string): string {
  let normalized = text;
  for (const [contraction, expansion] of Object.entries(CONTRACTION_MAP)) {
    normalized = normalized.replace(new RegExp(contraction, 'gi'), expansion);
  }
  return normalized;
}

/**
 * Stem/lemmatize common English inflections while protecting technical roots
 */
export function lemmatizeWord(word: string): string {
  if (word.length <= 3) return word;
  if (PRESERVED_SCIENTIFIC_TERMS.has(word)) return word;

  let stem = word;

  // Plurals and standard suffixes
  if (stem.endsWith('ies') && stem.length > 4) {
    stem = stem.slice(0, -3) + 'y';
  } else if (stem.endsWith('es') && stem.length > 4 && (stem.endsWith('shes') || stem.endsWith('ches') || stem.endsWith('sses') || stem.endsWith('xes'))) {
    stem = stem.slice(0, -2);
  } else if (stem.endsWith('s') && !stem.endsWith('ss') && stem.length > 3) {
    stem = stem.slice(0, -1);
  }

  // -ing verb forms
  if (stem.endsWith('ing') && stem.length > 5) {
    const base = stem.slice(0, -3);
    // Double consonant rollback: stopping -> stop
    if (base.length > 3 && base[base.length - 1] === base[base.length - 2] && !['l', 's', 'z'].includes(base[base.length - 1])) {
      stem = base.slice(0, -1);
    } else {
      stem = base;
    }
  }

  // -ed past tense
  if (stem.endsWith('ed') && stem.length > 5) {
    const base = stem.slice(0, -2);
    if (base.length > 3 && base[base.length - 1] === base[base.length - 2]) {
      stem = base.slice(0, -1);
    } else {
      stem = base;
    }
  }

  // -tion -> -te (e.g., classification -> classify handled or classification -> classify)
  if (stem.endsWith('tion') && stem.length > 6) {
    stem = stem.slice(0, -4) + 'te';
  }

  // -al adjective forms
  if (stem.endsWith('al') && stem.length > 5 && !stem.endsWith('ical')) {
    stem = stem.slice(0, -2);
  }

  return stem;
}

export interface PipelineInspectionStep {
  step: string;
  description: string;
  outputPreview: string;
  tokenCount: number;
}

export interface PreprocessingInspection {
  originalText: string;
  cleanedText: string;
  steps: PipelineInspectionStep[];
  tokens: string[];
  stats: {
    rawWordCount: number;
    cleanedWordCount: number;
    removedTokensCount: number;
    compressionPercentage: number;
    uniqueTokens: number;
  };
}

/**
 * Execute the full NLP preprocessing pipeline on an individual text string
 */
export function preprocessText(text: string, config: PreprocessingConfig): { cleanedText: string; tokens: string[] } {
  if (!text || text.trim().length === 0) {
    return { cleanedText: '', tokens: [] };
  }

  let processed = text;

  // 1. Contraction expansion
  processed = expandContractions(processed);

  // 2. Normalization & Case Folding
  if (config.lowercase) {
    processed = processed.toLowerCase();
  }

  // 3. Tokenization (handles scientific hyphens like zero-shot, sim-to-real)
  // Match words, numbers, and hyphenated scientific compounds
  const tokenRegex = /[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*/g;
  const rawTokens = processed.match(tokenRegex) || [];

  // 4. Stop-word removal
  const stopwordSet = new Set([...STANDARD_STOPWORDS, ...config.customStopwords.map(w => w.toLowerCase())]);
  let filteredTokens: string[] = [];

  for (const token of rawTokens) {
    const lower = token.toLowerCase();

    // Check minimum length
    if (token.length < config.minTokenLength) continue;

    // Discard pure numeric tokens if they aren't scientific designations
    if (/^\d+$/.test(token)) continue;

    // Check stopwords (unless it's an explicitly preserved compound term)
    if (config.removeStopwords && stopwordSet.has(lower) && !PRESERVED_SCIENTIFIC_TERMS.has(lower)) {
      continue;
    }

    // 5. Lemmatization
    let finalToken = token;
    if (config.lemmatize) {
      finalToken = lemmatizeWord(token);
    }

    filteredTokens.push(finalToken);
  }

  return {
    cleanedText: filteredTokens.join(' '),
    tokens: filteredTokens
  };
}

/**
 * Inspect step-by-step pipeline transformations for a given abstract
 */
export function inspectPreprocessingPipeline(text: string, config: PreprocessingConfig): PreprocessingInspection {
  const steps: PipelineInspectionStep[] = [];

  // Step 1: Raw
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  steps.push({
    step: '1. Raw Abstract',
    description: 'Original academic text received from dataset upload',
    outputPreview: text.length > 140 ? text.slice(0, 140) + '...' : text,
    tokenCount: rawWords.length
  });

  // Step 2: Normalization
  let normalized = expandContractions(text);
  if (config.lowercase) {
    normalized = normalized.toLowerCase();
  }
  steps.push({
    step: '2. Normalization & Case Folding',
    description: 'Expanded colloquial contractions and standardized to lowercase',
    outputPreview: normalized.length > 140 ? normalized.slice(0, 140) + '...' : normalized,
    tokenCount: normalized.split(/\s+/).filter(Boolean).length
  });

  // Step 3: Scientific Tokenization
  const tokenRegex = /[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*/g;
  const tokens = normalized.match(tokenRegex) || [];
  steps.push({
    step: '3. Scientific Tokenization',
    description: 'Extracted alpha-numeric units while preserving hyphenated compounds (e.g. zero-shot, sim-to-real)',
    outputPreview: tokens.slice(0, 16).join(' ') + (tokens.length > 16 ? '...' : ''),
    tokenCount: tokens.length
  });

  // Step 4: Stop-Word Removal
  const stopwordSet = new Set([...STANDARD_STOPWORDS, ...config.customStopwords.map(w => w.toLowerCase())]);
  const withoutStopwords = tokens.filter(t => {
    if (t.length < config.minTokenLength) return false;
    if (/^\d+$/.test(t)) return false;
    return !stopwordSet.has(t.toLowerCase()) || PRESERVED_SCIENTIFIC_TERMS.has(t.toLowerCase());
  });
  steps.push({
    step: '4. Stop-Word & Discourse Elimination',
    description: 'Removed general English stop-words and academic boilerplate (e.g. "demonstrate", "paper")',
    outputPreview: withoutStopwords.slice(0, 16).join(' ') + (withoutStopwords.length > 16 ? '...' : ''),
    tokenCount: withoutStopwords.length
  });

  // Step 5: Lemmatization
  const lemmatized = withoutStopwords.map(t => config.lemmatize ? lemmatizeWord(t) : t);
  steps.push({
    step: '5. Morphological Lemmatization',
    description: 'Reduced inflected word variants to canonical morphological stems',
    outputPreview: lemmatized.slice(0, 16).join(' ') + (lemmatized.length > 16 ? '...' : ''),
    tokenCount: lemmatized.length
  });

  const cleanedText = lemmatized.join(' ');
  const uniqueTokens = new Set(lemmatized).size;
  const rawCount = rawWords.length;
  const cleanedCount = lemmatized.length;

  return {
    originalText: text,
    cleanedText,
    steps,
    tokens: lemmatized,
    stats: {
      rawWordCount: rawCount,
      cleanedWordCount: cleanedCount,
      removedTokensCount: Math.max(0, rawCount - cleanedCount),
      compressionPercentage: rawCount > 0 ? Math.round(((rawCount - cleanedCount) / rawCount) * 100) : 0,
      uniqueTokens
    }
  };
}

/**
 * Preprocess an entire dataset of research papers
 */
export function preprocessDataset(
  papers: ResearchPaper[],
  config: PreprocessingConfig
): ResearchPaper[] {
  return papers.map(paper => {
    const { cleanedText, tokens } = preprocessText(paper.abstract, config);
    return {
      ...paper,
      cleaned_abstract: cleanedText,
      tokens
    };
  });
}

export const DEFAULT_PREPROCESSING_CONFIG: PreprocessingConfig = {
  lowercase: true,
  removePunctuation: true,
  removeStopwords: true,
  lemmatize: true,
  preserveScientificTerms: true,
  minTokenLength: 3,
  customStopwords: []
};
