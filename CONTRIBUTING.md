# Bidrag til AI-Lægens Bord

Tak fordi du overvejer at bidrage. Her er hvad du skal vide for at komme i gang.

## Forudsætninger

- [Claude Code](https://claude.com/claude-code) (eller Codex / Gemini CLI)
- Node.js 18+
- Git

## Kom i gang

1. Fork og klon projektet
2. Kør `git checkout -b din-feature`
3. Skills ligger i `.claude/skills/` — hver skill er en mappe med en `SKILL.md`
4. Test din ændring lokalt
5. Åbn en pull request mod `main`

## Projektstruktur

```
.claude/skills/       # Skills (en mappe per skill med SKILL.md)
flows/                # Flertrinsprocedurer der kombinerer skills
data/                 # Personlige sundhedsdata (gitignored, committes aldrig)
```

## Hvad kan du bidrage med?

- **Nye skills** — Flere datakilder, analyser, integrationer
- **Bedre parsere** — Mere robust parsing af sundhed.dk's JSON-svar
- **Nye flows** — Flertrinsprocedurer der kombinerer skills til nyttige resultater
- **Fejlrettelser** — Noget der ikke virker? Fix det gerne
- **Dokumentation** — Bedre forklaringer, eksempler, oversættelser

## Konventioner

- Skriv på dansk i brugervendte tekster (skill-beskrivelser, output, README)
- Skriv på engelsk i kode (variabelnavne, kommentarer)
- Personlige sundhedsdata må **aldrig** committes — `data/` mappen er gitignored
- Hold skills selvstændige — alt en skill har brug for skal ligge i dens egen mappe
- Brug `node:sqlite` (Node.js built-in) til databasen, ingen eksterne dependencies

## Pull requests

- Hold PR'er fokuserede — én ting per PR
- Beskriv hvad din ændring gør og hvorfor
- Sørg for at parsere håndterer tomme/manglende data uden at crashe

## Issues

Kig efter issues markeret med `good first issue` hvis du leder efter et sted at starte. Ellers opret gerne et issue inden du går i gang med noget stort, så vi kan snakke om tilgangen.

## Licens

Ved at bidrage accepterer du at dit bidrag licenseres under MIT-licensen.
