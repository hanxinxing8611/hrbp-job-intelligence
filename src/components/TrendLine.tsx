import type { TrendPoint } from '@/data/types'

interface Props {
  data: TrendPoint[]
  metric: 'revenue' | 'headcount' | 'openings'
}

const metricConfig = {
  revenue: { label: '营收(亿元)', color: '#E8B547', unit: '亿' },
  headcount: { label: '人员规模', color: '#4A9D8C', unit: '人' },
  openings: { label: '招聘岗位', color: '#5B8DEF', unit: '个' },
} as const

export default function TrendLine({ data, metric }: Props) {
  const cfg = metricConfig[metric]
  const width = 520
  const height = 200
  const padLeft = 44
  const padBottom = 28
  const padTop = 16
  const padRight = 16

  const values = data.map((d) => d[metric])
  const maxVal = Math.max(...values) * 1.15
  const minVal = 0

  const innerW = width - padLeft - padRight
  const innerH = height - padTop - padBottom

  const points = data.map((d, i) => {
    const x = padLeft + (innerW * i) / (data.length - 1)
    const y = padTop + innerH - ((d[metric] - minVal) / (maxVal - minVal)) * innerH
    return [x, y, d[metric]] as const
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1][0]},${padTop + innerH} L${padLeft},${padTop + innerH} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Y 轴网格线 */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padTop + innerH - t * innerH
        const val = Math.round(minVal + t * (maxVal - minVal))
        return (
          <g key={t}>
            <line
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="#1E2230"
              strokeWidth="1"
              strokeDasharray={t === 0 ? '0' : '3 3'}
            />
            <text
              x={padLeft - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-muted"
              style={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
            >
              {val}
            </text>
          </g>
        )
      })}

      {/* 填充区域 */}
      <path d={areaPath} fill={cfg.color} fillOpacity="0.12" />

      {/* 折线 */}
      <path
        d={linePath}
        fill="none"
        stroke={cfg.color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="line-draw"
      />

      {/* 数据点 */}
      {points.map(([x, y, val], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#0E0F13" stroke={cfg.color} strokeWidth="2" />
          <text
            x={x}
            y={y - 10}
            textAnchor="middle"
            className="fill-paper"
            style={{ fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 700 }}
          >
            {val}
          </text>
          <text
            x={x}
            y={height - 10}
            textAnchor="middle"
            className="fill-muted"
            style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
          >
            {data[i].year}
          </text>
        </g>
      ))}

      {/* 指标标签 */}
      <text
        x={padLeft}
        y={10}
        className="fill-muted"
        style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
      >
        {cfg.label}
      </text>
    </svg>
  )
}
