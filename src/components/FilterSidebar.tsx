import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, RotateCcw, X, ChevronDown, RefreshCw } from 'lucide-react'
import {
  getCityOptions,
  getExperienceOptions,
  getScaleOptions,
  getStageOptions,
  getCrawlerStatus,
  refreshJobs,
} from '@/data/dataApi'
import { useStore } from '@/store/useStore'

// UTC ISO → 北京时间 MM-DD HH:mm
function formatBJ(iso?: string): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--'
  const bj = new Date(d.getTime() + 8 * 3600 * 1000)
  const MM = String(bj.getUTCMonth() + 1).padStart(2, '0')
  const DD = String(bj.getUTCDate()).padStart(2, '0')
  const hh = String(bj.getUTCHours()).padStart(2, '0')
  const mm = String(bj.getUTCMinutes()).padStart(2, '0')
  return `${MM}-${DD} ${hh}:${mm}`
}

const WORKFLOW_RUN_URL =
  'https://github.com/hanxinxing8611/hrbp-job-intelligence/actions/workflows/deploy-pages.yml'

function SourceChips({ perSource }: { perSource?: Record<string, number> }) {
  if (!perSource || !Object.keys(perSource).length) return null
  const entries = Object.entries(perSource).sort((a, b) => b[1] - a[1])
  const palette: Record<string, string> = {
    '智联招聘': 'bg-sky-500/10 text-sky-300/90 ring-sky-400/20',
    'BOSS直聘': 'bg-emerald-500/10 text-emerald-300/90 ring-emerald-400/20',
    '前程无忧': 'bg-amber-500/10 text-amber-300/90 ring-amber-400/20',
    '猎聘': 'bg-violet-500/10 text-violet-300/90 ring-violet-400/20',
  }
  return (
    <>
      <span className="mx-1 hidden h-3 w-px bg-ink-700/60 sm:inline-block" />
      <div className="flex flex-wrap items-center gap-1">
        {entries.map(([src, n]) => (
          <span
            key={src}
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ${palette[src] || 'bg-ink-800 text-paper/70 ring-ink-700/50'}`}
          >
            {src.replace('招聘', '').replace('前程无忧', '无忧').replace('直聘', '')} {n}
          </span>
        ))}
      </div>
    </>
  )
}

function CrawlStatusBar() {
  const [status, setStatus] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const refreshKey = useStore((s) => s.refreshKey ?? 0)

  const load = async () => {
    try {
      const s = await getCrawlerStatus()
      setStatus(s as any)
    } catch { setStatus(null) }
  }

  useEffect(() => { load() }, [refreshKey])

  const totalJobs = status?.totalJobs ?? 0
  const updatedAt = status?.crawlReport?.updatedAt || status?.lastCrawl
  const mergeTag = (() => {
    const s = String(status?.crawlReport?.mergeStrategy || '')
    if (s.startsWith('FULL_LIVE')) return '实时全量'
    if (s.startsWith('LIVE_70')) return '70%实时'
    if (s.startsWith('LIVE_1_OLD')) return '实时不足'
    if (s.startsWith('OLD_FALLBACK')) return '历史兜底'
    return ''
  })()

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshJobs()
      await load()
    } finally {
      try { window.open(WORKFLOW_RUN_URL, '_blank', 'noopener noreferrer') } catch {}
      setTimeout(() => setRefreshing(false), 1500)
    }
  }

  return (
    <div className="border-b border-ink-700/40 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-muted sm:gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="text-ink-500">🕒</span>
            <span>最近抓取</span>
            <span className="ml-0.5 text-paper/85">{formatBJ(updatedAt)}</span>
          </span>
          <span className="hidden h-3 w-px bg-ink-700/60 sm:inline-block" />
          <span>
            <span className="text-ink-500">📊</span>
            <span className="ml-0.5">总计 </span>
            <b className="text-paper">{totalJobs}</b>
            <span className="text-ink-500"> 职位 · </span>
            <b className="text-paper">{status?.platforms ?? 0}</b>
            <span className="text-ink-500"> 平台</span>
          </span>
          <SourceChips perSource={status?.crawlReport?.perSource} />
          {mergeTag && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ${
                mergeTag === '历史兜底'
                  ? 'bg-crimson/10 text-crimson/85 ring-crimson/25'
                  : mergeTag === '实时全量'
                    ? 'bg-emerald-500/10 text-emerald-300/90 ring-emerald-400/25'
                    : 'bg-amber-500/10 text-amber-300/90 ring-amber-400/25'
              }`}
            >
              {mergeTag}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold/12 px-2.5 py-1 font-mono text-[10px] font-bold text-gold ring-1 ring-gold/30 transition hover:bg-gold/20 hover:shadow-[0_0_10px_rgba(232,181,71,0.18)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
          title="清除本地缓存并打开 Actions 页面点 Run workflow 立即重新抓取"
        >
          <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '刷新中…' : '立即刷新'}
        </button>
      </div>
    </div>
  )
}

const HOT_CITIES = ['全部', '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安']

function FilterChip({
  label,
  value,
  options,
  onChange,
  maxOptions = 10,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  maxOptions?: number
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const displayOptions = options.slice(0, maxOptions)
  const hasMore = options.length > maxOptions

  const selectedLabel = value === '全部' ? label : value

  return (
    <div className="relative isolate">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative z-[60] flex items-center gap-1 rounded-lg px-3 py-1.5 font-mono text-[11px] transition sm:px-3.5 ${
          value !== '全部'
            ? 'bg-gold/15 text-gold ring-1 ring-gold/40 shadow-[0_0_8px_rgba(232,181,71,0.12)]'
            : 'bg-ink-700/30 text-paper/70 ring-1 ring-ink-700/40 hover:bg-ink-600/40 hover:text-paper hover:ring-ink-600/50'
        }`}
      >
        {selectedLabel}
        <ChevronDown size={10} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-[55]"
            onClick={() => setShowDropdown(false)}
          />
          <div className="glass absolute left-0 top-full z-[70] mt-1 max-h-64 w-40 overflow-y-auto rounded-lg border border-ink-600/60 shadow-2xl shadow-black/60 ring-1 ring-ink-700/30">
            {displayOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setShowDropdown(false)
                }}
                className={`w-full px-3 py-2 text-left font-mono text-[11px] transition ${
                  value === opt
                    ? 'bg-gold/15 text-gold'
                    : 'text-paper/70 hover:bg-ink-700/50 hover:text-paper'
                }`}
              >
                {opt}
              </button>
            ))}
            {hasMore && (
              <button
                onClick={() => setShowDropdown(false)}
                className="w-full border-t border-ink-700/40 px-3 py-2 text-center font-mono text-[10px] text-muted hover:text-paper"
              >
                更多城市请使用关键词搜索
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function FilterContent() {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const [cityOptions, setCityOptions] = useState<string[]>(HOT_CITIES)
  const [expOptions, setExpOptions] = useState<string[]>(['全部'])

  useEffect(() => {
    getCityOptions().then((opts) => {
      setCityOptions(['全部', ...opts.filter((c) => c !== '全部').slice(0, 15)])
    }).catch(() => setCityOptions(HOT_CITIES))
    getExperienceOptions().then(setExpOptions).catch(() => setExpOptions(['全部']))
  }, [])

  return (
    <div className="px-5">
      <div className="border-b border-ink-700/50 py-4">
        <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          关键词
        </h4>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-muted" />
          <input
            value={filters.keyword}
            onChange={(e) => setFilters({ keyword: e.target.value })}
            placeholder="职位/公司/标签"
            className="w-full rounded-lg bg-ink-700/30 py-2 pl-8 pr-2 text-[12px] text-paper ring-1 ring-ink-700/40 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold/40 focus:bg-ink-700/40"
          />
        </div>
      </div>

      <div className="border-b border-ink-700/50 py-4">
        <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          工作地点
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {cityOptions.slice(0, 10).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilters({ city: opt })}
              className={`rounded px-2.5 py-1 text-[11px] transition ${
                filters.city === opt
                  ? 'bg-gold/15 text-gold ring-1 ring-gold/40'
                  : 'bg-ink-700/40 text-paper/70 hover:bg-ink-600/50 hover:text-paper'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-ink-700/50 py-4">
        <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          工作年限
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {expOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilters({ experience: opt })}
              className={`rounded px-2.5 py-1 text-[11px] transition ${
                filters.experience === opt
                  ? 'bg-gold/15 text-gold ring-1 ring-gold/40'
                  : 'bg-ink-700/40 text-paper/70 hover:bg-ink-600/50 hover:text-paper'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-ink-700/50 py-4">
        <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          薪资范围 {filters.salaryMin}-{filters.salaryMax === 500 ? '500+' : filters.salaryMax}K
        </h4>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] text-muted">
              最低 {filters.salaryMin}K
            </label>
            <input
              type="range"
              min={0}
              max={500}
              step={5}
              value={filters.salaryMin}
              onChange={(e) =>
                setFilters({
                  salaryMin: Math.min(Number(e.target.value), filters.salaryMax),
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] text-muted">
              最高 {filters.salaryMax === 500 ? '500+' : filters.salaryMax}K
            </label>
            <input
              type="range"
              min={0}
              max={500}
              step={5}
              value={filters.salaryMax}
              onChange={(e) =>
                setFilters({
                  salaryMax: Math.max(Number(e.target.value), filters.salaryMin),
                })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-ink-700/50 py-4">
        <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          公司规模
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {getScaleOptions().map((opt) => (
            <button
              key={opt}
              onClick={() => setFilters({ scale: opt })}
              className={`rounded px-2.5 py-1 text-[11px] transition ${
                filters.scale === opt
                  ? 'bg-gold/15 text-gold ring-1 ring-gold/40'
                  : 'bg-ink-700/40 text-paper/70 hover:bg-ink-600/50 hover:text-paper'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="py-4">
        <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          融资阶段
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {getStageOptions().map((opt) => (
            <button
              key={opt}
              onClick={() => setFilters({ stage: opt })}
              className={`rounded px-2.5 py-1 text-[11px] transition ${
                filters.stage === opt
                  ? 'bg-gold/15 text-gold ring-1 ring-gold/40'
                  : 'bg-ink-700/40 text-paper/70 hover:bg-ink-600/50 hover:text-paper'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FilterSidebar() {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const resetFilters = useStore((s) => s.resetFilters)
  const [showMobile, setShowMobile] = useState(false)
  const [cityOptions, setCityOptions] = useState<string[]>(HOT_CITIES)
  const [expOptions, setExpOptions] = useState<string[]>(['全部'])

  useEffect(() => {
    getCityOptions().then((opts) => {
      setCityOptions(['全部', ...opts.filter((c) => c !== '全部').slice(0, 15)])
    }).catch(() => setCityOptions(HOT_CITIES))
    getExperienceOptions().then(setExpOptions).catch(() => setExpOptions(['全部']))
  }, [])

  const hasActiveFilters = filters.city !== '全部' || 
    filters.experience !== '全部' || 
    filters.scale !== '全部' || 
    filters.stage !== '全部' || 
    filters.salaryMin !== 0 || 
    filters.salaryMax !== 500 || 
    filters.keyword !== ''

  return (
    <>
      <CrawlStatusBar />
      {/* PC端顶部筛选栏 */}
      <div className="sticky top-0 z-40 hidden border-b border-ink-700/40 bg-ink-900/80 backdrop-blur-xl sm:block">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center gap-3 overflow-visible px-6 py-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-2.5 top-2.5 text-muted" />
            <input
              value={filters.keyword}
              onChange={(e) => setFilters({ keyword: e.target.value })}
              placeholder="搜索职位/公司/标签"
              className="w-full rounded-lg bg-ink-700/30 py-2 pl-8 pr-2 text-[12px] text-paper ring-1 ring-ink-700/40 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold/40 focus:bg-ink-700/40"
            />
          </div>

          <FilterChip
            label="地点"
            value={filters.city}
            options={cityOptions}
            onChange={(v) => setFilters({ city: v })}
            maxOptions={15}
          />

          <FilterChip
            label="经验"
            value={filters.experience}
            options={expOptions}
            onChange={(v) => setFilters({ experience: v })}
          />

          <FilterChip
            label="规模"
            value={filters.scale}
            options={getScaleOptions()}
            onChange={(v) => setFilters({ scale: v })}
          />

          <FilterChip
            label="阶段"
            value={filters.stage}
            options={getStageOptions()}
            onChange={(v) => setFilters({ stage: v })}
          />

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted">
              {filters.salaryMin}K-{filters.salaryMax === 500 ? '500+' : filters.salaryMax}K
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded px-3 py-1.5 font-mono text-[11px] text-muted transition hover:text-gold sm:px-3.5"
            >
              <RotateCcw size={11} />
              重置
            </button>
          )}
        </div>
      </div>

      {/* 移动端筛选按钮 */}
      <div className="sticky top-[57px] z-20 flex items-center justify-between border-b border-ink-700/40 bg-ink-950/85 px-4 py-2 backdrop-blur-lg sm:hidden">
        <button
          onClick={() => setShowMobile(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800/60 px-3 py-1.5 font-mono text-[11px] text-paper ring-1 ring-ink-700/40 transition active:scale-95"
        >
          <SlidersHorizontal size={12} className="text-gold" />
          筛选
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-crimson/80 px-1.5 py-0.5 font-mono text-[9px] text-white">
              已选
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 font-mono text-[11px] text-muted transition hover:text-gold"
          >
            <RotateCcw size={11} />
            重置
          </button>
        )}
      </div>

      {/* 移动端筛选抽屉 */}
      {showMobile && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMobile(false)}
          />
          <div className="glass absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-ink-700/50 pb-8">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700/50 bg-ink-900/80 px-4 py-3 backdrop-blur-lg">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-gold" />
                <span className="font-serif text-sm font-bold text-paper">筛选条件</span>
              </div>
              <button
                onClick={() => setShowMobile(false)}
                className="rounded-full p-1 text-muted transition hover:text-paper"
              >
                <X size={18} />
              </button>
            </div>
            <FilterContent />
            <div className="sticky bottom-0 mt-4 border-t border-ink-700/50 bg-ink-900/80 px-4 py-3 backdrop-blur-lg">
              <button
                onClick={() => setShowMobile(false)}
                className="w-full rounded-xl bg-gradient-to-r from-gold to-gold/80 py-2.5 font-mono text-sm font-bold text-ink-950 shadow-lg shadow-gold/20 transition hover:shadow-gold/30 active:scale-[0.98]"
              >
                确认筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
