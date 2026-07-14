import { Routes, Route } from 'react-router-dom'
import Header from '@/components/Header'
import JobHall from '@/pages/JobHall'
import JobDetail from '@/pages/JobDetail'
import CompanyAnalysis from '@/pages/CompanyAnalysis'

export default function App() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<JobHall />} />
          <Route path="/job/:jobId" element={<JobDetail />} />
          <Route path="/company/:companyId" element={<CompanyAnalysis />} />
        </Routes>
      </main>
      <footer className="border-t border-ink-700/60 px-8 py-5 text-center">
        <p className="font-mono text-[11px] tracking-wider text-muted">
          HRBP 求职情报站 · 数据为模拟爬虫样本 · 仅供求职决策参考
        </p>
      </footer>
    </div>
  )
}
