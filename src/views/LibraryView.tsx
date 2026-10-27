import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  BookOpen,
  Trash2,
  Edit3,
  Tag,
  ExternalLink,
  Sparkles,
  Download,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { SavedPaperRecord, ResearchPaper } from '../types/index.ts';
import { apiClient } from '../services/apiClient.ts';

interface LibraryViewProps {
  onSelectPaperForSummary?: (paper: ResearchPaper) => void;
  onOpenAuthModal?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectPaperForSummary,
  onOpenAuthModal
}) => {
  const [savedPapers, setSavedPapers] = useState<(SavedPaperRecord & { paper: ResearchPaper })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Editing notes state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const loadLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await apiClient.getLibrary();
      setSavedPapers(items);
    } catch (err: any) {
      setError(err.message || 'Please sign in to access your personal research library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleRemove = async (paperId: string) => {
    try {
      await apiClient.removeFromLibrary(paperId);
      setSavedPapers(prev => prev.filter(p => p.paper_id !== paperId));
    } catch (err) {
      console.error('Failed to remove paper:', err);
    }
  };

  const allTags = Array.from(
    new Set(savedPapers.flatMap(p => p.tags || []))
  ).sort();

  const filteredPapers = selectedTag === 'ALL'
    ? savedPapers
    : savedPapers.filter(p => p.tags?.includes(selectedTag));

  const handleExportCsv = () => {
    const headers = ['Title', 'Category', 'Year', 'Authors', 'DOI', 'Notes', 'Tags'];
    const rows = savedPapers.map(p => [
      `"${(p.paper.title || '').replace(/"/g, '""')}"`,
      `"${p.paper.category || ''}"`,
      p.paper.publication_year || 2024,
      `"${(p.paper.authors || []).join('; ')}"`,
      `"${p.paper.doi || ''}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${(p.tags || []).join(', ')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_research_library_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="p-6 rounded-2xl bg-[#0A1020] border border-cyan-500/20 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4" />
              <span>Personal Research Workspace</span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              My Research Library
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {savedPapers.length > 0 && (
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Library CSV</span>
              </button>
            )}
            <button
              onClick={loadLibrary}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Refresh library"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Your persistent collection of cataloged research abstracts, personal annotations, and review tags stored securely in SQLite.
        </p>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 font-medium mr-1">Filter by Tag:</span>
            <button
              onClick={() => setSelectedTag('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedTag === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({savedPapers.length})
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="p-12 rounded-2xl bg-[#0A1020] border border-slate-800 text-center space-y-3">
          <Bookmark className="w-8 h-8 text-cyan-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Sign In to View Your Library</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your personal research library is synchronized to your account in the local SQLite database.
          </p>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 cursor-pointer mt-2"
            >
              Open Sign In Modal
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="p-16 rounded-2xl bg-[#0A1020] border border-slate-800 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-400">Loading your saved papers from SQLite...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#0A1020] border border-slate-800 text-center space-y-3">
          <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Your Research Library is Empty</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Use the Smart Search, Abstract Explorer, or PDF Upload views to bookmark papers to your library.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPapers.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-[#0A1020] border border-slate-800 hover:border-slate-700 transition-all space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold text-[11px]">
                    {item.paper.category}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {item.paper.publication_year}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    Saved on {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectPaperForSummary && (
                    <button
                      onClick={() => onSelectPaperForSummary(item.paper)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>AI Summary</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRemove(item.paper_id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove from library"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">
                {item.paper.title}
              </h3>

              {item.paper.authors && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{item.paper.authors.join(', ')}</span>
                </div>
              )}

              <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                {item.paper.abstract}
              </p>

              {/* Personal Notes Box */}
              {item.notes && (
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <span className="text-slate-500 uppercase font-semibold text-[9px] block">
                    Scholar Personal Notes
                  </span>
                  <p className="italic text-slate-300">{item.notes}</p>
                </div>
              )}

              {/* Tags & External Links */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.tags?.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px]">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {item.paper.doi && (
                    <a
                      href={`https://doi.org/${item.paper.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
                    >
                      <span>DOI: {item.paper.doi}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {item.paper.source_url && (
                    <a
                      href={item.paper.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      <span>Publisher Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
