import urllib.request
import urllib.parse
import json
import os

print('=== Testing reset API ===')

url = 'http://101.34.91.205:3001/api/crawl'
data = json.dumps({}).encode('utf-8')
req = urllib.request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        print('Crawl result:', result)
except Exception as e:
    print('Crawl failed:', e)

print('\n=== Checking server endpoints ===')
endpoints = ['/api/status', '/api/jobs?limit=1', '/api/hot-jobs?limit=1', '/api/stats']
for ep in endpoints:
    url = f'http://101.34.91.205:3001{ep}'
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read())
            print(f'{ep}: OK')
    except Exception as e:
        print(f'{ep}: {e}')

print('\n=== Done ===')