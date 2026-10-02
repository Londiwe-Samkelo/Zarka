"use client";

import { useStore, navigateTo } from "../lib/store";
import { translate } from "../lib/i18n";

const ITEMS = [
  { view: "home", icon: "🏠", label: "home" },
  { view: "send", icon: "💸", label: "send" },
  { view: "history", icon: "🧾", label: "history" },
  { view: "help", icon: "💬", label: "help" },
];

export default function BottomNav() {
  const { view, language } = useStore();
  return (
    <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map((item) => (
        <button
          key={item.view}
          onClick={() => navigateTo(item.view)}
          className={`flex-1 p-2 text-xs ${view === item.view ? "font-extrabold text-zarka" : "text-mute"}`}
        >
          <span className="block text-xl">{item.icon}</span>
          {translate(language, item.label)}
        </button>
      ))}
    </nav>
  );
}
