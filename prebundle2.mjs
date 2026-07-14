// Pre-bundle all dependencies using esbuild with Node.js file reading
import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import os from 'os'

const nm = path.resolve(process.cwd(), 'node_modules')
const outDir = path.join(os.tmpdir(), 'hrbp-vite-deps')

const deps = [
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/client',
  'zustand',
  'zustand/middleware',
  'framer-motion',
  'lucide-react',
  'react-router-dom',
]

function resolveBareImport(importPath, fromDir = nm) {
  const parts = importPath.split('/')
  const pkgName = parts[0].startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0]
  const restPath = parts.slice(pkgName.startsWith('@') ? 2 : 1).join('/')
  const pkgDir = path.join(fromDir, pkgName)

  try {
    const pkgJsonPath = path.join(pkgDir, 'package.json')
    if (!fs.existsSync(pkgJsonPath)) return null
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))

    let entry
    if (restPath) {
      entry = restPath
    } else {
      entry = pkgJson.module || pkgJson.main || 'index.js'
    }

    const fullPath = path.join(pkgDir, entry)
    const candidates = [
      fullPath,
      fullPath + '.js',
      fullPath + '.mjs',
      fullPath + '.cjs',
      path.join(fullPath, 'index.js'),
      path.join(fullPath, 'index.mjs'),
      path.join(fullPath, 'index.cjs'),
    ]

    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        return c
      }
    }
  } catch {}
  return null
}

const nodeFsPlugin = {
  name: 'node-fs',
  setup(build) {
    build.onResolve({ filter: /^[^./\\]/ }, (args) => {
      const fromDir = args.importer ? path.dirname(args.importer) : nm
      const resolved = resolveBareImport(args.path, fromDir)
      if (resolved) {
        return { path: resolved, namespace: 'node-fs' }
      }
      // Try in parent node_modules
      const parentNm = path.resolve(nm, '..', 'node_modules')
      const resolved2 = resolveBareImport(args.path, parentNm)
      if (resolved2) {
        return { path: resolved2, namespace: 'node-fs' }
      }
      return undefined
    })

    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (!args.importer || !args.importer.includes('node_modules')) return undefined
      const resolved = path.resolve(path.dirname(args.importer), args.path)
      const candidates = [
        resolved,
        resolved + '.js',
        resolved + '.mjs',
        resolved + '.cjs',
        path.join(resolved, 'index.js'),
        path.join(resolved, 'index.mjs'),
        path.join(resolved, 'index.cjs'),
      ]
      for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
          return { path: c, namespace: 'node-fs' }
        }
      }
      return undefined
    })

    build.onLoad({ filter: /.*/, namespace: 'node-fs' }, (args) => {
      try {
        const filePath = args.path
        if (!fs.existsSync(filePath)) return undefined
        const contents = fs.readFileSync(filePath, 'utf8')
        const ext = path.extname(filePath).slice(1).toLowerCase()
        const loader =
          ext === 'mjs' ? 'js' :
          ext === 'cjs' ? 'js' :
          ext === 'js' ? 'js' :
          ext === 'json' ? 'json' :
          ext === 'ts' ? 'ts' :
          ext === 'tsx' ? 'tsx' :
          ext === 'jsx' ? 'jsx' : 'default'
        return {
          contents,
          loader,
          resolveDir: path.dirname(filePath),
        }
      } catch (e) {
        return undefined
      }
    })
  },
}

async function main() {
  console.log('Pre-bundling dependencies to:', outDir)
  
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true })
  }
  fs.mkdirSync(outDir, { recursive: true })

  try {
    const result = await esbuild.build({
      entryPoints: deps,
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      splitting: true,
      outdir: outDir,
      plugins: [nodeFsPlugin],
      logLevel: 'info',
      metafile: true,
      sourcemap: false,
      minify: false,
      treeShaking: true,
    })
    
    console.log('Build succeeded!')
    console.log('Outputs:', Object.keys(result.metafile?.outputs || {}).length)
    
    const files = fs.readdirSync(outDir)
    console.log('Files:', files.length)
    files.forEach(f => console.log('  ', f, fs.statSync(path.join(outDir, f)).size, 'bytes'))

    // Verify output files are intact
    console.log('\nVerifying output files...')
    for (const f of files) {
      if (f.endsWith('.js')) {
        const buf = fs.readFileSync(path.join(outDir, f))
        const ok = buf[0] !== 0x89 || buf[1] !== 0x7d
        console.log(`  ${f}: ${ok ? 'OK' : 'CORRUPTED'} (starts with [${buf[0]}, ${buf[1]}])`)
      }
    }
  } catch (e) {
    console.error('Build failed:', e.message?.substring(0, 500))
    process.exit(1)
  }
}

main()
