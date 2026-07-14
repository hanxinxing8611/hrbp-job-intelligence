import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Inbox, RefreshCw } from 'lucide-react'
import { getJobs } from '@/data/dataApi'
import { useStore } from '@/store/useStore'
import CrawlerBar from '@/components/CrawlerBar'
import HotRanking from '@/components/HotRanking'
import FilterSidebar from '@/components/FilterSidebar'
import JobCard from '@/components/JobCard'

type SortKey = 'heat' | 'salary' | 'time' | 'growth'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'heat', label: '热度优先' },
  { key: 'salary', label: '薪资优先' },
  { key: 'time', label: '最新发布' },
  { key: 'growth', label: '增长优先' },
]

const PAGE_SIZE = 20

export default function JobHall() {
  const filters = useStore((s) => s.filters)
  const refreshKey = useStore((s) => s.refreshKey)
  const triggerRefresh = useStore((s) => s.triggerRefresh)
  const [sort, setSort] = useState<SortKey>('heat')
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  const jobs = useMemo(() => {
    const list = getJobs(filters)
    const sorted = [...list]
    switch (sort) {
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
    return sorted
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

  return (
    <>
      <CrawlerBar />
      <HotRanking />

      <div className="mx-auto flex max-w-[1400px]">
        <FilterSidebar />

        <section className="min-w-0 flex-1 px-3 py-3 sm:px-6 sm:py-5">
          <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-paper sm:text-lg">
                职位情报流
              </h2>
              <p className="mt-0.5 font-mono text-[10px] text-muted sm:text-[11px]">
                共 {jobs.length} 条匹配岗位 · 已聚合 5 大平台
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 rounded bg-ink-800/60 px-2.5 py-1.5 font-mono text-[10px] text-muted transition hover:text-gold"
              >
                <RefreshCw size={12} />
                <span className="hidden sm:inline">刷新</span>
              </button>
              <div className="flex gap-1 rounded bg-ink-800/60 p-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`rounded px-2 py-1.5 font-mono text-[10px] tracking-wider transition sm:px-2.5 sm:text-[10px] ${
                      sort === opt.key
                        ? 'bg-gold/15 text-gold'
                        : 'text-muted hover:text-paper'
                    }`}
                  >
                    {opt.label.slice(0, 2)}
                    <span className="hidden sm:inline">{opt.label.slice(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="grid place-items-center py-16 text-center sm:py-24">
              <Inbox size={32} className="text-ink-600 sm:size-9" />
              <p className="mt-3 font-serif text-sm text-muted">
                没有匹配的岗位，试试调整筛选条件
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded border border-ink-700/50">
                {displayJobs.map((job, i) => (
                  <motion.div
                    key={job.jobId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    className="rounded-full border border-ink-600 bg-ink-800/60 px-8 py-2.5 font-mono text-sm text-muted transition hover:border-gold/50 hover:text-gold"
                  >
                    加载更多（还有 {jobs.length - displayCount} 条）
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}
