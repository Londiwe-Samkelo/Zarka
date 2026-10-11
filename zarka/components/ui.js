// Shared Tailwind class strings so every screen looks the same.
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zarka";
export const cardClass = "rounded-2xl border border-line bg-card p-5";
export const inputClass = `w-full rounded-xl border border-line bg-background px-4 py-3 text-base text-foreground ${focus}`;
export const phoneInputClass = `w-full rounded-r-xl border border-line bg-background px-4 py-3 text-base text-foreground ${focus}`;
export const labelClass = "mb-1.5 mt-4 block text-sm font-semibold text-foreground first:mt-0";
export const buttonClass = `w-full rounded-xl bg-zarka px-4 py-3.5 text-base font-semibold text-white transition hover:bg-zarka-dark disabled:opacity-60 ${focus}`;
export const secondaryButtonClass = `w-full rounded-xl border border-line bg-card px-4 py-3.5 text-base font-semibold text-foreground transition hover:bg-zarka-soft disabled:opacity-60 ${focus}`;
export const headingClass = "text-xl font-bold text-foreground";
export const mutedClass = "text-sm text-mute";
