import { Link } from 'react-router-dom'
import { Bookmark, Zap, ExternalLink, Clock } from 'lucide-react'
import type { Job } from '@/data/types'
import { getCompanyById, getSafeSourceUrl, openExternalLinkSafe } from '@/data/dataApi'
import { useStore } from '@/store/useStore'

function timeAgo(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const hours = Math.floor((now.getTime() - date.getTime()) / 3600000)
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}h前`
  return `${Math.floor(hours / 24)}d前`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getJobLevel(avgSalary: number): { label: string; cls: string } {
  if (avgSalary >= 80) return { label: '总监', cls: 'text-crimson bg-crimson/10 ring-crimson/20' }
  if (avgSalary >= 50) return { label: '资深', cls: 'text-teal bg-teal/10 ring-teal/20' }
  if (avgSalary >= 35) return { label: '高级', cls: 'text-blue bg-blue/10 ring-blue/20' }
  if (avgSalary >= 25) return { label: '中级', cls: 'text-gold bg-gold/10 ring-gold/20' }
  return { label: '初级', cls: 'text-muted bg-ink-600/40 ring-ink-500/20' }
}

// 性价比归一化：0-100 映射到 0-100%
function getValuePercent(score: number): number {
  return Math.min(100, Math.max(10, Math.round((score / 25) * 100)))
}

function getValueColor(percent: number): string {
  if (percent >= 80) return 'from-teal to-teal/50'
  if (percent >= 60) return 'from-teal/80 to-gold/50'
  if (percent >= 40) return 'from-gold/80 to-gold/40'
  return 'from-gold/50 to-muted/30'
}

export default function JobCard({ job, rank }: { job: Job; index?: number; rank?: number }) {
  const company = getCompanyById(job.companyId)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isFavorite = useStore((s) => s.favorites.includes(job.jobId))
  const avgSalary = (job.salaryMin + job.salaryMax) / 2
  const level = getJobLevel(avgSalary)
  const valuePercent = job.valueScore ? getValuePercent(job.valueScore) : 0
  const isTopValue = rank !== undefined && rank < 3
  const safeSourceUrl = getSafeSourceUrl(job.sourceUrl, job.source, job.title)

  return (
    <Link
      to={`/job/${job.jobId}`}
      className={`glow-border card-hover group relative block overflow-hidden rounded-xl border px-3.5 py-3 sm:px-4 sm:py-3.5 ${
        isTopValue
          ? 'border-teal/25 bg-gradient-to-br from-teal/[0.06] to-transparent hover:border-teal/45'
          : 'border-ink-700/50 bg-ink-800/30 hover:border-gold/30 hover:bg-ink-800/50'
      }`}
    >
      {/* TOP 高性价比卡片左侧光带 */}
      {isTopValue && (
        <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-gradient-to-b from-teal via-teal/60 to-transparent" />
      )}

      {/* 第一行：排名(可选) + 标题 + 等级 + 薪资 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isTopValue && (
              <span className="shrink-0 rounded bg-teal/20 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-teal ring-1 ring-teal/30">
                TOP{rank! + 1}
              </span>
            )}
            <h3 className="truncate font-serif text-sm font-bold text-paper transition-colors group-hover:text-gold sm:text-[15px]">
              {job.title}
            </h3>
            <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] ring-1 ${level.cls}`}>
              {level.label}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted">
            {job.companyName || company.name} · {job.city}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-bold text-gold sm:text-[15px]">
            {job.salaryRange}
          </p>
        </div>
      </div>

      {/* 性价比可视化进度条 */}
      {job.valueScore && (
        <div className="mt-2.5 flex items-center gap-2">
          <span className="flex shrink-0 items-center gap-0.5 font-mono text-[10px] text-teal">
            <Zap size={10} className="fill-teal/30" />
            性价比
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700/40">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getValueColor(valuePercent)} transition-[width] duration-500`}
              style={{ width: `${valuePercent}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[10px] font-bold text-teal">
            {job.valueScore}
          </span>
        </div>
      )}

      {/* 第三行：经验 + 来源 + 时间 + 收藏 */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
          <span className="shrink-0">{job.experience}</span>
          <span className="text-ink-600">·</span>
          <span className="flex shrink-0 items-center gap-0.5">
            <Clock size={9} className="opacity-60" />
            {job.crawledAt ? formatTime(job.crawledAt) : timeAgo(job.postedAt)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {safeSourceUrl && (
            <a
              href={safeSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => openExternalLinkSafe(e, safeSourceUrl)}
              className="flex items-center gap-0.5 rounded-md bg-ink-700/30 px-1.5 py-0.5 font-mono text-[10px] text-paper/50 transition hover:bg-gold/10 hover:text-gold"
            >
              {job.source}
              <ExternalLink size={9} />
            </a>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleFavorite(job.jobId)
            }}
            className={`rounded-md p-1 transition ${
              isFavorite ? 'text-gold' : 'text-ink-500 hover:text-paper'
            }`}
            aria-label="收藏"
          >
            <Bookmark size={15} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
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
