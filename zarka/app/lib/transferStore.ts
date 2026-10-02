import { Transaction } from "@/types/remittance";

const globalStore = globalThis as unknown as {
  __zarkaTransfers?: Map<string, Transaction>;
};

export const transferStore: Map<string, Transaction> =
  globalStore.__zarkaTransfers ??
  (globalStore.__zarkaTransfers = new Map());