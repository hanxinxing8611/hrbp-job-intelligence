@echo off
chcp 65001 >nul
echo ============================================
echo     HRBP 求职情报站 - 一键启动
echo ============================================
echo.

echo [1/2] 启动后端服务...
start /b node server/server.js

echo [2/2] 等待服务器启动...
timeout /t 3 /nobreak >nul

echo.
echo ✅ 服务启动成功！
echo.
echo 访问地址: http://localhost:3001/
echo API接口: http://localhost:3001/api/jobs
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:3001/
