import React from "react";
import Link from "next/link";

export default function Landing() {
    return (
        <div
            className="min-h-screen bg-[#0A1411] text-[#EAF2EE] flex flex-col justify-between selection:bg-[#3DDC97] selection:text-[#04130C] font-['DM_Sans',sans-serif] relative overflow-x-hidden"
            style={{
                background:
                    'linear-gradient(rgba(10, 20, 17, 0.75), rgba(10, 20, 17, 0.9)), url("https://lh3.googleusercontent.com/aida/AEtjO1WaO5uqvg67PXob64Jg3MYamvlio55vunZlCAq3z8-ifIOkx2_2st44zTkPSfBh0OWHeWZZpmunHhLMb6GAOUI7_7ykZ5vQho4Li4qwhcHalQET9GiC6rdg13ru3KUNHkEFaHI1tH_5WLxqxaF3ZX88WzG99HqaxmXb2p4dMcgHgb9BfYI1m4nxOuK0asjy1UsJp-iBKJJCCB58btwnpqIMdA0Hba4eb3xGxApcfeVomvrwqSjKFPP7Nw4") center center / cover no-repeat fixed rgb(10, 20, 17)',
            }}
        >
            {/* Top Ambient Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-[#3DDC97]/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

            {/* Header */}
            <header className="w-full max-w-[1120px] mx-auto px-6 sm:px-8 pt-10 pb-6 flex items-center justify-center">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#3DDC97] flex items-center justify-center shadow-lg shadow-[#3DDC97]/20 transition-transform group-hover:scale-105 duration-200">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 64 64"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M18 16H44L18 44H46"
                                stroke="#04130C"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M39.5 37.5L46 44L39.5 50.5"
                                stroke="#04130C"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <span className="font-heading font-extrabold text-3xl sm:text-4xl tracking-[0.06em] text-[#EAF2EE]">
            ZARKA
          </span>
                </Link>
            </header>

            {/* Hero Main Section */}
            <main className="w-full max-w-[1120px] mx-auto px-6 sm:px-8 py-12 lg:py-20 flex flex-col items-center justify-center text-center gap-12 flex-1">
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto">
                    <h1 className="font-heading font-extrabold text-5xl sm:text-6xl lg:text-[68px] leading-[1.04] tracking-[-0.025em] text-[#EAF2EE]">
                        Send love across <span className="text-[#3DDC97]">borders.</span>
                    </h1>

                    <p className="text-lg sm:text-xl leading-relaxed text-[#9DB3A9] font-normal max-w-[500px] mx-auto">
                        Send money to loved ones across borders instantly with fair rates,
                        zero surprises, and an app that works effortlessly on any phone.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2 w-full">
                        <Link
                            href="/dashboard"
                            className="h-14 px-8 rounded-xl bg-[#3DDC97] hover:bg-[#2ec884] text-[#04130C] font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-[#3DDC97]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>START</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-[1120px] mx-auto px-6 sm:px-8 py-7 border-t border-[#23372F] text-xs sm:text-sm text-[#8AA196] flex flex-col sm:flex-row items-center justify-center text-center gap-4">
                <div>2026 Zarka. All rights reserved</div>
            </footer>
        </div>
    );
}