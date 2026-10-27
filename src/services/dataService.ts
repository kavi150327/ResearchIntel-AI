import { ColumnMapping, ResearchPaper, ValidationIssue, ValidationSummary } from '../types';

/**
 * Robust CSV parser supporting RFC 4180 quotes, internal commas, and line breaks within quotes.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
        currentLine += char;
      }
    } else if ((char === '\n' || char === '\r') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip CR in CRLF
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  // Parse header and rows
  const parsedRows: string[][] = [];

  for (const line of lines) {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    parsedRows.push(cells);
  }

  const headers = parsedRows[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = parsedRows.slice(1);

  return { headers, rows };
}

/**
 * Automatically inspects headers and guesses standard schema field mappings
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const findMatch = (candidates: string[]) => {
    return headers.find(h => candidates.includes(normalize(h))) || '';
  };

  return {
    titleField: findMatch(['title', 'paper_title', 'papertitle', 'name', 'headline', 'articletitle']) || headers[0] || '',
    abstractField: findMatch(['abstract', 'summary', 'description', 'paper_abstract', 'text', 'content']) || (headers.length > 1 ? headers[1] : ''),
    yearField: findMatch(['publication_year', 'publicationyear', 'year', 'pubyear', 'published_year', 'date']),
    categoryField: findMatch(['category', 'domain', 'label', 'class', 'field', 'subject', 'primary_category']),
    keywordsField: findMatch(['keywords', 'keyword', 'tags', 'terms', 'key_words']),
    authorsField: findMatch(['authors', 'author', 'researchers', 'creator'])
  };
}

/**
 * Parse JSON text into array of raw objects
 */
export function parseJson(text: string): Record<string, unknown>[] {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (typeof parsed === 'object' && parsed !== null) {
    if (Array.isArray((parsed as Record<string, unknown>).records)) {
      return (parsed as Record<string, unknown>).records as Record<string, unknown>[];
    }
    if (Array.isArray((parsed as Record<string, unknown>).papers)) {
      return (parsed as Record<string, unknown>).papers as Record<string, unknown>[];
    }
    if (Array.isArray((parsed as Record<string, unknown>).data)) {
      return (parsed as Record<string, unknown>).data as Record<string, unknown>[];
    }
  }
  throw new Error('JSON format not recognized. Please provide a JSON array of paper objects.');
}

/**
 * Convert parsed rows or JSON objects into typed ResearchPaper array using column mapping
 */
export function convertToResearchPapers(
  rawRecords: Record<string, unknown>[],
  mapping: ColumnMapping
): ResearchPaper[] {
  return rawRecords.map((rec, idx) => {
    const title = String(rec[mapping.titleField] ?? '').trim();
    const abstract = String(rec[mapping.abstractField] ?? '').trim();

    let publication_year = 2024;
    const yearRaw = rec[mapping.yearField];
    if (yearRaw) {
      const parsedYear = parseInt(String(yearRaw), 10);
      if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2030) {
        publication_year = parsedYear;
      }
    }

    const category = mapping.categoryField && rec[mapping.categoryField]
      ? String(rec[mapping.categoryField]).trim()
      : 'Uncategorized';

    // Parse keywords
    let keywords: string[] = [];
    if (mapping.keywordsField && rec[mapping.keywordsField]) {
      const kwVal = rec[mapping.keywordsField];
      if (Array.isArray(kwVal)) {
        keywords = kwVal.map(k => String(k).trim()).filter(Boolean);
      } else if (typeof kwVal === 'string') {
        keywords = kwVal.split(/[;,|]/).map(k => k.trim()).filter(Boolean);
      }
    }

    // Parse authors
    let authors: string[] = [];
    if (mapping.authorsField && rec[mapping.authorsField]) {
      const authVal = rec[mapping.authorsField];
      if (Array.isArray(authVal)) {
        authors = authVal.map(a => String(a).trim()).filter(Boolean);
      } else if (typeof authVal === 'string') {
        authors = authVal.split(/[;,|]/).map(a => a.trim()).filter(Boolean);
      }
    }

    return {
      id: `paper-${idx + 1}-${Date.now().toString(36).slice(-4)}`,
      title: title || `Untitled Paper #${idx + 1}`,
      abstract,
      publication_year,
      category,
      keywords,
      authors
    };
  });
}

