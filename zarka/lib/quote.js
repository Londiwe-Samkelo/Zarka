// Built-in demo rates per R1 (ZAR) so quotes work on the very first offline use.
export const DEFAULT_RATES = {
  Zimbabwe: { currency: "USD", rate: 0.055 },
  Mozambique: { currency: "MZN", rate: 3.5 },
  Malawi: { currency: "MWK", rate: 95 },
  Lesotho: { currency: "LSL", rate: 1 },
  Botswana: { currency: "BWP", rate: 0.75 },
  Namibia: { currency: "NAD", rate: 1 },
  Zambia: { currency: "ZMW", rate: 1.3 },
};
export const DEFAULT_FEE = { minimumZar: 10, percent: 0.04 };

// Cached server rates if we have them, otherwise the built-in ones.
export const getRatesOrDefault = (state) => state.rates || { rates: DEFAULT_RATES, fee: DEFAULT_FEE };

export function calculateQuote(country, amountZar, { rates, fee }) {
  const entry = rates[country] || Object.values(rates)[0];
  const feeZar = amountZar ? Math.max(fee.minimumZar, amountZar * fee.percent) : 0;
  return { fee: feeZar, receive: amountZar * entry.rate, currency: entry.currency };
}
