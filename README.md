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

The project has two parts that run together: the app (Next.js, in `zarka/app` and `zarka/components`) and the API (Express, in `zarka/server`). Next.js forwards `/api/*` to the API, so the phone only talks to one address.

```bash
cd zarka
npm install
cp .env.example .env     # Windows: copy .env.example .env   (then edit .env; the Vambo key is optional at first)
npm run dev:all          # app on http://localhost:3000, API on http://localhost:4000
```

Open http://localhost:3000. To try it:

1. Tap **Send money**. You will be asked to log in: type a phone number with its country code (for example `+27820000000`), tap **Send me a code**, and type the **Test code** shown on screen (in development the code is shown instead of texted; it is also printed in the API terminal).
2. Fill in the transfer and tap **Confirm & send**. Watch the 4-stage tracker on the **History** tab move from Received to Processing to Ready to collect (about 15 seconds).
3. Tap **Test offline** in the orange bar, send another transfer, and see it wait on the phone ("Saved on phone"). Tap **Go online** and it sends.
4. Switch the language in the top corner. Shona is built in; other languages need your Vambo key.

Other commands: `npm run dev` starts only the app, `npm run api` starts only the API, `npm run vambo:test` checks your Vambo key.

**Production build** (needed to try the installable, works-with-no-internet version): `npm run build`, then `npm start` and, in a second terminal, `npm run api`. The service worker only turns on in a production build.

**On a real phone:** your phone and computer must be on the same Wi-Fi. Open `http://YOUR-COMPUTER-IP:3000` (not `localhost`). Plain http on a local network can't install the app or cache it for offline use; for that, deploy it over https or use a tunnel such as `ngrok`. Set `API_URL` if the API runs somewhere other than `http://localhost:4000`.

### Where each box in the diagram lives

| Box | Files |
| --- | --- |
| Smartphone app | `app/page.js`, `components/` (screens, `StatusTracker.jsx` for the 4 stages), English + Shona in `lib/messages.js` |
| Connectivity engine | `lib/engine/connectivity.js` (online check), `lib/engine/outbox.js` (queue, retry with backoff), `lib/engine/tracking.js` (status updates), `lib/engine/rates.js` |
| Local store (IndexedDB) | `lib/idb.js`, `lib/localData.js` (outbox, history, cached rates, session, language), `public/sw.js` (app shell) |
| API layer | `server/routes/apiRoutes.js`, `server/routes/authRoutes.js`, `server/middleware/` (login check, rate limit) |
| Fee + exchange rate (mock FX) | `server/services/ratesService.js`, `lib/quote.js` (same maths on the phone) |
| Transfers + status machine | `server/services/transfersService.js`, `server/services/statusMachine.js` (received, processing, ready to collect) |
| USSD / SMS gateway | `server/routes/ussdRoutes.js`, `server/routes/smsRoutes.js`, `server/services/smsCommandService.js` |
| Notifies: money ready to collect | `refreshTransfer` in `server/services/transfersService.js` texts the recipient |
| Database | `server/store/transfersStore.js` (JSON file `server/data/db.json`: transfers, status log, fee records) |
| Vambo AI | `server/services/vamboService.js`, `uiMessagesService.js`, `lib/engine/languages.js` (app text, receipts, other languages) |

### Three ways to use Zarka

- **Smartphone app:** log in once with a phone number and an SMS code (needs internet once), then send offline. Transfers wait on the phone and sync later.
- **Button phone, USSD:** `POST /ussd`. The phone network identifies the caller.
- **Button phone, SMS:** text `SEND ZW 500 +26377123456`, then reply `YES`. Also `RATES`, `CANCEL`, `HELP`. `POST /sms`.

### Languages (Vambo AI)

- **Bundled backup text:** English and Shona live in `lib/messages/en.json` and `sn.json`, so they always work offline.
- **Other languages:** the app asks the server (`GET /api/messages?lang=zu`), the server translates the English file with Vambo AI (`server/services/uiMessagesService.js`), saves the result in `server/data/translations/`, and the phone keeps its own copy in IndexedDB. A new language needs internet once, then works offline. If Vambo fails for a string, the app shows the bundled text, then English.
- **Receipts:** `GET /api/transfers/:id/receipt?lang=sn` returns the receipt text translated by Vambo.
- **Login for paid calls:** asking a question in Help (`POST /api/translate`) needs a login and is limited to 500 characters. App text (`GET /api/messages`) works before login, but the server translates each language only once and saves it.
- **Languages in the picker:** English, Shona, Zulu, Xhosa and Afrikaans work on Vambo's standard plan. Sesotho, Setswana, Xitsonga, Chichewa and siSwati need "next mode" switched on in your Vambo settings. The list is in `lib/i18n.js` and `server/config.js`.
- **Set it up:** copy `.env.example` to `.env`, add `VAMBO_API_KEY`, then run `npm run vambo:test -- sn "Send money home"`. It prints Vambo's raw reply, so you can confirm the request and reply format match your account.

### Environment

- `AUTH_SECRET`: signing key for login tokens (required in production)
- `NODE_ENV=production`: hides test login codes and SMS logs
- `API_URL`: where Next.js finds the API (default `http://localhost:4000`)
- `VAMBO_API_KEY`: your Vambo AI key. Optional: `VAMBO_API_URL` (default `https://api.vambo.ai/v1/translate`) and `VAMBO_CODE_STYLE` (`iso3` for `sna`, `zul`; `iso1` for `sn`, `zu`)
- You can put these in `zarka/.env` (see `.env.example`) instead of setting them in the shell

### Not real yet

Payouts and SMS sending are mocks, status changes are time-based (5s processing, 15s ready), there is no PIN for button-phone users, the database is a JSON file, and rates are fixed demo numbers. The Vambo request format follows Vambo's developer page and has only been tested against a mock, so run `npm run vambo:test` with your key. All translated text (Shona included) needs a native speaker's review.
