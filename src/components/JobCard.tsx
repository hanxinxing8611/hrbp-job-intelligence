import { Link } from 'react-router-dom'
import { Bookmark, Zap } from 'lucide-react'
import type { Job } from '@/data/types'
import { getCompanyById } from '@/data/dataApi'
import { useStore } from '@/store/useStore'

function timeAgo(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const hours = Math.floor((now.getTime() - date.getTime()) / 3600000)
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}h前`
  return `${Math.floor(hours / 24)}d前`
}

function getJobLevel(avgSalary: number): { label: string; cls: string } {
  if (avgSalary >= 80) return { label: '总监', cls: 'text-crimson bg-crimson/10' }
  if (avgSalary >= 50) return { label: '资深', cls: 'text-teal bg-teal/10' }
  if (avgSalary >= 35) return { label: '高级', cls: 'text-blue bg-blue/10' }
  if (avgSalary >= 25) return { label: '中级', cls: 'text-gold bg-gold/10' }
  return { label: '初级', cls: 'text-muted bg-ink-600/40' }
}

export default function JobCard({ job }: { job: Job; index?: number }) {
  const company = getCompanyById(job.companyId)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isFavorite = useStore((s) => s.favorites.includes(job.jobId))
  const avgSalary = (job.salaryMin + job.salaryMax) / 2
  const level = getJobLevel(avgSalary)

  return (
    <Link
      to={`/job/${job.jobId}`}
      className="group block rounded-lg border border-ink-700/50 bg-ink-800/40 px-3 py-3 transition hover:border-gold/30 hover:bg-ink-700/30 sm:px-4"
    >
      {/* 第一行：标题 + 等级 + 薪资 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-serif text-sm font-bold text-paper group-hover:text-gold sm:text-[15px]">
              {job.title}
            </h3>
            <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] ${level.cls}`}>
              {level.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">
            {job.companyName || company.name} · {job.city}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-bold text-gold sm:text-[15px]">
            {job.salaryRange}
          </p>
        </div>
      </div>

      {/* 第二行：经验 + 性价比 + 时间 + 收藏 */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span>{job.experience}</span>
          <span className="text-ink-600">·</span>
          <span className="font-mono">{timeAgo(job.postedAt)}</span>
          {job.valueScore && (
            <>
              <span className="text-ink-600">·</span>
              <span className="flex items-center gap-0.5 font-mono text-teal">
                <Zap size={10} />
                {job.valueScore}
              </span>
            </>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(job.jobId)
          }}
          className={`rounded p-1 transition ${
            isFavorite ? 'text-gold' : 'text-ink-500 hover:text-paper'
          }`}
          aria-label="收藏"
        >
          <Bookmark size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </Link>
  )
}

export function GrowthBadge({ growth }: { growth: number }) {
  return (
    <span className="flex items-center gap-1 font-mono text-[10px] text-teal">
      +{growth}%
    </span>
  )
}
