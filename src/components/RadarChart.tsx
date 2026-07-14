import type { RadarMetric } from '@/data/types'

interface Props {
  metrics: RadarMetric[]
  size?: number
}

export default function RadarChart({ metrics, size = 280 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 44
  const count = metrics.length

  // 计算每个顶点坐标
  const angleFor = (i: number) => (Math.PI * 2 * i) / count - Math.PI / 2
  const pointFor = (i: number, value: number) => {
    const angle = angleFor(i)
    const r = (value / 100) * radius
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]
  }

  // 背景网格层
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1]
  const gridPolygons = gridLevels.map((level) =>
    metrics
      .map((_, i) => {
        const angle = angleFor(i)
        const r = level * radius
        return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`
      })
      .join(' '),
  )

  // 数据多边形
  const dataPoints = metrics.map((m, i) => pointFor(i, m.value))
  const dataPolygon = dataPoints.map(([x, y]) => `${x},${y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px]">
      {/* 网格 */}
      {gridPolygons.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="#262B3A"
          strokeWidth="1"
        />
      ))}
      {/* 轴线 */}
      {metrics.map((_, i) => {
        const angle = angleFor(i)
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#262B3A"
            strokeWidth="1"
          />
        )
      })}
      {/* 数据多边形 */}
      <polygon
        points={dataPolygon}
        fill="#E8B547"
        fillOpacity="0.15"
        stroke="#E8B547"
        strokeWidth="2"
        className="radar-poly"
      />
      {/* 数据点 */}
      {dataPoints.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="3"
          fill="#E8B547"
          stroke="#0E0F13"
          strokeWidth="1.5"
        />
      ))}
      {/* 标签 */}
      {metrics.map((m, i) => {
        const angle = angleFor(i)
        const labelR = radius + 22
        const x = cx + Math.cos(angle) * labelR
        const y = cy + Math.sin(angle) * labelR
        const anchor =
          Math.abs(Math.cos(angle)) < 0.1
            ? 'middle'
            : Math.cos(angle) > 0
              ? 'start'
              : 'end'
        return (
          <g key={i}>
            <text
              x={x}
              y={y - 2}
              textAnchor={anchor}
              className="fill-paper/80"
              style={{ fontSize: 11, fontFamily: 'Noto Sans SC' }}
            >
              {m.label}
            </text>
            <text
              x={x}
              y={y + 12}
              textAnchor={anchor}
              className="fill-gold"
              style={{ fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700 }}
            >
              {m.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
