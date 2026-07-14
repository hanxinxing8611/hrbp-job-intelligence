const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const os = require('os')
const TEMP_BASE = path.join(os.tmpdir(), 'hrbp-server-deps')
const SERVER_DIR = path.join(__dirname, 'server')

console.log('=== 服务器依赖安装器 ===')
console.log(`安装目录: ${TEMP_BASE}`)

if (!fs.existsSync(TEMP_BASE)) {
  fs.mkdirSync(TEMP_BASE, { recursive: true })
}

const packageJson = JSON.parse(fs.readFileSync(path.join(SERVER_DIR, 'package.json'), 'utf8'))
const deps = Object.keys(packageJson.dependencies)

console.log(`需要安装的依赖: ${deps.join(', ')}`)

for (const dep of deps) {
  try {
    console.log(`\n安装 ${dep}...`)
    execSync(`npm install ${dep}@${packageJson.dependencies[dep]} --prefix "${TEMP_BASE}" --registry=https://registry.npmmirror.com`, {
      stdio: 'pipe',
      timeout: 120000,
    })
    console.log(`✓ ${dep} 安装成功`)
  } catch (e) {
    console.log(`✗ ${dep} 安装失败: ${e.message}`)
  }
}

const targetNodeModules = path.join(SERVER_DIR, 'node_modules')
if (fs.existsSync(targetNodeModules)) {
  fs.rmSync(targetNodeModules, { recursive: true, force: true })
}

try {
  console.log('\n创建符号链接...')
  execSync(`mklink /J "${targetNodeModules}" "${path.join(TEMP_BASE, 'node_modules')}"`, {
    stdio: 'pipe',
  })
  console.log('✓ 符号链接创建成功')
} catch (e) {
  console.log(`符号链接失败，尝试复制...`)
  execSync(`xcopy "${path.join(TEMP_BASE, 'node_modules')}" "${targetNodeModules}" /E /I /Y`, {
    stdio: 'pipe',
  })
  console.log('✓ 复制完成')
}

console.log('\n=== 安装完成 ===')
console.log(`服务器目录: ${SERVER_DIR}`)
console.log(`启动命令: node server.js`)
