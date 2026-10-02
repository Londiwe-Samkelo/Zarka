import { RATES, FEE } from "../config.js";

export const getRates = () => RATES;
export const getCountryList = () => Object.keys(RATES);

export function quoteTransfer(country, amountZar) {
  const entry = RATES[country];
  if (!entry) return null;
  const fee = Math.max(FEE.minimumZar, amountZar * FEE.percent);
  return {
    fee: +fee.toFixed(2),
    receive: +(amountZar * entry.rate).toFixed(2),
    currency: entry.currency,
  };
}
