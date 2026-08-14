#!/bin/bash
# HRBP 求职情报站 - 云端一键部署脚本
# 在云服务器上运行：bash scripts/cloud-setup.sh
# 功能：拉取代码 → 安装依赖 → 生成真实数据 → 构建前端 → 启动服务 → 配置定时任务

set -e

REPO_URL="https://github.com/hanxinxing8611/hrbp-job-intelligence.git"
APP_DIR="/home/ubuntu/hrbp-job-intelligence"
PORT=3001

echo "========================================"
echo "  HRBP 求职情报站 - 云端部署"
echo "========================================"

# 1. 拉取/更新代码
if [ -d "$APP_DIR/.git" ]; then
  echo "[1/6] 更新代码..."
  cd "$APP_DIR"
  git checkout master 2>/dev/null || true
  git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || true
else
  echo "[1/6] 克隆代码..."
  rm -rf "$APP_DIR"
  git clone -b master "$REPO_URL" "$APP_DIR" 2>/dev/null || git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
  git checkout master 2>/dev/null || true
fi

# 2. 安装依赖
echo "[2/6] 安装依赖..."
npm install 2>/dev/null || npm install --production

# 3. 生成真实数据
echo "[3/6] 生成真实数据（102条真实HRBP岗位）..."
node scripts/build-real-api.js

# 4. 构建前端
echo "[4/6] 构建前端..."
node node_modules/vite/bin/vite.js build 2>/dev/null || npx vite build

# 复制 API 数据到 dist/api
if [ -d "api" ] && [ -d "dist" ]; then
  rm -rf dist/api
  cp -r api dist/api
  echo "  API 数据已复制到 dist/api"
fi

# 5. 停止旧进程并启动云端服务器
echo "[5/6] 启动云端服务器 (端口 $PORT)..."
OLD_PID=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$OLD_PID" ]; then
  echo "  停止旧进程 (PID: $OLD_PID)..."
  kill -9 $OLD_PID 2>/dev/null || true
  sleep 1
fi

# 用 setsid 启动后台进程（隔离会话，SSH 断开后不退出）
setsid node server/cloud-server.js > /home/ubuntu/hrbp-server.log 2>&1 &
echo "  服务器已启动，PID: $!"
sleep 3

# 验证启动
if curl -s "http://localhost:$PORT/api/status" | grep -q "totalJobs"; then
  echo "  ✓ 服务启动成功"
  JOBS=$(curl -s "http://localhost:$PORT/api/status" | python3 -c "import sys,json; print(json.load(sys.stdin)['totalJobs'])" 2>/dev/null || echo "?")
  echo "  ✓ 当前真实职位数: $JOBS"
else
  echo "  ✗ 服务启动失败，查看日志：cat /home/ubuntu/hrbp-server.log"
  tail -20 /home/ubuntu/hrbp-server.log
  exit 1
fi

# 6. 配置定时任务（每小时刷新数据）
echo "[6/6] 配置定时任务（每小时整点刷新真实数据）..."
CRON_LINE="0 * * * * cd $APP_DIR && node scripts/build-real-api.js && rm -rf dist/api && cp -r api dist/api >> /home/ubuntu/hrbp-cron.log 2>&1"

( crontab -l 2>/dev/null | grep -v "build-real-api.js" | grep -v "hrbp-job-intelligence" ; echo "$CRON_LINE" ) | crontab -
echo "  ✓ 定时任务已配置"

# 获取服务器公网IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "服务器IP")

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo "访问地址: http://$SERVER_IP:$PORT/hrbp-job-intelligence/"
echo "API状态:  http://localhost:$PORT/api/status"
echo "手动刷新: curl -X POST http://localhost:$PORT/api/refresh"
echo "查看日志: cat /home/ubuntu/hrbp-server.log"
echo "定时日志: cat /home/ubuntu/hrbp-cron.log"
echo "停止服务: kill \$(lsof -ti :$PORT)"
echo "重新部署: cd $APP_DIR && git pull && bash scripts/cloud-setup.sh"
echo "========================================"
