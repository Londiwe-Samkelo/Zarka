// Simple line icons (no emoji). Usage: <Icon name="send" className="h-5 w-5" />
const PATHS = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  cash: "M2 7h20v10H2z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M6 12h.01 M18 12h.01",
  phone: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M11 18h2",
  bill: "M6 2h12v20l-3-2-3 2-3-2-3 2V2z M9 7h6 M9 11h6",
  chart: "M3 3v18h18 M7 14l4-4 3 3 5-6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7 M12 17h.01",
  check: "M5 13l4 4L19 7",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4",
  wifi: "M2 9a15 15 0 0 1 20 0 M5.5 12.5a10 10 0 0 1 13 0 M9 16a5 5 0 0 1 6 0 M12 19.5h.01",
  wifiOff: "M2 9a15 15 0 0 1 4-2.8 M10 5.2a15 15 0 0 1 12 3.8 M5.5 12.5a10 10 0 0 1 3-1.8 M14 10.7a10 10 0 0 1 4.5 1.8 M9 16a5 5 0 0 1 6 0 M12 19.5h.01 M3 3l18 18",
  lock: "M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4",
  message: "M4 4h16v12H8l-4 4V4z",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  arrowLeft: "M19 12H5 M11 6l-6 6 6 6",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

export default function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
