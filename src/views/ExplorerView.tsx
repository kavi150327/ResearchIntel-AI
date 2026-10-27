import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  BrainCircuit,
  Eye,
  CheckCircle,
  XCircle,
  X,
  FileText
} from 'lucide-react';
import { DiscoveredTopic, ResearchPaper } from '../types';
import { exportCleanedDatasetCsv } from '../services/exportService';

interface ExplorerViewProps {
  papers: ResearchPaper[];
  topics: DiscoveredTopic[];
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({ papers, topics }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [concordanceFilter, setConcordanceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'year_desc' | 'year_asc' | 'title_asc' | 'confidence_desc'>('year_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected paper for deep inspection modal
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);

  // Derive unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    papers.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [papers]);

  // Filtered and sorted papers
  const filteredPapers = useMemo(() => {
    return papers
      .filter(p => {
        // Text search
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(query);
          const matchAbstract = p.abstract.toLowerCase().includes(query);
          const matchAuthor = p.authors?.some(a => a.toLowerCase().includes(query));
          const matchKeywords = p.keywords?.some(k => k.toLowerCase().includes(query));
          if (!matchTitle && !matchAbstract && !matchAuthor && !matchKeywords) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== 'ALL' && p.category !== categoryFilter) {
          return false;
        }

        // Topic filter
        if (topicFilter !== 'ALL' && String(p.topic_id) !== topicFilter) {
          return false;
        }

        // Concordance filter
        if (concordanceFilter === 'CORRECT') {
          if (!p.category || !p.predicted_category || p.category !== p.predicted_category) return false;
        } else if (concordanceFilter === 'MISCLASSIFIED') {
          if (!p.category || !p.predicted_category || p.category === p.predicted_category) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'year_desc') return b.publication_year - a.publication_year;
        if (sortBy === 'year_asc') return a.publication_year - b.publication_year;
        if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
        if (sortBy === 'confidence_desc') return (b.prediction_confidence || 0) - (a.prediction_confidence || 0);
        return 0;
      });
  }, [papers, searchQuery, categoryFilter, topicFilter, concordanceFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / pageSize));
  const paginatedPapers = filteredPapers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Search & Multi-Filter Bar */}
      <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, abstract keyword, author, or methodology..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Quick Result Count & Export Filtered */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              {filteredPapers.length} / {papers.length} matches
            </span>
            <button
              onClick={() => exportCleanedDatasetCsv(filteredPapers, 'filtered_research_papers.csv')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Filtered CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Chips / Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Category Domain</label>
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Discovered Topic</label>
            <select
              value={topicFilter}
              onChange={e => {
                setTopicFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Topics ({topics.length})</option>
              {topics.map(t => (
                <option key={t.id} value={String(t.id)}>
                  Topic #{t.id}: {t.label.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Model Concordance */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Classifier Concordance</label>
            <select
              value={concordanceFilter}
              onChange={e => {
                setConcordanceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Predictions</option>
              <option value="CORRECT">Correct Predictions Only</option>
              <option value="MISCLASSIFIED">Misclassifications Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Sort Records</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="year_desc">Year (Newest First)</option>
              <option value="year_asc">Year (Oldest First)</option>
              <option value="title_asc">Title (A to Z)</option>
              <option value="confidence_desc">Prediction Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Explorer Results Table */}
      <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Title &amp; Authors</th>
                <th className="py-2.5 px-3 font-semibold">Original Category</th>
                <th className="py-2.5 px-3 font-semibold">Predicted Category</th>
                <th className="py-2.5 px-3 font-semibold">Topic</th>
                <th className="py-2.5 px-3 font-semibold">Year</th>
                <th className="py-2.5 px-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedPapers.map(paper => {
                const isCorrect =
                  paper.category && paper.predicted_category
                    ? paper.category === paper.predicted_category
                    : null;

                return (
                  <tr key={paper.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 max-w-sm">
                      <div className="font-semibold text-white leading-snug">{paper.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {paper.authors?.slice(0, 3).join(', ') || 'Anonymous'}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-cyan-400 font-medium">{paper.category}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {paper.predicted_category ? (
                        <div className="flex items-center gap-1.5">
                          {isCorrect === true ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : isCorrect === false ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ) : null}
                          <span className={isCorrect === false ? 'text-rose-300' : 'text-slate-200'}>
                            {paper.predicted_category}
                          </span>
                          {paper.prediction_confidence !== undefined && (
                            <span className="text-[10px] font-mono text-slate-500">
                              ({(paper.prediction_confidence * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not run</span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-violet-400 font-medium">
                      {paper.topic_id ? (
                        <span>
                          #{paper.topic_id} · {paper.topic_label?.slice(0, 18)}...
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {paper.publication_year}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedPaper(paper)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="View complete abstract & features"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedPapers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No research papers matched your search filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredPapers.length)} of {filteredPapers.length} results
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-mono text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Abstract Detail Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1527] border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white leading-snug">{selectedPaper.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{selectedPaper.authors?.join(', ') || 'Anonymous'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-300">{selectedPaper.publication_year}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-400">{selectedPaper.category}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPaper(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Classification & Topic Overview */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Model Predicted Category</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {selectedPaper.predicted_category || 'Not yet classified'}
                </span>
                {selectedPaper.prediction_confidence !== undefined && (
                  <span className="text-[11px] font-mono text-cyan-400">
                    Confidence: {(selectedPaper.prediction_confidence * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Semantic Topic</span>
                <span className="font-semibold text-violet-300 mt-0.5 block">
                  {selectedPaper.topic_label || 'Unassigned'}
                </span>
                {selectedPaper.topic_id && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Topic ID: #{selectedPaper.topic_id}
                  </span>
                )}
              </div>
            </div>

            {/* Original Abstract */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Original Abstract</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                {selectedPaper.abstract}
              </p>
            </div>

            {/* Top TF-IDF Features */}
            {selectedPaper.tfidf_top_terms && selectedPaper.tfidf_top_terms.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dominant TF-IDF Feature Weights</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPaper.tfidf_top_terms.map(t => (
                    <span
                      key={t.term}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300"
                    >
                      {t.term.replace(/_/g, ' ')} · {t.score.toFixed(3)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {selectedPaper.keywords && selectedPaper.keywords.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Metadata Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-400">
                  {selectedPaper.keywords.map(kw => (
                    <span key={kw} className="text-slate-300">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPaper(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
