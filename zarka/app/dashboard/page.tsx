"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Language, Transaction, RemittanceStatus } from "@/types/remittance";
import { getLiveFxRate, calculateRemittance } from "@/lib/fxService";
import { getTranslation } from "@/lib/i18n";
import { StatusTracker } from "@/components/StatusTracker";
import { UssdSimModal } from "@/components/UssdSimModal";

export default function DashboardPage() {
    const [lang, setLang] = useState<Language>("en");
    // 1. Initialize with a stable initial value to avoid SSR mismatch
    const [fxRate, setFxRate] = useState({ zarToUsd: 0.054 });
    const [sendAmount, setSendAmount] = useState<number>(500);
    const [recipientName, setRecipientName] = useState("Zenani Ndebele");
    const [recipientPhone, setRecipientPhone] = useState("+263 77 123 4567");
    const [activeTx, setActiveTx] = useState<Transaction | null>(null);
    const [isUssdOpen, setIsUssdOpen] = useState(false);
    const [lowDataMode, setLowDataMode] = useState(false);

    const t = getTranslation(lang);
    const calc = calculateRemittance(sendAmount, fxRate.zarToUsd);

    // 2. Fetch live rate on mount and trigger interval ticks client-side only
    useEffect(() => {
        setFxRate(getLiveFxRate());

        const interval = setInterval(() => {
            setFxRate(getLiveFxRate());
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const handleSendMoney = () => {
        const newTx: Transaction = {
            id: "ZRK-" + Math.floor(100000 + Math.random() * 900000),
            senderName: "Thandi",
            receiverName: recipientName,
            receiverPhone: recipientPhone,
            sendAmountZAR: calc.sendAmountZAR,
            receiveAmountUSD: calc.receiveAmountUSD,
            exchangeRate: calc.exchangeRate,
            feeZAR: calc.feeZAR,
            status: "INITIATED",
            createdAt: new Date().toISOString(),
            pickupCode: "HAR-" + Math.floor(1000 + Math.random() * 9000),
        };
        setActiveTx(newTx);
    };

    const advanceStatus = () => {
        if (!activeTx) return;
        const steps: RemittanceStatus[] = [
            "INITIATED",
            "IN_TRANSIT",
            "READY_FOR_COLLECTION",
            "COLLECTED",
        ];
        const currentIndex = steps.indexOf(activeTx.status);
        if (currentIndex < steps.length - 1) {
            setActiveTx({
                ...activeTx,
                status: steps[currentIndex + 1],
            });
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-black overflow-hidden">
            {/* Ambient background glow matching landing page */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

            {/* Header */}
            <header className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-4 py-4 border-b border-slate-800/80 backdrop-blur-md">
                <Link href="/" className="flex items-center gap-3 group transition-transform">
                    {/* New ZARKA SVG Logo */}
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 64 64"
                        role="img"
                        aria-label="Zarka logo"
                        fill="none"
                        className="group-hover:scale-105 transition-transform"
                    >
                        <rect width="64" height="64" rx="16" fill="#10b981"></rect>
                        <path
                            d="M18 16H44L18 44H46"
                            stroke="#04130C"
                            strokeWidth="5.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                        <path
                            d="M39.5 37.5L46 44L39.5 50.5"
                            stroke="#04130C"
                            strokeWidth="5.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                    </svg>

                    <div>
                        <h1 className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-emerald-400">
                            ZARKA
                        </h1>
                        <p className="text-xs text-slate-400 group-hover:text-emerald-400 transition-colors">
                            Back to Home
                        </p>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setLowDataMode(!lowDataMode)}
                        className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-medium ${
                            lowDataMode
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10"
                                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                        }`}
                    >
                        {lowDataMode ? t.lowDataMode : "Standard Data"}
                    </button>

                    <div className="flex bg-slate-900/90 border border-slate-800 rounded-full p-1 text-xs shadow-inner">
                        {(["en", "sn", "zu"] as Language[]).map((l) => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={`px-3 py-1 rounded-full uppercase font-medium transition-all ${
                                    lang === l
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Grid */}
            <main className="w-full max-w-5xl my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Container */}
                <div className="lg:col-span-7 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                                {t.title}
                            </h2>
                            <p className="text-sm text-slate-400">{t.subtitle}</p>
                        </div>
                        <div className="bg-emerald-950/40 border border-emerald-800/50 px-3.5 py-2 rounded-2xl shadow-inner text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                                    Live FX
                                </span>
                            </div>
                            <span className="text-sm font-mono font-bold text-emerald-300">
                                1 ZAR = ${fxRate.zarToUsd} USD
                            </span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Send Amount Input */}
                        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 focus-within:border-emerald-500/60 transition-all shadow-inner">
                            <label className="text-xs text-slate-400 block mb-1 font-medium">
                                {t.sendAmount}
                            </label>
                            <div className="flex items-center justify-between gap-4">
                                <input
                                    type="number"
                                    value={sendAmount}
                                    onChange={(e) => setSendAmount(Number(e.target.value))}
                                    className="bg-transparent text-2xl font-bold font-mono text-white focus:outline-none w-full"
                                />
                                <span className="bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm">
                                    ZAR (R)
                                </span>
                            </div>
                        </div>

                        {/* Calculation Breakdown */}
                        <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-2.5 text-sm backdrop-blur-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>{t.feeLabel}</span>
                                <span className="font-mono text-emerald-400 font-medium">
                                    R{calc.feeZAR}.00
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>{t.rateLabel}</span>
                                <span className="font-mono text-slate-300">
                                    1 ZAR = ${calc.exchangeRate} USD
                                </span>
                            </div>
                            <div className="border-t border-slate-800/80 pt-2.5 flex justify-between font-bold text-slate-200">
                                <span>{t.totalToPay}</span>
                                <span className="font-mono text-white">
                                    R{calc.sendAmountZAR}.00
                                </span>
                            </div>
                        </div>

                        {/* Receive Amount Display */}
                        <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-800/40 rounded-2xl p-4">
                            <label className="text-xs text-emerald-400 block mb-1 font-medium">
                                {t.receiveAmount}
                            </label>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-extrabold font-mono text-emerald-300">
                                    ${calc.receiveAmountUSD}
                                </span>
                                <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3.5 py-1.5 rounded-xl text-sm font-bold shadow-sm">
                                    USD ($)
                                </span>
                            </div>
                        </div>

                        {/* Recipient Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                                    {t.recipientName}
                                </label>
                                <input
                                    type="text"
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                                    {t.recipientPhone}
                                </label>
                                <input
                                    type="text"
                                    value={recipientPhone}
                                    onChange={(e) => setRecipientPhone(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSendMoney}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all transform active:scale-[0.99] text-base"
                        >
                            {t.sendButton}
                        </button>

                        <p className="text-center text-xs text-slate-500 italic">
                            {t.noHiddenFees}
                        </p>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-5 space-y-6">
                    {activeTx ? (
                        <div className="space-y-4">
                            <StatusTracker
                                status={activeTx.status}
                                lang={lang}
                                onAdvanceStatus={advanceStatus}
                            />

                            <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 text-sm space-y-3.5 backdrop-blur-xl shadow-xl">
                                <div className="flex justify-between items-center text-slate-400 pb-3 border-b border-slate-800/80">
                                    <span>Transaction ID</span>
                                    <span className="font-mono text-white font-bold">
                                        {activeTx.id}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>{t.pickupCode}</span>
                                    <span className="font-mono text-emerald-400 font-extrabold text-base bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800/60 shadow-inner">
                                        {activeTx.pickupCode}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>Recipient</span>
                                    <span className="text-white font-medium">
                                        {activeTx.receiverName}
                                    </span>
                                </div>

                                <a
                                    href={`https://wa.me/${activeTx.receiverPhone.replace(/\s+/g, "")}?text=Hi%20${encodeURIComponent(activeTx.receiverName)},%20Thandi%20has%20sent%20you%20$${activeTx.receiveAmountUSD}%20USD.%20Your%20pickup%20code%20is%20${activeTx.pickupCode}.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-xl font-bold text-xs transition-colors shadow-sm"
                                >
                                    {t.notifyRecipient}
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/30 border border-slate-800/80 border-dashed rounded-3xl p-8 text-center text-slate-500 backdrop-blur-sm">
                            <p className="text-sm font-medium">No active transfer.</p>
                            <p className="text-xs text-slate-600 mt-1">
                                Fill out the form to initiate a new remittance.
                            </p>
                        </div>
                    )}

                    <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
                        <h3 className="text-sm font-bold text-white mb-1">
                            Low-Data & Feature Phone Modes
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                            No data? Access transfers instantly via USSD simulation.
                        </p>
                        <button
                            onClick={() => setIsUssdOpen(true)}
                            className="w-full py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 rounded-xl font-mono text-xs font-bold transition-all hover:border-emerald-500/40 flex items-center justify-center gap-2 shadow-inner"
                        >
                            {t.ussdSim}
                        </button>
                    </div>
                </div>
            </main>

            <footer className="w-full max-w-5xl py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
                {new Date().getFullYear()} ZARKA. All rights reserved.
            </footer>

            <UssdSimModal isOpen={isUssdOpen} onClose={() => setIsUssdOpen(false)} />
        </div>
    );
}