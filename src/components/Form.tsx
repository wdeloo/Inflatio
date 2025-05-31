import { getCountryData, getCountryDataList, type TCountryCode } from "countries-list";
import countryCodeToFlagEmoji from "country-code-to-flag-emoji";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { type Calculator } from "./Calculator";
import LookFor from "lookfor-js";

function CountriesInput({ countryState }: { countryState: [TCountryCode, React.Dispatch<React.SetStateAction<TCountryCode>>] }) {
  const [isOpen, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [code, setCode] = countryState

  const componentRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (isOpen) focusSearch()
  }, [isOpen])

  function focusSearch() {
    const search = searchRef.current

    search?.focus()
  }

  function handleSearch(e: React.ChangeEvent) {
    const search = e.currentTarget as HTMLInputElement

    setSearch(search.value)
  }

  const country = getCountryData(code)

  
  const countries = useMemo(() => {
    const countryList = getCountryDataList()

    const lookfor = new LookFor({ tag: "h" }, { detectAccents: false, keySensitive: false })

    return countryList.map((country, i) => {

      function updateCountry() {
        setCode(country.iso2)
        setOpen(false)
      }

      if (search) {
        const highlightedCountry = lookfor.highlight(country.name, search)
        if (highlightedCountry.length === country.name.length) return
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
  }, [search])

  return (
    <div className="w-fit text-base font-normal relative" ref={componentRef}>
      <button type="button" className="text-xl cursor-pointer hover:bg-black/10 focus:bg-black/10 px-2 py-1.5 rounded-[6px] transition-colors flex items-center" onClick={() => setOpen(prev => !prev)}>
        <span className="emoji mr-1.5 text-2xl">
          {countryCodeToFlagEmoji(country.iso2)}
        </span>
        {country.name}
      </button>
      <div style={{ display: isOpen ? '' : 'none' }} className="absolute z-20 top-[calc(100%+var(--spacing)*2)] left-0 bg-white rounded-[6px] min-w-full w-max max-w-70 shadow overflow-hidden">
        <div className="bg-black/5 p-0.5">
          <search onClick={focusSearch} className="mb-0.5 flex cursor-text flex-row bg-black/10 rounded-[6px] w-full px-1.5 py-0.5 gap-1.5">
            <img src="images/search.svg" width={24.9} className="scale-110" />
            <input value={search} onChange={handleSearch} ref={searchRef} type="text" className="outline-none" />
          </search>
          <ul className="w-full h-full max-h-72 overflow-y-auto">
            {countries}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function formatMoney(money: number) {
  if (isNaN(money)) return ""

  money = Number(Math.round(money).toString().slice(0, 14))

  return money.toLocaleString()
}

function MoneyInput({ moneyState }: { moneyState: [number, React.Dispatch<React.SetStateAction<number>>] }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [money, setMoney] = moneyState

  function updateInput(e: React.ChangeEvent) {
    const value = (e.currentTarget as HTMLInputElement).value
    const money = value.replace(/[^0-9]/g, "")

    setMoney(Number(money) || NaN)
  }

  function focusInput() {
    const input = inputRef.current

    input?.focus()
  }

  return (
    <div onClick={focusInput} className="flex flex-row items-stretch cursor-text rounded-[6px] text-2xl hover:bg-black/10 focus-within:bg-black/10 transition-colors pl-0.5 pr-2 py-1.5">
      <span className="emoji select-none -translate-y-px">
        💲
      </span>
      <div className="relative w-fit min-w-8.5">
        <span className="font-normal text-xl opacity-0 h-full block">{formatMoney(money)}</span>
        <input ref={inputRef} value={formatMoney(money)} onChange={updateInput} type="text" placeholder="100" className="outline-none placeholder:text-black/50 group font-normal text-xl w-full absolute left-0 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}

function YearInput({ yearState }: { yearState: [number, React.Dispatch<React.SetStateAction<number>>] }) {
  const MIN_YEAR = 1960
  const MAX_YEAR_DIFF = 1

  const now = new Date()
  const before = new Date(now)
  before.setFullYear(before.getFullYear() - 20)

  const [year, setYear] = yearState

  const inputRef = useRef<HTMLInputElement>(null)

  function updateInput(e: React.ChangeEvent) {
    const value = (e.currentTarget as HTMLInputElement).value
    const year = value.replace(/[^0-9]/g, "")

    setYear(Number(year) || NaN)
  }

  function focusInput() {
    const input = inputRef.current

    input?.focus()
  }

  function formatYear(year: number) {
    if (isNaN(year)) return ""
    return year
  }

  function updateInputLegal() {
    setYear(prev => {
      if (isNaN(prev)) return NaN
      return Math.max(Math.min(prev, now.getFullYear() - MAX_YEAR_DIFF), MIN_YEAR)
    })
  }

  return (
    <div onClick={focusInput} className="flex flex-row items-stretch cursor-text rounded-[6px] text-2xl hover:bg-black/10 focus-within:bg-black/10 transition-colors pl-1.5 pr-2 py-1.5">
      <span className="emoji select-none text-2xl mr-1.5">
        📆
      </span>
      <div className="relative w-fit min-w-12.25">
        <span className="font-normal text-xl opacity-0 h-full block">{year}</span>
        <input ref={inputRef} onBlur={updateInputLegal} value={formatYear(year)} onChange={updateInput} type="text" placeholder={before.getFullYear().toString()} className="outline-none placeholder:text-black/50 group font-normal text-xl w-full absolute left-0 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}

export default function Form({ setCalculator }: { setCalculator: Dispatch<SetStateAction<Calculator>> }) {
  const [country, setCountry] = useState<TCountryCode>("US")
  const [money, setMoney] = useState<number>(NaN)
  const [year, setYear] = useState<number>(NaN)

  function submit(e: React.FormEvent) {
    e.preventDefault()

    if (!country || !money || !year) return

    setCalculator({ country, money, year })
  }

  function preventEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter") e.preventDefault()
  }

  return (
    <form onKeyDown={preventEnter} onSubmit={submit} className="flex flex-col items-center">
      <div className="text-2xl font-medium text-balance text-center mb-10">
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
          <YearInput yearState={[year, setYear]} />
        </span>
        .
      </div>

      <button className="py-1 px-2 cursor-pointer bg-black/5 hover:bg-black/10 flex flex-row items-center gap-1 transition-colors text-lg rounded-[6px]" type="submit">
        <img src="/logo.svg" width="20px" /> Calculate
      </button>
    </form>
  )
}