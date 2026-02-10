# Flow: Lab Deep Dive

Gennemgå dine seneste blodprøveresultater, sammenlign med aktuel forskning, find mønstre på tværs af markører, og udarbejd en evidensbaseret handlingsplan.

## Hvornår

Kør dette flow når du har nye prøvesvar fra sundhed.dk og vil forstå hvad tallene egentlig betyder — ud over det standard-referenceintervallet din læge bruger.

## Hvad det gør

```
sundhed-dk (data) → lab-review (analyse) → mønstergenkendelse → PubMed + medRxiv (forskning) → handlingsplan
```

## Trin

### 1. Sørg for at data er hentet

Tjek om `data/sundhed-dk/health.db` eksisterer og er opdateret. Hvis ikke, brug `sundhed-dk`-skillen til at hente friske data via MitID.

### 2. Kør lab-review

Sig til din agent:

```
Kør lab-review skillen på mine prøvesvar
```

Dette:
- Trækker seneste værdi per markør ud af databasen (~20–25 markører)
- Søger PubMed og medRxiv parallelt for hver markør
- Sammenligner din værdi med evidensbaserede optimale intervaller (ikke bare standard-referenceintervallet)
- Gemmer rapport i `data/lab-review/report.md`

### 3. Find den røde tråd

Bed agenten se på tværs af de markører der stikker ud:

```
Kig på tværs af rapporten — er der en fælles nævner?
```

Ofte hænger afvigelser sammen. Eksempler på mønstre:
- Forhøjet CRP + lav HDL + forhøjet urat + lav vitamin D → kronisk lavgradig inflammation
- Forhøjet HbA1c + forhøjede triglycerider + lav HDL → metabolisk syndrom / insulinresistens
- Lav B12 + lav hæmoglobin + forhøjet MCV → B12-mangel-anæmi

### 4. Undersøg interventioner

Når mønsteret er identificeret, bed agenten undersøge hvad forskningen siger om den bedste behandling — på tværs af flere dimensioner:

```
Send agenter ud for at søge i PubMed og medRxiv efter den bedste evidens
for at håndtere [det identificerede mønster]. Dæk kost, motion, tilskud
og livsstil (søvn, stress, alkohol).
```

Agenten vil typisk spawne 4 parallelle søgninger og sammenstille resultaterne.

### 5. Kompilér handlingsplan

Resultaterne samles i en prioriteret handlingsplan med:
- Konkrete anbefalinger rangeret efter effektstørrelse
- Forventede biomarkør-ændringer med tidshorisont
- Kontrolplan (hvornår man skal tage nye prøver)

Gemmes i `data/lab-review/action-plan.md`.

## Output

| Fil | Indhold |
|-----|---------|
| `data/lab-review/report.md` | Alle markører sammenholdt med forskning |
| `data/lab-review/action-plan.md` | Prioriteret handlingsplan med evidens |

## Skills der bruges

| Skill | Rolle i flowet |
|-------|---------------|
| `sundhed-dk` | Henter rådata fra sundhed.dk |
| `lab-review` | Trækker markører ud og søger PubMed + medRxiv |
| `pubmed-database` | Bruges indirekte via lab-review scripts |
| `medrxiv-search` | Bruges indirekte via lab-review scripts |

## Eksempel

Se anonymiserede eksempler på output:
- [Rapport-eksempel](../. claude/skills/lab-review/example/report-example.md)
- [Handlingsplan-eksempel](../.claude/skills/lab-review/example/action-plan-example.md)

## Vigtige forbehold

- **Ikke lægelig rådgivning.** Brug output som udgangspunkt for samtale med din læge.
- **Standard-referenceintervaller er ikke forkerte** — de er bare populationsbaserede. Evidensbaserede optimale intervaller er ofte strammere og mere individualiserede.
- **Mønstergenkendelse kræver kontekst.** Agenten ser kun tal — din læge kender din sygehistorie, medicin og livssituation.
- **Forskning ændrer sig.** Kør flowet igen med jævne mellemrum for at fange nye meta-analyser og guidelines.
