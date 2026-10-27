import React from 'react';
import { Sparkles, Download, Database, ChevronDown, User as UserIcon, Shield } from 'lucide-react';
import { DatasetMeta, User } from '../types/index.ts';

interface HeaderProps {
  currentTabName: string;
  datasetMeta: DatasetMeta | null;
  allDatasets: DatasetMeta[];
  onSelectDataset: (id: string) => void;
  onLoadSample: () => void;
  onDownloadSampleCsv: () => void;
  backendStatus: 'connected' | 'checking' | 'fallback';
  sqliteStats?: { fileSizeBytes: number; rowCount: number };
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabName,
  datasetMeta,
  allDatasets,
  onSelectDataset,
  onLoadSample,
  onDownloadSampleCsv,
  backendStatus,
  sqliteStats,
  currentUser,
  onOpenAuthModal
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090E1B]/90 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
      {/* Current View Title & Corpus Selector */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>{currentTabName}</span>
          </h2>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            {allDatasets.length > 1 ? (
              <div className="relative inline-flex items-center">
                <Database className="w-3 h-3 text-cyan-400 mr-1.5" />
                <select
                  value={datasetMeta?.id || ''}
                  onChange={e => onSelectDataset(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer pr-5"
                >
                  {allDatasets.map(ds => (
                    <option key={ds.id} value={ds.id}>
                      {ds.name} ({ds.recordCount} papers)
                    </option>
                  ))}
                </select>
              </div>
            ) : datasetMeta ? (
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 font-medium">{datasetMeta.name}</span>
                <span aria-hidden="true">·</span>
                <span>{datasetMeta.recordCount} records</span>
                <span aria-hidden="true">·</span>
                <span>{datasetMeta.categories.length} categories</span>
                {datasetMeta.isSyntheticSample && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400/90 font-medium text-[11px]">Benchmark Corpus</span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-slate-500 italic">No dataset loaded</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls & Engine Status & User Profile */}
      <div className="flex items-center gap-3">
        {/* Real SQLite 3.x Persistent Indicator */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
            }`}
          />
          <span className="font-mono text-[11px] text-slate-300">
            {backendStatus === 'connected'
              ? `SQLite 3.x Disk DB ${sqliteStats ? `(${(sqliteStats.fileSizeBytes / 1024).toFixed(0)} KB)` : ''}`
              : 'Client-Side NLP Engine'}
          </span>
        </div>

        {/* Load Sample Dataset Action */}
        <button
          onClick={onLoadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.1)]"
          title="Reset and reload the benchmark AI/DS dataset into SQLite"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Benchmark Sample</span>
          <span className="sm:hidden">Sample</span>
        </button>

        {/* Download CSV Template */}
        <button
          onClick={onDownloadSampleCsv}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          title="Download sample research paper dataset template in CSV format"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>CSV Template</span>
        </button>

        {/* User Account / Auth Button */}
        {onOpenAuthModal && (
          <button
            onClick={onOpenAuthModal}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              currentUser
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-transparent shadow-sm shadow-cyan-500/20'
            }`}
          >
            {currentUser ? (
              <>
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                  {currentUser.full_name.charAt(0)}
                </div>
                <span className="max-w-[110px] truncate">{currentUser.full_name}</span>
                <span className="hidden sm:inline px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono capitalize">
                  {currentUser.role}
                </span>
              </>
            ) : (
              <>
                <UserIcon className="w-3.5 h-3.5" />
                <span>Scholar Sign In</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
