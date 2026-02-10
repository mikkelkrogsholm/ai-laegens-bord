#!/usr/bin/env node
// Extracts the most recent value per biochemistry marker from health.db.
// Outputs JSON array to stdout.
// Usage: node extract-markers.mjs [db-path]
// Default db-path: data/sundhed-dk/health.db

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';

const dbPath = process.argv[2] || 'data/sundhed-dk/health.db';

if (!existsSync(dbPath)) {
  console.error(JSON.stringify({ error: `Database not found: ${dbPath}` }));
  process.exit(1);
}

// Map Danish IUPAC analyse_name patterns → English short name + PubMed search term
const MARKER_MAP = [
  { pattern: 'Cholesterol; stofk',             short: 'Total Cholesterol',  pubmed: 'total cholesterol' },
  { pattern: 'Cholesterol, HDL',               short: 'HDL Cholesterol',    pubmed: 'HDL cholesterol' },
  { pattern: 'Cholesterol, LDL; stofk.(DSKB',  short: 'LDL Cholesterol (calc)', pubmed: 'LDL cholesterol' },
  { pattern: 'Cholesterol, LDL; stofk. =',     short: 'LDL Cholesterol',    pubmed: 'LDL cholesterol' },
  { pattern: 'Cholesterol, VLDL',              short: 'VLDL Cholesterol',   pubmed: 'VLDL cholesterol' },
  { pattern: 'Triglycerid',                    short: 'Triglycerides',      pubmed: 'triglycerides' },
  { pattern: 'Glucose; stofk.(gennemsnitlig',  short: 'HbA1c (avg glucose)', pubmed: 'HbA1c glycated hemoglobin' },
  { pattern: 'deoxyfructos-1-yl',              short: 'HbA1c',             pubmed: 'HbA1c glycated hemoglobin' },
  { pattern: 'Alanintransaminase',             short: 'ALAT',              pubmed: 'alanine aminotransferase ALT' },
  { pattern: 'Albumin; massek',                short: 'Albumin',           pubmed: 'serum albumin' },
  { pattern: 'Bilirubiner',                    short: 'Bilirubin',         pubmed: 'total bilirubin' },
  { pattern: 'Amylase, pancreastype',          short: 'Pancreatic Amylase', pubmed: 'pancreatic amylase' },
  { pattern: 'Creatininium',                   short: 'Creatinine',        pubmed: 'serum creatinine' },
  { pattern: 'Glomerulær filtration',          short: 'eGFR',              pubmed: 'estimated glomerular filtration rate eGFR' },
  { pattern: 'Urat; stofk',                    short: 'Urate',             pubmed: 'serum uric acid urate' },
  { pattern: 'Testosteron',                    short: 'Testosterone',      pubmed: 'testosterone' },
  { pattern: 'Calcifediol',                    short: 'Vitamin D',         pubmed: '25-hydroxyvitamin D' },
  { pattern: 'Cobalamin',                      short: 'Vitamin B12',       pubmed: 'cobalamin vitamin B12' },
  { pattern: 'Thyrotropin',                    short: 'TSH',               pubmed: 'thyroid stimulating hormone TSH' },
  { pattern: 'C-reaktivt protein',             short: 'CRP',               pubmed: 'C-reactive protein CRP' },
  { pattern: 'Hæmoglobin(Fe)',                 short: 'Haemoglobin',       pubmed: 'hemoglobin' },
  { pattern: 'Leukocytter; antalk. =',         short: 'Leukocytes',        pubmed: 'white blood cell count leukocytes' },
  { pattern: 'Thrombocytter',                  short: 'Thrombocytes',      pubmed: 'platelet count thrombocytes' },
  { pattern: 'Natrium-ion',                    short: 'Sodium',            pubmed: 'serum sodium' },
  { pattern: 'Kalium-ion',                     short: 'Potassium',         pubmed: 'serum potassium' },
];

const db = new DatabaseSync(dbPath);

// Get most recent value per analyse_name
const rows = db.prepare(`
  SELECT analyse_name, value, unit, reference_lower, reference_upper,
         reference_text, assessment, result_date
  FROM lab_results_biochemistry
  WHERE (analyse_name, result_date) IN (
    SELECT analyse_name, MAX(result_date)
    FROM lab_results_biochemistry
    GROUP BY analyse_name
  )
  ORDER BY analyse_name
`).all();

db.close();

// Match rows to our marker map
const markers = [];

for (const m of MARKER_MAP) {
  const row = rows.find(r => r.analyse_name.includes(m.pattern));
  if (!row) continue;

  markers.push({
    short_name: m.short,
    pubmed_term: m.pubmed,
    analyse_name: row.analyse_name,
    value: row.value,
    unit: row.unit,
    reference_lower: row.reference_lower,
    reference_upper: row.reference_upper,
    reference_text: row.reference_text,
    assessment: row.assessment,
    result_date: row.result_date?.split('T')[0] || row.result_date,
  });
}

console.log(JSON.stringify(markers, null, 2));
