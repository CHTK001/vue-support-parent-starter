import { computed, ref, type ComputedRef, type Ref } from "vue";
import { resolveLoaderDeployPolicy, type LoaderDeployPolicy } from "@repo/config";

/**
 * 统一加载动画（唯一定义处）
 *
 * <p>十款 CSS 动画只在这里写一次，三处共用：</p>
 * <ul>
 *   <li><b>首屏</b>：{@code public/loader.js} 注入同一份 CSS（该文件是 public 静态资源，
 *       不能 import 本模块，因此那里是逐字一致的副本，由
 *       {@code test/vue/loader-anim/verify.mjs} 校验字节一致）；</li>
 *   <li><b>应用内</b>：{@code ReLoader} 组件用 {@link loaderAnimationMarkup} 渲染同样的类名；</li>
 *   <li><b>主题配置</b>：设置抽屉里的选择器直接复用同一份 CSS 做缩略预览。</li>
 * </ul>
 *
 * <p>尺寸只读 {@code --sla-s}（像素），内部一律用 em 换算 —— 于是 96px 的首屏与 28px 的行内
 * 用的是同一套样式，不需要维护两份；颜色只读 {@code --sla-c}。</p>
 */

/** 十款 CSS 动画的键（同时也是 localStorage 里 {@code sys-loader-style} 的值） */
export const LOADER_ANIMATIONS = [
  "dots",
  "rings",
  "dino",
  "ripple",
  "orbit",
  "bars",
  "matrix",
  "conveyor",
  "pillars",
  "cards",
] as const;

/** 动画键 */
export type LoaderAnimation = (typeof LOADER_ANIMATIONS)[number];

/** 「无动画」开关：不是动画，但必须能选，否则停不掉 */
export const LOADER_ANIMATION_NONE = "none";

/** 选择器 / 配置里能出现的全部取值 */
export type LoaderAnimationChoice = LoaderAnimation | typeof LOADER_ANIMATION_NONE;

/** 每个动画的展示信息（主题配置、文档、演示共用，避免各处再写一遍文案） */
export const LOADER_ANIMATION_META: Record<
  LoaderAnimationChoice,
  { name: string; description: string }
> = {
  dots: {
    name: "三个圆点",
    description: "经典三点跳动，最通用、最低调",
  },
  rings: {
    name: "科技圆圈",
    description: "双环反向旋转 + 中心脉冲，偏科技感",
  },
  dino: {
    name: "像素恐龙",
    description: "像素恐龙跨栏：方向键 / 空格起跳、有积分、撞到就结束，等待时能玩一把",
  },
  ripple: {
    name: "水波涟漪",
    description: "三圈同心涟漪向外扩散，安静、节奏均匀",
  },
  orbit: {
    name: "双轨环绕",
    description: "一颗卫星绕环运行，内外双轨反向，偏太空感",
  },
  bars: {
    name: "音量柱",
    description: "四根竖向音柱各自起伏，像在听一段节奏",
  },
  matrix: {
    name: "点阵",
    description: "七乘七点阵被一道扫描带掠过，像信号正在传输",
  },
  conveyor: {
    name: "传送带",
    description: "板条箱沿传送带穿过闸门，适合表达流程在推进",
  },
  pillars: {
    name: "柱阵",
    description: "柱阵逐排起伏，像数据正在铺开",
  },
  cards: {
    name: "卡片翻动",
    description: "三张卡片依次翻面，节奏轻快不抢眼",
  },
  none: {
    name: "无动画",
    description: "只保留纯色底，不显示任何动效",
  },
};

/**
 * 历史取值映射。
 *
 * <p>旧版本存过 {@code default / dinoGame / simple / pulse / blocks / book / minecraft /
 * pokemon / cyberpunk / writing} 等键；后端 {@code LoadingPageStyle} 也会写入
 * {@code spinner / clock / pixel / cube / dots / pulse / minimal / space / servererror}。
 * 这些值不能再让用户看到「选中的动画不见了」，统一折到最接近的现行动画之一。</p>
 */
