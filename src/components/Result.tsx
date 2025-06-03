import { useEffect, useMemo, useRef, useState } from "react"
import type { Calculator } from "./Calculator"
import { formatMoney } from "./Form"
import { getCountryData, type TCountryCode } from "countries-list"

interface Data {
  date: number
  value: number
}

type ValueType = "money" | "percentage"
type IndicatorDirection = "right" | "left"

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-black/75 text-center font-semibold pt-1.5">
      {children}
    </p>
  )
}

function formatValue(value: number, type: ValueType) {
  switch (type) {
    case "money":
      return formatMoney(value)
    case "percentage":
      return (value * 100).toFixed(2) + "%"
  }
}

function DeducedWarning({ deducedValues, country }: { deducedValues: number[], country: TCountryCode }) {
  if (!deducedValues.length) return

  return (
    <article className="text-center">
      <div>
        <span className="text-2xl emoji">⚠️</span>
      </div>
      <h2 className="text-lg font-semibold text-balance">
        Inflation rate data for <Highlight color="darkorange">{getCountryData(country).name}</Highlight> is missing for some years and has been estimated based on the closest available data.
      </h2>
    </article>
  )
}

function Chart({ history, valueIcon, type, color, indicatorDirection, warningDates, children }: { history: Data[], valueIcon: React.ReactNode, type: ValueType, color: string, indicatorDirection: IndicatorDirection, warningDates?: number[], children: React.ReactNode }) {
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

  function getHistoryMaxMin() {
    const values = history.map(({ value }) => value)
  
    const historyMax = Math.max(...values)
    const historyMin = Math.min(...values)

    return { historyMax, historyMin }
  }

  const { historyMax, historyMin } = getHistoryMaxMin()

  const margin = pointRadius

  function getX(i: number) {
    if (history.length === 1) return width / 2

    return (i / (history.length - 1)) * (width - margin * 2) + margin
  }

  function getY(value: number) {
    if (history.length === 1) return height / 2

    const interpolation = (value - historyMin) * ((height - margin * 2 - marginBottom) / (historyMax - historyMin)) + margin + marginBottom

    return height - interpolation
  }

  const historyPositions = useMemo(() => {
    return history.map((({ value, date }, i) => ({ x: getX(i), y: getY(value), date })))
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

  const historyD = (
    history.length === 1 ?
      `${margin} ${historyPositions[0].y} L ` : "") + historyPositions.map((({ x, y }) => `${x} ${y}`)).join(" L ") + (history.length === 1 ? ` L ${width - margin} ${historyPositions[0].y}` :
      ""
  )

  return (
    <article ref={componentRef} onMouseLeave={() => setIndicator(prev => ({ ...prev, show: false }))} onMouseMove={updateIndicator} className="bg-black/5 hover:bg-black/10 cursor-default transition-colors overflow-visible rounded-[6px] shadow w-full py-3 px-2.5 relative flex flex-col justify-between">
      <header className="mb-5">
        {children}
      </header>

      <svg ref={svgRef} width="100%" viewBox={`0 0 ${width} ${height}`}>
        <path fill={color} opacity={0.15} d={`M ${historyD} L ${width - margin} ${height - roundedRadius} Q ${width - margin} ${height}, ${width - margin - roundedRadius} ${height} L ${margin + roundedRadius} ${height} Q ${margin} ${height} ,${margin} ${height - roundedRadius} L ${margin} ${getY(history[0].value)}`} />
        <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={line} stroke={color} d={`M ${historyD}`} />
        <g>
          {historyPositions.map(({ x, y, date }, i) => {
            const isWarningDate = warningDates?.includes(date) ?? false

            return <circle key={i} cx={x} cy={y} stroke={isWarningDate ? color : "none"} strokeWidth={isWarningDate ? 4 : 0} fill={isWarningDate ? "#ffffff" : color} r={isWarningDate ? pointRadius - 2 : pointRadius} />
          })}
        </g>
      </svg>

      <div ref={indicatorRef} style={{ opacity: indicator.show ? 1 : 0, transform: `translate(${indicator.position.x}px, ${indicator.position.y}px)`, borderRadius: `${indicatorDirection === "left" ? 6 : 0}px ${indicatorDirection === "right" ? 6 : 0}px 6px 6px` }} className="absolute top-0 left-0 bg-white transition ease-linear shadow p-2 pointer-events-none z-10">
        <div className="text-black/75 text-lg font-bold">
          {warningDates?.includes(indicator.year) ? <span className="emoji text-sm inline-block -translate-y-[1px] mr-1">⚠️</span> : ""}
          {indicator.year}
        </div>
        <div>
          {valueIcon}
          {formatValue(indicator.value, type)}
        </div>
      </div>
    </article>
  )
}

function Statistics({ children, values, color }: { children: React.ReactNode, values: { value: number, type: ValueType, label: string, average?: boolean }[], color: string }) {
  return (
    <article className="bg-black/5 hover:bg-black/10 transition-colors rounded-[6px] p-3 shadow cursor-default">
      <header className="mb-8">
        {children}
      </header>

      <div style={{ gridTemplateColumns: `repeat(${values.length}, ${values.length === 2 ? "35%" : "1fr"})` }} className="grid justify-center">
        {values.map(({ value, type, label, average }, i) => (
          <div className="flex flex-col items-center" key={i}>
            <h3 style={{ color }} className="text-2xl font-bold text-shadow-sm">{type === "money" ? "$" : null}{formatValue(value, type)}{average ? "/year" : null}</h3>
            <SubTitle>
              {label}
            </SubTitle>
          </div>
        ))}
      </div>
    </article>
  )
}

function Highlight({ color, children }: { color: string, children: React.ReactNode }) {
  return (
    <strong style={{ color }} className="text-shadow-sm font-semibold">{children}</strong>
  )
}

function NoDataForCountry({ country }: { country: TCountryCode }) {
  return (
    <section className="text-center mt-20">
      <div>
        <span className="text-2xl emoji">🚫</span>
      </div>
      <h2 className="text-lg font-semibold text-balance">
        Sorry, there is no available inflation data for <Highlight color="red">{getCountryData(country).name}</Highlight>.
      </h2>
    </section>
  )
}

function Loading({ year }: { year: number }) {
  return (
    <section className="mt-20 flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-2 gap-6">
        <article className="bg-black/5 hover:bg-black/10 cursor-default transition-colors overflow-visible rounded-[6px] shadow w-full py-3 px-2.5 relative flex flex-col justify-between">
          <header className="mb-5 opacity-25">
            <h2 className="text-xl font-semibold text-black text-center">
              Annual <Highlight color="black">Inflation Rate</Highlight>
            </h2>
            <SubTitle>
              Based on Year-End Data
            </SubTitle>
          </header>
          <svg viewBox="0 0 3 1" />
        </article>
        <article className="bg-black/5 hover:bg-black/10 cursor-default transition-colors overflow-visible rounded-[6px] shadow w-full py-3 px-2.5 relative flex flex-col justify-between">
          <header className="mb-5 opacity-25">
            <h2 className="text-xl font-semibold text-black text-center">
              <Highlight color="black">Purchasing Power</Highlight> by year
            </h2>
            <SubTitle>
              Adjusted to Today's Money
            </SubTitle>
          </header>
          <svg viewBox="0 0 3 1" />
        </article>
      </div>

      <article className="bg-black/5 hover:bg-black/10 transition-colors rounded-[6px] p-3 shadow cursor-default">
        <header className="mb-8 opacity-25">
          <h2 className="text-xl font-semibold text-center">
            In <Highlight color="black">{year}</Highlight>, Your Money was Worth
          </h2>
          <SubTitle>
            Before Inflation
          </SubTitle>
        </header>

        <div className="h-[58px]" />
      </article>

      <article className="bg-black/5 hover:bg-black/10 transition-colors rounded-[6px] p-3 shadow cursor-default">
        <header className="mb-8 opacity-25">
          <h2 className="text-xl font-semibold text-center">
            You Have <Highlight color="black">Lost</Highlight>
          </h2>
          <SubTitle>
            Due to Inflation
          </SubTitle>
        </header>

        <div className="h-[58px]" />
      </article>
    </section>
  )
}

export default function Result({ calculator }: { calculator: Calculator }) {
  const [inflationHistory, setInflationHistory] = useState<{ inflationHistory: Data[], deducedValues: number[] }>({ inflationHistory: [], deducedValues: [] })
  const [loading, setLoading] = useState(false)

  const { year, money, country } = calculator

  const noCalculator = !year || !money || !country

  const now = new Date()

  useEffect(() => {
    function getNextValidValue(jsonObj: Data[], index: number) {
      for (let i = index; i < jsonObj.length; i++) {
        if (jsonObj[i].value !== null) {
          return { value: jsonObj[i].value, index: i }
        }
      }
    }

    if (noCalculator) return

    ;(async () => {
      setLoading(true)
      const json = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL.ZG?date=${year}:${now.getFullYear()}&format=json`)
      const jsonObj = (await json.json() as [undefined, Data[]])[1]

      let inflationHistory: Data[]
      const deducedValues: number[] = []
      try {
        let previousValue = NaN

        inflationHistory = jsonObj.map(({ date, value }, i) => {

          if (value === null) {
            const nextValidValue = getNextValidValue(jsonObj, i)
  
            if (isNaN(previousValue)) {
              if (nextValidValue !== undefined) {
                value = nextValidValue.value
              } else {
                throw new Error("No valid value")
              }
            } else {
              if (nextValidValue === undefined) {
                value = previousValue
              } else {
                value = ((nextValidValue.value - previousValue) / (nextValidValue.index - (i - 1))) + previousValue
              }
            }

            deducedValues.push(Number(date))
          }
  
          previousValue = value
  
          return { date: Number(date), value: value / 100 }
        }).toReversed()
      } catch {
        inflationHistory = []
      }

      setInflationHistory({ inflationHistory, deducedValues })
      setLoading(false)
    })()
  }, [year, money, country])

  const valueHistory = useMemo(() => {
    if (noCalculator) return

    const valueHistory: Data[] = []

    valueHistory.push({ date: now.getFullYear(), value: money })
    inflationHistory.inflationHistory.toReversed().forEach(({ date, value: inflation }) => {
      const previousValue = valueHistory[valueHistory.length - 1]?.value ?? money

      valueHistory.push({ date, value: previousValue * (1 + inflation) })
    })

    return valueHistory.toReversed()
  }, [inflationHistory])

  if (noCalculator || !valueHistory) return

  const valueDifference = valueHistory[0].value - valueHistory[valueHistory.length - 1].value

  if (loading) {
    return <Loading year={year} />
  }

  if (!inflationHistory.inflationHistory.length) {
    return <NoDataForCountry country={country} />
  }

  return (
    <section className="mt-20 flex flex-col gap-6">
      <DeducedWarning deducedValues={inflationHistory.deducedValues} country={country} />

      <div className="grid grid-cols-2 gap-6">
        <Chart warningDates={inflationHistory.deducedValues} indicatorDirection="right" color="darkorange" type="percentage" valueIcon={<span className="emoji -ml-0.5 mr-0.5 text-lg">🏦</span>} history={inflationHistory.inflationHistory}>
          <h2 className="text-xl font-semibold text-center">
            Annual <Highlight color="darkorange">Inflation Rate</Highlight>
          </h2>
          <SubTitle>
            Based on Year-End Data
          </SubTitle>
        </Chart>
        <Chart indicatorDirection="left" color="red" type="money" valueIcon={<span className="emoji -ml-1 text-lg">💲</span>} history={valueHistory}>
          <h2 className="text-xl font-semibold text-center">
            <Highlight color="red">Purchasing Power</Highlight> by year
          </h2>
          <SubTitle>
            Adjusted to Today's Money
          </SubTitle>
        </Chart>
      </div>

      <Statistics values={[
        { value: (valueHistory[0].value / valueHistory[valueHistory.length - 1].value) - 1, type: "percentage", label: "Of its Today's Value" },
        { value: valueHistory[0].value, type: "money", label: "In Today's Money" }
      ]} color="green">
        <h2 className="text-xl font-semibold text-center">
           In <Highlight color="green">{year}</Highlight>, Your Money was Worth
        </h2>
        <SubTitle>
          Before Inflation
        </SubTitle>
      </Statistics>

      <Statistics values={[
        { value: valueDifference / valueHistory[0].value, type: "percentage", label: "Of Your Value" },
        { value: valueDifference, type: "money", label: "In Today's Money" },
        { value: valueDifference / inflationHistory.inflationHistory.length, type: "money", label: "Average in Today's Money", average: true },
      ]} color="red">
        <h2 className="text-xl font-semibold text-center">
          You Have <Highlight color="red">Lost</Highlight>
        </h2>
        <SubTitle>
          Due to Inflation
        </SubTitle>
      </Statistics>
    </section>
  )
}