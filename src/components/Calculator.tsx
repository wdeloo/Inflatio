import type { TCountryCode } from "countries-list";
import { useState } from "react";
import Result from "./Result";
import Form from "./Form";

export interface Calculator {
  country: TCountryCode
  money: number
  year: number
}

export default function Calculator() {
  const [calculator, setCalculator] = useState<Calculator>({ country: "US", money: NaN, year: NaN })

  return (
    <section>
      <Form setCalculator={setCalculator} />
      <Result calculator={calculator} />
    </section>
  )
}