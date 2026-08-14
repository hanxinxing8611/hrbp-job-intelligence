import { Link, useLocation } from 'react-router-dom'
import { Radar } from 'lucide-react'

export default function Header() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/40 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-gold/25 transition group-hover:ring-gold/50 sm:h-9 sm:w-9">
            <Radar size={16} className="text-gold transition group-hover:rotate-90 duration-500 sm:size-[18px]" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-base font-bold tracking-wide text-paper sm:text-lg">
              HR 求职情报站
            </span>
            <span className="mt-0.5 hidden font-mono text-[10px] tracking-[0.2em] text-muted sm:block">
              JOB INTELLIGENCE · 招聘情报聚合
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/"
            className={`relative font-mono text-[11px] tracking-wider transition sm:text-xs ${
              isHome ? 'text-gold' : 'text-muted hover:text-paper'
            }`}
          >
            职位大厅
            {isHome && (
              <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            )}
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full bg-teal/5 px-2.5 py-1 ring-1 ring-teal/20 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-teal pulse-dot" />
            <span className="font-mono text-[10px] tracking-wider text-teal">
              LIVE
            </span>
          </span>
        </nav>
      </div>
    </header>
  )
}
