const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '101.34.91.205';
const port = 3001;

const serverCode = fs.readFileSync(path.join(__dirname, '../deploy/prod-server.js'), 'utf8');

function sendCode() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: '/api/update-code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/javascript',
        'Content-Length': Buffer.byteLength(serverCode),
      },
    };

    const req = http.request(options, (res) => {
      let chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(serverCode);
    req.end();
  });
}

async function main() {
  try {
    console.log('Sending updated server code...');
    const result = await sendCode();
    console.log(`Response: ${result.status}`);
    console.log(`Body: ${result.body}`);
  } catch (e) {
    console.error('Failed to send code:', e.message);
    console.log('\nAlternative: You need to manually update the server code via SSH or Tencent Cloud console.');
    console.log('The fix is: In prod-server.js, change idCounter to globalIdCounter.');
  }
}

main();