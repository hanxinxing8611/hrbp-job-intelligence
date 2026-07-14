// Create directory junction from project's node_modules to temp dir
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const NM = path.join(ROOT, 'node_modules');
const TARGET = path.join(os.tmpdir(), 'hrbp-deps', 'node_modules');

// Remove existing node_modules
if (fs.existsSync(NM) || fs.lstatSync(NM, { throwIfNoEntry: false })) {
  try {
    const stat = fs.lstatSync(NM);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(NM);
      console.log('Removed existing junction');
    } else {
      fs.rmSync(NM, { recursive: true, force: true });
      console.log('Removed existing directory');
    }
  } catch (e) {
    console.log('Note:', e.message);
    try { fs.unlinkSync(NM); } catch {}
    try { fs.rmSync(NM, { recursive: true, force: true }); } catch {}
  }
}

// Verify target exists
if (!fs.existsSync(TARGET)) {
  console.error(`ERROR: Target directory does not exist: ${TARGET}`);
  process.exit(1);
}

console.log('Target:', TARGET);
console.log('Creating junction...');

try {
  fs.symlinkSync(TARGET, NM, 'junction');
  console.log('Junction created successfully!');
} catch (e) {
  console.error('symlinkSync failed:', e.message);
  // Try alternative: copy directory
  console.log('Trying alternative: direct copy...');
  fs.cpSync(TARGET, NM, { recursive: true, force: true });
  console.log('Direct copy completed');
}

// Verify
if (fs.existsSync(NM)) {
  const entries = fs.readdirSync(NM);
  console.log(`node_modules has ${entries.length} entries`);
  // Check a few key files
  for (const f of ['react/package.json', 'vite/package.json', 'tailwindcss/package.json']) {
    const fp = path.join(NM, f);
    if (fs.existsSync(fp)) {
      const buf = fs.readFileSync(fp);
      console.log(`  ${f}: OK (${buf.length} bytes, starts with [${buf[0]}, ${buf[1]}])`);
    } else {
      console.log(`  ${f}: MISSING`);
    }
  }
}
