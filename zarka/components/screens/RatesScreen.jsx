"use client";

import { useStore } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { getRatesOrDefault } from "../../lib/quote";
import { cardClass, headingClass } from "../ui";

export default function RatesScreen() {
  const state = useStore();
  const t = useT();
  const { rates } = getRatesOrDefault(state);
  return (
    <div className={cardClass}>
      <h2 className={headingClass}>{t("ratesT")}</h2>
      <p className="mb-3 mt-1 text-sm text-mute">
        {state.ratesUpdatedAt ? `${t("ratesUpdated")}: ${new Date(state.ratesUpdatedAt).toLocaleString()}` : t("ratesBuiltIn")}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <tbody>
            {Object.entries(rates).map(([country, { currency, rate }]) => (
              <tr key={country} className="border-b border-line last:border-b-0">
                <th scope="row" className="py-3 pr-3 font-medium text-foreground">{country}</th>
                <td className="py-3 text-right font-semibold text-foreground">{rate} {currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
