// Custom npm package installer using Node.js https module
// Bypasses npm 11.x's corrupted download mechanism AND tar command issues
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const REGISTRY = 'https://registry.npmmirror.com';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Install to a directory under the system temp dir to avoid TRAE SOLO CN's
// file watcher corrupting files written into the project directory.
const TEMP_BASE = path.join(os.tmpdir(), 'hrbp-deps');
const NODE_MODULES = path.join(TEMP_BASE, 'node_modules');
// Use system temp dir (no spaces, no TRAE file watcher interference)
const TEMP_DIR = path.join(TEMP_BASE, 'installer-temp');

// Extract .tgz file entirely in Node.js (no external tar command needed)
function extractTarGz(tgzPath, destDir) {
  const compressed = fs.readFileSync(tgzPath);
  const tarBuffer = zlib.gunzipSync(compressed);

  let offset = 0;
  while (offset < tarBuffer.length) {
    // Read 512-byte header
    const header = tarBuffer.subarray(offset, offset + 512);
    if (header.every(b => b === 0)) break; // End of archive

    // Parse filename (0-100, null-terminated)
    let name = '';
    for (let i = 0; i < 100; i++) {
      if (header[i] === 0) break;
      name += String.fromCharCode(header[i]);
    }

    // Parse size (124-136, octal, null-terminated)
    let sizeStr = '';
    for (let i = 124; i < 136; i++) {
      if (header[i] === 0 || header[i] === 32) break;
      sizeStr += String.fromCharCode(header[i]);
    }
    const size = parseInt(sizeStr, 8) || 0;

    // Parse type flag (156)
    const typeFlag = String.fromCharCode(header[156]);

    // USTAR prefix (345-500)
    let prefix = '';
    if (header.subarray(257, 262).toString() === 'ustar') {
      for (let i = 345; i < 500; i++) {
        if (header[i] === 0) break;
        prefix += String.fromCharCode(header[i]);
      }
    }

    const fullPath = path.join(destDir, prefix + name);
    offset += 512; // Move past header

    if (typeFlag === '5' || name.endsWith('/')) {
      // Directory
      fs.mkdirSync(fullPath, { recursive: true });
    } else if (typeFlag === '0' || typeFlag === '\0') {
      // Regular file
      const fileData = tarBuffer.subarray(offset, offset + size);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, fileData);
    }
    // Skip symlinks and other types

    // Move to next entry (file data padded to 512-byte boundary)
    offset += Math.ceil(size / 512) * 512;
  }
}

// Simple semver: match ^x.y.z or ~x.y.z or exact
function matchVersion(version, range) {
  range = range.trim();
  if (range === '*' || range === 'latest') return true;
  // Remove ^ or ~
  const cleanRange = range.replace(/^[^~^]/, '').replace(/^[~^]/, '');
  const [rMajor, rMinor, rPatch] = cleanRange.split('.').map(Number);
  const [vMajor, vMinor, vPatch] = version.split('.').map(Number);
  if (range.startsWith('^')) {
    if (vMajor !== rMajor) return false;
    if (vMajor === 0 && vMinor !== rMinor) return false;
    return true;
  }
  if (range.startsWith('~')) {
    return vMajor === rMajor && vMinor === rMinor;
  }
  // exact match
  return version === cleanRange;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const doRequest = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return doRequest(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString()));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    };
    doRequest(url);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const doRequest = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return doRequest(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        // Buffer entire response in memory, then write with writeFileSync
        // (createWriteStream causes corruption in this environment)
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          // Verify gzip header before writing
          if (buf[0] !== 0x1f || buf[1] !== 0x8b) {
            return reject(new Error(`Invalid gzip header: ${buf[0]},${buf[1]} for ${url}`));
          }
          // Write all at once using writeFileSync (proven to work without corruption)
          fs.writeFileSync(dest, buf);
          // Read back and verify
          const verify = fs.readFileSync(dest);
          if (verify[0] === 0x1f && verify[1] === 0x8b && verify.length === buf.length) {
            resolve();
          } else {
            try { fs.unlinkSync(dest); } catch {}
            reject(new Error(`File corrupted after write: expected ${buf.length} bytes, got ${verify.length}`));
          }
        });
      }).on('error', reject);
    };
    doRequest(url);
  });
}

