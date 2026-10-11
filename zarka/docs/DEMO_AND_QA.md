# Zarka: demo plan, technical Q&A and soft Q&A

Challenge: Mukuru SheHacks, A "Money Home, Made Simple". Story: Thandi in Johannesburg sends money to her mother Mai in Harare.

## 1. The 20-second story (say this first)
"Thandi works in Johannesburg. Her mother Mai lives in Harare and has a basic phone. Data is patchy and expensive, and the worst part of sending money home is not knowing where it is. Zarka lets Thandi send even with no internet and see every step, and Mai is told by text, and collects with a code, on the phone she already has."

## 2. The 4-minute demo on the `/demo` page
Open http://localhost:3000/demo. Left is Thandi's app, right is Mai's basic phone. The strip across the top follows the transfer.

| Time | Do | Say |
| --- | --- | --- |
| 0:00 | (no screen) | The 20-second story. |
| 0:20 | Point at both sides. | "Same transfer, two very different phones. Everything between them is what we built." |
| 0:40 | App: tap **Send**, log in as `+27 82 123 4567`, read the code. | "She logs in once with a code we text her. We never ask for it by phone." |
| 1:10 | Zimbabwe, Mai, `0771234567`, 500, **Review**. | "The country prefix is added for her. She checks the fee, total and what Mai gets before she confirms." Tap **Confirm and send**. |
| 1:40 | Mai's phone: **Messages**. | "Mai already has a text: money is on its way." |
| 2:00 | App: **Test offline**, send R200. Show **Saved on your phone**. Then **Go online**. | "No data? It does not fail. It saves, and sends by itself." |
| 2:30 | Wait for **Ready**. Mai's phone: a second text with a pickup code. | "Now the code only Mai has." |
| 2:50 | Mai: **Type *120*9275#**, **OK**, **4**, **1**, the code, **OK**. | "She collects from a basic phone. No data, no app." |
| 3:15 | App: tracker complete. Thandi's text: Mai collected. | "Thandi knows, the moment it is done." |
| 3:30 | (optional) Mai sends money: **6** to create a PIN, then **1** and the menu. | "Same service from a basic phone, protected by a PIN." |
| 3:50 | (no screen) | Close: what is real, what is next (section 4). |

Practise it three times with a timer. One person drives, one person talks.

## 3. Before you present (checklist)
- Restart the API and delete `server/data/db.json` for a clean start. Create Mai's PIN once beforehand if you want to show sending from her phone.
- Set `SHOW_DEV_CODE=false` in `.env` so codes only arrive in the phone inbox, as they would for real.
- Open every language once while online, so Vambo translations are saved.
- Log out first, so the audience sees the login.
- Codes can only be requested every 30 seconds, and a number can only ask 5 times an hour.
- Run `npm test` the day before: 16 passes is a good thing to say out loud.
- Charge the laptop, turn off notifications, zoom the browser to 110 to 125 percent, plug in the display early.
- Record a 60-second screen recording as backup.
- For the proof that it works with no internet at all: `npm run build`, `npm start` and `npm run api`, then turn Wi-Fi off in front of the judges.

## 4. What is real and what is simulated (say it before they ask)
| Real | Simulated |
| --- | --- |
| Offline queue, retry with backoff, no double sends | Payout partner (status changes on a timer) |
| Login codes, PINs, pickup codes, sessions, lock-outs | SMS sending (the phone inbox stands in for a provider) |
| Limits, masked numbers, audit log, security headers | The phone network and USSD gateway |
| USSD menus and SMS commands in English and chiShona | Exchange rates (fixed demo numbers) |
| Both sides' texts and the collect flow | Database (a JSON file; real one is Postgres) |
| 16 automated tests on the API | Agent cash-out (we verify the code, an agent hands over cash) |

"Everything that touches a carrier or a bank is behind one small function we can swap, and we are honest about which ones are still mocks."

## 5. Technical questions
**Why offline-first?** In our users' reality data is expensive or missing. A send that fails with a spinner makes people doubt where their money is. We save on the phone first, so the screen never waits for the network.

**How do you stop a double send?** Every transfer has a unique ID made on the phone. The server remembers it and returns the same transfer if it sees it again, so a retry after a dropped connection cannot send twice. USSD uses the session ID and SMS uses the message ID the same way. Nobody else can reuse your ID.

**How does the sync work?** A loop checks the connection and sends waiting transfers in order. If the server fails it waits 2, 4, 8 seconds up to 60 and tries again. A transfer the server rejects is marked Failed so it does not block the rest.

**How secure is login?** A 6-digit code that is stored only as a keyed hash, valid 5 minutes, 5 attempts, limited per phone and per hour. The login is a signed token tied to a server-side session, so logging out ends it. Every request is rate limited, stricter on login.

**How do you protect basic-phone users?** The network tells us which number is calling, but a number alone is not enough because phones get stolen and SIMs get swapped. So sending needs a 4-digit PIN: stored with scrypt, easy PINs refused, locked for 15 minutes after 3 wrong tries. The PIN is typed inside a USSD session, which is how mobile money works today.

