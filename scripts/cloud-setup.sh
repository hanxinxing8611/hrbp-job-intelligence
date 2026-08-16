#!/bin/bash
# HRBP 求职情报站 - 云端一键部署脚本
# 在云服务器上运行：bash scripts/cloud-setup.sh
# 功能：拉取代码 → 安装依赖 → 生成真实数据 → 构建前端 → 启动服务 → 配置定时任务

set -e

REPO_URL="https://github.com/hanxinxing8611/hrbp-job-intelligence.git"
APP_DIR="/home/ubuntu/hrbp-job-intelligence"
PORT=3001
SERVER_LOG="/home/ubuntu/hrbp-server.log"
CRON_LOG="/home/ubuntu/hrbp-cron.log"

echo "========================================"
echo "  HRBP 求职情报站 - 云端部署"
echo "========================================"

# 1. 拉取/更新代码
if [ -d "$APP_DIR/.git" ]; then
  echo "[1/6] 更新代码..."
  cd "$APP_DIR"
  git checkout master 2>/dev/null || echo "  警告: 无法切换到 master，使用当前分支"
  if ! git pull origin master 2>/dev/null; then
    echo "  从 master 拉取失败，尝试 main..."
    if ! git pull origin main 2>/dev/null; then
      echo "  ✗ 代码更新失败，请检查网络或手动 git pull"
      exit 1
    fi
  fi
else
  echo "[1/6] 克隆代码..."
  rm -rf "$APP_DIR"
  if ! git clone -b master "$REPO_URL" "$APP_DIR" 2>/dev/null; then
    echo "  master 分支克隆失败，尝试默认分支..."
    if ! git clone "$REPO_URL" "$APP_DIR"; then
      echo "  ✗ 代码克隆失败，请检查网络: $REPO_URL"
      exit 1
    fi
  fi
  cd "$APP_DIR"
  git checkout master 2>/dev/null || echo "  提示: 使用默认分支（无 master）"
fi

# 2. 安装依赖
echo "[2/6] 安装依赖..."
if ! npm install; then
  echo "  ✗ npm install 失败，请检查网络或重试"
  exit 1
fi

# 3. 生成真实数据
echo "[3/6] 生成真实数据（102条真实HRBP岗位）..."
if ! node scripts/build-real-api.js; then
  echo "  ✗ 数据生成失败，检查 build-real-api.js 输出"
  exit 1
fi
JOBS_BEFORE=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('api/jobs.json','utf8')).data.length)}catch(e){console.log(0)}")
echo "  ✓ 数据生成完成: $JOBS_BEFORE 个真实职位"

# 4. 构建前端
echo "[4/6] 构建前端..."
BUILD_FAILED=0
if [ -f node_modules/vite/bin/vite.js ]; then
  if ! node node_modules/vite/bin/vite.js build; then
    echo "  node_modules/vite 构建失败，尝试 npx vite build..."
    if ! npx vite build; then
      BUILD_FAILED=1
    fi
  fi
else
  echo "  node_modules/vite 不存在，使用 npx vite build..."
  if ! npx vite build; then
    BUILD_FAILED=1
  fi
fi

if [ "$BUILD_FAILED" -eq 1 ]; then
  echo "  ✗ 前端构建失败，请查看上方 Vite 错误信息"
  exit 1
fi

# 验证构建产物
if [ ! -f dist/index.html ]; then
  echo "  ✗ 构建完成但 dist/index.html 不存在，请检查 Vite 配置"
  exit 1
fi
INDEX_SIZE=$(wc -c < dist/index.html)
JS_SIZE=$(find dist/assets -name "*.js" -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1}')
echo "  ✓ 构建成功: index.html ($INDEX_SIZE bytes) + JS bundle (~${JS_SIZE:-?} bytes)"

# 复制 API 数据到 dist/api
if [ -d "api" ] && [ -d "dist" ]; then
  rm -rf dist/api
  cp -r api dist/api
  echo "  ✓ API 数据已同步到 dist/api"
else
  echo "  ✗ 缺少 api/ 或 dist/ 目录，部署中止"
  exit 1
fi

# 5. 停止旧进程并启动云端服务器
echo "[5/6] 启动云端服务器 (端口 $PORT)..."

