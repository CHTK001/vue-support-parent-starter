/**
 * 锁屏 Worker
 *
 * 密码哈希与锁状态在 Worker 内存中维护，主线程无法直接篡改。
 * 即使主线程清空 localStorage，只要 Worker 存活，锁状态仍保持锁定。
 * DOM 节点被手动删除时，Worker 通过 postMessage 通知主线程重建锁屏。
 */
const LOCK_KEY = "lock-screen";

let locked = false;
let passwordHash: string | null = null;

function readHash(): string | null {
  try {
    return localStorage.getItem(LOCK_KEY);
  } catch {
    return null;
  }
}

function writeHash(hash: string): void {
  try {
    localStorage.setItem(LOCK_KEY, hash);
  } catch { /* ignore */ }
}

function clearHash(): void {
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch { /* ignore */ }
}

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

addEventListener("message", async (e: MessageEvent) => {
  const { type, password } = e.data ?? {};

  switch (type) {
    case "init":
      passwordHash = readHash();
      locked = false;
      postMessage({ type: "state", locked, hasPassword: !!passwordHash });
      break;

    case "lock":
      passwordHash = readHash();
      locked = true;
      postMessage({ type: "state", locked, hasPassword: !!passwordHash });
      break;

    case "syncAndLock":
    case "sync":
      passwordHash = readHash();
      postMessage({ type: "state", locked, hasPassword: !!passwordHash });
      break;

    case "unlock": {
      if (!password) {
        postMessage({ type: "unlocked", success: false });
        return;
      }
      const hash = await sha256(password);
      const ok = passwordHash != null && hash === passwordHash;
      if (ok) locked = false;
      postMessage({ type: "unlocked", success: ok });
      break;
    }

    case "setPassword": {
      if (!password) {
        postMessage({ type: "passwordSet", success: false });
        return;
      }
      const hash = await sha256(password);
      passwordHash = hash;
      writeHash(hash);
      postMessage({ type: "passwordSet", success: true });
      break;
    }

    case "resetPassword":
      passwordHash = null;
      clearHash();
      postMessage({ type: "passwordReset", success: true });
      break;

    case "getState":
      postMessage({ type: "state", locked, hasPassword: !!passwordHash });
      break;
  }
});