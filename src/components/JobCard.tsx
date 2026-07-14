import { Link } from 'react-router-dom'
import { Flame, MapPin, Bookmark, TrendingUp } from 'lucide-react'
import type { Job } from '@/data/types'
import { getCompanyById } from '@/data/dataApi'
import { useStore } from '@/store/useStore'
import CompanyLogo from './CompanyLogo'

function timeAgo(iso: string): string {
  const date = new Date(iso)
  const now = new Date('2026-07-11T15:00:00+08:00')
  const hours = Math.floor((now.getTime() - date.getTime()) / 3600000)
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

export default function JobCard({ job, index }: { job: Job; index?: number }) {
  const company = getCompanyById(job.companyId)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isFavorite = useStore((s) => s.favorites.includes(job.jobId))

  return (
    <Link
      to={`/job/${job.jobId}`}
      className="card-accent group block border-b border-ink-700/50 bg-ink-800/40 px-4 py-4 transition hover:bg-ink-700/40"
    >
      {/* 移动端布局：上下结构 */}
      <div className="sm:hidden">
        {/* 第一行：公司logo + 职位标题 + 薪资 */}
        <div className="flex items-start gap-3">
          <CompanyLogo companyId={job.companyId} size={40} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-[15px] font-bold text-paper group-hover:text-gold">
              {job.title}
            </h3>
            <p className="mt-1 truncate text-[13px] text-muted">
              {company.name}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[15px] font-bold text-gold">
              {job.salaryRange}
            </p>
          </div>
        </div>

        {/* 第二行：地点 + 经验 + 时间 */}
        <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {job.city}
          </span>
          <span>{job.experience}</span>
          <span className="font-mono">{timeAgo(job.postedAt)}</span>
        </div>

        {/* 第三行：热度 + 收藏 */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 font-mono text-[11px] text-muted">
            <Flame size={12} className="text-crimson/70" />
            <span>热度 {job.heat}</span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleFavorite(job.jobId)
            }}
            className={`rounded-full p-2 transition ${
              isFavorite ? 'text-gold' : 'text-ink-500 hover:text-paper'
            }`}
            aria-label="收藏"
          >
            <Bookmark size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* PC端布局：左右结构 */}
      <div className="hidden items-start gap-4 sm:flex">
        <CompanyLogo companyId={job.companyId} size={40} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-serif text-[15px] font-bold text-paper group-hover:text-gold">
                {job.title}
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-muted">
                {company.name} · {company.industry}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[15px] font-bold text-gold">
                {job.salaryRange}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-muted">
                {job.source}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-muted" />
              {job.city}·{job.district}
            </span>
            <span className="text-ink-500">|</span>
            <span>{job.experience}</span>
            <span className="text-ink-500">|</span>
            <span>{job.education}</span>
            <span className="text-ink-500">|</span>
            <span className="font-mono">{timeAgo(job.postedAt)}</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {job.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border border-ink-600 bg-ink-700/40 px-2 py-0.5 font-mono text-[10px] text-paper/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {typeof index === 'number' && index < 3 && (
            <span className="font-serif text-2xl font-black text-gold/30">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleFavorite(job.jobId)
            }}
            className={`transition ${
              isFavorite ? 'text-gold' : 'text-ink-500 hover:text-paper'
            }`}
            aria-label="收藏"
          >
            <Bookmark size={15} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <div className="flex items-center gap-1 font-mono text-[10px] text-muted">
            <Flame size={11} className="text-crimson/70" />
            {job.heat}
          </div>
        </div>
      </div>
    </Link>
  )
}

export function GrowthBadge({ growth }: { growth: number }) {
  return (
    <span className="flex items-center gap-1 font-mono text-[10px] text-teal">
      <TrendingUp size={11} />
      +{growth}%
    </span>
  )
}
