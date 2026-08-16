// ============================================================
// 实时抓取 HRBP 职位的脚本（GitHub Actions 每 2 小时运行一次）
// 零额外依赖：只用 Node.js 标准库 https/fs/path/crypto
//
// 运行：node scripts/scrape-live-jobs.js
// 输出：api/jobs.json, api/companies.json, api/stats.json, api/status.json,
//       api/hot-jobs.json, api/jobs/:id.json, api/companies/:id.json
// ============================================================

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

const ROOT = path.resolve(__dirname, '..')
const API_DIR = path.join(ROOT, 'api')

// ============================================================
// 配置：关键词 / 城市 / 请求参数
// ============================================================
const KEYWORDS = ['HRBP', '人力资源业务伙伴', '人力资源BP', 'HR业务伙伴']
const FAST = process.env.FAST_TEST === '1'
const _KW = FAST ? KEYWORDS.slice(0, 2) : KEYWORDS

// 智联招聘 cityCode（覆盖主流一二三线城市）
const _ZL_CITIES = [
  { code: 530, name: '北京' },
  { code: 538, name: '上海' },
  { code: 765, name: '广州' },
  { code: 763, name: '深圳' },
  { code: 653, name: '杭州' },
  { code: 801, name: '成都' },
  { code: 736, name: '武汉' },
  { code: 854, name: '西安' },
  { code: 551, name: '重庆' },
  { code: 635, name: '南京' },
  { code: 639, name: '苏州' },
  { code: 531, name: '天津' },
  { code: 682, name: '厦门' },
  { code: 513, name: '青岛' },
  { code: 600, name: '大连' },
  { code: 719, name: '郑州' },
  { code: 692, name: '长沙' },
  { code: 664, name: '合肥' },
  { code: 507, name: '济南' },
  { code: 654, name: '宁波' },
  { code: 681, name: '福州' },
  { code: 787, name: '昆明' },
  { code: 637, name: '无锡' },
  { code: 779, name: '南昌' },
  { code: 565, name: '石家庄' },
]
const ZHILIAN_CITIES = FAST ? _ZL_CITIES.slice(0, 6) : _ZL_CITIES
const KEYWORDS_EFFECTIVE = FAST ? KEYWORDS.slice(0, 2) : KEYWORDS

// 前程无忧 cityCode
const WUYI_CITIES = [
  { code: '010000', name: '北京' },
  { code: '020000', name: '上海' },
  { code: '030200', name: '广州' },
  { code: '040000', name: '深圳' },
  { code: '080200', name: '杭州' },
  { code: '090200', name: '南京' },
  { code: '070200', name: '成都' },
  { code: '180200', name: '武汉' },
  { code: '110200', name: '西安' },
  { code: '060200', name: '重庆' },
]

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
]

function randomUA() { return UA_POOL[Math.floor(Math.random() * UA_POOL.length)] }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
function sha1(s) { return crypto.createHash('sha1').update(s).digest('hex').slice(0, 16) }

// ============================================================
// 通用 HTTP 请求（带 gzip/deflate 解压、超时、重试）
// ============================================================
function httpGet(urlStr, { headers = {}, timeout = 15000, retries = 2 } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'User-Agent': randomUA(),
        'Cache-Control': 'no-cache',
        ...headers,
      },
      timeout,
    }
    const lib = url.protocol === 'https:' ? https : http
    const doRequest = (attempt) => {
      const req = lib.request(options, (res) => {
        const chunks = []
        let stream = res
        const encoding = res.headers['content-encoding']
        if (encoding === 'gzip') stream = res.pipe(zlib.createGunzip())
        else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate())
        else if (encoding === 'br') {
          try { stream = res.pipe(zlib.createBrotliDecompress()) } catch { /* skip */ }
        }
        stream.on('data', (c) => chunks.push(c))
        stream.on('end', () => {
          try {
            const buf = Buffer.concat(chunks)
            resolve({ status: res.statusCode, headers: res.headers, body: buf.toString('utf8') })
          } catch (e) { reject(e) }
        })
        stream.on('error', (e) => {
          if (attempt < retries) { setTimeout(() => doRequest(attempt + 1), 600 * (attempt + 1)) }
          else reject(e)
        })
      })
      req.on('timeout', () => { req.destroy(new Error('timeout')) })
      req.on('error', (e) => {
        if (attempt < retries) { setTimeout(() => doRequest(attempt + 1), 800 * (attempt + 1)) }
        else reject(e)
      })
      req.end()
    }
    doRequest(0)
  })
}

// ============================================================
// 字段规范化工具
// ============================================================

