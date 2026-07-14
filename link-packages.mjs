// Create per-package symlinks from project's node_modules to temp directory
// This avoids esbuild reading corrupted files from the project directory
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const NM = path.join(ROOT, 'node_modules');
const TARGET = path.join(os.tmpdir(), 'hrbp-deps', 'node_modules');

console.log('Target:', TARGET);

// Step 1: Remove existing node_modules contents but keep the directory
console.log('Clearing node_modules...');
if (fs.existsSync(NM)) {
  // Try to remove everything inside node_modules
  const entries = fs.readdirSync(NM);
  for (const entry of entries) {
    const entryPath = path.join(NM, entry);
    try {
      const stat = fs.lstatSync(entryPath);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(entryPath);
      } else {
        fs.rmSync(entryPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.log(`  [warn] Could not remove ${entry}: ${e.message}`);
    }
  }
}

// Verify it's empty (or nearly empty)
const remaining = fs.readdirSync(NM);
console.log(`Remaining entries: ${remaining.length}`);

// Step 2: Create symlinks for each entry in the temp directory
console.log('\nCreating symlinks...');
const targetEntries = fs.readdirSync(TARGET);
let created = 0;
let failed = 0;

for (const entry of targetEntries) {
  const targetPath = path.join(TARGET, entry);
  const linkPath = path.join(NM, entry);

  try {
    // Use 'junction' for directories (doesn't require admin privileges on Windows)
    // Use 'file' for files
    const stat = fs.lstatSync(targetPath);
    if (stat.isDirectory()) {
      fs.symlinkSync(targetPath, linkPath, 'junction');
    } else {
      fs.symlinkSync(targetPath, linkPath, 'file');
    }
    created++;
  } catch (e) {
    // If symlink fails, try copying
    try {
      if (fs.existsSync(linkPath)) {
        fs.rmSync(linkPath, { recursive: true, force: true });
      }
      fs.symlinkSync(targetPath, linkPath, 'junction');
      created++;
    } catch (e2) {
      console.log(`  [fail] ${entry}: ${e2.message}`);
      failed++;
    }
  }
}

console.log(`Created: ${created}, Failed: ${failed}`);

// Step 3: Also need @esbuild/win32-x64@0.18.20 in the temp directory
// Check if it exists there
const esbuildPlatform = path.join(TARGET, '@esbuild', 'win32-x64');
if (fs.existsSync(esbuildPlatform)) {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(esbuildPlatform, 'package.json'), 'utf8'));
  console.log(`\n@esbuild/win32-x64 version in temp: ${pkgJson.version}`);
  if (pkgJson.version !== '0.18.20') {
    console.log('WARNING: Version mismatch! Need 0.18.20 to match esbuild');
  }
}

// Step 4: Verify symlinks work
console.log('\nVerifying symlinks...');
const checks = ['react/jsx-runtime.js', 'vite/package.json', 'zustand/esm/index.mjs'];
for (const f of checks) {
  const fp = path.join(NM, f);
  if (fs.existsSync(fp)) {
    const buf = fs.readFileSync(fp);
    console.log(`  ${f}: ${buf.length} bytes, [${buf[0]}, ${buf[1]}]`);
  } else {
    console.log(`  ${f}: MISSING`);
  }
}
