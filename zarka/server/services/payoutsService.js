// MOCK payout partner. Replace with a real mobile money / bank / cash pickup API call.
export async function startPayout(transfer) {
  return { reference: `PAY-${transfer.id.slice(-8)}` };
}
