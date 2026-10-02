import { NextResponse } from "next/server";
import { Transaction } from "@/types/remittance";

// In-memory store to guarantee deduplication / no double sends[cite: 12]
const processedTransfers = new Map<string, Transaction>();

export async function POST(request: Request) {
    try {
        const body: Transaction = await request.json();

        // 1. Deduplication check: No double sends[cite: 12]
        if (processedTransfers.has(body.id)) {
            return NextResponse.json(
                { error: "Duplicate transfer detected. Transfer already exists." },
                { status: 409 }
            );
        }

        // 2. Vambo AI Proxy Simulation: Translate receipt based on recipient locale[cite: 12]
        const translatedReceipt = `[Vambo AI Translated Receipt] ${body.receiverName}, Thandi sent you $${body.receiveAmountUSD} USD. Code: ${body.pickupCode}. Collect at Harare Main Branch.`;

        const processedTx: Transaction = {
            ...body,
            status: "INITIATED",
            translatedReceipt,
            smsDelivered: true, // Trigger SMS receipt delivery[cite: 12]
        };

        // Store transfer in gateway memory
        processedTransfers.set(body.id, processedTx);

        return NextResponse.json({ success: true, transaction: processedTx });
    } catch (err) {
        return NextResponse.json({ error: "Gateway transaction failed" }, { status: 500 });
    }
}