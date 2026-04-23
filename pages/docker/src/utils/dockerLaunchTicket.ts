const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SECRET = "server-docker-launch-ticket-v1";

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

const deriveKey = async () => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(SECRET));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["decrypt"]);
};

export type DockerLaunchTicketPayload = {
  serverId?: number;
  serverName?: string;
  serverType?: string;
  osType?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  metadataJson?: string;
  issuedAt?: number;
};

/**
 * 解密 Docker 跳转 ticket。
 */
export const decryptDockerLaunchTicket = async (ticket: string) => {
  const [ivPart, payloadPart] = String(ticket || "").split(".");
  if (!ivPart || !payloadPart) {
    throw new Error("无效的 Docker 跳转凭据");
  }
  const key = await deriveKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivPart) },
    key,
    fromBase64Url(payloadPart),
  );
  return JSON.parse(decoder.decode(decrypted)) as DockerLaunchTicketPayload;
};
