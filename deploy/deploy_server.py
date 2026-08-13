import paramiko
import time
import os

host = '101.34.91.205'
port = 22
username = 'ubuntu'
password = 'Star145051'

def run(ssh, cmd, timeout=120):
    print(f'$ {cmd[:80]}...' if len(cmd) > 80 else f'$ {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip()[:500])
    if err.strip():
        print(f'[stderr] {err.strip()[:300]}')
    return out, err

def sftp_upload(ssh, local_path, remote_path):
    sftp = ssh.open_sftp()
    try:
        sftp.put(local_path, remote_path)
        print(f'上传: {local_path} -> {remote_path}')
    finally:
        sftp.close()

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f'连接 {host}...')
    ssh.connect(host, port, username, password, timeout=120, banner_timeout=120)
    print('连接成功！\n')
    
    # 1. 安装 Node.js
    print('=== 步骤 1: 安装 Node.js ===')
    out, _ = run(ssh, 'which node && node -v')
    if 'node' not in out or 'command not found' in out:
        run(ssh, 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -', timeout=60)
        run(ssh, 'sudo apt-get install -y nodejs', timeout=120)
        run(ssh, 'node -v && npm -v')
    else:
        print(f'Node.js 已安装: {out.strip()}')
    
    # 2. 安装 PM2
    print('\n=== 步骤 2: 安装 PM2 ===')
    out, _ = run(ssh, 'which pm2')
    if not out.strip():
        run(ssh, 'sudo npm install -g pm2', timeout=60)
    run(ssh, 'pm2 -v')
    
    # 3. 创建项目目录
    print('\n=== 步骤 3: 创建项目目录 ===')
    run(ssh, 'mkdir -p ~/hrbp-server && cd ~/hrbp-server && pwd')
    
    # 4. 上传后端代码
    print('\n=== 步骤 4: 上传后端代码 ===')
    local_server = r'C:\Users\44525\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a5255c781d5bfa90b8e35c6\deploy\prod-server.js'
    if os.path.exists(local_server):
        sftp_upload(ssh, local_server, '/home/ubuntu/hrbp-server/server.js')
    
    # 创建 package.json
    package_json = '''{
  "name": "hrbp-server",
  "version": "1.0.0",
  "description": "HRBP Job Intelligence Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {}
}
'''
    sftp = ssh.open_sftp()
    with sftp.file('/home/ubuntu/hrbp-server/package.json', 'w') as f:
        f.write(package_json)
    sftp.close()
    print('创建: package.json')
    
    # 5. 安装依赖
    print('\n=== 步骤 5: 安装依赖 ===')
    run(ssh, 'cd ~/hrbp-server && npm install --production', timeout=60)
    
    # 6. 开放防火墙端口
    print('\n=== 步骤 6: 开放防火墙端口 ===')
    run(ssh, 'sudo ufw allow 3001/tcp 2>/dev/null || echo "ufw not available"')
    run(ssh, 'sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT 2>/dev/null || echo "iptables done"')
    
    # 7. 启动服务
    print('\n=== 步骤 7: 启动服务 ===')
    run(ssh, 'cd ~/hrbp-server && pm2 delete hrbp-server 2>/dev/null; pm2 start server.js --name hrbp-server', timeout=30)
    run(ssh, 'pm2 save && pm2 list')
    
    # 8. 验证服务
    print('\n=== 步骤 8: 验证服务 ===')
    time.sleep(3)
    run(ssh, 'curl -s http://localhost:3001/api/status | head -c 200')
    run(ssh, 'curl -s "http://localhost:3001/api/jobs?limit=3" | head -c 300')
    
    print('\n=== 部署完成 ===')
    print(f'API 地址: http://{host}:3001')
    
    ssh.close()

if __name__ == '__main__':
    main()
