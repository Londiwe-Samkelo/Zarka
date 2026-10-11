"use client";

import { useStore, navigateTo } from "../lib/store";
import { translate } from "../lib/i18n";
import Icon from "./Icons";

const ITEMS = [
  { view: "home", icon: "home", label: "home" },
  { view: "send", icon: "send", label: "navSend" },
  { view: "collect", icon: "cash", label: "navCollect" },
  { view: "history", icon: "clock", label: "history" },
  { view: "help", icon: "help", label: "help" },
];

export default function BottomNav({ embedded = false }) {
  const { view, language, incoming } = useStore();
  const ready = incoming.filter((i) => i.status === "ready").length;
  const position = embedded ? "w-full" : "fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2";
  return (
    <nav aria-label="Main" className={`${position} flex border-t border-line bg-card pb-[env(safe-area-inset-bottom)]`}>
      {ITEMS.map((item) => {
        const active = view === item.view || (item.view === "send" && view === "confirm");
        return (
          <button
            key={item.view}
            onClick={() => navigateTo(item.view)}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium ${active ? "text-zarka" : "text-mute"}`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {translate(language, item.label)}
            {item.view === "collect" && ready > 0 && (
              <span className="absolute right-[26%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{ready}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
