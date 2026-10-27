import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  BrainCircuit,
  TrendingUp,
  FileText,
  UploadCloud,
  Bookmark,
  ShieldCheck,
  ArrowRight,
  Database,
  GraduationCap,
  Building2,
  Users,
  Compass,
  CheckCircle2,
  Layers,
  ChevronRight,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { ActiveTab } from '../components/Sidebar';
import { ResearchPaper } from '../types';

interface HomeLandingViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onSearchQuery: (query: string) => void;
  totalPapers: number;
  totalCategories: number;
  dbSizeBytes?: number;
  recentPapers?: ResearchPaper[];
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  onNavigateTab,
  onSearchQuery,
  totalPapers,
  totalCategories,
  dbSizeBytes = 272384,
  recentPapers = []
}) => {
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearchQuery(searchVal.trim());
      onNavigateTab('smart_search');
    }
  };

  const handleTagClick = (tag: string) => {
    onSearchQuery(tag);
    onNavigateTab('smart_search');
  };

  const sampleKeywords = [
    'Transformers Attention',
    'Federated Learning',
    'Diffusion Models',
    'Graph Neural Networks',
    'Zero-Shot Reasoning'
  ];

  return (
    <div className="w-full min-h-full bg-[#070B14] text-slate-100 flex flex-col">
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-12 pb-16 px-6 lg:px-12 border-b border-slate-800/80">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-violet-600/15 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Gen Academic Research Intelligence Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-1" />
          </div>

          {/* Main Title & Tagline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-[1.15]">
            Discover Research. Classify Knowledge.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Uncover Trends.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mb-8 leading-relaxed font-normal">
            ResearchIntel AI empowers college students, research scholars, university departments, and R&amp;D teams
            to discover literature across 100M+ publications, classify raw abstracts with machine learning, and detect emerging scientific breakthroughs.
          </p>

          {/* Hero Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-2xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-500/60 transition-all rounded-2xl p-2 shadow-[0_10px_35px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row gap-2 mb-4"
          >
            <div className="flex-1 relative flex items-center pl-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
              <input
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search by topic, author, DOI, or paste abstract excerpt..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Search Papers</span>
            </button>
          </form>

          {/* Quick Suggested Queries */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mb-8">
            <span className="font-medium text-slate-400">Trending Queries:</span>
            {sampleKeywords.map(kw => (
              <button
                key={kw}
                onClick={() => handleTagClick(kw)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition-colors text-[11px] cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Call-to-action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-cyan-500/10"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Explore Analytics Dashboard</span>
            </button>

            <button
              onClick={() => onNavigateTab('classification')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <BrainCircuit className="w-4 h-4 text-white" />
              <span>Classify an Abstract</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Empirical Metrics Banner */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="text-center p-3 border-r border-slate-800/60 last:border-0">
            <div className="text-2xl font-bold text-cyan-400">{totalPapers || 64}+</div>
            <div className="text-xs text-slate-400 mt-0.5">Indexed Papers in SQLite</div>
          </div>
          <div className="text-center p-3 border-r border-slate-800/60 last:border-0">
            <div className="text-2xl font-bold text-indigo-400">{totalCategories || 10}</div>
            <div className="text-xs text-slate-400 mt-0.5">Academic Taxonomies</div>
          </div>
          <div className="text-center p-3 border-r border-slate-800/60 last:border-0">
            <div className="text-2xl font-bold text-emerald-400">3 Models</div>
            <div className="text-xs text-slate-400 mt-0.5">NB, Logistic &amp; Linear SVM</div>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl font-bold text-amber-400">{(dbSizeBytes / 1024).toFixed(0)} KB</div>
            <div className="text-xs text-slate-400 mt-0.5">Persistent SQLite Storage</div>
          </div>
        </div>
      </section>

      {/* ================= 6 CORE FEATURES ================= */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Engineered for Modern Scientific Inquiry
          </h2>
          <p className="text-sm text-slate-400">
            A comprehensive suite of tools built on rigorous natural language processing and empirical machine learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div
            onClick={() => onNavigateTab('smart_search')}
            className="group p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
                <span>Smart Research Search</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects directly to OpenAlex, Crossref live metadata APIs, and your local SQLite corpus with full-text title and abstract query resolution.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400">
              <span>OpenAlex + Crossref + SQLite</span>
              <span className="font-semibold">Launch Search →</span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onNavigateTab('classification')}
            className="group p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
                <span>Abstract Classification</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supervised multi-class categorization into 10 computer science &amp; AI domains. Inspect confusion matrix, precision, recall, and Macro-F1.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400">
              <span>Human-in-the-Loop Feedback</span>
              <span className="font-semibold">Test Abstract →</span>
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => onNavigateTab('trends')}
            className="group p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
                <span>Research Trend Discovery</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compound Annual Growth Rate (CAGR) and annual momentum formulas tracking publication surge, keyword evolution, and domain comparisons.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400">
              <span>CAGR &amp; Velocity Analytics</span>
              <span className="font-semibold">View Trends →</span>
            </div>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => onNavigateTab('summary_assistant')}
            className="group p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
                <span>AI Research Assistant</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracts problem statement, methodology, empirical findings, declared limitations, and hypothesized research gaps with structured JSON export.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-violet-400">
              <span>Gemini 3.8 + Offline Heuristic</span>
              <span className="font-semibold">Summarize →</span>
            </div>
          </div>

          {/* Card 5 */}
          <div
            onClick={() => onNavigateTab('pdf_upload')}
            className="group p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
                <span>PDF Ingestion &amp; Parser</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drag-and-drop academic PDF ingestor with heuristic title, author, year, and abstract extraction, automatically persisting papers into SQLite.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-sky-400">
              <span>Instant Corpus Cataloging</span>
              <span className="font-semibold">Upload PDF →</span>
            </div>
          </div>

          {/* Card 6 */}
          <div
            onClick={() => onNavigateTab('library')}
            className="group p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
                <span>My Research Library</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Private bookmarking, reading notes, tag management, and search audit trail secured by PBKDF2 cryptography with CSV bibliographic export.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-400">
              <span>Personal Bibliographic Vault</span>
              <span className="font-semibold">Open Library →</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4-STEP WORKFLOW ================= */}
      <section className="py-16 px-6 lg:px-12 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              How the Machine Learning Pipeline Operates
            </h2>
            <p className="text-sm text-slate-400">
              From raw academic text to verifiable classification, topic discovery, and research gap formulation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xs font-bold mb-3">
                01
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">Ingest &amp; Validate</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Harvest papers from OpenAlex, Crossref, CSV datasets, or uploaded PDFs with schema validation and duplicate title rejection.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-xs font-bold mb-3">
                02
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">NLP Preprocess</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies discourse stopword filtering, preserves hyphenated scientific compounds, and fits an L2-normalized TF-IDF vectorizer.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-violet-950 border border-violet-500/40 text-violet-400 flex items-center justify-center text-xs font-bold mb-3">
                03
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">Classify &amp; Cluster</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Trains Multi-class Naive Bayes, Logistic Regression, or Linear SVM while running K-Means++ for unsupervised topic modeling.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-bold mb-3">
                04
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">Synthesize &amp; Export</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates verifiable problem statements, methodology breakdowns, research gap hypotheses, and downloadable analytical reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= AUDIENCE BENEFITS ================= */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Tailored for the Entire Academic Ecosystem
          </h2>
          <p className="text-sm text-slate-400">
            Delivering concrete research value to individual scholars, educators, and enterprise research labs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">College &amp; Graduate Students</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Rapid literature survey and thesis related-work drafting.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Structured paper breakdown extracting problem and methodology in seconds.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Personal reading library with notes and bibliographic tagging.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Research Scholars &amp; PIs</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Identification of under-explored scientific gaps and research directions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Automated classification of massive unannotated paper corpora.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Temporal publication velocity &amp; CAGR tracking for grant applications.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Universities &amp; R&amp;D Labs</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>Departmental benchmarking across multi-year research trajectories.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>Self-hosted SQLite database with zero cloud credential lock-in.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>Exportable CSV reports for institutional accreditation reviews.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION ================= */}
      <section className="py-12 px-6 lg:px-12 max-w-4xl mx-auto w-full text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Accelerate Your Scientific Discovery Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mb-6">
            Search millions of research papers, classify new abstracts, track growth trajectories, and organize your academic workspace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab('smart_search')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Launch Literature Search</span>
            </button>
            <button
              onClick={() => onNavigateTab('pdf_upload')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs tracking-wide transition-all flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Upload Research PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= ACADEMIC FOOTER ================= */}
      <footer className="mt-auto py-10 px-6 lg:px-12 bg-[#05080E] border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-1">
              <span className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] text-white">
                R
              </span>
              <span>ResearchIntel AI</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Discover Research. Classify Knowledge. Uncover Trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
            <button onClick={() => onNavigateTab('dashboard')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Dashboard
            </button>
            <button onClick={() => onNavigateTab('smart_search')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Literature Search
            </button>
            <button onClick={() => onNavigateTab('classification')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Classifier
            </button>
            <button onClick={() => onNavigateTab('trends')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Trend Analytics
            </button>
            <button onClick={() => onNavigateTab('settings')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Architecture &amp; DB
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center md:text-right">
            <span>Powered by Vite, React 19, TypeScript, Express &amp; SQLite 3.x</span>
            <div className="text-[10px] text-slate-400 mt-0.5">
              OpenAlex &amp; Crossref Metadata API Integration
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
