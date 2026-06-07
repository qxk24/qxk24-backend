/**
 * Emit docs/UNIVERSITY_KNOWLEDGE_TREE.md from data/university-knowledge-map.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mapPath = join(__dirname, '../data/university-knowledge-map.json');
const outPath = join(__dirname, '../../docs/UNIVERSITY_KNOWLEDGE_TREE.md');

const m = JSON.parse(readFileSync(mapPath, 'utf8'));

function isValid(t) {
  const sf = (t.subfield || '').trim();
  return sf.length >= 3 && !sf.includes('**') && sf !== t.disciplineName;
}

const topics = m.topics.filter(isValid);
const tree = new Map();

for (const t of topics) {
  if (!tree.has(t.majorId)) {
    tree.set(t.majorId, { majorName: t.majorName, disciplines: new Map() });
  }
  const major = tree.get(t.majorId);
  if (!major.disciplines.has(t.disciplineId)) {
    major.disciplines.set(t.disciplineId, { disciplineName: t.disciplineName, topics: [] });
  }
  major.disciplines.get(t.disciplineId).topics.push(t);
}

const majorOrder = [
  'humanities',
  'social-sciences',
  'natural-sciences',
  'formal-sciences',
  'applied-sciences',
];
const sortedMajors = [...tree.entries()].sort((a, b) => {
  const ia = majorOrder.indexOf(a[0]);
  const ib = majorOrder.indexOf(b[0]);
  if (ia >= 0 && ib >= 0) return ia - ib;
  return a[0].localeCompare(b[0]);
});

const lines = [];
const today = new Date().toISOString().slice(0, 10);

lines.push('# University Knowledge Map — Full Taxonomy Tree');
lines.push('');
lines.push('**QXK24 Kernel:** v1.7.0  ');
lines.push('**Source:** `qxk24-backend/data/university-knowledge-map.json`  ');
lines.push(`**Generated:** ${today}  `);
lines.push(`**Valid topics (operational):** ${topics.length}  `);
lines.push(`**Raw rows in JSON:** ${m.topics.length} (${m.topicCount} declared)  `);
lines.push('');
lines.push('> Five majors → primary disciplines → subfields. Each leaf has a stable `topicId` for journals, ADAM topic selection, and auction catalogue keys.');
lines.push('');
lines.push('Regenerate: `node qxk24-backend/scripts/build-university-knowledge-tree-md.mjs`');
lines.push('');
lines.push('---');
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push('| Level | Count |');
lines.push('|-------|------:|');
lines.push(`| Majors | ${sortedMajors.length} |`);

let discCount = 0;
for (const [, major] of sortedMajors) discCount += major.disciplines.size;
lines.push(`| Primary disciplines | ${discCount} |`);
lines.push(`| Subfields (topicId leaves) | ${topics.length} |`);
lines.push('');
lines.push('### Majors at a glance');
lines.push('');
lines.push('| # | majorId | Major | Disciplines | Subfields |');
lines.push('|---|---------|-------|------------:|----------:|');

let majorNum = 0;
for (const [majorId, major] of sortedMajors) {
  majorNum++;
  const subCount = [...major.disciplines.values()].reduce((n, d) => n + d.topics.length, 0);
  lines.push(`| ${majorNum} | \`${majorId}\` | ${major.majorName} | ${major.disciplines.size} | ${subCount} |`);
}

lines.push('');
lines.push('---');
lines.push('');
lines.push('## Full tree');
lines.push('');

majorNum = 0;
for (const [majorId, major] of sortedMajors) {
  majorNum++;
  const majorTopicCount = [...major.disciplines.values()].reduce((n, d) => n + d.topics.length, 0);
  lines.push(`### ${majorNum}. ${major.majorName}`);
  lines.push('');
  lines.push(`- **majorId:** \`${majorId}\``);
  lines.push(`- **Subfields:** ${majorTopicCount}`);
  lines.push('');

  const sortedDisc = [...major.disciplines.entries()].sort((a, b) => {
    const na = parseFloat(a[0]);
    const nb = parseFloat(b[0]);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a[0].localeCompare(b[0]);
  });

  let discNum = 0;
  for (const [disciplineId, disc] of sortedDisc) {
    discNum++;
    disc.topics.sort((a, b) => a.subfield.localeCompare(b.subfield));
    lines.push(`#### ${majorNum}.${discNum} ${disciplineId} — ${disc.disciplineName}`);
    lines.push('');
    lines.push('| topicId | Subfield |');
    lines.push('|---------|----------|');
    for (const t of disc.topics) {
      const sf = t.subfield.replace(/\|/g, '\\|');
      lines.push(`| \`${t.topicId}\` | ${sf} |`);
    }
    lines.push('');
  }
}

writeFileSync(outPath, `${lines.join('\n')}\n`);
console.log(`Wrote ${outPath} (${lines.length} lines)`);