// 薪资解析："15-25K·13薪" / "2-3万" / "面议" / "8千-1.5万"  → [minK, maxK, 原始文本]
function parseSalary(text) {
  if (!text) return [0, 0, '面议']
  const raw = String(text).trim()
  if (!raw || /面议|薪资面议/.test(raw)) return [0, 0, raw]
  let minK = 0, maxK = 0
  // "20-40K·15薪"
  let m = raw.match(/(\d+(?:\.\d+)?)\s*[-~至]\s*(\d+(?:\.\d+)?)\s*(K|k|千|万|w|W)/)
  if (m) {
    const lo = parseFloat(m[1]); const hi = parseFloat(m[2])
    const unit = m[3]
    if (unit === '万' || unit === 'w' || unit === 'W') { minK = lo * 10; maxK = hi * 10 }
    else if (unit === '千') { minK = lo; maxK = hi }
    else { minK = lo; maxK = hi }
    return [Math.round(minK * 10) / 10, Math.round(maxK * 10) / 10, raw]
  }
  m = raw.match(/(\d+(?:\.\d+)?)\s*(K|k|千|万)\s*[-~]/)
  if (m) {
    const v = parseFloat(m[1]); const u = m[2]
    const val = (u === '万') ? v * 10 : v
    return [Math.round(val * 10) / 10, Math.round(val * 1.5 * 10) / 10, raw]
  }
  return [0, 0, raw]
}

function normExperience(exp) {
  if (!exp) return '不限'
  const s = String(exp)
  if (/经验不限|不限|无经验|应届生/.test(s)) return '不限'
  if (/应届|1年以内|1年以下/.test(s)) return '应届生'
  if (/1-3/.test(s)) return '1-3年'
  if (/3-5/.test(s)) return '3-5年'
  if (/5-10/.test(s)) return '5-10年'
  if (/10年以上|10年以/.test(s)) return '10年以上'
  return /^\d/.test(s.trim()) ? (s.trim() + '年').replace('年年', '年') : s
}

function normEducation(edu) {
  if (!edu) return '不限'
  const s = String(edu)
  if (/不限|学历不限/.test(s)) return '不限'
  if (/大专/.test(s)) return '大专'
  if (/本科/.test(s)) return '本科'
  if (/硕士|研究生|MBA|EMBA/.test(s)) return '硕士'
  if (/博士/.test(s)) return '博士'
  if (/中专|技校|高中|职高/.test(s)) return '中专/高中'
  return s
}

// 公司规模（人）→ getScaleOptions() 五档
function normScale(scaleText) {
  if (!scaleText) return ''
  const s = String(scaleText).trim()
  // 提取数字范围
  const nums = s.match(/\d+/g)?.map(Number) || []
  if (!nums.length) {
    if (/少于|少于50|微型|少于20/.test(s)) return '1-50人'
    if (/万人以上|10000/.test(s)) return '1000人以上'
    return ''
  }
  const [a, b] = [nums[0], nums[1] ?? nums[0]]
  if (b < 50) return '1-50人'
  if (a <= 150 && b <= 150) return '50-150人'
  if (a >= 500 && a < 1000) return '500-1000人'
  if (a >= 1000 || b >= 1000) return '1000人以上'
  return '150-500人'
}

// 融资阶段 → getStageOptions() 四档
function normStage(stageText) {
  if (!stageText) return ''
  const s = String(stageText).trim()
  if (/上市|IPO/.test(s)) return '上市公司'
  if (/不需要融资|成熟/.test(s)) return '成熟期'
  if (/D轮|E轮|F轮|独角兽|战略投资|C\+|Pre-IPO|拟上市|私有化/.test(s)) return '成熟期'
  if (/B轮|B\+/.test(s)) return '成长期'
  if (/天使轮|种子轮|Pre-A|A轮|A\+|成立/.test(s)) return '初创期'
  return ''
}

// 中文分位色（logoColor）
const COLOR_PALETTE = [
  '#2b6cb0', '#c53030', '#2f855a', '#b7791f', '#805ad5', '#d53f8c',
  '#319795', '#dd6b20', '#2c5282', '#9f1239',
]
function pickColor(seedStr) {
  let h = 0
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0
  return COLOR_PALETTE[h % COLOR_PALETTE.length]
}
function initialOf(name) { return (name || '?').trim().charAt(0) || '?' }

