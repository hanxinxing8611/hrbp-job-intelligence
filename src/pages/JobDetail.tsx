import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Bookmark,
  ExternalLink,
  Building2,
  ChevronRight,
  CheckCircle2,
  Flame,
  TrendingUp,
  Lightbulb,
  BarChart3,
  Sparkles,
  History,
} from 'lucide-react'
import {
  getCompanyById,
  getJobById,
  getJobsByCompany,
  getSimilarJobs,
  getSalaryStats,
  getJobById as findJob,
} from '@/data/dataApi'
import { useStore } from '@/store/useStore'
import type { Job } from '@/data/types'
import CompanyLogo from '@/components/CompanyLogo'
import SalaryBreakdownChart from '@/components/SalaryBreakdownChart'

const interviewTips = [
  '准备2-3个业务端HRBP的实战案例，重点描述你如何诊断业务痛点并给出HR解决方案',
  '熟悉该公司的业务模式与行业痛点，思考HR如何支撑业务增长',
  '准备组织诊断、人才盘点、绩效优化的方法论框架，能清晰表达你的HR工具箱',
  '了解数据驱动HR的最新趋势，准备1-2个人效分析的数据案例',
  '思考HRBP如何平衡业务诉求与员工体验，准备你的价值观表达',
]

export default function JobDetail() {
  const { jobId } = useParams()
  const [job, setJob] = useState<Job | undefined>(undefined)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([])
  const [similarJobs, setSimilarJobs] = useState<Job[]>([])
  const [salaryStats, setSalaryStats] = useState({ avg: 0, median: 0, min: 0, max: 0, p25: 0, p75: 0 })
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isFavorite = useStore((s) => (jobId ? s.favorites.includes(jobId) : false))
  const addRecentView = useStore((s) => s.addRecentView)
  const recentViewIds = useStore((s) => s.recentViews)

  useEffect(() => {
    if (jobId) addRecentView(jobId)
  }, [jobId, addRecentView])

  useEffect(() => {
    if (!jobId) return
    let cancelled = false
    setLoading(true)
    getJobById(jobId)
      .then((loadedJob) => {
        if (cancelled) return
        setJob(loadedJob)
        if (!loadedJob) return
        Promise.all([
          getJobsByCompany(loadedJob.companyId),
          getSimilarJobs(jobId, 4),
          getSalaryStats(),
        ]).then(([companyJobs, similar, stats]) => {
          if (cancelled) return
          setRelatedJobs(companyJobs.filter((j) => j.jobId !== loadedJob.jobId).slice(0, 3))
          setSimilarJobs(similar)
          setSalaryStats(stats)
        })
        Promise.all(recentViewIds.map((id) => findJob(id))).then((jobs) => {
          if (cancelled) return
          setRecentJobs(jobs.filter((j): j is Job => !!j && j.jobId !== jobId).slice(0, 4))
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [jobId, recentViewIds])

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="font-serif text-muted">加载中...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="font-serif text-muted">未找到该岗位</p>
        <Link to="/" className="mt-4 text-gold hover:underline">
          返回职位大厅
        </Link>
      </div>
    )
  }

  const company = getCompanyById(job.companyId)
  const responsibilities = Array.isArray(job.responsibilities)
    ? job.responsibilities
    : job.description
      ? job.description.split('\n').filter((line) => line.trim().length > 0)
      : []
  const requirements = Array.isArray(job.requirements) ? job.requirements : []

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-8 sm:py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted transition hover:text-gold sm:mb-5"
      >
        <ArrowLeft size={13} />
        返回职位大厅
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        {/* 主内容 */}
        <div>
          {/* 岗位头部 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:p-6"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <CompanyLogo companyId={job.companyId} size={48} />
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-lg font-bold text-paper sm:text-2xl">
                  {job.title}
                </h1>
                <Link
                  to={`/company/${company.companyId}`}
                  className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted transition hover:text-gold sm:text-[13px]"
                >
                  {company.name}
                  <ChevronRight size={12} />
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
                  <span className="flex items-center gap-1.5 text-[11px] text-paper/80 sm:text-[12px]">
                    <MapPin size={12} className="text-muted sm:size-[13px]" />
                    {job.city}·{job.district}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-paper/80 sm:text-[12px]">
                    <Briefcase size={12} className="text-muted sm:size-[13px]" />
                    {job.experience}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-paper/80 sm:text-[12px]">
                    <GraduationCap size={12} className="text-muted sm:size-[13px]" />
                    {job.education}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-paper/80 sm:text-[12px]">
                    <Clock size={12} className="text-muted sm:size-[13px]" />
                    {job.source}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-bold text-gold sm:text-2xl">
                  {job.salaryRange}
                </p>
                <button
                  onClick={() => toggleFavorite(job.jobId)}
                  className={`mt-2 inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[10px] transition sm:px-3 sm:text-[11px] ${
                    isFavorite
                      ? 'border-gold/40 bg-gold/10 text-gold'
                      : 'border-ink-600 text-muted hover:text-paper'
                  }`}
                >
                  <Bookmark size={12} fill={isFavorite ? 'currentColor' : 'none'} />
                  {isFavorite ? '已收藏' : '收藏'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {(job.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[10px] text-gold/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* 薪资解析 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 sm:mt-5"
          >
            <SalaryBreakdownChart
              breakdown={job.salaryBreakdown}
              rangeMin={job.salaryMin}
              rangeMax={job.salaryMax}
            />
          </motion.div>

          {/* 薪资市场对比 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="mt-4 rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:mt-5 sm:p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 font-serif text-base font-bold text-paper">
              <BarChart3 size={15} className="text-gold" />
              薪资市场对比
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="rounded bg-ink-700/30 p-3 text-center">
                <p className="font-mono text-lg font-bold text-paper sm:text-xl">
                  {salaryStats.avg}K
                </p>
                <p className="mt-1 text-[10px] text-muted">市场均价</p>
              </div>
              <div className="rounded bg-ink-700/30 p-3 text-center">
                <p className="font-mono text-lg font-bold text-teal sm:text-xl">
                  {salaryStats.median}K
                </p>
                <p className="mt-1 text-[10px] text-muted">中位数</p>
              </div>
              <div className="rounded bg-ink-700/30 p-3 text-center">
                <p className="font-mono text-lg font-bold text-muted sm:text-xl">
                  {salaryStats.p25}K
                </p>
                <p className="mt-1 text-[10px] text-muted">25分位</p>
              </div>
              <div className="rounded bg-ink-700/30 p-3 text-center">
                <p className="font-mono text-lg font-bold text-gold sm:text-xl">
                  {salaryStats.p75}K
                </p>
                <p className="mt-1 text-[10px] text-muted">75分位</p>
              </div>
            </div>
            <div className="mt-3 rounded bg-teal/5 p-3 text-[11px] leading-relaxed text-paper/70">
              {job.salaryMin >= salaryStats.p75
                ? '该岗位薪资处于市场前25%，薪酬竞争力强。'
                : job.salaryMin >= salaryStats.median
                  ? '该岗位薪资高于市场中位数，处于中等偏上水平。'
                  : '该岗位薪资低于市场中位数，建议关注发展空间与福利待遇。'}
              <span className="ml-1 text-muted">
                （基于{job.experience}经验 level 的{salaryStats.max - salaryStats.min}K区间统计）
              </span>
            </div>
          </motion.div>

          {/* 岗位职责 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-4 rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:mt-5 sm:p-6"
          >
            <h3 className="mb-3 font-serif text-base font-bold text-paper sm:mb-4">
              岗位职责
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {responsibilities.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-paper/80 sm:text-[13px]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 任职要求 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-4 rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:mt-5 sm:p-6"
          >
            <h3 className="mb-3 font-serif text-base font-bold text-paper sm:mb-4">
              任职要求
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {requirements.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-paper/80 sm:text-[13px]">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-teal sm:size-[14px]" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 福利标签 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-4 rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:mt-5 sm:p-6"
          >
            <h3 className="mb-3 font-serif text-base font-bold text-paper">福利待遇</h3>
            <div className="flex flex-wrap gap-2">
              {(job.benefits || []).map((b) => (
                <span
                  key={b}
                  className="rounded bg-ink-700/50 px-2.5 py-1 text-[11px] text-paper/80"
                >
                  {b}
                </span>
              ))}
            </div>
          </motion.div>

          {/* 面试贴士 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-4 rounded border border-gold/20 bg-gold/5 p-4 sm:mt-5 sm:p-6"
          >
            <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-gold">
              <Lightbulb size={15} />
              面试准备贴士
            </h3>
            <ul className="space-y-2">
              {interviewTips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-paper/80 sm:text-[13px]">
                  <span className="font-mono text-gold/60">{String(i + 1).padStart(2, '0')}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 相似职位推荐 */}
          {similarJobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="mt-4 rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:mt-5 sm:p-6"
            >
              <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-paper">
                <Sparkles size={15} className="text-teal" />
                相似职位推荐
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {similarJobs.map((sj) => {
                  const sc = getCompanyById(sj.companyId)
                  return (
                    <Link
                      key={sj.jobId}
                      to={`/job/${sj.jobId}`}
                      className="flex items-center gap-3 rounded bg-ink-700/30 px-3 py-2.5 transition hover:bg-ink-700/50"
                    >
                      <CompanyLogo companyId={sj.companyId} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] text-paper/90">{sj.title}</p>
                        <p className="mt-0.5 truncate text-[10px] text-muted">
                          {sc.name} · {sj.city}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-gold">
                        {sj.salaryRange}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* 最近浏览 */}
          {recentJobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-4 rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:mt-5 sm:p-6"
            >
              <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-paper">
                <History size={15} className="text-muted" />
                最近浏览
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {recentJobs.map((rj) => {
                  if (!rj) return null
                  const rc = getCompanyById(rj.companyId)
                  return (
                    <Link
                      key={rj.jobId}
                      to={`/job/${rj.jobId}`}
                      className="flex items-center gap-3 rounded bg-ink-700/30 px-3 py-2.5 transition hover:bg-ink-700/50"
                    >
                      <CompanyLogo companyId={rj.companyId} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] text-paper/90">{rj.title}</p>
                        <p className="mt-0.5 truncate text-[10px] text-muted">
                          {rc.name} · {rj.city}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-gold">
                        {rj.salaryRange}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* 右侧公司快照 - 移除sticky，正常滚动 */}
        <div className="space-y-4 sm:space-y-5">
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:p-5"
          >
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-gold" />
              <h4 className="font-serif text-sm font-bold text-paper">公司快照</h4>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <CompanyLogo companyId={company.companyId} size={44} />
              <div>
                <p className="font-serif text-sm font-bold text-paper">{company.name}</p>
                <p className="mt-0.5 text-[11px] text-muted">{company.industry}</p>
              </div>
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-paper/70">
              {company.description}
            </p>

            <dl className="mt-4 space-y-2 border-t border-ink-700/50 pt-4 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-muted">规模</dt>
                <dd className="text-paper/80">{company.scale}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">融资</dt>
                <dd className="text-gold">{company.stage}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">成立</dt>
                <dd className="text-paper/80">{company.founded}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">总部</dt>
                <dd className="text-paper/80">{company.headquarters}</dd>
              </div>
            </dl>

            <Link
              to={`/company/${company.companyId}`}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded bg-gold/15 py-2 font-mono text-[11px] tracking-wider text-gold ring-1 ring-gold/30 transition hover:bg-gold/25"
            >
              深度公司分析
              <ChevronRight size={12} />
            </Link>
          </motion.div>

          {/* 同公司其他岗位 */}
          {relatedJobs.length > 0 && (
            <div className="rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:p-5">
              <h4 className="mb-3 font-serif text-sm font-bold text-paper">
                同公司岗位
              </h4>
              <div className="space-y-2">
                {relatedJobs.map((rj) => (
                  <Link
                    key={rj.jobId}
                    to={`/job/${rj.jobId}`}
                    className="block rounded bg-ink-700/30 px-3 py-2 transition hover:bg-ink-700/50"
                  >
                    <p className="truncate text-[12px] text-paper/80">{rj.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-gold">{rj.salaryRange}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 热度指标 */}
          <div className="rounded border border-ink-700/60 bg-ink-800/40 p-4 sm:p-5">
            <h4 className="mb-3 font-serif text-sm font-bold text-paper">岗位热度</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-muted">
                  <Flame size={12} className="text-crimson/70" />
                  热度值
                </span>
                <span className="font-mono text-sm font-bold text-gold">{job.heat}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-muted">
                  <TrendingUp size={12} className="text-teal" />
                  增长率
                </span>
                <span className="font-mono text-sm font-bold text-teal">+{job.growth}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold to-teal"
                  style={{ width: `${Math.min(job.heat / 12, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted">
                {job.heat > 800
                  ? '热度极高，竞争激烈，建议尽快投递'
                  : job.heat > 500
                    ? '热度较高，关注度高'
                    : '热度适中，可从容准备'}
              </p>
            </div>
          </div>

          <a
            href={`https://www.zhipin.com/job_detail/?query=${encodeURIComponent(job.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded border border-gold/40 bg-gold py-2.5 font-mono text-[11px] font-bold tracking-wider text-ink-950 transition hover:bg-gold-soft"
          >
            <ExternalLink size={13} />
            前往 {job.source} 投递
          </a>
        </div>
      </div>
    </div>
  )
}