# 停止所有可能占用端口的旧进程（PM2管理的、setsid启动的、旧hrbp-server目录的）
echo "  清理旧进程..."

# 5a. 停止 ubuntu 用户的 PM2 进程（旧服务可能由 PM2 管理）
su - ubuntu -c "pm2 delete all 2>/dev/null; pm2 kill 2>/dev/null" 2>/dev/null || true

# 5b. 停止 root 的 PM2 进程（以防万一）
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# 5c. 杀掉所有占用 3001 端口的进程
OLD_PID=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$OLD_PID" ]; then
  echo "  杀掉占用端口的进程 (PID: $OLD_PID)..."
  kill -9 $OLD_PID 2>/dev/null || true
  sleep 2
fi

# 5d. 再次确认端口已释放
STILL_OCCUPIED=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$STILL_OCCUPIED" ]; then
  echo "  ⚠ 端口 $PORT 仍被占用 (PID: $STILL_OCCUPIED)，尝试强制杀..."
  kill -9 $STILL_OCCUPIED 2>/dev/null || true
  sleep 2
fi

# 5e. 杀掉所有旧的 cloud-server.js 进程
pkill -9 -f "cloud-server.js" 2>/dev/null || true
pkill -9 -f "hrbp-server/server.js" 2>/dev/null || true
sleep 1

setsid node server/cloud-server.js > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo "  服务器已启动，PID: $SERVER_PID"
sleep 4

# 验证启动
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/status" || echo "000")
if [ "$STATUS_CODE" = "200" ]; then
  STATUS_BODY=$(curl -s "http://localhost:$PORT/api/status")
  TOTAL_JOBS=$(echo "$STATUS_BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('totalJobs','?'))" 2>/dev/null || echo "?")
  echo "  ✓ 服务启动成功（HTTP $STATUS_CODE），真实职位数: $TOTAL_JOBS"
else
  echo "  ✗ 服务启动失败（HTTP $STATUS_CODE），日志如下:"
  echo "--------------------------------------------------"
  tail -30 "$SERVER_LOG"
  echo "--------------------------------------------------"
  echo "  查看完整日志: cat $SERVER_LOG"
  exit 1
fi

# 额外验证前端可访问
FRONT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/hrbp-job-intelligence/")
if [ "$FRONT_CODE" = "200" ]; then
  echo "  ✓ 前端页面可访问（HTTP $FRONT_CODE）"
else
  echo "  ⚠ 前端页面返回 $FRONT_CODE，请检查 dist/index.html 是否正确"
fi

# 6. 配置定时任务（每小时刷新数据 + 重启服务器）
echo "[6/6] 配置定时任务（每小时整点刷新真实数据）..."
CRON_LINE="0 * * * * cd $APP_DIR && node scripts/build-real-api.js >> $CRON_LOG 2>&1 && rm -rf dist/api && cp -r api dist/api >> $CRON_LOG 2>&1 && curl -s -X POST http://localhost:$PORT/api/refresh >> $CRON_LOG 2>&1 || echo \"[\$(date)] 数据刷新失败\" >> $CRON_LOG"

( crontab -l 2>/dev/null | grep -v "build-real-api.js" | grep -v "hrbp-job-intelligence" ; echo "$CRON_LINE" ) | crontab -
echo "  ✓ 定时任务已配置（每小时整点执行）"
echo "  任务预览: $(crontab -l | grep build-real-api)"

# 获取服务器公网IP
SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || curl -s --max-time 5 ipinfo.io/ip 2>/dev/null || echo "你的服务器IP")

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo "访问地址:  http://$SERVER_IP:$PORT/hrbp-job-intelligence/"
echo "API 状态:  curl -s http://localhost:$PORT/api/status"
echo "手动刷新:  curl -X POST http://localhost:$PORT/api/refresh"
echo "服务日志:  tail -f $SERVER_LOG"
echo "定时日志:  tail -f $CRON_LOG"
echo "停止服务:  su - ubuntu -c 'pm2 kill'; kill \$(lsof -ti :$PORT) 2>/dev/null"
echo "重新部署:  cd $APP_DIR && git pull && bash scripts/cloud-setup.sh"
echo "========================================"
