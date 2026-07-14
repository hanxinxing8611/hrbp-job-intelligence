import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  Award,
  TrendingUp,
  Swords,
  Sparkles,
  AlertTriangle,
  MapPin,
} from 'lucide-react'
import {
  getCompanyAtmosphere,
  getCompanyById,
  getCompetitors,
  getGrowthTrend,
  getCompanyScoreCard,
  getJobsByCompany,
} from '@/data/dataApi'
import CompanyLogo from '@/components/CompanyLogo'
import RadarChart from '@/components/RadarChart'
import ComparisonBars from '@/components/ComparisonBars'
import TrendLine from '@/components/TrendLine'

type TrendMetric = 'revenue' | 'headcount' | 'openings'

const trendTabs: { key: TrendMetric; label: string }[] = [
  { key: 'revenue', label: '营收增长' },
  { key: 'headcount', label: '人员规模' },
  { key: 'openings', label: '招聘岗位' },
]

function gradeColor(grade: string): string {
  if (grade.startsWith('A+')) return 'text-gold border-gold/40 bg-gold/10'
  if (grade.startsWith('A')) return 'text-teal border-teal/40 bg-teal/10'
  if (grade.startsWith('B+')) return 'text-paper border-ink-500 bg-ink-700/40'
  return 'text-muted border-ink-600 bg-ink-700/30'
}

function ScoreBlock({
  label,
  score,
  icon,
  color,
}: {
  label: string
  score: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="rounded border border-ink-700/60 bg-ink-800/40 p-4 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${color}1a`, color }}>
        {icon}
      </div>
      <div className="font-mono text-3xl font-bold" style={{ color }}>
        {score}
      </div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-700/50">
        <div
          className="bar-grow h-full rounded-full"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function CompanyAnalysis() {
  const { companyId } = useParams()
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('revenue')

  if (!companyId) return null
  const company = getCompanyById(companyId)
  const atmosphere = getCompanyAtmosphere(companyId)
  const competitors = getCompetitors(companyId)
  const trend = getGrowthTrend(companyId)
  const scoreCard = getCompanyScoreCard(companyId)
  const companyJobs = getJobsByCompany(companyId)

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-8 sm:py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted transition hover:text-gold sm:mb-5"
      >
        <ArrowLeft size={13} />
        返回职位大厅
      </Link>

      {/* 公司头部 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded border border-ink-700/60 bg-gradient-to-br from-ink-800/60 to-ink-900/40 p-4 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <CompanyLogo companyId={company.companyId} size={48} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-lg font-bold text-paper sm:text-2xl">{company.name}</h1>
                <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${gradeColor(scoreCard.grade)}`}>
                  {scoreCard.grade}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-muted sm:text-[13px]">{company.industry}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted sm:gap-4 sm:text-[11px]">
                <span className="flex items-center gap-1">
                  <Building2 size={11} /> {company.scale}
                </span>
                <span>{company.stage}</span>
                <span>{company.founded}年</span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {company.headquarters}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-paper/70 sm:text-[12px]">
                {company.description}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-[9px] tracking-wider text-muted sm:text-[10px]">综合评分</div>
            <div className="font-serif text-3xl font-black text-gold sm:text-4xl">{scoreCard.overall}</div>
            <div className="mt-1 font-mono text-[9px] text-muted sm:text-[10px]">/ 100</div>
          </div>
        </div>
      </motion.div>

      {/* 三维评分 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-4"
      >
        <ScoreBlock
          label="工作氛围"
          score={scoreCard.atmosphereScore}
          icon={<Sparkles size={16} />}
          color="#4A9D8C"
        />
        <ScoreBlock
          label="竞争力"
          score={scoreCard.competitivenessScore}
          icon={<Swords size={16} />}
          color="#E8B547"
        />
        <ScoreBlock
          label="发展潜力"
          score={scoreCard.potentialScore}
          icon={<TrendingUp size={16} />}
          color="#5B8DEF"
        />
      </motion.div>

      {/* 优劣势 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4"
      >
        <div className="rounded border border-teal/20 bg-teal/5 p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 font-serif text-sm font-bold text-teal">
            <Award size={14} /> 核心优势
          </h3>
          <ul className="space-y-2">
            {scoreCard.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-[12px] text-paper/80">
                <span className="text-teal">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-crimson/20 bg-crimson/5 p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 font-serif text-sm font-bold text-crimson">
            <AlertTriangle size={14} /> 风险提示
          </h3>
          <ul className="space-y-2">
            {scoreCard.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-2 text-[12px] text-paper/80">
                <span className="text-crimson">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* 工作氛围雷达 + 竞争力对标 */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:p-5"
        >
          <h3 className="mb-1 font-serif text-base font-bold text-paper">
            工作氛围雷达
          </h3>
          <p className="mb-2 font-mono text-[10px] text-muted">
            五维客观评估 · 数据来自多平台在职评价聚合
          </p>
          <div className="flex justify-center pt-2">
            <RadarChart metrics={atmosphere} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:p-5"
        >
          <h3 className="mb-1 font-serif text-base font-bold text-paper">
            市场竞争力对标
          </h3>
          <p className="mb-4 font-mono text-[10px] text-muted">
            与行业均值横向对比 · 高于行业为金色
          </p>
          <ComparisonBars data={competitors} companyName={company.name} />
        </motion.div>
      </div>

      {/* 发展潜力趋势 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-4 rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:mt-6 sm:p-5"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-paper">
              发展潜力趋势
            </h3>
            <p className="mt-0.5 font-mono text-[10px] text-muted">
              近 4 年核心指标增长曲线
            </p>
          </div>
          <div className="flex gap-1 rounded bg-ink-800/60 p-1">
            {trendTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTrendMetric(tab.key)}
                className={`rounded px-2 py-1 font-mono text-[10px] tracking-wider transition sm:px-2.5 ${
                  trendMetric === tab.key
                    ? 'bg-gold/15 text-gold'
                    : 'text-muted hover:text-paper'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <TrendLine data={trend} metric={trendMetric} />
      </motion.div>

      {/* 该公司招聘的岗位 */}
      {companyJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-4 rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:mt-6 sm:p-5"
        >
          <h3 className="mb-3 font-serif text-base font-bold text-paper sm:mb-4">
            {company.name} 在招岗位
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            {companyJobs.map((job) => (
              <Link
                key={job.jobId}
                to={`/job/${job.jobId}`}
                className="flex items-center justify-between rounded bg-ink-700/30 px-3 py-3 transition hover:bg-ink-700/50 sm:px-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-paper/90 sm:text-[13px]">{job.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    {job.city}·{job.experience}
                  </p>
                </div>
                <span className="ml-2 shrink-0 font-mono text-[12px] font-bold text-gold sm:text-[13px]">
                  {job.salaryRange}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
