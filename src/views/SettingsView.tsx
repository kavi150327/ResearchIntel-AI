import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Code2,
  CheckCircle,
  Terminal,
  BookOpen,
  RefreshCw,
  Play,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

interface SettingsViewProps {
  backendStatus: 'connected' | 'checking' | 'fallback';
  onCheckBackend: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  backendStatus,
  onCheckBackend
}) => {
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isPinging, setIsPinging] = useState(false);

  // SQL Query Runner state
  const [sqlQuery, setSqlQuery] = useState('SELECT id, title, category, publication_year FROM papers LIMIT 5;');
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthInfo(data);
      } else {
        setHealthInfo({ status: 'unreachable', error: `HTTP ${res.status}` });
      }

      const statsRes = await fetch('/api/db/stats');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setDbStats(stats);
      }
    } catch (err: any) {
      setHealthInfo({ status: 'offline', error: err.message });
    } finally {
      setIsPinging(false);
    }
  };

  const handleExecuteSql = async () => {
    setIsExecutingSql(true);
    setSqlError(null);
    setSqlResult(null);

    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'SQL execution failed.');
      }
      if (data.result && data.result.length > 0) {
        setSqlResult(data.result[0]);
      } else {
        setSqlResult({ columns: ['status'], values: [['Query executed successfully with 0 returned rows']] });
      }
    } catch (err: any) {
      setSqlError(err.message);
    } finally {
      setIsExecutingSql(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto execute default query to show data
    handleExecuteSql();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Platform Specification Banner */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>B.Tech Artificial Intelligence and Data Science Mini-Project</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Research Abstract Classification &amp; Trend Discovery Platform
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Tagline: <span className="text-cyan-300 font-medium">Transform Research Papers into Intelligent Insights.</span>
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Primary Framework</span>
            <span className="text-slate-200 font-semibold">React + TypeScript + Vite</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Persistent Database</span>
            <span className="text-emerald-400 font-semibold">SQLite 3.x Disk Engine</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Backend Services</span>
            <span className="text-cyan-400 font-semibold">Express REST + Python FastAPI</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Machine Learning</span>
            <span className="text-violet-400 font-semibold">Scikit-Learn NLP Pipeline</span>
          </div>
        </div>
      </div>

      {/* REAL SQLITE DATABASE LIVE INSPECTOR */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-emerald-500/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Real SQLite 3.x Database Engine &amp; SQL Query Console</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ACID Disk-Backed
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Direct SQL query execution against physical SQLite tables: <code className="text-emerald-300 font-mono">datasets</code>, <code className="text-emerald-300 font-mono">papers</code>, <code className="text-emerald-300 font-mono">model_evaluations</code>, <code className="text-emerald-300 font-mono">discovered_topics</code>, <code className="text-emerald-300 font-mono">trend_analytics</code>.
              </p>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isPinging}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>Refresh Schema Stats</span>
          </button>
        </div>

        {/* Database Disk File Stats */}
        {dbStats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {dbStats.tables?.map((tbl: any) => (
              <div key={tbl.name} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 text-[11px] font-mono block truncate">{tbl.name}</span>
                <span className="text-lg font-bold font-mono text-emerald-400 block mt-0.5">
                  {tbl.rowCount} rows
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Interactive SQL Query Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive SQL Query:</span>
            </label>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-500">Presets:</span>
              <button
                onClick={() => setSqlQuery('SELECT id, title, category, publication_year FROM papers LIMIT 5;')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Top Papers
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setSqlQuery('SELECT category, COUNT(*) as paper_count FROM papers GROUP BY category ORDER BY paper_count DESC;')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Category Group By
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setSqlQuery('SELECT id, model_name, accuracy, macro_f1 FROM model_evaluations;')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Evaluations
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setSqlQuery('SELECT id, label, paper_count FROM discovered_topics;')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Topics
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <textarea
              rows={2}
              value={sqlQuery}
              onChange={e => setSqlQuery(e.target.value)}
              className="flex-1 p-2.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-emerald-300 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleExecuteSql}
              disabled={isExecutingSql || !sqlQuery.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isExecutingSql ? 'Running...' : 'Execute SQL'}</span>
            </button>
          </div>
        </div>

        {sqlError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>SQLite Error: {sqlError}</span>
          </div>
        )}

        {/* Real SQL Results Table */}
        {sqlResult && (
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>SQL Query Results ({sqlResult.values.length} records returned):</span>
              <span className="font-mono text-emerald-400 text-[10px]">SQLite 3.x Engine</span>
            </div>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-mono text-[11px]">
                    {sqlResult.columns.map((col, idx) => (
                      <th key={idx} className="py-2 px-3 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                  {sqlResult.values.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40 font-mono text-[11px]">
                      {row.map((cell: any, cIdx: number) => (
                        <td key={cIdx} className="py-2 px-3 text-slate-300 max-w-xs truncate">
                          {typeof cell === 'object' && cell !== null
                            ? JSON.stringify(cell)
                            : String(cell ?? 'NULL')}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {sqlResult.values.length === 0 && (
                    <tr>
                      <td colSpan={sqlResult.columns.length} className="py-4 text-center text-slate-500 text-xs">
                        Query returned 0 rows.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Backend Diagnostics & Health Card */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Full-Stack Backend Health Status</h4>
              <p className="text-xs text-slate-400">Node.js Express + SQLite API Status</p>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isPinging}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>Ping /api/health</span>
          </button>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto space-y-1">
          <div>$ curl -X GET http://localhost:3000/api/health</div>
          <div className="text-cyan-400">
            {healthInfo ? JSON.stringify(healthInfo, null, 2) : 'Pinging server...'}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Every dataset upload, NLP preprocessing step, model evaluation matrix, and topic assignment is automatically stored directly in the persistent SQLite database on disk.
          </span>
        </div>
      </div>

      {/* Python FastAPI ML Backend Source Code & Local Instructions */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-bold text-white">Python FastAPI ML Backend Instructions</h4>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            As requested for university examination and project review, the complete Python ML source code is provided in the project root under <code className="text-emerald-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">/python_backend/</code> with full FastAPI, scikit-learn, pandas, and numpy implementations.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
          <div className="text-slate-500 font-sans font-semibold">Terminal Commands to run Python ML Service:</div>
          <div className="text-emerald-400">cd python_backend</div>
          <div className="text-emerald-400">pip install -r requirements.txt</div>
          <div className="text-emerald-400">uvicorn main:app --reload --host 0.0.0.0 --port 8000</div>
          <div className="text-slate-500 pt-2 text-[11px] font-sans">
            Once running, access Swagger API documentation at: <span className="text-cyan-400">http://localhost:8000/docs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
