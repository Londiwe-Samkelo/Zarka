// Backup text: bundled English + Shona, always available offline.
// Other languages come from Vambo AI through the server (see lib/engine/languages.js) and are cached on the phone.
// The English file is also the source the server translates from (server/services/uiMessagesService.js).
import en from "./messages/en.json";
import sn from "./messages/sn.json";

export const MESSAGES = { en, sn };
