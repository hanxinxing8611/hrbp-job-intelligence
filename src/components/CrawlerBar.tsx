import { useEffect, useState } from 'react'
import { Activity, Database, Clock, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CrawlerBar() {
  const crawlerStatus = useStore((s) => s.crawlerStatus)
  const triggerRefresh = useStore((s) => s.triggerRefresh)
  const nextRefreshIn = useStore((s) => s.nextRefreshIn)
  const setNextRefreshIn = useStore((s) => s.setNextRefreshIn)

  const todayNew = useCounter(crawlerStatus.todayNew)
  const totalJobs = useCounter(crawlerStatus.totalJobs)

  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshIn(Math.max(0, nextRefreshIn - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [nextRefreshIn, setNextRefreshIn])

  useEffect(() => {
    if (nextRefreshIn === 0) {
      triggerRefresh()
    }
  }, [nextRefreshIn, triggerRefresh])

  const stats = [
    { icon: Database, label: '平台', value: crawlerStatus.platforms, unit: '个', color: 'text-gold' },
    { icon: Activity, label: '今日', value: todayNew, unit: '岗', color: 'text-teal' },
    { icon: RefreshCw, label: '收录', value: totalJobs, unit: '条', color: 'text-paper' },
  ]

  return (
    <div className="border-b border-ink-700/30 bg-ink-900/30">
      <div className="mx-auto flex max-w-[1000px] items-center gap-x-3 px-4 py-1.5 sm:gap-x-6 sm:px-6 sm:py-2">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal" />
          </span>
          <span className="font-mono text-[9px] tracking-[0.15em] text-teal sm:text-[10px]">
            CRAWLER LIVE
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-5">
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <s.icon size={11} className={s.color + ' opacity-80'} />
              <span className="hidden font-mono text-[10px] tracking-wider text-muted sm:block">
                {s.label}
              </span>
              <span className={`font-mono text-[11px] font-bold ${s.color} count-flicker sm:text-sm`}>
                {s.value.toLocaleString()}
                <span className="ml-0.5 text-[9px] text-muted">{s.unit}</span>
              </span>
              {i < stats.length - 1 && (
                <span className="hidden h-3 w-px bg-ink-600/50 sm:block" />
              )}
            </div>
          ))}
        </div>

        <div className="hidden items-center gap-1.5 font-mono text-[10px] text-muted sm:flex">
          <Clock size={11} className="opacity-60" />
          <span className="text-gold/80">{formatTime(nextRefreshIn)}</span>
        </div>
      </div>
    </div>
  )
}
