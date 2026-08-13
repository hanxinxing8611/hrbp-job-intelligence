// 为 GitHub Pages 静态部署预生成 API JSON 数据
// 运行时机：npm run build 之后

const fs = require('fs')
const path = require('path')

const sources = ['BOSS直聘', '智联招聘', '前程无忧']
const sourceWeights = { 'BOSS直聘': 1.2, '智联招聘': 1.0, '前程无忧': 0.8 }

const companyTemplates = [
  { name: '阿里巴巴', industry: '互联网', headquarters: '杭州', logoColor: '#FF5A00', logoInitial: '阿' },
  { name: '腾讯', industry: '互联网', headquarters: '深圳', logoColor: '#00A8FF', logoInitial: '腾' },
  { name: '字节跳动', industry: '互联网', headquarters: '北京', logoColor: '#000000', logoInitial: '字' },
  { name: '美团', industry: '本地生活', headquarters: '北京', logoColor: '#FFD100', logoInitial: '美' },
  { name: '京东', industry: '电商', headquarters: '北京', logoColor: '#E4393C', logoInitial: '京' },
  { name: '百度', industry: '互联网', headquarters: '北京', logoColor: '#2932E1', logoInitial: '百' },
  { name: '快手', industry: '短视频', headquarters: '北京', logoColor: '#FF6600', logoInitial: '快' },
  { name: '滴滴', industry: '出行', headquarters: '北京', logoColor: '#FF7A00', logoInitial: '滴' },
  { name: '小米', industry: '智能硬件', headquarters: '北京', logoColor: '#FF6900', logoInitial: '小' },
  { name: '华为', industry: '通信/消费电子', headquarters: '深圳', logoColor: '#CF0A2C', logoInitial: '华' },
  { name: 'vivo', industry: '消费电子', headquarters: '东莞', logoColor: '#4CAF50', logoInitial: 'v' },
  { name: 'OPPO', industry: '消费电子', headquarters: '东莞', logoColor: '#2196F3', logoInitial: 'O' },
  { name: '拼多多', industry: '电商', headquarters: '上海', logoColor: '#E02E24', logoInitial: '拼' },
  { name: '网易', industry: '互联网/游戏', headquarters: '杭州', logoColor: '#C20C0C', logoInitial: '网' },
  { name: '蚂蚁集团', industry: '金融科技', headquarters: '杭州', logoColor: '#1677FF', logoInitial: '蚂' },
  { name: '招商银行', industry: '金融', headquarters: '深圳', logoColor: '#C41230', logoInitial: '招' },
  { name: '蔚来汽车', industry: '新能源汽车', headquarters: '上海', logoColor: '#0066FF', logoInitial: '蔚' },
  { name: '理想汽车', industry: '新能源汽车', headquarters: '北京', logoColor: '#000000', logoInitial: '理' },
  { name: '哔哩哔哩', industry: '视频社区', headquarters: '上海', logoColor: '#23ADE5', logoInitial: 'B' },
  { name: '小红书', industry: '内容社区', headquarters: '上海', logoColor: '#FF2442', logoInitial: '红' },
]

const titleBases = ['HRBP', '高级HRBP', 'HRBP经理', 'HRBP主管', 'HRBP专家', '人力资源业务伙伴']
const titleSuffixes = [
  '大模型业务线', '商业化团队', '算法研究院', '产品中心', '技术中台', '市场部',
  '运营中心', '金融事业部', '客户成功部', '创新业务', '感知算法团队', '自动驾驶事业部',
  '新能源研发', '跨境电商', '智能制造', '医疗健康', '教育科技', '金融科技',
  '企业服务', '消费升级', '人力资源中心', '组织发展部', '人才招聘中心', '培训发展部',
  '薪酬绩效中心', '员工关系部', '企业文化部', '数字化HR', '海外HR', '战略HR'
]

