// Remove existing node_modules and create a junction to temp directory
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const NM = path.join(ROOT, 'node_modules');
const TARGET = path.join(os.tmpdir(), 'hrbp-deps', 'node_modules');

console.log('Target:', TARGET);

// Step 1: Remove existing node_modules completely
console.log('Removing existing node_modules...');
try {
  const stat = fs.lstatSync(NM);
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(NM);
    console.log('  Removed junction');
  } else {
    fs.rmSync(NM, { recursive: true, force: true });
    console.log('  Removed directory');
  }
} catch (e) {
  console.log('  Note:', e.message);
  try { fs.unlinkSync(NM); console.log('  Unlinked'); } catch {}
  try { fs.rmSync(NM, { recursive: true, force: true }); console.log('  Removed'); } catch {}
}

// Verify it's gone
console.log('Exists after removal?', fs.existsSync(NM));

// Step 2: Verify target exists
if (!fs.existsSync(TARGET)) {
  console.error('ERROR: Target does not exist:', TARGET);
  process.exit(1);
}
console.log('Target exists:', fs.existsSync(TARGET));
console.log('Target entries:', fs.readdirSync(TARGET).length);

// Step 3: Create junction
console.log('Creating junction...');
try {
  fs.symlinkSync(TARGET, NM, 'junction');
  console.log('Junction created!');
} catch (e) {
  console.error('symlinkSync failed:', e.message);
  process.exit(1);
}

// Step 4: Verify junction works
console.log('\nVerifying junction...');
console.log('Exists?', fs.existsSync(NM));
const entries = fs.readdirSync(NM);
console.log('Entries:', entries.length);

// Check a few files
for (const f of ['react/jsx-runtime.js', 'vite/package.json', 'zustand/esm/index.mjs']) {
  const fp = path.join(NM, f);
  if (fs.existsSync(fp)) {
    const buf = fs.readFileSync(fp);
    console.log(`  ${f}: ${buf.length} bytes, [${buf[0]}, ${buf[1]}]`);
  } else {
    console.log(`  ${f}: MISSING`);
  }
}
