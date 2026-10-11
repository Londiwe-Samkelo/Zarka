"use client";

import { useEffect, useRef, useState } from "react";

const DIAL_CODE = "*120*9275#";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const keyClass = "rounded-lg bg-neutral-700 py-2.5 text-base font-semibold text-white active:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

async function post(url, body) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return response;
}

// A basic phone with a keypad: dial the USSD code, read texts. It talks to the same server a real phone network would.
export default function ButtonPhone({ defaultNumber = "+263771234567", owner = "Receiver" }) {
  const [number, setNumber] = useState(defaultNumber);
  const [screen, setScreen] = useState("home"); // home | inbox | ussd
  const [messages, setMessages] = useState([]);
  const [seen, setSeen] = useState(0);
  const [typed, setTyped] = useState("");
  const [ussd, setUssd] = useState({ sid: "", text: "", display: "", ended: false });
  const [smsText, setSmsText] = useState("");
  const [notice, setNotice] = useState("");
  const chatEnd = useRef(null);

  // Poll this phone's inbox, the way a phone would receive texts.
  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const response = await fetch(`/sim/inbox?phone=${encodeURIComponent(number)}`, { cache: "no-store" });
        const data = await response.json();
        if (!stop) setMessages(data.messages || []);
      } catch { /* server not running yet */ }
    }
    load();
    const timer = setInterval(load, 1500);
    return () => { stop = true; clearInterval(timer); };
  }, [number]);

  const received = messages.filter((m) => m.from === "Zarka").length;
  useEffect(() => { chatEnd.current?.scrollIntoView?.({ block: "end" }); }, [messages, screen]);
  const unread = screen === "inbox" ? 0 : Math.max(0, received - seen); // messages open on screen count as read
  const leaveInbox = () => { if (screen === "inbox") setSeen(received); };

  async function callUssd(sid, text) {
    try {
      const response = await post("/sim/ussd", { sessionId: sid, phoneNumber: number, text });
      const reply = await response.text();
      setUssd({ sid, text, display: reply.replace(/^(CON|END) /, ""), ended: reply.startsWith("END") });
    } catch {
      setUssd({ sid, text, display: "Connection problem.", ended: true });
    }
  }

  function startUssd() {
    leaveInbox();
    setNotice("");
    setScreen("ussd");
    setTyped("");
    callUssd(`btn-${Date.now()}`, "");
  }

  function pressCall() {
    if (screen === "ussd" && !ussd.ended) {
      if (!typed) return;
      callUssd(ussd.sid, ussd.text ? `${ussd.text}*${typed}` : typed);
      return setTyped("");
    }
    if (typed === DIAL_CODE) return startUssd();
    leaveInbox();
    if (typed) setNotice("Number not available");
    setScreen("home");
    setTyped("");
  }

  function pressEnd() {
    leaveInbox();
    setScreen("home");
    setTyped("");
    setNotice("");
    setUssd({ sid: "", text: "", display: "", ended: false });
  }

  async function sendSms() {
    if (!smsText.trim()) return;
    await post("/sim/sms", { from: number, text: smsText.trim() });
    setSmsText("");
    setSeen(received + 2); // our own text and Zarka's reply will both be on screen
    setScreen("inbox");
  }

  return (
    <div className="mx-auto w-[300px]">
      <label className="mb-1 block text-xs font-semibold text-mute" htmlFor="bp-number">{owner}: this phone&apos;s number</label>
      <input id="bp-number" value={number} onChange={(e) => { setNumber(e.target.value.trim()); pressEnd(); }}
        className="mb-3 w-full rounded-lg border border-line bg-card px-3 py-2 font-mono text-sm text-foreground" />

      <div className="rounded-[2rem] bg-neutral-800 p-5 shadow-xl">
        <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">Basic phone</div>
        <div className="h-60 overflow-y-auto rounded-md border-4 border-neutral-600 bg-[#d3e6cc] p-3 font-mono text-[13px] leading-snug text-[#16301a]" aria-live="polite">
          {screen === "home" && (
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="font-bold">Zarka Mobile</div>
                <div>{number}</div>
                {notice && <div className="mt-2 font-bold">{notice}</div>}
                {typed && <div className="mt-2 break-all text-lg">{typed}</div>}
              </div>
              <div>{unread > 0 ? `${unread} new message${unread > 1 ? "s" : ""}` : "No new messages"}</div>
            </div>
          )}
          {screen === "inbox" && (
            <div>
              <div className="mb-1 font-bold">Messages</div>
              {messages.length === 0 && <div>Empty</div>}
              {messages.map((m) => (
                <div key={m.id} className="mb-2 border-b border-[#16301a]/30 pb-1">
                  <div className="text-[11px] font-bold">{m.to === "Zarka" ? "To Zarka" : "From Zarka"}</div>
                  <div className="whitespace-pre-wrap break-words">{m.message}</div>
                </div>
              ))}
              <div ref={chatEnd} />
            </div>
          )}
          {screen === "ussd" && (
            <div className="flex h-full flex-col justify-between">
              <div className="whitespace-pre-wrap break-words">{ussd.display || "Connecting..."}</div>
              <div className="mt-2 border-t border-[#16301a]/40 pt-1">{ussd.ended ? "Press end" : `Reply: ${typed}_`}</div>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => { setSeen(received); setScreen("inbox"); setNotice(""); }} className={keyClass}>
            Messages{unread > 0 ? ` (${unread})` : ""}
          </button>
          <button onClick={() => { leaveInbox(); setTyped(DIAL_CODE); setScreen("home"); setNotice(""); }} className={keyClass}>Type {DIAL_CODE}</button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={pressCall} aria-label="Call or send" className="rounded-lg bg-green-700 py-2.5 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">OK</button>
          <button onClick={() => setTyped((v) => v.slice(0, -1))} aria-label="Delete" className={keyClass}>C</button>
          <button onClick={pressEnd} aria-label="End" className="rounded-lg bg-red-700 py-2.5 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">End</button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <button key={k} onClick={() => setTyped((v) => (v + k).slice(0, 40))} className={keyClass}>{k}</button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="bp-sms" className="mb-1 block text-xs font-semibold text-mute">Send a text to Zarka (for example STATUS or COLLECT 123456)</label>
        <div className="flex gap-2">
          <input id="bp-sms" value={smsText} onChange={(e) => setSmsText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendSms()}
            className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground" />
          <button onClick={sendSms} className="rounded-lg bg-zarka px-4 py-2 text-sm font-semibold text-white hover:bg-zarka-dark">Send</button>
        </div>
      </div>
    </div>
  );
}
