import React, { useState, useMemo } from 'react';
import {
  FileText,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info,
  Layers
} from 'lucide-react';
import { PreprocessingConfig, ResearchPaper } from '../types';
import {
  DEFAULT_PREPROCESSING_CONFIG,
  inspectPreprocessingPipeline,
  preprocessDataset
} from '../services/nlpEngine';

interface NlpViewProps {
  papers: ResearchPaper[];
  onUpdatePapers: (papers: ResearchPaper[]) => void;
}

export const NlpView: React.FC<NlpViewProps> = ({ papers, onUpdatePapers }) => {
  const [config, setConfig] = useState<PreprocessingConfig>(DEFAULT_PREPROCESSING_CONFIG);
  const [customStopwordsInput, setCustomStopwordsInput] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState<string>(papers[0]?.id || '');
  const [customInputText, setCustomInputText] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Active text to inspect in pipeline
  const activeInspectionText = useMemo(() => {
    if (customInputText.trim().length > 0) {
      return customInputText;
    }
    const paper = papers.find(p => p.id === selectedPaperId) || papers[0];
    return paper ? paper.abstract : '';
  }, [papers, selectedPaperId, customInputText]);

  // Execute step-by-step pipeline inspection
  const inspectionResult = useMemo(() => {
    if (!activeInspectionText) return null;
    return inspectPreprocessingPipeline(activeInspectionText, config);
  }, [activeInspectionText, config]);

  // Batch run preprocessing on entire dataset
  const handleRunBatchPreprocessing = () => {
    if (papers.length === 0) return;
    setIsProcessingBatch(true);
    setBatchSuccessMessage(null);

    setTimeout(() => {
      const updated = preprocessDataset(papers, config);
      onUpdatePapers(updated);
      setIsProcessingBatch(false);
      setBatchSuccessMessage(`Successfully preprocessed all ${updated.length} abstracts in the active corpus.`);
    }, 200);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Configuration & Batch Runner Card */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Scientific NLP Preprocessing Pipeline</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Configurable multi-stage text normalization pipeline tailored for academic scientific vocabulary. Normalizes contractions, tokenizes hyphenated acronyms (e.g., zero-shot, sim-to-real), eliminates research boilerplate stop-words, and applies morphological lemmatization.
            </p>
          </div>

          <button
            onClick={handleRunBatchPreprocessing}
            disabled={isProcessingBatch || papers.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessingBatch ? 'animate-spin' : ''}`} />
            <span>{isProcessingBatch ? 'Preprocessing Corpus...' : 'Run Pipeline on All Abstracts'}</span>
          </button>
        </div>

        {batchSuccessMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{batchSuccessMessage}</span>
          </div>
        )}

        {/* Pipeline Configuration Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={config.lowercase}
              onChange={e => setConfig({ ...config, lowercase: e.target.checked })}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200 block">Case Folding</span>
              <span className="text-[11px] text-slate-400">Lowercase normalization</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={config.removeStopwords}
              onChange={e => setConfig({ ...config, removeStopwords: e.target.checked })}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200 block">Stop-Word Filter</span>
              <span className="text-[11px] text-slate-400">Standard + academic stopwords</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={config.lemmatize}
              onChange={e => setConfig({ ...config, lemmatize: e.target.checked })}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200 block">Lemmatization</span>
              <span className="text-[11px] text-slate-400">Canonical base forms</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={config.preserveScientificTerms}
              onChange={e => setConfig({ ...config, preserveScientificTerms: e.target.checked })}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200 block">Preserve Acronyms</span>
              <span className="text-[11px] text-slate-400">Protect BERT, LoRA, 3D</span>
            </div>
          </label>
        </div>

        {/* Custom Stopwords input */}
        <div className="mt-4">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Custom Domain Stopwords (Comma-separated)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. experimental, proposed, framework, furthermore"
              value={customStopwordsInput}
              onChange={e => setCustomStopwordsInput(e.target.value)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => {
                const words = customStopwordsInput.split(',').map(s => s.trim()).filter(Boolean);
                setConfig({ ...config, customStopwords: words });
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 cursor-pointer"
            >
              Apply Stopwords
            </button>
          </div>
        </div>
      </div>

      {/* Abstract Selector / Custom Text Tester */}
      <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Interactive Abstract Transformation Inspector</span>
          </h4>

          {papers.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Select Paper:</span>
              <select
                value={selectedPaperId}
                onChange={e => {
                  setSelectedPaperId(e.target.value);
                  setCustomInputText('');
                }}
                className="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 max-w-xs truncate"
              >
                {papers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <textarea
            rows={3}
            placeholder="Or type/paste any custom scientific abstract text to inspect pipeline transformations in real time..."
            value={customInputText}
            onChange={e => setCustomInputText(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Inspection Results */}
      {inspectionResult && (
        <div className="space-y-6">
          {/* Statistical Compression Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-[#0D1527] border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Raw Word Count</span>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                {inspectionResult.stats.rawWordCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0D1527] border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Cleaned Tokens</span>
              <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">
                {inspectionResult.stats.cleanedWordCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0D1527] border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Removed Noise</span>
              <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
                {inspectionResult.stats.removedTokensCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0D1527] border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Compression Ratio</span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                {inspectionResult.stats.compressionPercentage}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0D1527] border border-slate-800 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block">Unique Vocabulary</span>
              <span className="text-lg font-bold font-mono text-violet-400 mt-0.5 block">
                {inspectionResult.stats.uniqueTokens}
              </span>
            </div>
          </div>

          {/* Before & After Direct Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Original Unprocessed Abstract</span>
                <span className="font-mono text-[11px] text-slate-500">
                  {inspectionResult.stats.rawWordCount} words
                </span>
              </h5>
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 max-h-48 overflow-y-auto">
                {inspectionResult.originalText}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-cyan-500/30">
              <h5 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Cleaned &amp; Lemmatized Abstract</span>
                <span className="font-mono text-[11px] text-cyan-300">
                  {inspectionResult.stats.cleanedWordCount} tokens
                </span>
              </h5>
              <div className="text-xs text-cyan-100/90 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-cyan-900/40 max-h-48 overflow-y-auto font-mono">
                {inspectionResult.cleanedText}
              </div>
            </div>
          </div>

          {/* Sequential Pipeline Stages Walkthrough */}
          <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
            <h4 className="text-sm font-bold text-white tracking-tight mb-4">
              Sequential Transformation Stages
            </h4>

            <div className="space-y-3">
              {inspectionResult.steps.map((st, idx) => (
                <div
                  key={st.step}
                  className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="text-cyan-400">{st.step}</span>
                      <span className="text-slate-500 text-[11px]">({st.tokenCount} tokens)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{st.description}</div>
                  </div>

                  <div className="md:max-w-md w-full bg-slate-950/80 px-3 py-1.5 rounded font-mono text-[11px] text-slate-300 border border-slate-800/80 truncate">
                    {st.outputPreview}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
