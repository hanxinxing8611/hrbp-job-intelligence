// Vercel Serverless Function - 适配无服务器环境
// 数据存储在内存中，每次请求独立计算热度

const jobsData = [
  { jobId: 'boss_1', title: 'HRBP经理', companyId: 'boss_alibaba', city: '杭州', district: '余杭区', experience: '5-10年', education: '本科', salaryRange: '35-60K', salaryMin: 35, salaryMax: 60, tags: ['大厂', '互联网', '绩效奖金', '股票'], source: 'BOSS直聘', postedAt: new Date(Date.now()-3600000).toISOString(), heat: 850, growth: 45, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '年终奖', '股票'] },
  { jobId: 'boss_2', title: '高级HRBP', companyId: 'boss_tencent', city: '深圳', district: '南山区', experience: '3-5年', education: '本科', salaryRange: '30-50K', salaryMin: 30, salaryMax: 50, tags: ['大厂', '游戏'], source: 'BOSS直聘', postedAt: new Date(Date.now()-7200000).toISOString(), heat: 720, growth: 38, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '带薪年假'] },
  { jobId: 'boss_3', title: 'HRBP专家', companyId: 'boss_bytedance', city: '北京', district: '海淀区', experience: '5-10年', education: '本科', salaryRange: '40-70K', salaryMin: 40, salaryMax: 70, tags: ['大厂', '短视频', '全球化'], source: 'BOSS直聘', postedAt: new Date(Date.now()-10800000).toISOString(), heat: 680, growth: 42, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '租房补贴'] },
  { jobId: 'boss_4', title: 'HRBP主管', companyId: 'boss_meituan', city: '北京', district: '朝阳区', experience: '3-5年', education: '本科', salaryRange: '25-40K', salaryMin: 25, salaryMax: 40, tags: ['O2O', '外卖'], source: 'BOSS直聘', postedAt: new Date(Date.now()-14400000).toISOString(), heat: 580, growth: 32, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '餐补'] },
  { jobId: 'boss_5', title: '人力资源业务伙伴', companyId: 'boss_jd', city: '北京', district: '通州区', experience: '5-10年', education: '本科', salaryRange: '30-55K', salaryMin: 30, salaryMax: 55, tags: ['电商', '物流'], source: 'BOSS直聘', postedAt: new Date(Date.now()-18000000).toISOString(), heat: 520, growth: 28, url: 'https://www.zhipin.com/job/xxx', benefits: ['五险一金', '班车'] },
  { jobId: 'zhaopin_1', title: 'HRBP经理', companyId: 'zhaopin_alibaba', city: '杭州', district: '西湖区', experience: '5-10年', education: '本科', salaryRange: '30-50K', salaryMin: 30, salaryMax: 50, tags: ['互联网', '电商'], source: '智联招聘', postedAt: new Date(Date.now()-21600000).toISOString(), heat: 480, growth: 25, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '年终奖'] },
  { jobId: 'zhaopin_2', title: 'HRBP主管', companyId: 'zhaopin_tencent', city: '深圳', district: '福田区', experience: '3-5年', education: '本科', salaryRange: '25-40K', salaryMin: 25, salaryMax: 40, tags: ['互联网', '游戏'], source: '智联招聘', postedAt: new Date(Date.now()-25200000).toISOString(), heat: 420, growth: 22, url: 'https://www.zhaopin.com/job/xxx', benefits: ['五险一金', '带薪年假'] },
  { jobId: '51job_1', title: 'HRBP经理', companyId: '51job_alibaba', city: '杭州', district: '余杭区', experience: '5-10年', education: '本科', salaryRange: '32-55K', salaryMin: 32, salaryMax: 55, tags: ['互联网', '电商', '大厂'], source: '前程无忧', postedAt: new Date(Date.now()-28800000).toISOString(), heat: 350, growth: 15, url: 'https://www.51job.com/job/xxx', benefits: ['五险一金', '年终奖', '股票'] },
];

