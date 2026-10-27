import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Compass,
  Lightbulb,
  BookOpen,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  AiInsightSummary,
  DiscoveredTopic,
  ResearchPaper,
  TrendAnalysisResult
} from '../types';
import { generateStatisticalInsights } from '../services/insightsEngine';

interface AiInsightsViewProps {
  papers: ResearchPaper[];
  topics: DiscoveredTopic[];
  trends: TrendAnalysisResult | null;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({ papers, topics, trends }) => {
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState<Partial<AiInsightSummary> | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Compute statistical insights deterministically
  const localInsights = useMemo(() => {
    if (!trends) return null;
    return generateStatisticalInsights(papers, topics, trends);
  }, [papers, topics, trends]);

  // Request server-side Gemini 3.8 Flash analysis
  const handleGenerateGeminiNarrative = async () => {
    if (!trends) return;
    setIsGeneratingGemini(true);
    setGeminiError(null);

    try {
      const response = await fetch('/api/insights/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetSummary: {
            totalPapers: papers.length,
            categories: trends.categoryTotals.map(c => c.category)
          },
          topics,
          emergingCandidates: trends.emergingCandidates
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server-side Gemini request failed.');
      }

      setGeminiResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gemini synthesis failed.';
      setGeminiError(
        `${msg} (Platform is currently displaying the local statistical intelligence engine results).`
      );
    } finally {
      setIsGeneratingGemini(false);
    }
  };

  if (!localInsights) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Load or upload a dataset to generate evidence-based academic research insights.
      </div>
    );
  }

  const activeNarrative = geminiResult?.narrativeOverview || localInsights.narrativeOverview;
  const activeGaps = geminiResult?.researchGaps || localInsights.researchGaps;
  const isAiEnhanced = Boolean(geminiResult?.narrativeOverview);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Narrative Synthesis Banner */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-cyan-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Synthesis &amp; Strategic Directions</span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  isAiEnhanced
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {isAiEnhanced ? 'Gemini 3.8 Flash Synthesized' : 'Empirical Statistical NLP'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-1">
              Academic Literature Intelligence &amp; Gap Discovery
            </h3>
          </div>

          <button
            onClick={handleGenerateGeminiNarrative}
            disabled={isGeneratingGemini}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingGemini ? 'animate-spin' : ''}`} />
            <span>{isGeneratingGemini ? 'Synthesizing with Gemini...' : 'Run Gemini Narrative Synthesis'}</span>
          </button>
        </div>

        {geminiError && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{geminiError}</span>
          </div>
        )}

        <div className="mt-4 text-xs text-slate-300 leading-relaxed space-y-2 font-normal">
          <p className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-200">
            {activeNarrative}
          </p>
        </div>
      </div>

      {/* Dominant vs Underrepresented Research Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dominant Categories */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-3">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            <span>Dominant Categorical Concentrations</span>
          </h4>
          <div className="space-y-2">
            {localInsights.dominantCategories.map((cat: { category: string; percentage: number; insight: string }) => (
              <div
                key={cat.category}
                className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span className="text-cyan-400">{cat.category}</span>
                  <span className="font-mono text-slate-400">{cat.percentage}% of corpus</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{cat.insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Underrepresented Opportunities */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-3">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Underrepresented Fields (Potential White Space)</span>
          </h4>
          <div className="space-y-2">
            {localInsights.underrepresentedAreas.length > 0 ? (
              localInsights.underrepresentedAreas.map((area: { category: string; count: number; potentialGaps: string }) => (
                <div
                  key={area.category}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span className="text-amber-300">{area.category}</span>
                    <span className="font-mono text-slate-400">{area.count} papers</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{area.potentialGaps}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-3">
                All categories in the active corpus are balanced without significant skew.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Disciplinary Research Gaps (Hypotheses) */}
      <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            <span>Synthesized Cross-Disciplinary Research Gaps</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Hypotheses highlighting potential methodological convergence between historically disjoint research silos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGaps.map((gap: any, i: number) => (
            <div
              key={gap.title}
              className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/20 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white text-sm">{gap.title}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                  Gap #{i + 1}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 text-[11px] text-cyan-400">
                {gap.categoriesInvolved?.map((c: string) => (
                  <span key={c}>[{c}]</span>
                ))}
              </div>

              <p className="text-slate-400 leading-relaxed text-[11px]">{gap.description}</p>

              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-emerald-300/90 text-[11px] font-mono leading-snug">
                <span className="text-slate-500 uppercase font-sans font-bold text-[9px] block">
                  Hypothesis for Investigation
                </span>
                {gap.hypothesis}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Literature Review Roadmap */}
      <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-3">
        <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-400" />
          <span>Strategic Literature Review Recommendations</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {localInsights.literatureReviewRoadmap.map((r: { direction: string; suggestedFocus: string; impactPotential: string }) => (
            <div
              key={r.direction}
              className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{r.direction}</span>
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    r.impactPotential === 'Transformative'
                      ? 'text-violet-400'
                      : r.impactPotential === 'High'
                      ? 'text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >
                  {r.impactPotential} Impact
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{r.suggestedFocus}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