/**
 * Validate records for quality, duplicate entries, missing critical text, and anomalies
 */
export function validateDataset(papers: ResearchPaper[]): ValidationSummary {
  const issues: ValidationIssue[] = [];
  const titleSet = new Set<string>();
  const categoriesFound = new Set<string>();
  const yearsFound = new Set<number>();

  let missingAbstractCount = 0;
  let missingTitleCount = 0;
  let invalidYearCount = 0;
  let duplicateCount = 0;
  let shortAbstractCount = 0;

  const currentYear = new Date().getFullYear();

  papers.forEach((paper, idx) => {
    // Check Title
    if (!paper.title || paper.title.trim() === '' || paper.title.startsWith('Untitled Paper #')) {
      missingTitleCount++;
      issues.push({
        type: 'missing_field',
        recordIndex: idx,
        paperTitle: paper.title || `Record #${idx + 1}`,
        message: 'Title is empty or missing.',
        severity: 'warning'
      });
    } else {
      const normalizedTitle = paper.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (titleSet.has(normalizedTitle)) {
        duplicateCount++;
        issues.push({
          type: 'duplicate_record',
          recordIndex: idx,
          paperTitle: paper.title,
          message: 'Potential duplicate record with identical title found.',
          severity: 'warning'
        });
      } else {
        titleSet.add(normalizedTitle);
      }
    }

    // Check Abstract
    if (!paper.abstract || paper.abstract.trim() === '') {
      missingAbstractCount++;
      issues.push({
        type: 'missing_field',
        recordIndex: idx,
        paperTitle: paper.title,
        message: 'Abstract body is missing. Paper cannot be classified.',
        severity: 'error'
      });
    } else if (paper.abstract.trim().length < 40) {
      shortAbstractCount++;
      issues.push({
        type: 'short_abstract',
        recordIndex: idx,
        paperTitle: paper.title,
        message: `Abstract is very brief (${paper.abstract.trim().length} chars). May yield noisy vector features.`,
        severity: 'warning'
      });
    }

    // Check Year
    if (!paper.publication_year || paper.publication_year < 1950 || paper.publication_year > currentYear + 2) {
      invalidYearCount++;
      issues.push({
        type: 'invalid_year',
        recordIndex: idx,
        paperTitle: paper.title,
        message: `Publication year (${paper.publication_year}) appears invalid or out of range.`,
        severity: 'warning'
      });
    } else {
      yearsFound.add(paper.publication_year);
    }

    // Track Categories
    if (paper.category && paper.category !== 'Uncategorized') {
      categoriesFound.add(paper.category);
    }
  });

  const validRecords = papers.length - missingAbstractCount;

  return {
    totalRecords: papers.length,
    validRecords,
    missingAbstractCount,
    missingTitleCount,
    invalidYearCount,
    duplicateCount,
    shortAbstractCount,
    categoriesFound: Array.from(categoriesFound).sort(),
    detectedYears: Array.from(yearsFound).sort((a, b) => a - b),
    issues,
    isValid: validRecords > 0
  };
}

/**
 * Clean dataset: drop invalid duplicates and records with empty abstracts
 */
export function cleanDatasetRecords(
  papers: ResearchPaper[],
  options: { removeDuplicates: boolean; dropMissingAbstracts: boolean; trimWhitespace: boolean }
): ResearchPaper[] {
  let cleaned = [...papers];

  if (options.trimWhitespace) {
    cleaned = cleaned.map(p => ({
      ...p,
      title: p.title.trim(),
      abstract: p.abstract.trim(),
      category: p.category.trim()
    }));
  }

  if (options.dropMissingAbstracts) {
    cleaned = cleaned.filter(p => p.abstract && p.abstract.trim().length > 0);
  }

  if (options.removeDuplicates) {
    const seen = new Set<string>();
    cleaned = cleaned.filter(p => {
      const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return cleaned;
}
