import { DiscoveredTopic, EmergingTopicCandidate, ResearchPaper, TrendAnalysisResult } from '../types';

/**
 * Computes publication volume trends, category trajectories, topic evolution over time,
 * and transparent emerging-topic candidacy scores.
 */
export function computeTrendAnalytics(
  papers: ResearchPaper[],
  topics: DiscoveredTopic[] = []
): TrendAnalysisResult {
  const validPapers = papers.filter(p => p.publication_year && p.publication_year > 1950);

  // Extract sorted unique years
  const yearSet = new Set<number>();
  validPapers.forEach(p => yearSet.add(p.publication_year));
  const years = Array.from(yearSet).sort((a, b) => a - b);

  // 1. Publications per year
  const yearlyCountsMap = new Map<number, number>();
  validPapers.forEach(p => {
    yearlyCountsMap.set(p.publication_year, (yearlyCountsMap.get(p.publication_year) || 0) + 1);
  });
  const yearlyPublicationCounts = years.map(y => ({
    year: y,
    count: yearlyCountsMap.get(y) || 0
  }));

  // 2. Category totals and breakdown
  const categoryCountMap = new Map<string, number>();
  validPapers.forEach(p => {
    if (p.category) {
      categoryCountMap.set(p.category, (categoryCountMap.get(p.category) || 0) + 1);
    }
  });
  const totalCount = validPapers.length;
  const categoryTotals = Array.from(categoryCountMap.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Category growth over time
  const categoryGrowthOverTime = years.map(year => {
    const papersInYear = validPapers.filter(p => p.publication_year === year);
    const row: { year: number; [category: string]: number } = { year };

    categoryTotals.forEach(cat => {
      const count = papersInYear.filter(p => p.category === cat.category).length;
      row[cat.category] = count;
    });

    return row;
  });

  // 4. Topic activity over time
  const topicActivityOverTime = years.map(year => {
    const papersInYear = validPapers.filter(p => p.publication_year === year);
    const row: { year: number; [topicLabel: string]: number } = { year };

    topics.forEach(topic => {
      const count = papersInYear.filter(p => p.topic_id === topic.id).length;
      // Truncate label for chart readability
      const label = topic.label.length > 24 ? topic.label.slice(0, 24) + '...' : topic.label;
      row[label] = count;
    });

    return row;
  });

  // 5. Emerging Topic Candidates calculation
  // Define recent vs baseline windows
  let recentYears: number[] = [];
  let baselineYears: number[] = [];

  if (years.length >= 3) {
    const maxYear = years[years.length - 1];
    recentYears = [maxYear - 1, maxYear].filter(y => yearSet.has(y));
    baselineYears = years.filter(y => y < maxYear - 1);
  } else if (years.length === 2) {
    recentYears = [years[1]];
    baselineYears = [years[0]];
  } else {
    recentYears = [...years];
    baselineYears = [...years];
  }

  const totalRecentPapers = validPapers.filter(p => recentYears.includes(p.publication_year)).length;
  const totalBaselinePapers = validPapers.filter(p => baselineYears.includes(p.publication_year)).length;

  const emergingCandidates: EmergingTopicCandidate[] = topics.map(topic => {
    const topicPapers = validPapers.filter(p => p.topic_id === topic.id);
    const recentTopicCount = topicPapers.filter(p => recentYears.includes(p.publication_year)).length;
    const baselineTopicCount = topicPapers.filter(p => baselineYears.includes(p.publication_year)).length;

    const recentShare = totalRecentPapers > 0 ? recentTopicCount / totalRecentPapers : 0;
    const historicalShare = totalBaselinePapers > 0 ? baselineTopicCount / totalBaselinePapers : 0;

    // Relative growth formula: (RecentShare - HistoricalShare) / max(HistoricalShare, 0.05)
    const baselineFloor = Math.max(0.05, historicalShare);
    const growthRate = (recentShare - historicalShare) / baselineFloor;

    // Sufficiency factor dampens random micro-clusters with only 1 sample
    const sufficiency = Math.min(1.0, Math.sqrt(recentTopicCount) / 1.73);
    const emergingScore = Math.round(growthRate * sufficiency * 10 * 100) / 100;

    let momentumBadge: 'High Momentum' | 'Emerging' | 'Steady' | 'Mature' = 'Steady';
    if (emergingScore >= 6.0 && recentTopicCount >= 2) {
      momentumBadge = 'High Momentum';
    } else if (emergingScore >= 2.0) {
      momentumBadge = 'Emerging';
    } else if (emergingScore < -2.0) {
      momentumBadge = 'Mature';
    }

    const isEmerging = emergingScore >= 2.0 && recentTopicCount >= 2;

    const explanation = `Share rose from ${(historicalShare * 100).toFixed(1)}% in baseline (${baselineYears.join('-') || 'N/A'}) to ${(recentShare * 100).toFixed(1)}% in recent years (${recentYears.join('-')}), with ${recentTopicCount} recent publications.`;

    return {
      topicId: topic.id,
      label: topic.label,
      topTerms: topic.topTerms.map(t => t.term),
      emergingScore,
      growthRate: Math.round(growthRate * 100),
      recentShare: Math.round(recentShare * 1000) / 10,
      historicalShare: Math.round(historicalShare * 1000) / 10,
      recentCount: recentTopicCount,
      totalCount: topic.paperCount,
      isEmerging,
      momentumBadge,
      explanation
    };
  });

  emergingCandidates.sort((a, b) => b.emergingScore - a.emergingScore);

  return {
    years,
    yearlyPublicationCounts,
    categoryGrowthOverTime,
    topicActivityOverTime,
    categoryTotals,
    emergingCandidates,
    formulaDetails: {
      name: 'Relative Trajectory Velocity & Sufficiency Index',
      description: 'Score = ((RecentShare - HistoricalShare) / max(HistoricalShare, 0.05)) * min(1.0, sqrt(RecentCount) / 1.73) * 10',
      recentWindow: recentYears.length > 0 ? `${recentYears[0]}–${recentYears[recentYears.length - 1]}` : 'N/A',
      baselineWindow: baselineYears.length > 0 ? `${baselineYears[0]}–${baselineYears[baselineYears.length - 1]}` : 'N/A',
      threshold: 2.0
    }
  };
}
