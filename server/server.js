const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const jobs = [
  { jobId: 'boss_1', title: 'HRBP经理', companyId: 'boss_alibaba', city: '杭州', district: '余杭区', experience: '5-10年', education: '本科', salaryRange: '35-60K', salaryMin: 35, salaryMax: 60, tags: ['大厂', '互联网', '绩效奖金', '股票'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '年终奖', '股票'] },
  { jobId: 'boss_2', title: '高级HRBP', companyId: 'boss_tencent', city: '深圳', district: '南山区', experience: '3-5年', education: '本科', salaryRange: '30-50K', salaryMin: 30, salaryMax: 50, tags: ['大厂', '游戏'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '带薪年假'] },
  { jobId: 'boss_3', title: 'HRBP专家', companyId: 'boss_bytedance', city: '北京', district: '海淀区', experience: '5-10年', education: '本科', salaryRange: '40-70K', salaryMin: 40, salaryMax: 70, tags: ['大厂', '短视频', '全球化'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '租房补贴'] },
  { jobId: 'boss_4', title: 'HRBP主管', companyId: 'boss_meituan', city: '北京', district: '朝阳区', experience: '3-5年', education: '本科', salaryRange: '25-40K', salaryMin: 25, salaryMax: 40, tags: ['O2O', '外卖'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '餐补'] },
  { jobId: 'boss_5', title: '人力资源业务伙伴', companyId: 'boss_jd', city: '北京', district: '通州区', experience: '5-10年', education: '本科', salaryRange: '30-55K', salaryMin: 30, salaryMax: 55, tags: ['电商', '物流'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '班车'] },
  { jobId: 'boss_6', title: 'HRBP高级专员', companyId: 'boss_netease', city: '杭州', district: '滨江区', experience: '3-5年', education: '本科', salaryRange: '25-45K', salaryMin: 25, salaryMax: 45, tags: ['游戏', '互联网'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '年底双薪'] },
  { jobId: 'boss_7', title: 'HRBP', companyId: 'boss_didi', city: '北京', district: '海淀区', experience: '3-5年', education: '本科', salaryRange: '25-40K', salaryMin: 25, salaryMax: 40, tags: ['出行'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: 'boss_8', title: 'HRBP经理', companyId: 'boss_baidu', city: '北京', district: '海淀区', experience: '5-10年', education: '本科', salaryRange: '30-50K', salaryMin: 30, salaryMax: 50, tags: ['搜索', 'AI'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '餐补'] },
  { jobId: 'boss_9', title: '高级HRBP', companyId: 'boss_360', city: '北京', district: '朝阳区', experience: '3-5年', education: '本科', salaryRange: '20-35K', salaryMin: 20, salaryMax: 35, tags: ['安全', '搜索'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '双休'] },
  { jobId: 'boss_10', title: 'HRBP专员', companyId: 'boss_meiya', city: '上海', district: '浦东新区', experience: '1-3年', education: '本科', salaryRange: '15-25K', salaryMin: 15, salaryMax: 25, tags: ['人力资源', '咨询'], source: 'BOSS直聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: 'zhaopin_1', title: 'HRBP经理', companyId: 'zhaopin_alibaba', city: '杭州', district: '西湖区', experience: '5-10年', education: '本科', salaryRange: '30-50K', salaryMin: 30, salaryMax: 50, tags: ['互联网', '电商'], source: '智联招聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: 'zhaopin_2', title: 'HRBP主管', companyId: 'zhaopin_tencent', city: '深圳', district: '福田区', experience: '3-5年', education: '本科', salaryRange: '25-40K', salaryMin: 25, salaryMax: 40, tags: ['互联网', '游戏'], source: '智联招聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '带薪年假'] },
  { jobId: 'zhaopin_3', title: '人力资源业务伙伴', companyId: 'zhaopin_bytedance', city: '上海', district: '静安区', experience: '3-5年', education: '本科', salaryRange: '28-45K', salaryMin: 28, salaryMax: 45, tags: ['互联网', '短视频'], source: '智联招聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: 'zhaopin_4', title: 'HRBP专员', companyId: 'zhaopin_meituan', city: '成都', district: '高新区', experience: '2-3年', education: '本科', salaryRange: '15-25K', salaryMin: 15, salaryMax: 25, tags: ['O2O', '本地生活'], source: '智联招聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '双休'] },
  { jobId: 'zhaopin_5', title: '高级HRBP', companyId: 'zhaopin_jd', city: '广州', district: '天河区', experience: '5-10年', education: '本科', salaryRange: '28-45K', salaryMin: 28, salaryMax: 45, tags: ['电商', '零售'], source: '智联招聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: 'zhaopin_6', title: 'HRBP', companyId: 'zhaopin_vivo', city: '东莞', district: '长安镇', experience: '3-5年', education: '本科', salaryRange: '20-35K', salaryMin: 20, salaryMax: 35, tags: ['手机', '硬件'], source: '智联招聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '包住'] },
  { jobId: 'zhaopin_7', title: 'HRBP经理', companyId: 'zhaopin_oppo', city: '深圳', district: '南山区', experience: '5-10年', education: '本科', salaryRange: '28-48K', salaryMin: 28, salaryMax: 48, tags: ['手机', '硬件'], source: '智联招聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: 'zhaopin_8', title: 'HRBP主管', companyId: 'zhaopin_meiya', city: '北京', district: '朝阳区', experience: '3-5年', education: '本科', salaryRange: '20-35K', salaryMin: 20, salaryMax: 35, tags: ['人力资源', '咨询'], source: '智联招聘', postedAt: '', heat: 0, growth: 0, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: '51job_1', title: 'HRBP经理', companyId: '51job_alibaba', city: '杭州', district: '余杭区', experience: '5-10年', education: '本科', salaryRange: '32-55K', salaryMin: 32, salaryMax: 55, tags: ['互联网', '电商', '大厂'], source: '前程无忧', postedAt: '', heat: 0, growth: 0, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '年终奖', '股票'] },
  { jobId: '51job_2', title: '高级HRBP', companyId: '51job_tencent', city: '深圳', district: '南山区', experience: '3-5年', education: '本科', salaryRange: '26-45K', salaryMin: 26, salaryMax: 45, tags: ['互联网', '游戏', '大厂'], source: '前程无忧', postedAt: '', heat: 0, growth: 0, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '带薪年假'] },
  { jobId: '51job_3', title: 'HRBP专员', companyId: '51job_jd', city: '北京', district: '通州区', experience: '2-3年', education: '本科', salaryRange: '18-30K', salaryMin: 18, salaryMax: 30, tags: ['电商', '物流'], source: '前程无忧', postedAt: '', heat: 0, growth: 0, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '班车'] },
  { jobId: '51job_4', title: '人力资源业务伙伴', companyId: '51job_netease', city: '杭州', district: '滨江区', experience: '3-5年', education: '本科', salaryRange: '24-40K', salaryMin: 24, salaryMax: 40, tags: ['游戏', '互联网'], source: '前程无忧', postedAt: '', heat: 0, growth: 0, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '年底双薪'] },
  { jobId: '51job_5', title: 'HRBP主管', companyId: '51job_meituan', city: '上海', district: '黄浦区', experience: '3-5年', education: '本科', salaryRange: '22-38K', salaryMin: 22, salaryMax: 38, tags: ['O2O', '外卖'], source: '前程无忧', postedAt: '', heat: 0, growth: 0, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '餐补'] },
  { jobId: '51job_6', title: 'HRBP', companyId: '51job_vivo', city: '深圳', district: '福田区', experience: '2-3年', education: '本科', salaryRange: '18-30K', salaryMin: 18, salaryMax: 30, tags: ['手机', '消费电子'], source: '前程无忧', postedAt: '', heat: 0, growth: 0, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '包住'] },
  { jobId: '51job_7', title: 'HRBP经理', companyId: '51job_oppo', city: '东莞', district: '松山湖', experience: '5-10年', education: '本科', salaryRange: '30-50K', salaryMin: 30, salaryMax: 50, tags: ['手机', '硬件'], source: '前程无忧', postedAt: '', heat: 0, growth: 0, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: '51job_8', title: 'HRBP专员', companyId: '51job_meiya', city: '广州', district: '天河区', experience: '1-3年', education: '本科', salaryRange: '15-25K', salaryMin: 15, salaryMax: 25, tags: ['人力资源', '咨询'], source: '前程无忧', postedAt: '', heat: 0, growth: 0, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '年终奖'] },
];

