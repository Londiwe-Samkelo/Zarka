"use client";

import { useStore } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { getRatesOrDefault } from "../../lib/quote";
import { cardClass } from "../ui";

export default function RatesScreen() {
  const state = useStore();
  const t = useT();
  const { rates } = getRatesOrDefault(state);
  return (
    <div className={cardClass}>
      <h2 className="mb-1 text-xl font-bold">{t("ratesT")}</h2>
      <p className="mb-2 text-sm text-mute">
        {state.ratesUpdatedAt ? `${t("ratesUpdated")}: ${new Date(state.ratesUpdatedAt).toLocaleString()}` : t("ratesBuiltIn")}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {Object.entries(rates).map(([country, { currency, rate }]) => (
              <tr key={country} className="border-b border-line">
                <td className="p-2">{country}</td>
                <td className="p-2 font-bold">{rate} {currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
