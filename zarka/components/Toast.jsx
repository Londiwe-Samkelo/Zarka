"use client";

import { useStore } from "../lib/store";

export default function Toast({ embedded = false }) {
  const { toast } = useStore();
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none ${embedded ? "absolute" : "fixed"} bottom-24 left-1/2 max-w-[90%] -translate-x-1/2 rounded-xl bg-[#1f1a16] px-4 py-2.5 text-center text-sm text-white shadow-lg transition-opacity ${toast ? "opacity-100" : "opacity-0"}`}
    >
      {toast}
    </div>
  );
}
