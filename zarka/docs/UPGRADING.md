# Upgrading to the professional version

This version replaces most of the app and server. Do it on a branch so nothing is lost:

```
git checkout -b professional-v2
```

Then copy the new `zarka/` folder over yours (or unzip it next to it and compare with `git diff`), run `npm install`, and restart with `npm run dev:all`.

## Files removed
- `components/UssdSimButton.js` and `components/SmsSimButton.js`: the floating USSD and SMS buttons are gone. The same tools now live on the `/demo` page, with a working basic phone.
- The old `/ussd/sim` and `/sms/sim` pages are gone for the same reason (the demo phone uses `/sim/*`).

## Behaviour that changed
- **USSD menu:** 1 Send, 2 Rates, 3 Check status, 4 Collect money, 5 Language, 6 PIN. Sending now needs a 4-digit PIN (create it with option 6 first). A PIN such as `1234` or `1111` is refused as too easy.
- **SMS:** `SEND ZW 500 0771234567` now needs `YES <PIN>` to confirm. New commands: `STATUS`, `COLLECT <code>`, `LANG SN`.
- **Collecting:** when a transfer is ready the receiver is texted a 6-digit pickup code. Entering it (app, USSD or SMS) marks the transfer collected and texts the sender. The old "Collect cash" tile is now a real screen.
- **Phone numbers:** recipient numbers are checked against the country (`+263771234567` is valid, `+26377123456` is one digit short).
- **Limits:** R50 minimum, R5,000 per transfer, R10,000 per day, 5 per hour (demo values, in `server/config.js`).
- **Logins** last 7 days and end when you log out.
- **Fee:** still lives in two places that must match: `server/config.js` (`FEE`) and `lib/quote.js` (`DEFAULT_FEE`).
- **Production:** the server refuses to start without `AUTH_SECRET`. Without a real SMS provider, set `SMS_MODE=simulated` to keep the demo working.
- **Transfers already waiting in someone's browser** from the old version may be rejected and show "Failed". They need to be sent again.

## Run the tests
`npm test` starts the real server on a spare port with a temporary database and runs 16 checks: login, tampered tokens, logout, wrong codes, number rules, repeats, limits, hidden pickup codes, both sides' texts, collecting, lock-outs, USSD, SMS, the gateway secret, and production start-up rules.
