import paramiko
import sys
import time

host = '101.34.91.205'
user = 'root'
password = 'aVmxmH:R2fpMVN6'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print('Connecting to', host, '...')
client.connect(host, username=user, password=password, timeout=15)
print('Connected!\n')

# Step 1: Stop old service
print('=== Step 1: Stopping old PM2 service ===')
stdin, stdout, stderr = client.exec_command(
    'pm2 stop hrbp-server 2>/dev/null; pm2 delete hrbp-server 2>/dev/null; echo STOP_DONE',
    timeout=30
)
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err.strip():
    print('STDERR:', err)

# Step 2: Run cloud-setup.sh (long running)
print('\n=== Step 2: Running cloud-setup.sh ===')
stdin, stdout, stderr = client.exec_command(
    'cd /opt/hrbp-job-intelligence && bash scripts/cloud-setup.sh',
    timeout=600,
    get_pty=True
)

# Real-time output
while not stdout.channel.exit_status_ready():
    if stdout.channel.recv_ready():
        chunk = stdout.channel.recv(8192).decode('utf-8', errors='replace')
        sys.stdout.write(chunk)
        sys.stdout.flush()
    time.sleep(0.2)

# Read any remaining
remaining = stdout.read().decode('utf-8', errors='replace')
if remaining:
    print(remaining)

exit_code = stdout.channel.recv_exit_status()
print(f'\n=== cloud-setup.sh exit code: {exit_code} ===')

# Step 3: Verify service is running
print('\n=== Step 3: Verifying service ===')
stdin, stdout, stderr = client.exec_command(
    'pm2 list; echo "---"; curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/hrbp-job-intelligence/',
    timeout=30
)
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
print('\n=== SSH connection closed ===')
