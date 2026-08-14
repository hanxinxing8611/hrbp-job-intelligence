// 模拟爬虫数据集类型定义

export type CrawlerSource =
  | 'BOSS直聘'
  | '智联招聘'
  | '猎聘'
  | '前程无忧'
  | '拉勾招聘'

export interface SalaryBreakdown {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface Job {
  jobId: string
  title: string
  companyId: string
  city: string
  district: string
  experience: string
  education: string
  salaryRange: string
  salaryMin: number
  salaryMax: number
  tags: string[]
  source: CrawlerSource
  sourceUrl?: string
  postedAt: string
  crawledAt?: string
  heat: number
  growth: number
  valueScore?: number
  responsibilities: string[]
  requirements: string[]
  benefits: string[]
  salaryBreakdown: SalaryBreakdown
}

export interface Company {
  companyId: string
  name: string
  industry: string
  scale: string
  stage: string
  logoColor: string
  logoInitial: string
  description: string
  founded: number
  headquarters: string
}

export interface Atmosphere {
  companyId: string
  cultureOpenness: number
  overtimeIntensity: number
  promotionSpace: number
  teamStability: number
  leadership: number
}

export interface TrendPoint {
  companyId: string
  year: string
  revenue: number
  headcount: number
  openings: number
}

export interface CompanyComparison {
  companyId: string
  metric: string
  value: number
  industryAvg: number
}

export interface ScoreCard {
  companyId: string
  atmosphereScore: number
  competitivenessScore: number
  potentialScore: number
  overall: number
  grade: string
  strengths: string[]
  weaknesses: string[]
}

export interface CrawlerStatus {
  platforms: number
  todayNew: number
  lastCrawl: string
  totalJobs: number
}

export type RadarMetric = {
  label: string
  value: number
  key: keyof Omit<Atmosphere, 'companyId'>
}
