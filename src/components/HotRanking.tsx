import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, TrendingUp, Coins } from 'lucide-react'
import { getCompanyById, getHotJobs } from '@/data/dataApi'
import { useStore } from '@/store/useStore'
import type { Job } from '@/data/types'
import CompanyLogo from './CompanyLogo'

const metricConfig = {
  heat: { label: '热度榜', icon: Flame, color: 'text-crimson' },
  salary: { label: '薪资榜', icon: Coins, color: 'text-gold' },
  growth: { label: '增长榜', icon: TrendingUp, color: 'text-teal' },
} as const

export default function HotRanking() {
  const metric = useStore((s) => s.hotMetric)
  const setMetric = useStore((s) => s.setHotMetric)
  const refreshKey = useStore((s) => s.refreshKey)
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    getHotJobs(metric).then(setJobs).catch(() => setJobs([]))
  }, [metric, refreshKey])

  return (
    <section id="hot" className="border-b border-ink-700/60 px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-paper sm:text-xl">
              HRBP 热门岗位
            </h2>
            <p className="mt-0.5 hidden font-mono text-[11px] tracking-wider text-muted sm:block">
              基于多平台热度算法实时排序 · 每小时刷新
            </p>
          </div>
          <div className="flex gap-1 rounded bg-ink-800/60 p-1">
            {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map(
              (key) => {
                const cfg = metricConfig[key]
                const Icon = cfg.icon
                const active = metric === key
                return (
                  <button
                    key={key}
                    onClick={() => setMetric(key)}
                    className={`flex items-center gap-1 rounded px-2 py-1.5 font-mono text-[10px] tracking-wider transition sm:gap-1.5 sm:px-3 sm:text-[11px] ${
                      active
                        ? 'bg-gold/15 text-gold ring-1 ring-gold/30'
                        : 'text-muted hover:text-paper'
                    }`}
                  >
                    <Icon size={11} className="sm:size-[12px]" />
                    <span className="hidden sm:inline">{cfg.label}</span>
                    <span className="sm:hidden">{cfg.label.slice(0, 2)}</span>
                  </button>
                )
              },
            )}
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-2 sm:gap-3 sm:px-2">
          {jobs.slice(0, 5).map((job, i) => {
            const company = getCompanyById(job.companyId)
            return (
              <Link
                key={job.jobId}
                to={`/job/${job.jobId}`}
                className="group relative w-[160px] shrink-0 overflow-hidden rounded border border-ink-700/60 bg-ink-800/50 p-2.5 transition hover:border-gold/40 hover:bg-ink-700/40 sm:w-[220px] sm:p-4"
              >
                <div className="absolute right-2 top-1 font-serif text-2xl font-black text-ink-600/50 sm:right-3 sm:top-2 sm:text-4xl">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="relative flex items-start gap-2">
                  <CompanyLogo companyId={job.companyId} size={28} />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 break-all font-serif text-[12px] font-bold leading-tight text-paper group-hover:text-gold sm:text-sm">
                      {job.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-[10px] text-muted sm:text-[11px]">
                  {job.companyName || company.name}
                </p>
                <div className="mt-1.5 flex items-end justify-between gap-1">
                  <span className="truncate font-mono text-[11px] font-bold text-gold sm:text-sm">
                    {job.salaryRange}
                  </span>
                  <span className={`flex shrink-0 items-center gap-0.5 font-mono text-[10px] ${metricConfig[metric].color}`}>
                    {metric === 'heat' && <Flame size={10} />}
                    {metric === 'salary' && <Coins size={10} />}
                    {metric === 'growth' && <TrendingUp size={10} />}
                    {metric === 'heat'
                      ? job.heat
                      : metric === 'salary'
                        ? `${job.salaryMax}K`
                        : `+${job.growth}%`}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
