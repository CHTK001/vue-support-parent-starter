/**
 * ReLoader 动画尺寸计算（唯一定义处）。
 *
 * <p>为什么集中：三种动画各自维护一套尺寸逻辑必然漂移（海浪是圆、双环是圆、
 * 进度条是横条，"大中小"对三者的含义本来就不同）。这里按「变体 × 尺寸」一次算好，
 * 以 CSS 变量下发，变体内部只消费变量。</p>
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

/** 各变体在 sm/md/lg 下的固定尺寸（px） */
const PRESET: Record<ReLoaderVariant, { sm: number; md: number; lg: number }> = {
  // 海浪是圆形"水池"，md 取 56 视觉重量适中
  wave: { sm: 28, md: 56, lg: 84 },
  // 双环偏细节，同档位下比海浪略小，避免压过文案
  spin: { sm: 22, md: 44, lg: 64 },
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
  // --rl-size 统一表示动画的**高度**（wave 的容器宽 = 高 × 1.8）。
  // 上限按高度给：84px 高 → 容器 151px 宽，与 lg 档完全一致
  wave: "clamp(26px, 12vmin, 84px)",
  spin: "clamp(22px, 9vmin, 78px)",
  progress: "8px",
};

const AUTO_LOCAL: Record<ReLoaderVariant, string> = {
  // 百分比要在常见容器里真的产生差异（否则大容器也顶到上限、小容器也顶到上限，
  // "自适应"就退化成又一个固定值 —— 实测踩过：58% 在 180px 与 700px 容器里都是 96px）
  // wave 的百分比按**高度**给（与 spin 同口径），容器宽 = 高 × 1.8
  wave: "clamp(18px, min(46%, 72px), 72px)",
  spin: "clamp(14px, min(36%, 72px), 72px)",
  progress: "6px",
};

/** 尺寸相关的 CSS 变量名 */
export interface ReLoaderSizeVars {
  /** 圆形动画的边长（wave / spin） */
  "--rl-size": string;
  /** 进度条轨道厚度 */
  "--rl-bar-height": string;
  /** 是否自适应（供样式做额外处理，如 aspect-ratio） */
  "--rl-auto"?: string;
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
  const preset = PRESET[variant] ?? PRESET.wave;
  const varName = variant === "progress" ? "--rl-bar-height" : "--rl-size";

  let value: string;
  let auto = false;

  if (typeof size === "number" && Number.isFinite(size) && size > 0) {
    value = `${Math.round(size)}px`;
  } else if (size === "auto") {
    const table = fullscreen ? AUTO_FULLSCREEN : AUTO_LOCAL;
    value = table[variant] ?? table.wave;
    auto = true;
  } else if (size === "sm" || size === "md" || size === "lg") {
    value = `${preset[size]}px`;
  } else {
    value = `${preset.md}px`;
  }

  const vars: ReLoaderSizeVars = {
    // 两个变量都给：圆形变体读 --rl-size，进度条读 --rl-bar-height，
    // 同一个 wrapper 同时容纳两种变体时不会因为变量缺失而丢样式
    "--rl-size": varName === "--rl-size" ? value : `${preset.md}px`,
    "--rl-bar-height": varName === "--rl-bar-height" ? value : "6px",
  };
  if (auto) vars["--rl-auto"] = "1";
  return vars;
}
