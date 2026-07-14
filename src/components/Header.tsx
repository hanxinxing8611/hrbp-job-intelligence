import { Link, useLocation } from 'react-router-dom'
import { Radar } from 'lucide-react'

export default function Header() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/70 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        <Link to="/" className="group flex items-center gap-2.5 sm:gap-3">
          <span className="grid h-8 w-8 place-items-center rounded bg-gold/10 ring-1 ring-gold/30 sm:h-9 sm:w-9">
            <Radar size={16} className="text-gold sm:size-[18px]" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-base font-bold tracking-wide text-paper sm:text-lg">
              HRBP 求职情报站
            </span>
            <span className="mt-0.5 hidden font-mono text-[10px] tracking-[0.2em] text-muted sm:block">
              JOB INTELLIGENCE · 招聘情报聚合
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/"
            className={`font-mono text-[11px] tracking-wider transition sm:text-xs ${
              isHome ? 'text-gold' : 'text-muted hover:text-paper'
            }`}
          >
            职位大厅
          </Link>
          <span className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-teal pulse-dot" />
            <span className="font-mono text-[10px] tracking-wider text-teal">
              爬虫运行中
            </span>
          </span>
        </nav>
      </div>
    </header>
  )
}
