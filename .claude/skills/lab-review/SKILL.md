---
name: lab-review
description: Cross-reference lab results from sundhed.dk against current PubMed and medRxiv research on optimal ranges. Generates a report comparing your values to the latest evidence-based guidelines, meta-analyses, and preprints.
allowed-tools: Bash(node *), Bash(mkdir *), Task
---

# Lab Review — Prøvesvar vs. Forskning

This skill compares your lab results (from `data/sundhed-dk/health.db`) against current medical research from PubMed (peer-reviewed) and medRxiv (preprints). It generates a Danish-language markdown report highlighting where your values differ from evidence-based optimal ranges (which often differ from standard lab reference ranges).

## Prerequisites

- `data/sundhed-dk/health.db` must exist with biochemistry data (use the `sundhed-dk` skill to fetch it first)

## CRITICAL: Script Path Resolution

The scripts below are relative to this skill's installation directory.

Before running any command, locate the scripts:

```bash
EXTRACT_SCRIPT=$(find ~/.claude -name "extract-markers" -path "*/lab-review/*/scripts/extract-markers" -type f 2>/dev/null | head -1)
REVIEW_SCRIPT=$(find ~/.claude -name "review-marker" -path "*/lab-review/*/scripts/review-marker" -type f 2>/dev/null | head -1)
```

Then use `$EXTRACT_SCRIPT` and `$REVIEW_SCRIPT` for all commands.

## Step 1: Extract current lab markers

Run the extract-markers script to get the most recent value per marker from the database:

```bash
node "${EXTRACT_SCRIPT}.mjs" [db-path]
```

Default db-path: `data/sundhed-dk/health.db`

This outputs a JSON array with ~20 markers, each containing:
- `short_name` — English name (e.g. "Total Cholesterol")
- `pubmed_term` — optimized PubMed search term
- `value`, `unit`, `reference_text`, `assessment`, `result_date`

## Step 2: Research each marker via PubMed

For each marker from step 1, search PubMed and medRxiv for recent evidence on optimal ranges:

```bash
node "${REVIEW_SCRIPT}.mjs" --marker "Total Cholesterol" --value "5.2" --term "total cholesterol"
```

Arguments:
- `--marker` (required) — marker name for the output
- `--value` (optional) — the patient's value, included in output for context
- `--term` (optional) — PubMed search term; if omitted, uses `--marker` value
- `--medrxiv-days` (optional) — medRxiv lookback in days (default: 90)

Returns JSON with:
- `articles` — up to 5 PubMed articles (PMID, title, year, journal, abstract snippet)
- `medrxiv_preprints` — up to 3 medRxiv preprints (DOI, title, date, abstract snippet, URL)

Both sources are queried in parallel. medRxiv results complement PubMed by surfacing cutting-edge research that hasn't been peer-reviewed yet.

### Parallelization strategy

To keep the main context clean and fast, **spawn sub-agents** for each marker:

```
For each marker in the extracted JSON:
  1. Spawn a Task (subagent_type: "general-purpose") that:
     a. Runs review-marker for that marker's pubmed_term (searches both PubMed and medRxiv in parallel)
     b. Reads the returned PubMed articles and medRxiv preprints
     c. Compares the patient's value against what the evidence says about optimal ranges
     d. Returns a short markdown summary (3–5 lines) in Danish:
        - Patient's value + standard reference range
        - What current evidence says about optimal ranges
        - Key study reference (PMID + title + year)
        - Brief recommendation (if value is outside optimal range)
```

Run multiple sub-agents in parallel (batch 5–8 at a time to respect PubMed's 3 req/sec rate limit without API key).

## Step 3: Compile the report

Collect all sub-agent summaries and compile into a final markdown report:

1. Create output directory: `mkdir -p data/lab-review`
2. Write the report to `data/lab-review/report.md`

### Report format

Follow the structure in [example/report-example.md](example/report-example.md):

```markdown
# Prøvesvar vs. Forskning — YYYY-MM-DD

> Automatisk gennemgang af dine seneste blodprøveresultater sammenholdt med aktuel
> medicinsk forskning. Dette er **ikke** lægelig rådgivning — brug det som
> udgangspunkt for en samtale med din læge.

## Resumé
Gennemgik N markører mod aktuel litteratur. X markører kræver opmærksomhed.

## Markører der kræver opmærksomhed
[Markers where optimal range differs significantly from standard range,
or where the patient's value is outside the optimal range]

## Markører inden for optimalt interval
[Brief summaries of markers that look good]
```

### Classification logic

A marker "kræver opmærksomhed" if ANY of:
- `assessment` is "Forhoejet" or "For lav" (outside standard range)
- The value is within standard range but outside the evidence-based optimal range
- Recent guidelines suggest a tighter target than the standard reference range

## Important notes

- **Not medical advice.** The report is a research summary, not a diagnosis. Always include the disclaimer.
- **PubMed rate limits.** Without an API key: 3 requests/sec. The review-marker script includes a 400ms delay between calls. When running in parallel, limit to 5–8 concurrent sub-agents.
- **Marker coverage.** The extract script covers ~25 common biochemistry markers and excludes antibody panels, allergy tests (IgE), STD-related microbiology, and text-only fields like "D-Vitamin indikation".
- **LDL variants.** The database may contain two LDL entries (direct measurement and DSKB 2017 calculated). Both are included with distinct short names.
