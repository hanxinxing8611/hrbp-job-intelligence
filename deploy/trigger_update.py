import urllib.request
import json

print('=== 检查当前状态 ===')
url = 'http://101.34.91.205:3001/api/status'
with urllib.request.urlopen(url, timeout=10) as resp:
    status = json.loads(resp.read())
    print('当前职位数:', status['totalJobs'])
    print('上次更新:', status['lastCrawl'])

print('\n=== 尝试手动触发更新 ===')
url = 'http://101.34.91.205:3001/api/crawl'
req = urllib.request.Request(url, method='POST')
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        print('更新结果:', result)
except Exception as e:
    print('更新失败:', e)

print('\n=== 再次检查状态 ===')
url = 'http://101.34.91.205:3001/api/status'
with urllib.request.urlopen(url, timeout=10) as resp:
    status = json.loads(resp.read())
    print('当前职位数:', status['totalJobs'])
