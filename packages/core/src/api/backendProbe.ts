/**
 * 后台能力探测 —— 用 HEAD 判断某个后台接口是否已经实现
 *
 * 顶栏天气/台风这类"平台可选增强"的能力，前端不假设后台一定提供：
 * 先 HEAD 探测，命中则走后台接口（数据与鉴权都由本系统掌控），
 * 未命中则回落到三方数据源，并把三方响应归一化成后台的同一套结构。
 *
 * 判定口径：
 *  - 2xx / 3xx                    → 已实现（Spring MVC 的 @GetMapping 自动接受 HEAD）
 *  - 400 / 405 / 415 / 422        → 已实现（路径有映射，只是不接受本次 HEAD 的参数/方法）
 *  - 401 / 403                    → 视为未实现（接口未开放匿名访问，走后台同样取不到数据）
 *  - 404 / 5xx / 网络异常          → 未实现，走三方兜底
 *
 * 探测结果按路径缓存（默认 10 分钟），同一路径的并发探测共享一次请求。
 * 后台补齐接口后最迟一个缓存周期自动切换，前端无需改动。
 */
import { getConfig } from "@repo/config";

/** 探测超时（ms）：探测在关键渲染路径上，必须短 */
const PROBE_TIMEOUT = 3000;

/** 结果缓存有效期（ms） */
const PROBE_TTL = 10 * 60 * 1000;

/** 路径已映射、只是不接受本次 HEAD 的状态码：同样判定为"后台已实现" */
const MAPPED_STATUS = new Set([400, 405, 415, 422]);

/** 已探测结果 */
interface ProbeEntry {
  available: boolean;
  at: number;
}

const probeCache = new Map<string, ProbeEntry>();
const probeInflight = new Map<string, Promise<boolean>>();

/** 相对路径拼上 http.baseUrl，得到与 http() 一致的目标地址 */
function resolveProbeUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const base = (getConfig().http.baseUrl ?? "").replace(/\/+$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}

/**
 * 探测后台是否提供指定接口。
 *
 * @param path 接口路径（相对 http.baseUrl）
 * @param ttl 结果缓存有效期（ms），默认 10 分钟
 */
export function probeBackend(path: string, ttl: number = PROBE_TTL): Promise<boolean> {
  const hit = probeCache.get(path);
  if (hit && Date.now() - hit.at < ttl) {
    return Promise.resolve(hit.available);
  }
  const pending = probeInflight.get(path);
  if (pending) {
    return pending;
  }
  const run = (async () => {
    try {
      const res = await fetch(resolveProbeUrl(path), {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(PROBE_TIMEOUT),
      });
      const available =
        (res.status >= 200 && res.status < 400) || MAPPED_STATUS.has(res.status);
      probeCache.set(path, { available, at: Date.now() });
      return available;
    } catch {
      probeCache.set(path, { available: false, at: Date.now() });
      return false;
    }
  })();
  probeInflight.set(path, run);
  void run.finally(() => {
    if (probeInflight.get(path) === run) {
      probeInflight.delete(path);
    }
  });
  return run;
}

/** 清空探测缓存（配置热更新换 baseUrl、或单测隔离时使用） */
export function resetBackendProbe(): void {
  probeCache.clear();
  probeInflight.clear();
}