const LEGACY_ANIMATION_ALIASES: Record<string, LoaderAnimationChoice> = {
  // 现行键必须先映射到自己：漏一个就会"选了却回退默认"，而且完全无声。
  // 由 test/vue/loader-anim 的 canonical 自映射检查兜住。
  dots: "dots",
  rings: "rings",
  dino: "dino",
  ripple: "ripple",
  orbit: "orbit",
  bars: "bars",
  matrix: "matrix",
  conveyor: "conveyor",
  pillars: "pillars",
  cards: "cards",
  none: "none",

  // 线稿动画（hairline-*）已下线，改为纯 CSS 的四款：存量选择折到最接近的一款，
  // 这样老用户刷新后看到的是「同一件事换了个画法」，而不是动画突然消失。
  "hairline-phosphor": "matrix",
  "hairline-slow": "conveyor",
  "hairline-terrain": "pillars",
  "hairline-turntable": "cards",

  // 已下线的动画：存量 localStorage / 后端配置里可能还有，必须折到现存的一款，
  // 否则这些用户刷新后看到的是「动画没了」。
  default: "dots",
  pulse: "dots",
  blocks: "dots",
  book: "dots",
  writing: "dots",
  pokemon: "dots",
  // 海浪已下线：存量值折到默认的三点，不留空白
  wave: "dots",
  hourglass: "dots",
  clock: "dots",
  minimal: "dots",
  cube: "dots",
  servererror: "dots",
  dinoGame: "dino",
  pixel: "dino",
  // ReLoader 的旧键：spin 曾等价于"科技双环"
  spin: "rings",
  simple: "rings",
  spinner: "rings",
  space: "rings",
  cyberpunk: "rings",
};

/**
 * 把任意历史值折成当前合法取值。
 *
 * @param value 本地存储 / 后端下发的原始值
 * @returns 合法键；无法识别时返回 {@code null}（由调用方决定兜底）
 */
export function normalizeLoaderAnimation(value: unknown): LoaderAnimationChoice | null {
  if (typeof value !== "string") return null;
  const key = value.trim();
  if (!key) return null;
  return LEGACY_ANIMATION_ALIASES[key] ?? null;
}

/** localStorage 里存动画的键（与 loader.js 完全一致，含 appCode 后缀） */
const STORAGE_KEY = "sys-loader-style";

/** 读取当前应用的 appCode（与 loader.js 的探测顺序一致） */
function resolveAppCode(): string {
  const win = window as unknown as { __SYS_APP_CODE__?: string };
  const fromWindow = typeof win.__SYS_APP_CODE__ === "string" ? win.__SYS_APP_CODE__.trim() : "";
  if (fromWindow) return fromWindow;

  const meta = document.querySelector('meta[name="sys-app-code"]')?.getAttribute("content");
  if (meta && meta.trim()) return meta.trim();

  return document.documentElement?.getAttribute("data-system-code")?.trim() ?? "";
}

/** 带 appCode 的存储键；没有 appCode 时退回全局键 */
export function loaderAnimationStorageKey(appCode = resolveAppCode()): string {
  return appCode ? `${STORAGE_KEY}:${appCode}` : STORAGE_KEY;
}

/**
 * 读取用户选择的动画。
 *
 * @param fallback 没存过 / 值无法识别时的兜底
 */
export function readLoaderAnimation(
  fallback: LoaderAnimationChoice = "dots",
  appCode = resolveAppCode(),
): LoaderAnimationChoice {
  try {
    const scoped = localStorage.getItem(loaderAnimationStorageKey(appCode));
    const scopedKey = normalizeLoaderAnimation(scoped);
    if (scopedKey) return scopedKey;

    // 兼容只写过全局键的旧版本（doc-v2.js 里 LoadingPageStyle 走的就是这个键）
    const globalKey = normalizeLoaderAnimation(localStorage.getItem(STORAGE_KEY));
    if (globalKey) return globalKey;
  } catch {
    // localStorage 被禁用（隐私模式 / iframe 三方 Cookie）：用兜底值，不影响加载
  }
  return fallback;
}

/**
 * 写入用户选择的动画。
 *
 * <p>同时写带 appCode 与不带 appCode 两个键：首屏 loader 在应用还没起来时就要读，
 * 那时 appCode 可能来自 meta，写两份才能保证刷新后立刻生效。</p>
 */
export function writeLoaderAnimation(choice: LoaderAnimationChoice, appCode = resolveAppCode()): void {
  try {
    localStorage.setItem(loaderAnimationStorageKey(appCode), choice);
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // 写不进去不抛：设置项在本次会话内仍然生效（组件走内存态）
  }
}

/** 注入动画样式的 style 标签 id */
const ANIM_STYLE_ID = "sys-loader-anim-style";

/**
 * 全局注入一次动画样式。
 *
 * <p>首屏由 {@code loader.js} 注入同样内容；应用内由这里补齐 —— 两者 id 不同，
 * 互不覆盖，也不会出现「首屏隐藏后动画样式被一起删掉」的问题。</p>
 */
