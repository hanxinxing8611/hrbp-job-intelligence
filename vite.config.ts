import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import os from 'os'

const TMP_CACHE_DIR = path.join(os.tmpdir(), 'hrbp-vite-cache')

function resolveBareImport(importPath: string, fromDir: string): string | null {
  if (importPath.startsWith('.') || importPath.startsWith('/')) return null

  const parts = importPath.split('/')
  const pkgName = parts[0].startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0]
  const restPath = parts.slice(pkgName.startsWith('@') ? 2 : 1).join('/')

  let currentDir = fromDir
  while (true) {
    const nmDir = path.join(currentDir, 'node_modules')
    const pkgDir = path.join(nmDir, pkgName)
    
    try {
      const pkgJsonPath = path.join(pkgDir, 'package.json')
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))

        let entry: string
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
        ]

        for (const c of candidates) {
          if (fs.existsSync(c) && fs.statSync(c).isFile()) {
            return c
          }
        }
      }
    } catch {}

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) break
    currentDir = parentDir
  }
  return null
}

const esbuildNodeFsPlugin = {
  name: 'esbuild-node-fs',
  setup(build: any) {
    build.onResolve({ filter: /^[^./\\]/ }, (args: any) => {
      const fromDir = args.importer ? path.dirname(args.importer) : process.cwd()
      const resolved = resolveBareImport(args.path, fromDir)
      if (resolved) {
        return { path: resolved }
      }
      return undefined
    })

    build.onResolve({ filter: /^\.\.?\// }, (args: any) => {
      if (!args.importer) return undefined
      if (!args.importer.includes('node_modules')) return undefined
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
          return { path: c }
        }
      }
      return undefined
    })

    build.onLoad({ filter: /node_modules/ }, (args: any) => {
      try {
        const filePath = args.path
        if (!fs.existsSync(filePath)) return undefined
        if (!fs.statSync(filePath).isFile()) return undefined
        const contents = fs.readFileSync(filePath, 'utf8')
        const ext = path.extname(filePath).slice(1).toLowerCase()
        const loader =
          ext === 'mjs' ? 'js' :
          ext === 'cjs' ? 'js' :
          ext === 'js' ? 'js' :
          ext === 'json' ? 'json' :
          ext === 'ts' ? 'ts' :
          ext === 'tsx' ? 'tsx' :
          ext === 'jsx' ? 'jsx' : undefined
        if (!loader) return undefined
        return {
          contents,
          loader,
        }
      } catch (e) {
        return undefined
      }
    })
  },
}

export default defineConfig({
  base: '/hrbp-job-intelligence/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [esbuildNodeFsPlugin],
      sourcemap: false,
      legalComments: 'none',
    },
    include: [
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
    ],
  },
  cacheDir: TMP_CACHE_DIR,
})
