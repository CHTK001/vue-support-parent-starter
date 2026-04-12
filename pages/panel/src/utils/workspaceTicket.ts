const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SECRET = "panel-workspace-ticket-v1";

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

const deriveKey = async () => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(SECRET));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
};

export const encryptWorkspaceTicket = async (payload: Record<string, unknown>) => {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
};

export const decryptWorkspaceTicket = async <T>(ticket: string) => {
  const [ivPart, payloadPart] = ticket.split(".");
  if (!ivPart || !payloadPart) {
    throw new Error("无效的工作台 ticket");
  }
  const key = await deriveKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivPart) },
    key,
    fromBase64Url(payloadPart),
  );
  return JSON.parse(decoder.decode(decrypted)) as T;
};
