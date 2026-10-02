import { MESSAGES } from "./messages";
import { getState, useStore } from "./store";

// Languages in the picker. The app code is on the left; the server maps it to Vambo's language code.
// Shona and English are bundled. The rest need internet the first time, then work offline.
// Sotho, Tswana, Tsonga, Nyanja and Swati must be switched on ("next mode") in your Vambo settings.
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sn", label: "chiShona" },
  { code: "zu", label: "isiZulu" },
  { code: "xh", label: "isiXhosa" },
  { code: "af", label: "Afrikaans" },
  { code: "st", label: "Sesotho" },
  { code: "tn", label: "Setswana" },
  { code: "ts", label: "Xitsonga" },
  { code: "ny", label: "Chichewa" },
  { code: "ss", label: "siSwati" },
];

// Order: Vambo text cached on the phone, then bundled backup text, then English, then the key itself.
export const translate = (language, key) =>
  getState().messagesByLanguage[language]?.[key] ?? MESSAGES[language]?.[key] ?? MESSAGES.en[key] ?? key;

// In a component: const t = useT(); t("send")
export function useT() {
  const { language } = useStore();
  return (key) => translate(language, key);
}
