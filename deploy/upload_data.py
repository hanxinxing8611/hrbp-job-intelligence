import urllib.request
import urllib.parse
import json
import os

print('=== Uploading data to server ===')

data_path = r'C:\Users\44525\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a5255c781d5bfa90b8e35c6\deploy\data_temp\jobs.json'

if not os.path.exists(data_path):
    print(f'数据文件不存在: {data_path}')
    exit(1)

with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f'数据大小: {len(data["jobs"])} 条职位, {len(data["companies"])} 家公司')

url = 'http://101.34.91.205:3001/api/all-jobs'
try:
    with urllib.request.urlopen(url, timeout=10) as resp:
        result = json.loads(resp.read())
        print(f'当前服务器数据: {result["total"]} 条')
except Exception as e:
    print(f'获取当前数据失败: {e}')

url = 'http://101.34.91.205:3001/api/upload-data'
data_json = json.dumps(data, ensure_ascii=False).encode('utf-8')
req = urllib.request.Request(url, data=data_json, method='POST', headers={'Content-Type': 'application/json'})

try:
    print('正在上传数据...')
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())
        print('上传结果:', result)
except urllib.error.HTTPError as e:
    print(f'HTTP错误: {e.code} - {e.read().decode("utf-8", errors="replace")}')
except Exception as e:
    print(f'上传失败: {e}')

print('\n=== 检查上传后的数据 ===')
url = 'http://101.34.91.205:3001/api/status'
try:
    with urllib.request.urlopen(url, timeout=10) as resp:
        status = json.loads(resp.read())
        print(f'总职位数: {status["totalJobs"]}')
        print(f'今日新增: {status["todayNew"]}')
        print(f'最后更新: {status["lastCrawl"]}')
except Exception as e:
    print(f'检查失败: {e}')

print('\n=== Done ===')