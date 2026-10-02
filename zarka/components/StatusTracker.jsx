"use client";

import { useT } from "../lib/i18n";

// The 4 stages a transfer goes through. "queued" lives on the phone, the rest come from the server.
export const STAGES = ["queued", "received", "processing", "ready"];

export default function StatusTracker({ status }) {
  const t = useT();
  if (status === "failed") return <p className="mt-2 text-sm font-semibold text-red-600">{t("failed")}</p>;

  const current = Math.max(0, STAGES.indexOf(status));
  return (
    <ol className="mt-3 flex items-start" aria-label={t(`stage_${STAGES[current]}`)}>
      {STAGES.map((stage, i) => {
        const reached = i <= current;
        const checked = i < current || status === "ready";
        return (
          <li key={stage} className="flex-1 text-center">
            <div className="flex items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : reached ? "bg-zarka" : "bg-line"}`} />
              <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${reached ? "bg-zarka text-white" : "bg-line text-mute"}`}>
                {checked ? "✓" : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === STAGES.length - 1 ? "bg-transparent" : i < current ? "bg-zarka" : "bg-line"}`} />
            </div>
            <div className={`mt-1 text-[11px] leading-tight ${i === current ? "font-bold" : "text-mute"}`}>{t(`stage_${stage}`)}</div>
          </li>
        );
      })}
    </ol>
  );
}
