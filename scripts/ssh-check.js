const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '101.34.91.205',
  port: 22,
  username: 'ubuntu',
  password: 'Star145051',
  readyTimeout: 20000,
};

function exec(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      }).on('data', (data) => {
        stdout += data.toString();
      }).stderr.on('data', (data) => {
        stderr += data.toString();
      });
    });
  });
}

conn.on('ready', async () => {
  console.log('=== SSH 连接成功 ===');
  
  try {
    let r;
    
    console.log('\n--- 系统信息 ---');
    r = await exec('uname -a && echo "---" && cat /etc/os-release | head -5 && echo "---" && whoami && echo "---" && df -h /');
    console.log(r.stdout);
    
    console.log('\n--- Node.js 版本 ---');
    r = await exec('node -v 2>&1 || echo "Node not installed"');
    console.log(r.stdout.trim());
    
    console.log('\n--- npm 版本 ---');
    r = await exec('npm -v 2>&1 || echo "npm not installed"');
    console.log(r.stdout.trim());
    
    console.log('\n--- 已开放端口 ---');
    r = await exec('ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || echo "no net tools"');
    console.log(r.stdout.trim());
    
    console.log('\n=== 检查完成 ===');
  } catch (e) {
    console.error('执行错误:', e.message);
  }
  
  conn.end();
});

conn.on('error', (err) => {
  console.error('SSH 连接失败:', err.message);
  process.exit(1);
});

conn.connect(config);
