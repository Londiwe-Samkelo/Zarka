"use client";

import { useStore, navigateTo } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { transferRef } from "../../lib/phone";
import StatusTracker from "../StatusTracker";
import Icon from "../Icons";
import { cardClass, buttonClass, secondaryButtonClass, headingClass } from "../ui";

export default function ConfirmScreen() {
  const { outbox, history, lastTransferId } = useStore();
  const t = useT();
  const waiting = outbox.find((item) => item.id === lastTransferId);
  const transfer = waiting || history.find((item) => item.id === lastTransferId);
  if (!transfer) return null;
  const status = waiting ? "queued" : transfer.status;

  return (
    <div className={`${cardClass} text-center`}>
      <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${waiting ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>
        <Icon name={waiting ? "clock" : "check"} className="h-7 w-7" />
      </span>
      <h2 className={`${headingClass} mt-4`}>{t(waiting ? "confirmTitleSaved" : "confirmTitleSent")}</h2>
      <p className="mt-2 text-mute">{t(waiting ? "confirmBodySaved" : "confirmBodySent").replace("{name}", transfer.to)}</p>
      <p className="mt-4 text-sm text-mute">
        {t("refLabel")}: <span className="font-mono font-semibold text-foreground">{transfer.ref || transferRef(transfer.id)}</span>
      </p>
      <StatusTracker status={status} />
      <div className="mt-6 space-y-3">
        <button onClick={() => navigateTo("history")} className={buttonClass}>{t("trackBtn")}</button>
        <button onClick={() => navigateTo("send")} className={secondaryButtonClass}>{t("anotherBtn")}</button>
      </div>
    </div>
  );
}
