import { Q as isLanguageTag, l as logger } from "./shared-dt7kNtBU.js";
import { e as en } from "./shared-Dg6Ibedc.js";
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isMessage(value) {
  return typeof value === "string" || isObject(value) && typeof value["other"] === "string";
}
function checkEntries(path, entries) {
  for (const [id, message] of Object.entries(entries)) {
    if (!Object.prototype.hasOwnProperty.call(en, id)) {
      logger.warn(`Unknown message id "${path}.${id}": it has no effect. Check the spelling.`);
    } else if (!isMessage(message)) {
      logger.warn(`Config "${path}.${id}" should be a string or plural forms ({ one, other }).`);
    }
  }
}
function checkMessages(value) {
  for (const [locale, entries] of Object.entries(value)) {
    const path = `ui.messages.${locale}`;
    if (!isLanguageTag(locale)) {
      logger.warn(`Config "${path}" is not a language tag (like "es" or "es-MX"): it has no effect.`);
      continue;
    }
    if (isObject(entries)) checkEntries(path, entries);
    else logger.warn(`Config "${path}" should be an object of message ids to strings.`);
  }
}
export {
  checkMessages
};