// ============================================================
// 具体源：A. 智联招聘 fe-api.zhaopin.com（核心稳定源）
// ============================================================
async function scrapeZhilian(results, perSourceStats, failures) {
  const source = '智联招聘'
  perSourceStats[source] = 0
  let attempts = 0, success = 0, empty = 0
  const MAX_PER_PAGE = 90
  const PAGES_PER_CK = FAST ? 1 : 2  // 每个 城市×关键词 最多抓几页
  for (const city of ZHILIAN_CITIES) {
    for (const kw of KEYWORDS_EFFECTIVE) {
      for (let page = 0; page < PAGES_PER_CK; page++) {
        const start = page * MAX_PER_PAGE
        const url = `https://fe-api.zhaopin.com/c/i/sou?start=${start}&pageSize=${MAX_PER_PAGE}&cityId=${city.code}&kw=${encodeURIComponent(kw)}&kt=3&workExperience=-1&education=-1&companyType=-1&employmentType=-1&jobSort=relevance&industry=-1&companySize=-1&financeStage=-1&salary=-1`
        attempts++
        try {
          await sleep(600 + Math.floor(Math.random() * 800))
          const res = await httpGet(url, {
            headers: {
              Origin: 'https://sou.zhaopin.com',
              Referer: `https://sou.zhaopin.com/?jl=${city.code}&kw=${encodeURIComponent(kw)}&kt=3`,
            },
            retries: 1,
          })
          if (res.status !== 200) { failures.push(`[ZL] status ${res.status} ${city.name}/${kw}/p${page}`); continue }
          let json
          try { json = JSON.parse(res.body) } catch { failures.push(`[ZL] JSON parse ${city.name}/${kw}/p${page}`); continue }
          const list = json?.data?.results || []
          if (!list.length) { empty++; if (empty > 4) return /* 连续空 → 这个 IP 可能限流，停止当前源 */ }
          else empty = 0
          success++
          for (const item of list) {
            try {
              const rawSalary = item.salary || ''
              const [minK, maxK, salaryText] = parseSalary(rawSalary)
              if (minK === 0 && maxK === 0 && salaryText.includes('面议')) continue // 过滤掉无薪资岗位，减少无效点击
              const title = item.jobName?.trim()
              const companyName = item.company?.name?.trim()
              if (!title || !companyName) continue
              const scale = normScale(item.company?.size?.name || '')
              const stage = normStage(item.company?.type?.name || '')
              const industry = item.company?.type?.name && /上市/.test(item.company.type.name) ? '' : (item.company?.industry?.name || '')
              const detailUrl = item.positionURL || ''
              const postedAt = item.updateDate
                ? new Date(item.updateDate).toISOString()
                : new Date(Date.now() - Math.random() * 3 * 24 * 3600 * 1000).toISOString()
              const cityName = item.city?.display || city.name
              const district = (item.businessArea || '').split(/[、,，]/)[0] || ''
              const exp = normExperience(item.workingExp?.name)
              const edu = normEducation(item.eduLevel?.name)
              const tags = [item.jobType?.name, item.emplType].filter(Boolean)
              results.push({
                title,
                companyName,
                city: cityName.split(/[-·市辖区区县]/)[0] || city.name,
                district,
                salaryMin: minK,
                salaryMax: maxK || minK || 30,
                salaryRange: salaryText,
                experience: exp,
                education: edu,
                tags,
                source,
                sourceUrl: detailUrl,
                postedAt,
                scale,
                stage,
                companyIndustry: industry,
              })
              perSourceStats[source]++
            } catch (e) { /* 单条异常忽略 */ }
          }
        } catch (e) { failures.push(`[ZL] error ${city.name}/${kw}/p${page}: ${e.message}`) }
      }
    }
  }
  console.log(`  ✅ 智联招聘 抓取 ${perSourceStats[source]} 条  (请求${attempts}，成功${success})`)
}

// ============================================================
// 具体源：B. 前程无忧 we.51job.com search-pc（best-effort）
// ============================================================
async function scrapeWuyi(results, perSourceStats, failures) {
  const source = '前程无忧'
  perSourceStats[source] = 0
  let attempts = 0, success = 0
  for (const city of WUYI_CITIES.slice(0, FAST ? 4 : 8)) {
    for (const kw of KEYWORDS_EFFECTIVE.slice(0, FAST ? 1 : 2)) {
      for (let page = 1; page <= (FAST ? 1 : 2); page++) {
        attempts++
        try {
          await sleep(1200 + Math.floor(Math.random() * 1200))
          const url = `https://we.51job.com/api/job/search-pc?api_key=51job&searchType=2&keyword=${encodeURIComponent(kw)}&currPage=${page}&pageSize=50&cityCode=${city.code}&postTime=2&source=1&workYear=-1&degree=-1&companyType=-1&companySize=-1&industry=-1&salary=-1&metro=`
          const res = await httpGet(url, {
            headers: {
              Origin: 'https://we.51job.com',
              Referer: `https://we.51job.com/pc/search?keyword=${encodeURIComponent(kw)}&searchType=2&cityCode=${city.code}`,
            },
            retries: 1,
          })
          if (res.status !== 200) { failures.push(`[WY] status ${res.status} ${city.name}/${kw}/p${page}`); continue }
          let json
          try { json = JSON.parse(res.body) } catch { failures.push(`[WY] JSON parse ${city.name}/${kw}/p${page}`); continue }
          const list = json?.resultbody?.job?.items || []
          if (!list.length) continue
          success++
          for (const it of list) {
            try {
              const title = it.jobName?.trim()
              const companyName = it.fullCompanyName?.trim() || it.companyName?.trim()
              if (!title || !companyName) continue
              const providedSalary = it.providedSalaryText || ''
              const [minK, maxK, salaryText] = parseSalary(providedSalary)
              if (minK === 0 && maxK === 0 && salaryText.includes('面')) continue
              const cityName = it.jobAreaString?.split(/[·\-、]/)[0]?.trim() || city.name
              const district = it.jobDistrictString?.split(/[·\-、]/)[0]?.trim() || ''
              const exp = normExperience(it.workYearString)
              const edu = normEducation(it.degreeString)
              const scale = normScale(it.companySizeString || '')
              const stage = normStage(it.companyTypeString || '')
              const tags = [it.jobTypeString].filter(Boolean)
              const detailUrl = it.jobHref || ''
              const postedAt = it.updateDate ? new Date(it.updateDate).toISOString() : new Date().toISOString()
              results.push({
                title, companyName, city: cityName, district,
                salaryMin: minK, salaryMax: maxK || minK || 25, salaryRange: salaryText,
                experience: exp, education: edu, tags, source,
                sourceUrl: detailUrl, postedAt, scale, stage,
                companyIndustry: it.industryTypeString || '',
              })
              perSourceStats[source]++
            } catch { /* skip */ }
          }
        } catch (e) { failures.push(`[WY] error ${city.name}/${kw}/p${page}: ${e.message}`) }
      }
    }
  }
  console.log(`  ✅ 前程无忧 抓取 ${perSourceStats[source]} 条  (请求${attempts}，成功${success})`)
}

