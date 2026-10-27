import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Edit2,
  Check,
  FileText,
  Calendar,
  BarChart2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { DiscoveredTopic, ResearchPaper } from '../types';
import { runKMeansClustering } from '../services/topicEngine';
import { fitTfidf, DEFAULT_TFIDF_CONFIG } from '../services/mlEngine';

interface TopicViewProps {
  papers: ResearchPaper[];
  topics: DiscoveredTopic[];
  onUpdateTopics: (topics: DiscoveredTopic[], updatedPapers: ResearchPaper[]) => void;
}

export const TopicView: React.FC<TopicViewProps> = ({
  papers,
  topics,
  onUpdateTopics
}) => {
  const [numTopics, setNumTopics] = useState(5);
  const [isClustering, setIsClustering] = useState(false);
  const [clusteringError, setClusteringError] = useState<string | null>(null);

  // Editable topic labels
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editedLabel, setEditedLabel] = useState('');

  // Selected topic for inspecting assigned papers
  const [activeTopicId, setActiveTopicId] = useState<number | null>(topics[0]?.id || null);

  const handleRunTopicDiscovery = () => {
    setIsClustering(true);
    setClusteringError(null);

    setTimeout(() => {
      try {
        const tokens = papers.map(p => p.tokens || []);
        const tfidfModel = fitTfidf(tokens, DEFAULT_TFIDF_CONFIG);
        const result = runKMeansClustering(papers, tfidfModel, numTopics);
        onUpdateTopics(result.topics, result.updatedPapers);
        setActiveTopicId(result.topics[0]?.id || null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Clustering failed.';
        setClusteringError(msg);
      } finally {
        setIsClustering(false);
      }
    }, 150);
  };

  const handleSaveLabel = (topicId: number) => {
    if (!editedLabel.trim()) return;
    const updatedTopics = topics.map(t =>
      t.id === topicId ? { ...t, label: editedLabel.trim() } : t
    );
    const updatedPapers = papers.map(p =>
      p.topic_id === topicId ? { ...p, topic_label: editedLabel.trim() } : p
    );
    onUpdateTopics(updatedTopics, updatedPapers);
    setEditingTopicId(null);
  };

  const activeTopic = topics.find(t => t.id === activeTopicId) || topics[0];
  const activeTopicPapers = activeTopic
    ? papers.filter(p => p.topic_id === activeTopic.id)
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cluster Runner Controls */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" />
              <span>Unsupervised Topic Discovery (K-Means++ Semantic Clustering)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Discovers latent thematic groupings without supervision. Initializes centroids via K-Means++, iteratively converges on cosine distances, extracts characteristic vocabulary features from cluster centers, and surfaces representative benchmark papers.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Clusters (k):</span>
              <input
                type="range"
                min="2"
                max="8"
                value={numTopics}
                onChange={e => setNumTopics(parseInt(e.target.value, 10))}
                className="w-24 accent-violet-500 cursor-pointer"
              />
              <span className="font-mono text-cyan-400 font-bold text-sm w-4">{numTopics}</span>
            </div>

            <button
              onClick={handleRunTopicDiscovery}
              disabled={isClustering || papers.length < numTopics}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isClustering ? 'animate-spin' : ''}`} />
              <span>{isClustering ? 'Clustering...' : 'Discover Topics'}</span>
            </button>
          </div>
        </div>

        {clusteringError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {clusteringError}
          </div>
        )}
      </div>

      {/* Discovered Topic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map(topic => {
          const isSelected = activeTopicId === topic.id;
          const isEditing = editingTopicId === topic.id;

          return (
            <div
              key={topic.id}
              onClick={() => setActiveTopicId(topic.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-violet-500 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-violet-500/50'
                  : 'bg-[#0D1527] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Topic Header & Editable Label */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[11px] font-mono font-bold">
                      Topic #{topic.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {topic.paperCount} papers ({topic.percentage}%)
                    </span>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingTopicId(topic.id);
                      setEditedLabel(topic.label);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    title="Edit topic label"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isEditing ? (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 my-2"
                  >
                    <input
                      type="text"
                      value={editedLabel}
                      onChange={e => setEditedLabel(e.target.value)}
                      className="flex-1 py-1 px-2 rounded bg-slate-950 border border-violet-500 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveLabel(topic.id)}
                      className="p-1 rounded bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                    {topic.label}
                  </h4>
                )}

                {/* Characteristic Vocabulary Terms */}
                <div className="mt-3">
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">
                    Top Salient Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.topTerms.slice(0, 5).map(term => (
                      <span
                        key={term.term}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300"
                      >
                        {term.term.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Year Spread Mini Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Years:</span>
                <span className="font-mono text-slate-300">
                  {Object.keys(topic.yearDistribution).sort().join(', ') || 'N/A'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Topic Assigned Papers Inspection */}
      {activeTopic && (
        <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-violet-400 font-mono">Topic #{activeTopic.id}:</span>
                <span>{activeTopic.label}</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTopicPapers.length} papers assigned to this cluster by minimum cosine distance to centroid
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTopicPapers.map(paper => (
              <div
                key={paper.id}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-200 leading-snug">{paper.title}</h5>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {paper.publication_year}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {paper.abstract}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span className="text-cyan-400 font-medium">{paper.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{paper.authors?.slice(0, 2).join(', ') || 'Anonymous'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