async function resolveVersion(name, range) {
  range = range.trim();
  // Handle exact versions
  if (/^\d+\.\d+\.\d+$/.test(range)) {
    return range;
  }
  // Handle dist-tags like "latest"
  const meta = await fetchJson(`${REGISTRY}/${encodeURIComponent(name).replace('%40', '@')}`);
  if (range === 'latest' || range === '*') {
    return meta['dist-tags']?.latest || Object.keys(meta.versions).pop();
  }
  // Find best matching version
  const versions = Object.keys(meta.versions).filter(v => /^\d+\.\d+\.\d+$/.test(v));
  const matching = versions.filter(v => matchVersion(v, range));
  matching.sort((a, b) => {
    const [a1,a2,a3] = a.split('.').map(Number);
    const [b1,b2,b3] = b.split('.').map(Number);
    return b1-a1 || b2-a2 || b3-a3;
  });
  return matching[0] || meta['dist-tags']?.latest;
}

async function installPackage(name, range, installed = new Set()) {
  const key = `${name}@${range}`;
  if (installed.has(name)) {
    console.log(`  [skip] ${name} already installed`);
    return;
  }
  installed.add(name);

  const version = await resolveVersion(name, range);
  if (!version) {
    console.log(`  [warn] Could not resolve ${name}@${range}`);
    return;
  }

  console.log(`  [install] ${name}@${version}`);

  // Get package metadata for this specific version
  const pkgMeta = await fetchJson(`${REGISTRY}/${encodeURIComponent(name).replace('%40', '@')}/${version}`);
  const tarballUrl = pkgMeta.dist.tarball;

  // Download tarball
  const tgzPath = path.join(TEMP_DIR, `${name.replace('@','').replace('/','-')}-${version}.tgz`);
  await downloadFile(tarballUrl, tgzPath);

  // Extract
  const extractDir = path.join(TEMP_DIR, `extract-${name.replace('@','').replace('/','-')}`);
  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
  fs.mkdirSync(extractDir, { recursive: true });

  extractTarGz(tgzPath, extractDir);

  // Move to node_modules using cpSync (rename fails with EPERM on locked dirs)
  const pkgDir = path.join(extractDir, 'package');
  let targetDir;
  if (name.startsWith('@')) {
    const [scope, pkg] = name.split('/');
    targetDir = path.join(NODE_MODULES, scope, pkg);
    fs.mkdirSync(path.join(NODE_MODULES, scope), { recursive: true });
  } else {
    targetDir = path.join(NODE_MODULES, name);
  }

  // Copy recursively, overwriting existing files
  fs.cpSync(pkgDir, targetDir, { recursive: true, force: true });

  // Clean up
  fs.unlinkSync(tgzPath);
  fs.rmSync(extractDir, { recursive: true, force: true });

  // Read installed package's dependencies and recursively install
  const installedPkgJson = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
  const subDeps = { ...(installedPkgJson.dependencies || {}), ...(installedPkgJson.peerDependencies || {}) };

  // Only install sub-deps that are not yet installed
  for (const [depName, depRange] of Object.entries(subDeps)) {
    if (!installed.has(depName)) {
      try {
        await installPackage(depName, depRange, installed);
      } catch (e) {
        console.log(`  [warn] Failed to install sub-dep ${depName}@${depRange}: ${e.message}`);
      }
    }
  }

  // Skip postinstall scripts (esbuild's postinstall just validates the binary,
  // which we already provide via @esbuild/win32-x64)
}

async function main() {
  console.log('=== Custom Node.js Package Installer ===');
  console.log(`Registry: ${REGISTRY}`);
  console.log('');

  // Ensure node_modules exists
  if (!fs.existsSync(NODE_MODULES)) {
    fs.mkdirSync(NODE_MODULES, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Read package.json
  const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const allDeps = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {})
  };

  console.log(`Installing ${Object.keys(allDeps).length} direct dependencies...`);
  console.log('');

  const installed = new Set();
  for (const [name, range] of Object.entries(allDeps)) {
    try {
      await installPackage(name, range, installed);
    } catch (e) {
      console.error(`  [error] Failed to install ${name}@${range}: ${e.message}`);
    }
  }

  // Clean up temp dir
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('');
  console.log('=== Installation complete! ===');
  console.log(`Installed ${installed.size} packages.`);
}

main().catch(console.error);