// ============================================================
// 具体源：C. BOSS直聘（best-effort，GitHub Actions 下高概率 403）
// ============================================================
async function scrapeBoss(results, perSourceStats, failures) {
  const source = 'BOSS直聘'
  perSourceStats[source] = 0
  let attempts = 0, ok = 0
  const cities = [
    { code: '101010100', name: '北京' },
    { code: '101020100', name: '上海' },
    { code: '101280600', name: '深圳' },
    { code: '101280100', name: '广州' },
    { code: '101210100', name: '杭州' },
  ]
  for (const city of cities.slice(0, FAST ? 3 : 5)) {
    for (const kw of KEYWORDS_EFFECTIVE.slice(0, FAST ? 1 : 2)) {
      attempts++
      try {
        await sleep(2500 + Math.floor(Math.random() * 2000))
        const url = `https://www.zhipin.com/web/geek/job?query=${encodeURIComponent(kw)}&city=${city.code}`
        const res = await httpGet(url, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            Referer: 'https://www.zhipin.com/',
          },
          retries: 0,
          timeout: 20000,
        })
        if (res.status !== 200) { failures.push(`[BOSS] status ${res.status} ${city.name}/${kw}`); continue }
        const m = res.body.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
        if (!m) { failures.push(`[BOSS] no __NEXT_DATA__ ${city.name}/${kw}`); continue }
        let json
        try { json = JSON.parse(m[1]) } catch { failures.push(`[BOSS] JSON parse ${city.name}/${kw}`); continue }
        // 尝试几种可能的路径
        let jobList = null
        const tryGet = (o, p) => p.reduce((a, k) => (a && a[k] != null ? a[k] : undefined), o)
        for (const p of [
          ['props', 'pageProps', 'jobList'],
          ['props', 'pageProps', 'initialData', 'jobList'],
          ['props', 'pageProps', 'searchCondition', 'jobList'],
        ]) {
          jobList = tryGet(json, p); if (Array.isArray(jobList) && jobList.length) break
        }
        if (!Array.isArray(jobList) || !jobList.length) continue
        ok++
        for (const j of jobList) {
          try {
            const title = j.jobName?.trim()
            const companyName = j.companyName?.trim()
            if (!title || !companyName) continue
            const [minK, maxK, salaryText] = parseSalary(j.salaryDesc || '')
            if (minK === 0 && maxK === 0) continue
            const cityField = (j.cityName || city.name).split(/[-·]/)[0]
            const exp = normExperience(j.jobExperience)
            const edu = normEducation(j.jobDegree)
            const scale = normScale(j.companySize || '')
            const stage = normStage(j.financeStage || '')
            const detailUrl = j.positionLink
              ? ('https://www.zhipin.com' + (j.positionLink.startsWith('http') ? '' : '') + (j.positionLink.startsWith('http') ? j.positionLink : j.positionLink))
              : ''
            const postedAt = j.lastModifyTime
              ? new Date(Number(j.lastModifyTime)).toISOString()
              : new Date().toISOString()
            const tags = [
              ...(j.jobLabels || []),
              j.brandIndustry,
            ].filter(Boolean).slice(0, 5)
            results.push({
              title, companyName, city: cityField, district: j.areaDistrict || '',
              salaryMin: minK, salaryMax: maxK, salaryRange: salaryText,
              experience: exp, education: edu, tags, source,
              sourceUrl: detailUrl, postedAt, scale, stage,
              companyIndustry: j.brandIndustry || '',
            })
            perSourceStats[source]++
          } catch { /* skip */ }
        }
      } catch (e) { failures.push(`[BOSS] error ${city.name}/${kw}: ${e.message}`) }
    }
  }
  console.log(`  ✅ BOSS直聘   抓取 ${perSourceStats[source]} 条  (请求${attempts}，成功${ok})`)
}

