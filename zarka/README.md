# Zarka

## System Architecture

Zarka is an offline-first money transfer app for Southern Africa. Smartphones save every transfer locally and sync when the internet returns. Button phones use USSD and SMS over the normal phone signal, so they work with no data at all.

```text
┌────────────────────────────────────────┐
│             SMARTPHONE APP             │
│  • Send screen: fees + exchange rate   │
│  • Status tracker (4 stages)           │
│  • English + Shona text                │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│          CONNECTIVITY ENGINE           │
│  • Detects online / offline            │
│  • Queues transfers, retries           │
│  • Saves outbox in IndexedDB           │
└───────────────────┬────────────────────┘
                    │ HTTPS when online
                    ▼
┌────────────────────────────────────────┐
│               API LAYER                │
│           Node.js + Express            │
│  • Fee + exchange rate (mock FX)       │
│  • Transfers + status machine          │
│  • USSD / SMS gateway                  │
│  • Notifies: money ready to collect    │
└───────────────────┬────────────────────┘
                    │
          ┌─────────┴───────────┐
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│     DATABASE     │  │     VAMBO AI     │
│  • Transfers     │  │  • Translates UI │
│  • Status log    │  │  • Receipt text  │
│  • Fee records   │  │  • Backup text   │
└──────────────────┘  └──────────────────┘
```

### Components

| Component | Role |
| --- | --- |
| Mobile UI | The only screen the user touches. Reads and writes the local store, never calls the network directly. |
| Connectivity engine | Detects internet, queues transfers while offline, retries with backoff, syncs in order. |
| Local store | IndexedDB holds the outbox, history and cached rates. A service worker caches the app shell. |
| Button phone | USSD menus and SMS over the phone signal. No app and no data needed. |
| Gateway | One entry point for the app (HTTPS) and for button phones (USSD and SMS). Handles auth and rate limiting. |
| Transfers | Uses the unique transfer ID so a retry never sends money twice. Writes the ledger. |
| Vambo AI proxy | Translates menus, help and receipts into local languages. The API key stays on the server. |
| Payout partner | Mobile money, bank or cash pickup (mocked for the MVP). |

### Design rules

- Write locally first, then sync. Never block the user on the network.
- Every transfer has a client-generated unique ID, and the server treats repeats as the same transfer.
- Show "Waiting" until the server confirms. Never show "Sent" early.

## Running it

