// Test if esbuild plugin can correctly read node_modules files via Node.js
import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'

const nm = path.resolve(process.cwd(), 'node_modules')

const testPlugin = {
  name: 'test-plugin',
  setup(build) {
    let count = 0
    build.onResolve({ filter: /.*/ }, (args) => {
      count++
      const importPath = args.path
      const importer = args.importer
      console.log(`onResolve #${count}: ${importPath} (from: ${path.basename(importer || 'entry')})`)
      return undefined
    })
    build.onLoad({ filter: /node_modules/ }, (args) => {
      console.log(`onLoad: ${args.path}`)
      return undefined
    })
  },
}

async function main() {
  console.log('Testing esbuild plugin with react...')
  try {
    const result = await esbuild.build({
      entryPoints: [path.join(nm, 'react', 'index.js')],
      bundle: true,
      write: false,
      plugins: [testPlugin],
      platform: 'browser',
      format: 'esm',
      logLevel: 'silent',
    })
    console.log('Build succeeded!')
    console.log('Output files:', result.outputFiles?.length)
  } catch (e) {
    console.log('Build failed:', e.message?.substring(0, 200))
  }
}

main()