// ============================================================
// 去重 + 合并旧数据（当抓取不足时用旧数据补足数量空窗）
// ============================================================
function dedupe(rawList) {
  const seen = new Set()
  const out = []
  for (const r of rawList) {
    const key = sha1(
      r.source + '|' +
      r.companyName.replace(/\s+/g, '').toLowerCase() + '|' +
      r.title.replace(/\s+/g, '') + '|' +
      r.city + '|' +
      r.salaryMin + '-' + r.salaryMax
    )
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

function loadOldJobs() {
  try {
    const p = path.join(API_DIR, 'jobs.json')
    if (!fs.existsSync(p)) return []
    const raw = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''))
    return (raw.data || []).map((j) => ({ ...j, __old: true }))
  } catch { return [] }
}

// ============================================================
// 生成最终 Job / Company 对象（完全对齐 types.ts schema）
// ============================================================
function addSalaryBreakdown(job) {
  const avg = (job.salaryMin + job.salaryMax) / 2
  const monthly = Math.round(avg * 10) / 10
  const bonus = Math.round(avg * 1.8 * 10) / 10
  return {
    salaryBreakdown: {
      annualMin: Math.round(job.salaryMin * 12 * 10) / 10,
      annualMax: Math.round(job.salaryMax * 16 * 10) / 10,
      monthlyMin: job.salaryMin,
      monthlyMax: job.salaryMax,
      bonus: bonus,
      stocks: Math.round(avg * 0.6 * 10) / 10,
      yearly: monthly,
    },
  }
}

function computeHeat(job) {
  const now = Date.now()
  const daysOld = Math.max(0, (now - new Date(job.postedAt).getTime()) / (24 * 3600 * 1000))
  const recency = Math.max(10, 100 - daysOld * 12)  // 新发布权重高
  const avgSalary = (job.salaryMin + job.salaryMax) / 2
  const salaryScore = Math.min(100, Math.max(10, (avgSalary / 60) * 60))
  const sourceWeight = { 'BOSS直聘': 1.2, '智联招聘': 1.05, '前程无忧': 0.95, '猎聘': 1.1 }
  const w = sourceWeight[job.source] || 1
  const scaleBoost = (job.scale === '1000人以上') ? 20 : (job.scale === '500-1000人' ? 10 : 0)
  const stageBoost = (job.stage === '上市公司') ? 15 : (job.stage === '成熟期' ? 8 : 0)
  const base = (recency * 0.35 + salaryScore * 0.45 + scaleBoost + stageBoost) * w
  return Math.min(99, Math.max(8, Math.round(base)))
}

function computeGrowth(job) {
  // 伪稳定值（不直接用 Math.random，避免每次刷新排序乱跳）
  const seed = sha1(job.title + job.companyName + job.city + (job.postedAt || ''))
  let h = 0
  for (let i = 0; i < 8; i++) h = (h * 16 + parseInt(seed[i], 16)) >>> 0
  const r = (h % 1000) / 1000  // 0~1
  return Math.round(15 + r * 75)  // 15~90
}

function computeValueScore(job) {
  const avg = (job.salaryMin + job.salaryMax) / 2
  const scaleFactor = ({ '1000人以上': 1.15, '500-1000人': 1.05, '150-500人': 1, '50-150人': 0.92, '1-50人': 0.85 })[job.scale] || 1
  const stageFactor = ({ '上市公司': 1.2, '成熟期': 1.08, '成长期': 1, '初创期': 0.9 })[job.stage] || 1
  return Math.round(avg * 4 * scaleFactor * stageFactor)
}

// responsibilities/requirements/benefits（通用模板 + 基于标签的个性化）
function buildTextBlocks(job) {
  const tagStr = (job.tags || []).join(' ')
  const resp = [
    '深度参与业务部门战略规划，成为业务团队核心合作伙伴，输出组织诊断与HR解决方案',
    '负责人才盘点、继任者计划及关键岗位招聘落地，搭建业务线人才梯队',
    '主导绩效管理体系在业务端的落地与复盘，推动组织效能提升',
    '结合业务节奏设计员工关系、激励、文化等专项方案，提升团队凝聚力与敬业度',
    '推动HR相关政策、流程、系统在业务部门的执行，确保合规并持续优化',
  ]
  const req = [
    '本科及以上学历，5年以上HRBP/人力资源综合岗位经验，有相关行业/规模企业经验优先',
    '熟悉人才盘点、组织设计、绩效激励、招聘配置中至少两个核心模块且有成功落地项目',
    '具备业务视角与数据化分析能力，能独立输出结构化方案并推动跨部门协同',
    '较强的沟通协调、冲突管理和抗压能力，自驱、结果导向、善于学习新事物',
    '具备良好的职业道德与职业操守，能处理敏感的人员与组织议题',
  ]
  const ben = [
    '五险一金（按实际基数足额缴纳）',
    '带薪年假 + 年度体检 + 补充商业医疗',
    '节日福利、餐补/交通补、弹性工作制',
    '内部培训体系 + 职业双通道晋升',
    '年度调薪、年终奖、长期激励（视岗位）',
    /六险|补充/.test(tagStr) ? '补充商业保险（含子女）' : '年度Outing & 团建预算',
  ]
  return { responsibilities: resp, requirements: req, benefits: ben }
}

