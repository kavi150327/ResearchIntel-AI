import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { OpeningScreen } from './components/OpeningScreen';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { HomeLandingView } from './views/HomeLandingView';
import { HelpView } from './views/HelpView';
import { SmartSearchView } from './views/SmartSearchView';
import { PdfUploadView } from './views/PdfUploadView';
import { LibraryView } from './views/LibraryView';
import { SearchHistoryView } from './views/SearchHistoryView';
import { AiSummaryView } from './views/AiSummaryView';
import { DashboardView } from './views/DashboardView';
import { DatasetView } from './views/DatasetView';
import { ExplorerView } from './views/ExplorerView';
import { NlpView } from './views/NlpView';
import { ClassificationView } from './views/ClassificationView';
import { TopicView } from './views/TopicView';
import { TrendsView } from './views/TrendsView';
import { KnowledgeGraphView } from './views/KnowledgeGraphView';
import { AiInsightsView } from './views/AiInsightsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import {
  DatasetMeta,
  DiscoveredTopic,
  EvaluationResults,
  ResearchPaper,
  TrendAnalysisResult,
  User,
  ValidationSummary
} from './types';
import { SYNTHETIC_RESEARCH_PAPERS, getSampleDatasetCsv } from './data/sampleDataset';
import { validateDataset } from './services/dataService';
import { DEFAULT_PREPROCESSING_CONFIG, preprocessDataset } from './services/nlpEngine';
import { DEFAULT_TFIDF_CONFIG, fitTfidf, trainAndEvaluateClassifier } from './services/mlEngine';
import { runKMeansClustering } from './services/topicEngine';
import { computeTrendAnalytics } from './services/trendEngine';
import { apiClient } from './services/apiClient';

