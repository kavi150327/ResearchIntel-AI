import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  User,
  Calendar,
  Hash,
  RefreshCw,
  ExternalLink,
  Save,
  ArrowRight
} from 'lucide-react';
import { ResearchPaper } from '../types/index.ts';
import { apiClient } from '../services/apiClient.ts';

interface PdfUploadViewProps {
  onPaperCataloged?: (paper: ResearchPaper) => void;
  onNavigateToSummary?: (paper: ResearchPaper) => void;
}

export const PdfUploadView: React.FC<PdfUploadViewProps> = ({
  onPaperCataloged,
  onNavigateToSummary
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Extracted metadata fields (editable by user)
  const [extractedPaper, setExtractedPaper] = useState<ResearchPaper | null>(null);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [category, setCategory] = useState('Artificial Intelligence');
  const [keywords, setKeywords] = useState('');
  const [doi, setDoi] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
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

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
      setError('Please upload a valid academic PDF document.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSelectedFile(file);
    setProcessing(true);

    try {
      const res = await apiClient.uploadPdfPaper(file);
      setExtractedPaper(res.paper);
      setTitle(res.extracted.title || file.name.replace(/\.pdf$/i, ''));
      setAbstract(res.extracted.abstract || '');
      setAuthors(res.extracted.authors?.join(', ') || 'Academic Scholar');
      setYear(res.extracted.publication_year || 2024);
      setKeywords(res.extracted.keywords?.join(', ') || '');
      setDoi(res.extracted.doi || '');
      setSuccess(`Successfully extracted metadata from ${file.name} using pdf-parse!`);

      if (onPaperCataloged) {
        onPaperCataloged(res.paper);
      }
    } catch (err: any) {
      setError(err.message || 'PDF extraction failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="p-6 rounded-2xl bg-[#0A1020] border border-cyan-500/20 shadow-xl space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <UploadCloud className="w-4 h-4" />
          <span>Academic PDF Ingestion &amp; Metadata Extraction</span>
        </span>
        <h2 className="text-xl font-bold text-white tracking-tight">
          PDF Paper Upload &amp; Review
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Upload any published PDF research paper or pre-print. Our pipeline extracts the title, abstract discourse, authors, publication year, keywords, and DOI via <code className="font-mono text-cyan-300">pdf-parse</code> and indexes it in your SQLite database.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-[#0A1020]/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto">
          {processing ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">
            {processing
              ? 'Parsing PDF and extracting scientific metadata...'
              : selectedFile
              ? selectedFile.name
              : 'Drop research paper PDF here or click to browse'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Supports standard IEEE, ACM, Springer, arXiv, and university thesis formats (Max 25MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Extracted Metadata Review Form */}
      {extractedPaper && (
        <div className="p-6 rounded-2xl bg-[#0A1020] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Extracted Scientific Metadata (Editable)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Verify and refine extracted fields before submitting to corpus.
              </p>
            </div>

            {onNavigateToSummary && (
              <button
                type="button"
                onClick={() =>
                  onNavigateToSummary({
                    ...extractedPaper,
                    title,
                    abstract,
                    category,
                    authors: authors.split(',').map(s => s.trim()).filter(Boolean),
                    publication_year: year
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 text-xs font-semibold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Launch AI Summary</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="text-slate-300 font-semibold mb-1 block">Paper Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-300 font-semibold mb-1 block">Abstract Body</label>
              <textarea
                rows={5}
                value={abstract}
                onChange={e => setAbstract(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Authors (comma separated)</label>
              <input
                type="text"
                value={authors}
                onChange={e => setAuthors(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Category / Domain</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500 text-xs"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Publication Year</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value, 10) || 2024)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">DOI Reference</label>
              <input
                type="text"
                value={doi}
                onChange={e => setDoi(e.target.value)}
                placeholder="10.1109/CVPR.2024.12345"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-300 font-semibold mb-1 block">Keywords</label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="transformers, vision, self-attention, self-supervised"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
