import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  BrainCircuit,
  FileText,
  Tag,
  Filter,
  X
} from 'lucide-react';
import { DiscoveredTopic, GraphEdge, GraphNode, ResearchPaper } from '../types';
import { buildKnowledgeGraph } from '../services/graphEngine';

interface KnowledgeGraphViewProps {
  papers: ResearchPaper[];
  topics: DiscoveredTopic[];
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ papers, topics }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [selectedNode, setSelectedNode] = useState<PositionedNode | null>(null);

  // Zoom and Pan transform
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Build raw graph
  const rawGraph = useMemo(() => {
    return buildKnowledgeGraph(papers, topics);
  }, [papers, topics]);

  // Filtered nodes and edges
  const { filteredNodes, filteredEdges } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    rawGraph.nodes.forEach(n => nodeMap.set(n.id, n));

    const matchedNodeIds = new Set<string>();

    rawGraph.nodes.forEach(n => {
      let keep = true;
      if (categoryFilter !== 'ALL') {
        if (n.type === 'category' && n.category !== categoryFilter) keep = false;
        if (n.type === 'document' && n.category !== categoryFilter) keep = false;
      }
      if (topicFilter !== 'ALL') {
        if (n.type === 'topic' && String(n.topicId) !== topicFilter) keep = false;
        if (n.type === 'document' && String(n.topicId) !== topicFilter) keep = false;
      }
      if (keep) matchedNodeIds.add(n.id);
    });

    const activeEdges = rawGraph.edges.filter(
      e => matchedNodeIds.has(e.source) && matchedNodeIds.has(e.target)
    );

    const activeNodes = rawGraph.nodes.filter(n => matchedNodeIds.has(n.id));

    return { filteredNodes: activeNodes, filteredEdges: activeEdges };
  }, [rawGraph, categoryFilter, topicFilter]);

  // Node position simulation
  const positionedNodes = useRef<Map<string, PositionedNode>>(new Map());

  // Initialize node layout positions in circular/clustered anchors
  useEffect(() => {
    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const newMap = new Map<string, PositionedNode>();

    filteredNodes.forEach((node, idx) => {
      let x = centerX;
      let y = centerY;

      if (node.type === 'category') {
        const angle = (idx / Math.max(1, rawGraph.categories.length)) * Math.PI * 2;
        x = centerX + Math.cos(angle) * 220;
        y = centerY + Math.sin(angle) * 220;
      } else if (node.type === 'topic') {
        const angle = (idx / Math.max(1, rawGraph.topics.length)) * Math.PI * 2 + 0.5;
        x = centerX + Math.cos(angle) * 140;
        y = centerY + Math.sin(angle) * 140;
      } else if (node.type === 'keyword') {
        const angle = Math.random() * Math.PI * 2;
        const radius = 280 + Math.random() * 60;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else {
        // Document
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 200;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }

      newMap.set(node.id, {
        ...node,
        x,
        y,
        vx: 0,
        vy: 0
      });
    });

    positionedNodes.current = newMap;
  }, [filteredNodes, rawGraph.categories.length, rawGraph.topics.length]);

  // Connected neighborhood calculation for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return null;
    const set = new Set<string>([selectedNode.id]);
    filteredEdges.forEach(e => {
      if (e.source === selectedNode.id) set.add(e.target);
      if (e.target === selectedNode.id) set.add(e.source);
    });
    return set;
  }, [selectedNode, filteredEdges]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    const height = (canvas.height = 620);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw Edges
      filteredEdges.forEach(edge => {
        const src = positionedNodes.current.get(edge.source);
        const tgt = positionedNodes.current.get(edge.target);
        if (!src || !tgt) return;

        const isHighlighted =
          !connectedNodeIds ||
          (connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target));

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (edge.type === 'belongs_to_category') {
          ctx.strokeStyle = isHighlighted ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.08)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
        } else if (edge.type === 'assigned_to_topic') {
          ctx.strokeStyle = isHighlighted ? 'rgba(168, 85, 247, 0.45)' : 'rgba(168, 85, 247, 0.08)';
          ctx.lineWidth = 1.0;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = isHighlighted ? 'rgba(45, 212, 191, 0.35)' : 'rgba(45, 212, 191, 0.06)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 2]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Nodes
      positionedNodes.current.forEach(node => {
        const isSelected = selectedNode?.id === node.id;
        const isConnected = !connectedNodeIds || connectedNodeIds.has(node.id);

        const radius = node.type === 'category' ? 16 : node.type === 'topic' ? 12 : node.type === 'keyword' ? 8 : 6;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

        // Fill color
        let fill = node.color || '#94A3B8';
        if (!isConnected) {
          fill = 'rgba(71, 85, 105, 0.2)';
        }
        ctx.fillStyle = fill;

        if (isSelected) {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 16;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
        } else {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#070B14';
          ctx.lineWidth = 1;
        }

        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label rendering for key nodes
        if (node.type === 'category' || node.type === 'topic' || isSelected || zoom > 1.3) {
          ctx.font = node.type === 'category' ? 'bold 11px sans-serif' : '10px sans-serif';
          ctx.fillStyle = isConnected ? '#F8FAFC' : 'rgba(148, 163, 184, 0.3)';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + radius + 12);
        }
      });

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [filteredEdges, pan, zoom, selectedNode, connectedNodeIds]);

  // Click handler to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    let clicked: PositionedNode | null = null;

    positionedNodes.current.forEach(node => {
      const radius = node.type === 'category' ? 18 : 12;
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      if (dx * dx + dy * dy <= radius * radius) {
        clicked = node;
      }
    });

    setSelectedNode(clicked);
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Controls Bar */}
      <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>Interactive Multi-Entity Research Knowledge Graph</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Nodes represent categories (cyan), discovered topics (violet), keywords (teal), and papers (slate). Edges represent real dataset affiliations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            {rawGraph.categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Topic Filter */}
          <select
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
            className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Topics</option>
            {rawGraph.topics.map(t => (
              <option key={t.id} value={String(t.id)}>
                Topic #{t.id}
              </option>
            ))}
          </select>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
              className="p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
              className="p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setSelectedNode(null);
              }}
              className="p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Canvas Container */}
      <div className="relative rounded-xl bg-[#090E1B] border border-slate-800/80 overflow-hidden shadow-inner h-[620px]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs space-y-1.5 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Category Domain Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-400" />
            <span className="text-slate-300">Semantic Topic Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <span className="text-slate-300">Keyword Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-slate-300">Research Abstract Document</span>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 p-4 rounded-xl bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 text-xs space-y-3 shadow-2xl">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  {selectedNode.type} Node
                </span>
                <h4 className="text-sm font-bold text-white leading-snug mt-0.5">
                  {selectedNode.label}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedNode.type === 'document' && (
              <div className="space-y-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[11px]">Category</span>
                  <span className="text-cyan-400 font-medium">{selectedNode.category}</span>
                </div>
                {selectedNode.year && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Year</span>
                    <span className="font-mono text-slate-200">{selectedNode.year}</span>
                  </div>
                )}
                {selectedNode.abstractPreview && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Excerpt</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900 p-2 rounded border border-slate-800">
                      {selectedNode.abstractPreview}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedNode.type === 'category' && (
              <p className="text-slate-400 text-xs">
                Anchors all documents labeled with the '{selectedNode.label}' domain.
              </p>
            )}

            {selectedNode.type === 'topic' && (
              <p className="text-slate-400 text-xs">
                Clustered topic containing papers with shared vocabulary features.
              </p>
            )}

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              Click graph backdrop or drag canvas to explore neighborhood connections.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
