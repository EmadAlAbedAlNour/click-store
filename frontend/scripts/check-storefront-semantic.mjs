import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appPath = path.resolve(__dirname, '../src/app/App.jsx');

const source = fs.readFileSync(appPath, 'utf8');
const patterns = [
  /\bbg-(?:white|gray|slate)(?:[-/][\w[\]/%.:-]+)?\b/g,
  /\btext-(?:gray|slate)(?:-\d{2,3})?\b/g,
  /\bborder-(?:gray|slate|white\/)(?:[\w[\]/%.:-]+)?\b/g
];

const matches = [];
const lines = source.split('\n');

for (const regex of patterns) {
  lines.forEach((line, lineIndex) => {
    const found = line.match(regex);
    if (found) {
      found.forEach((token) => matches.push({ token, line: lineIndex + 1, text: line.trim() }));
    }
  });
}

if (matches.length > 0) {
  console.error('\nSemantic storefront check failed. Legacy utility classes found in frontend/src/app/App.jsx:\n');
  matches.slice(0, 80).forEach((match) => {
    console.error(`- line ${match.line}: ${match.token}`);
  });
  if (matches.length > 80) {
    console.error(`...and ${matches.length - 80} more`);
  }
  process.exit(1);
}

console.log('Semantic storefront check passed: no legacy white/gray/slate utilities found in frontend/src/app/App.jsx.');
