// Deterministic content ids for Frontend Interview Academy.
// id = uuid5(NAMESPACE, `${table}:${slug}`)
// NAMESPACE = uuid5(NAMESPACE_URL, 'https://github.com/Apps24/frontend-interview-academy')
import { createHash } from "node:crypto";

const NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

function hexToBytes(uuid) {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

function bytesToUuid(bytes) {
  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function uuid5(namespace, name) {
  const hash = createHash("sha1").update(Buffer.concat([hexToBytes(namespace), Buffer.from(name, "utf8")])).digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  return bytesToUuid(bytes);
}

export const CONTENT_NAMESPACE = uuid5(NAMESPACE_URL, "https://github.com/Apps24/frontend-interview-academy");

export function contentId(table, slug) {
  return uuid5(CONTENT_NAMESPACE, `${table}:${slug}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [table, slug] = process.argv.slice(2);
  if (!table || !slug) {
    console.log(`namespace ${CONTENT_NAMESPACE}\nusage: node scripts/content-id.mjs <table> <slug>`);
  } else {
    console.log(contentId(table, slug));
  }
}
