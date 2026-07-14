// Pre-bundle all dependencies using esbuild with Node.js file reading
// Output to temp directory to avoid TRAE sandbox corruption
import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import os from 'os'

const nm = path.resolve(process.cwd(), 'node_modules')
const outDir = path.join(os.tmpdir(), 'hrbp-vite-deps')

// Dependencies to pre-bundle
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

const nodeFsPlugin = {
  name: 'node-fs',
  setup(build) {
    build.onResolve({ filter: /^[^./\\]/ }, (args) => {
      if (args.path === 'react' || args.path.startsWith('react/')) {
        const parts = args.path.split('/')
        const sub = parts.slice(1).join('/')
        const pkgDir = path.join(nm, 'react')
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
        
        let entry = sub || pkgJson.module || pkgJson.main || 'index.js'
        const candidates = [
          path.join(pkgDir, entry),
          path.join(pkgDir, entry + '.js'),
          path.join(pkgDir, entry + '.mjs'),
          path.join(pkgDir, entry, 'index.js'),
        ]
        for (const c of candidates) {
          if (fs.existsSync(c) && fs.statSync(c).isFile()) {
            return { path: c, namespace: 'node-fs' }
          }
        }
      }
      if (args.path === 'react-dom' || args.path.startsWith('react-dom/')) {
        const parts = args.path.split('/')
        const sub = parts.slice(1).join('/')
        const pkgDir = path.join(nm, 'react-dom')
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
        let entry = sub || pkgJson.module || pkgJson.main || 'index.js'
        const candidates = [
          path.join(pkgDir, entry),
          path.join(pkgDir, entry + '.js'),
          path.join(pkgDir, entry + '.mjs'),
          path.join(pkgDir, entry, 'index.js'),
        ]
        for (const c of candidates) {
          if (fs.existsSync(c) && fs.statSync(c).isFile()) {
            return { path: c, namespace: 'node-fs' }
          }
        }
      }
      if (args.path === 'zustand' || args.path.startsWith('zustand/')) {
        const parts = args.path.split('/')
        const sub = parts.slice(1).join('/')
        const pkgDir = path.join(nm, 'zustand')
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
        let entry = sub || pkgJson.module || pkgJson.main || 'index.js'
        const candidates = [
          path.join(pkgDir, entry),
          path.join(pkgDir, entry + '.js'),
          path.join(pkgDir, entry + '.mjs'),
          path.join(pkgDir, entry, 'index.js'),
          path.join(pkgDir, 'esm', sub || 'index.js'),
          path.join(pkgDir, 'esm', sub, 'index.js'),
        ]
        for (const c of candidates) {
          if (fs.existsSync(c) && fs.statSync(c).isFile()) {
            return { path: c, namespace: 'node-fs' }
          }
        }
      }
      if (args.path === 'framer-motion' || args.path.startsWith('framer-motion/')) {
        const parts = args.path.split('/')
        const sub = parts.slice(1).join('/')
        const pkgDir = path.join(nm, 'framer-motion')
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
        let entry
        if (sub) {
          entry = sub
        } else {
          entry = pkgJson.module || 'dist/es/index.mjs'
        }
        const candidates = [
          path.join(pkgDir, entry),
          path.join(pkgDir, entry + '.js'),
          path.join(pkgDir, entry + '.mjs'),
          path.join(pkgDir, 'dist/es', (sub || 'index') + '.mjs'),
          path.join(pkgDir, 'dist/es/index.mjs'),
        ]
        for (const c of candidates) {
          if (fs.existsSync(c) && fs.statSync(c).isFile()) {
            return { path: c, namespace: 'node-fs' }
          }
        }
      }
      if (args.path === 'lucide-react' || args.path.startsWith('lucide-react/')) {
        const parts = args.path.split('/')
        const sub = parts.slice(1).join('/')
        const pkgDir = path.join(nm, 'lucide-react')
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
        let entry = sub || pkgJson.module || pkgJson.main || 'dist/esm/lucide-react.js'
        const candidates = [
          path.join(pkgDir, entry),
          path.join(pkgDir, entry + '.js'),
          path.join(pkgDir, entry + '.mjs'),
          path.join(pkgDir, 'dist/esm/lucide-react.js'),
          path.join(pkgDir, 'dist/esm/lucide-react.esm.js'),
          path.join(pkgDir, 'dist/esm/lucide-react.min.js'),
        ]
        for (const c of candidates) {
          if (fs.existsSync(c) && fs.statSync(c).isFile()) {
            return { path: c, namespace: 'node-fs' }
          }
        }
      }
      if (args.path === 'react-router-dom' || args.path.startsWith('react-router-dom/')) {
        const parts = args.path.split('/')
        const sub = parts.slice(1).join('/')
        const pkgDir = path.join(nm, 'react-router-dom')
        const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
        let entry = sub || pkgJson.module || pkgJson.main || 'dist/index.js'
        const candidates = [
          path.join(pkgDir, entry),
          path.join(pkgDir, entry + '.js'),
          path.join(pkgDir, entry + '.mjs'),
          path.join(pkgDir, 'dist', (sub || 'index') + '.js'),
        ]
        for (const c of candidates) {
          if (fs.existsSync(c) && fs.statSync(c).isFile()) {
            return { path: c, namespace: 'node-fs' }
          }
        }
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
        return { contents, loader }
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

  const entryPoints = deps.map(d => d)
  
  try {
    const result = await esbuild.build({
      entryPoints,
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      splitting: true,
      outdir: outDir,
      outbase: '.',
      plugins: [nodeFsPlugin],
      logLevel: 'info',
      metafile: true,
      sourcemap: false,
      minify: false,
    })
    
    console.log('Build succeeded!')
    console.log('Outputs:', Object.keys(result.metafile?.outputs || {}).length)
    
    // List output files
    const files = fs.readdirSync(outDir)
    console.log('Files in output dir:', files.length)
    files.forEach(f => console.log('  ', f, fs.statSync(path.join(outDir, f)).size, 'bytes'))
  } catch (e) {
    console.error('Build failed:', e.message?.substring(0, 1000))
    process.exit(1)
  }
}

main()
