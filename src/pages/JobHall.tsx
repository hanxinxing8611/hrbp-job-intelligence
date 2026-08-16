import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Inbox, RefreshCw, TrendingUp, MapPin, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getJobs, type Job } from '@/data/dataApi'
import { useStore } from '@/store/useStore'
import CrawlerBar from '@/components/CrawlerBar'
import FilterSidebar from '@/components/FilterSidebar'
import JobCard from '@/components/JobCard'

type SortKey = 'value' | 'heat' | 'salary' | 'time' | 'growth'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'value', label: '性价比' },
  { key: 'heat', label: '热度' },
  { key: 'salary', label: '薪资' },
  { key: 'time', label: '最新' },
  { key: 'growth', label: '增长' },
]

const PAGE_SIZE = 10
const MAX_LIMIT = 1200

export default function JobHall() {
  const filters = useStore((s) => s.filters)
  const refreshKey = useStore((s) => s.refreshKey)
  const triggerRefresh = useStore((s) => s.triggerRefresh)
  const [sort, setSort] = useState<SortKey>('value')
  const [currentPage, setCurrentPage] = useState(1)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadJobs() {
      setLoading(true)
      try {
        const result = await getJobs(filters, sort, 1, MAX_LIMIT)
        const sorted = [...result.data]
        switch (sort) {
          case 'value':
            sorted.sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0))
            break
          case 'heat':
            sorted.sort((a, b) => b.heat - a.heat)
            break
          case 'salary':
            sorted.sort((a, b) => b.salaryMax - a.salaryMax)
            break
          case 'time':
            sorted.sort((a, b) => b.postedAt.localeCompare(a.postedAt))
            break
          case 'growth':
            sorted.sort((a, b) => b.growth - a.growth)
            break
        }
        setJobs(sorted)
      } catch (e) {
        console.error('Failed to load jobs:', e)
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [filters, sort, refreshKey])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sort, refreshKey])

  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = startIdx + PAGE_SIZE
  const displayJobs = jobs.slice(startIdx, endIdx)

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(clamped)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefresh = () => {
    triggerRefresh()
  }

  // 生成分页页码按钮（最多显示7个，带省略号）
  const pageButtons = useMemo(() => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push('...')
      const start = Math.max(2, safePage - 1)
      const end = Math.min(totalPages - 1, safePage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }, [safePage, totalPages])

  // 洞察摘要
  const insights = useMemo(() => {
    if (jobs.length === 0) return null
    const avgSalary = Math.round(
      jobs.reduce((sum, j) => sum + (j.salaryMin + j.salaryMax) / 2, 0) / jobs.length
    )
    const cityCount = new Set(jobs.map((j) => j.city)).size
    const companyCount = new Set(jobs.map((j) => j.companyName)).size
    const topCity = jobs.reduce((acc, j) => {
      acc[j.city] = (acc[j.city] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topCityName = Object.entries(topCity).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    return { avgSalary, cityCount, companyCount, topCityName }
  }, [jobs])

  return (
    <>
      <CrawlerBar />
      <FilterSidebar />

      <section className="mx-auto max-w-[1000px] px-3 py-3 sm:px-6 sm:py-4">
        {/* 洞察摘要卡片 */}
        {insights && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="glass glow-border card-hover rounded-xl border border-ink-700/40 px-3 py-2.5">
              <div className="flex items-center gap-1 text-muted">
                <TrendingUp size={11} className="text-teal" />
                <span className="font-mono text-[10px] tracking-wider">均价</span>
              </div>
              <p className="mt-1 font-mono text-base font-bold text-gold sm:text-lg">
                {insights.avgSalary}K
              </p>
            </div>
            <div className="glass glow-border card-hover rounded-xl border border-ink-700/40 px-3 py-2.5">
              <div className="flex items-center gap-1 text-muted">
                <MapPin size={11} className="text-gold" />
                <span className="font-mono text-[10px] tracking-wider">热城</span>
              </div>
              <p className="mt-1 truncate font-mono text-base font-bold text-paper sm:text-lg">
                {insights.topCityName}
              </p>
            </div>
            <div className="glass glow-border card-hover rounded-xl border border-ink-700/40 px-3 py-2.5">
              <div className="flex items-center gap-1 text-muted">
                <Building2 size={11} className="text-blue" />
                <span className="font-mono text-[10px] tracking-wider">企业</span>
              </div>
              <p className="mt-1 font-mono text-base font-bold text-paper sm:text-lg">
                {insights.companyCount}
                <span className="ml-0.5 text-[10px] text-muted">家</span>
              </p>
            </div>
          </div>
        )}

        {/* 标题 + 排序栏 */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-baseline gap-2 font-serif text-sm font-bold text-paper sm:text-base">
            <span className={sort === 'value' ? 'gradient-text' : ''}>
              {sort === 'value' ? '高性价比岗位推荐' : '推荐岗位'}
            </span>
            <span className="font-mono text-[10px] text-muted">
              {jobs.length} 条
            </span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 rounded-lg bg-ink-800/50 px-2 py-1 font-mono text-[10px] text-muted ring-1 ring-ink-700/40 transition hover:text-gold hover:ring-gold/30"
            >
              <RefreshCw size={11} />
            </button>
            {/* 排序栏：移动端横向滚动 */}
            <div className="flex gap-0.5 overflow-x-auto rounded-lg bg-ink-800/50 p-0.5 ring-1 ring-ink-700/40 sm:overflow-visible">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[10px] transition ${
                    sort === opt.key
                      ? 'bg-gold/15 text-gold shadow-[0_0_8px_rgba(232,181,71,0.15)]'
                      : 'text-muted hover:text-paper'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-ink-800/40 ring-1 ring-ink-700/40">
              <Inbox size={24} className="text-ink-600" />
            </div>
            <p className="mt-3 font-serif text-xs text-muted">
              没有匹配的岗位，试试调整筛选条件
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {displayJobs.map((job, i) => (
                <motion.div
                  key={job.jobId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.015, 0.2) }}
                >
                  <JobCard job={job} rank={sort === 'value' ? startIdx + i : undefined} />
                </motion.div>
              ))}
            </div>

            {/* 分页器：上一页 / 页码 / 下一页 */}
            {totalPages > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="flex items-center gap-0.5 rounded-lg border border-ink-600/60 bg-ink-800/40 px-3 py-1.5 font-mono text-[11px] text-muted ring-1 ring-ink-700/30 transition hover:border-gold/40 hover:text-gold hover:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-600/60 disabled:hover:text-muted disabled:hover:ring-ink-700/30"
                >
                  <ChevronLeft size={12} />
                  上一页
                </button>

                {pageButtons.map((pb, idx) =>
                  pb === '...' ? (
                    <span
                      key={`dots-${idx}`}
                      className="px-2 py-1.5 font-mono text-[11px] text-muted"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={pb}
                      onClick={() => goToPage(pb)}
                      className={`min-w-[32px] rounded-lg px-2.5 py-1.5 font-mono text-[11px] transition ${
                        pb === safePage
                          ? 'bg-gold/15 text-gold ring-1 ring-gold/40 shadow-[0_0_8px_rgba(232,181,71,0.12)]'
                          : 'border border-ink-600/60 bg-ink-800/40 text-muted ring-1 ring-ink-700/30 hover:border-gold/40 hover:text-gold hover:ring-gold/20'
                      }`}
                    >
                      {pb}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="flex items-center gap-0.5 rounded-lg border border-ink-600/60 bg-ink-800/40 px-3 py-1.5 font-mono text-[11px] text-muted ring-1 ring-ink-700/30 transition hover:border-gold/40 hover:text-gold hover:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-600/60 disabled:hover:text-muted disabled:hover:ring-ink-700/30"
                >
                  下一页
                  <ChevronRight size={12} />
                </button>

                <span className="ml-2 font-mono text-[10px] text-muted">
                  共 {jobs.length} 条 · 第 {safePage}/{totalPages} 页
                </span>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
