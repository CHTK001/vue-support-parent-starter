/**
 * ReLoader 动画尺寸计算（唯一定义处）。
 *
 * <p>为什么集中：几个动画各自维护一套尺寸逻辑必然漂移（科技圆圈是圆、
 * 圆点是横排三条、恐龙是 220×88 的横向场景，
 * "大中小"对它们本来就不是同一个含义）。这里按「变体 × 尺寸」一次算好，
 * 以 CSS 变量下发，动画内部只消费变量。</p>
 *
 * <p>尺寸支持三种写法：</p>
 * <ul>
 *   <li>档位 {@code sm / md / lg}：固定像素，跨页面观感一致；</li>
 *   <li>{@code number}：精确像素（如 {@code 120}），适合对齐设计稿；</li>
 *   <li>{@code auto}：跟随容器 —— 用 {@code min(百分比, 上限)} + {@code clamp}，
 *       小容器里缩、大容器里不无限放大（遮罩是全屏时尤其需要这个上限）。</li>
 * </ul>
 */
import type { ReLoaderSizeValue, ReLoaderVariant } from "./types";

/**
 * 各变体在 sm/md/lg 下的固定尺寸（px）。
 *
 * <p>这里的数字是 {@code --sla-s}（动画基准边长），不是最终外框：
 * 圆点最终宽 = 1.1 倍、恐龙最终宽 = 2.5 倍（高 1 倍）都由样式决定。
 * 取值的原则是「同档位下视觉重量接近」，不是「数字相同」。</p>
 */
const PRESET: Record<ReLoaderVariant, { sm: number; md: number; lg: number }> = {
  // 三个圆点：横排三点，直径只取基准的 0.16 倍（见 animations.ts）
  // md=48 → 单点约 7.7px，与常见 loading dots 一致。
  dots: { sm: 28, md: 48, lg: 64 },
  // 科技圆圈：正圆，同档位下与圆点相当
  rings: { sm: 24, md: 48, lg: 72 },
  // 像素恐龙：横向场景，基准是高度（宽 2.5 倍），sm 已经需要 100px 才认得出来
  dino: { sm: 100, md: 150, lg: 200 },
  // 水波涟漪：正方形，涟漪要铺满容器才看得出"扩散"
  ripple: { sm: 28, md: 52, lg: 76 },
  // 双轨环绕：正方形，内圈 18%，同档位与圆圈相当
  orbit: { sm: 26, md: 50, lg: 74 },
  // 音量柱：横向四根，基准是高度，宽度由样式取 1.2 倍
  bars: { sm: 26, md: 46, lg: 66 },
  // 点阵：正方形，格子要大到能数出 7×7，sm 也要 40px 起
  matrix: { sm: 40, md: 64, lg: 88 },
  // 传送带：横向，基准是高度，宽度由样式取 1.4 倍
  conveyor: { sm: 26, md: 48, lg: 68 },
  // 柱阵：横向三排五列，基准是高度，宽度由样式取 1.2 倍
  pillars: { sm: 26, md: 48, lg: 68 },
  // 卡片翻动：横排三张卡，基准是高度，宽度由样式取 1.5 倍
  cards: { sm: 26, md: 48, lg: 68 },
  // 无动画：占位 1px，不参与布局
  none: { sm: 1, md: 1, lg: 1 },
  // 旧键，等价 rings
  spin: { sm: 24, md: 48, lg: 72 },
  // 进度条"尺寸"指轨道厚度
  progress: { sm: 4, md: 6, lg: 8 },
};

/**
 * auto 模式下的自适应表达式。
 *
 * <p>按使用场景分两种基准，这是「自适应」能真正work的关键：</p>
 * <ul>
 *   <li><b>全屏遮罩</b>：以视口短边为基准（{@code vmin}）。若仍用容器百分比，
 *       全屏下会退化成"跟着那个小卡片"的固定值，完全不自适应；</li>
 *   <li><b>局部容器</b>：以容器宽度为基准（百分比），小卡片里自动缩小。</li>
 * </ul>
 * <p>两个分支都用 {@code clamp} 兜住上下限：小容器不塌、大屏不失控。</p>
 */
