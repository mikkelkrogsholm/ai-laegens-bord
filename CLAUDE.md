# AI Lægens Bord

## Project Goal

This project builds a set of AI skills for personal health assistance in Denmark. The skills enable AI agents to:

- Navigate **sundhed.dk** (Denmark's public health portal) to access health records, lab results, medications, and more
- Search and summarize **medical research** from sources like PubMed, Lægehåndbogen, and pro.medicin.dk
- Look up **medication information** including interactions, side effects, and dosages

The deliverable is a collection of reusable Claude Code skills that any AI agent can invoke to help users understand and navigate their health information. This is a helper tool, not a replacement for medical advice.

## Tech Stack

- **Playwright CLI** for all browser automation. ONLY use the CLI commands (`playwright-cli open`, `playwright-cli snapshot`, `playwright-cli click`, etc.) - NEVER write Playwright scripts or use the Playwright Node.js API directly.
- **Claude Code Skills** as the packaging format for each capability
- **Node.js** for parser scripts that convert raw JSON into agent-readable markdown and SQLite
- **SQLite** (Node.js built-in `node:sqlite`) for structured, queryable health data storage - single file, no server needed

## Project Structure

```
.claude/skills/                     # Skills (one directory per skill with SKILL.md)
  sundhed-dk/                       # Sundhed.dk health data skill
    SKILL.md                        # Main skill instructions
    navigation.md                   # Detailed API endpoint reference
    parsers/                        # Scripts that parse raw JSON
      parse-medicin.js              # → markdown
      parse-proevesvar.js           # → markdown
      parse-journaler.js            # → markdown
      parse-vaccinationer.js        # → markdown
      parse-aftaler.js              # → markdown
      parse-henvisninger.js         # → markdown
      parse-egen-laege.js           # → markdown
      parse-roentgen.js             # → markdown
      parse-diagnoser.js            # → markdown
      parse-hjemmemaalinger.js      # → markdown
      parse-forloebsplaner.js       # → markdown
      build-db.js                   # → SQLite database (all sections)
  lab-review/                       # Cross-reference lab results vs research
    SKILL.md                        # Skill instructions
    scripts/                        # extract-markers + review-marker (PubMed + medRxiv)
    example/                        # Anonymized example output
  playwright-cli/                   # Browser automation skill (dependency)
flows/                              # Multi-step procedures combining skills
  lab-deep-dive.md                  # Lab results → research → pattern → action plan
data/                               # Personal health data (gitignored)
  sundhed-dk/                       # Raw JSON from sundhed.dk APIs
    *.json                          # 11 raw JSON files (one per section)
    parsed/                         # LLM-friendly markdown output
      *.md                          # 11 parsed markdown files
    health.db                       # SQLite database (all sections combined)
  lab-review/                       # Lab review output (gitignored)
    report.md                       # Markers vs research report
    action-plan.md                  # Evidence-based action plan
  README.md                         # Explains the data directory (committed)
```

## Key Conventions

- **Data goes in `data/`** - All personal health data is stored in `data/sundhed-dk/`. This directory is gitignored. Never commit personal data.
- **Two output formats** - Markdown files (`parsed/*.md`) for dumping into LLM context; SQLite database (`health.db`) for targeted queries across time.
- **Check for existing data first** - Before opening a browser, check if `data/sundhed-dk/health.db` or `parsed/*.md` already exist. Only fetch from sundhed.dk if data is missing or the user wants a refresh.
- **Parsers live with the skill** - Parser scripts are bundled inside `.claude/skills/sundhed-dk/parsers/` so the skill is self-contained.
- **Browser must be headed** - sundhed.dk requires MitID login, which needs manual user interaction. Always use `--headed --persistent` flags.
- **Intercept, don't scrape** - Health data is fetched by intercepting JSON API responses, not by scraping HTML.
- **Prøvesvar date range** - Lab results default to 6 months. For historical data, change the date filter URL parameter (e.g. `datoFra=10-02-2022`) before intercepting.

## Creating Skills

Skills follow the Claude Code skill format. Each skill is a directory with a `SKILL.md` file containing YAML frontmatter and markdown instructions. See the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) for the full reference.
