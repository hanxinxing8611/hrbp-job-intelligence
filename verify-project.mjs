// Verify files in project's node_modules (not temp)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const NM = path.join(ROOT, 'node_modules');

const checks = [
  'react/jsx-runtime.js',
  'react/cjs/react.development.js',
  'react-dom/index.js',
  'react-dom/cjs/react-dom.development.js',
  'vite/package.json',
  'vite/dist/node/index.js',
  'zustand/esm/index.mjs',
  'zustand/index.js',
  'tailwindcss/package.json',
  'tailwindcss/lib/index.js',
  'esbuild/package.json',
  'framer-motion/package.json',
  'lucide-react/package.json',
  'react-router-dom/package.json',
  'typescript/package.json',
  'typescript/lib/tsc.js',
];

let pass = 0;
let fail = 0;

for (const rel of checks) {
  const p = path.join(NM, rel);
  if (!fs.existsSync(p)) {
    console.log(`MISSING: ${rel}`);
    fail++;
    continue;
  }
  const buf = fs.readFileSync(p);
  const first2 = [buf[0], buf[1]];
  const isCorrupt = first2[0] === 0x89 && first2[1] === 0x7d;
  const text = buf.subarray(0, 60).toString('utf8').replace(/\n/g, '\\n');
  if (isCorrupt) {
    console.log(`CORRUPT: ${rel} - bytes: [${first2.join(', ')}] text: ${text.substring(0, 40)}`);
    fail++;
  } else {
    console.log(`OK: ${rel} - bytes: [${first2.join(', ')}] text: ${text.substring(0, 40)}`);
    pass++;
  }
}

console.log(`\n=== Results: ${pass} OK, ${fail} failed ===`);
