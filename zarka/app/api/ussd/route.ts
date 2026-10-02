import { NextResponse } from "next/server";
import { handleUssd } from "@/lib/ussdHandler";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text = "" } = body;

        const responseText = handleUssd(text);

        return NextResponse.json({
            message: responseText,
            shouldContinue: responseText.startsWith("CON"),
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to process USSD request" },
            { status: 400 }
        );
    }
}