const districts = {
  '上海': ['浦东新区', '徐汇区', '长宁区', '静安区', '黄浦区', '闵行区'],
  '北京': ['海淀区', '朝阳区', '昌平区', '西城区', '东城区', '丰台区'],
  '深圳': ['南山区', '福田区', '宝安区', '龙岗区', '罗湖区', '龙华区'],
  '杭州': ['余杭区', '滨江区', '西湖区', '上城区', '拱墅区', '萧山区'],
  '广州': ['天河区', '海珠区', '越秀区', '白云区', '黄埔区', '番禺区'],
  '苏州': ['工业园区', '虎丘区', '吴中区', '相城区', '姑苏区', '吴江区'],
  '东莞': ['长安镇', '南城街道', '东城街道', '松山湖', '莞城街道'],
}

const experienceLevels = ['3-5年', '5-7年', '7-10年', '5-10年']
const tagPool = [
  'AI赛道', '期权激励', '核心业务', '管理岗', '高增长', 'WLB', '稳定',
  '出海', '技术HR', '硕博团队', '研究院', '商业化', '组织发展',
  '校招', '社招', '培训', '薪酬', '绩效', '员工关系', '雇主品牌',
  '数字化', '战略', '专家岗', '弹性工作', '免费三餐', '商业保险',
  '大厂', '互联网', '电商', '金融', '新能源', '硬科技'
]
const benefitPool = [
  '五险一金', '补充医疗', '年度体检', '带薪年假', '股票期权', '年终奖',
  '免费三餐', '弹性工作', '商业保险', '六险一金', '免费班车', '租房补贴',
  '节日福利', '项目奖金', '企业年金', '年度旅游', '员工宿舍', '通勤班车'
]

function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)]
}

function pickN(arr, n, rand) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, n)
}

function generateJobs(count = 300) {
  const rand = seededRandom(20260714)
  const jobs = []
  let idCounter = 1

  for (let i = 0; i < count; i++) {
    const company = pick(companyTemplates, rand)
    const source = pick(sources, rand)
    const base = pick(titleBases, rand)
    const suffix = pick(titleSuffixes, rand)
    const exp = pick(experienceLevels, rand)
    const cityDistricts = districts[company.headquarters] || districts['上海']
    const district = pick(cityDistricts, rand)

    const expFactor = exp === '3-5年' ? 0.7 : exp === '5-7年' ? 1.0 : exp === '7-10年' ? 1.3 : 1.1
    const baseMin = Math.round((15 + rand() * 22) * expFactor)
    const baseMax = Math.round(baseMin + (8 + rand() * 18) * expFactor)
    const bonusMonths = 13 + Math.floor(rand() * 4)

    const hoursAgo = Math.floor(rand() * 72)
    const postedAt = new Date(Date.now() - hoursAgo * 3600000).toISOString()
    const baseHeat = Math.round(300 + rand() * 900)
    const growth = Math.round(8 + rand() * 55)

    jobs.push({
      jobId: `j${idCounter++}`,
      title: `${base}（${suffix}）`,
      companyId: `${source}_${company.name}`,
      companyName: company.name,
      city: company.headquarters,
      district,
      experience: exp,
      education: rand() > 0.7 ? '硕士' : '本科',
      salaryRange: `${baseMin}-${baseMax}K·${bonusMonths}薪`,
      salaryMin: baseMin,
      salaryMax: baseMax,
      tags: pickN(tagPool, 3 + Math.floor(rand() * 2), rand),
      source,
      postedAt,
      heat: baseHeat,
      growth,
      url: source === 'BOSS直聘' ? 'https://www.zhipin.com/job/xxx' : source === '智联招聘' ? 'https://www.zhaopin.com/job/xxx' : 'https://www.51job.com/job/xxx',
      benefits: pickN(benefitPool, 4 + Math.floor(rand() * 3), rand),
    })
  }

  return jobs
}

