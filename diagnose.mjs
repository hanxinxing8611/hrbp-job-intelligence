// Diagnostic script to pinpoint where file corruption occurs
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import os from 'node:os';

const REGISTRY = 'https://registry.npmmirror.com';
const TEMP = path.join(os.tmpdir(), 'hrbp-diag');

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

async function main() {
  // Clean up
  if (fs.existsSync(TEMP)) fs.rmSync(TEMP, { recursive: true, force: true });
  fs.mkdirSync(TEMP, { recursive: true });

  // 1. Fetch react package metadata
  console.log('=== Step 1: Fetch react metadata ===');
  const meta = await fetchJson(`${REGISTRY}/react/18.3.1`);
  const tarballUrl = meta.dist.tarball;
  console.log('Tarball URL:', tarballUrl);

  // 2. Download tarball
  console.log('\n=== Step 2: Download tarball ===');
  const tgzBuffer = await downloadBuffer(tarballUrl);
  console.log('Downloaded bytes:', tgzBuffer.length);
  console.log('First 4 bytes:', Array.from(tgzBuffer.subarray(0, 4)));
  console.log('Is gzip?', tgzBuffer[0] === 0x1f && tgzBuffer[1] === 0x8b);

  // 3. Write tgz to temp and read back
  console.log('\n=== Step 3: Write tgz to temp ===');
  const tgzPath = path.join(TEMP, 'react.tgz');
  fs.writeFileSync(tgzPath, tgzBuffer);
  const tgzReadback = fs.readFileSync(tgzPath);
  console.log('Readback bytes:', tgzReadback.length);
  console.log('Readback first 4:', Array.from(tgzReadback.subarray(0, 4)));
  console.log('Matches buffer?', tgzReadback.length === tgzBuffer.length && tgzReadback.subarray(0, 4).equals(tgzBuffer.subarray(0, 4)));

  // 4. Gunzip
  console.log('\n=== Step 4: Gunzip (decompress) ===');
  const tarBuffer = zlib.gunzipSync(tgzReadback);
  console.log('Tar buffer bytes:', tarBuffer.length);
  console.log('Tar first 4 bytes:', Array.from(tarBuffer.subarray(0, 4)));

  // 5. Parse tar and find jsx-runtime.js
  console.log('\n=== Step 5: Extract jsx-runtime.js ===');
  let offset = 0;
  let jsxRuntimeData = null;
  let filesFound = 0;
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

    offset += 512;

    if ((typeFlag === '0' || typeFlag === '\0') && !name.endsWith('/')) {
      filesFound++;
      if (name.includes('jsx-runtime.js')) {
        jsxRuntimeData = tarBuffer.subarray(offset, offset + size);
        console.log('Found:', name);
        console.log('Size:', size);
        console.log('First 20 bytes:', Array.from(jsxRuntimeData.subarray(0, 20)));
        console.log('As text:', jsxRuntimeData.subarray(0, 80).toString('utf8'));
      }
    }

    offset += Math.ceil(size / 512) * 512;
  }
  console.log('Total files in tar:', filesFound);

  if (!jsxRuntimeData) {
    console.log('ERROR: jsx-runtime.js not found in tar');
    return;
  }

  // 6. Write extracted file to temp
  console.log('\n=== Step 6: Write extracted jsx-runtime.js to temp ===');
  const extractedPath = path.join(TEMP, 'jsx-runtime.js');
  fs.writeFileSync(extractedPath, jsxRuntimeData);
  const extractedReadback = fs.readFileSync(extractedPath);
  console.log('Readback bytes:', extractedReadback.length);
  console.log('Readback first 20:', Array.from(extractedReadback.subarray(0, 20)));
  console.log('Matches?', extractedReadback.length === jsxRuntimeData.length && extractedReadback.subarray(0, 20).equals(jsxRuntimeData.subarray(0, 20)));

  // 7. Copy to a "node_modules" style path
  console.log('\n=== Step 7: cpSync to node_modules/react/ ===');
  const nmDir = path.join(TEMP, 'node_modules', 'react');
  fs.mkdirSync(nmDir, { recursive: true });
  fs.cpSync(extractedPath, path.join(nmDir, 'jsx-runtime.js'), { force: true });
  const copiedFile = fs.readFileSync(path.join(nmDir, 'jsx-runtime.js'));
  console.log('Copied bytes:', copiedFile.length);
  console.log('Copied first 20:', Array.from(copiedFile.subarray(0, 20)));
  console.log('Matches?', copiedFile.length === jsxRuntimeData.length && copiedFile.subarray(0, 20).equals(jsxRuntimeData.subarray(0, 20)));

  // 8. Also test: write a known string and read back
  console.log('\n=== Step 8: Write known string test ===');
  const testContent = 'console.log("hello world");\n';
  const testPath = path.join(TEMP, 'test.txt');
  fs.writeFileSync(testPath, testContent);
  const testReadback = fs.readFileSync(testPath);
  console.log('Written:', JSON.stringify(testContent));
  console.log('Readback:', JSON.stringify(testReadback.toString()));
  console.log('Matches?', testReadback.toString() === testContent);

  // 9. Test with a larger file (simulating real JS content)
  console.log('\n=== Step 9: Write larger JS content ===');
  const jsContent = `'use strict';\n\nObject.defineProperty(exports, '__esModule', { value: true });\n\nvar React = require('react');\n\nfunction _interopNamespace(e) {\n  if (e && e.__esModule) return e;\n  var n = Object.create(null);\n  if (e) {\n    for (var k in e) {\n      n[k] = e[k];\n    }\n  }\n  return n;\n}\n\nconsole.log("This is a test of file integrity");\n`;
  const jsPath = path.join(TEMP, 'test.js');
  fs.writeFileSync(jsPath, jsContent);
  const jsReadback = fs.readFileSync(jsPath);
  console.log('First 40 chars written:', JSON.stringify(jsContent.substring(0, 40)));
  console.log('First 40 chars readback:', JSON.stringify(jsReadback.toString().substring(0, 40)));
  console.log('Matches?', jsReadback.toString() === jsContent);
  console.log('Readback first 4 bytes:', Array.from(jsReadback.subarray(0, 4)));

  console.log('\n=== Done ===');
  console.log('Temp dir:', TEMP);
}

main().catch(console.error);
