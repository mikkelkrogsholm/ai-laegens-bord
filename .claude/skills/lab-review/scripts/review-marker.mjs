#!/usr/bin/env node
// Searches PubMed AND medRxiv for recent evidence on optimal ranges for a lab marker.
// Usage: node review-marker.mjs --marker "Total Cholesterol" --value "5.2"
// Optional: --term "custom pubmed term" (overrides default)
//           --medrxiv-days N (medRxiv lookback in days, default: 90)
// Returns JSON with top 5 PubMed articles + top 3 medRxiv preprints to stdout.
// Zero dependencies — uses built-in fetch + PubMed E-utilities + medRxiv CSHL API (both free, no API key).

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const marker = getArg('marker');
const value = getArg('value');
const customTerm = getArg('term');
const medrxivDays = parseInt(getArg('medrxiv-days') || '90', 10);

if (!marker) {
  console.error(JSON.stringify({ error: 'Missing --marker argument' }));
  process.exit(1);
}

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const searchTerm = customTerm || marker;

// Build query: marker optimal range, recent meta-analyses/guidelines
const query = `"${searchTerm}" optimal range[tiab] AND (meta-analysis[pt] OR guideline[pt] OR systematic review[pt]) AND 2022:2026[dp]`;

async function search() {
  // Step 1: ESearch — find PMIDs
  const searchUrl = `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json&sort=relevance`;

  const searchRes = await fetch(searchUrl, {
    headers: { 'User-Agent': 'lab-review-skill/1.0 (health-assistant)' }
  });

  if (!searchRes.ok) {
    return { error: `ESearch failed: ${searchRes.status}`, query };
  }

  const searchData = await searchRes.json();
  const idList = searchData.esearchresult?.idlist || [];
  const totalCount = parseInt(searchData.esearchresult?.count || '0', 10);

  if (idList.length === 0) {
    // Fallback: broader query without "optimal range"
    const fallbackQuery = `"${searchTerm}" reference range[tiab] AND (meta-analysis[pt] OR guideline[pt] OR review[pt]) AND 2020:2026[dp]`;
    const fallbackUrl = `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(fallbackQuery)}&retmax=5&retmode=json&sort=relevance`;

    const fbRes = await fetch(fallbackUrl, {
      headers: { 'User-Agent': 'lab-review-skill/1.0 (health-assistant)' }
    });

    if (fbRes.ok) {
      const fbData = await fbRes.json();
      const fbIds = fbData.esearchresult?.idlist || [];
      if (fbIds.length > 0) {
        return await fetchArticles(fbIds, fallbackQuery, parseInt(fbData.esearchresult?.count || '0', 10));
      }
    }

    return {
      marker,
      value,
      query,
      total_results: 0,
      articles: [],
      note: 'No PubMed results found for this marker with current filters.'
    };
  }

  return await fetchArticles(idList, query, totalCount);
}

async function fetchArticles(pmids, usedQuery, totalCount) {
  // Step 2: ESummary — get article metadata
  const summaryUrl = `${BASE}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;

  const summaryRes = await fetch(summaryUrl, {
    headers: { 'User-Agent': 'lab-review-skill/1.0 (health-assistant)' }
  });

  if (!summaryRes.ok) {
    return { error: `ESummary failed: ${summaryRes.status}`, query: usedQuery };
  }

  const summaryData = await summaryRes.json();
  const result = summaryData.result || {};

  // Step 3: EFetch — get abstracts as text
  // Small delay to respect rate limits (3 req/sec without API key)
  await new Promise(r => setTimeout(r, 400));

  const fetchUrl = `${BASE}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=abstract&retmode=text`;
  const fetchRes = await fetch(fetchUrl, {
    headers: { 'User-Agent': 'lab-review-skill/1.0 (health-assistant)' }
  });

  let abstractText = '';
  if (fetchRes.ok) {
    abstractText = await fetchRes.text();
  }

  // Split abstracts by double newlines between articles
  const abstractBlocks = abstractText.split(/\n\n(?=\d+\. )/).filter(Boolean);

  const articles = pmids.map((pmid, i) => {
    const article = result[pmid] || {};
    const authors = (article.authors || []).map(a => a.name).slice(0, 3).join(', ');
    const year = article.pubdate?.split(' ')[0] || '';

    // Extract a snippet from the abstract (first 300 chars of conclusions or results)
    let snippet = '';
    if (abstractBlocks[i]) {
      const text = abstractBlocks[i];
      // Try to find conclusions section
      const concMatch = text.match(/(?:CONCLUSION|RESULTS|FINDINGS)[S]?:?\s*(.{50,400})/i);
      if (concMatch) {
        snippet = concMatch[1].trim().substring(0, 300);
      } else {
        // Take last 300 chars before references
        const lines = text.split('\n').filter(l => l.trim());
        snippet = lines.slice(-3).join(' ').substring(0, 300);
      }
    }

    return {
      pmid,
      title: article.title || '',
      authors,
      year,
      journal: article.fulljournalname || article.source || '',
      snippet,
    };
  });

  return {
    marker,
    value: value || null,
    query: usedQuery,
    total_results: totalCount,
    articles,
  };
}

// ─── medRxiv search ──────────────────────────────────────────────────────────

const MEDRXIV_API = 'https://api.medrxiv.org/details/medrxiv';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function searchMedrxiv() {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - medrxivDays);

  const from = formatDate(dateFrom);
  const to = formatDate(dateTo);

  // Build keywords from the search term
  const keywords = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

  // Fetch papers (paginate up to 500 to keep it fast)
  const papers = [];
  let cursor = 0;
  const maxPages = 5; // 5 × 100 = 500 papers max

  for (let page = 0; page < maxPages; page++) {
    try {
      const url = `${MEDRXIV_API}/${from}/${to}/${cursor}/json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'lab-review-skill/1.0 (health-assistant)' }
      });
      if (!res.ok) break;
      const data = await res.json();
      const total = data.messages?.[0]?.total || 0;
      if (data.collection) papers.push(...data.collection);
      cursor += 100;
      if (cursor >= total || !data.collection?.length) break;
    } catch {
      break;
    }
  }

  // Filter by keyword match in title + abstract
  const scored = papers
    .map(p => {
      const text = `${p.title} ${p.abstract}`.toLowerCase();
      let hits = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) hits++;
      }
      return { paper: p, hits };
    })
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3);

  return scored.map(({ paper }) => {
    // Extract snippet from abstract (first 300 chars of conclusions/results)
    let snippet = '';
    const concMatch = paper.abstract?.match(/(?:CONCLUSION|RESULTS|FINDINGS)[S]?:?\s*(.{50,400})/i);
    if (concMatch) {
      snippet = concMatch[1].trim().substring(0, 300);
    } else if (paper.abstract) {
      snippet = paper.abstract.substring(0, 300);
    }

    return {
      doi: paper.doi,
      title: paper.title,
      authors: paper.authors?.split(';').slice(0, 3).join(';') || '',
      date: paper.date,
      category: paper.category,
      snippet,
      url: `https://www.medrxiv.org/content/${paper.doi}v${paper.version}`,
    };
  });
}

// ─── Run both searches ───────────────────────────────────────────────────────

try {
  // Run PubMed and medRxiv in parallel
  const [pubmedResult, medrxivPreprints] = await Promise.all([
    search(),
    searchMedrxiv().catch(err => []),
  ]);

  pubmedResult.medrxiv_preprints = medrxivPreprints;
  console.log(JSON.stringify(pubmedResult, null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message, marker, value }));
  process.exit(1);
}
