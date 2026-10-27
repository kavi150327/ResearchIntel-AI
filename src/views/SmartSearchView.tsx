import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  Bookmark,
  Sparkles,
  BookOpen,
  Calendar,
  Tag,
  User,
  ArrowRight,
  Layers,
  CheckCircle2,
  Share2,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ResearchPaper } from '../types/index.ts';
import { apiClient } from '../services/apiClient.ts';

interface SmartSearchViewProps {
  initialQuery?: string;
  onSelectPaperForSummary?: (paper: ResearchPaper) => void;
  onPaperSaved?: () => void;
}

export const SmartSearchView: React.FC<SmartSearchViewProps> = ({
  initialQuery,
  onSelectPaperForSummary,
  onPaperSaved
}) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [category, setCategory] = useState('ALL');
  const [sourceType, setSourceType] = useState('ALL');
  const [yearMin, setYearMin] = useState<number | undefined>(undefined);
  const [yearMax, setYearMax] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'relevance' | 'year_desc' | 'year_asc' | 'title'>('year_desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sourceUsed, setSourceUsed] = useState<string>('sqlite');

  // Similar papers modal state
  const [similarTarget, setSimilarTarget] = useState<ResearchPaper | null>(null);
  const [similarPapers, setSimilarPapers] = useState<ResearchPaper[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Bookmark feedback state
  const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const categories = [
    'ALL',
    'Artificial Intelligence',
    'Machine Learning',
    'Deep Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Data Science',
    'Cybersecurity',
    'Healthcare AI',
    'Distributed Computing',
    'Other / Uncertain'
  ];

  const handleSearch = async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.searchPapers({
        query,
        category,
        yearMin,
        yearMax,
        sourceType,
        sortBy,
        page: targetPage,
        limit
      });
      setPapers(res.papers);
      setTotalCount(res.totalCount);
      setPage(targetPage);
      setSourceUsed(res.source);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    handleSearch(1);
  }, [category, sourceType, sortBy]);

  const handleOpenSimilar = async (paper: ResearchPaper) => {
    setSimilarTarget(paper);
    setLoadingSimilar(true);
    try {
      const results = await apiClient.getSimilarPapers(paper.id, 5);
      setSimilarPapers(results);
    } catch (err) {
      console.error('Failed to load similar papers:', err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleSaveToLibrary = async (paper: ResearchPaper) => {
    setSavingId(paper.id);
    try {
      await apiClient.savePaperToLibrary(paper.id, 'Saved from Smart Search', paper.keywords || []);
      setSavedPaperIds(prev => new Set(prev).add(paper.id));
      if (onPaperSaved) onPaperSaved();
    } catch (err: any) {
      alert(err.message || 'Please sign in to save papers to your personal library.');
    } finally {
      setSavingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Search Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0A1020] border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Smart Research Discovery Engine</span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Academic Literature Search &amp; Similarity
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Corpus: <strong className="text-cyan-400 font-semibold">{totalCount}</strong> indexed works
            </span>
          </div>
        </div>

        {/* Search Bar Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch(1);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by paper title, abstract discourse, authors, DOI, or technical keywords..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search Literature</span>
          </button>
        </form>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          {/* Domain Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Domain:</span>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Source Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Source:</span>
            <select
              value={sourceType}
              onChange={e => setSourceType(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Sources (SQLite + Uploads)</option>
              <option value="openalex">OpenAlex Live Academic API</option>
              <option value="crossref">Crossref Live DOI API</option>
              <option value="dataset">Curated Benchmark Dataset</option>
              <option value="pdf_upload">Extracted PDF Papers</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="year_desc">Year: Newest First</option>
              <option value="year_asc">Year: Oldest First</option>
              <option value="title">Title: A to Z</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>

          {/* Year Range Inputs */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Years:</span>
            <input
              type="number"
              placeholder="Min"
              value={yearMin || ''}
              onChange={e => setYearMin(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <span className="text-slate-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={yearMax || ''}
              onChange={e => setYearMax(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {(query || category !== 'ALL' || sourceType !== 'ALL' || yearMin || yearMax) && (
            <button
              onClick={() => {
                setQuery('');
                setCategory('ALL');
                setSourceType('ALL');
                setYearMin(undefined);
                setYearMax(undefined);
                handleSearch(1);
              }}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-white">{papers.length}</strong> of <strong className="text-white">{totalCount}</strong> results (Page {page} of {totalPages})
          </span>
          {sourceUsed === 'openalex' && (
            <span className="text-emerald-400 font-mono">Live OpenAlex Academic Metadata</span>
          )}
        </div>

        {loading ? (
          <div className="p-16 rounded-2xl bg-[#0A1020] border border-slate-800 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            <p className="text-xs text-slate-400">Querying research index and computing relevance...</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="p-16 rounded-2xl bg-[#0A1020] border border-slate-800 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No Research Papers Matched Your Filters</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your search terms, clearing domain constraints, or searching via the OpenAlex Live API option.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map(paper => {
              const isSaved = savedPaperIds.has(paper.id);
              const isSaving = savingId === paper.id;

              return (
                <div
                  key={paper.id}
                  className="p-5 rounded-xl bg-[#0A1020] border border-slate-800 hover:border-slate-700 transition-all space-y-3 text-xs"
                >
                  {/* Top Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold text-[11px]">
                        {paper.category || 'Artificial Intelligence'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{paper.publication_year}</span>
                      </span>
                      {paper.source_type && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                          {paper.source_type}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenSimilar(paper)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                        title="Find top semantic similarity matches"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Find Similar</span>
                      </button>

                      {onSelectPaperForSummary && (
                        <button
                          onClick={() => onSelectPaperForSummary(paper)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 transition-colors cursor-pointer text-[11px]"
                          title="Generate structured AI summary"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                          <span>AI Summary</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleSaveToLibrary(paper)}
                        disabled={isSaving || isSaved}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-[11px] ${
                          isSaved
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
                        }`}
                      >
                        {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{isSaved ? 'Saved' : 'Bookmark'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {paper.title}
                  </h3>

                  {/* Authors */}
                  {paper.authors && paper.authors.length > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{paper.authors.join(', ')}</span>
                    </div>
                  )}

                  {/* Abstract Text */}
                  <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                    {paper.abstract}
                  </p>

                  {/* Keywords & DOI footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {paper.keywords?.slice(0, 5).map(kw => (
                        <span key={kw} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px]">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      {paper.doi && (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>DOI: {paper.doi}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {paper.source_url && (
                        <a
                          href={paper.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <span>Publisher Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => handleSearch(page - 1)}
              disabled={page <= 1 || loading}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handleSearch(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Similar Papers Modal */}
      {similarTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0A1020] border border-cyan-500/30 p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  Semantic Similarity Matches
                </span>
                <h4 className="text-sm font-bold text-white truncate max-w-lg mt-0.5">
                  Similar to: {similarTarget.title}
                </h4>
              </div>
              <button
                onClick={() => setSimilarTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingSimilar ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 mx-auto mb-2" />
                  Calculating cosine &amp; Jaccard keyword similarities...
                </div>
              ) : similarPapers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No similar papers found in active database corpus.
                </div>
              ) : (
                similarPapers.map((sim, idx) => (
                  <div
                    key={sim.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{sim.title}</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono text-[10px]">
                        Match #{idx + 1} · {Math.round((sim.similarityScore || 0.5) * 100)}% Match
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] line-clamp-2">{sim.abstract}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                      <span>{sim.category} · {sim.publication_year}</span>
                      {sim.doi && (
                        <a
                          href={`https://doi.org/${sim.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          DOI Link
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
