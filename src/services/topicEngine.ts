import { DiscoveredTopic, ResearchPaper } from '../types';
import { FittedTfidfModel, transformTfidf } from './mlEngine';

/**
 * Cosine distance between two normalized vectors: 1 - (A dot B)
 */
function cosineDistance(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, 1 - dot);
}

/**
 * Cosine similarity between two normalized vectors: A dot B
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * K-Means++ clustering on TF-IDF vectors
 */
export function runKMeansClustering(
  papers: ResearchPaper[],
  tfidfModel: FittedTfidfModel,
  k = 5,
  maxIterations = 40
): {
  topics: DiscoveredTopic[];
  updatedPapers: ResearchPaper[];
} {
  const validPapers = papers.filter(p => p.tokens && p.tokens.length > 0);
  if (validPapers.length < k) {
    throw new Error(`Insufficient abstracts for clustering: found ${validPapers.length} valid abstracts, but ${k} topics were requested.`);
  }

  const numFeatures = tfidfModel.featureNames.length;
  const vectors: Float32Array[] = validPapers.map(p => transformTfidf(p.tokens!, tfidfModel).vector);
  const N = vectors.length;

  // 1. K-Means++ Initialization
  const centroids: Float32Array[] = [];
  // Pick first centroid deterministically (index 0 or median)
  centroids.push(new Float32Array(vectors[0]));

  for (let c = 1; c < k; c++) {
    const distances = new Float32Array(N);
    let sumDist = 0;

    for (let i = 0; i < N; i++) {
      let minDist = Infinity;
      for (let j = 0; j < centroids.length; j++) {
        const d = cosineDistance(vectors[i], centroids[j]);
        if (d < minDist) minDist = d;
      }
      distances[i] = minDist * minDist;
      sumDist += distances[i];
    }

    // Weighted selection (deterministic pseudo-random seed based on index and count)
    const threshold = (sumDist * ((c * 17) % 100)) / 100;
    let accum = 0;
    let selectedIdx = N - 1;

    for (let i = 0; i < N; i++) {
      accum += distances[i];
      if (accum >= threshold) {
        selectedIdx = i;
        break;
      }
    }
    centroids.push(new Float32Array(vectors[selectedIdx]));
  }

  // 2. Iterative optimization
  let assignments = new Int32Array(N).fill(-1);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assignment step
    for (let i = 0; i < N; i++) {
      let bestCluster = 0;
      let minDistance = Infinity;

      for (let c = 0; c < k; c++) {
        const dist = cosineDistance(vectors[i], centroids[c]);
        if (dist < minDistance) {
          minDistance = dist;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed && iter > 0) break;

    // Update step: recompute centroids
    const clusterSizes = new Array(k).fill(0);
    const newCentroids: Float32Array[] = Array.from({ length: k }, () => new Float32Array(numFeatures));

    for (let i = 0; i < N; i++) {
      const c = assignments[i];
      clusterSizes[c]++;
      const v = vectors[i];
      for (let f = 0; f < numFeatures; f++) {
        newCentroids[c][f] += v[f];
      }
    }

    for (let c = 0; c < k; c++) {
      if (clusterSizes[c] > 0) {
        // Normalize centroid vector to unit sphere
        let normSq = 0;
        for (let f = 0; f < numFeatures; f++) {
          normSq += newCentroids[c][f] * newCentroids[c][f];
        }
        const norm = Math.sqrt(normSq);
        if (norm > 0) {
          for (let f = 0; f < numFeatures; f++) {
            centroids[c][f] = newCentroids[c][f] / norm;
          }
        }
      }
    }
  }

  // 3. Extract top terms for each topic cluster
  const topics: DiscoveredTopic[] = [];

  for (let c = 0; c < k; c++) {
    const centroid = centroids[c];
    const termScores: { term: string; score: number }[] = [];

    for (let f = 0; f < numFeatures; f++) {
      if (centroid[f] > 0.001) {
        termScores.push({
          term: tfidfModel.featureNames[f],
          score: Math.round(centroid[f] * 1000) / 1000
        });
      }
    }

    termScores.sort((a, b) => b.score - a.score);
    const topTerms = termScores.slice(0, 7);

    // Compute paper count and year distribution
    const assignedPapers: { paper: ResearchPaper; sim: number }[] = [];
    const yearDistribution: Record<number, number> = {};

    for (let i = 0; i < N; i++) {
      if (assignments[i] === c) {
        const paper = validPapers[i];
        const sim = cosineSimilarity(vectors[i], centroid);
        assignedPapers.push({ paper, sim });

        const year = paper.publication_year;
        if (year) {
          yearDistribution[year] = (yearDistribution[year] || 0) + 1;
        }
      }
    }

    assignedPapers.sort((a, b) => b.sim - a.sim);

    // Generate descriptive label from top 3 terms
    const topTermLabels = topTerms.slice(0, 3).map(t => {
      // Clean up bigram underscores
      return t.term.replace(/_/g, ' ');
    });
    const defaultLabel = topTermLabels.length > 0
      ? topTermLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')
      : `Discovered Topic #${c + 1}`;

    const representativePapers = assignedPapers.slice(0, 4).map(item => ({
      id: item.paper.id,
      title: item.paper.title,
      similarity: Math.round(item.sim * 1000) / 1000
    }));

    topics.push({
      id: c + 1,
      label: defaultLabel,
      topTerms,
      paperCount: assignedPapers.length,
      percentage: Math.round((assignedPapers.length / N) * 1000) / 10,
      yearDistribution,
      representativePapers
    });
  }

  // Sort topics by paper count descending
  topics.sort((a, b) => b.paperCount - a.paperCount);

  // Map topic labels and IDs back onto papers
  const paperTopicMap = new Map<string, { topicId: number; topicLabel: string }>();
  topics.forEach(topic => {
    topic.representativePapers.forEach(rep => {
      // handled below by exact assignment
    });
  });

  for (let i = 0; i < N; i++) {
    const clusterIdx = assignments[i];
    const topic = topics.find(t => t.id === clusterIdx + 1) || topics[0];
    paperTopicMap.set(validPapers[i].id, {
      topicId: topic.id,
      topicLabel: topic.label
    });
  }

  const updatedPapers = papers.map(paper => {
    const match = paperTopicMap.get(paper.id);
    if (match) {
      return {
        ...paper,
        topic_id: match.topicId,
        topic_label: match.topicLabel
      };
    }
    return paper;
  });

  return {
    topics,
    updatedPapers
  };
}
