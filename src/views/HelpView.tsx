import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Key,
  Database,
  Cpu,
  Search,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Terminal,
  ShieldAlert
} from 'lucide-react';

export const HelpView: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('getting-started');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Help Center &amp; Architecture Documentation</h1>
          </div>
          <p className="text-xs text-slate-400">
            Comprehensive guide for students, scholars, professors, and developers on using ResearchIntel AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>SQLite 3.x Disk Engine Active</span>
          </div>
        </div>
      </div>

      {/* Quick Architecture Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 mb-2 font-semibold text-sm">
            <Search className="w-4 h-4" />
            <span>Literature APIs</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Directly connected to OpenAlex and Crossref APIs with fallback to local SQLite full-text search. No API key needed for basic queries.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400 mb-2 font-semibold text-sm">
            <Cpu className="w-4 h-4" />
            <span>Transparent ML Engine</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-class Naive Bayes, Logistic Regression, and Linear SVM with TF-IDF vectorization and K-Means++ clustering. 100% auditable.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-violet-400 mb-2 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI Summarization</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Powered by Google Gemini 3.8 Flash (`@google/genai`) with automated fallback to an offline scientific heuristic NLP extractor.
          </p>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4">
        {/* Section 1: Getting Started */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
          <button
            onClick={() => toggleSection('getting-started')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-sm text-white">1. Getting Started &amp; Authentication</span>
            </div>
            {openSection === 'getting-started' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSection === 'getting-started' && (
            <div className="p-5 pt-0 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                ResearchIntel AI provides public access to literature discovery, abstract classification, and trend analysis.
                To save papers into your personal library or maintain a search history audit trail, sign in using your scholar account:
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-medium text-cyan-300">Pre-configured Demo Accounts:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Scholar Account:</span>
                    <span className="font-mono text-cyan-300">scholar@university.edu</span>
                    <span className="text-slate-400 block mt-0.5">Password: <span className="font-mono text-slate-300">ScholarPass2025!</span></span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Administrator Account:</span>
                    <span className="font-mono text-cyan-300">admin@researchintel.ai</span>
                    <span className="text-slate-400 block mt-0.5">Password: <span className="font-mono text-slate-300">AdminPass2025!</span></span>
                  </div>
                </div>
              </div>
              <p>
                Password hashing is secured via <strong>PBKDF2 with SHA-512</strong> (10,000 iterations, 32-byte salt) and session tokens use HMAC-SHA256 signatures.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Smart Search */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
          <button
            onClick={() => toggleSection('search')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-sm text-white">2. Searching Literature (OpenAlex, Crossref &amp; SQLite)</span>
            </div>
            {openSection === 'search' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSection === 'search' && (
            <div className="p-5 pt-0 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                The literature search supports three interchangeable data sources:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li><strong className="text-slate-200">All Sources (SQLite + Uploads):</strong> Searches local SQLite persistent corpus with full-text title and abstract matching and year/domain filters.</li>
                <li><strong className="text-slate-200">OpenAlex Live Academic API:</strong> Queries over 250M academic works with inverted index abstract reconstruction and concept mapping.</li>
                <li><strong className="text-slate-200">Crossref Live DOI API:</strong> Queries publisher metadata across registered DOIs, extracting titles, authors, and year.</li>
              </ul>
              <p>
                Click <strong>"Find Similar"</strong> on any result card to run cosine similarity against all other papers in the SQLite corpus.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Abstract Classification & Active Learning */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
          <button
            onClick={() => toggleSection('classifier')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-violet-400" />
              <span className="font-semibold text-sm text-white">3. ML Classification &amp; Active Learning Pipeline</span>
            </div>
            {openSection === 'classifier' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSection === 'classifier' && (
            <div className="p-5 pt-0 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                The classification pipeline is designed for transparent understanding by AI &amp; Data Science students:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-medium text-violet-300 mb-1">Feature Extraction:</div>
                  <p className="text-[11px] text-slate-400">
                    Text is processed through lowercase folding, academic discourse stopword removal (e.g. "propose", "demonstrate"),
                    preservation of hyphenated scientific compounds (e.g. "zero-shot", "state-of-the-art"), and L2-normalized TF-IDF vectorization.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-medium text-violet-300 mb-1">Supervised Algorithms:</div>
                  <p className="text-[11px] text-slate-400">
                    Supports <strong>Multinomial Naive Bayes</strong> (probabilistic log-likelihood), <strong>Logistic Regression</strong> (One-vs-Rest softmax),
                    and <strong>SGD Linear SVM</strong> (hinge loss gradient descent).
                  </p>
                </div>
              </div>
              <p>
                <strong>Active Learning Human Feedback:</strong> If a paper is misclassified, authorized scholars can submit a corrected taxonomy category.
                The correction is stored in the `abstract_predictions` SQLite table for iterative model retraining.
              </p>
            </div>
          )}
        </div>

        {/* Section 4: AI Summarization & Research Gap Hypotheses */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
          <button
            onClick={() => toggleSection('ai-summary')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-sm text-white">4. AI Summarization &amp; Research Gap Formulations</span>
            </div>
            {openSection === 'ai-summary' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSection === 'ai-summary' && (
            <div className="p-5 pt-0 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                The AI Research Assistant breaks academic abstracts down into 7 structured dimensions:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">1. Executive Summary</div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">2. Research Problem</div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">3. Primary Objectives</div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">4. Methodology</div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">5. Key Findings</div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">6. Limitations &amp; Future Work</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Academic Integrity Notice:</strong> All research-gap suggestions are explicitly labeled as <em>AI-generated exploratory hypotheses</em> requiring literature review and domain expert verification. They are never presented as proven scientific facts.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: PDF Ingestion & OCR Advice */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
          <button
            onClick={() => toggleSection('pdf')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-sm text-white">5. PDF Ingestion &amp; Optical Character Recognition (OCR)</span>
            </div>
            {openSection === 'pdf' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSection === 'pdf' && (
            <div className="p-5 pt-0 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                PDF ingestion parses digital academic PDFs via `pdf-parse`, automatically extracting metadata:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li><strong className="text-slate-200">Readable PDFs:</strong> Title, abstract, author names, publication year, and DOI are regex-extracted and cataloged directly into SQLite.</li>
                <li><strong className="text-slate-200">Scanned or Image-Only PDFs:</strong> When a PDF contains scanned raster images without an embedded text layer, the system alerts that OCR pre-processing (such as Tesseract or Adobe OCR) is required before upload.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Section 6: Windows CMD & Deployment Instructions */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
          <button
            onClick={() => toggleSection('deployment')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-sky-400" />
              <span className="font-semibold text-sm text-white">6. Running &amp; Deploying Locally (Windows CMD &amp; Linux)</span>
            </div>
            {openSection === 'deployment' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSection === 'deployment' && (
            <div className="p-5 pt-0 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>Step-by-step instructions to run the application on your computer using Command Prompt (cmd.exe):</p>
              <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 space-y-1.5 border border-slate-800">
                <div className="text-slate-400"># 1. Clone repository from GitHub</div>
                <div>git clone https://github.com/your-username/research-intel-ai.git</div>
                <div>cd research-intel-ai</div>
                <div className="text-slate-400 mt-2"># 2. Install dependencies</div>
                <div>npm install</div>
                <div className="text-slate-400 mt-2"># 3. Create .env from template</div>
                <div>copy .env.example .env</div>
                <div className="text-slate-400 mt-2"># 4. Start full-stack development server</div>
                <div>npm run dev</div>
              </div>
              <p className="text-slate-400">
                The application starts at <strong>http://localhost:3000</strong> with automatic SQLite persistence in `/data/research_intelligence.sqlite`.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
