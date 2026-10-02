"use client";

import React, { useState } from "react";
import { handleUssd } from "@/lib/ussdHandler";

interface UssdSimModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UssdSimModal({ isOpen, onClose }: UssdSimModalProps) {
    const [text, setText] = useState("");
    const [previousText, setPreviousText] = useState("");
    const [inputVal, setInputVal] = useState("");
    const [screen, setScreen] = useState(() => handleUssd(""));

    if (!isOpen) return null;

    const handleSend = () => {
        const nextText = text === "" ? inputVal : `${text}*${inputVal}`;
        const nextScreen = handleUssd(nextText);

        if (nextScreen.startsWith("CON Invalid")) {
            setText(previousText);
        } else {
            setPreviousText(text);
            setText(nextText);
        }

        setScreen(nextScreen);
        setInputVal("");
    };

    const handleReset = () => {
        setText("");
        setPreviousText("");
        setInputVal("");
        setScreen(handleUssd(""));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-emerald-400 font-mono">USSD Simulator (*120*9275#)</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>

                {/* Feature Phone Display */}
                <div className="bg-lime-950/40 border border-lime-800/60 rounded-xl p-4 font-mono text-lime-300 text-xs whitespace-pre-line min-h-[140px] flex items-center">
                    {screen}
                </div>

                {/* Controls */}
                {!screen.startsWith("END") ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            placeholder="Reply..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                        <button
                            onClick={handleSend}
                            className="px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors"
                        >
                            Send
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleReset}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                        Restart Session
                    </button>
                )}
            </div>
        </div>
    );
}