// Test: use Node.js to read files in esbuild plugin
import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'

const nm = path.resolve(process.cwd(), 'node_modules')

const nodeFsPlugin = {
  name: 'node-fs',
  setup(build) {
    build.onLoad({ filter: /node_modules/ }, (args) => {
      const filePath = args.path
      try {
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
        console.log(`onLoad OK: ${path.basename(filePath)} (${loader}, ${contents.length} bytes)`)
        return { contents, loader }
      } catch (e) {
        console.log(`onLoad FAIL: ${filePath}: ${e.message}`)
        return undefined
      }
    })
  },
}

async function main() {
  console.log('Testing esbuild with node-fs plugin...')
  try {
    const result = await esbuild.build({
      entryPoints: [path.join(nm, 'react', 'index.js')],
      bundle: true,
      write: false,
      plugins: [nodeFsPlugin],
      platform: 'browser',
      format: 'esm',
      logLevel: 'error',
    })
    console.log('Build succeeded!')
    console.log('Output files:', result.outputFiles?.length)
    if (result.outputFiles && result.outputFiles[0]) {
      console.log('Output size:', result.outputFiles[0].text.length, 'chars')
      console.log('First 100 chars:', result.outputFiles[0].text.substring(0, 100))
    }
  } catch (e) {
    console.log('Build failed:', e.message?.substring(0, 500))
  }
}

main()
