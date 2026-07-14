// Download @esbuild/win32-x64 from npm registry and extract it
import https from 'https'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { execSync } from 'child_process'
import os from 'os'

const version = '0.18.20'
const pkgName = '@esbuild/win32-x64'
const tmpDir = path.join(os.tmpdir(), 'esbuild-download')
const tarballPath = path.join(tmpDir, 'esbuild-win32.tgz')
const extractDir = path.join(tmpDir, 'extracted')
const targetDir = path.join(os.tmpdir(), 'hrbp-deps', 'node_modules', '@esbuild', 'win32-x64')

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        download(response.headers.location, dest).then(resolve).catch(reject)
        return
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', reject)
  })
}

function extractTarGz(tarballPath, destDir) {
  const gunzip = zlib.createGunzip()
  const input = fs.createReadStream(tarballPath)
  let tarData = Buffer.alloc(0)

  return new Promise((resolve, reject) => {
    input.pipe(gunzip)
      .on('data', (chunk) => {
        tarData = Buffer.concat([tarData, chunk])
      })
      .on('end', () => {
        try {
          parseTar(tarData, destDir)
          resolve()
        } catch (e) {
          reject(e)
        }
      })
      .on('error', reject)
  })
}

function parseTar(buffer, destDir) {
  let offset = 0
  while (offset < buffer.length) {
    const header = buffer.slice(offset, offset + 512)
    if (header[0] === 0) break // end of archive

    const name = header.toString('utf8', 0, 100).replace(/\0/g, '')
    const sizeStr = header.toString('utf8', 124, 124 + 12).replace(/\0/g, '').trim()
    const size = parseInt(sizeStr, 8) || 0
    const typeflag = header.toString('utf8', 156, 157)

    const contentOffset = offset + 512
    const content = buffer.slice(contentOffset, contentOffset + size)

    const filePath = path.join(destDir, name)
    const dir = path.dirname(filePath)

    if (typeflag === '5' || name.endsWith('/')) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true })
    } else {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, content)
    }

    const paddedSize = Math.ceil(size / 512) * 512
    offset = contentOffset + paddedSize
  }
}

async function main() {
  console.log('Downloading esbuild binary metadata...')
  
  const metadata = await new Promise((resolve, reject) => {
    let data = ''
    https.get(`https://registry.npmjs.org/${pkgName.replace('/', '%2f')}`, (res) => {
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })

  const tarballUrl = metadata.versions[version].dist.tarball
  console.log('Tarball URL:', tarballUrl)

  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  
  console.log('Downloading tarball...')
  await download(tarballUrl, tarballPath)
  console.log('Downloaded:', fs.statSync(tarballPath).size, 'bytes')

  console.log('Extracting...')
  if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true })
  fs.mkdirSync(extractDir, { recursive: true })
  
  await extractTarGz(tarballPath, extractDir)

  const pkgDir = path.join(extractDir, 'package')
  console.log('Extracted files:', fs.readdirSync(pkgDir))

  console.log('Copying to:', targetDir)
  
  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(targetDir), { recursive: true })
  
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
    const entries = fs.readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
  
  copyDir(pkgDir, targetDir)

  console.log('Done!')
  console.log('Files in target dir:', fs.readdirSync(targetDir))
}

main().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
