import { GoogleGenAI } from '@google/genai';
import { StructuredPaperSummary } from '../types/index.ts';

/**
 * Generates an in-depth structured research summary for a paper abstract.
 * Uses Gemini 3.8 Flash when GEMINI_API_KEY is configured.
 * Automatically falls back to an NLP discourse extractor when no key is present.
 */
export async function generateStructuredSummary(
  title: string,
  abstract: string
): Promise<StructuredPaperSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isRealKey = Boolean(
    apiKey &&
    apiKey.trim().length > 10 &&
    !apiKey.includes('MY_GEMINI_API_KEY') &&
    !apiKey.includes('placeholder')
  );

  if (isRealKey) {
    try {
      const ai = new GoogleGenAI();
      const prompt = `You are a Principal AI Scientist and Senior Peer Reviewer.
Analyze the following academic paper title and abstract and generate an exhaustive, structured research summary.

Paper Title: "${title}"
Paper Abstract: "${abstract}"

Return valid JSON with the exact fields:
{
  "conciseSummary": "A crisp, rigorous 2-3 sentence high-level executive summary.",
  "researchProblem": "The fundamental gap, inefficiency, or unanswered question the paper addresses.",
  "mainObjective": "The primary goal, technical hypothesis, or proposed architecture.",
  "methodology": "The specific computational techniques, algorithms, datasets, or evaluation setup used.",
  "keyFindings": "Quantitative results, performance benchmarks, and empirical conclusions.",
  "limitations": "Acknowledged constraints, computational trade-offs, or assumptions.",
  "futureDirections": ["Concrete research trajectory 1", "Concrete research trajectory 2", "Concrete research trajectory 3"],
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 6000ms')), 6000)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '{}');
      return {
        conciseSummary: parsed.conciseSummary || 'Summary generated from abstract.',
        researchProblem: parsed.researchProblem || 'Problem stated in abstract.',
        mainObjective: parsed.mainObjective || 'Objective detailed in paper.',
        methodology: parsed.methodology || 'Methodology applied.',
        keyFindings: parsed.keyFindings || 'Empirical findings recorded.',
        limitations: parsed.limitations || 'Noted limitations in evaluation.',
        futureDirections: Array.isArray(parsed.futureDirections) ? parsed.futureDirections : [],
        suggestedKeywords: Array.isArray(parsed.suggestedKeywords) ? parsed.suggestedKeywords : [],
        generatedBy: 'gemini',
        generatedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('[SummaryService] Gemini summarization failed, reverting to heuristic NLP extractor:', err);
    }
  }

  // Fallback: Rule-based Heuristic NLP Discourse Extractor
  return generateHeuristicSummary(title, abstract);
}

/**
 * Heuristic scientific discourse parser based on rhetorical sentence classifications
 */
export function generateHeuristicSummary(title: string, abstract: string): StructuredPaperSummary {
  const sentences = abstract
    .replace(/([.?!])\s*(?=[A-Z])/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10);

  let researchProblem = '';
  let mainObjective = '';
  let methodology = '';
  let keyFindings = '';
  let limitations = '';

  const problemPatterns = /\b(problem|challenge|bottleneck|drawback|limitation|lack of|remains difficult|vulnerable|hindered|struggles)\b/i;
  const objectivePatterns = /\b(we propose|we introduce|we present|in this paper|this study|we develop|we design|our approach|we investigate)\b/i;
  const methodPatterns = /\b(framework|architecture|algorithm|model|trained|using|utilizing|pipeline|via|transformer|deep neural|dataset|graph)\b/i;
  const findingsPatterns = /\b(results show|demonstrates|achieves|outperforms|superior|improves|state-of-the-art|accuracy of|findings indicate|empirical)\b/i;
  const limitPatterns = /\b(however|although|limited by|trade-off|costly|computational complexity|overhead|assumes)\b/i;

  for (const s of sentences) {
    if (!researchProblem && problemPatterns.test(s)) researchProblem = s;
    else if (!mainObjective && objectivePatterns.test(s)) mainObjective = s;
    else if (!keyFindings && findingsPatterns.test(s)) keyFindings = s;
    else if (!methodology && methodPatterns.test(s)) methodology = s;
    else if (!limitations && limitPatterns.test(s)) limitations = s;
  }

  // Fallbacks if discourse cues were sparse
  if (!mainObjective && sentences.length > 0) {
    mainObjective = sentences[0];
  }
  if (!researchProblem) {
    researchProblem = `Addresses open performance trade-offs and domain challenges in ${title}.`;
  }
  if (!methodology && sentences.length > 1) {
    methodology = sentences[Math.min(1, sentences.length - 1)];
  }
  if (!keyFindings && sentences.length > 2) {
    keyFindings = sentences[sentences.length - 1];
  }
  if (!limitations) {
    limitations = 'Domain generalization across out-of-distribution benchmarks and hardware overhead require further investigation.';
  }

  const conciseSummary = `${mainObjective} ${keyFindings}`;

  // Extract domain keywords
  const words = abstract.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 4);
  const freq: Record<string, number> = {};
  const stopwords = new Set(['these', 'their', 'which', 'about', 'paper', 'model', 'using', 'based', 'results', 'presents', 'propose']);
  for (const w of words) {
    if (!stopwords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  const suggestedKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const futureDirections = [
    `Cross-validation on diverse benchmark datasets in ${title.split(' ')[0] || 'AI'}.`,
    'Optimization of inference latency and resource footprint for real-world edge deployment.',
    'Investigation of multi-modal extensions and self-supervised continuous learning.'
  ];

  return {
    conciseSummary,
    researchProblem,
    mainObjective,
    methodology,
    keyFindings,
    limitations,
    futureDirections,
    suggestedKeywords,
    generatedBy: 'heuristic_nlp',
    generatedAt: new Date().toISOString()
  };
}
