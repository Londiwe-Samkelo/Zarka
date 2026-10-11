"use client";

import Link from "next/link";
import { useStore } from "../../lib/store";
import ZarkaApp from "../ZarkaApp";
import ButtonPhone from "./ButtonPhone";
import Icon from "../Icons";

const STEPS = [
  { key: "sent", title: "Thandi sends money", text: "Log in, choose Zimbabwe, type 0771234567, review and confirm." },
  { key: "received", title: "Zarka receives it", text: "Both phones get a text. Mai's says money is on its way." },
  { key: "processing", title: "It is on its way", text: "Thandi's tracker moves. Nothing for Mai to do yet." },
  { key: "ready", title: "Ready to collect", text: "Mai gets a text with a pickup code. Thandi is told too." },
  { key: "collected", title: "Mai collects", text: "On her phone: dial *120*9275#, choose 4, type the code. Thandi gets a text." },
];

function currentStep(state) {
  const latest = state.outbox[0] || state.history[0];
  if (!latest) return -1;
  if (state.outbox[0]) return 0;
  return { received: 1, processing: 2, ready: 3, collected: 4 }[latest.status] ?? 1;
}

export default function DemoStage() {
  const state = useStore();
  const step = currentStep(state);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Zarka: both sides of one transfer</h1>
          <p className="mt-1 max-w-2xl text-sm text-mute">
            Left: Thandi in Johannesburg uses the smartphone app. Right: her mother Mai in Harare uses a basic phone with a keypad.
            Everything below is simulated on this computer, including the phone network.
          </p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-zarka-soft">
          <Icon name="arrowLeft" className="h-4 w-4" /> Back to the app
        </Link>
      </div>

      <ol className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Walkthrough">
        {STEPS.map((s, i) => (
          <li key={s.key} className={`rounded-xl border p-4 ${i === step ? "border-zarka bg-zarka-soft" : i < step ? "border-success bg-success-soft" : "border-line bg-card"}`}>
            <div className="flex items-center gap-2">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i <= step ? "bg-zarka text-white" : "bg-line text-mute"}`}>
                {i < step ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="text-sm font-semibold text-foreground">{s.title}</span>
            </div>
            <p className="mt-2 text-xs text-mute">{s.text}</p>
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-10 lg:grid-cols-2">
        <section aria-label="Sender">
          <h2 className="mb-1 text-center text-lg font-semibold text-foreground">Sender: Thandi, Johannesburg</h2>
          <p className="mb-4 text-center text-sm text-mute">Smartphone app. Log in as +27 82 123 4567.</p>
          <div className="relative mx-auto h-[720px] w-[370px] overflow-hidden rounded-[2.2rem] border-[10px] border-neutral-900 bg-background shadow-xl">
            <ZarkaApp embedded />
          </div>
        </section>
        <section aria-label="Receiver">
          <h2 className="mb-1 text-center text-lg font-semibold text-foreground">Receiver: Mai, Harare</h2>
          <p className="mb-4 text-center text-sm text-mute">Basic phone. No data, no app. Texts and USSD only.</p>
          <ButtonPhone defaultNumber="+263771234567" owner="Mai" />
        </section>
      </div>
    </div>
  );
}
