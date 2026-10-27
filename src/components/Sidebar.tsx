import React from 'react';
import {
  Home,
  LayoutDashboard,
  Database,
  Search,
  FileText,
  BrainCircuit,
  Layers,
  TrendingUp,
  Network,
  Sparkles,
  DownloadCloud,
  Sliders,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Bookmark,
  History,
  UploadCloud,
  Compass,
  HelpCircle
} from 'lucide-react';

export type ActiveTab =
  | 'home'
  | 'dashboard'
  | 'smart_search'
  | 'classification'
  | 'trends'
  | 'summary_assistant'
  | 'pdf_upload'
  | 'library'
  | 'history'
  | 'dataset'
  | 'explorer'
  | 'nlp'
  | 'topics'
  | 'graph'
  | 'insights'
  | 'reports'
  | 'settings'
  | 'help';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  totalPapers: number;
  totalCategories: number;
  savedCount?: number;
}

interface NavSection {
  title: string;
  items: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  totalPapers,
  totalCategories,
  savedCount = 0
}) => {
  const sections: NavSection[] = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'home', label: 'Home Landing', icon: Home },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'smart_search', label: 'Discover Papers', icon: Compass },
        { id: 'classification', label: 'Abstract Classifier', icon: BrainCircuit },
        { id: 'trends', label: 'Research Trends', icon: TrendingUp },
        { id: 'summary_assistant', label: 'AI Summarizer', icon: Sparkles },
        { id: 'pdf_upload', label: 'PDF Upload', icon: UploadCloud }
      ]
    },
    {
      title: 'SCHOLAR WORKSPACE',
      items: [
        { id: 'library', label: 'My Library', icon: Bookmark, badge: savedCount > 0 ? savedCount : undefined },
        { id: 'history', label: 'Search History', icon: History },
        { id: 'dataset', label: 'Dataset & Models', icon: Database, badge: totalPapers > 0 ? totalPapers : undefined }
      ]
    },
    {
      title: 'ANALYTICS & PIPELINE',
      items: [
        { id: 'explorer', label: 'Abstract Explorer', icon: Search },
        { id: 'nlp', label: 'NLP Pipeline', icon: FileText },
        { id: 'topics', label: 'Topic Discovery', icon: Layers },
        { id: 'graph', label: 'Knowledge Graph', icon: Network },
        { id: 'insights', label: 'Research Insights', icon: Sparkles },
        { id: 'reports', label: 'Reports & Export', icon: DownloadCloud },
        { id: 'settings', label: 'Settings & DB', icon: Sliders },
        { id: 'help', label: 'Help & Docs', icon: HelpCircle }
      ]
    }
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-slate-800/80 bg-[#0A0F1D] transition-all duration-200 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-sm font-bold tracking-tight text-white block truncate leading-none">
                ResearchIntel AI
              </span>
              <span className="text-[10px] text-cyan-400 font-medium tracking-wide uppercase">
                Discovery &amp; Analytics
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {sections.map(section => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                {section.title}
              </span>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between text-left truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 ml-1">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Quick Corpus Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/30 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Corpus Index</span>
            <span className="font-mono text-slate-300 font-semibold">{totalPapers} papers</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>Standard Categories</span>
            <span className="font-mono text-slate-400">{totalCategories}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