export default function App() {
  const [showOpeningScreen, setShowOpeningScreen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, startTransition] = useTransition();

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Cross-view selection for AI Summary
  const [summaryPaper, setSummaryPaper] = useState<ResearchPaper | null>(null);

  // Application Corpus State
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta | null>(null);
  const [allDatasets, setAllDatasets] = useState<DatasetMeta[]>([]);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResults | null>(null);
  const [topics, setTopics] = useState<DiscoveredTopic[]>([]);
  const [trends, setTrends] = useState<TrendAnalysisResult | null>(null);

  // SQLite stats & Backend connectivity
  const [backendStatus, setBackendStatus] = useState<'connected' | 'checking' | 'fallback'>('checking');
  const [sqliteStats, setSqliteStats] = useState<{ fileSizeBytes: number; rowCount: number } | undefined>(undefined);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev.slice(-3), { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check user session
  const verifySession = useCallback(async () => {
    try {
      const res = await apiClient.getMe();
      if (res?.user) {
        setCurrentUser(res.user);
        const library = await apiClient.getLibrary();
        setSavedCount(library.length);
      }
    } catch {
      // Not logged in or expired token
    }
  }, []);

  // Local fallback algorithm runner
  const initializeLocalBenchmark = useCallback(() => {
    const raw = SYNTHETIC_RESEARCH_PAPERS;
    const valid = validateDataset(raw);
    const preprocessed = preprocessDataset(raw, DEFAULT_PREPROCESSING_CONFIG);

    const tokens = preprocessed.map(p => p.tokens || []);
    const tfidf = fitTfidf(tokens, DEFAULT_TFIDF_CONFIG);
    const topicResult = runKMeansClustering(preprocessed, tfidf, 5);

    const classResult = trainAndEvaluateClassifier(
      topicResult.updatedPapers,
      'multinomial_nb',
      DEFAULT_TFIDF_CONFIG,
      0.75
    );

    const trendResult = computeTrendAnalytics(classResult.updatedPapers, topicResult.topics);
    const categories = Array.from(new Set(raw.map(p => p.category))).sort();

    const meta: DatasetMeta = {
      id: 'sample-benchmark-corpus',
      name: 'Benchmark AI & DS Research Corpus',
      filename: 'synthetic_research_benchmark.csv',
      recordCount: raw.length,
      categories,
      yearRange: [2019, 2026],
      hasLabels: true,
      uploadedAt: new Date().toISOString(),
      status: 'analyzed',
      isSyntheticSample: true
    };

    setPapers(classResult.updatedPapers);
    setDatasetMeta(meta);
    setValidation(valid);
    setEvaluation(classResult.evaluation);
    setTopics(topicResult.topics);
    setTrends(trendResult);
    setAllDatasets([meta]);
  }, []);

  // Fetch from SQLite database on mount
  const loadDatasetFromBackend = useCallback(async (datasetId?: string) => {
    try {
      const health = await apiClient.checkHealth();
      setBackendStatus('connected');
      if (health.database) {
        const totalRows = health.database.tables?.reduce((acc: number, t: any) => acc + (t.rowCount || 0), 0) || 0;
        setSqliteStats({ fileSizeBytes: health.database.fileSizeBytes, rowCount: totalRows });
      }

      const list = await apiClient.listDatasets();
      setAllDatasets(list);

      const targetId = datasetId || list[0]?.id || 'sample-benchmark-corpus';
      const bundle = await apiClient.getDataset(targetId);

      setPapers(bundle.papers);
      setDatasetMeta(bundle.meta);
      setValidation(bundle.validation);
      setEvaluation(bundle.evaluation);
      setTopics(bundle.topics);
      setTrends(bundle.trends);
    } catch (err) {
      console.warn('[Full-Stack] Falling back to local offline engine:', err);
      setBackendStatus('fallback');
      initializeLocalBenchmark();
    }
  }, [initializeLocalBenchmark]);

  useEffect(() => {
    verifySession();
    loadDatasetFromBackend();
  }, [verifySession, loadDatasetFromBackend]);

  // Handle Upload
  const handleUpdatePapersFromUpload = async (newPapers: ResearchPaper[], meta: DatasetMeta) => {
    try {
      if (backendStatus === 'connected') {
        const res = await apiClient.uploadDataset(meta.name, meta.filename, newPapers);
        await loadDatasetFromBackend(res.datasetId);
        addToast('success', 'Dataset Uploaded to SQLite', `Saved ${newPapers.length} records to SQLite database.`);
      } else {
        const valid = validateDataset(newPapers);
        const preprocessed = preprocessDataset(newPapers, DEFAULT_PREPROCESSING_CONFIG);
        setPapers(preprocessed);
        setDatasetMeta(meta);
        setValidation(valid);
        setEvaluation(null);
        setTopics([]);
        setTrends(computeTrendAnalytics(preprocessed, []));
        setAllDatasets(prev => [meta, ...prev.filter(d => d.id !== meta.id)]);
        addToast('success', 'Dataset Loaded Locally', `Processed ${newPapers.length} records.`);
      }
      setActiveTab('dataset');
    } catch (err: any) {
      addToast('error', 'Upload Error', err.message);
    }
  };

  // Handle Preprocessing
  const handleUpdatePapersFromNlp = async (updatedPapers: ResearchPaper[]) => {
    setPapers(updatedPapers);
    if (datasetMeta && backendStatus === 'connected') {
      try {
        await apiClient.preprocess(datasetMeta.id, DEFAULT_PREPROCESSING_CONFIG);
        addToast('success', 'Preprocessing Synchronized', `Updated tokens in SQLite database.`);
      } catch (err: any) {
        console.warn('Backend sync failed:', err);
      }
    }
    if (topics.length > 0) {
      const newTrends = computeTrendAnalytics(updatedPapers, topics);
      setTrends(newTrends);
    }
  };

  // Handle Evaluation update
  const handleUpdateEvaluation = (
    newEval: EvaluationResults,
    updatedPapers: ResearchPaper[]
  ) => {
    setEvaluation(newEval);
    setPapers(updatedPapers);
    addToast(
      'success',
      `Trained ${newEval.modelName}`,
      `Held-out accuracy: ${(newEval.accuracy * 100).toFixed(1)}% on ${newEval.testCount} test abstracts.`
    );
  };

  // Handle Topics update
  const handleUpdateTopics = (
    newTopics: DiscoveredTopic[],
    updatedPapers: ResearchPaper[]
  ) => {
    setTopics(newTopics);
    setPapers(updatedPapers);
    const newTrends = computeTrendAnalytics(updatedPapers, newTopics);
    setTrends(newTrends);
    addToast('success', 'Topic Clusters Updated', `Clustered into ${newTopics.length} semantic topics.`);
  };

  // Handle Delete
  const handleDeleteDataset = async () => {
    if (!datasetMeta) return;
    try {
      if (backendStatus === 'connected' && datasetMeta.id !== 'sample-benchmark-corpus') {
        await apiClient.deleteDataset(datasetMeta.id);
      }
      setPapers([]);
      setDatasetMeta(null);
      setValidation(null);
      setEvaluation(null);
      setTopics([]);
      setTrends(null);
      setAllDatasets(prev => prev.filter(d => d.id !== datasetMeta.id));
      addToast('info', 'Dataset Deleted', 'Removed from active workspace and SQLite database.');
      setActiveTab('dataset');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const csv = getSampleDatasetCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synthetic_academic_abstracts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', 'Downloaded CSV Template', 'synthetic_academic_abstracts_template.csv');
  };

  // Reload benchmark
  const handleReloadBenchmark = async () => {
    await loadDatasetFromBackend('sample-benchmark-corpus');
    addToast('success', 'Benchmark Dataset Loaded', '64 multi-domain papers loaded from SQLite.');
  };

  const tabTitles: Record<ActiveTab, string> = {
    home: 'ResearchIntel AI — Home Landing',
    smart_search: 'Discover Research Papers (OpenAlex, Crossref & SQLite)',
    dashboard: 'Research Analytics Dashboard & Live Metrics',
    classification: 'Machine Learning Abstract Classification & Active Learning',
    trends: 'Research Publication & Keyword Trends Discovery',
    summary_assistant: 'Structured AI Research Assistant & Synthesis',
    pdf_upload: 'PDF Paper Ingestion & Text Parser',
    library: 'My Research Library & Bookmarks',
    history: 'Academic Search Audit Trail',
    dataset: 'Dataset Management & Model Registry',
    explorer: 'Academic Abstract Explorer',
    nlp: 'Scientific NLP Preprocessing Pipeline',
    topics: 'Unsupervised Topic Discovery',
    graph: 'Interactive Knowledge Graph',
    insights: 'Empirical Research Insights',
    reports: 'Reports & Export Center',
    settings: 'Settings & Database Configuration',
    help: 'Help Center & Architecture Guide'
  };

  if (showOpeningScreen) {
    return <OpeningScreen onEnter={() => setShowOpeningScreen(false)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070B14] text-slate-100">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={user => {
          setCurrentUser(user);
          addToast('success', 'Welcome, ' + user.full_name, 'Signed in successfully.');
          apiClient.getLibrary().then(l => setSavedCount(l.length)).catch(() => {});
        }}
        onLogout={() => {
          apiClient.setToken(null);
          setCurrentUser(null);
          setSavedCount(0);
          addToast('info', 'Signed Out', 'Your session has ended.');
        }}
      />

      {/* Collapsible Sidebar with Grouped Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={tab => startTransition(() => setActiveTab(tab))}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        totalPapers={papers.length}
        totalCategories={trends?.categoryTotals.length || 0}
        savedCount={savedCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentTabName={tabTitles[activeTab]}
          datasetMeta={datasetMeta}
          allDatasets={allDatasets}
          onSelectDataset={id => loadDatasetFromBackend(id)}
          onLoadSample={handleReloadBenchmark}
          onDownloadSampleCsv={handleDownloadSampleCsv}
          backendStatus={backendStatus}
          sqliteStats={sqliteStats}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Tab View Container */}
        <main className="flex-1 overflow-y-auto bg-[#070B14]">
          {/* HOME LANDING VIEW */}
          {activeTab === 'home' && (
            <HomeLandingView
              onNavigateTab={tab => setActiveTab(tab)}
              onSearchQuery={q => {
                setSearchQuery(q);
                setActiveTab('smart_search');
              }}
              totalPapers={papers.length}
              totalCategories={trends?.categoryTotals.length || 0}
              dbSizeBytes={sqliteStats?.fileSizeBytes}
              recentPapers={papers.slice(0, 5)}
            />
          )}

          {/* DISCOVER & RESEARCH VIEWS */}
          {activeTab === 'smart_search' && (
            <SmartSearchView
              initialQuery={searchQuery}
              onSelectPaperForSummary={p => {
                setSummaryPaper(p);
                setActiveTab('summary_assistant');
              }}
              onPaperSaved={() => setSavedCount(c => c + 1)}
            />
          )}

          {activeTab === 'summary_assistant' && (
            <AiSummaryView
              initialPaper={summaryPaper}
              corpusPapers={papers}
            />
          )}

          {activeTab === 'pdf_upload' && (
            <PdfUploadView
              onPaperCataloged={p => {
                setPapers(prev => [p, ...prev]);
                addToast('success', 'Paper Cataloged', p.title);
              }}
              onNavigateToSummary={p => {
                setSummaryPaper(p);
                setActiveTab('summary_assistant');
              }}
            />
          )}

          {activeTab === 'library' && (
            <LibraryView
              onSelectPaperForSummary={p => {
                setSummaryPaper(p);
                setActiveTab('summary_assistant');
              }}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'history' && (
            <SearchHistoryView
              onReplaySearch={() => {
                setActiveTab('smart_search');
              }}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {/* AI / ML ANALYTICS VIEWS */}
          {activeTab === 'dashboard' && (
            <DashboardView
              papers={papers}
              validation={validation}
              evaluation={evaluation}
              topics={topics}
              trends={trends}
              onNavigateTab={tab => setActiveTab(tab)}
              onLoadSample={handleReloadBenchmark}
            />
          )}

          {activeTab === 'dataset' && (
            <DatasetView
              papers={papers}
              datasetMeta={datasetMeta}
              validation={validation}
              onUpdatePapers={handleUpdatePapersFromUpload}
              onLoadSample={handleReloadBenchmark}
              onDownloadSampleCsv={handleDownloadSampleCsv}
              onDeleteDataset={handleDeleteDataset}
            />
          )}

          {activeTab === 'explorer' && (
            <ExplorerView papers={papers} topics={topics} />
          )}

          {activeTab === 'nlp' && (
            <NlpView papers={papers} onUpdatePapers={handleUpdatePapersFromNlp} />
          )}

          {activeTab === 'classification' && (
            <ClassificationView
              papers={papers}
              evaluation={evaluation}
              onUpdateEvaluation={handleUpdateEvaluation}
            />
          )}

          {activeTab === 'topics' && (
            <TopicView
              papers={papers}
              topics={topics}
              onUpdateTopics={handleUpdateTopics}
            />
          )}

          {activeTab === 'trends' && <TrendsView trends={trends} />}

          {activeTab === 'graph' && (
            <KnowledgeGraphView papers={papers} topics={topics} />
          )}

          {activeTab === 'insights' && (
            <AiInsightsView papers={papers} topics={topics} trends={trends} />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              papers={papers}
              validation={validation}
              evaluation={evaluation}
              topics={topics}
              trends={trends}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              backendStatus={backendStatus}
              onCheckBackend={() => loadDatasetFromBackend(datasetMeta?.id)}
            />
          )}

          {activeTab === 'help' && <HelpView />}
        </main>
      </div>
    </div>
  );
}
