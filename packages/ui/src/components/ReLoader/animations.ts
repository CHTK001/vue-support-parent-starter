import { computed, ref, type ComputedRef, type Ref } from "vue";
import { resolveLoaderDeployPolicy, type LoaderDeployPolicy } from "@repo/config";

/**
 * 统一加载动画（唯一定义处）
 *
 * <p>四个动画只在这里写一次，三处共用：</p>
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

/** 四个动画的键（同时也是 localStorage 里 {@code sys-loader-style} 的值） */
export const LOADER_ANIMATIONS = ["dots", "wave", "rings", "dino"] as const;

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
  wave: {
    name: "海浪",
    description: "水位缓慢上涨的潮汐，深蓝向浅蓝过渡，最接近真实海面",
  },
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
    description: "像素恐龙跨栏，适合想让人轻松的等待",
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
 * 这些值不能再让用户看到「选中的动画不见了」，统一折到最接近的四个之一。</p>
 */
const LEGACY_ANIMATION_ALIASES: Record<string, LoaderAnimationChoice> = {
  // 现行键必须先映射到自己：漏一个就会"选了却回退默认"，而且完全无声。
  // 由 test/vue/loader-anim 的 canonical 自映射检查兜住。
  wave: "wave",
  dots: "dots",
  rings: "rings",
  dino: "dino",
  none: "none",

  default: "dots",
  pulse: "dots",
  blocks: "dots",
  book: "dots",
  writing: "dots",
  pokemon: "dots",
  dinoGame: "dino",
  pixel: "dino",
  // ReLoader 的旧键：spin 曾等价于"科技双环"
  spin: "rings",
  simple: "rings",
  spinner: "rings",
  space: "rings",
  cyberpunk: "rings",
  clock: "wave",
  minimal: "wave",
  cube: "wave",
  servererror: "wave",
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
  fallback: LoaderAnimationChoice = "wave",
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
 * 落到 {@code wave}，不会因为读不到而报错。</p>
 *
 * <p>部署侧接管（{@code app.yaml other.loaderConfig.enable: true}）时这里是
 * <b>只读</b>的：值由配置决定，用户在主题配置里改不动（选择器会置灰）。</p>
 */
const userAnimation: Ref<LoaderAnimationChoice> = ref(
  typeof window === "undefined" ? "wave" : readLoaderAnimation(),
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
    return normalizeLoaderAnimation(policy.animation) ?? "wave";
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

/* ------------------------------------------------------------------ *
 * 水面路径：viewBox 200×26，两个完整周期 —— 平移 50% 正好无缝循环
 * ------------------------------------------------------------------ */
const WAVE_CREST =
  "M0 13 C 20 7 30 7 50 13 C 70 19 80 19 100 13 C 120 7 130 7 150 13 C 170 19 180 19 200 13";
const WAVE_CREST_BACK =
  "M0 13 C 20 8 30 8 50 13 C 70 18 80 18 100 13 C 120 8 130 8 150 13 C 170 18 180 18 200 13";

/**
 * 一层水面：把波峰曲线向下闭合到条带底部，形成**实心水面**。
 *
 * <p>关键：路径必须闭合到 y=26（条带底），不能只画一条曲线。
 * 不闭合的开放路径被填充时，浏览器会用「终点→起点」的直线补齐，
 * 于是只剩曲线与基准线之间一条细月牙；真正显示成"水面"的会是
 * 下面那个填充矩形的平直顶边 —— 波谷被直边切掉，肉眼看到的是
 * "上面一道波纹 + 下面一道水平的第二种水面"（实测踩过）。</p>
 *
 * <p>闭合后条带本身就从波峰一路填到底，与下方水体在 sea 顶无缝衔接：
 * 前层条带色 = 水体渐变第 0 档色，重叠处看不出接缝。</p>
 *
 * <p><b>不要加白色浪脊描边</b>：选定的「潮汐」方案本就没有描边；
 * 加一条 stroke 会在水位高时横贯整个容器，看起来就是第二道水面。</p>
 */
function waveLayer(kind: "front" | "back"): string {
  const crest = kind === "back" ? WAVE_CREST_BACK : WAVE_CREST;
  // 曲线 → 右下角 → 左下角 → 闭合：整个条带成为实心水面
  const fill = `${crest} L200 26 L0 26 Z`;
  return (
    `<div class="sla-wave__layer sla-wave__layer--${kind}">` +
    `<div class="sla-wave__cap"><svg viewBox="0 0 200 26" preserveAspectRatio="none">` +
    `<path d="${fill}" fill="currentColor"/></svg></div>` +
    `<div class="sla-wave__fill"></div>` +
    `</div>`
  );
}

/**
 * 生成某个动画的 HTML。
 *
 * @param animation 动画键
 * @param percent   0-100 的真实进度；传入则水位由进度驱动（不再自走）
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

    case "none":
      return '<div class="sla sla-none" aria-hidden="true"></div>';

    case "wave":
    default: {
      // 有真实进度时停掉自走动画，水位由 --sla-level 驱动（同一动画既能等、也能报进度）
      const determinate = percent !== null && percent !== undefined;
      const level = determinate ? Math.max(0, Math.min(100, percent as number)) : 0;
      const style = determinate ? ` style="--sla-level:${level.toFixed(2)}"` : "";
      return (
        `<div class="sla sla-wave${determinate ? " is-determinate" : ""}"${style}>` +
        '<div class="sla-wave__sea">' +
        waveLayer("back") +
        waveLayer("front") +
        "</div></div>"
      );
    }
  }
}

/**
 * 四个动画的完整样式（首屏与应用内唯一的一份）。
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
.sla-dots i{display:block;width:calc(var(--sla-s,64px)*0.16);height:calc(var(--sla-s,64px)*0.16);border-radius:50%;background:currentColor;transform:scale(0);opacity:0;animation:sla-dot 1.5s cubic-bezier(.4,0,.6,1) infinite both}
.sla-dots i:nth-child(2){animation-delay:.16s}
.sla-dots i:nth-child(3){animation-delay:.32s}
@keyframes sla-dot{0%,6%{transform:scale(0);opacity:0}42%{transform:scale(1);opacity:1}70%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}}

/* ── 科技圆圈 ── */
.sla-rings{width:var(--sla-s,64px);height:var(--sla-s,64px);font-size:calc(var(--sla-s,64px)/4.4)}
.sla-rings::before{content:'';position:absolute;inset:-.45em;border:.1em solid color-mix(in srgb,var(--sla-c,#406eeb) 12%,transparent);border-radius:50%}
.sla-rings i{position:absolute;display:block;border-radius:50%;border:.2em solid transparent}
.sla-rings i:nth-child(1){inset:0;border-top-color:currentColor;border-right-color:color-mix(in srgb,var(--sla-c,#406eeb) 40%,transparent);animation:sla-spin 1.6s linear infinite}
.sla-rings i:nth-child(2){inset:.85em;border-bottom-color:currentColor;border-left-color:color-mix(in srgb,var(--sla-c,#406eeb) 40%,transparent);animation:sla-spin 1.15s linear infinite reverse}
.sla-rings i:nth-child(3){inset:0;width:.62em;height:.62em;margin:auto;background:currentColor;border:0;animation:sla-core 1.7s ease-in-out infinite}
@keyframes sla-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes sla-core{0%,100%{transform:scale(.72);opacity:.6}50%{transform:scale(1.12);opacity:1}}

/* ── 海浪（潮汐）：水位持续上涨，容器是有边界的圆角水槽 ──
   节奏按「首屏通常只挂 2~3 秒」定：涨水单程 4.2s、前层漂移 5.5s、高光 6s，
   后层视差 8s（刻意留慢一档，两层同速就没有纵深）。
   旧值 8s / 13s / 19s / 15s 下，用户在这两三秒里几乎看不出水位在动，像一张静止图。 */
.sla-wave{width:var(--sla-s,64px);height:var(--sla-s,64px);font-size:calc(var(--sla-s,64px)/6.4);border-radius:1.7em;overflow:hidden;background:color-mix(in srgb,var(--sla-c,#406eeb) 7%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sla-c,#406eeb) 15%,transparent)}
.sla-wave__sea{position:absolute;left:0;right:0;bottom:0;height:30%;animation:sla-rise 4.2s cubic-bezier(.45,0,.55,1) infinite alternate}
.sla-wave.is-determinate .sla-wave__sea{animation:none;height:calc(12% + var(--sla-level,0)*0.54%)}
.sla-wave__layer{position:absolute;left:0;right:0;top:0;bottom:0}
/* 水体从 layer 顶（= 波纹条带底）向下填，并向上重叠 1px。
   为什么重叠：波纹是 SVG（条带内在布局里可能是 .25px 的小数位置），水体是 div 背景，
   两者在非整数像素处贴合时抗锯齿会露出 1px 的缝 —— 水面很高的时刻尤其明显，
   表现为一条横贯全宽的细线。重叠 1px 后重合处颜色本就相同，看不出痕迹。 */
.sla-wave__fill{position:absolute;left:0;right:0;top:-1px;bottom:-45%}
.sla-wave__cap{position:absolute;left:0;bottom:100%;width:200%;height:1.35em;animation:sla-drift 5.5s linear infinite;will-change:transform}
.sla-wave__cap svg{display:block;width:100%;height:100%}
.sla-wave__layer--back{transform:translateY(-.48em)}
.sla-wave__layer--back .sla-wave__cap{animation-duration:8s;animation-direction:reverse}
.sla-wave__layer--back .sla-wave__fill{background:color-mix(in srgb,var(--sla-c,#406eeb) 34%,white)}
.sla-wave__layer--back .sla-wave__cap{color:color-mix(in srgb,var(--sla-c,#406eeb) 34%,white)}
.sla-wave__layer--front .sla-wave__fill{background:linear-gradient(180deg,color-mix(in srgb,var(--sla-c,#406eeb) 62%,white) 0%,var(--sla-c,#406eeb) 44%,color-mix(in srgb,var(--sla-c,#406eeb) 72%,#0b1a4d) 100%)}
.sla-wave__layer--front .sla-wave__cap{color:color-mix(in srgb,var(--sla-c,#406eeb) 62%,white)}
.sla-wave__layer--front .sla-wave__fill::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.26;mix-blend-mode:screen;filter:blur(.12em);background:linear-gradient(99deg,transparent 38%,rgba(255,255,255,.55) 47%,transparent 56%),linear-gradient(99deg,transparent 64%,rgba(255,255,255,.38) 72%,transparent 80%);animation:sla-caustic 6s ease-in-out infinite alternate}
@keyframes sla-rise{0%{height:27%}100%{height:67%}}
@keyframes sla-drift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
@keyframes sla-caustic{from{transform:translateX(-14%)}to{transform:translateX(14%)}}

/* ── 像素恐龙 ──
   坐标全部用 em：--sla-s 表示**高度**（与海浪、圆圈同口径），
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

/* ── 无动画 ── */
.sla-none{width:1px;height:1px;opacity:0}

/* 减少动态效果：整体放慢但不停 —— 加载指示器停住会让人以为卡死 */
@media (prefers-reduced-motion:reduce){
.sla-dots i{animation-duration:2.4s}
.sla-rings i:nth-child(1){animation-duration:2.8s}
.sla-rings i:nth-child(2){animation-duration:2s}
.sla-wave__sea{animation-duration:8.4s}
.sla-wave__cap{animation-duration:11s}
.sla-wave__layer--back .sla-wave__cap{animation-duration:16s}
.sla-wave__layer--front .sla-wave__fill::after{animation-duration:12s}
.sla-dino__runner{animation-duration:1.9s}
.sla-dino__cactus{animation-duration:2.6s}
.sla-dino__ground{animation-duration:2.6s}
}
`.trim();
