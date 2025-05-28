import { useEffect, useMemo, useRef, useState } from "react"
import type { Calculator } from "./Calculator"
import { formatMoney } from "./Form"

interface Data {
  date: number
  value: number
}

type ChartType = "money" | "percentage"
type IndicatorDirection = "right" | "left"

function Chart({ history, valueIcon, type, color, indicatorDirection }: { history: Data[], valueIcon: React.ReactNode, type: ChartType, color: string, indicatorDirection: IndicatorDirection }) {
  const [indicator, setIndicator] = useState<{ show: boolean, year: number, value: number, position: { x: number, y: number } }>({ show: false, year: 0, value: 0, position: { x: 0, y: 0 } })

  const componentRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  const width = 1000
  const height = width / 3
  const line = 7

  const marginBottom = height / 10
  const roundedRadius = 10

  const pointRadius = line

  function formatIndicatorValue(value: number) {
    switch (type) {
      case "money":
        return formatMoney(value)
      case "percentage":
        return (value * 100).toFixed(2) + "%"
    }
  }

  function getHistoryMaxMin() {
    const values = history.map(({ value }) => value)
  
    const historyMax = Math.max(...values)
    const historyMin = Math.min(...values)

    return { historyMax, historyMin }
  }

  const { historyMax, historyMin } = getHistoryMaxMin()

  const margin = pointRadius

  function getX(i: number) {
    return (i / (history.length - 1)) * (width - margin * 2) + margin
  }

  function getY(value: number) {
    const interpolation = (value - historyMin) * ((height - margin * 2 - marginBottom) / (historyMax - historyMin)) + margin + marginBottom

    return height - interpolation
  }

  const historyPositions = useMemo(() => {
    return history.map((({ value }, i) => ({x: getX(i), y: getY(value)})))
  }, [history])

  function updateIndicator(e: React.MouseEvent) {
    const container = componentRef.current
    if (!container) return

    const svg = svgRef.current
    if (!svg) return

    const indicator = indicatorRef.current
    if (!indicator) return

    const svgRect = svg.getBoundingClientRect()

    const space = svgRect.width / (history.length - 1)
    const x = e.clientX - svgRect.left

    const point = Math.round(x / space)

    if (!historyPositions[point] || !history[point]) return

    const containerRect = container.getBoundingClientRect()
    const indicatorRect = indicator.getBoundingClientRect()

    const position = {
      x: historyPositions[point].x * (svgRect.width / width) + (svgRect.left - containerRect.left) - (indicatorDirection === "left" ? indicatorRect.width : 0),
      y: historyPositions[point].y * (svgRect.height / height) + (svgRect.top - containerRect.top)
    }

    setIndicator({ show: true, year: history[point].date, value: history[point].value, position })
  }

  const historyD = historyPositions.map((({ x, y }) => `${x} ${y}`)).join(" L ")

  return (
    <div ref={componentRef} onMouseLeave={() => setIndicator(prev => ({ ...prev, show: false }))} onMouseMove={updateIndicator} className="bg-black/5 hover:bg-black/10 transition-colors overflow-visible rounded-[6px] shadow max-w-[770px] w-full p-[2.5%] mx-auto relative">
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${width} ${height}`}>
        <path fill={color} opacity={0.15} d={`M ${historyD} L ${width - margin} ${height - roundedRadius} Q ${width - margin} ${height}, ${width - margin - roundedRadius} ${height} L ${margin + roundedRadius} ${height} Q ${margin} ${height} ,${margin} ${height - roundedRadius} L ${margin} ${getY(history[0].value)}`} />
        <path fill="none" strokeLinejoin="round" strokeWidth={line} stroke={color} d={`M ${historyD}`} />
        <g>
          {historyPositions.map(({ x, y }, i) => <circle key={i} cx={x} cy={y} fill={color} r={pointRadius} />)}
        </g>
      </svg>

      <div ref={indicatorRef} style={{ opacity: indicator.show ? 1 : 0, transform: `translate(${indicator.position.x}px, ${indicator.position.y}px)`, borderRadius: `${indicatorDirection === "left" ? 6 : 0}px ${indicatorDirection === "right" ? 6 : 0}px 6px 6px` }} className="absolute top-0 left-0 bg-white transition shadow p-2 pointer-events-none z-10">
        <div className="opacity-75 text-lg font-bold">
          {indicator.year}
        </div>
        <div>
          {valueIcon}
          {formatIndicatorValue(indicator.value)}
        </div>
      </div>
    </div>
  )
}

export default function Result({ calculator }: { calculator: Calculator }) {
  const [inflationHistory, setInflationHistory] = useState<Data[]>([])
  const [loading, setLoading] = useState(false)

  const { date, money, country } = calculator

  const noCalculator = !date || !money || !country

  const now = new Date()

  useEffect(() => {
    if (noCalculator) return

    setLoading(true)
    ;(async () => {
      const json = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL.ZG?date=${date.getFullYear()}:${now.getFullYear()}&format=json`)
      const inflationHistory = (await json.json() as [undefined, Data[]])[1].map(({ date, value }) => ({ date: Number(date), value: value / 100 })).toReversed()

      setInflationHistory(inflationHistory)
    })()
    setLoading(false)
  }, [date?.getTime(), money, country])

  const valueHistory = useMemo(() => {
    if (noCalculator) return

    const valueHistory: Data[] = []

    valueHistory.push({ date: now.getFullYear(), value: money })
    inflationHistory.toReversed().forEach(({ date, value: inflation }) => {
      const previousValue = valueHistory[valueHistory.length - 1]?.value ?? money

      valueHistory.push({ date, value: previousValue / (1 - inflation) })
    })

    return valueHistory.toReversed()
  }, [inflationHistory])

  if (noCalculator || !valueHistory) return

  return (
    <div className="mt-20 grid grid-cols-2 gap-8">
      <Chart indicatorDirection="right" color="darkorange" type="percentage" valueIcon={<span className="emoji -ml-0.5 mr-0.5 text-lg">🏦</span>} history={inflationHistory} />
      <Chart indicatorDirection="left" color="red" type="money" valueIcon={<span className="emoji -ml-1 text-lg">💲</span>} history={valueHistory} />
    </div>
  )
}