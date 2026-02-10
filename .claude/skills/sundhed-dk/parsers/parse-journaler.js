#!/usr/bin/env node
// Parser for sundhed.dk Journaler (health records) JSON
// Usage: node parse-journaler.js < journaler.json

const fs = require('fs');
const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));

function formatDate(dateString) {
  if (!dateString) return 'ukendt';
  const date = new Date(dateString);
  return date.toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function parseJournaler(responses) {
  const lines = [];
  lines.push('# Journaler (Sygehusforløb)');
  lines.push('');

  // Find overview
  const overview = responses.find(r => r.url.includes('/ejournal/forloebsoversigt'));
  if (!overview?.body) {
    lines.push('Ingen journaler fundet.');
    return lines.join('\n');
  }

  const data = overview.body;
  lines.push(`Patient: ${data.Navn}`);
  lines.push(`Antal forløb: ${data.NumberOfForloeb}`);
  lines.push('');

  // Filter options (hospitals/diagnoses the patient has been at)
  const filtervalg = responses.find(r => r.url.includes('/ejournal/filtervalg'));
  if (filtervalg?.body?.Sygehuse) {
    lines.push('## Sygehuse med journaler');
    filtervalg.body.Sygehuse.forEach(s => {
      if (s.Navn && s.Navn !== 'Ej oplyst') {
        const afdelinger = s.Afdelinger.filter(a => a.Navn).map(a => a.Navn).join(', ');
        lines.push(`- ${s.Navn}: ${afdelinger}`);
      }
    });
    lines.push('');
  }

  // Date range
  const datofiltrering = responses.find(r => r.url.includes('/ejournal/datofiltrering'));
  if (datofiltrering?.body) {
    const fra = formatDate(datofiltrering.body.FraDato);
    const til = formatDate(datofiltrering.body.TilDato);
    lines.push(`Datointerval: ${fra} til ${til}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Forløb (episodes)
  (data.Forloeb || []).forEach((f, i) => {
    if (f.Skjult) {
      lines.push(`## ${i + 1}. [SKJULT] ${f.Varsling || 'Privatmarkeret forløb'}`);
      lines.push('');
      return;
    }

    const fra = formatDate(f.DatoFra);
    const til = f.DatoTil ? formatDate(f.DatoTil) : 'pågår';

    lines.push(`## ${i + 1}. ${f.DiagnoseNavn || 'Ingen diagnose'}`);
    lines.push(`- Diagnosekode: ${f.DiagnoseKode || 'ingen'}`);
    lines.push(`- Sygehus: ${f.SygehusNavn || 'ukendt'}`);
    lines.push(`- Afdeling: ${f.AfdelingNavn || 'ukendt'}`);
    lines.push(`- Sektor: ${f.Sektor || 'ukendt'}`);
    lines.push(`- Periode: ${fra} til ${til}`);
    lines.push(`- Senest opdateret: ${formatDate(f.DatoOpdateret)}`);
    lines.push(`- Indhold: ${f.AntalEpikriser || 0} epikriser, ${f.AntalNotater || 0} notater, ${f.AntalDiagnoser || 0} diagnoser, ${f.AntalProcedurer || 0} procedurer`);
    lines.push('');
  });

  return lines.join('\n');
}

console.log(parseJournaler(input));
