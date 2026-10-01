## Architecture

Zarka is an offline-first money transfer app for Southern Africa. Smartphones save every transfer locally and sync when the internet returns. Button phones use USSD and SMS over the normal phone signal, so they work with no data at all.

```mermaid
flowchart TD
  subgraph PH["Smartphone app (works offline)"]
    A1["Tap Send money<br/>Mobile UI"] --> A2["Save locally first<br/>Unique transfer ID"]
    A2 --> A3{"Internet available?<br/>Connectivity engine"}
    A3 -- No --> A4["Wait in queue<br/>Retry with backoff"]
  end

  subgraph BP["Button phone (no data needed)"]
    C1["Dial USSD menu or send SMS"]
  end

  subgraph SV["Server (Node.js + Postgres)"]
    S1["Gateway<br/>API, USSD, SMS"] --> S2["Transfers<br/>Skip duplicate IDs, write ledger"]
    S2 --> S3["Payout partner<br/>Mobile money, bank, cash"]
    S3 --> S4["Vambo AI proxy<br/>Translate receipt"]
  end

  A3 -- Yes --> S1
  A4 -- Back online --> S1
  C1 -- Phone signal --> S1

  S4 --> E1["App shows Sent<br/>Updates when online"]
  S4 --> E2["Receipt delivered by SMS"]

  classDef device fill:#EEEDFE,stroke:#534AB7,color:#26215C
  classDef server fill:#E1F5EE,stroke:#0F6E56,color:#04342C
  class A1,A2,A3,A4,C1,E1,E2 device
  class S1,S2,S3,S4 server
```

### Components

| Component | Role |
|---|---|
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