import urllib.request
import json

print('=== Testing backend ===')

url = 'http://101.34.91.205:3001/api/status'
with urllib.request.urlopen(url, timeout=10) as resp:
    status = json.loads(resp.read())
    print('Total:', status['totalJobs'])
    print('New today:', status['todayNew'])
    print('Last crawl:', status['lastCrawl'])

url = 'http://101.34.91.205:3001/api/hot-jobs?limit=5'
with urllib.request.urlopen(url, timeout=10) as resp:
    jobs = json.loads(resp.read())
    print('\nHot jobs:')
    for j in jobs[:5]:
        print('[%s] %s @ %s - %s' % (j['heat'], j['title'], j['companyName'], j['salaryRange']))

print('\n=== Done ===')
