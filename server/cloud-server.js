// 云端服务器：提供真实数据 API（静态JSON）+ 静态前端
// 前端以 /hrbp-job-intelligence/ 为 base 构建，本服务器处理该子路径
// 定时刷新：cron 每小时运行 build-real-api.js 重新生成 JSON

const http = require('http')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PORT = 3001
const ROOT_DIR = path.resolve(__dirname, '..')
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const API_DIR = path.join(ROOT_DIR, 'api')
const BUILD_SCRIPT = path.join(ROOT_DIR, 'scripts', 'build-real-api.js')
const SUBPATH = '/hrbp-job-intelligence'

// MIME 类型
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

// ============================================================
// 数据刷新：运行 build-real-api.js 重新生成真实数据 JSON
// ============================================================
function regenerateData() {
  try {
    console.log('[' + new Date().toLocaleString('zh-CN') + '] 运行数据生成脚本...')
    execSync(`node "${BUILD_SCRIPT}"`, { cwd: ROOT_DIR, timeout: 120000 })

    // 复制生成的 JSON 到 dist/api（供前端静态读取）
    if (fs.existsSync(path.join(DIST_DIR, 'api'))) {
      fs.rmSync(path.join(DIST_DIR, 'api'), { recursive: true, force: true })
    }
    if (fs.existsSync(API_DIR)) {
      fs.mkdirSync(path.join(DIST_DIR, 'api'), { recursive: true })
      copyDirRecursive(API_DIR, path.join(DIST_DIR, 'api'))
    }

    const jobsData = JSON.parse(fs.readFileSync(path.join(API_DIR, 'jobs.json'), 'utf8'))
    console.log(`数据刷新完成：${jobsData.data.length} 个真实职位`)
    return { success: true, count: jobsData.data.length }
  } catch (e) {
    console.error('数据生成失败:', e.message)
    return { success: false, error: e.message }
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// ============================================================
// 静态文件服务（处理 /hrbp-job-intelligence/ 子路径）
// ============================================================
function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: 'Not found' }))
      return
    }
    const ext = path.extname(filePath)
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
    res.writeHead(200)
    res.end(data)
  })
}

// ============================================================
// HTTP 服务器
// ============================================================
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)

  // 手动刷新数据接口
  if (pathname === '/api/refresh' && req.method === 'POST') {
    const result = regenerateData()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message: '数据刷新完成', ...result }))
    return
  }

  // 状态接口
  if (pathname === '/api/status') {
    const statusFile = path.join(API_DIR, 'status.json')
    if (fs.existsSync(statusFile)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(fs.readFileSync(statusFile, 'utf8'))
      return
    }
  }

  // 处理子路径：/hrbp-job-intelligence/xxx → dist/xxx
  if (pathname.startsWith(SUBPATH)) {
    pathname = pathname.slice(SUBPATH.length) || '/'
  }

  // 规范化路径：去掉开头的 /，防止 path.join 将其视为绝对路径
  let relativePath = pathname.replace(/^\/+/, '')
  if (relativePath === '' || relativePath === '/') {
    relativePath = 'index.html'
  }

  // 映射到 dist 目录
  let filePath = path.join(DIST_DIR, relativePath)
  if (filePath.endsWith('/') || filePath.endsWith('\\')) filePath += 'index.html'

  const stat = fs.statSync(filePath, { throwIfNoEntry: false })
  if (!stat || stat.isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html')
  }

  serveStatic(res, filePath)
})

// ============================================================
// 启动
// ============================================================
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`错误: 端口 ${PORT} 已被占用！请先停止旧进程: su - ubuntu -c "pm2 kill"; kill $(lsof -ti :${PORT})`)
    console.error(`然后重新启动: cd /home/ubuntu/hrbp-job-intelligence && setsid node server/cloud-server.js > /home/ubuntu/hrbp-server.log 2>&1 &`)
    process.exit(1)
  } else {
    console.error('服务器错误:', e.message)
    process.exit(1)
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================')
  console.log('  HRBP 求职情报站 - 云端服务器')
  console.log('========================================')
  console.log(`服务地址: http://0.0.0.0:${PORT}`)
  console.log(`访问地址: http://<服务器IP>:${PORT}/hrbp-job-intelligence/`)
  console.log(`数据目录: ${API_DIR}`)
  console.log(`前端目录: ${DIST_DIR}`)
  console.log('========================================')

  // 首次启动时确保数据已生成
  if (!fs.existsSync(path.join(API_DIR, 'jobs.json'))) {
    console.log('首次启动：生成真实数据...')
    regenerateData()
  } else {
    // 确保 dist/api 有最新数据
    if (!fs.existsSync(path.join(DIST_DIR, 'api', 'jobs.json'))) {
      console.log('复制 API 数据到 dist/api...')
      fs.mkdirSync(path.join(DIST_DIR, 'api'), { recursive: true })
      copyDirRecursive(API_DIR, path.join(DIST_DIR, 'api'))
    }
  }

  const jobsData = JSON.parse(fs.readFileSync(path.join(API_DIR, 'jobs.json'), 'utf8'))
  console.log(`当前真实职位数: ${jobsData.data.length}`)
  console.log('定时刷新由 cron 每小时触发')
  console.log('手动刷新: curl -X POST http://localhost:' + PORT + '/api/refresh')
  console.log('========================================')
})

module.exports = { server, regenerateData }
