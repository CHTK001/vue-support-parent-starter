/**
 * Prometheus 文本格式解析（极简版）
 *
 * <p>后端若暴露了 {@code /actuator/prometheus}，返回的是 Prometheus 文本 exposition 格式。
 * 这里只解析「足够用」的部分：{@code name{label="v",...} value [timestamp]}、
 * 以及 {@code # HELP} / {@code # TYPE} 注释行直接跳过。</p>
 *
 * <p>为什么自己写而不引 {@code prometheus-parse}：整个页面只需要按指标名求和 /
 * 按标签分组，引入一个解析库（及其 esm/cjs 兼容问题）不划算；而文本格式的语法
 * 稳定到可以当成事实标准，二十行就能覆盖。</p>
 */

/** 一条样本 */
export interface PromSample {
  /** 指标名（不含标签） */
  name: string;
  /** 标签键值对（无标签时为空对象） */
  labels: Record<string, string>;
  /** 数值 */
  value: number;
}

/** 标签串解析：{@code a="1",b="2"} → { a: "1", b: "2" } */
function parseLabels(raw: string): Record<string, string> {
  const labels: Record<string, string> = {};
  // 值里可能含转义引号、逗号，用惰性匹配逐对抓
  const re = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    labels[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
  }
  return labels;
}

/**
 * 解析 Prometheus 文本。
 *
 * <p>切「指标头 / 数值」不能简单找第一个空格：标签值里可以带空格
 * （{@code {cause="G1 Evacuation Pause"}} 是 JVM GC 指标的常见写法），
 * 按空格切会把这类行整条丢掉 —— 于是 GC、堆内存这些指标全变成「没有数据」。
 * 这里先按引号状态扫到标签段结束的 {@code }}，再取其后的第一个 token 当数值。</p>
 *
 * @param text exposition 文本
 * @returns 样本数组（解析不了的行直接跳过，不抛错 —— 半个坏行不该让整张卡片白屏）
 */
export function parsePrometheus(text: string): PromSample[] {
  if (!text || typeof text !== "string") return [];
  const out: PromSample[] = [];
  for (const line of text.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;

    // ① 找指标头结束位置：无标签时是第一个空白，有标签时是配对的 }（引号内的 { } 不算）
    let headEnd = -1;
    let inQuote = false;
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "\\" && inQuote) {
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQuote = !inQuote;
        continue;
      }
      if (inQuote) continue;
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          headEnd = i;
          break;
        }
      } else if (/\s/.test(ch) && depth === 0) {
        headEnd = i - 1;
        break;
      }
    }
    if (headEnd < 0) continue;

    const head = s.slice(0, headEnd + 1).trim();
    const rest = s.slice(headEnd + 1).trim();
    const value = Number(rest.split(/\s+/)[0]);
    if (!Number.isFinite(value)) continue;

    const brace = head.indexOf("{");
    if (brace < 0) {
      out.push({ name: head, labels: {}, value });
    } else {
      const name = head.slice(0, brace);
      const close = head.lastIndexOf("}");
      out.push({ name, labels: parseLabels(head.slice(brace + 1, close < 0 ? head.length : close)), value });
    }
  }
  return out;
}

/** 是否像 Prometheus 文本（区别于 JSON 报错体 / 空响应） */
export function looksLikePrometheus(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const head = text.slice(0, 4000);
  return /^#\s*(HELP|TYPE)\s/m.test(head) || /^[a-zA-Z_:][a-zA-Z0-9_:]*(\{[^}]*\})?\s+[-+0-9.eE]+$/m.test(head);
}

/** 按指标名过滤 */
export function findSamples(samples: PromSample[], name: string): PromSample[] {
  return samples.filter((s) => s.name === name);
}

/** 按指标名求和；不存在返回 undefined（区分「没有这个指标」与「值为 0」） */
export function sumMetric(samples: PromSample[], name: string): number | undefined {
  const hit = findSamples(samples, name);
  if (!hit.length) return undefined;
  return hit.reduce((acc, s) => acc + s.value, 0);
}

/** 按指标名取首条样本值 */
export function firstMetric(samples: PromSample[], name: string): number | undefined {
  return findSamples(samples, name)[0]?.value;
}

/**
 * 带标签条件的求和（如 {@code jvm_memory_used_bytes{area="heap"}}）。
 *
 * <p>缺失返回 undefined 而不是 0：jvm 内存指标按 area / id 分组，
 * 把「没有这个切片」算成 0 会让人以为堆一点没占。</p>
 */
export function sumMetricWhere(
  samples: PromSample[],
  name: string,
  label: string,
  value: string,
): number | undefined {
  const hit = findSamples(samples, name).filter((s) => s.labels[label] === value);
  if (!hit.length) return undefined;
  return hit.reduce((acc, s) => acc + s.value, 0);
}

/**
 * 按某个标签分组求和。
 *
 * @param samples 全部样本
 * @param name    指标名
 * @param label   分组标签（如 {@code uri} / {@code status}）
 * @returns 分组名 → 求和值（按值降序）
 */
export function groupSum(samples: PromSample[], name: string, label: string): { key: string; value: number }[] {
  const map = new Map<string, number>();
  for (const s of findSamples(samples, name)) {
    const key = s.labels[label] ?? "—";
    map.set(key, (map.get(key) ?? 0) + s.value);
  }
  return [...map.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
}

/** 值格式化：按量级选单位，避免「1234567.89 ms」这种读不出量级的数字 */
export function humanValue(value: number | undefined, unit = ""): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}G${unit}`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M${unit}`;
  if (abs >= 1e4) return `${(value / 1e3).toFixed(1)}k${unit}`;
  if (abs >= 100) return `${Math.round(value)}${unit}`;
  // 计数类指标多是整数（12 次发送失败、队列积压 3），补 .00 反而添噪
  if (Number.isInteger(value)) return `${value}${unit}`;
  if (abs >= 1) return `${value.toFixed(2)}${unit}`;
  if (abs === 0) return `0${unit}`;
  return `${value.toFixed(4)}${unit}`;
}
