import type {
  Company,
  CompanyComparison,
  CrawlerStatus,
  Job,
  RadarMetric,
  ScoreCard,
  TrendPoint,
} from './types'

const API_BASE = '/api'

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  return response.json()
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
  salaryMax: 80,
  scale: '全部',
  stage: '全部',
  keyword: '',
}

export async function getJobs(filters: JobFilters): Promise<{ data: Job[]; total: number }> {
  const params = new URLSearchParams()
  params.set('city', filters.city)
  params.set('experience', filters.experience)
  params.set('salaryMin', filters.salaryMin.toString())
  params.set('salaryMax', filters.salaryMax.toString())
  params.set('scale', filters.scale)
  params.set('stage', filters.stage)
  if (filters.keyword) params.set('keyword', filters.keyword)
  
  return fetchApi<{ data: Job[]; total: number }>(`/jobs?${params.toString()}`)
}

export async function getJobById(jobId: string): Promise<Job | undefined> {
  try {
    return fetchApi<Job>(`/jobs/${jobId}`)
  } catch {
    return undefined
  }
}

export async function getHotJobs(metric: 'heat' | 'salary' | 'growth'): Promise<Job[]> {
  return fetchApi<Job[]>(`/hot-jobs?metric=${metric}`)
}

export async function getJobsByCompany(companyId: string): Promise<Job[]> {
  try {
    const company = await fetchApi<{ jobs: Job[] }>(`/companies/${companyId}`)
    return company.jobs || []
  } catch {
    return []
  }
}

export async function getSimilarJobs(jobId: string, limit: number = 5): Promise<Job[]> {
  const target = await getJobById(jobId)
  if (!target) return []

  const allJobs = await getJobs(defaultFilters)
  
  return allJobs.data
    .filter((j) => j.jobId !== jobId)
    .map((j) => {
      let score = 0
      if (j.companyId === target.companyId) score += 30
      if (j.city === target.city) score += 20
      if (j.experience === target.experience) score += 15
      if (j.salaryMin <= target.salaryMax && j.salaryMax >= target.salaryMin) score += 20
      const sharedTags = j.tags.filter((t) => target.tags.includes(t)).length
      score += sharedTags * 5
      score += Math.min(j.heat / 100, 10)
      return { job: j, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.job)
}

export async function getSalaryStats(experience?: string): Promise<{
  avg: number
  median: number
  min: number
  max: number
  p25: number
  p75: number
}> {
  const allJobs = await getJobs(defaultFilters)
  const filtered = experience
    ? allJobs.data.filter((j) => j.experience === experience)
    : allJobs.data
  const salaries = filtered.map((j) => j.salaryMin).sort((a, b) => a - b)
  if (salaries.length === 0)
    return { avg: 0, median: 0, min: 0, max: 0, p25: 0, p75: 0 }
  const mid = Math.floor(salaries.length / 2)
  return {
    min: salaries[0],
    max: salaries[salaries.length - 1],
    median: salaries.length % 2 ? salaries[mid] : (salaries[mid - 1] + salaries[mid]) / 2,
    p25: salaries[Math.floor(salaries.length * 0.25)],
    p75: salaries[Math.floor(salaries.length * 0.75)],
    avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
  }
}

export async function getCompanyById(companyId: string): Promise<Company> {
  try {
    return fetchApi<Company>(`/companies/${companyId}`)
  } catch {
    return {
      companyId,
      name: '未知公司',
      industry: '未知',
      scale: '未知',
      stage: '未知',
      logoColor: '#6366f1',
      logoInitial: '?',
      description: '',
      founded: 2000,
      headquarters: '未知',
    }
  }
}

export async function getAllCompanies(): Promise<Company[]> {
  return fetchApi<Company[]>('/companies')
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
  
  return years.map(year => {
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
  return fetchApi<CrawlerStatus>('/status')
}

export async function refreshJobs(): Promise<{ newCount: number; totalCount: number }> {
  try {
    const result = await fetchApi<{ count: number }>('/crawl', { method: 'POST' })
    const status = await getCrawlerStatus()
    return { newCount: result.count, totalCount: status.totalJobs }
  } catch {
    return { newCount: 0, totalCount: 0 }
  }
}

export async function getCityOptions(): Promise<string[]> {
  const stats = await fetchApi<{ cityStats: { city: string }[] }>('/stats')
  return ['全部', ...stats.cityStats.map(s => s.city)]
}

export async function getExperienceOptions(): Promise<string[]> {
  const stats = await fetchApi<{ expStats: { experience: string }[] }>('/stats')
  return ['全部', ...stats.expStats.map(s => s.experience)]
}

export function getScaleOptions(): string[] {
  return ['全部', '1-50人', '50-150人', '150-500人', '500-1000人', '1000人以上']
}

export function getStageOptions(): string[] {
  return ['全部', '初创期', '成长期', '成熟期', '上市公司']
}
