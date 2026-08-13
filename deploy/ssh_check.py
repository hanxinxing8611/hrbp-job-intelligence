import paramiko
import sys

host = '101.34.91.205'
port = 22
username = 'ubuntu'
password = 'Star145051'

def ssh_exec(ssh, cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out, err

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f'正在连接 {host}...')
    ssh.connect(host, port, username, password, timeout=20, banner_timeout=20)
    print('连接成功！')
    
    print('\n=== 系统信息 ===')
    out, _ = ssh_exec(ssh, 'uname -a')
    print(out.strip())
    
    print('\n=== 操作系统 ===')
    out, _ = ssh_exec(ssh, 'cat /etc/os-release | head -5')
    print(out.strip())
    
    print('\n=== 当前用户 ===')
    out, _ = ssh_exec(ssh, 'whoami && id')
    print(out.strip())
    
    print('\n=== Node.js ===')
    out, err = ssh_exec(ssh, 'node -v 2>&1')
    print(out.strip() or '未安装')
    
    print('\n=== npm ===')
    out, err = ssh_exec(ssh, 'npm -v 2>&1')
    print(out.strip() or '未安装')
    
    print('\n=== 已监听端口 ===')
    out, _ = ssh_exec(ssh, 'ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null')
    print(out.strip())
    
    print('\n=== 磁盘空间 ===')
    out, _ = ssh_exec(ssh, 'df -h /')
    print(out.strip())
    
    print('\n=== 内存 ===')
    out, _ = ssh_exec(ssh, 'free -h')
    print(out.strip())
    
    ssh.close()
    print('\n检查完成！')
    
except Exception as e:
    print(f'错误: {e}')
    sys.exit(1)
