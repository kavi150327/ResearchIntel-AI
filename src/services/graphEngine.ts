import { DiscoveredTopic, GraphEdge, GraphNode, KnowledgeGraphData, ResearchPaper } from '../types';

/**
 * Builds a strict evidence-based Knowledge Graph from actual dataset records.
 * Generates nodes for Categories, Discovered Topics, Top Keywords, and Research Documents.
 * Edges represent actual categorical affiliations, topic assignments, and keyword linkages.
 */
export function buildKnowledgeGraph(
  papers: ResearchPaper[],
  topics: DiscoveredTopic[] = []
): KnowledgeGraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const categorySet = new Set<string>();
  const topicMap = new Map<number, string>();
  const keywordCountMap = new Map<string, number>();

  papers.forEach(p => {
    if (p.category) categorySet.add(p.category);
    p.keywords?.forEach(kw => {
      const clean = kw.trim().toLowerCase();
      if (clean) keywordCountMap.set(clean, (keywordCountMap.get(clean) || 0) + 1);
    });
  });

  topics.forEach(t => topicMap.set(t.id, t.label));

  // 1. Category Nodes (Electric Blue)
  const categories = Array.from(categorySet).sort();
  categories.forEach(cat => {
    nodes.push({
      id: `cat-${cat}`,
      label: cat,
      type: 'category',
      val: 24,
      color: '#38BDF8', // cyan-400
      group: 'category',
      category: cat
    });
  });

  // 2. Topic Nodes (Violet / Purple)
  topics.forEach(t => {
    nodes.push({
      id: `topic-${t.id}`,
      label: t.label,
      type: 'topic',
      val: 18,
      color: '#A855F7', // violet-500
      group: 'topic',
      topicId: t.id
    });
  });

  // 3. Prominent Keyword Nodes (occurred at least 2 times, limit to top 20 to maintain high readability)
  const topKeywords = Array.from(keywordCountMap.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  topKeywords.forEach(([kw, count]) => {
    nodes.push({
      id: `kw-${kw}`,
      label: kw,
      type: 'keyword',
      val: 10 + count * 2,
      color: '#2DD4BF', // teal-400
      group: 'keyword'
    });
  });

  // 4. Document Nodes (Navy/Slate with accent border)
  // Limit active papers in graph to avoid unreadable dense clutter if dataset is huge, e.g. up to 64
  const samplePapers = papers.slice(0, 64);
  samplePapers.forEach(paper => {
    nodes.push({
      id: `doc-${paper.id}`,
      label: paper.title.length > 36 ? paper.title.slice(0, 36) + '...' : paper.title,
      type: 'document',
      val: 8,
      color: '#94A3B8', // slate-400
      group: paper.category || 'document',
      category: paper.category,
      topicId: paper.topic_id,
      year: paper.publication_year,
      abstractPreview: paper.abstract.slice(0, 160) + '...'
    });

    // Edge: Document -> Category (Explicit metadata)
    if (paper.category && categorySet.has(paper.category)) {
      edges.push({
        id: `e-cat-${paper.id}-${paper.category}`,
        source: `doc-${paper.id}`,
        target: `cat-${paper.category}`,
        type: 'belongs_to_category',
        weight: 1.5
      });
    }

    // Edge: Document -> Topic (Unsupervised assignment)
    if (paper.topic_id && topicMap.has(paper.topic_id)) {
      edges.push({
        id: `e-topic-${paper.id}-${paper.topic_id}`,
        source: `doc-${paper.id}`,
        target: `topic-${paper.topic_id}`,
        type: 'assigned_to_topic',
        weight: 1.2
      });
    }

    // Edge: Document -> Keyword
    paper.keywords?.forEach(kw => {
      const clean = kw.trim().toLowerCase();
      if (keywordCountMap.has(clean) && topKeywords.some(tk => tk[0] === clean)) {
        edges.push({
          id: `e-kw-${paper.id}-${clean}`,
          source: `doc-${paper.id}`,
          target: `kw-${clean}`,
          type: 'has_keyword',
          weight: 1.0
        });
      }
    });
  });

  return {
    nodes,
    edges,
    categories,
    topics: topics.map(t => ({ id: t.id, label: t.label }))
  };
}
