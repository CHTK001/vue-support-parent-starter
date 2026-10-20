/**
 * chartTheme.ts —— ECharts 主题助手（令牌驱动）
 *
 * 解决的问题：原先各页图表把色值写死在 option 里（#3b82f6 / #0b0f1a /
 * #e6edf7 / #22c55e …），换主题或调整色板要逐页搜 hex，且与 CSS 令牌脱节。
 *
 * 现在图表色一律从 CSS 令牌（styles/tokens.css）读取：
 *   --apm-chart-1..6  序列色（订单即默认取色顺序）
 *   --apm-chart-grid  网格线
 *   --apm-chart-axis  轴文字
 *   --apm-panel       tooltip 背景
 * 换主题只需改 tokens.css，所有图表自动跟随。
 *
 * 注意：ReEcharts 组件本身也会注入 --el-color-* 调色板，但它只填 option
 * 未指定的 series 颜色。这里显式指定是为了保证「协议分布/成功失败」这类
 * 有语义的配色不被默认序列色覆盖。
 */

/**
 * 读取一个 CSS 自定义属性，返回**可直接喂给 ECharts 的字面量颜色**。
 *
 * 两道防线，都是因为 zrender 只认 `#hex` / `r,g,b` 字面量：
 *   1. 令牌里大量用 `--a: var(--b)` 做语义别名，getPropertyValue 取到的可能
 *      仍是未替换的 `var(--b)` —— 递归解到出现字面量为止。
 *   2. 解到最后仍是 var()/color-mix()/空值时回落到 fallback，
 *      绝不把 zrender 解析不了的字符串放出去。
 *
 * 每个变量首次读取后缓存，避免每次渲染图表都走一遍 getComputedStyle。
 */
const cssVarCache = new Map<string, string>();

