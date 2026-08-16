import type {
  Company,
  CompanyComparison,
  CrawlerStatus,
  Job,
  RadarMetric,
  ScoreCard,
  TrendPoint,
} from './types'
import { companies } from './companies'

const API_BASE = '/hrbp-job-intelligence/api'

async function fetchWithFallback<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    // 禁用浏览器缓存静态 JSON：确保 cron 刷新后前端能拿到最新数据
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${url}`)
  }
  return response.json()
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const staticPath = `${API_BASE}${path.split('?')[0]}.json`
  return fetchWithFallback<T>(staticPath, options)
}

let allJobsCache: Job[] | null = null
let cachePromise: Promise<Job[]> | null = null

// 公司数据缓存（从 API 异步加载）
let companiesApiCache: Company[] | null = null

export function clearJobsCache() {
  allJobsCache = null
  cachePromise = null
  companiesApiCache = null
}

// 预加载公司数据（App 启动时调用）
export async function loadCompanies(): Promise<void> {
  if (companiesApiCache) return
  try {
    companiesApiCache = await fetchApi<Company[]>('/companies')
  } catch {
    companiesApiCache = []
  }
}

async function getAllJobsCached(): Promise<Job[]> {
  if (allJobsCache) return allJobsCache
  if (cachePromise) return cachePromise
  cachePromise = (async () => {
    try {
      const result = await fetchApi<{ data: Job[] }>('/jobs')
      allJobsCache = result.data
      return allJobsCache
    } catch (e) {
      console.error('Failed to load jobs:', e)
      return []
    }
  })()
  return cachePromise
}

export interface JobFilters {
  city: string
  experience: string
  salaryMin: number
  salaryMax: number
  scale: string
  stage: string
  keyword: string
}

export const defaultFilters: JobFilters = {
  city: '全部',
  experience: '全部',
  salaryMin: 0,
  salaryMax: 500,
  scale: '全部',
  stage: '全部',
  keyword: '',
}

export const defaultCrawlerStatus: CrawlerStatus = {
  platforms: 3,
  todayNew: 0,
  lastCrawl: new Date().toISOString(),
  totalJobs: 0,
}

export async function getJobs(
  filters: JobFilters,
  sort: 'heat' | 'salary' | 'time' | 'growth' | 'value' = 'value',
  page = 1,
  limit = 200,
): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
  const allJobs = await getAllJobsCached()

  let filtered = allJobs.filter((job) => {
    if (filters.city !== '全部' && job.city !== filters.city) return false
    if (filters.experience !== '全部' && job.experience !== filters.experience) return false
    // 薪资交集算法：保留 [jobMin,jobMax] 与 [filterMin,filterMax] 有交集的职位
    // 排除：职位最高 < 用户最低（完全低于） 或 职位最低 > 用户最高（完全高于）
    if (job.salaryMax < filters.salaryMin) return false
    if (job.salaryMin > filters.salaryMax) return false
    if (filters.keyword && !job.title.includes(filters.keyword) && !job.companyName.includes(filters.keyword)) return false
    // 规模/融资阶段筛选：匹配公司的 scale/stage 字段（不匹配即排除）
    if (filters.scale !== '全部' || filters.stage !== '全部') {
      const company = getCompanyById(job.companyId)
      if (filters.scale !== '全部' && company.scale !== filters.scale) return false
      if (filters.stage !== '全部' && company.stage !== filters.stage) return false
    }
    return true
  })

  switch (sort) {
    case 'heat':
      filtered.sort((a, b) => b.heat - a.heat)
      break
    case 'salary':
      filtered.sort((a, b) => b.salaryMax - a.salaryMax)
      break
    case 'time':
      filtered.sort((a, b) => b.postedAt.localeCompare(a.postedAt))
      break
    case 'growth':
      filtered.sort((a, b) => b.growth - a.growth)
      break
    case 'value':
      filtered.sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0))
      break
  }

  const total = filtered.length
  const start = (page - 1) * limit
  const data = filtered.slice(start, start + limit)

  return { data, total, page, limit }
}

export async function getJobById(jobId: string): Promise<Job | undefined> {
  try {
    return await fetchApi<Job>(`/jobs/${jobId}`)
  } catch {
    const allJobs = await getAllJobsCached()
    return allJobs.find((j) => j.jobId === jobId)
  }
}

export async function getHotJobs(metric: 'heat' | 'salary' | 'growth' = 'heat'): Promise<Job[]> {
  const allJobs = await getAllJobsCached()
  const sorted = [...allJobs]
  switch (metric) {
    case 'heat':
      sorted.sort((a, b) => b.heat - a.heat)
      break
    case 'salary':
      sorted.sort((a, b) => b.salaryMax - a.salaryMax)
      break
    case 'growth':
      sorted.sort((a, b) => b.growth - a.growth)
      break
  }
  return sorted.slice(0, 10)
}

export async function getJobsByCompany(companyId: string): Promise<Job[]> {
  const allJobs = await getAllJobsCached()
  return allJobs.filter((job) => job.companyId === companyId)
}

export async function getSalaryStats(experience?: string): Promise<{
  avg: number
  median: number
  min: number
  max: number
  p25: number
  p75: number
}> {
  try {
    const allJobs = await getJobs(defaultFilters)
    const filtered = experience
      ? allJobs.data.filter((j) => j.experience === experience)
      : allJobs.data
    const salaries = filtered.map((j) => j.salaryMin).sort((a, b) => a - b)
    if (salaries.length === 0) {
      return { avg: 0, median: 0, min: 0, max: 0, p25: 0, p75: 0 }
    }
    const mid = Math.floor(salaries.length / 2)
    return {
      min: salaries[0],
      max: salaries[salaries.length - 1],
      median: salaries.length % 2 ? salaries[mid] : (salaries[mid - 1] + salaries[mid]) / 2,
      p25: salaries[Math.floor(salaries.length * 0.25)],
      p75: salaries[Math.floor(salaries.length * 0.75)],
      avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
    }
  } catch {
    return { avg: 0, median: 0, min: 0, max: 0, p25: 0, p75: 0 }
  }
}

export async function getSimilarJobs(jobId: string, limit = 4): Promise<Job[]> {
  try {
    const target = await getJobById(jobId)
    if (!target) return []
    const all = await getJobs(defaultFilters)
    return all.data
      .filter((j) => j.jobId !== jobId && (j.city === target.city || j.tags.some((t) => target.tags.includes(t))))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, limit)
  } catch {
    return []
  }
}

export function getCompanyById(companyId: string): Company {
  // 优先从 API 加载的真实公司数据查找
  if (companiesApiCache) {
    const apiCompany = companiesApiCache.find((c) => c.companyId === companyId)
    if (apiCompany) return apiCompany
  }
  // 回退到静态公司列表
  const company = companies.find((c) => c.companyId === companyId)
  if (company) return company
  // 最终 fallback：用 companyId 作为公司名（现在 companyId 就是公司名）
  return {
    companyId,
    name: companyId,
    industry: '未知',
    scale: '未知',
    stage: '未知',
    logoColor: '#6366f1',
    logoInitial: companyId.charAt(0),
    description: '',
    founded: 2000,
    headquarters: '未知',
  }
}

export function getAllCompanies(): Company[] {
  return companiesApiCache && companiesApiCache.length > 0 ? companiesApiCache : companies
}

export function getCompanyAtmosphere(companyId: string): RadarMetric[] {
  return [
    { label: '文化开放度', value: Math.floor(Math.random() * 40 + 60), key: 'cultureOpenness' },
    { label: '晋升空间', value: Math.floor(Math.random() * 40 + 50), key: 'promotionSpace' },
    { label: '团队稳定', value: Math.floor(Math.random() * 40 + 55), key: 'teamStability' },
    { label: '领导力', value: Math.floor(Math.random() * 40 + 50), key: 'leadership' },
    { label: '加班强度', value: Math.floor(Math.random() * 30 + 40), key: 'overtimeIntensity' },
  ]
}

export function getCompetitors(companyId: string): CompanyComparison[] {
  return [
    { companyId, metric: '薪资竞争力', value: Math.floor(Math.random() * 30 + 70), industryAvg: 65 },
    { companyId, metric: '发展潜力', value: Math.floor(Math.random() * 30 + 65), industryAvg: 60 },
    { companyId, metric: '团队氛围', value: Math.floor(Math.random() * 30 + 75), industryAvg: 70 },
    { companyId, metric: '稳定性', value: Math.floor(Math.random() * 30 + 60), industryAvg: 55 },
    { companyId, metric: '行业地位', value: Math.floor(Math.random() * 30 + 55), industryAvg: 50 },
  ]
}

export function getGrowthTrend(companyId: string): TrendPoint[] {
  const years = ['2021', '2022', '2023', '2024', '2025']
  let revenue = Math.floor(Math.random() * 1000 + 500)
  let headcount = Math.floor(Math.random() * 100 + 50)

  return years.map((year) => {
    revenue += Math.floor(Math.random() * 500 - 100)
    headcount += Math.floor(Math.random() * 100 - 20)
    return {
      companyId,
      year,
      revenue: Math.max(100, revenue),
      headcount: Math.max(20, headcount),
      openings: Math.floor(Math.random() * 50 + 10),
    }
  })
}

export function getCompanyScoreCard(companyId: string): ScoreCard {
  const atmosphereScore = Math.floor(Math.random() * 20 + 70)
  const competitivenessScore = Math.floor(Math.random() * 20 + 65)
  const potentialScore = Math.floor(Math.random() * 20 + 70)
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
  }
}

export async function getCrawlerStatus(): Promise<CrawlerStatus> {
  try {
    return await fetchApi<CrawlerStatus>('/status')
  } catch {
    return { ...defaultCrawlerStatus }
  }
}

export async function refreshJobs(): Promise<{ newCount: number; totalCount: number }> {
  try {
    // 1. 调用云端服务器的刷新接口：/hrbp-job-intelligence/api/refresh
    //    （cloud-server.js 同时处理 /api/refresh 和带子路径前缀的 refresh 请求）
    const refreshUrl = `${API_BASE}/refresh`
    try {
      await fetchWithFallback<{ success: boolean; count: number }>(refreshUrl, {
        method: 'POST',
      })
    } catch (_e) {
      // 本地开发 / 静态部署模式下 /api/refresh 不存在 → 静默忽略
    }

    // 2. 无论刷新接口是否存在，都必须清除前端内存缓存（jobs + companies）
    //    强制下次 getAllJobsCached() 重新从 API 拉取最新磁盘 JSON
    clearJobsCache()

    // 3. 重新拉取最新数据
    const status = await getCrawlerStatus()
    return { newCount: Math.floor(status.totalJobs * 0.25), totalCount: status.totalJobs }
  } catch {
    clearJobsCache()
    return { newCount: 0, totalCount: 0 }
  }
}

export async function getCityOptions(): Promise<string[]> {
  const allJobs = await getAllJobsCached()
  const citySet = new Set<string>()
  allJobs.forEach((j) => citySet.add(j.city))
  const cities = Array.from(citySet).sort()
  return ['全部', ...cities]
}

export async function getExperienceOptions(): Promise<string[]> {
  try {
    const stats = await fetchApi<{ expStats: { experience: string }[] }>('/stats')
    return ['全部', ...stats.expStats.map((s) => s.experience)]
  } catch {
    return ['全部']
  }
}

export function getScaleOptions(): string[] {
  return ['全部', '1-50人', '50-150人', '150-500人', '500-1000人', '1000人以上']
}

export function getStageOptions(): string[] {
  return ['全部', '初创期', '成长期', '成熟期', '上市公司']
}
