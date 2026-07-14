// Install correct version of @esbuild/win32-x64 to match esbuild 0.18.20
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const REGISTRY = 'https://registry.npmmirror.com';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const NM = path.join(ROOT, 'node_modules');
const TEMP = path.join(os.tmpdir(), 'hrbp-esbuild-fix');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchJson(res.headers.location));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
    }).on('error', reject);
  });
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const doReq = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return doReq(res.headers.location, redirects + 1);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    };
    doReq(url);
  });
}

function extractTarGz(tgzBuffer, destDir) {
  const tarBuffer = zlib.gunzipSync(tgzBuffer);
  let offset = 0;
  while (offset < tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    if (header.every(b => b === 0)) break;
    let name = '';
    for (let i = 0; i < 100; i++) {
      if (header[i] === 0) break;
      name += String.fromCharCode(header[i]);
    }
    let sizeStr = '';
    for (let i = 124; i < 136; i++) {
      if (header[i] === 0 || header[i] === 32) break;
      sizeStr += String.fromCharCode(header[i]);
    }
    const size = parseInt(sizeStr, 8) || 0;
    const typeFlag = String.fromCharCode(header[156]);
    let prefix = '';
    if (header.subarray(257, 262).toString() === 'ustar') {
      for (let i = 345; i < 500; i++) {
        if (header[i] === 0) break;
        prefix += String.fromCharCode(header[i]);
      }
    }
    const fullPath = path.join(destDir, prefix + name);
    offset += 512;
    if (typeFlag === '5' || name.endsWith('/')) {
      fs.mkdirSync(fullPath, { recursive: true });
    } else if (typeFlag === '0' || typeFlag === '\0') {
      const fileData = tarBuffer.subarray(offset, offset + size);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, fileData);
    }
    offset += Math.ceil(size / 512) * 512;
  }
}

async function main() {
  console.log('=== Installing @esbuild/win32-x64@0.18.20 ===');

  if (fs.existsSync(TEMP)) fs.rmSync(TEMP, { recursive: true, force: true });
  fs.mkdirSync(TEMP, { recursive: true });

  // Fetch package metadata
  const meta = await fetchJson(`${REGISTRY}/@esbuild/win32-x64/0.18.20`);
  console.log('Tarball:', meta.dist.tarball);

  // Download
  const tgzBuffer = await downloadBuffer(meta.dist.tarball);
  console.log('Downloaded:', tgzBuffer.length, 'bytes');
  console.log('Is gzip:', tgzBuffer[0] === 0x1f && tgzBuffer[1] === 0x8b);

  // Extract to temp
  const extractDir = path.join(TEMP, 'extract');
  fs.mkdirSync(extractDir, { recursive: true });
  extractTarGz(tgzBuffer, extractDir);

  // Copy to node_modules/@esbuild/win32-x64
  const targetDir = path.join(NM, '@esbuild', 'win32-x64');
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.cpSync(path.join(extractDir, 'package'), targetDir, { recursive: true, force: true });

  // Verify esbuild.exe
  const exePath = path.join(targetDir, 'esbuild.exe');
  if (fs.existsSync(exePath)) {
    const buf = fs.readFileSync(exePath);
    console.log('esbuild.exe installed:', buf.length, 'bytes');
    console.log('First 2 bytes:', [buf[0], buf[1]], '(should be 77, 90 = MZ)');
    console.log('Valid PE?', buf[0] === 0x4d && buf[1] === 0x5a);
  } else {
    console.log('ERROR: esbuild.exe not found after install!');
  }

  // Cleanup
  fs.rmSync(TEMP, { recursive: true, force: true });
  console.log('Done!');
}

main().catch(console.error);
