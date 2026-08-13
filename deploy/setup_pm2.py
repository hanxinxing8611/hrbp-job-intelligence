import paramiko

host = '101.34.91.205'
port = 22
username = 'ubuntu'
password = 'Star145051'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, port, username, password, timeout=20, banner_timeout=20)

def run(cmd, timeout=60):
    print(f'$ {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip()[:500])
    if err.strip():
        print(f'[stderr] {err.strip()[:300]}')
    return out, err

print('=== 配置 PM2 开机自启 ===')
run('sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu')

print('\n=== PM2 save ===')
run('pm2 save')

print('\n=== 检查端口监听 ===')
run('ss -tlnp | grep 3001')

print('\n=== 本地测试 API ===')
run('curl -s http://localhost:3001/api/jobs?limit=1 | head -c 300')

print('\n=== 完成 ===')
ssh.close()
