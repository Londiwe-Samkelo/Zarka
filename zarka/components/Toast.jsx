"use client";

import { useStore } from "../lib/store";

export default function Toast() {
  const { toast } = useStore();
  return (
    <div
      role="status"
      className={`pointer-events-none fixed bottom-24 left-1/2 max-w-[90%] -translate-x-1/2 rounded-full bg-[#2b1a0e] px-4 py-2.5 text-sm text-white transition-opacity ${toast ? "opacity-100" : "opacity-0"}`}
    >
      {toast}
    </div>
  );
}
