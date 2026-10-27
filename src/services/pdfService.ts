import { PDFParse } from 'pdf-parse';

export interface ExtractedPdfMetadata {
  title: string;
  abstract: string;
  authors: string[];
  publication_year: number;
  keywords: string[];
  doi?: string;
  pageCount?: number;
  rawTextPreview: string;
}

/**
 * Extracts academic metadata from a PDF file buffer using pdf-parse and heuristic NLP patterns
 */
export async function extractMetadataFromPdf(pdfBuffer: Buffer): Promise<ExtractedPdfMetadata> {
  let text = '';
  let pageCount = 1;

  try {
    const parser = new (PDFParse as any)({ data: pdfBuffer });
    const result = await parser.getText();
    text = result?.text || '';
    if (typeof parser.getInfo === 'function') {
      const info = await parser.getInfo();
      if (info?.pages) pageCount = info.pages;
    }
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }
  } catch (err) {
    console.warn('[PDFParse] Error using PDFParse, falling back to buffer string decode:', err);
    text = pdfBuffer.toString('utf-8', 0, Math.min(pdfBuffer.length, 50000));
  }

  return parseAcademicText(text, pageCount);
}

/**
 * Parse text from an academic paper to extract title, abstract, authors, keywords, and DOI
 */
export function parseAcademicText(fullText: string, pageCount = 1): ExtractedPdfMetadata {
  const clean = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Detect DOI
  const doiMatch = clean.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/);
  const doi = doiMatch ? doiMatch[1].replace(/[.,]$/, '') : undefined;

  // 2. Detect Publication Year (1990-2026)
  let publication_year = 2024;
  const yearMatches = Array.from(clean.matchAll(/\b(199\d|20[0-2]\d)\b/g));
  if (yearMatches.length > 0) {
    // Pick the most frequent or earliest realistic header year
    const counts: Record<number, number> = {};
    for (const m of yearMatches.slice(0, 20)) {
      const y = parseInt(m[1], 10);
      if (y >= 2000 && y <= 2026) {
        counts[y] = (counts[y] || 0) + 1;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      publication_year = parseInt(sorted[0][0], 10);
    }
  }

  // 3. Extract Abstract
  let abstract = '';
  const abstractRegex = /(?:abstract|a\s*b\s*s\s*t\s*r\s*a\s*c\s*t)[:\s\n—-]+([\s\S]{80,2500}?)(?:\n\s*(?:(?:i\.|1\.)?\s*introduction|index\s+terms|keywords|categories\s+and\s+subject|1\s+overview|background)|$)/i;
  const abstractMatch = clean.match(abstractRegex);

  if (abstractMatch && abstractMatch[1]) {
    abstract = abstractMatch[1]
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Fallback abstract if header wasn't found cleanly
  if (!abstract || abstract.length < 50) {
    // Find paragraphs around line 5-25 that are descriptive
    for (let i = 2; i < Math.min(lines.length, 30); i++) {
      if (lines[i].length > 120 && !lines[i].toLowerCase().includes('ieee') && !lines[i].toLowerCase().includes('university')) {
        abstract = lines.slice(i, i + 4).join(' ');
        break;
      }
    }
  }

  // 4. Extract Title
  let title = '';
  // Skip common journal/conference headers
  const headerDisclaimers = [
    'arxiv', 'ieee', 'acm', 'springer', 'proceedings', 'conference',
    'journal', 'vol.', 'volume', 'pp.', 'http', 'doi', 'preprint'
  ];

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const isDisclaimer = headerDisclaimers.some(d => lower.startsWith(d) || lower.includes('all rights reserved'));
    if (!isDisclaimer && line.length >= 15 && line.length <= 250 && !lower.startsWith('abstract')) {
      // Check if subsequent line continues the title
      let fullTitle = line;
      if (i + 1 < lines.length && lines[i + 1].length > 8 && lines[i + 1].length < 100 && !lines[i + 1].toLowerCase().includes('university') && !lines[i + 1].toLowerCase().includes('@')) {
        fullTitle += ' ' + lines[i + 1];
      }
      title = fullTitle.replace(/[\*\†\‡\§]/g, '').trim();
      break;
    }
  }

  if (!title) {
    title = lines[0] || 'Untitled Research Paper';
  }

  // 5. Extract Keywords
  const keywords: string[] = [];
  const keywordRegex = /(?:keywords|index\s+terms|key\s+words)[:\s\n—-]+([^\n\.\;]+(?:[;\,\—][^\n\.\;]+){1,10})/i;
  const kwMatch = clean.match(keywordRegex);
  if (kwMatch && kwMatch[1]) {
    const rawKws = kwMatch[1].split(/[,;•—\n]/);
    for (const kw of rawKws) {
      const trimmed = kw.trim().replace(/^[-*•]\s*/, '').toLowerCase();
      if (trimmed.length > 2 && trimmed.length < 40 && !keywords.includes(trimmed)) {
        keywords.push(trimmed);
      }
    }
  }

  // 6. Extract Authors
  const authors: string[] = [];
  for (let i = 1; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (line === title || line.length < 4) continue;
    if (line.toLowerCase().includes('abstract') || line.toLowerCase().includes('introduction')) break;

    // Check if line looks like author names (e.g. John Doe, Alice Smith)
    if (line.includes(',') || line.includes(' and ') || /^[A-Z][a-z]+ [A-Z]/.test(line)) {
      if (!line.toLowerCase().includes('university') && !line.toLowerCase().includes('department') && !line.includes('@')) {
        const potential = line.split(/,| and /);
        for (const p of potential) {
          const auth = p.trim().replace(/[\*\†\‡\§0-9]/g, '');
          if (auth.length > 3 && auth.length < 35 && /^[A-Z]/.test(auth) && !authors.includes(auth)) {
            authors.push(auth);
          }
        }
      }
    }
  }

  if (authors.length === 0) {
    authors.push('Academic Research Scholar');
  }

  return {
    title: title.slice(0, 200),
    abstract: abstract || 'No abstract text found in document.',
    authors: authors.slice(0, 6),
    publication_year,
    keywords: keywords.slice(0, 8),
    doi,
    pageCount,
    rawTextPreview: clean.slice(0, 1000)
  };
}