const AUTO_FULLSCREEN: Record<ReLoaderVariant, string> = {
  // 上限按 lg 档给，全屏遮罩里不会越放越大
  dots: "clamp(28px, 8vmin, 64px)",
  rings: "clamp(24px, 9vmin, 72px)",
  // 恐龙是横向场景，宽度上限按 lg 给；矮屏（手机横屏）靠 vmin 自动收
  dino: "clamp(90px, 26vmin, 200px)",
  ripple: "clamp(28px, 10vmin, 76px)",
  orbit: "clamp(26px, 9vmin, 74px)",
  bars: "clamp(26px, 8vmin, 66px)",
  matrix: "clamp(40px, 10vmin, 88px)",
  conveyor: "clamp(26px, 8vmin, 68px)",
  pillars: "clamp(26px, 8vmin, 68px)",
  cards: "clamp(26px, 8vmin, 68px)",
  none: "1px",
  spin: "clamp(24px, 9vmin, 72px)",
  progress: "8px",
};

const AUTO_LOCAL: Record<ReLoaderVariant, string> = {
  // 百分比要在常见容器里真的产生差异（否则大容器也顶到上限、小容器也顶到上限，
  // "自适应"就退化成又一个固定值 —— 实测踩过：58% 在 180px 与 700px 容器里都是 96px）
  dots: "clamp(24px, min(26%, 64px), 64px)",
  rings: "clamp(18px, min(28%, 72px), 72px)",
  dino: "clamp(80px, min(64%, 200px), 200px)",
  ripple: "clamp(22px, min(30%, 76px), 76px)",
  orbit: "clamp(20px, min(30%, 74px), 74px)",
  bars: "clamp(20px, min(28%, 66px), 66px)",
  matrix: "clamp(36px, min(34%, 88px), 88px)",
  conveyor: "clamp(22px, min(30%, 68px), 68px)",
  pillars: "clamp(22px, min(30%, 68px), 68px)",
  cards: "clamp(22px, min(30%, 68px), 68px)",
  none: "1px",
  spin: "clamp(18px, min(28%, 72px), 72px)",
  progress: "6px",
};

/** 尺寸相关的 CSS 变量名 */
export interface ReLoaderSizeVars {
  /** 动画基准边长（对应样式里的 --sla-s / --rl-size） */
  "--rl-size": string;
  /** 进度条轨道厚度 */
  "--rl-bar-height": string;
  /** 是否自适应（供样式做额外处理） */
  "--rl-auto"?: string;
  /** 语义别名：四个等待动画读这个 */
  "--sla-s"?: string;
}

/**
 * 计算尺寸 CSS 变量。
 *
 * @param size       尺寸取值（档位 / 像素 / auto）
 * @param variant    动画变体
 * @param fullscreen 是否全屏遮罩（决定 auto 的基准是视口还是容器）
 * @returns 可直接绑定到 style 的 CSS 变量集合
 */
export function animSizeVars(
  size: ReLoaderSizeValue | undefined,
  variant: ReLoaderVariant,
  fullscreen = true,
): ReLoaderSizeVars {
  const preset = PRESET[variant] ?? PRESET.dots;
  const varName = variant === "progress" ? "--rl-bar-height" : "--rl-size";

  let value: string;
  let auto = false;

  if (typeof size === "number" && Number.isFinite(size) && size > 0) {
    value = `${Math.round(size)}px`;
  } else if (size === "auto") {
    const table = fullscreen ? AUTO_FULLSCREEN : AUTO_LOCAL;
    value = table[variant] ?? table.dots;
    auto = true;
  } else if (size === "sm" || size === "md" || size === "lg") {
    value = `${preset[size]}px`;
  } else {
    value = `${preset.md}px`;
  }

  const vars: ReLoaderSizeVars = {
    // 两个变量都给：等待动画读 --sla-s / --rl-size，进度条读 --rl-bar-height，
    // 同一个 wrapper 同时容纳两种变体时不会因为变量缺失而丢样式
    "--rl-size": varName === "--rl-size" ? value : `${preset.md}px`,
    "--rl-bar-height": varName === "--rl-bar-height" ? value : "6px",
  };
  // 四个等待动画统一读 --sla-s；progress 用不到，照样给（无副作用）
  vars["--sla-s"] = vars["--rl-size"];
  if (auto) vars["--rl-auto"] = "1";
  return vars;
}