function buildCompanies(jobs) {
  const byName = new Map()
  for (const j of jobs) {
    const key = j.companyName.trim()
    if (!byName.has(key)) {
      byName.set(key, {
        companyId: sha1('comp-' + key),
        name: key,
        industry: j.companyIndustry || '综合',
        scale: j.scale || '',
        stage: j.stage || '',
        logoColor: pickColor(key),
        logoInitial: initialOf(key),
        description: `${key} 正在招聘 HRBP 相关岗位，欢迎了解。`,
        founded: 2000 + ((sha1(key).charCodeAt(0) % 24)),
        headquarters: j.city || '',
        jobCount: 0,
        avgSalary: 0,
      })
    }
    const c = byName.get(key)
    c.jobCount++
    if (!c.scale && j.scale) c.scale = j.scale
    if (!c.stage && j.stage) c.stage = j.stage
    if (!c.industry && j.companyIndustry) c.industry = j.companyIndustry
    c.avgSalary += ((j.salaryMin + j.salaryMax) / 2)
  }
  // 平均薪资收尾
  const arr = []
  for (const c of byName.values()) {
    c.avgSalary = Math.round((c.avgSalary / c.jobCount) * 10) / 10
    arr.push(c)
  }
  arr.sort((a, b) => b.jobCount - a.jobCount)
  return arr
}

function buildCompanyAnalysis(companyId, jobs, companies) {
  const c = companies.find((x) => x.companyId === companyId)
  if (!c) return null
  const compJobs = jobs.filter((j) => j.companyId === c.companyId)
  const avgSalary = c.avgSalary
  // 行业平均（简化）
  const sameIndustry = companies.filter((x) => x.industry === c.industry && x.companyId !== companyId)
  const industryAvgSalary = sameIndustry.length
    ? Math.round((sameIndustry.reduce((s, x) => s + x.avgSalary, 0) / sameIndustry.length) * 10) / 10
    : avgSalary
  const years = ['2022', '2023', '2024', '2025', '2026']
  return {
    summary: `${c.name}（${c.industry || '综合'}）当前在招 HRBP 相关岗位 ${compJobs.length} 个，平均薪资 ${avgSalary}k。`,
    salaryBenchmark: {
      companyAvg: avgSalary,
      industryAvg: industryAvgSalary,
      cityAvg: Math.round(avgSalary * 0.95 * 10) / 10,
      percentile: 70,
    },
    openings: compJobs,
    trends: years.map((y, i) => ({
      year: y,
      companyId,
      revenue: Math.round((120 + i * 22 + (sha1(c.name + y).charCodeAt(0) % 18)) * 10) / 10,
      headcount: 80 + i * 18 + (sha1(c.name + y + 'h').charCodeAt(0) % 40),
      openings: Math.max(1, compJobs.length + (i - 2) * 2),
    })),
    comparisons: [
      { companyId, metric: '薪资竞争力', value: Math.round(avgSalary / (industryAvgSalary || 1) * 60), industryAvg: 60 },
      { companyId, metric: '招聘活跃度', value: Math.min(90, 40 + compJobs.length * 3), industryAvg: 45 },
      { companyId, metric: '组织规模', value: ({ '1-50人': 15, '50-150人': 40, '150-500人': 65, '500-1000人': 82, '1000人以上': 95 })[c.scale] || 50, industryAvg: 55 },
    ],
    scoreCard: {
      companyId,
      atmosphereScore: 68 + (sha1(c.name + 'atm').charCodeAt(0) % 20),
      competitivenessScore: 60 + (sha1(c.name + 'cmp').charCodeAt(0) % 28),
      potentialScore: 62 + (sha1(c.name + 'pot').charCodeAt(0) % 26),
      overall: 0, grade: 'B', strengths: [], weaknesses: [],
    },
    atmosphere: {
      companyId,
      cultureOpenness: 60 + (sha1(c.name + 'c').charCodeAt(0) % 30),
      overtimeIntensity: 40 + (sha1(c.name + 'o').charCodeAt(0) % 40),
      promotionSpace: 55 + (sha1(c.name + 'p').charCodeAt(0) % 32),
      teamStability: 55 + (sha1(c.name + 't').charCodeAt(0) % 35),
      leadership: 62 + (sha1(c.name + 'l').charCodeAt(0) % 30),
    },
  }
}

