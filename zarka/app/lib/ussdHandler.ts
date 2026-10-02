import { getLiveFxRate, calculateRemittance } from "./fxService";
import { transferStore } from "./transferStore";
import { Language, RemittanceStatus } from "@/types/remittance";

export interface UssdSession {
  text: string;
  previousText: string;
}

const T: Record<Language, {
  menu: string; askAmount: string; minAmount: string; send: string;
  fee: string; rate: string; get: string; confirm: string; cancel: string;
  badChoice: string; sent: string; statusLabel: string; cancelled: string;
  askRef: string; notFound: string; statuses: Record<RemittanceStatus, string>;
}> = {
  en: {
    menu: "Zarka\n1. Send money\n2. Check status\n3. Language",
    askAmount: "Enter amount in Rand",
    minAmount: "Enter a number above",
    send: "Send", fee: "Fee", rate: "Rate", get: "They get",
    confirm: "Confirm", cancel: "Cancel",
    badChoice: "Please type 1 or 2.",
    sent: "Sent!", statusLabel: "Status",
    cancelled: "Cancelled. No money was sent.",
    askRef: "Enter your reference (e.g. ZK1234)",
    notFound: "Reference not found.",
    statuses: {
      QUEUED: "Queued", INITIATED: "Started", IN_TRANSIT: "In transit",
      READY_FOR_COLLECTION: "Ready to collect", COLLECTED: "Collected",
    },
  },
  sn: {
    menu: "Zarka\n1. Tumira mari\n2. Tarisa mamiriro\n3. Mutauro",
    askAmount: "Nyora huwandu mu Rand",
    minAmount: "Nyora nhamba inodarika",
    send: "Tumira", fee: "Muripo", rate: "Mutengo wekutsinhana", get: "Vanowana",
    confirm: "Simbisa", cancel: "Kanzura",
    badChoice: "Nyora 1 kana 2.",
    sent: "Yatumirwa!", statusLabel: "Mamiriro",
    cancelled: "Yakanzurwa. Hapana mari yakatumirwa.",
    askRef: "Nyora ref yako (semuenzaniso ZK1234)",
    notFound: "Ref haina kuwanikwa.",
    statuses: {
      QUEUED: "Yakamirira", INITIATED: "Yatanga", IN_TRANSIT: "Iri munzira",
      READY_FOR_COLLECTION: "Yagadzirira kutorwa", COLLECTED: "Yatorwa",
    },
  },
  zu: {
    menu: "Zarka\n1. Thumela imali\n2. Hlola isimo\n3. Ulimi",
    askAmount: "Faka inani ngama-Rand",
    minAmount: "Faka inombolo ephezulu kuka",
    send: "Thumela", fee: "Imali yenkonzo", rate: "Izinga", get: "Bathola",
    confirm: "Qinisekisa", cancel: "Khansela",
    badChoice: "Faka u-1 noma u-2.",
    sent: "Kuthunyelwe!", statusLabel: "Isimo",
    cancelled: "Kukhanseliwe. Ayikho imali ethunyelwe.",
    askRef: "Faka inombolo yakho (isb. ZK1234)",
    notFound: "Inombolo ayitholakali.",
    statuses: {
      QUEUED: "Lilindile", INITIATED: "Liqalile", IN_TRANSIT: "Lisendleleni",
      READY_FOR_COLLECTION: "Selilungele ukuthathwa", COLLECTED: "Selithathiwe",
    },
  },
};

// Demo only: status moves forward over time so judges can watch it change
function currentStatus(createdAt: string, stored: RemittanceStatus): RemittanceStatus {
  if (stored === "QUEUED") return stored;
  const seconds = (Date.now() - new Date(createdAt).getTime()) / 1000;
  if (seconds < 20) return "IN_TRANSIT";
  if (seconds < 40) return "READY_FOR_COLLECTION";
  return "COLLECTED";
}

