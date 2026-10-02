import { setState } from "./store";

let timer;

export function showToast(message) {
  clearTimeout(timer);
  setState({ toast: message });
  timer = setTimeout(() => setState({ toast: "" }), 2600);
}
