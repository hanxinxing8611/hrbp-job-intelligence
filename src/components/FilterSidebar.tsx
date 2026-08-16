import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, RotateCcw, X, ChevronDown } from 'lucide-react'
import {
  getCityOptions,
  getExperienceOptions,
  getScaleOptions,
  getStageOptions,
} from '@/data/dataApi'
import { useStore } from '@/store/useStore'

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
