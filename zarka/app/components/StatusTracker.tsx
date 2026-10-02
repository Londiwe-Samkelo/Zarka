"use client";

import { RemittanceStatus } from "../types/remittance";
import { getTranslation, Language } from "../lib/i18n";

interface StatusTrackerProps {
    status: RemittanceStatus;
    lang: Language;
    onAdvanceStatus?: () => void;
}

const steps: RemittanceStatus[] = [
    "INITIATED",
    "IN_TRANSIT",
    "READY_FOR_COLLECTION",
    "COLLECTED",
];

export const StatusTracker: React.FC<StatusTrackerProps> = ({
                                                                status,
                                                                lang,
                                                                onAdvanceStatus,
                                                            }) => {
    const t = getTranslation(lang);
    const currentIndex = steps.indexOf(status);

    const getStepLabel = (step: RemittanceStatus) => {
        switch (step) {
            case "INITIATED":
                return t.step1;
            case "IN_TRANSIT":
                return t.step2;
            case "READY_FOR_COLLECTION":
                return t.step3;
            case "COLLECTED":
                return t.step4;
        }
    };

    return (
        <div className="w-full bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-6 text-white backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-wide text-emerald-400">
                    {t.statusTitle}
                </h3>
                {onAdvanceStatus && currentIndex < steps.length - 1 && (
                    <button
                        onClick={onAdvanceStatus}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full transition-colors font-medium"
                    >
                        Simulate Next Step
                    </button>
                )}
            </div>

            <div className="grid grid-cols-4 gap-2 relative">
                {steps.map((step, idx) => {
                    const isDone = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                        <div key={step} className="flex flex-col items-center text-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                    isDone
                                        ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20"
                                        : "bg-slate-800 text-slate-500 border border-slate-700"
                                } ${isCurrent ? "scale-110 shadow-lg shadow-emerald-500/30" : ""}`}
                            >
                                {idx + 1}
                            </div>
                            <span
                                className={`mt-3 text-xs font-medium ${
                                    isDone ? "text-emerald-300" : "text-slate-500"
                                }`}
                            >
                {getStepLabel(step)}
              </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};