**How does collecting work, and why is it safe?** When money is ready, a random 6-digit pickup code is texted only to the receiver and stored only as a hash. She enters it on her phone or gives it to the agent. Three wrong tries lock that transfer. The sender never sees the code, and the receiver sees only a masked sender number.

**What if someone steals the receiver's phone?** They would also need to read the text. That is why the text says to give the code only to the agent, why wrong tries lock, and why the next step is agent identity checks. Honest answer: a stolen unlocked phone is a real risk for every mobile money product, and agent ID checks are the real defence.

**Are there limits against fraud?** Yes, demo values: R50 minimum, R5,000 per transfer, R10,000 per day, 5 per hour per sender. The server works out every fee and rate itself, so a tampered app cannot change the price.

**Is anything logged?** An audit log records events such as login, PIN lock, transfer created and collected, with masked numbers. It never records PINs or codes, and PINs typed in an SMS are hidden before they reach any log.

**Why USSD and SMS as well as an app?** Many recipients and some senders have no smartphone or data. USSD and SMS work on any phone.

**Is the status tracker real?** The stages, the log and the texts are real. The timing is simulated. With a real partner the status would change when their webhook tells us.

**How would it scale?** Move the JSON file to Postgres, keep codes and rate limits in Redis, run payouts through a queue with partner webhooks, run several API copies behind a load balancer, and put the app on a CDN.

**What about regulation?** Moving money across borders needs a licensed provider: exchange control rules, KYC and AML checks, and sanctions screening. Zarka is the experience layer. In production it would sit on a licensed partner's rails (such as Mukuru's) rather than move money itself. Personal data also falls under POPIA.

**How good are the translations?** Vambo AI is built for African languages, but machine translation can be wrong and money is serious. English and Shona are bundled as backup, anything Vambo cannot translate falls back to them, and native speakers must review the text, including our USSD and SMS wording, before launch.

**How did you test?** 16 automated tests start the real server and check login, tampered tokens, logout, lock-outs, number rules, double sends, limits, hidden codes, both sides' texts, collecting, USSD, SMS, the gateway secret and production start-up rules. The app builds and passes lint. We have not yet tested on real phones with real users.

**Biggest technical risks?** SIM swap, SMS cost and delivery, USSD session timeouts, agent verification, and moving from simulated to real payouts.

## 6. Soft questions (personalise the brackets)
**Tell us about your team.** "We are [number] people. [Name] built the app and offline engine, Sam built the USSD side, [Name] did [part]. We used GitHub branches and handoff notes so we could work in parallel."

**Why this challenge?** "Because the hardest part of sending money home is not the fee, it is the uncertainty. We wanted to remove the 'where is my money?' feeling for both people."

**Who is your user?** "Thandi, a worker in Johannesburg, and her mother Mai, who has a basic phone. We designed for the least connected person in the chain first."

**What was your biggest challenge?** Pick one true one, for example: "Making offline honest. The app says Saved on your phone instead of pretending it sent, and we proved it sends once, never twice."

**What are you proudest of?** "That Mai can receive and collect money on a basic phone with no data, and Thandi can see every step."

**What did you learn?** "Design for the worst connection first. And write down what is real and what is simulated, so you never over-promise."

**How did you work together?** "We split the work: app, API and USSD. We kept a safe backup branch, passed notes between sessions, and merged in small pieces." Mention a disagreement you resolved if you had one.

**Why would Mukuru use this?** "Fewer failed sends and support calls, reach to customers with basic phones, and trust, because both people see where the money is."

**What would make it fail?** "Trust and fraud. That is why we built PINs, pickup codes, limits and lock-outs first, and why agent ID checks and KYC through the licensed partner come next."

**What would you do with another month?** "Real SMS and payout partners, native-speaker review of every language, agent verification, Airtime and bill payments, and tests with real users on cheap phones."

**How would you measure success?** "Share of transfers that complete when the sender is offline, time from send to collect, and fewer 'where is my money' calls."

**What is not finished?** Answer plainly: "Payouts and SMS are simulated, the database is a file, rates are demo numbers, and the translations need review. We built it so each of those is one swap."

## 7. 90-second pitch shape
1. The problem in one person: Thandi and Mai (15s).
2. The insight: the pain is uncertainty and bad connectivity, not just fees (10s).
3. The solution: offline-first app plus USSD and SMS, secured by PINs and pickup codes (15s).
4. Live demo, shortened (35s).
5. What is real and what is next (10s).
6. The close: "Money home, made simple, even with no data." (5s)

## 8. How to answer well
- Pause, answer in 20 to 30 seconds, then stop.
- "I do not know yet, here is how we would find out" is a strong answer.
- Never say a payout or SMS is real if it is simulated. Judges check.
- If something breaks mid-demo, say "this is exactly why we built the offline queue" and move on.