function applyHeatAlgorithm(jobs) {
  const now = Date.now()
  return jobs.map(job => {
    const hoursOld = Math.max(0, (now - new Date(job.postedAt).getTime()) / 3600000)
    const recencyFactor = Math.exp(-hoursOld / 24)
    const salaryFactor = ((job.salaryMax + job.salaryMin) / 2) / 20
    const platformFactor = sourceWeights[job.source] || 1.0

    // 性价比算法: avgSalary / experienceYears * benefitFactor * companyFactor
    const expYears = parseFloat(job.experience) || 5
    const avgSalary = (job.salaryMin + job.salaryMax) / 2
    const benefitFactor = 1 + (job.benefits?.length || 0) * 0.03
    const valueScore = Math.round((avgSalary / expYears) * benefitFactor * 10) / 10

    return {
      ...job,
      heat: Math.max(50, Math.floor(job.heat * recencyFactor * salaryFactor * platformFactor)),
      growth: Math.max(1, Math.min(100, job.growth + Math.floor((Math.random() - 0.5) * 6))),
      valueScore,
    }
  }).sort((a, b) => b.heat - a.heat)
}

function addSalaryBreakdown(job) {
  return {
    ...job,
    salaryBreakdown: {
      p10: job.salaryMin,
      p25: Math.round(job.salaryMin + (job.salaryMax - job.salaryMin) * 0.2),
      p50: Math.round((job.salaryMin + job.salaryMax) / 2),
      p75: Math.round(job.salaryMin + (job.salaryMax - job.salaryMin) * 0.8),
      p90: Math.round(job.salaryMax + (job.salaryMax - job.salaryMin) * 0.2),
    },
  }
}

function getCompaniesData() {
  const map = new Map()
  for (const tpl of companyTemplates) {
    if (!map.has(tpl.name)) {
      map.set(tpl.name, {
        companyId: tpl.name,
        name: tpl.name,
        industry: tpl.industry,
        scale: '1000人以上',
        stage: '上市公司',
        founded: String(1990 + Math.floor(Math.random() * 30)),
        headquarters: tpl.headquarters,
        description: `${tpl.name}是中国${tpl.industry}领域的代表性企业。`,
        logoColor: tpl.logoColor,
        logoInitial: tpl.logoInitial,
      })
    }
  }
  return Array.from(map.values())
}

function getCompanyById(companyId, companies) {
  const company = companies.find(c => c.companyId === companyId)
  if (company) return company
  const suffix = companyId.split('_')[1]
  return companies.find(c => c.name.includes(suffix)) || companies[0]
}

function getCompanyAnalysis(companyId) {
  const rand = seededRandom(companyId.split('').reduce((a, b) => a + b.charCodeAt(0), 0))
  const atmosphereScore = Math.floor(rand() * 20 + 70)
  const competitivenessScore = Math.floor(rand() * 20 + 65)
  const potentialScore = Math.floor(rand() * 20 + 70)
  const overall = Math.round((atmosphereScore + competitivenessScore + potentialScore) / 3)
  let grade = 'B'
  if (overall >= 90) grade = 'S'
  else if (overall >= 80) grade = 'A'
  else if (overall >= 70) grade = 'B'
  else if (overall >= 60) grade = 'C'

  return {
    companyId,
    atmosphereScore,
    competitivenessScore,
    potentialScore,
    overall,
    grade,
    strengths: ['团队氛围好', '发展空间大', '福利待遇优'],
    weaknesses: ['部分流程待优化', '行业竞争激烈'],
    radar: [
      { label: '文化开放度', value: Math.floor(rand() * 40 + 60), key: 'cultureOpenness' },
      { label: '晋升空间', value: Math.floor(rand() * 40 + 50), key: 'promotionSpace' },
      { label: '团队稳定', value: Math.floor(rand() * 40 + 55), key: 'teamStability' },
      { label: '领导力', value: Math.floor(rand() * 40 + 50), key: 'leadership' },
      { label: '加班强度', value: Math.floor(rand() * 30 + 40), key: 'overtimeIntensity' },
    ],
    competitors: [
      { companyId, metric: '薪资竞争力', value: Math.floor(rand() * 30 + 70), industryAvg: 65 },
      { companyId, metric: '发展潜力', value: Math.floor(rand() * 30 + 65), industryAvg: 60 },
      { companyId, metric: '团队氛围', value: Math.floor(rand() * 30 + 75), industryAvg: 70 },
      { companyId, metric: '稳定性', value: Math.floor(rand() * 30 + 60), industryAvg: 55 },
      { companyId, metric: '行业地位', value: Math.floor(rand() * 30 + 55), industryAvg: 50 },
    ],
    trend: ['2021', '2022', '2023', '2024', '2025'].map(year => {
      const revenue = Math.floor(rand() * 1000 + 500)
      const headcount = Math.floor(rand() * 100 + 50)
      return { companyId, year, revenue, headcount, openings: Math.floor(rand() * 50 + 10) }
    }),
  }
}

