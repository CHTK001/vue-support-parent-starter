import type { Directive, DirectiveBinding } from "vue";

/**
 * v-check-url —— 检测域名可达性（通过 HEAD ），按域名缓存到内存 + sessionStorage
 *
 * 用法：
 *   <div v-check-url="'https://api.example.com'">...</div>
 *   <div v-check-url="'/api'">后端</div>   // 相对路径
 *
 * 行为：
 *   - 提取 value 的 origin（域名级），同一域名只发一次 HEAD 请求
 *   - 结果添加 class：`url-ok`（可达）/ `url-fail`（不可达）/ `url-checking`（检查中）
 *   - 缓存：内存 Map + sessionStorage，默认 5 分钟
 *   - 支持 string 或对象 { url, timeout, ttl }
 */

interface CheckCache {
  ok: boolean;
  checkedAt: number;
}

type CheckValue = string | { url: string; timeout?: number; ttl?: number };

interface CheckEl extends HTMLElement {
  __checkUrl?: { origin: string };
}

const memoryCache = new Map<string, CheckCache>();
const DEFAULT_TTL = 5 * 60 * 1000;
const DEFAULT_TIMEOUT = 5000;
const SESSION_PREFIX = "url-check:";

/** 从 URL 提取 origin（域名级），相对路径返回 null */
function extractOrigin(url: string): string | null {
  try {
    // 相对路径：用当前页面 origin
    if (/^[a-z0-9+.-]*:\/\//i.test(url)) {
      return new URL(url).origin;
    }
    // 以 / 开头的相对路径
    if (url.startsWith("/")) {
      return window.location.origin;
    }
    // 其它（如相对路径无 /）：用当前页面 origin
    return window.location.origin;
  } catch {
    return null;
  }
}

function parseValue(value: CheckValue): { url: string; timeout: number; ttl: number } {
  if (typeof value === "string") return { url: value, timeout: DEFAULT_TIMEOUT, ttl: DEFAULT_TTL };
  return { url: value?.url ?? "", timeout: value?.timeout ?? DEFAULT_TIMEOUT, ttl: value?.ttl ?? DEFAULT_TTL };
}

function writeSession(origin: string, cache: CheckCache): void {
  try { sessionStorage.setItem(SESSION_PREFIX + origin, JSON.stringify(cache)); } catch { /* ignore */ }
}

function readSession(origin: string): CheckCache | null {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + origin);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function readCache(origin: string, ttl: number): CheckCache | null {
  const now = Date.now();
  const mem = memoryCache.get(origin);
  if (mem && now - mem.checkedAt < ttl) return mem;
  const session = readSession(origin);
  if (session && now - session.checkedAt < ttl) {
    memoryCache.set(origin, session);
    return session;
  }
  return null;
}

async function checkOrigin(origin: string, timeout: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(origin, { method: "HEAD", mode: "cors", signal: controller.signal });
    // 任何响应（2xx/3xx/4xx）都表示服务器可达；只有网络错误才不可达
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function applyClass(el: HTMLElement, ok: boolean | null): void {
  el.classList.remove("url-checking", "url-ok", "url-fail");
  if (ok === null) el.classList.add("url-checking");
  else if (ok) el.classList.add("url-ok");
  else el.classList.add("url-fail");
}

async function doCheck(el: CheckEl, origin: string, timeout: number): Promise<void> {
  if (!origin) { applyClass(el, false); return; }
  const cached = readCache(origin, DEFAULT_TTL);
  if (cached) { applyClass(el, cached.ok); return; }
  applyClass(el, null);
  const ok = await checkOrigin(origin, timeout);
  const cache: CheckCache = { ok, checkedAt: Date.now() };
  memoryCache.set(origin, cache);
  writeSession(origin, cache);
  applyClass(el, ok);
}

const checkUrlDirective: Directive<CheckEl, CheckValue> = {
  mounted(el, binding: DirectiveBinding<CheckValue>) {
    const parsed = parseValue(binding.value);
    const origin = extractOrigin(parsed.url);
    if (!origin) { applyClass(el, false); return; }
    el.__checkUrl = { origin };
    void doCheck(el, origin, parsed.timeout);
  },
  updated(el, binding: DirectiveBinding<CheckValue>) {
    const parsed = parseValue(binding.value);
    const origin = extractOrigin(parsed.url);
    if (!origin) return;
    if (el.__checkUrl?.origin !== origin) {
      el.__checkUrl = { origin };
      void doCheck(el, origin, parsed.timeout);
    }
  },
  beforeUnmount(el) {
    el.__checkUrl = undefined;
  },
};

export default checkUrlDirective;