export function ensureLoaderAnimationStyle(doc: Document = document): void {
  if (doc.getElementById(ANIM_STYLE_ID)) return;
  if (!doc.head && !doc.documentElement) return;
  const style = doc.createElement("style");
  style.id = ANIM_STYLE_ID;
  style.textContent = LOADER_ANIMATION_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

/**
 * 全局当前动画（响应式）。
 *
 * <p>初值在客户端创建时从 localStorage 读；SSR / 构建期没有 localStorage，
 * 落到 {@code dots}，不会因为读不到而报错。</p>
 *
 * <p>部署侧接管（{@code app.yaml other.loaderConfig.enable: true}）时这里是
 * <b>只读</b>的：值由配置决定，用户在主题配置里改不动（选择器会置灰）。</p>
 */
const userAnimation: Ref<LoaderAnimationChoice> = ref(
  typeof window === "undefined" ? "dots" : readLoaderAnimation(),
);

/**
 * 部署侧加载动画策略（响应式）。
 *
 * <p>直接读 {@code @repo/config} 的响应式配置，所以 app.yaml / 远程配置更新后
 * 这里跟着重算，不需要额外订阅。未接管时 {@code locked === false}，
 * 行为与没有这段配置时逐字一致。</p>
 */
export function useLoaderDeployPolicy(): ComputedRef<LoaderDeployPolicy> {
  return computed(() => resolveLoaderDeployPolicy());
}

/**
 * 当前生效的动画（唯一的读取口）。
 *
 * <p>锁定态返回部署配置里的动画（历史键照样折叠），未锁定态返回用户选择 ——
 * 于是首屏、ReLoader、主题配置预览三处永远不会各说各话。</p>
 */
const currentAnimation: ComputedRef<LoaderAnimationChoice> = computed(() => {
  const policy = resolveLoaderDeployPolicy();
  if (policy.locked) {
    return normalizeLoaderAnimation(policy.animation) ?? "dots";
  }
  return userAnimation.value;
});

/** 只读的当前动画（组件 / 配置面板都订阅它，改一处全局立即跟着换） */
export function useLoaderAnimation(): Readonly<Ref<LoaderAnimationChoice>> {
  return currentAnimation;
}

/**
 * 部署侧是否锁定了动画（主题配置据此置灰选择器）。
 *
 * @returns 锁定返回 true；未接管返回 false
 */
export function isLoaderAnimationLocked(): boolean {
  return resolveLoaderDeployPolicy().locked;
}

/**
 * 切换全局动画。
 *
 * <p>三处联动都在这里收口：内存态（组件立即重渲染）+ localStorage（下次刷新首屏用同一款）。
 * 首屏正在显示时也会就地换 —— 首屏只在启动那几秒存在，用户改完设置刷新时才用得上，
 * 但保持一致比"改了却看不到"更符合预期。</p>
 *
 * <p><b>锁定态直接返回</b>：既不写内存态也不写 localStorage —— 界面会置灰，
 * 但代码路径（快捷键、脚本调用、历史遗留的按钮）绕不过这一层。</p>
 */
export function setLoaderAnimation(choice: LoaderAnimationChoice): void {
  if (isLoaderAnimationLocked()) return;
  userAnimation.value = choice;
  writeLoaderAnimation(choice);
  syncBootLoader(choice);
}

/**
 * 把选择同步到首屏 loader。
 *
 * <p>首屏的 DOM 由 {@code public/loader.js} 注入，应用内改不了一份已渲染好的结构 ——
 * 这里只处理「首屏还挂着」的瞬间：有容器就按新键重绘，没有就什么都不做。</p>
 *
 * <p>只重绘动画，<b>不动尺寸与主色</b>：锁定态下本函数根本走不到
 * （{@link setLoaderAnimation} 已提前返回），未锁定态的尺寸/主色由
 * {@code loader.js} 的默认值决定，改它反而会让首屏和应用内不一致。</p>
 */
function syncBootLoader(choice: LoaderAnimationChoice): void {
  if (typeof document === "undefined") return;
  const container = document.getElementById("app-loader");
  if (!container) return;
  if (choice === LOADER_ANIMATION_NONE) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `<div class="sys-loader-shell" data-loader-key="${choice}">${loaderAnimationMarkup(choice)}</div>`;
  ensureLoaderAnimationStyle();
}

/**
 * 生成某个动画的 HTML。
 *
 * @param animation 动画键
 * @param percent   预留：真实进度（0-100）；未知键按默认动画渲染
 * @returns 可直接塞进容器的 HTML 字符串（内容完全由本模块生成，不含用户输入）
 */
export function loaderAnimationMarkup(
  animation: LoaderAnimationChoice,
  percent: number | null = null,
): string {
  switch (animation) {
    case "dots":
      return '<div class="sla sla-dots"><i></i><i></i><i></i></div>';

    case "rings":
      return '<div class="sla sla-rings"><i></i><i></i><i></i></div>';

    case "dino":
      return (
        '<div class="sla sla-dino">' +
        '<div class="sla-dino__scene">' +
        '<div class="sla-dino__ground"></div>' +
        '<div class="sla-dino__runner">' +
        '<span class="sla-dino__body"></span><span class="sla-dino__head"></span>' +
        '<span class="sla-dino__tail"></span>' +
        '<span class="sla-dino__leg sla-dino__leg--front"></span>' +
        '<span class="sla-dino__leg sla-dino__leg--back"></span>' +
        "</div>" +
        '<div class="sla-dino__cactus">' +
        '<span class="sla-dino__branch sla-dino__branch--left"></span>' +
        '<span class="sla-dino__branch sla-dino__branch--right"></span>' +
        "</div></div></div>"
      );

    case "ripple":
      return '<div class="sla sla-ripple"><i></i><i></i><i></i></div>';

    case "orbit":
      return '<div class="sla sla-orbit"><i></i><i></i></div>';

    case "bars":
      return '<div class="sla sla-bars"><i></i><i></i><i></i><i></i></div>';

    // 七乘七点阵：单元由 CSS 的渐变网格画出，这里只要一个空的扫描层
    case "matrix":
      return '<div class="sla sla-matrix"><i></i></div>';

    // 传送带：两条滚动的皮带 + 居中缓缓抬起的板条箱
    case "conveyor":
      return (
        '<div class="sla sla-conveyor">' +
        '<div class="sla-conveyor__belt sla-conveyor__belt--top"></div>' +
        '<div class="sla-conveyor__belt sla-conveyor__belt--bottom"></div>' +
        '<div class="sla-conveyor__crate"></div>' +
        "</div>"
      );

    // 柱阵：三排五列，靠 nth-child 的偏移做出斜向波
    case "pillars":
      return (
        '<div class="sla sla-pillars">' +
        "<i></i><i></i><i></i><i></i><i></i>" +
        "<i></i><i></i><i></i><i></i><i></i>" +
        "<i></i><i></i><i></i><i></i><i></i>" +
        "</div>"
      );

    // 卡片翻动：三张卡绕 Y 轴依次翻面
    case "cards":
      return '<div class="sla sla-cards"><i></i><i></i><i></i></div>';

    case "none":
      return '<div class="sla sla-none" aria-hidden="true"></div>';

    default:
      // 认不出的键（含已下线/线稿键）统一落到默认的三点，不留空白
      return '<div class="sla sla-dots"><i></i><i></i><i></i></div>';
  }
}

/**
 * 加载动画用到的 hairline 图形。
 *
 * <p>用户明确要求「直接用 hairline 图形」：点阵 / 传送带 / 柱阵 / 卡片翻动这四款在应用内
 * 由 {at code at lucasmarkes/hairline} 真画（函数来自 {at src packages/ui/src/components/ReEmpty/figures.ts}），
 * 不再是「只用 CSS 重画一遍」。</p>
 *
 * <p><b>卡片翻动为什么不是 turntable：</b>那个图形没有自转动画 —— 它随指针横向划过才转，
 * 转完吸附到最近的 90°。加载态里根本没有指针，挂上去就是一张静止的转盘（实测静置与
 * 指针不动时内容逐帧完全相同）。改用同一图库里的 {at code riffle}：一叠卡片自己就会
 * 起落翻动，符合「卡片翻动」这个名字，也不需要我们给图库写补丁。</p>
 *
 * <p>代价与约束：首屏 {at code public/loader.js} 是静态脚本，加载不了这个库，
 * 这四款在首屏退回纯 CSS 近似图（同色同尺寸）；应用内与预览图则一律走矢量图。</p>
 */
export const LOADER_HAIRLINE_FIGURES = {
  matrix: "phosphor",
  conveyor: "slow",
  pillars: "terrain",
  cards: "riffle",
} as const satisfies Partial<Record<LoaderAnimationChoice, string>>;

/** 该动画对应的 hairline 图形键；不是矢量款返回 {at code null} */
export function loaderHairlineFigureOf(animation: LoaderAnimationChoice): string | null {
  const figures = LOADER_HAIRLINE_FIGURES as Record<string, string>;
  return figures[animation] ?? null;
}

/**
 * 十款 CSS 动画的完整样式（首屏与应用内唯一的一份）。
 *
 * <p>两条硬规则，改样式时别破坏：</p>
 * <ul>
 *   <li><b>尺寸/主色只能写 {@code var(--sla-s, 兜底)} 形式</b>，不能直接在 {@code .sla} 上
 *       声明 {@code --sla-s}。自定义属性"元素自身优先于继承"，一旦在这里声明，
 *       外部（ReLoader 的 wrapper、首屏的 {@code #app-loader}）设下的同名变量就被挡住，
 *       表现是"传了尺寸却还是 64px"。</li>
 *   <li><b>必须与 {@code public/loader.js} 里的副本逐字一致</b>：那边是 public 静态资源，
 *       不能 import 本模块。由 {@code test/vue/loader-anim/verify.mjs} 做字节比对。</li>
 * </ul>
 */
export const LOADER_ANIMATION_CSS = `
/* ===== 统一加载动画（首屏 loader / ReLoader / 主题配置预览共用） ===== */
.sla{position:relative;display:block;flex:0 0 auto;box-sizing:border-box;line-height:0;color:var(--sla-c,#406eeb)}

/* ── 三个圆点 ──
   点的直径只取 --sla-s 的 0.16 倍（旧值 0.34）：首屏默认 96px 时单个点约 15px，
   旧值会到 33px —— 三个连起来像三个大圆球，这是「默认太大了」的直接原因。
   动效是每个点各自「从无到有」：scale(0)/opacity:0 起，依次错峰 0.16s，
   于是看到的是「第一个冒出来 → 第二个 → 第三个 → 收回去」的呼吸，而不是整排一起跳。 */
.sla-dots{width:calc(var(--sla-s,64px)*1.1);height:calc(var(--sla-s,64px)*0.34);display:flex;align-items:center;justify-content:space-between}
.sla-dots i{display:block;width:calc(var(--sla-s,64px)*0.16);height:calc(var(--sla-s,64px)*0.16);border-radius:50%;background:currentColor;transform:scale(0);opacity:0;animation:sla-dot calc(1.5s / var(--sla-rate,1)) cubic-bezier(.4,0,.6,1) infinite both}
.sla-dots i:nth-child(2){animation-delay:calc(.16s / var(--sla-rate,1))}
.sla-dots i:nth-child(3){animation-delay:calc(.32s / var(--sla-rate,1))}
@keyframes sla-dot{0%,6%{transform:scale(0);opacity:0}42%{transform:scale(1);opacity:1}70%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}}

/* ── 科技圆圈 ── */
.sla-rings{width:var(--sla-s,64px);height:var(--sla-s,64px);font-size:calc(var(--sla-s,64px)/4.4)}
.sla-rings::before{content:'';position:absolute;inset:-.45em;border:.1em solid color-mix(in srgb,var(--sla-c,#406eeb) 12%,transparent);border-radius:50%}
.sla-rings i{position:absolute;display:block;border-radius:50%;border:.2em solid transparent}
.sla-rings i:nth-child(1){inset:0;border-top-color:currentColor;border-right-color:color-mix(in srgb,var(--sla-c,#406eeb) 40%,transparent);animation:sla-spin calc(1.6s / var(--sla-rate,1)) linear infinite}
.sla-rings i:nth-child(2){inset:.85em;border-bottom-color:currentColor;border-left-color:color-mix(in srgb,var(--sla-c,#406eeb) 40%,transparent);animation:sla-spin calc(1.15s / var(--sla-rate,1)) linear infinite reverse}
.sla-rings i:nth-child(3){inset:0;width:.62em;height:.62em;margin:auto;background:currentColor;border:0;animation:sla-core calc(1.7s / var(--sla-rate,1)) ease-in-out infinite}
@keyframes sla-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes sla-core{0%,100%{transform:scale(.72);opacity:.6}50%{transform:scale(1.12);opacity:1}}

/* ── 像素恐龙 ──
   坐标全部用 em：--sla-s 表示**高度**（与圆圈同口径），
   横向按原始 220×88 的比例放大到 2.5 倍高度。
   为什么不写 calc(220px * calc(var(--sla-s)/220)) —— 单位相乘在 CSS 里非法，
   整条声明会被丢弃，表现是"永远 220px、永不缩放"（实测踩过）。
   用 em 一次解决：1em = 高度/8.8，所有原坐标除以 10 就是 em 值。 */
.sla-dino{width:calc(var(--sla-s,96px)*2.5);height:var(--sla-s,96px);font-size:calc(var(--sla-s,96px)/8.8);overflow:hidden}
.sla-dino__scene{position:relative;width:100%;height:100%;overflow:hidden}
.sla-dino__ground{position:absolute;right:0;bottom:1.4em;left:0;height:.3em;background:repeating-linear-gradient(90deg,#52525b 0 1.4em,rgba(82,82,91,.15) 1.4em 2em);background-size:2em 100%;animation:sla-dino-ground calc(1.65s / var(--sla-rate,1)) linear infinite}
.sla-dino__runner{position:absolute;bottom:1.7em;left:2.6em;width:4.8em;height:4em;z-index:1;animation:sla-dino-jump calc(1.15s / var(--sla-rate,1)) ease-in-out infinite}
.sla-dino__body,.sla-dino__head,.sla-dino__tail,.sla-dino__leg,.sla-dino__cactus,.sla-dino__branch{position:absolute;display:block;background:#111827}
.sla-dino__body{bottom:1em;left:.8em;width:2.4em;height:1.6em}
.sla-dino__head{top:0;right:0;width:1.6em;height:1.4em;box-shadow:-.6em .3em 0 0 #111827,.8em .3em 0 -.5em #f8fafc}
.sla-dino__tail{bottom:1.8em;left:0;width:1em;height:.6em}
.sla-dino__leg{bottom:0;width:.6em;height:1.4em;animation:sla-dino-run calc(.38s / var(--sla-rate,1)) steps(1) infinite}
.sla-dino__leg--front{left:1.4em}
.sla-dino__leg--back{left:2.6em;animation-delay:calc(.19s / var(--sla-rate,1))}
/* 仙人掌从左前方远处进入：起点在容器右侧之外，落到 ground 之上，
   z-index 低于 runner，于是"从恐龙身后穿过"而不是糊在它身上 */
.sla-dino__cactus{right:-3em;bottom:1.7em;width:1.4em;height:3em;background:#14532d;z-index:0;animation:sla-dino-cactus calc(1.65s / var(--sla-rate,1)) linear infinite}
.sla-dino__branch{width:.6em;height:1.2em;background:#14532d}
.sla-dino__branch--left{top:.8em;left:-.5em}
.sla-dino__branch--right{top:.3em;right:-.5em}
@keyframes sla-dino-jump{0%,22%,100%{transform:translateY(0)}48%{transform:translateY(-2.8em)}}
@keyframes sla-dino-run{0%,100%{height:1.4em}50%{height:.9em}}
/* 仙人掌横穿整个场景（宽度约 10em 的容器 + 起点在右侧外），到左侧外再回环 */
@keyframes sla-dino-cactus{from{transform:translateX(0)}to{transform:translateX(-18em)}}
@keyframes sla-dino-ground{from{background-position:0 0}to{background-position:-2em 0}}

/* ── 水波涟漪 ──
   三圈同心环从中心向外扩散，错峰 1/3 周期。环本身不移动，只做 scale + 透明度，
   所以不会像旋转类动画那样抢注意力 —— 适合"等一个后台任务"这种长等待。 */
.sla-ripple{width:var(--sla-s,64px);height:var(--sla-s,64px)}
.sla-ripple i{position:absolute;inset:0;margin:auto;width:100%;height:100%;border:calc(var(--sla-s,64px)*0.045) solid currentColor;border-radius:50%;opacity:0;transform:scale(.18);animation:sla-ripple calc(2.4s / var(--sla-rate,1)) cubic-bezier(.2,.6,.3,1) infinite}
.sla-ripple i:nth-child(2){animation-delay:calc(.8s / var(--sla-rate,1))}
.sla-ripple i:nth-child(3){animation-delay:calc(1.6s / var(--sla-rate,1))}
@keyframes sla-ripple{0%{transform:scale(.18);opacity:0}12%{opacity:.9}70%{opacity:.24}100%{transform:scale(1);opacity:0}}

/* ── 双轨环绕 ──
   一颗卫星沿外圈顺时针、一颗沿内圈逆时针；轨道本身只画一圈淡色参考线。
   卫星用 ::before 挂在轨道顶端，rotate 整条轨道即等于卫星绕圈。 */
.sla-orbit{width:var(--sla-s,64px);height:var(--sla-s,64px)}
.sla-orbit::before{content:'';position:absolute;inset:0;border:1px solid color-mix(in srgb,var(--sla-c,#406eeb) 18%,transparent);border-radius:50%}
.sla-orbit i{position:absolute;inset:0;display:block;border-radius:50%;animation:sla-orbit calc(2.6s / var(--sla-rate,1)) linear infinite}
.sla-orbit i::before{content:'';position:absolute;top:0;left:50%;width:calc(var(--sla-s,64px)*0.16);height:calc(var(--sla-s,64px)*0.16);margin-left:calc(var(--sla-s,64px)*-0.08);margin-top:calc(var(--sla-s,64px)*-0.08);border-radius:50%;background:currentColor}
.sla-orbit i:nth-child(2){inset:18%;border:1px solid color-mix(in srgb,var(--sla-c,#406eeb) 12%,transparent);animation-direction:reverse;animation-duration:calc(1.8s / var(--sla-rate,1))}
.sla-orbit i:nth-child(2)::before{width:calc(var(--sla-s,64px)*0.11);height:calc(var(--sla-s,64px)*0.11);margin-left:calc(var(--sla-s,64px)*-0.055);margin-top:calc(var(--sla-s,64px)*-0.055);background:color-mix(in srgb,var(--sla-c,#406eeb) 55%,white)}
@keyframes sla-orbit{from{transform:rotate(0)}to{transform:rotate(360deg)}}

/* ── 音量柱 ──
   四根竖柱各自伸缩，错峰 0.14~0.42s；错峰刻意不等距，
   等距会变成整齐的"波浪"，反而不像音量。 */
.sla-bars{width:calc(var(--sla-s,64px)*1.2);height:var(--sla-s,64px);display:flex;align-items:flex-end;justify-content:space-between;padding:0 calc(var(--sla-s,64px)*0.06);box-sizing:border-box}
.sla-bars i{display:block;width:14%;height:100%;border-radius:999px;background:currentColor;transform-origin:50% 100%;transform:scaleY(.25);animation:sla-bars calc(1.1s / var(--sla-rate,1)) ease-in-out infinite alternate}
.sla-bars i:nth-child(2){animation-delay:calc(.28s / var(--sla-rate,1))}
.sla-bars i:nth-child(3){animation-delay:calc(.14s / var(--sla-rate,1))}
.sla-bars i:nth-child(4){animation-delay:calc(.42s / var(--sla-rate,1))}
@keyframes sla-bars{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
/* ── hairline 矢量层 ──
   四款（点阵 / 传送带 / 柱阵 / 卡片翻动）在应用内由 at lucasmarkes/hairline 真画：
   上面那几段 CSS 只作为首屏 / 库未就位时的近似图。.has-hl 时隐藏近似层，只留图形本身；
   颜色与尺寸仍走 --sla-c / --sla-s，与其它动画同一口径。 */
.sla.has-hl{display:flex;align-items:center;justify-content:center;color:var(--sla-c,#406eeb)}
.sla.has-hl > *:not(.sla-hl){display:none!important}
.sla .sla-hl{position:relative;display:flex;align-items:center;justify-content:center;width:var(--sla-s,64px);height:var(--sla-s,64px);line-height:0}

/* ── 点阵 ──
   格子由 repeating-conic-gradient 画出（每格中心一个小方块），一条宽的渐变扫描带
   自上而下掠过；扫描带用 mask 复用同一张格子图，于是只有点上会亮。 */
.sla-matrix{width:var(--sla-s,64px);height:var(--sla-s,64px);overflow:hidden}
.sla-matrix::before{content:'';position:absolute;inset:0;background-image:repeating-conic-gradient(currentColor 0 25%,transparent 0 100%);background-size:calc(100% / 7) calc(100% / 7);opacity:.28}
.sla-matrix i{position:absolute;inset:-20% 0;display:block;background:linear-gradient(to bottom,transparent 0,currentColor 38%,currentColor 62%,transparent 100%);-webkit-mask-image:repeating-conic-gradient(#000 0 25%,transparent 0 100%);mask-image:repeating-conic-gradient(#000 0 25%,transparent 0 100%);-webkit-mask-size:calc(100% / 7) calc(100% / 7);mask-size:calc(100% / 7) calc(100% / 7);animation:sla-matrix calc(1.8s / var(--sla-rate,1)) linear infinite}
at keyframes sla-matrix{from{transform:translateY(-60%)}to{transform:translateY(60%)}}
/* ── 传送带 ──
   两条皮带用斜纹渐变平移，板条箱夹在中间轻微上抬 —— 一眼能看出东西在往前送。 */
.sla-conveyor{width:calc(var(--sla-s,64px)*1.4);height:var(--sla-s,64px);font-size:calc(var(--sla-s,64px)*0.06)}
.sla-conveyor__belt{position:absolute;left:0;right:0;height:.2em;background:repeating-linear-gradient(90deg,currentColor 0 .18em,color-mix(in srgb,var(--sla-c,#406eeb) 22%,transparent) .18em .4em);background-size:.88em 100%;animation:sla-conveyor calc(.9s / var(--sla-rate,1)) linear infinite}
.sla-conveyor__belt--top{top:20%}
.sla-conveyor__belt--bottom{bottom:20%}
.sla-conveyor__crate{position:absolute;top:50%;left:50%;width:calc(var(--sla-s,64px)*0.36);height:calc(var(--sla-s,64px)*0.36);margin:calc(var(--sla-s,64px)*-0.18);border:.16em solid currentColor;background:color-mix(in srgb,var(--sla-c,#406eeb) 16%,transparent);box-sizing:border-box;animation:sla-conveyor-crate calc(1.6s / var(--sla-rate,1)) ease-in-out infinite}
at keyframes sla-conveyor{from{background-position:0 0}to{background-position:.88em 0}}
at keyframes sla-conveyor-crate{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-.3em) rotate(-6deg)}}
/* ── 柱阵 ──
   三排五列的小柱，按列序错峰 0.08s，于是看到的是斜向推进的波而不是整排一起跳。 */
.sla-pillars{width:calc(var(--sla-s,64px)*1.2);height:var(--sla-s,64px);display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(3,1fr);align-items:end;gap:calc(var(--sla-s,64px)*0.07)}
.sla-pillars i{display:block;height:100%;border-radius:calc(var(--sla-s,64px)*0.05);background:currentColor;transform-origin:50% 100%;transform:scaleY(.3);animation:sla-pillars calc(1.4s / var(--sla-rate,1)) ease-in-out infinite}
.sla-pillars i:nth-child(5n+2){animation-delay:calc(.08s / var(--sla-rate,1))}
.sla-pillars i:nth-child(5n+3){animation-delay:calc(.16s / var(--sla-rate,1))}
.sla-pillars i:nth-child(5n+4){animation-delay:calc(.24s / var(--sla-rate,1))}
.sla-pillars i:nth-child(5n+5){animation-delay:calc(.32s / var(--sla-rate,1))}
at keyframes sla-pillars{0%,100%{transform:scaleY(.3);opacity:.45}50%{transform:scaleY(1);opacity:1}}
/* ── 卡片翻动 ──
   三张卡并排绕 Y 轴依次翻面；翻到侧面时透明度降下来，像纸片薄下去。 */
.sla-cards{width:calc(var(--sla-s,64px)*1.5);height:var(--sla-s,64px);display:flex;align-items:center;justify-content:space-between;perspective:calc(var(--sla-s,64px)*3)}
.sla-cards i{display:block;width:calc(var(--sla-s,64px)*0.38);height:calc(var(--sla-s,64px)*0.62);border-radius:calc(var(--sla-s,64px)*0.05);border:calc(var(--sla-s,64px)*0.045) solid currentColor;background:color-mix(in srgb,var(--sla-c,#406eeb) 12%,transparent);box-sizing:border-box;animation:sla-cards calc(1.5s / var(--sla-rate,1)) ease-in-out infinite}
.sla-cards i:nth-child(2){animation-delay:calc(.15s / var(--sla-rate,1))}
.sla-cards i:nth-child(3){animation-delay:calc(.3s / var(--sla-rate,1))}
at keyframes sla-cards{0%,100%{transform:rotateY(0);opacity:1}45%{transform:rotateY(180deg)}55%{opacity:.55}100%{opacity:1}}

/* ── 无动画 ── */
.sla-none{width:1px;height:1px;opacity:0}

/* 减少动态效果：整体放慢但不停 —— 加载指示器停住会让人以为卡死 */
@media (prefers-reduced-motion:reduce){
.sla-dots i{animation-duration:calc(2.4s / var(--sla-rate,1))}
.sla-rings i:nth-child(1){animation-duration:calc(2.8s / var(--sla-rate,1))}
.sla-rings i:nth-child(2){animation-duration:calc(2s / var(--sla-rate,1))}
.sla-dino__runner{animation-duration:calc(1.9s / var(--sla-rate,1))}
.sla-dino__cactus{animation-duration:calc(2.6s / var(--sla-rate,1))}
.sla-dino__ground{animation-duration:calc(2.6s / var(--sla-rate,1))}
.sla-ripple i{animation-duration:calc(3.8s / var(--sla-rate,1))}
.sla-orbit i{animation-duration:calc(4.2s / var(--sla-rate,1))}
.sla-bars i{animation-duration:calc(1.8s / var(--sla-rate,1))}
.sla-matrix i{animation-duration:calc(3.2s / var(--sla-rate,1))}
.sla-conveyor__belt{animation-duration:calc(1.8s / var(--sla-rate,1))}
.sla-conveyor__crate{animation-duration:calc(2.4s / var(--sla-rate,1))}
.sla-pillars i{animation-duration:calc(2.4s / var(--sla-rate,1))}
.sla-cards i{animation-duration:calc(2.6s / var(--sla-rate,1))}
}
`.trim();
