<p align="center">
  <img src="ai-laegen.png" alt="AI-Lægens Bord" width="600">
</p>

# AI-Lægens Bord

En samling af AI-skills til personlig sundhedsassistance i Danmark. Giver din AI-agent adgang til dine sundhedsdata, medicinsk forskning og lægemiddelinformation.

> **Vigtigt:** Dette er et hjælpeværktøj — ikke en erstatning for lægelig rådgivning.

## Hvad kan det?

| Skill | Beskrivelse |
|-------|-------------|
| **sundhed-dk** | Henter dine sundhedsdata fra sundhed.dk (medicin, prøvesvar, journaler, vaccinationer m.m.) via MitID-login |
| **medrxiv-search** | Søger i medRxiv-preprints via den gratis CSHL API — ingen API-nøgle nødvendig |
| **pubmed-database** | Direkte REST API-adgang til PubMed med avancerede søgemuligheder |
| **playwright-cli** | Browserautomatisering til websider (bruges internt af sundhed-dk) |

## Kom i gang

### Forudsætninger

- [Claude Code](https://claude.com/claude-code) installeret
- Node.js 18+
- En browser (til MitID-login på sundhed.dk)

### Brug

Skills aktiveres automatisk i Claude Code. Prøv f.eks.:

```
> Hent mine seneste prøvesvar fra sundhed.dk
> Søg efter ny forskning om diabetes på medRxiv
> Find artikler om hjertesvigt på PubMed
```

### sundhed.dk — dine sundhedsdata

Første gang du bruger sundhed-dk skillen, åbner den en browser hvor du logger ind med MitID. Derefter hentes dine data automatisk og gemmes lokalt i `data/sundhed-dk/`. Ved efterfølgende brug genbruges de lokale data, så du slipper for at logge ind igen.

Dine data gemmes i to formater:
- **Markdown** (`data/sundhed-dk/parsed/*.md`) — til bred kontekst i samtaler
- **SQLite** (`data/sundhed-dk/health.db`) — til målrettede forespørgsler over tid

### medRxiv — medicinsk forskning

Søg i de nyeste medicinske preprints helt gratis:

```bash
# Søg efter artikler om diabetes fra de seneste 30 dage
scripts/search query "diabetes" --days 30

# Slå en specifik artikel op via DOI
scripts/search doi "10.1101/2024.12.26.24319649"

# Se alle tilgængelige kategorier
scripts/search categories
```

## Privatliv

Dine personlige sundhedsdata forbliver på din egen maskine. Mappen `data/` er gitignored og bliver aldrig committet. Del aldrig disse filer med andre.

## Teknisk stack

- **Playwright CLI** til browserautomatisering (headed mode med MitID)
- **Claude Code Skills** som pakkeformat
- **Node.js** til parsning af rå JSON til markdown og SQLite
- **SQLite** (Node.js built-in) til struktureret datalager

## Projektstruktur

```
.claude/skills/           # Skills (en mappe per skill med SKILL.md)
  sundhed-dk/             # Hent sundhedsdata fra sundhed.dk
  medrxiv-search/         # Søg i medRxiv-preprints
  pubmed-database/        # Søg i PubMed
  playwright-cli/         # Browserautomatisering
data/                     # Personlige sundhedsdata (gitignored)
docs/                     # Dokumentation
```

## Licens

MIT
