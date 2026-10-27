import React from 'react';
import {
  FileText,
  Layers,
  BrainCircuit,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import {
  DiscoveredTopic,
  EvaluationResults,
  ResearchPaper,
  TrendAnalysisResult,
  ValidationSummary
} from '../types';

interface DashboardViewProps {
  papers: ResearchPaper[];
  validation: ValidationSummary | null;
  evaluation: EvaluationResults | null;
  topics: DiscoveredTopic[];
  trends: TrendAnalysisResult | null;
  onNavigateTab: (tab: any) => void;
  onLoadSample: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  papers,
  validation,
  evaluation,
  topics,
  trends,
  onNavigateTab,
  onLoadSample
}) => {
  const totalPapers = papers.length;

  if (totalPapers === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center min-h-[70vh]">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No Active Research Corpus</h3>
        <p className="text-slate-400 text-sm max-w-md mb-8">
          Upload your own academic CSV/JSON dataset or load our pre-configured synthetic benchmark corpus containing 64 multi-domain papers.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:from-cyan-400 hover:to-blue-500 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Benchmark Sample (64 Abstracts)</span>
          </button>
          <button
            onClick={() => onNavigateTab('dataset')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 cursor-pointer"
          >
            <span>Upload Custom CSV / JSON</span>
          </button>
        </div>
      </div>
    );
  }

  const categoryCount = trends?.categoryTotals.length || 0;
  const yearRangeText =
    trends && trends.years.length > 0
      ? `${trends.years[0]} – ${trends.years[trends.years.length - 1]}`
      : 'N/A';

  const categoryChartData = trends?.categoryTotals.slice(0, 8).map(c => ({
    name: c.category.length > 18 ? c.category.slice(0, 18) + '...' : c.category,
    count: c.count
  })) || [];

  const topicChartData = topics.map(t => ({
    name: `Topic #${t.id}`,
    fullName: t.label,
    papers: t.paperCount
  }));

  const hasWarnings =
    validation &&
    (validation.duplicateCount > 0 ||
      validation.missingAbstractCount > 0 ||
      validation.invalidYearCount > 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Quality Warnings Banner if any */}
      {hasWarnings && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1 text-xs">
            <span className="font-semibold block text-sm text-amber-200">
              Dataset Quality Audit Notice
            </span>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-amber-300/90">
              {validation.duplicateCount > 0 && <span>· {validation.duplicateCount} duplicate title(s) detected</span>}
              {validation.missingAbstractCount > 0 && (
                <span>· {validation.missingAbstractCount} record(s) missing abstracts</span>
              )}
              {validation.invalidYearCount > 0 && <span>· {validation.invalidYearCount} invalid publication year(s)</span>}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('dataset')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors shrink-0 cursor-pointer"
          >
            Inspect &amp; Clean
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Abstracts */}
        <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Abstracts</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{totalPapers}</div>
          <div className="mt-1 text-[11px] text-slate-500">Processed through pipeline</div>
        </div>

        {/* Categories */}
        <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Categories</span>
            <BrainCircuit className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">{categoryCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Distinct academic domains</div>
        </div>

        {/* Discovered Topics */}
        <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Discovered Topics</span>
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-violet-400">{topics.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">K-Means semantic clusters</div>
        </div>

        {/* Publication Years */}
        <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Year Span</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-400 truncate">{yearRangeText}</div>
          <div className="mt-1 text-[11px] text-slate-500">Temporal coverage range</div>
        </div>

        {/* Model Accuracy */}
        <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Classifier Accuracy</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">
            {evaluation ? `${(evaluation.accuracy * 100).toFixed(1)}%` : 'Untrained'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {evaluation ? `${evaluation.testCount} held-out test abstracts` : 'Run train in Classification'}
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temporal Publications Trend */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Publications Over Time</h4>
              <p className="text-xs text-slate-400">Annual volume of research papers in active dataset</p>
            </div>
            <button
              onClick={() => onNavigateTab('trends')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Trends</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            {trends && trends.yearlyPublicationCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.yearlyPublicationCounts}>
                  <defs>
                    <linearGradient id="pubGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#pubGradient)" name="Papers" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No publication year data available
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Category Distribution</h4>
              <p className="text-xs text-slate-400">Volume across verified research disciplines</p>
            </div>
            <button
              onClick={() => onNavigateTab('explorer')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} width={115} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#0EA5E9" radius={[0, 4, 4, 0]} name="Papers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No categorical labels in dataset
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discovered Topic Breakdown & Emerging Candidates Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Breakdown Bar */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Topic Cluster Sizes</h4>
              <p className="text-xs text-slate-400">K-Means assignments</p>
            </div>
            <button
              onClick={() => onNavigateTab('topics')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Topics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            {topicChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicChartData}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                    formatter={(val, _name, item) => [`${val} papers`, item.payload.fullName]}
                  />
                  <Bar dataKey="papers" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Run Topic Discovery to cluster abstracts
              </div>
            )}
          </div>
        </div>

        {/* Emerging Topics Highlight Table */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Emerging Research Directions</span>
              </h4>
              <p className="text-xs text-slate-400">
                Topics exhibiting statistically elevated publication momentum in recent years
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('trends')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Formula</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-2 font-semibold">Discovered Topic</th>
                  <th className="py-2 px-2 font-semibold">Emerging Score</th>
                  <th className="py-2 px-2 font-semibold">Momentum</th>
                  <th className="py-2 px-2 font-semibold">Recent Share</th>
                  <th className="py-2 px-2 font-semibold text-right">Recent Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trends?.emergingCandidates.slice(0, 4).map(candidate => (
                  <tr key={candidate.topicId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-2 font-medium text-slate-200">
                      <span className="text-cyan-400 font-mono mr-1.5">#{candidate.topicId}</span>
                      <span>{candidate.label}</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-cyan-300">
                      {candidate.emergingScore.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`text-[11px] font-medium ${
                          candidate.momentumBadge === 'High Momentum'
                            ? 'text-emerald-400'
                            : candidate.momentumBadge === 'Emerging'
                            ? 'text-cyan-400'
                            : candidate.momentumBadge === 'Mature'
                            ? 'text-slate-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {candidate.momentumBadge}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-400">{candidate.recentShare}%</td>
                    <td className="py-2.5 px-2 font-mono text-right text-slate-300">{candidate.recentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
