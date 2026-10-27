import {
  DiscoveredTopic,
  EvaluationResults,
  ResearchPaper,
  TrendAnalysisResult,
  ValidationSummary
} from '../types';

function triggerBrowserDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export cleaned dataset to CSV
 */
export function exportCleanedDatasetCsv(papers: ResearchPaper[], filename = 'cleaned_research_dataset.csv') {
  const headers = ['id', 'title', 'original_abstract', 'cleaned_abstract', 'publication_year', 'category', 'keywords', 'authors'];
  const rows = papers.map(p => [
    escapeCsvField(p.id),
    escapeCsvField(p.title),
    escapeCsvField(p.abstract),
    escapeCsvField(p.cleaned_abstract || ''),
    p.publication_year || '',
    escapeCsvField(p.category),
    escapeCsvField(p.keywords?.join('; ') || ''),
    escapeCsvField(p.authors?.join('; ') || '')
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  triggerBrowserDownload(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export classification predictions to CSV
 */
export function exportClassificationCsv(papers: ResearchPaper[], evaluation?: EvaluationResults, filename = 'classification_results.csv') {
  const headers = ['id', 'title', 'actual_category', 'predicted_category', 'confidence', 'is_correct', 'top_tfidf_features'];
  const rows = papers.map(p => {
    const isCorrect = p.category && p.predicted_category ? (p.category === p.predicted_category ? 'TRUE' : 'FALSE') : 'N/A';
    const topTerms = p.tfidf_top_terms?.map(t => `${t.term} (${t.score.toFixed(3)})`).join('; ') || '';
    return [
      escapeCsvField(p.id),
      escapeCsvField(p.title),
      escapeCsvField(p.category || 'Unlabeled'),
      escapeCsvField(p.predicted_category || 'N/A'),
      p.prediction_confidence !== undefined ? p.prediction_confidence.toFixed(3) : 'N/A',
      isCorrect,
      escapeCsvField(topTerms)
    ].join(',');
  });

  const metadataRows = [
    `# Model: ${evaluation?.modelName || 'Supervised Classifier'}`,
    `# Accuracy: ${evaluation ? (evaluation.accuracy * 100).toFixed(1) + '%' : 'N/A'}`,
    `# Macro F1: ${evaluation ? evaluation.macroF1.toFixed(3) : 'N/A'}`,
    `# Evaluated: ${evaluation?.trainedAt || new Date().toISOString()}`
  ];

  const csv = [...metadataRows, headers.join(','), ...rows].join('\n');
  triggerBrowserDownload(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export topic assignments to CSV
 */
export function exportTopicAssignmentsCsv(papers: ResearchPaper[], topics: DiscoveredTopic[], filename = 'topic_assignments.csv') {
  const headers = ['id', 'title', 'publication_year', 'category', 'assigned_topic_id', 'topic_label', 'top_topic_terms'];
  const topicMap = new Map<number, DiscoveredTopic>();
  topics.forEach(t => topicMap.set(t.id, t));

  const rows = papers.map(p => {
    const topic = p.topic_id ? topicMap.get(p.topic_id) : undefined;
    const topTerms = topic?.topTerms.map(t => t.term).join('; ') || '';
    return [
      escapeCsvField(p.id),
      escapeCsvField(p.title),
      p.publication_year || '',
      escapeCsvField(p.category),
      p.topic_id || 'Unassigned',
      escapeCsvField(p.topic_label || topic?.label || 'N/A'),
      escapeCsvField(topTerms)
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  triggerBrowserDownload(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export trend analysis data to CSV
 */
export function exportTrendAnalyticsCsv(trends: TrendAnalysisResult, filename = 'trend_analytics.csv') {
  const rows: string[] = [];

  rows.push('# SECTION 1: PUBLICATIONS PER YEAR');
  rows.push('year,publication_count');
  trends.yearlyPublicationCounts.forEach(y => {
    rows.push(`${y.year},${y.count}`);
  });

  rows.push('\n# SECTION 2: CATEGORY TOTALS');
  rows.push('category,count,percentage');
  trends.categoryTotals.forEach(c => {
    rows.push(`${escapeCsvField(c.category)},${c.count},${c.percentage}%`);
  });

  rows.push('\n# SECTION 3: EMERGING TOPIC CANDIDATES');
  rows.push('topic_id,label,emerging_score,momentum_badge,growth_rate_pct,recent_share_pct,historical_share_pct,recent_count,total_count');
  trends.emergingCandidates.forEach(e => {
    rows.push([
      e.topicId,
      escapeCsvField(e.label),
      e.emergingScore,
      escapeCsvField(e.momentumBadge),
      e.growthRate,
      e.recentShare,
      e.historicalShare,
      e.recentCount,
      e.totalCount
    ].join(','));
  });

  const csv = rows.join('\n');
  triggerBrowserDownload(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export complete application analysis as JSON
 */
export function exportFullAnalysisJson(
  papers: ResearchPaper[],
  validation: ValidationSummary | null,
  evaluation: EvaluationResults | null,
  topics: DiscoveredTopic[],
  trends: TrendAnalysisResult,
  filename = 'research_intelligence_analysis.json'
) {
  const reportPayload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      platform: 'Research Abstract Classification & Trend Discovery Platform',
      version: '1.0.0 (B.Tech AI & DS Mini-Project Engine)'
    },
    datasetSummary: {
      totalPapers: papers.length,
      categoriesCount: trends.categoryTotals.length,
      yearRange: trends.years.length > 0 ? [trends.years[0], trends.years[trends.years.length - 1]] : [],
      validation
    },
    classificationEvaluation: evaluation || { status: 'Untrained or not evaluated' },
    topicDiscovery: {
      discoveredTopicsCount: topics.length,
      topics
    },
    trendAnalytics: {
      emergingFormula: trends.formulaDetails,
      emergingCandidates: trends.emergingCandidates,
      yearlyTotals: trends.yearlyPublicationCounts,
      categoryTotals: trends.categoryTotals
    },
    records: papers.map(p => ({
      id: p.id,
      title: p.title,
      year: p.publication_year,
      actualCategory: p.category,
      predictedCategory: p.predicted_category,
      predictionConfidence: p.prediction_confidence,
      topicId: p.topic_id,
      topicLabel: p.topic_label
    }))
  };

  const jsonStr = JSON.stringify(reportPayload, null, 2);
  triggerBrowserDownload(jsonStr, filename, 'application/json');
}

/**
 * Generate a printable academic project summary report (compatible with Print to PDF)
 */
export function openPrintableSummaryReport(
  papers: ResearchPaper[],
  validation: ValidationSummary | null,
  evaluation: EvaluationResults | null,
  topics: DiscoveredTopic[],
  trends: TrendAnalysisResult
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the printable project summary report.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Academic Project Report - Research Abstract Classification & Trend Discovery</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 { font-size: 24px; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #64748b; margin-bottom: 24px; }
    h2 { font-size: 16px; color: #0369a1; margin-top: 28px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
    .meta-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .meta-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-weight: 600; }
    td { padding: 8px; border: 1px solid #e2e8f0; }
    .confusion-matrix td { text-align: center; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
    .formula-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #166534; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
    <div>
      <h1>Research Abstract Classification &amp; Trend Discovery Platform</h1>
      <div class="subtitle">B.Tech Artificial Intelligence and Data Science Mini-Project Report · Generated: ${new Date().toLocaleDateString()}</div>
    </div>
    <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">Total Abstracts</div>
      <div class="meta-val">${papers.length}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Categories</div>
      <div class="meta-val">${trends.categoryTotals.length}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Discovered Topics</div>
      <div class="meta-val">${topics.length}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Classifier Accuracy</div>
      <div class="meta-val">${evaluation ? (evaluation.accuracy * 100).toFixed(1) + '%' : 'N/A'}</div>
    </div>
  </div>

  <h2>1. Dataset Validation &amp; Quality Audit</h2>
  <p style="font-size: 12px; color: #475569;">
    Uploaded corpus validated through automated schema validation. Valid records: <strong>${validation?.validRecords ?? papers.length}</strong>.
    Duplicates detected: <strong>${validation?.duplicateCount ?? 0}</strong>. Missing abstracts: <strong>${validation?.missingAbstractCount ?? 0}</strong>.
    Invalid years: <strong>${validation?.invalidYearCount ?? 0}</strong>.
  </p>

  <h2>2. Supervised Classification &amp; Evaluation Metrics</h2>
  ${
    evaluation
      ? `
    <p style="font-size: 12px; color: #475569;">
      <strong>Model:</strong> ${evaluation.modelName} | <strong>Train Count:</strong> ${evaluation.trainCount} | <strong>Held-out Test Count:</strong> ${evaluation.testCount} | <strong>Vocabulary Features:</strong> ${evaluation.featureCount}
    </p>
    <table>
      <thead>
        <tr>
          <th>Category Class</th>
          <th>Precision</th>
          <th>Recall</th>
          <th>F1-Score</th>
          <th>Support (Test Instances)</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(evaluation.perClass).map(([cat, m]) => `
          <tr>
            <td><strong>${cat}</strong></td>
            <td>${m.precision.toFixed(3)}</td>
            <td>${m.recall.toFixed(3)}</td>
            <td>${m.f1.toFixed(3)}</td>
            <td>${m.support}</td>
          </tr>
        `).join('')}
        <tr style="background: #f8fafc; font-weight: 600;">
          <td>Macro Average</td>
          <td>${evaluation.macroPrecision.toFixed(3)}</td>
          <td>${evaluation.macroRecall.toFixed(3)}</td>
          <td>${evaluation.macroF1.toFixed(3)}</td>
          <td>${evaluation.testCount}</td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-size: 13px; margin-top: 16px;">Test Confusion Matrix</h3>
    <table class="confusion-matrix">
      <thead>
        <tr>
          <th style="text-align: left;">Actual \\ Predicted</th>
          ${evaluation.confusionMatrix.labels.map(l => `<th>${l.slice(0, 10)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${evaluation.confusionMatrix.matrix.map((row, r) => `
          <tr>
            <td style="text-align: left; font-weight: bold;">${evaluation.confusionMatrix.labels[r]}</td>
            ${row.map((val, c) => `<td style="${r === c ? 'background: #dcfce7; color: #15803d;' : val > 0 ? 'background: #fee2e2; color: #b91c1c;' : ''}">${val}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
      : '<p style="font-size: 12px; color: #64748b;">No classifier trained or evaluated yet.</p>'
  }

  <h2>3. Unsupervised Topic Discovery (K-Means Clustering)</h2>
  <table>
    <thead>
      <tr>
        <th>Topic ID</th>
        <th>Descriptive Semantic Label</th>
        <th>Top Characteristic Terms</th>
        <th>Assigned Papers</th>
        <th>Share (%)</th>
      </tr>
    </thead>
    <tbody>
      ${topics.map(t => `
        <tr>
          <td><strong>#${t.id}</strong></td>
          <td>${t.label}</td>
          <td style="color: #0369a1;">${t.topTerms.map(term => term.term).join(', ')}</td>
          <td>${t.paperCount}</td>
          <td>${t.percentage}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>4. Trend Analytics &amp; Emerging Candidates</h2>
  <div class="formula-box">
    <strong>Emerging Score Formula:</strong> ${trends.formulaDetails.description}
  </div>
  <table>
    <thead>
      <tr>
        <th>Topic ID &amp; Label</th>
        <th>Emerging Score</th>
        <th>Momentum Badge</th>
        <th>Recent Share</th>
        <th>Historical Share</th>
        <th>Recent Count</th>
      </tr>
    </thead>
    <tbody>
      ${trends.emergingCandidates.map(c => `
        <tr>
          <td><strong>#${c.topicId}</strong>: ${c.label}</td>
          <td><strong>${c.emergingScore.toFixed(2)}</strong></td>
          <td><span class="badge">${c.momentumBadge}</span></td>
          <td>${c.recentShare}%</td>
          <td>${c.historicalShare}%</td>
          <td>${c.recentCount}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>5. Academic Methodology &amp; Engineering Limitations</h2>
  <p style="font-size: 11px; color: #475569; line-height: 1.6;">
    <strong>Methodology:</strong> Preprocessing applies contraction normalization, punctuation stripping, stop-word elimination with academic discourse filters, and morphological lemmatization while preserving domain-critical technical acronyms. Vectorization utilizes smooth Inverse Document Frequency with sublinear term-frequency scaling and L2 normalization fitted strictly on training documents to prevent data leakage. Classification supports Multinomial Naive Bayes, One-vs-Rest Logistic Regression, and Linear Support Vector Machines. Unsupervised topics are clustered via K-Means++ with cosine distance convergence.
    <br/><br/>
    <strong>Limitations:</strong> Evaluation metrics reflect held-out test splits from the active dataset. Synthetic benchmark abstracts are clearly identified and designed for reproducibility. For production deployment at million-paper scale, distributed streaming indexing and multi-GPU neural embeddings are recommended.
  </p>

  <div class="footer">
    Research Abstract Classification &amp; Trend Discovery Platform · B.Tech AI &amp; DS Project · Verified Academic Demonstration
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
