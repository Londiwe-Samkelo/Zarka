"use client";

import { useT } from "../lib/i18n";
import Icon from "./Icons";

// Sender sees four steps: "queued" lives on the phone, the rest come from the server.
export const STAGES = ["queued", "received", "processing", "ready"];
// Receiver sees three steps.
const RECEIVER_STAGES = ["processing", "ready", "collected"];

export default function StatusTracker({ status, variant = "sender" }) {
  const t = useT();
  if (status === "failed") return <p className="mt-3 text-sm font-semibold text-danger">{t("failed")}</p>;

  const receiver = variant === "receiver";
  const stages = receiver ? RECEIVER_STAGES : STAGES;
  const done = status === "collected"; // the last step is complete too
  const current = Math.max(0, stages.indexOf(receiver ? status : status === "collected" ? "ready" : status));
  const labelFor = (stage) => {
    if (!receiver) return t(stage === "ready" && done ? "stage_collected" : `stage_${stage}`);
    return t(`receiverStage_${stage}`);
  };

  return (
    <ol className="mt-4 flex items-start" aria-label={labelFor(stages[current], current)}>
      {stages.map((stage, i) => {
        const reached = i <= current;
        const checked = i < current || (i === current && (done || (receiver && stage === "collected")));
        return (
          <li key={stage} className="flex-1 text-center">
            <div className="flex items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : reached ? "bg-zarka" : "bg-line"}`} />
              <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${reached ? "bg-zarka text-white" : "bg-line text-mute"}`}>
                {checked ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === stages.length - 1 ? "bg-transparent" : i < current ? "bg-zarka" : "bg-line"}`} />
            </div>
            <div className={`mt-1.5 text-[11px] leading-tight ${i === current ? "font-semibold text-foreground" : "text-mute"}`}>{labelFor(stage)}</div>
          </li>
        );
      })}
    </ol>
  );
}
