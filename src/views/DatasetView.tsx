import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import {
  ColumnMapping,
  DatasetMeta,
  ResearchPaper,
  ValidationSummary
} from '../types';
import {
  autoDetectColumnMapping,
  cleanDatasetRecords,
  convertToResearchPapers,
  parseCsv,
  parseJson,
  validateDataset
} from '../services/dataService';
import { exportCleanedDatasetCsv } from '../services/exportService';

interface DatasetViewProps {
  papers: ResearchPaper[];
  datasetMeta: DatasetMeta | null;
  validation: ValidationSummary | null;
  onUpdatePapers: (papers: ResearchPaper[], meta: DatasetMeta) => void;
  onLoadSample: () => void;
  onDownloadSampleCsv: () => void;
  onDeleteDataset: () => void;
}

export const DatasetView: React.FC<DatasetViewProps> = ({
  papers,
  datasetMeta,
  validation,
  onUpdatePapers,
  onLoadSample,
  onDownloadSampleCsv,
  onDeleteDataset
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Column mapping modal state
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [rawRecords, setRawRecords] = useState<Record<string, unknown>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    titleField: '',
    abstractField: '',
    yearField: '',
    categoryField: '',
    keywordsField: '',
    authorsField: ''
  });
  const [tempFileName, setTempFileName] = useState('');

  // Table filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Clean dataset modal
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleanOptions, setCleanOptions] = useState({
    removeDuplicates: true,
    dropMissingAbstracts: true,
    trimWhitespace: true
  });

  // Handle actual file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const text = await file.text();
      const ext = file.name.split('.').pop()?.toLowerCase();

      let headers: string[] = [];
      let records: Record<string, unknown>[] = [];

      if (ext === 'csv') {
        const parsed = parseCsv(text);
        headers = parsed.headers;
        records = parsed.rows.map(row => {
          const obj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
          return obj;
        });
      } else if (ext === 'json') {
        records = parseJson(text);
        if (records.length > 0) {
          headers = Object.keys(records[0]);
        }
      } else {
        throw new Error('Unsupported format. Please upload a .csv or .json file.');
      }

      if (records.length === 0) {
        throw new Error('The uploaded file does not contain any records.');
      }

      const detected = autoDetectColumnMapping(headers);
      setDetectedHeaders(headers);
      setRawRecords(records);
      setColumnMapping(detected);
      setTempFileName(file.name);
      setShowMappingModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Confirm mapping and commit dataset
  const handleApplyMapping = () => {
    if (!columnMapping.abstractField) {
      alert('You must select an Abstract field to extract research features.');
      return;
    }

    const converted = convertToResearchPapers(rawRecords, columnMapping);
    const valid = validateDataset(converted);

    const categories = Array.from(new Set(converted.map(p => p.category).filter(Boolean))).sort();
    const years = converted.map(p => p.publication_year).filter(y => y > 1900);
    const minYear = years.length > 0 ? Math.min(...years) : 2024;
    const maxYear = years.length > 0 ? Math.max(...years) : 2024;

    const meta: DatasetMeta = {
      id: `ds-${Date.now()}`,
      name: tempFileName.replace(/\.[^/.]+$/, ''),
      filename: tempFileName,
      recordCount: converted.length,
      categories,
      yearRange: [minYear, maxYear],
      hasLabels: categories.length > 1,
      uploadedAt: new Date().toISOString(),
      status: 'raw',
      isSyntheticSample: false
    };

    onUpdatePapers(converted, meta);
    setShowMappingModal(false);
  };

  // Execute cleaning
  const handleExecuteClean = () => {
    const cleaned = cleanDatasetRecords(papers, cleanOptions);
    const valid = validateDataset(cleaned);

    const categories = Array.from(new Set(cleaned.map(p => p.category).filter(Boolean))).sort();
    const years = cleaned.map(p => p.publication_year).filter(y => y > 1900);
    const minYear = years.length > 0 ? Math.min(...years) : 2024;
    const maxYear = years.length > 0 ? Math.max(...years) : 2024;

    const meta: DatasetMeta = {
      ...(datasetMeta || {
        id: `ds-${Date.now()}`,
        name: 'Cleaned Dataset',
        filename: 'cleaned.csv',
        hasLabels: categories.length > 1,
        uploadedAt: new Date().toISOString(),
        status: 'raw' as const
      }),
      hasLabels: categories.length > 1,
      recordCount: cleaned.length,
      categories,
      yearRange: [minYear, maxYear]
    };

    onUpdatePapers(cleaned, meta);
    setShowCleanModal(false);
  };

  // Filtered papers
  const filteredPapers = papers.filter(p => {
    const matchSearch =
      searchTerm === '' ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / pageSize));
  const paginatedPapers = filteredPapers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Upload Zone & Actions Banner */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              <span>Research Dataset Ingestion &amp; Schema Mapper</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Upload real research paper abstracts in CSV or JSON format. The platform automatically maps fields, evaluates schema completeness, flags duplicates, and validates publication years.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Parsing File...' : 'Upload CSV / JSON'}</span>
            </button>

            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Load Synthetic Benchmark (64 Papers)</span>
            </button>

            <button
              onClick={onDownloadSampleCsv}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 font-medium text-xs border border-slate-700/60 transition-colors cursor-pointer"
              title="Download standard CSV structure"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Template</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Dataset Validation Quality Audit Summary */}
      {validation && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Valid Records</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
              {validation.validRecords} / {validation.totalRecords}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Ready for NLP vectorization</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Duplicate Titles</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
              {validation.duplicateCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Identified via normalized title matching</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Missing Abstracts</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-rose-400">
              {validation.missingAbstractCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Cannot be processed without text</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Year Anomalies</span>
              <AlertTriangle className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-sky-400">
              {validation.invalidYearCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Outside 1950–current year window</div>
          </div>
        </div>
      )}

      {/* Dataset Controls & Records Table */}
      <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, abstract, or domain..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Categories</option>
                {validation?.categoriesFound.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCleanModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clean Dataset</span>
            </button>

            <button
              onClick={() => exportCleanedDatasetCsv(papers)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear the active dataset?')) {
                  onDeleteDataset();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
              title="Delete active dataset"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Papers Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Title &amp; Authors</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Year</th>
                <th className="py-2.5 px-3 font-semibold">Abstract Excerpt</th>
                <th className="py-2.5 px-3 font-semibold">Keywords</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedPapers.map(paper => (
                <tr key={paper.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3 px-3 max-w-xs font-medium text-slate-200">
                    <div className="font-semibold text-white leading-snug">{paper.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {paper.authors?.join(', ') || 'Anonymous authors'}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-cyan-400 font-medium whitespace-nowrap">
                    {paper.category || 'Uncategorized'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {paper.publication_year}
                  </td>
                  <td className="py-3 px-3 max-w-md text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                    {paper.abstract}
                  </td>
                  <td className="py-3 px-3 max-w-xs text-[11px] text-slate-400">
                    {paper.keywords?.slice(0, 3).join(' · ') || '—'}
                  </td>
                </tr>
              ))}
              {paginatedPapers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No research papers matched your search filter.
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
            {Math.min(currentPage * pageSize, filteredPapers.length)} of {filteredPapers.length} records
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

      {/* Manual Column Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1527] border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span>Confirm Field Column Mapping</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Map the columns detected in <span className="text-cyan-300 font-mono">{tempFileName}</span> to standard academic schema fields.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title Column (Required)</label>
                <select
                  value={columnMapping.titleField}
                  onChange={e => setColumnMapping({ ...columnMapping, titleField: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select Column --</option>
                  {detectedHeaders.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Abstract Column (Required for NLP)
                </label>
                <select
                  value={columnMapping.abstractField}
                  onChange={e => setColumnMapping({ ...columnMapping, abstractField: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select Column --</option>
                  {detectedHeaders.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Publication Year</label>
                  <select
                    value={columnMapping.yearField}
                    onChange={e => setColumnMapping({ ...columnMapping, yearField: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- None / Default (2024) --</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category / Domain</label>
                  <select
                    value={columnMapping.categoryField}
                    onChange={e => setColumnMapping({ ...columnMapping, categoryField: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Unlabeled --</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Keywords Column</label>
                  <select
                    value={columnMapping.keywordsField}
                    onChange={e => setColumnMapping({ ...columnMapping, keywordsField: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- None --</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Authors Column</label>
                  <select
                    value={columnMapping.authorsField}
                    onChange={e => setColumnMapping({ ...columnMapping, authorsField: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- None --</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowMappingModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyMapping}
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Ingest &amp; Validate Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Dataset Modal */}
      {showCleanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1527] border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>Sanitize &amp; Clean Dataset</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Apply non-destructive cleaning transformations to improve classifier convergence.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanOptions.removeDuplicates}
                  onChange={e => setCleanOptions({ ...cleanOptions, removeDuplicates: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Deduplicate Identical Titles</span>
                  <span className="text-slate-400 text-[11px]">
                    Drops subsequent occurrences of exact or normalized duplicate titles.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanOptions.dropMissingAbstracts}
                  onChange={e => setCleanOptions({ ...cleanOptions, dropMissingAbstracts: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Drop Blank Abstracts</span>
                  <span className="text-slate-400 text-[11px]">
                    Eliminates rows without body text that cannot be vectorized.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanOptions.trimWhitespace}
                  onChange={e => setCleanOptions({ ...cleanOptions, trimWhitespace: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Trim Trailing &amp; Internal Spaces</span>
                  <span className="text-slate-400 text-[11px]">
                    Standardizes padding across titles, categories, and abstracts.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCleanModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteClean}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Clean &amp; Re-validate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
