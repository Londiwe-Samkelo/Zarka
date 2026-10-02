
import { FxRate } from "@/types/remittance";

let currentRate = 0.054; // 1 ZAR ≈ 0.054 USD (or ~18.5 ZAR per USD)
const FLAT_FEE_ZAR = 15; // Standard fixed low-data fee

export function getLiveFxRate(): FxRate {
    // Simulate small market fluctuations
    const delta = (Math.random() - 0.49) * 0.0005;
    const newRate = Number((currentRate + delta).toFixed(4));
    const trend = newRate > currentRate ? "up" : newRate < currentRate ? "down" : "stable";
    currentRate = newRate;

    return {
        zarToUsd: currentRate,
        lastUpdated: new Date().toLocaleTimeString(),
        trend,
    };
}

export function calculateRemittance(amountZAR: number, rate: number) {
    const fee = amountZAR > 0 ? FLAT_FEE_ZAR : 0;
    const netAmountZAR = Math.max(0, amountZAR - fee);
    const receiveAmountUSD = Number((netAmountZAR * rate).toFixed(2));

    return {
        sendAmountZAR: amountZAR,
        feeZAR: fee,
        netAmountZAR,
        receiveAmountUSD,
        exchangeRate: rate,
        zarToUsd: rate,
    };
}