const companiesData = [
  { companyId: 'boss_alibaba', name: '阿里巴巴', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1999', headquarters: '杭州', description: '阿里巴巴集团控股有限公司', logoColor: '#FF5A00', logoInitial: '阿' },
  { companyId: 'boss_tencent', name: '腾讯', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '深圳', description: '腾讯控股有限公司', logoColor: '#00A8FF', logoInitial: '腾' },
  { companyId: 'boss_bytedance', name: '字节跳动', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '2012', headquarters: '北京', description: '字节跳动有限公司', logoColor: '#000000', logoInitial: '字' },
  { companyId: 'boss_meituan', name: '美团', industry: 'O2O', scale: '1000人以上', stage: '上市公司', founded: '2010', headquarters: '北京', description: '美团公司', logoColor: '#FFD100', logoInitial: '美' },
  { companyId: 'boss_jd', name: '京东', industry: '电商', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '北京', description: '京东集团股份有限公司', logoColor: '#E4393C', logoInitial: '京' },
  { companyId: 'zhaopin_alibaba', name: '阿里巴巴', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1999', headquarters: '杭州', description: '阿里巴巴集团控股有限公司', logoColor: '#FF5A00', logoInitial: '阿' },
  { companyId: 'zhaopin_tencent', name: '腾讯', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1998', headquarters: '深圳', description: '腾讯控股有限公司', logoColor: '#00A8FF', logoInitial: '腾' },
  { companyId: '51job_alibaba', name: '阿里巴巴', industry: '互联网', scale: '1000人以上', stage: '上市公司', founded: '1999', headquarters: '杭州', description: '阿里巴巴集团控股有限公司', logoColor: '#FF5A00', logoInitial: '阿' },
];

function applyHeatAlgorithm(jobs) {
  const now = Date.now();
  return jobs.map(job => {
    const hoursOld = (now - new Date(job.postedAt).getTime()) / 3600000;
    const recencyFactor = Math.exp(-hoursOld / 24);
    const salaryFactor = (job.salaryMax + job.salaryMin) / 2 / 20;
    const platformFactor = job.source === 'BOSS直聘' ? 1.2 : job.source === '智联招聘' ? 1.0 : 0.8;
    return {
      ...job,
      heat: Math.max(50, Math.floor(job.heat * recencyFactor * salaryFactor * platformFactor)),
      growth: Math.max(1, Math.min(100, job.growth + Math.floor(Math.random() * 5)))
    };
  }).sort((a, b) => b.heat - a.heat);
}

function addSalaryBreakdown(job) {
  return {
    ...job,
    salaryBreakdown: {
      p10: job.salaryMin,
      p25: Math.round(job.salaryMin + (job.salaryMax - job.salaryMin) * 0.2),
      p50: Math.round((job.salaryMin + job.salaryMax) / 2),
      p75: Math.round(job.salaryMin + (job.salaryMax - job.salaryMin) * 0.8),
      p90: job.salaryMax
    }
  };
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const query = {};
  url.searchParams.forEach((v, k) => query[k] = v);

  let jobs = applyHeatAlgorithm([...jobsData]);

  if (pathname === '/api/jobs') {
    let filtered = [...jobs];
    if (query.city && query.city !== '全部') filtered = filtered.filter(j => j.city === query.city);
    if (query.experience && query.experience !== '全部') filtered = filtered.filter(j => j.experience.includes(query.experience));
    filtered = filtered.filter(j => j.salaryMin >= (parseInt(query.salaryMin) || 0) && j.salaryMax <= (parseInt(query.salaryMax) || 200));
    if (query.keyword) filtered = filtered.filter(j => {
      const company = companiesData.find(c => c.companyId === j.companyId);
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
      data: filtered.slice(offset, offset + limit).map(addSalaryBreakdown),
      total: filtered.length, page, limit
    }));
  } else if (pathname === '/api/status') {
    res.end(JSON.stringify({ running: false, lastCrawl: new Date().toISOString(), todayNew: 0, totalJobs: jobs.length, platforms: 3, timestamp: new Date().toISOString() }));
  } else if (pathname === '/api/hot-jobs') {
    let sorted = [...jobs].sort((a, b) => b.heat - a.heat);
    res.end(JSON.stringify(sorted.slice(0, parseInt(query.limit) || 6).map(j => ({ ...j, companyName: companiesData.find(c => c.companyId === j.companyId)?.name || '' })).map(addSalaryBreakdown)));
  } else if (pathname === '/api/companies') {
    res.end(JSON.stringify(companiesData));
  } else if (pathname === '/api/stats') {
    const sourceStats = {}; const cityStats = {}; const expStats = {};
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
  } else {
    res.status(404).end(JSON.stringify({ error: 'Not found' }));
  }
};
