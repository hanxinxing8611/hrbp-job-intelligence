// Download @esbuild/win32-x64 from npm registry and extract it
import https from 'https'
import fs from 'fs'
import path from 'path'
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

async function main() {
  console.log('Downloading esbuild binary metadata...')
  
  // Get package metadata
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

  // Extract using tar
  console.log('Extracting...')
  if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true })
  fs.mkdirSync(extractDir, { recursive: true })
  
  execSync(`tar -xzf "${tarballPath}" -C "${extractDir}"`, { stdio: 'inherit' })

  // Copy to target
  const pkgDir = path.join(extractDir, 'package')
  console.log('Copying to:', targetDir)
  
  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(targetDir), { recursive: true })
  
  // Use xcopy on Windows
  execSync(`xcopy /E /I /Y "${pkgDir}" "${targetDir}"`, { stdio: 'inherit', shell: 'cmd.exe' })

  console.log('Done!')
  console.log('Files in target dir:', fs.readdirSync(targetDir))
}

main().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
