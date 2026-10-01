function handleUssd(text) {
    const answers = text === "" ? [] : text.split("*");

    if (answers.length === 0) {
        return "CON Zarka\n1. Send money\n2. Check status\n3. Language";
    }

    if (answers[0] === "1" && answers.length === 1){
        return "CON Enter amount in Rand";
    }

    if (answers[0] === "1" && answers.length === 2) {
        const amount = Number(answers[1]);
        if (isNaN(amount) || amount <= fee) {
            return "CON Invalid amount. Enter a number abouve R25.";
        }
        const fee = 25;
        const rate = 0.055;
        const receives = ((amount -  fee) * rate).toFixed(2);
        return `CON Send R${amount}\nFee: R${fee}\nRate: 1 R = ${rate} USD\nThey get: $${receives}\n1. Confirm\n2. Cancel`;
    }

    if (answers[0] === "1" && answers.length === 3){
        if (answers[2] === 1){
            const ref = "ZK" + Math.floor(1000 + Math.random() * 9000);
            return `END Sent! Ref ${ref}\nStatus: sent`;
        }
        if (answers[2] === "2"){
            return "END Canceled. No money was sent.";
        }
        return "CON Invalid choice. Please type 1 or 2. \n1. Confirn\n2. Cancel";
    }

    return "END Sorry, not built yet";
}

// console.log(handleUssd(""));
// console.log(handleUssd("1"));
// console.log(handleUssd("1*500"));

const readline = require("readline");
const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let text = "";
let previousText = "";

function nextScreen(){
    const screen = handleUssd(text);
    console.log("\n" + screen);
    if (screen.startsWith("CON Invalid")) {
        text = previousText;
    }
    if (screen.startsWith("END")) {
        r1.close();
        return;
    }
    r1.question("> ", (answer) => {
        text = text === "" ? answer : text + "*" + answer;
        nextScreen();
    });
}

nextScreen(); 