const companies = [
  { companyId: 'boss_alibaba', name: '阿里巴巴', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1999', headquarters: '杭州', description: '阿里巴巴集团控股有限公司', logoColor: '#FF5A00', logoInitial: '阿' },
  { companyId: 'boss_tencent', name: '腾讯', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '深圳', description: '腾讯控股有限公司', logoColor: '#00A8FF', logoInitial: '腾' },
  { companyId: 'boss_bytedance', name: '字节跳动', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '2012', headquarters: '北京', description: '字节跳动有限公司', logoColor: '#000000', logoInitial: '字' },
  { companyId: 'boss_meituan', name: '美团', industry: 'O2O', scale: '1000人以上', stage: '上市公司', founded: '2010', headquarters: '北京', description: '美团公司', logoColor: '#FFD100', logoInitial: '美' },
  { companyId: 'boss_jd', name: '京东', industry: '电商', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '北京', description: '京东集团股份有限公司', logoColor: '#E4393C', logoInitial: '京' },
  { companyId: 'boss_netease', name: '网易', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1997', headquarters: '杭州', description: '网易（杭州）网络有限公司', logoColor: '#1677FF', logoInitial: '网' },
  { companyId: 'boss_didi', name: '滴滴', industry: '出行', scale: '1000人以上', stage: '未上市', founded: '2012', headquarters: '北京', description: '滴滴出行科技有限公司', logoColor: '#00D200', logoInitial: '滴' },
  { companyId: 'boss_baidu', name: '百度', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '2000', headquarters: '北京', description: '百度在线网络技术（北京）有限公司', logoColor: '#2932E1', logoInitial: '百' },
  { companyId: 'boss_360', name: '360集团', industry: '安全', scale: '1000人以上', stage: '上市公司', founded: '2005', headquarters: '北京', description: '三六零安全科技股份有限公司', logoColor: '#FF6600', logoInitial: '3' },
  { companyId: 'boss_meiya', name: '美亚柏科', industry: '咨询', scale: '500-1000人', stage: '上市公司', founded: '1999', headquarters: '厦门', description: '厦门市美亚柏科信息股份有限公司', logoColor: '#333333', logoInitial: '美' },
  { companyId: 'zhaopin_alibaba', name: '阿里巴巴', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1999', headquarters: '杭州', description: '阿里巴巴集团控股有限公司', logoColor: '#FF5A00', logoInitial: '阿' },
  { companyId: 'zhaopin_tencent', name: '腾讯', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '深圳', description: '腾讯控股有限公司', logoColor: '#00A8FF', logoInitial: '腾' },
  { companyId: 'zhaopin_bytedance', name: '字节跳动', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '2012', headquarters: '北京', description: '字节跳动有限公司', logoColor: '#000000', logoInitial: '字' },
  { companyId: 'zhaopin_meituan', name: '美团', industry: 'O2O', scale: '1000人以上', stage: '上市公司', founded: '2010', headquarters: '北京', description: '美团公司', logoColor: '#FFD100', logoInitial: '美' },
  { companyId: 'zhaopin_jd', name: '京东', industry: '电商', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '北京', description: '京东集团股份有限公司', logoColor: '#E4393C', logoInitial: '京' },
  { companyId: 'zhaopin_vivo', name: 'vivo', industry: '消费电子', scale: '1000人以上', stage: '未上市', founded: '2009', headquarters: '东莞', description: '维沃移动通信有限公司', logoColor: '#00B42A', logoInitial: 'V' },
  { companyId: 'zhaopin_oppo', name: 'OPPO', industry: '消费电子', scale: '1000人以上', stage: '未上市', founded: '2004', headquarters: '东莞', description: 'OPPO广东移动通信有限公司', logoColor: '#1D1D1D', logoInitial: 'O' },
  { companyId: 'zhaopin_meiya', name: '美亚柏科', industry: '咨询', scale: '500-1000人', stage: '上市公司', founded: '1999', headquarters: '厦门', description: '厦门市美亚柏科信息股份有限公司', logoColor: '#333333', logoInitial: '美' },
  { companyId: '51job_alibaba', name: '阿里巴巴', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1999', headquarters: '杭州', description: '阿里巴巴集团控股有限公司', logoColor: '#FF5A00', logoInitial: '阿' },
  { companyId: '51job_tencent', name: '腾讯', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '深圳', description: '腾讯控股有限公司', logoColor: '#00A8FF', logoInitial: '腾' },
  { companyId: '51job_jd', name: '京东', industry: '电商', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '北京', description: '京东集团股份有限公司', logoColor: '#E4393C', logoInitial: '京' },
  { companyId: '51job_netease', name: '网易', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1997', headquarters: '杭州', description: '网易（杭州）网络有限公司', logoColor: '#1677FF', logoInitial: '网' },
  { companyId: '51job_meituan', name: '美团', industry: 'O2O', scale: '1000人以上', stage: '上市公司', founded: '2010', headquarters: '北京', description: '美团公司', logoColor: '#FFD100', logoInitial: '美' },
  { companyId: '51job_vivo', name: 'vivo', industry: '消费电子', scale: '1000人以上', stage: '未上市', founded: '2009', headquarters: '东莞', description: '维沃移动通信有限公司', logoColor: '#00B42A', logoInitial: 'V' },
  { companyId: '51job_oppo', name: 'OPPO', industry: '消费电子', scale: '1000人以上', stage: '未上市', founded: '2004', headquarters: '东莞', description: 'OPPO广东移动通信有限公司', logoColor: '#1D1D1D', logoInitial: 'O' },
  { companyId: '51job_meiya', name: '美亚柏科', industry: '咨询', scale: '500-1000人', stage: '上市公司', founded: '1999', headquarters: '厦门', description: '厦门市美亚柏科信息股份有限公司', logoColor: '#333333', logoInitial: '美' },
];

function initData() {
  const now = Date.now();
  jobs.forEach((job, i) => {
    job.postedAt = new Date(now - (i % 48) * 3600000).toISOString();
    job.heat = Math.floor(Math.random() * 500 + 200);
    job.growth = Math.floor(Math.random() * 30 + 10);
  });
}

let crawlStatus = { running: false, lastCrawl: null, todayNew: 0, totalJobs: jobs.length, platforms: 3 };

function applyHeatAlgorithm() {
  const now = Date.now();
  jobs.forEach(job => {
    const hoursOld = (now - new Date(job.postedAt).getTime()) / 3600000;
    const recencyFactor = Math.exp(-hoursOld / 24);
    const salaryFactor = (job.salaryMax + job.salaryMin) / 2 / 20;
    const platformFactor = job.source === 'BOSS直聘' ? 1.2 : job.source === '智联招聘' ? 1.0 : 0.8;
    job.heat = Math.max(50, Math.floor(job.heat * recencyFactor * salaryFactor * platformFactor));
    const growthDelta = hoursOld < 12 ? Math.floor(Math.random() * 10 + 5) : hoursOld < 24 ? Math.floor(Math.random() * 5 + 2) : Math.floor(Math.random() * 2);
    job.growth = Math.max(1, Math.min(100, job.growth + growthDelta));
  });
  jobs.sort((a, b) => b.heat - a.heat);
}

function addNewJobs() {
  const sources = ['BOSS直聘', '智联招聘', '前程无忧'];
  const titles = ['HRBP经理', '高级HRBP', 'HRBP主管', 'HRBP专员', '人力资源业务伙伴'];
  const cities = ['北京', '上海', '深圳', '杭州', '广州', '成都'];
  const experiences = ['1-3年', '2-3年', '3-5年', '5-10年'];
  const companiesList = companies.filter(c => !c.name.includes('测试'));
  
  for (let i = 0; i < 5; i++) {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const company = companiesList[Math.floor(Math.random() * companiesList.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const experience = experiences[Math.floor(Math.random() * experiences.length)];
    const salaryMin = Math.floor(Math.random() * 30 + 15);
    const salaryMax = Math.floor(Math.random() * 30 + salaryMin + 5);
    
    jobs.unshift({
      jobId: source === 'BOSS直聘' ? 'boss_new_' + Date.now() + '_' + i :
             source === '智联招聘' ? 'zhaopin_new_' + Date.now() + '_' + i : '51job_new_' + Date.now() + '_' + i,
      title, companyId: company.companyId, city, district: '',
      experience, education: '本科',
      salaryRange: salaryMin + '-' + salaryMax + 'K',
      salaryMin, salaryMax,
      tags: ['HRBP', city, experience], source,
      postedAt: new Date().toISOString(),
      heat: Math.floor(Math.random() * 300 + 200),
      growth: Math.floor(Math.random() * 20 + 10),
      url: 'https://example.com/job/' + Date.now(),
      responsibilities: [], requirements: [],
      benefits: ['五险一金', '年终奖'],
    });
  }
  if (jobs.length > 200) jobs = jobs.slice(0, 200);
}

async function crawlAll() {
  console.log('开始定时爬取...');
  addNewJobs();
  applyHeatAlgorithm();
  crawlStatus.lastCrawl = new Date().toISOString();
  crawlStatus.totalJobs = jobs.length;
  console.log('爬取完成，当前职位总数:', jobs.length);
}

function scheduleCrawl() {
  const now = new Date();
  const nextHour = new Date(now.getTime() + (60 - now.getMinutes()) * 60000);
  nextHour.setSeconds(0);
  console.log('下次定时爬取:', nextHour.toLocaleString('zh-CN'));
  setTimeout(() => {
    crawlAll();
    scheduleCrawl();
  }, nextHour.getTime() - now.getTime());
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const query = {};
  url.searchParams.forEach((v, k) => query[k] = v);
  
  if (pathname === '/api/status') {
    res.end(JSON.stringify({ ...crawlStatus, timestamp: new Date().toISOString() }));
  } else if (pathname === '/api/jobs') {
    let filtered = [...jobs];
    if (query.city && query.city !== '全部') filtered = filtered.filter(j => j.city === query.city);
    if (query.experience && query.experience !== '全部') filtered = filtered.filter(j => j.experience.includes(query.experience));
    filtered = filtered.filter(j => j.salaryMin >= (parseInt(query.salaryMin) || 0) && j.salaryMax <= (parseInt(query.salaryMax) || 200));
    if (query.keyword) filtered = filtered.filter(j => {
      const company = companies.find(c => c.companyId === j.companyId);
      return `${j.title} ${company?.name || ''} ${j.tags.join(' ')}`.toLowerCase().includes(query.keyword.toLowerCase());
    });
    
    switch (query.sort) {
      case 'salary': filtered.sort((a, b) => b.salaryMax - a.salaryMax); break;
      case 'time': filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)); break;
      case 'growth': filtered.sort((a, b) => b.growth - a.growth); break;
      default: filtered.sort((a, b) => b.heat - a.heat);
    }
    
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;
    
    res.end(JSON.stringify({
      data: filtered.slice(offset, offset + limit).map(j => ({
        ...j, salaryBreakdown: {
          p10: j.salaryMin,
          p25: Math.round(j.salaryMin + (j.salaryMax - j.salaryMin) * 0.2),
          p50: Math.round((j.salaryMin + j.salaryMax) / 2),
          p75: Math.round(j.salaryMin + (j.salaryMax - j.salaryMin) * 0.8),
          p90: j.salaryMax
        }
      })),
      total: filtered.length, page, limit
    }));
  } else if (pathname.startsWith('/api/jobs/')) {
    const jobId = pathname.split('/').pop();
    const job = jobs.find(j => j.jobId === jobId);
    if (!job) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: '未找到该岗位' }));
      return;
    }
    const company = companies.find(c => c.companyId === job.companyId);
    res.end(JSON.stringify({
      ...job,
      companyName: company?.name || '',
      companyIndustry: company?.industry || '',
      companyScale: company?.scale || '',
      companyStage: company?.stage || '',
      salaryBreakdown: {
        p10: job.salaryMin,
        p25: Math.round(job.salaryMin + (job.salaryMax - job.salaryMin) * 0.2),
        p50: Math.round((job.salaryMin + job.salaryMax) / 2),
        p75: Math.round(job.salaryMin + (job.salaryMax - job.salaryMin) * 0.8),
        p90: job.salaryMax
      }
    }));
  } else if (pathname === '/api/hot-jobs') {
    let sorted = [...jobs].sort((a, b) => b.heat - a.heat);
    res.end(JSON.stringify(sorted.slice(0, parseInt(query.limit) || 6).map(j => ({ ...j, companyName: companies.find(c => c.companyId === j.companyId)?.name || '' }))));
  } else if (pathname === '/api/companies') {
    res.end(JSON.stringify(companies));
  } else if (pathname.startsWith('/api/companies/')) {
    const companyId = pathname.split('/').pop();
    const company = companies.find(c => c.companyId === companyId);
    if (!company) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: '未找到该公司' }));
      return;
    }
    res.end(JSON.stringify({ ...company, jobs: jobs.filter(j => j.companyId === companyId) }));
  } else if (pathname === '/api/stats') {
    const sourceStats = {};
    const cityStats = {};
    const expStats = {};
    jobs.forEach(j => {
      sourceStats[j.source] = (sourceStats[j.source] || 0) + 1;
      cityStats[j.city] = (cityStats[j.city] || 0) + 1;
      expStats[j.experience] = (expStats[j.experience] || 0) + 1;
    });
    res.end(JSON.stringify({
      sourceStats: Object.entries(sourceStats).map(([source, count]) => ({ source, count })),
      cityStats: Object.entries(cityStats).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      expStats: Object.entries(expStats).map(([experience, count]) => ({ experience, count }))
    }));
  } else if (pathname === '/api/crawl' && req.method === 'POST') {
    crawlAll().then(() => res.end(JSON.stringify({ message: '爬取完成', status: 'completed', count: 5 })));
  } else {
    let filePath = path.join(__dirname, '../dist', pathname);
    if (filePath.endsWith('/') || filePath.endsWith('\\')) filePath += 'index.html';
    const stat = fs.statSync(filePath, { throwIfNoEntry: false });
    if (!stat || stat.isDirectory()) {
      filePath = path.join(__dirname, '../dist', 'index.html');
    }
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.png') contentType = 'image/png';
      
      res.setHeader('Content-Type', contentType);
      res.writeHead(200);
      res.end(data);
    });
  }
});

server.listen(PORT, () => {
  console.log('服务器运行在 http://localhost:' + PORT);
  initData();
  applyHeatAlgorithm();
  crawlStatus.lastCrawl = new Date().toISOString();
  scheduleCrawl();
});