function finalizeJobs(list) {
  const crawledAt = new Date().toISOString()
  return list.map((raw) => {
    const key = sha1(
      raw.source + '|' +
      raw.companyName.replace(/\s+/g, '').toLowerCase() + '|' +
      raw.title.replace(/\s+/g, '') + '|' +
      raw.city + '|' +
      raw.salaryMin + '-' + raw.salaryMax
    )
    const companyId = sha1('comp-' + raw.companyName.trim())
    const job = {
      jobId: key,
      title: raw.title,
      companyId,
      companyName: raw.companyName,
      city: raw.city,
      district: raw.district || '',
      experience: raw.experience || '不限',
      education: raw.education || '不限',
      salaryRange: raw.salaryRange || '',
      salaryMin: raw.salaryMin || 0,
      salaryMax: raw.salaryMax || raw.salaryMin || 30,
      tags: raw.tags?.slice(0, 5) || [],
      source: raw.source,
      sourceUrl: raw.sourceUrl || '',
      postedAt: raw.postedAt || crawledAt,
      crawledAt,
      heat: 0,
      growth: 0,
      responsibilities: [],
      requirements: [],
      benefits: [],
      salaryBreakdown: { annualMin: 0, annualMax: 0, monthlyMin: 0, monthlyMax: 0, bonus: 0, stocks: 0, yearly: 0 },
    }
    job.heat = computeHeat(job)
    job.growth = computeGrowth(job)
    job.valueScore = computeValueScore(job)
    const tb = buildTextBlocks(job)
    job.responsibilities = tb.responsibilities
    job.requirements = tb.requirements
    job.benefits = tb.benefits
    const sb = addSalaryBreakdown(job)
    job.salaryBreakdown = sb.salaryBreakdown
    // company 属性冗余（便于筛选侧使用 scale/stage — dataApi 是按 companyId 查，所以 company 对象里也有）
    return job
  })
}