**You need:** [Node.js](https://nodejs.org) 20.9 or newer (22 recommended) and npm. Check with `node -v`.

Two parts run together: the app (Next.js, in `zarka/app` and `zarka/components`) and the API (Express, in `zarka/server`). Next.js forwards `/api/*` and `/sim/*` to the API, so the browser talks to one address.

```bash
cd zarka
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev:all          # app on http://localhost:3000, API on http://localhost:4000
```

Other commands: `npm run dev` (app only), `npm run api` (API only), `npm test` (16 automated API tests), `npm run vambo:test` (checks your Vambo key), `npm run build` then `npm start` (production build, needed to try installing the app and using it with no internet).

## The two-sided demo

Open **http://localhost:3000/demo**. Left: Thandi in Johannesburg uses the smartphone app. Right: her mother Mai in Harare uses a basic phone with a keypad. A five-step strip across the top follows the transfer.

1. In the app, tap **Send**, log in as `+27 82 123 4567` (the test code is shown on screen, or in the phone inbox if `SHOW_DEV_CODE=false`).
2. Send money to Zimbabwe, recipient `0771234567`. Review, then confirm.
3. On Mai's phone, press **Messages**: she has a text saying money is coming. Soon after, a second text with her **pickup code**.
4. Mai collects: press **Type *120*9275#**, **OK**, choose **4**, **1**, type the code, **OK**. (Or text `COLLECT 123456`.)
5. Thandi's tracker finishes and she gets a text that Mai collected.

To send from the basic phone: first create a PIN (**Type *120*9275#**, **OK**, **6**, type a 4-digit PIN that is not easy to guess such as `4729`, repeat it), then choose **1** and follow the menu.

## Who can do what

| | Smartphone app | Basic phone (USSD and SMS) |
| --- | --- | --- |
| Log in | Phone number + 6-digit code by SMS | The network identifies the phone. Sending needs a 4-digit PIN. |
| Send money | Review screen, works offline | USSD menu 1, or `SEND ZW 500 0771234567` then `YES <PIN>` |
| Follow a transfer | 4-step tracker | USSD menu 3, or `STATUS` |
| Collect money | Collect tab and the pickup code | USSD menu 4, or `COLLECT <code>` |
| Language | English, Shona and more through Vambo AI | USSD menu 5, or `LANG SN` / `LANG EN` |

Texts Zarka sends: to the sender when a transfer is received, ready to collect, and collected; to the receiver when money is on its way, when it is ready (with the pickup code), and when collected. They are written in each person's own language (English or chiShona).

## Security measures

- **Login:** one-time codes are stored only as keyed hashes, expire in 5 minutes, allow 5 attempts, and are limited per phone and per hour. Logins are signed tokens backed by a server-side session, so logging out really ends them. Sessions last 7 days.
- **PINs:** 4 digits, stored with scrypt and a salt, easy PINs refused, locked for 15 minutes after 3 wrong tries. Needed for every send from a basic phone.
- **Pickup codes:** random 6 digits, texted only to the receiver, stored hashed, never returned by the API, locked for 15 minutes after 3 wrong tries.
- **Money rules:** the server works out all fees and rates itself; limits per transfer, per hour and per day; transfer IDs make a retry safe and cannot be used by anyone else.
- **Privacy:** people only see what they should (the receiver sees a masked sender number); PINs and codes are hidden in logs and in the demo inbox; the audit log records events with masked numbers and never secrets.
- **Gateway:** `/ussd` and `/sms` can require a shared secret (`GATEWAY_SECRET`) so only your provider can call them.
- **Server hardening:** security headers (Helmet and Next.js), request size limits, per-IP rate limits (stricter on login), errors that do not leak details, atomic database writes, and a refusal to start in production without a real `AUTH_SECRET`.
- **Still to do before real money:** a real database, HTTPS everywhere, KYC and sanctions checks through the licensed partner, SIM-swap checks, fraud monitoring, and an independent security review.

## Where each box in the diagram lives

| Box | Files |
| --- | --- |
| Smartphone app | `app/page.js`, `components/` (screens, `StatusTracker.jsx`), text in `lib/messages/` |
| Basic phone (demo) | `components/demo/ButtonPhone.jsx`, `DemoStage.jsx`, `app/demo/page.js` |
| Connectivity engine | `lib/engine/connectivity.js`, `outbox.js` (queue, retry with backoff), `tracking.js`, `rates.js`, `languages.js` |
| Local store (IndexedDB) | `lib/idb.js`, `lib/localData.js`, `public/sw.js` |
| Gateway | `server/routes/apiRoutes.js`, `authRoutes.js`, `ussdRoutes.js`, `smsRoutes.js`, `server/middleware/` |
| Security | `server/services/authService.js`, `otpService.js`, `pinService.js`, `auditService.js`, `server/store/sessionsStore.js` |
| Transfers + status machine | `server/services/transfersService.js`, `statusMachine.js` |
| Fee and exchange rate | `server/services/ratesService.js`, `lib/quote.js` (same maths on the phone) |
| SMS notifications | `server/services/notificationService.js`, `smsService.js`, `server/i18n/messages.js` |
| Vambo AI | `server/services/vamboService.js`, `uiMessagesService.js`, `lib/engine/languages.js` |
| Database | `server/store/` (JSON file in `server/data/`; swap for Postgres) |
| Demo phone network | `server/routes/simRoutes.js` (only exists while SMS is simulated) |

## Languages (Vambo AI)

- English and Shona text is bundled (`lib/messages/en.json`, `sn.json`), so the app always works offline. USSD menus and SMS texts are in `server/i18n/messages.js`.
- Other app languages come from Vambo AI through `GET /api/messages?lang=zu`, are saved on the server and on the phone, and work offline after the first load.
- Sesotho, Setswana, Xitsonga, Chichewa and siSwati must be switched on ("next mode") in your Vambo settings.
- Run `npm run vambo:test -- sn "Send money home"` with your key to confirm the request format.
- All chiShona and translated text needs a native speaker's review before real users see it. Newer English text has no Shona yet and falls back to English until Vambo translates it.

## Environment

See `.env.example`. The important ones: `AUTH_SECRET` (required in production), `GATEWAY_SECRET`, `VAMBO_API_KEY`, `SHOW_DEV_CODE`, `SMS_MODE`, `NEXT_PUBLIC_DEMO_TOOLS`.

## Not real yet

Payouts and SMS sending are simulated (status changes on a timer: 5 s, then 15 s), the database is a JSON file, rates are fixed demo numbers, limits are demo values, Airtime and Pay bills are marked "Soon", and nothing here has been security reviewed. The app screens have only been checked by building and linting, not by hand in a browser.
