import { getCountryData, getCountryDataList, type TCountryCode } from "countries-list";
import countryCodeToFlagEmoji from "country-code-to-flag-emoji";
import { useEffect, useMemo, useRef, useState } from "react";

function CountriesInput({ countryState }: { countryState: [TCountryCode, React.Dispatch<React.SetStateAction<TCountryCode>>] }) {
  const [isOpen, setOpen] = useState(false)
  const [code, setCode] = countryState

  const componentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeCode(e: MouseEvent) {
      const component = componentRef.current
      if (!component) return

      if (component.children[0].contains(e.target as HTMLElement)) return
      if (component.children[1].contains(e.target as HTMLElement)) return

      setOpen(false)
    }

    document.addEventListener("mousedown", closeCode)

    return () => document.removeEventListener("mousedown", closeCode)
  }, [])

  const country = getCountryData(code)

  const countries = useMemo(() => {
    const countryList = getCountryDataList()

    return countryList.map((country, i) => {
      function updateCountry() {
        setCode(country.iso2)
        setOpen(false)
      }

      return (
        <li key={i}>
          <button type="button" className="hover:bg-black/10 rounded-[6px] cursor-pointer w-full text-left transition-colors py-0.5 px-1.5" onClick={updateCountry}>
            <span className="emoji mr-1.5 text-xl -mt-1">
              {countryCodeToFlagEmoji(country.iso2)}
            </span>
            {country.name}
          </button>
        </li>
      )
    })
  }, [])

  return (
    <div className="w-fit text-base font-normal relative" ref={componentRef}>
      <button type="button" className="text-xl cursor-pointer hover:bg-black/10 focus:bg-black/10 px-2 py-1 rounded-[6px] transition-colors flex items-center" onClick={() => setOpen(prev => !prev)}>
        <span className="emoji mr-1.5 text-3xl -mt-1">
          {countryCodeToFlagEmoji(country.iso2)}
        </span>
        {country.name}
      </button>
      <ul className="max-h-80 overflow-y-auto absolute top-[calc(100%+var(--spacing)*2)] left-0 bg-black/5 rounded-[6px] min-w-full w-max max-w-70 shadow p-0.5" style={{ display: isOpen ? '' : 'none' }}>
        {countries}
      </ul>
    </div>
  )
}

function MoneyInput({ moneyState }: { moneyState: [number, React.Dispatch<React.SetStateAction<number>>] }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [money, setMoney] = moneyState

  function updateInput(e: React.ChangeEvent) {
    const value = (e.currentTarget as HTMLInputElement).value
    const money = value.replace(/[^0-9]/g, "")

    setMoney(Number(money) || NaN)
  }

  function formatMoney(money: number) {
    if (isNaN(money)) return ""

    money = Number(money.toString().slice(0, 14))

    return money.toLocaleString()
  }

  function focusInput() {
    const input = inputRef.current

    input?.focus()
  }

  return (
    <div onClick={focusInput} className="flex flex-row items-stretch cursor-text rounded-[6px] text-2xl hover:bg-black/10 focus-within:bg-black/10 transition-colors pl-0.5 pr-2 py-1.5">
      <span className="emoji -mt-0.5 select-none">
        💲
      </span>
      <div className="relative w-fit min-w-8.5">
        <span className="font-normal text-xl opacity-0 h-full block">{formatMoney(money)}</span>
        <input ref={inputRef} value={formatMoney(money)} onChange={updateInput} type="text" placeholder="100" className="outline-none placeholder:text-black/50 group font-normal text-xl w-full absolute left-0 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}

function DateInput({ dateState }: { dateState: [Date | null, React.Dispatch<React.SetStateAction<Date | null>>] }) {
  const now = new Date()
  const before5 = new Date(now)
  before5.setFullYear(before5.getFullYear() - 5)

  const [isOpen, setOpen] = useState(false)
  const [year, setYear] = useState(before5.getFullYear())
  const [date, setDate] = dateState

  const componentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeCode(e: MouseEvent) {
      const component = componentRef.current
      if (!component) return

      if (component.children[0].contains(e.target as HTMLElement)) return
      if (component.children[1].contains(e.target as HTMLElement)) return

      setOpen(false)
    }

    document.addEventListener("mousedown", closeCode)

    return () => document.removeEventListener("mousedown", closeCode)
  }, [])

  function decreaseYear() {
    setYear(prev => Math.max(1960, prev - 1))
  }

  function increaseYear() {
    setYear(prev => Math.min(now.getFullYear() - 1, prev + 1))
  }

  function getMonthName(month: number) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return months[month] ?? '';
  }

  return (
    <div className="relative" ref={componentRef}>
      <button type="button" className="flex flex-row text-xl gap-1.5 font-normal items-center cursor-pointer rounded-[6px] hover:bg-black/10 focus-within:bg-black/10 transition-colors p-2 py-1.5" onClick={() => setOpen(prev => !prev)}>
        <span className="emoji select-none text-2xl">
          📆
        </span>
        {date ? <span>{getMonthName(date.getMonth()).slice(0, 3)}, {date.getFullYear()}</span> : <span className="text-black/50">{getMonthName(before5.getMonth()).slice(0, 3)}, {before5.getFullYear()}</span>}
      </button>
      <div className="absolute top-[calc(100%+var(--spacing)*2)] select-none left-1/2 -translate-x-1/2 bg-black/5 rounded-[6px] w-max shadow p-0.5" style={{ display: isOpen ? '' : 'none' }}>
        <div className="flex flex-row justify-center items-stretch my-1 text-xl gap-1">
          <button onClick={decreaseYear} type="button" className="content-center px-2 group cursor-pointer">
            <svg fill="none" className="stroke-black/50 group-hover:stroke-black transition-colors" strokeLinecap="round" strokeWidth={2} strokeLinejoin="round" viewBox="0 0 7 10" height={15}>
              <path d="M 5 2 L 2 5 L 5 8" />
            </svg>
          </button>
          <div className="w-[4ch] text-center tracking-tight">
            {year}
          </div>
          <button onClick={increaseYear} type="button" className="content-center px-2 group cursor-pointer">
            <svg fill="none" className="stroke-black/50 group-hover:stroke-black transition-colors" strokeLinecap="round" strokeWidth={2} strokeLinejoin="round" viewBox="0 0 7 10" height={15}>
              <path d="M 2 2 L 5 5 L 2 8" />
            </svg>
          </button>
        </div>
        <ul className="grid grid-cols-3 text-base font-normal">
          {Array.from({ length: 12 }).map((_, i) => {
            function updateDate() {
              const date = new Date()
              date.setFullYear(year)
              date.setMonth(i)

              setDate(date)
              setOpen(false)
            }

            return (
              <li key={i}>
                <button onClick={updateDate} type="button" className="hover:bg-black/10 rounded-[6px] cursor-pointer w-full text-left transition-colors py-0.5 px-1.5">
                  {getMonthName(i)}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default function Form() {
  const [country, setCountry] = useState<TCountryCode>("US")
  const [money, setMoney] = useState<number>(NaN)
  const [date, setDate] = useState<Date | null>(null)

  return (
    <form className="text-2xl font-medium flex flex-row items-center">
      In
      <span className="inline-block mx-2">
        <CountriesInput countryState={[country, setCountry]} />
      </span>
      I've had
      <span className="inline-block mx-2">
        <MoneyInput moneyState={[money, setMoney]} />
      </span>
      in the bank since
      <span className="inline-block mx-2">
        <DateInput dateState={[date, setDate]} />
      </span>
      .
    </form>
  )
}