/** 令牌本体是静态的，缓存安全；热更新时由页面刷新失效。 */
function readRawVar(name: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function cssVar(name: string, fallback: string): string {
  const cached = cssVarCache.get(name);
  if (cached !== undefined) {
    return cached;
  }

  let value = readRawVar(name);
  let hops = 0;
  // 递归展开 var() 别名链，设上限防止循环引用死循环
  while (/^var\(/i.test(value) && hops < 8) {
    const inner = value.match(/^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)\s*$/i);
    if (!inner || inner[1] === undefined) {
      break;
    }
    const next = readRawVar(inner[1]);
    if (!next) {
      break;
    }
    value = next;
    hops++;
  }

  const unusable =
    !value ||
    /^var\(/i.test(value) ||
    /color-mix\(/i.test(value) ||
    /oklch\(/i.test(value);
  const resolved = unusable ? fallback : value;

  cssVarCache.set(name, resolved);
  return resolved;
}

/** 图表序列色（按 --apm-chart-1..6 顺序）。 */
export function chartPalette(): string[] {
  return [
    cssVar("--apm-chart-1", "#4d7cfe"),
    cssVar("--apm-chart-2", "#2fd8a3"),
    cssVar("--apm-chart-3", "#7c6cfa"),
    cssVar("--apm-chart-4", "#f5a524"),
    cssVar("--apm-chart-5", "#22d3ee"),
    cssVar("--apm-chart-6", "#f4614f"),
  ];
}

/** 取第 n 个序列色（越界时环形取模，保证永远有合法色）。 */
export function chartColor(index: number): string {
  const p = chartPalette();
  return p[((index % p.length) + p.length) % p.length];
}

/** 成功/失败语义色。 */
export function okColor(): string {
  return cssVar("--apm-success", "#2fd8a3");
}

export function dangerColor(): string {
  return cssVar("--apm-danger", "#f4614f");
}

export function warningColor(): string {
  return cssVar("--apm-warning", "#f5a524");
}

export function infoColor(): string {
  return cssVar("--apm-info", "#22d3ee");
}

/** 轴线与轴文字颜色。 */
export function axisTextColor(): string {
  return cssVar("--apm-chart-axis", "#6b7a95");
}

/**
 * 图内主文字（节点名、大数值标签）。
 *
 * 与 axisTextColor 区分：轴文字是"弱"信息（刻度），节点/主标签是"强"信息，
 * 混用会让拓扑图的节点名和刻度一样灰，层次塌掉。
 */
export function fgColor(): string {
  return cssVar("--apm-fg", "#eaf0fb");
}

/** 图内次要文字/中性元素（模块节点、虚线连接、默认连线）。 */
export function mutedColor(): string {
  return cssVar("--apm-muted", "#6b7a95");
}

/** 中性灰（未知/未分类节点）。 */
export function neutralColor(): string {
  return cssVar("--apm-neutral", "#7c8aa5");
}

export function axisLineColor(): string {
  return cssVar("--apm-border-soft", "#151d33");
}

export function splitLineColor(): string {
  return cssVar("--apm-chart-grid", "rgba(107,122,149,0.16)");
}

/** tooltip 背景/边框/文字（深色抬升面）。 */
export function tooltipStyle(): {
  backgroundColor: string;
  borderColor: string;
  textStyle: { color: string };
} {
  return {
    backgroundColor: cssVar("--apm-panel-raised", "#111827"),
    borderColor: cssVar("--apm-border", "#1c2540"),
    textStyle: { color: cssVar("--apm-fg", "#eaf0fb") },
  };
}

/** 面板/画布底色（饼图分隔环、图形间隙用，需与卡片底一致）。 */
export function panelBgColor(): string {
  return cssVar("--apm-panel", "#0b101d");
}

/**
 * 统一的坐标轴配置（类目轴）。
 *
 * 深色底上刻意不画轴线、只保留淡分隔线：轴线与网格线同时存在会让图表
 * 显得"网格化"，数据趋势反而被淹没。
 */
export function categoryAxis(data: string[]) {
  return {
    type: "category" as const,
    data,
    axisLine: { lineStyle: { color: axisLineColor() } },
    axisTick: { show: false },
    axisLabel: { color: axisTextColor(), fontSize: 11 },
  };
}

/** 统一的数值轴配置。 */
export function valueAxis(extra: Record<string, unknown> = {}) {
  return {
    type: "value" as const,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: axisTextColor(), fontSize: 11 },
    splitLine: { lineStyle: { color: splitLineColor(), type: "dashed" as const } },
    ...extra,
  };
}

/**
 * 面积图渐变填充（从序列色向下淡出）。
 *
 * 深色底上直接用实色填充面积会盖住网格线，故用同色系渐变到透明。
 */
export function areaGradient(color: string, from = 0.28, to = 0) {
  return {
    type: "linear" as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: colorWithAlpha(color, from) },
      { offset: 1, color: colorWithAlpha(color, to) },
    ],
  };
}

/**
 * 给颜色加透明度。
 *
 * 输出必须是 `rgba(r,g,b,a)` **逗号语法** —— 这是硬约束，不是风格偏好：
 * ECharts 底层的 zrender 解析器（zrender/lib/tool/color.js:191）用
 * `.split(',')` 拆参数，现代语法 `rgb(r g b / a)` 会被整个当成一个参数，
 * 长度对不上而返回 undefined，表现为面积图变实心块、渐变失效。
 * 实测见 README「图表颜色」一节。
 *
 * 支持 #rgb / #rrggbb / rgb() 与已带 alpha 的输入；
 * 解析不出时退回不透明灰，保证输出永远是 zrender 可读的颜色。
 */
export function colorWithAlpha(color: string, alpha: number): string {
  const a = clamp01(alpha);
  const rgba = toRgbaTuple(color);
  if (!rgba) {
    return `rgba(128,128,128,${a})`;
  }
  return `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${a})`;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 把任意 CSS 颜色字符串转成 [r,g,b]（0..255），失败返回 null。
 *
 * 刻意**不**接受 var() / color-mix() / oklch()：这些 zrender 同样解析不了，
 * 让它们在这里失败并在调用处回落到字面量，比把非法值悄悄传给 ECharts 好。
 */
function toRgbaTuple(color: string): [number, number, number] | null {
  const c = color.trim();
  if (!c || c.includes("var(") || c.includes("color-mix(") || c.includes("oklch(")) {
    return null;
  }

  const rgbMatch = c.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch && rgbMatch[1] !== undefined) {
    // 兼容 `r,g,b` 与 `r g b / a` 两种分隔
    const parts = rgbMatch[1]
      .split(/[,/\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== "/");
    const [rs, gs, bs] = parts;
    if (rs === undefined || gs === undefined || bs === undefined) {
      return null;
    }
    const rgb: [number, number, number] = [
      Math.round(parseFloat(rs)),
      Math.round(parseFloat(gs)),
      Math.round(parseFloat(bs)),
    ];
    return rgb.every((n) => Number.isFinite(n)) ? rgb : null;
  }

  const hex = c.replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const [r, g, b] = hex.split("");
    return [
      parseInt(r! + r!, 16),
      parseInt(g! + g!, 16),
      parseInt(b! + b!, 16),
    ];
  }
  if (/^[0-9a-f]{6}$/i.test(hex) || /^[0-9a-f]{8}$/i.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  return null;
}

/**
 * 图表外壳公共项：透明画布背景。
 *
 * 必须显式声明 —— ReEcharts 用 theme="dark" 初始化，而 ECharts 6 的 dark 主题
 * 默认 backgroundColor = rgba(4,8,16,1)（不透明），会用这块纯色盖满绘图区，
 * 与卡片底色形成一个突兀的深色矩形。原代码每个图表都设了 transparent，
 * 重写 option 时漏掉会直接表现成「图表区一块实心色块」。
 *
 * 放进 baseGrid 之外单列，是因为它属于 series/画布层而非 grid 几何。
 */
export function chartCanvas(extra: Record<string, unknown> = {}) {
  return {
    backgroundColor: "transparent",
    ...extra,
  };
}

/**
 * 基础图表外壳：统一 tooltip / 网格 / 是否显示图例。
 *
 * 各页原先各自抄一份 grid{left:40,right:20,top:20,bottom:24}，
 * 这里收敛成一个函数，间距不一致的问题一并消除。
 */
export function baseGrid(extra: Record<string, unknown> = {}) {
  return {
    left: 48,
    right: 20,
    top: 32,
    bottom: 28,
    containLabel: true,
    ...extra,
  };
}

export function baseTooltip(extra: Record<string, unknown> = {}) {
  return {
    trigger: "axis" as const,
    ...tooltipStyle(),
    axisPointer: { type: "line" as const, lineStyle: { color: splitLineColor() } },
    ...extra,
  };
}