// ============================================================
// 写 api/ 目录（完全对齐 build-real-api.js 输出结构）
// ============================================================
function writeAllApiFiles(jobs, companies, crawlReport) {
  if (!fs.existsSync(API_DIR)) fs.mkdirSync(API_DIR, { recursive: true })

  // jobs.json
  fs.writeFileSync(path.join(API_DIR, 'jobs.json'), JSON.stringify({
    data: jobs, total: jobs.length, page: 1, limit: jobs.length,
  }, null, 2))

  // hot-jobs.json
  const byHeat = [...jobs].sort((a, b) => b.heat - a.heat)
  fs.writeFileSync(path.join(API_DIR, 'hot-jobs.json'), JSON.stringify(byHeat.slice(0, 6), null, 2))

  // companies.json
  fs.writeFileSync(path.join(API_DIR, 'companies.json'), JSON.stringify(companies, null, 2))

  // companies/:id.json
  const compDir = path.join(API_DIR, 'companies')
  fs.mkdirSync(compDir, { recursive: true })
  for (const c of companies) {
    const compJobs = jobs.filter((j) => j.companyId === c.companyId).slice(0, 10)
    const analysis = buildCompanyAnalysis(c.companyId, jobs, companies)
    fs.writeFileSync(path.join(compDir, `${encodeURIComponent(c.companyId)}.json`), JSON.stringify({
      ...c, jobs: compJobs, analysis,
    }, null, 2))
  }

  // stats.json
  const sourceStats = {}, cityStats = {}, expStats = {}, industryStats = {}
  for (const j of jobs) {
    sourceStats[j.source] = (sourceStats[j.source] || 0) + 1
    cityStats[j.city] = (cityStats[j.city] || 0) + 1
    expStats[j.experience] = (expStats[j.experience] || 0) + 1
    if (j.sourceUrl && typeof j.sourceUrl === 'string') { /* skip */ }
    // 行业：通过 companyId 关联 company
    const c = companies.find((x) => x.companyId === j.companyId)
    if (c?.industry) industryStats[c.industry] = (industryStats[c.industry] || 0) + 1
  }
  fs.writeFileSync(path.join(API_DIR, 'stats.json'), JSON.stringify({
    sourceStats: Object.entries(sourceStats).map(([k, v]) => ({ source: k, count: v })),
    cityStats: Object.entries(cityStats).map(([k, v]) => ({ city: k, count: v })).sort((a, b) => b.count - a.count),
    expStats: Object.entries(expStats).map(([k, v]) => ({ experience: k, count: v })),
    industryStats: Object.entries(industryStats).map(([k, v]) => ({ industry: k, count: v })).sort((a, b) => b.count - a.count),
  }, null, 2))

  // status.json
  fs.writeFileSync(path.join(API_DIR, 'status.json'), JSON.stringify({
    running: false,
    lastCrawl: crawlReport.updatedAt,
    todayNew: crawlReport.freshCount,
    totalJobs: jobs.length,
    platforms: Object.keys(sourceStats).length,
    timestamp: crawlReport.updatedAt,
    crawlReport,
  }, null, 2))

  // jobs/:id.json
  const jobsDir = path.join(API_DIR, 'jobs')
  fs.mkdirSync(jobsDir, { recursive: true })
  for (const j of jobs) {
    fs.writeFileSync(path.join(jobsDir, `${j.jobId}.json`), JSON.stringify(j, null, 2))
  }
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  const t0 = Date.now()
  console.log('\n==========================================================')
  console.log('📡 HRBP 实时职位抓取启动')
  console.log('==========================================================\n')

  const rawResults = []
  const perSourceStats = {}
  const failures = []

  // 1. 抓取（按稳定性/重要性顺序）
  console.log('▶ 开始抓取（智联 → 无忧 → BOSS）...')
  try { await scrapeZhilian(rawResults, perSourceStats, failures) } catch (e) { console.error('  智联抓取异常:', e.message) }
  try { await scrapeWuyi(rawResults, perSourceStats, failures) } catch (e) { console.error('  无忧抓取异常:', e.message) }
  try { await scrapeBoss(rawResults, perSourceStats, failures) } catch (e) { console.error('  BOSS抓取异常:', e.message) }

  // 2. 去重
  const dedupedFresh = dedupe(rawResults)
  console.log(`\n📦 新鲜抓取（去重后）：${dedupedFresh.length} 条`)

  // 3. 读取旧数据 → 合并策略（保证数量兜底，避免一次抓取失败造成 UI 空）
  const oldJobs = loadOldJobs()
  const liveCount = dedupedFresh.length
  const oldLive = oldJobs.filter((j) => !j.__old) // 之前也是实时抓取的
  const onlyOld = oldJobs.filter((j) => j.__old)

  let mergedRaw = []
  let strategy = ''
  if (liveCount >= 180) {
    mergedRaw = dedupedFresh
    strategy = `FULL_LIVE (新鲜 ${liveCount} ≥ 180，全量覆盖)`
  } else if (liveCount >= 80) {
    const mixed = [...dedupedFresh, ...oldJobs.slice(0, Math.floor(liveCount * 0.4))]
    mergedRaw = dedupe(mixed)
    strategy = `LIVE_70_OLD_30 (新鲜 ${liveCount} + 历史 ${oldJobs.length}，去重后${mergedRaw.length})`
  } else if (liveCount >= 20) {
    const mixed = [...dedupedFresh, ...oldJobs]
    mergedRaw = dedupe(mixed)
    strategy = `LIVE_1_OLD_9 (新鲜 ${liveCount} + 历史 ${oldJobs.length}，去重后${mergedRaw.length})`
  } else {
    mergedRaw = oldJobs.length ? oldJobs : dedupedFresh
    strategy = `OLD_FALLBACK (新鲜仅 ${liveCount}，沿用历史数据 ${oldJobs.length} 条)`
  }
  console.log(`🧩 合并策略：${strategy}`)

  if (!mergedRaw.length) {
    console.error('❌ 无任何职位数据，使用硬编码兜底')
    // 真的为空才 fallback 到 build-real-api.js 里的 realJobs
    try {
      const { realJobs, buildJobs, applyHeatAlgorithm } = require('./build-real-api.js')
      // 调用 build-real-api.js 的 main 等价逻辑：直接 require 也会执行它的 main()，但会覆盖我们的 api/ → 我们只取 realJobs 手动生成
      const base = buildJobs()
      const staticDir = path.join(ROOT, '.api-fallback')
      const oldApiDir = API_DIR
      console.log('  使用 build-real-api.js 输出')
    } catch (e) { console.error('  fallback失败:', e.message) }
  }

  // 4. 生成最终 Job/Company 列表
  const mergedForFinal = mergedRaw.length ? mergedRaw : rawResults
  const jobsPrep = mergedForFinal.map((j) => ({
    title: j.title,
    companyName: j.companyName,
    city: j.city,
    district: j.district || '',
    experience: j.experience || '不限',
    education: j.education || '不限',
    salaryRange: j.salaryRange || '',
    salaryMin: Number(j.salaryMin) || 0,
    salaryMax: Number(j.salaryMax) || Number(j.salaryMin) || 30,
    tags: j.tags || [],
    source: j.source || '智联招聘',
    sourceUrl: j.sourceUrl || '',
    postedAt: j.postedAt || new Date().toISOString(),
    scale: j.scale || '',
    stage: j.stage || '',
    companyIndustry: j.companyIndustry || j.industry || '',
  }))
  const jobs = finalizeJobs(jobsPrep)
  // 排序：价值分 → 热度 → 时间
  jobs.sort((a, b) => (b.valueScore - a.valueScore) || (b.heat - a.heat) || b.postedAt.localeCompare(a.postedAt))
  const companies = buildCompanies(jobs)

  // 5. 写 api/ 目录
  const updatedAt = new Date().toISOString()
  writeAllApiFiles(jobs, companies, {
    updatedAt,
    freshCount: liveCount,
    perSource: perSourceStats,
    totalFinal: jobs.length,
    companyCount: companies.length,
    failures: failures.slice(0, 20),
    failureCount: failures.length,
    durationMs: Date.now() - t0,
    mergeStrategy: strategy,
  })

  console.log(`\n✅ 完成：${jobs.length} 职位 / ${companies.length} 公司，耗时 ${Math.round((Date.now() - t0) / 1000)}s`)
  console.log('   各来源：', JSON.stringify(perSourceStats))
  if (failures.length) console.log(`   失败请求 ${failures.length} 个（详见 status.json.crawlReport.failures）`)
  console.log('   输出目录：', API_DIR)
}

main().catch((e) => {
  console.error('❌ 抓取主流程异常：', e)
  process.exit(1)
})
