import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Inbox, RefreshCw } from 'lucide-react'
import { getJobs, type Job } from '@/data/dataApi'
import { useStore } from '@/store/useStore'
import CrawlerBar from '@/components/CrawlerBar'
import FilterSidebar from '@/components/FilterSidebar'
import JobCard from '@/components/JobCard'

type SortKey = 'value' | 'heat' | 'salary' | 'time' | 'growth'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'value', label: '性价比' },
  { key: 'heat', label: '热度优先' },
  { key: 'salary', label: '薪资优先' },
  { key: 'time', label: '最新发布' },
  { key: 'growth', label: '增长优先' },
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

  return (
    <>
      <CrawlerBar />
      <FilterSidebar />

      <section className="mx-auto max-w-[1000px] px-3 py-3 sm:px-6 sm:py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-sm font-bold text-paper sm:text-base">
            推荐岗位
            <span className="ml-2 font-mono text-[10px] text-muted">
              {jobs.length} 条
            </span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 rounded bg-ink-800/60 px-2 py-1 font-mono text-[10px] text-muted transition hover:text-gold"
            >
              <RefreshCw size={11} />
            </button>
            <div className="flex gap-0.5 rounded bg-ink-800/60 p-0.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  className={`rounded px-2 py-1 font-mono text-[10px] transition ${
                    sort === opt.key
                      ? 'bg-gold/15 text-gold'
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
          <div className="grid place-items-center py-12 text-center">
            <Inbox size={28} className="text-ink-600" />
            <p className="mt-2 font-serif text-xs text-muted">
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
                  <JobCard job={job} />
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="rounded-full border border-ink-600 bg-ink-800/60 px-6 py-2 font-mono text-xs text-muted transition hover:border-gold/50 hover:text-gold"
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
