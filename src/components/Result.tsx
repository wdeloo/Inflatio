import { useEffect, useMemo, useState } from "react"
import type { Calculator } from "./Calculator"

interface Inflation {
  date: string
  value: number
}

function Chart({ inflationHistory }: { inflationHistory: Inflation[] }) {
  function Svg() {
    const width = 1000
    const height = 200
    const line = 5
  
    function getInflationMaxMin() {
      const values = inflationHistory.map(({ value }) => value)
    
      const inflationMax = Math.max(...values)
      const inflationMin = Math.min(...values)
  
      return { inflationMax, inflationMin }
    }
  
    const { inflationMax, inflationMin } = getInflationMaxMin()
  
    function getX(i: number) {
      return (i / (inflationHistory.length - 1)) * width
    }
  
    function getY(value: number) {
      const margin = line / 2
  
      const interpolation = (value - inflationMin) * ((height - margin * 2) / (inflationMax - inflationMin)) + margin
  
      return height - interpolation
    }
  
    return (
      <svg className="overflow-visible" fill="none" strokeLinejoin="round" strokeLinecap="round" strokeWidth={line} stroke="black" width="100%" viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${inflationHistory.map((({ value }, i) => `${getX(i)} ${getY(value)}`)).join(" L ")}`} />
      </svg>
    )
  }

  return (
    <div className="bg-black/5 hover:bg-black/10 transition-colors p-10 rounded-[6px] shadow">
      <Svg />
    </div>
  )
}

export default function Result({ calculator }: { calculator: Calculator }) {
  const [inflationHistory, setInflationHistory] = useState<Inflation[]>([])
  const [loading, setLoading] = useState(false)

  const { date, money, country } = calculator

  const noCalculator = !date || !money || !country

  const now = new Date()

  useEffect(() => {
    if (noCalculator) return

    setLoading(true)
    ;(async () => {
      const json = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL.ZG?date=${date.getFullYear()}:${now.getFullYear()}&format=json`)
      const inflationHistory = (await json.json() as [undefined, Inflation[]])[1].toReversed()

      setInflationHistory(inflationHistory)
    })()
    setLoading(false)
  }, [date?.getTime(), money, country])

  if (noCalculator) return

  return (
    <div className="mt-15">
      <Chart inflationHistory={inflationHistory} />
    </div>
  )
}