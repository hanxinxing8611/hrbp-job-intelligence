import paramiko
import os

host = '101.34.91.205'
port = 22
username = 'ubuntu'
password = 'Star145051'

def run(ssh, cmd, timeout=120):
    print(f'$ {cmd[:100]}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip()[:500])
    if err.strip():
        print(f'[stderr] {err.strip()[:300]}')
    return out, err

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f'连接 {host} (30秒超时)...')
    ssh.connect(host, port, username, password, timeout=30, banner_timeout=30)
    print('连接成功！\n')
    
    print('=== 上传更新后的后端代码 ===')
    local_file = r'C:\Users\44525\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a5255c781d5bfa90b8e35c6\deploy\prod-server.js'
    
    sftp = ssh.open_sftp()
    sftp.put(local_file, '/home/ubuntu/hrbp-server/server.js')
    sftp.close()
    print('已上传新的 server.js')
    
    print('\n=== 删除旧数据 ===')
    run(ssh, 'rm -rf ~/hrbp-server/data')
    
    print('\n=== 重启服务 ===')
    run(ssh, 'cd ~/hrbp-server && pm2 restart hrbp-server')
    
    import time
    time.sleep(15)
    
    print('\n=== 验证 ===')
    run(ssh, 'curl -s http://localhost:3001/api/status')
    
    print('\n=== 完成 ===')
    ssh.close()

if __name__ == '__main__':
    main()
