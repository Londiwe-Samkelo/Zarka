export interface UssdSession {
    text: string;
    previousText: string;
}

export function handleUssd(text: string): string {
    const answers = text === "" ? [] : text.split("*");
    const FEE = 25;
    const RATE = 0.055;

    if (answers.length === 0) {
        return "CON Zarka\n1. Send money\n2. Check status\n3. Language";
    }

    // Step 1: User chose "1. Send money"
    if (answers[0] === "1" && answers.length === 1) {
        return "CON Enter amount in Rand";
    }

    // Step 2: User entered amount
    if (answers[0] === "1" && answers.length === 2) {
        const amount = Number(answers[1]);
        if (isNaN(amount) || amount <= FEE) {
            return `CON Invalid amount. Enter a number above R${FEE}.`;
        }
        const receives = ((amount - FEE) * RATE).toFixed(2);
        return `CON Send R${amount}\nFee: R${FEE}\nRate: 1 ZAR = ${RATE} USD\nThey get: $${receives}\n1. Confirm\n2. Cancel`;
    }

    // Step 3: User confirms or cancels
    if (answers[0] === "1" && answers.length === 3) {
        if (answers[2] === "1") {
            const ref = "ZK" + Math.floor(1000 + Math.random() * 9000);
            return `END Sent! Ref: ${ref}\nStatus: IN_TRANSIT`;
        }
        if (answers[2] === "2") {
            return "END Canceled. No money was sent.";
        }
        return "CON Invalid choice. Please type 1 or 2.\n1. Confirm\n2. Cancel";
    }

    // Menu options 2 & 3
    if (answers[0] === "2") {
        return "END Check status feature coming soon.";
    }
    if (answers[0] === "3") {
        return "END Language selection feature coming soon.";
    }

    return "END Sorry, option not recognized.";
}