const fs = require('fs');
const path = require('path');
const http = require('http');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data_temp', 'jobs.json'), 'utf8'));
console.log(`数据大小: ${data.jobs.length} 条职位, ${data.companies.length} 家公司`);

const options = {
  hostname: '101.34.91.205',
  port: 3001,
  path: '/api/all-jobs',
  method: 'GET',
  timeout: 10000
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      console.log(`当前服务器数据: ${result.total} 条`);
    } catch (e) {
      console.log('获取当前数据失败:', e.message);
    }
    uploadData();
  });
});

req.on('error', (e) => {
  console.log('获取当前数据失败:', e.message);
  uploadData();
});

req.end();

function uploadData() {
  const postData = JSON.stringify(data);
  const options = {
    hostname: '101.34.91.205',
    port: 3001,
    path: '/api/upload-data',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    timeout: 60000
  };

  console.log('正在上传数据...');
  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(body);
        console.log('上传结果:', JSON.stringify(result).slice(0, 200));
      } catch (e) {
        console.log('上传响应:', body.slice(0, 200));
      }
      checkStatus();
    });
  });

  req.on('error', (e) => {
    console.log('上传失败:', e.message);
    checkStatus();
  });

  req.write(postData);
  req.end();
}

function checkStatus() {
  const options = {
    hostname: '101.34.91.205',
    port: 3001,
    path: '/api/status',
    method: 'GET',
    timeout: 10000
  };

  console.log('\n=== 检查上传后的数据 ===');
  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        const status = JSON.parse(body);
        console.log(`总职位数: ${status.totalJobs}`);
        console.log(`今日新增: ${status.todayNew}`);
        console.log(`最后更新: ${status.lastCrawl}`);
      } catch (e) {
        console.log('检查失败:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.log('检查失败:', e.message);
  });

  req.end();
}