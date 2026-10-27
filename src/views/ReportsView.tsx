import React from 'react';
import {
  DownloadCloud,
  FileSpreadsheet,
  FileJson,
  Printer,
  FileText,
  Layers,
  TrendingUp,
  BrainCircuit,
  CheckCircle2
} from 'lucide-react';
import {
  DiscoveredTopic,
  EvaluationResults,
  ResearchPaper,
  TrendAnalysisResult,
  ValidationSummary
} from '../types';
import {
  exportClassificationCsv,
  exportCleanedDatasetCsv,
  exportFullAnalysisJson,
  exportTopicAssignmentsCsv,
  exportTrendAnalyticsCsv,
  openPrintableSummaryReport
} from '../services/exportService';

interface ReportsViewProps {
  papers: ResearchPaper[];
  validation: ValidationSummary | null;
  evaluation: EvaluationResults | null;
  topics: DiscoveredTopic[];
  trends: TrendAnalysisResult | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  papers,
  validation,
  evaluation,
  topics,
  trends
}) => {
  const totalPapers = papers.length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <DownloadCloud className="w-5 h-5 text-cyan-400" />
              <span>Multi-Format Research Report &amp; Dataset Exporter</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Export real computed results, cleaned corpora, held-out model metrics, and discovered clusters to CSV, structured JSON, or generate a formal academic PDF project report.
            </p>
          </div>

          <button
            onClick={() => {
              if (!trends) return;
              openPrintableSummaryReport(papers, validation, evaluation, topics, trends);
            }}
            disabled={totalPapers === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Generate &amp; Print Academic PDF Report</span>
          </button>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Cleaned Dataset CSV */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono text-slate-400">CSV Format</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3">Cleaned Research Dataset</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Export the validated corpus containing standardized fields, extracted tokens, and cleaned abstract text.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-500">
              {totalPapers} papers · Ready for external ML pipelines
            </div>
          </div>

          <button
            onClick={() => exportCleanedDatasetCsv(papers)}
            disabled={totalPapers === 0}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-40"
          >
            Download Cleaned CSV
          </button>
        </div>

        {/* Classification Results CSV */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono text-slate-400">CSV Format</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3">Classification Predictions</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Contains ground-truth labels, model predictions, posterior confidence percentages, correctness indicators, and top TF-IDF weights.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-500">
              Model: {evaluation?.modelName || 'Supervised Classifier'}
            </div>
          </div>

          <button
            onClick={() => exportClassificationCsv(papers, evaluation || undefined)}
            disabled={totalPapers === 0}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-40"
          >
            Download Predictions CSV
          </button>
        </div>

        {/* Topic Assignments CSV */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                <Layers className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono text-slate-400">CSV Format</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3">Topic Cluster Assignments</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Lists each document's assigned K-Means topic ID, custom descriptive label, and top characteristic cluster terms.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-500">
              {topics.length} discovered topics
            </div>
          </div>

          <button
            onClick={() => exportTopicAssignmentsCsv(papers, topics)}
            disabled={topics.length === 0}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-40"
          >
            Download Topics CSV
          </button>
        </div>

        {/* Trend Analysis CSV */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono text-slate-400">CSV Format</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3">Temporal Trend Analytics</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Detailed annual publication counts, category volume breakdown, and emerging-score metrics with velocity indicators.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-500">
              {trends?.years.length || 0} calendar years indexed
            </div>
          </div>

          <button
            onClick={() => {
              if (trends) exportTrendAnalyticsCsv(trends);
            }}
            disabled={!trends}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-40"
          >
            Download Trends CSV
          </button>
        </div>

        {/* Complete JSON Payload */}
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <FileJson className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono text-slate-400">JSON Format</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3">Full Intelligence JSON</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Complete nested machine-readable archive containing evaluation metrics, confusion matrix, topic distributions, and records.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-500">
              Full structured platform export
            </div>
          </div>

          <button
            onClick={() => {
              if (trends) {
                exportFullAnalysisJson(papers, validation, evaluation, topics, trends);
              }
            }}
            disabled={!trends}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-40"
          >
            Download Analysis JSON
          </button>
        </div>

        {/* Printable Academic Summary */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-[#0D1527] to-[#121B33] border border-cyan-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                <Printer className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono text-cyan-400">PDF / Print</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-3">Formal Academic Project Report</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Generates a professionally structured project report formatted for college mini-project review, printing, or Save to PDF.
            </p>
            <div className="mt-3 text-[11px] font-mono text-cyan-400">
              Includes Methodology, Matrices &amp; Formula Explanations
            </div>
          </div>

          <button
            onClick={() => {
              if (trends) {
                openPrintableSummaryReport(papers, validation, evaluation, topics, trends);
              }
            }}
            disabled={!trends}
            className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-40"
          >
            Open &amp; Print Report
          </button>
        </div>
      </div>
    </div>
  );
};