export function handleUssd(text: string): string {
  const raw = text === "" ? [] : text.split("*");

  // Language: "3" then a choice. We remember it, then drop both answers.
  let lang: Language = "en";
  let answers = raw;
  while (answers[0] === "3") {
    if (answers.length === 1) {
      return "CON Language\n1. English\n2. Shona\n3. isiZulu";
    }
    lang = answers[1] === "2" ? "sn" : answers[1] === "3" ? "zu" : "en";
    answers = answers.slice(2);
  }
  const t = T[lang];

  // Shared fee and rate (same as the web app)
  const RATE = getLiveFxRate().zarToUsd;
  const FEE = calculateRemittance(1, RATE).feeZAR;

  // Main menu
  if (answers.length === 0) return "CON " + t.menu;

  // 1. Send money: ask amount
  if (answers[0] === "1" && answers.length === 1) {
    return "CON " + t.askAmount;
  }

  // 1. Send money: show fee screen
  if (answers[0] === "1" && answers.length === 2) {
    const amount = Number(answers[1]);
    if (isNaN(amount) || amount <= FEE) {
      return `CON Invalid amount. ${t.minAmount} R${FEE}.`;
    }
    const receives = ((amount - FEE) * RATE).toFixed(2);
    return `CON ${t.send} R${amount}\n${t.fee}: R${FEE}\n${t.rate}: 1 ZAR = ${RATE} USD\n${t.get}: $${receives}\n1. ${t.confirm}\n2. ${t.cancel}`;
  }

  // 1. Send money: confirm or cancel
  if (answers[0] === "1" && answers.length === 3) {
    if (answers[2] === "1") {
      const amount = Number(answers[1]);
      const ref = "ZK" + Math.floor(1000 + Math.random() * 9000);
      transferStore.set(ref, {
        id: ref,
        senderName: "USSD user",
        receiverName: "Recipient",
        receiverPhone: "",
        sendAmountZAR: amount,
        receiveAmountUSD: Number(((amount - FEE) * RATE).toFixed(2)),
        exchangeRate: RATE,
        feeZAR: FEE,
        status: "IN_TRANSIT",
        createdAt: new Date().toISOString(),
        pickupCode: String(Math.floor(100000 + Math.random() * 900000)),
      });
      return `END ${t.sent} Ref: ${ref}\n${t.statusLabel}: ${t.statuses.IN_TRANSIT}`;
    }
    if (answers[2] === "2") return `END ${t.cancelled}`;
    return `CON Invalid choice. ${t.badChoice}\n1. ${t.confirm}\n2. ${t.cancel}`;
  }

  // 2. Check status
  if (answers[0] === "2" && answers.length === 1) {
    return "CON " + t.askRef;
  }
  if (answers[0] === "2" && answers.length === 2) {
    const ref = answers[1].trim().toUpperCase();
    const tx = transferStore.get(ref);
    if (!tx) return `END ${t.notFound}`;
    const status = currentStatus(tx.createdAt, tx.status);
    return `END ${ref}\nR${tx.sendAmountZAR} to $${tx.receiveAmountUSD}\n${t.statusLabel}: ${t.statuses[status]}`;
  }

  return "END Sorry, option not recognized.";
}


















// import { getLiveFxRate, calculateRemittance } from "./fxService";
// import { transferStore } from "./transferStore";

// export interface UssdSession {
//     text: string;
//     previousText: string;
// }

// export function handleUssd(text: string): string {
//     const answers = text === "" ? [] : text.split("*");
//     const RATE = getLiveFxRate().zarToUsd;
//     const FEE = calculateRemittance(1, RATE).feeZAR;

//     if (answers.length === 0) {
//         return "CON Zarka\n1. Send money\n2. Check status\n3. Language";
//     }

//     // Step 1: User chose "1. Send money"
//     if (answers[0] === "1" && answers.length === 1) {
//         return "CON Enter amount in Rand";
//     }

//     // Step 2: User entered amount
//     if (answers[0] === "1" && answers.length === 2) {
//         const amount = Number(answers[1]);
//         if (isNaN(amount) || amount <= FEE) {
//             return `CON Invalid amount. Enter a number above R${FEE}.`;
//         }
//         const receives = ((amount - FEE) * RATE).toFixed(2);
//         return `CON Send R${amount}\nFee: R${FEE}\nRate: 1 ZAR = ${RATE} USD\nThey get: $${receives}\n1. Confirm\n2. Cancel`;
//     }

//     // Step 3: User confirms or cancels
//         if (answers[2] === "1") {
//       const amount = Number(answers[1]);
//       const ref = "ZK" + Math.floor(1000 + Math.random() * 9000);
//       transferStore.set(ref, {
//         id: ref,
//         senderName: "USSD user",
//         receiverName: "Recipient",
//         receiverPhone: "",
//         sendAmountZAR: amount,
//         receiveAmountUSD: Number(((amount - FEE) * RATE).toFixed(2)),
//         exchangeRate: RATE,
//         feeZAR: FEE,
//         status: "IN_TRANSIT",
//         createdAt: new Date().toISOString(),
//         pickupCode: String(Math.floor(100000 + Math.random() * 900000)),
//       });
//       return `END Sent! Ref: ${ref}\nStatus: IN_TRANSIT`;
//     }

//     // Menu options 2 & 3
//     if (answers[0] === "2") {
//         return "END Check status feature coming soon.";
//     }
//     if (answers[0] === "3") {
//         return "END Language selection feature coming soon.";
//     }

//     return "END Sorry, option not recognized.";
// }