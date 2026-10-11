"use client";

import { COUNTRIES } from "../lib/phone";
import { phoneInputClass } from "./ui";

// Shows the country's dial code in front of the number, so people only type the rest.
// Pasting a full +263... number works too.
export default function PhoneField({ id, country, value, onChange, label }) {
  const info = COUNTRIES[country];
  return (
    <div className="flex">
      <span className="grid shrink-0 place-items-center rounded-l-xl border border-r-0 border-line bg-zarka-soft px-3 text-base font-semibold text-foreground">
        {info?.dial}
      </span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="tel"
        autoComplete="tel-national"
        aria-label={label}
        placeholder={info?.example}
        className={phoneInputClass}
      />
    </div>
  );
}
