const encoder = new TextEncoder();

const SECRET = "server-docker-launch-ticket-v1";

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const deriveKey = async () => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(SECRET));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt"]);
};

export type DockerLaunchPayload = {
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
  issuedAt: number;
};

/**
 * 生成 Docker 跳转加密 ticket，用于地址栏安全传递服务器信息。
 */
export const encryptDockerLaunchTicket = async (payload: DockerLaunchPayload) => {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
};
