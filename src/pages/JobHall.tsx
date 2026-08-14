import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Inbox, RefreshCw, TrendingUp, MapPin, Building2 } from 'lucide-react'
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

const PAGE_SIZE = 20
const MAX_LIMIT = 1200

export default function JobHall() {
  const filters = useStore((s) => s.filters)
  const refreshKey = useStore((s) => s.refreshKey)
  const triggerRefresh = useStore((s) => s.triggerRefresh)
  const [sort, setSort] = useState<SortKey>('value')
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
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
    setDisplayCount(PAGE_SIZE)
  }, [filters, sort, refreshKey])

  const displayJobs = jobs.slice(0, displayCount)
  const hasMore = displayCount < jobs.length

  const handleLoadMore = () => {
    setDisplayCount((c) => Math.min(c + PAGE_SIZE, jobs.length))
  }

  const handleRefresh = () => {
    triggerRefresh()
  }

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
                  <JobCard job={job} rank={sort === 'value' ? i : undefined} />
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="rounded-full border border-ink-600/60 bg-ink-800/40 px-6 py-2 font-mono text-xs text-muted ring-1 ring-ink-700/30 transition hover:border-gold/40 hover:text-gold hover:ring-gold/20"
                >
                  加载更多（{jobs.length - displayCount}）
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
