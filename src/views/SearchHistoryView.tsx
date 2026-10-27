import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Trash2,
  Calendar,
  ArrowRight,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';
import { SearchHistoryRecord } from '../types/index.ts';
import { apiClient } from '../services/apiClient.ts';

interface SearchHistoryViewProps {
  onReplaySearch?: (query: string, filters: any) => void;
  onOpenAuthModal?: () => void;
}

export const SearchHistoryView: React.FC<SearchHistoryViewProps> = ({
  onReplaySearch,
  onOpenAuthModal
}) => {
  const [history, setHistory] = useState<SearchHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await apiClient.getSearchHistory();
      setHistory(items);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = async () => {
    try {
      await apiClient.clearSearchHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear search history:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0A1020] border border-cyan-500/20 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>Query Audit Trail</span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Academic Search History
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
            <button
              onClick={loadHistory}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Historical log of literature queries and parameter filters executed during research discovery sessions.
        </p>
      </div>

      {loading ? (
        <div className="p-16 rounded-2xl bg-[#0A1020] border border-slate-800 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-400">Loading search logs from SQLite...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#0A1020] border border-slate-800 text-center space-y-3">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Search History Logged</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Queries executed in the Smart Search view when signed in will appear here with instant replay capabilities.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#0A1020] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-bold text-white text-sm">
                    "{item.query_text}"
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[11px]">
                  {item.filters?.category && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                      Domain: {item.filters.category}
                    </span>
                  )}
                  {item.filters?.source && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      Source: {item.filters.source}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              {onReplaySearch && (
                <button
                  onClick={() => onReplaySearch(item.query_text, item.filters)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer shrink-0"
                >
                  <span>Replay Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
