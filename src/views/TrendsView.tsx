import React from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { TrendAnalysisResult } from '../types';

interface TrendsViewProps {
  trends: TrendAnalysisResult | null;
}

export const TrendsView: React.FC<TrendsViewProps> = ({ trends }) => {
  if (!trends || trends.years.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No temporal data available. Load a dataset with publication year records to inspect trends.
      </div>
    );
  }

  const hasFewYears = trends.years.length < 3;
  const categoryNames = trends.categoryTotals.slice(0, 5).map(c => c.category);
  const categoryColors = ['#38BDF8', '#818CF8', '#A855F7', '#2DD4BF', '#F43F5E'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Temporal Coverage Notice if dataset has few years */}
      {hasFewYears && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold text-sm text-amber-200 block">
              Limited Temporal Range Notice
            </span>
            <p className="mt-0.5 text-amber-300/90">
              The active corpus only spans {trends.years.length} publication year(s) ({trends.years.join(', ')}). Trend analysis and emerging velocity formulas yield highest statistical significance when comparing at least 3 distinct years.
            </p>
          </div>
        </div>
      )}

      {/* Main Charts: Publications Volume & Category Trajectories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Yearly Publications */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Annual Publication Volume Trajectory</span>
            </h4>
            <p className="text-xs text-slate-400">Total papers indexed per calendar year</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.yearlyPublicationCounts}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#38BDF8" strokeWidth={2.5} fill="url(#trendGradient)" name="Publications" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Trajectory Comparison */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Category Evolution Over Time</span>
            </h4>
            <p className="text-xs text-slate-400">Comparative growth curves across top research domains</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.categoryGrowthOverTime}>
                <XAxis dataKey="year" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {categoryNames.map((cat, i) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={categoryColors[i % categoryColors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transparent Emerging Score Mathematical Formula Panel */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-cyan-500/30 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Transparent Emerging-Topic Scoring Methodology</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            A topic is not classified as emerging merely because it exhibits high cumulative publication volume. The algorithm evaluates publication share acceleration between baseline years and recent years, dampened by a statistical sample sufficiency factor to guard against single-paper volatility.
          </p>
        </div>

        {/* Formula Box */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto">
          <div className="text-slate-400 font-sans font-semibold mb-1">Mathematical Formula:</div>
          <div>Emerging Score = ((RecentShare - HistoricalShare) / max(HistoricalShare, 0.05)) * min(1.0, sqrt(RecentCount) / 1.73) * 10</div>
          <div className="text-[11px] text-slate-500 mt-2 font-sans">
            where RecentShare = (Recent Topic Papers) / (Total Recent Papers), and BaselineShare = (Baseline Topic Papers) / (Total Baseline Papers).
          </div>
        </div>

        {/* Parameter Windows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">Recent Window</span>
            <span className="font-mono text-cyan-300 font-bold block mt-0.5">
              {trends.formulaDetails.recentWindow}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">Baseline Window</span>
            <span className="font-mono text-slate-300 font-bold block mt-0.5">
              {trends.formulaDetails.baselineWindow}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">Emerging Threshold</span>
            <span className="font-mono text-emerald-400 font-bold block mt-0.5">
              Score &ge; {trends.formulaDetails.threshold.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Emerging Topic Candidates Detailed Evaluation Table */}
      <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <h4 className="text-sm font-bold text-white tracking-tight mb-3">
          Emerging-Topic Candidates &amp; Momentum Audit
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Discovered Topic</th>
                <th className="py-2.5 px-3 font-semibold">Emerging Score</th>
                <th className="py-2.5 px-3 font-semibold">Classification</th>
                <th className="py-2.5 px-3 font-semibold">Recent Share</th>
                <th className="py-2.5 px-3 font-semibold">Historical Share</th>
                <th className="py-2.5 px-3 font-semibold">Relative Growth</th>
                <th className="py-2.5 px-3 font-semibold text-right">Recent Papers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {trends.emergingCandidates.map(c => (
                <tr key={c.topicId} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">
                      <span className="text-cyan-400 font-mono mr-1.5">#{c.topicId}</span>
                      <span>{c.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                      {c.explanation}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-base text-cyan-300">
                    {c.emergingScore.toFixed(2)}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.momentumBadge === 'High Momentum'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : c.momentumBadge === 'Emerging'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : c.momentumBadge === 'Mature'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {c.momentumBadge}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-300">{c.recentShare}%</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{c.historicalShare}%</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-200">
                    {c.growthRate > 0 ? `+${c.growthRate}%` : `${c.growthRate}%`}
                  </td>
                  <td className="py-3 px-3 font-mono text-right text-white font-bold">
                    {c.recentCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
