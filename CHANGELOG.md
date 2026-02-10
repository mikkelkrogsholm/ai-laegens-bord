# Changelog

Alle væsentlige ændringer i projektet dokumenteres her.

Formatet er baseret på [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), og projektet bruger [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-06-10

Første offentlige release.

### Tilføjet

- **sundhed-dk skill** — Henter sundhedsdata fra sundhed.dk via MitID-login. Understøtter medicin, prøvesvar, journaler, vaccinationer, aftaler, henvisninger, egen læge, røntgen, diagnoser, hjemmemålinger og forløbsplaner.
- **lab-review skill** — Krydstjekker prøvesvar mod aktuel forskning fra PubMed og medRxiv. Finder hvor standard-referenceintervaller ikke matcher evidensbaserede optimale intervaller.
- **medrxiv-search skill** — Søgning i medRxiv-preprints via CSHL API.
- **pubmed-database skill** — Direkte REST API-adgang til PubMed.
- **playwright-cli skill** — Browserautomatisering til sundhed.dk login og navigation.
- **lab-deep-dive flow** — Samlet flow: prøvesvar → forskning → mønstre → interventioner → handlingsplan.
- 11 parsere der konverterer rå JSON til markdown.
- SQLite-database (`build-db.js`) med 13 tabeller til struktureret forespørgsel.
- Dansk README med eksempler og dokumentation.
