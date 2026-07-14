import { useState } from 'react'
import { Search, SlidersHorizontal, RotateCcw, X } from 'lucide-react'
import {
  getCityOptions,
  getExperienceOptions,
  getScaleOptions,
  getStageOptions,
} from '@/data/dataApi'
import { useStore } from '@/store/useStore'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-ink-700/50 py-4 sm:py-5">
      <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted sm:mb-3">
        {title}
      </h4>
      {children}
    </div>
  )
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded px-2.5 py-1 text-[11px] transition ${
            value === opt
              ? 'bg-gold/15 text-gold ring-1 ring-gold/40'
              : 'bg-ink-700/40 text-paper/70 hover:bg-ink-600/50 hover:text-paper'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function FilterContent() {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const resetFilters = useStore((s) => s.resetFilters)

  return (
    <div className="px-5">
      <Section title="关键词">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-muted" />
          <input
            value={filters.keyword}
            onChange={(e) => setFilters({ keyword: e.target.value })}
            placeholder="职位/公司/标签"
            className="w-full rounded bg-ink-700/40 py-2 pl-8 pr-2 text-[12px] text-paper placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
        </div>
      </Section>

      <Section title="工作地点">
        <ChipRow
          options={getCityOptions()}
          value={filters.city}
          onChange={(v) => setFilters({ city: v })}
        />
      </Section>

      <Section title="工作年限">
        <ChipRow
          options={getExperienceOptions()}
          value={filters.experience}
          onChange={(v) => setFilters({ experience: v })}
        />
      </Section>

      <Section title={`薪资范围 ${filters.salaryMin}-${filters.salaryMax}K`}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] text-muted">
              最低 {filters.salaryMin}K
            </label>
            <input
              type="range"
              min={0}
              max={80}
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
              最高 {filters.salaryMax}K
            </label>
            <input
              type="range"
              min={0}
              max={80}
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
      </Section>

      <Section title="公司规模">
        <ChipRow
          options={getScaleOptions()}
          value={filters.scale}
          onChange={(v) => setFilters({ scale: v })}
        />
      </Section>

      <Section title="融资阶段">
        <ChipRow
          options={getStageOptions()}
          value={filters.stage}
          onChange={(v) => setFilters({ stage: v })}
        />
      </Section>
    </div>
  )
}

export default function FilterSidebar() {
  const resetFilters = useStore((s) => s.resetFilters)
  const [showMobile, setShowMobile] = useState(false)

  return (
    <>
      {/* PC 端侧边栏 */}
      <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-[240px] shrink-0 overflow-y-auto border-r border-ink-700/60 bg-ink-900/40 sm:block sm:top-[73px] sm:w-[260px] sm:h-[calc(100vh-73px)]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gold" />
            <span className="font-serif text-sm font-bold text-paper">多维筛选</span>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 font-mono text-[10px] text-muted transition hover:text-gold"
          >
            <RotateCcw size={11} />
            重置
          </button>
        </div>
        <FilterContent />
      </aside>

      {/* 移动端筛选按钮 */}
      <div className="sticky top-[57px] z-20 flex items-center justify-between border-b border-ink-700/60 bg-ink-950/90 px-4 py-2 backdrop-blur-sm sm:hidden">
        <button
          onClick={() => setShowMobile(true)}
          className="flex items-center gap-1.5 rounded bg-ink-800/80 px-3 py-1.5 font-mono text-[11px] text-paper"
        >
          <SlidersHorizontal size={12} className="text-gold" />
          筛选
        </button>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 font-mono text-[11px] text-muted"
        >
          <RotateCcw size={11} />
          重置
        </button>
      </div>

      {/* 移动端筛选抽屉 */}
      {showMobile && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMobile(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-ink-900 pb-8">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700/60 bg-ink-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-gold" />
                <span className="font-serif text-sm font-bold text-paper">筛选条件</span>
              </div>
              <button
                onClick={() => setShowMobile(false)}
                className="rounded-full p-1 text-muted hover:text-paper"
              >
                <X size={18} />
              </button>
            </div>
            <FilterContent />
            <div className="sticky bottom-0 mt-4 border-t border-ink-700/60 bg-ink-900 px-4 py-3">
              <button
                onClick={() => setShowMobile(false)}
                className="w-full rounded bg-gold/90 py-2.5 font-mono text-sm font-bold text-ink-950 transition hover:bg-gold"
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