function main() {
  const distDir = path.resolve(__dirname, '../dist')
  const apiDir = path.join(distDir, 'api')
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true })
  }

  const jobs = applyHeatAlgorithm(generateJobs(1000)).map(addSalaryBreakdown)
  const companies = getCompaniesData()
  const lastCrawl = new Date().toISOString()

  // /api/jobs 的默认数据（热门排序，无筛选）
  fs.writeFileSync(path.join(apiDir, 'jobs.json'), JSON.stringify({
    data: jobs,
    total: jobs.length,
    page: 1,
    limit: jobs.length,
  }, null, 2))

  // /api/hot-jobs
  fs.writeFileSync(path.join(apiDir, 'hot-jobs.json'), JSON.stringify(jobs.slice(0, 6), null, 2))

  // /api/companies
  fs.writeFileSync(path.join(apiDir, 'companies.json'), JSON.stringify(companies, null, 2))

  // /api/companies/:id
  const companiesDir = path.join(apiDir, 'companies')
  if (!fs.existsSync(companiesDir)) fs.mkdirSync(companiesDir, { recursive: true })
  for (const company of companies) {
    const companyJobs = jobs.filter(j => j.companyName === company.name).slice(0, 10)
    fs.writeFileSync(path.join(companiesDir, `${encodeURIComponent(company.companyId)}.json`), JSON.stringify({
      ...company,
      jobs: companyJobs,
      analysis: getCompanyAnalysis(company.companyId),
    }, null, 2))
  }

  // /api/stats
  const sourceStats = {}
  const cityStats = {}
  const expStats = {}
  jobs.forEach(j => {
    sourceStats[j.source] = (sourceStats[j.source] || 0) + 1
    cityStats[j.city] = (cityStats[j.city] || 0) + 1
    expStats[j.experience] = (expStats[j.experience] || 0) + 1
  })
  fs.writeFileSync(path.join(apiDir, 'stats.json'), JSON.stringify({
    sourceStats: Object.entries(sourceStats).map(([source, count]) => ({ source, count })),
    cityStats: Object.entries(cityStats).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    expStats: Object.entries(expStats).map(([experience, count]) => ({ experience, count })),
  }, null, 2))

  // /api/status
  fs.writeFileSync(path.join(apiDir, 'status.json'), JSON.stringify({
    running: false,
    lastCrawl,
    todayNew: 5,
    totalJobs: jobs.length,
    platforms: sources.length,
    timestamp: new Date().toISOString(),
  }, null, 2))

  // /api/jobs/:id
  const jobsDir = path.join(apiDir, 'jobs')
  if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true })
  for (const job of jobs) {
    fs.writeFileSync(path.join(jobsDir, `${job.jobId}.json`), JSON.stringify(job, null, 2))
  }

  console.log(`静态 API 生成完成：${jobs.length} 个职位，${companies.length} 家公司`)
}

main()
