/**
 * 内置壁纸清单（P0 静态版）
 *
 * <p>为什么先用渐变 / 图案而不是图片：一套位图壁纸动辄数 MB，
 * 塞进 public 会进 git（仓库已接近体积配额）；而渐变与重复图案本身
 * 就是 CSS 背景值，零资源、零请求、任意分辨率不糊，先让功能跑通。
 * 需要真实照片时由后端 {@code /v2/wallpaper/list} 下发 {@code url}，
 * 这里的数据结构与之一致，接上后不需要改渲染层。</p>
 *
 * <p>每套都带暗色版本：亮色主题下的纸白、竹青铺在深色界面上会刺眼，
 * 不能只靠压暗遮罩硬压。</p>
 */
import type { WallpaperPreset } from "./types";

export const BUILTIN_WALLPAPERS: WallpaperPreset[] = [
  {
    id: "paper",
    name: "素纸",
    group: "素雅",
    // 极浅的横向纹理 + 米白底：像宣纸，不抢内容
    css:
      "repeating-linear-gradient(0deg, rgba(120,96,64,0.045) 0 1px, transparent 1px 28px), linear-gradient(180deg, #fbf8f2 0%, #f3ede1 100%)",
    cssDark:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 28px), linear-gradient(180deg, #1b1a18 0%, #121110 100%)",
    tile: "none",
    opacity: 1,
    blur: 0,
    dim: 0,
  },
  {
    id: "bamboo",
    name: "青竹",
    group: "雅致",
    // 斜向细纹模拟竹影，绿色控制在 10% 以内，避免腌菜色
    css:
      "repeating-linear-gradient(94deg, rgba(74,124,89,0.10) 0 2px, transparent 2px 46px), radial-gradient(120% 90% at 12% 0%, #eaf4ea 0%, #dcecdf 45%, #cfe4d5 100%)",
    cssDark:
      "repeating-linear-gradient(94deg, rgba(140,200,160,0.10) 0 2px, transparent 2px 46px), radial-gradient(120% 90% at 12% 0%, #10201a 0%, #0c1712 55%, #091210 100%)",
    tile: "none",
    opacity: 1,
    blur: 0,
    dim: 0,
  },
  {
    id: "distant-hills",
    name: "远山",
    group: "雅致",
    // 两道低饱和主色晕染，呼应 koi 的紫与绿
    css:
      "radial-gradient(120% 62% at 18% 100%, rgba(109,93,252,0.16) 0%, transparent 62%), radial-gradient(90% 50% at 82% 100%, rgba(47,191,113,0.14) 0%, transparent 60%), linear-gradient(180deg, #f6f7fb 0%, #eef1f8 60%, #e7ebf6 100%)",
    cssDark:
      "radial-gradient(120% 62% at 18% 100%, rgba(125,109,255,0.20) 0%, transparent 62%), radial-gradient(90% 50% at 82% 100%, rgba(47,191,113,0.16) 0%, transparent 60%), linear-gradient(180deg, #14151f 0%, #101119 60%, #0c0d14 100%)",
    tile: "none",
    opacity: 1,
    blur: 0,
    dim: 0,
  },
  {
    id: "ink",
    name: "墨痕",
    group: "雅致",
    // 两团错位淡墨，留白为主
    css:
      "radial-gradient(42% 34% at 24% 18%, rgba(31,36,48,0.10) 0%, transparent 70%), radial-gradient(38% 30% at 78% 76%, rgba(31,36,48,0.08) 0%, transparent 70%), linear-gradient(160deg, #f7f7f9 0%, #eceef3 100%)",
    cssDark:
      "radial-gradient(42% 34% at 24% 18%, rgba(255,255,255,0.06) 0%, transparent 70%), radial-gradient(38% 30% at 78% 76%, rgba(255,255,255,0.05) 0%, transparent 70%), linear-gradient(160deg, #1a1b22 0%, #111219 100%)",
    tile: "none",
    opacity: 1,
    blur: 0,
    dim: 0,
  },
  {
    id: "warm-dusk",
    name: "暖霞",
    group: "暖色",
    css:
      "radial-gradient(90% 70% at 80% 0%, rgba(245,165,36,0.20) 0%, transparent 60%), radial-gradient(80% 60% at 10% 10%, rgba(240,74,93,0.14) 0%, transparent 58%), linear-gradient(180deg, #fdf7f2 0%, #f7eef0 100%)",
    cssDark:
      "radial-gradient(90% 70% at 80% 0%, rgba(245,165,36,0.16) 0%, transparent 60%), radial-gradient(80% 60% at 10% 10%, rgba(240,74,93,0.12) 0%, transparent 58%), linear-gradient(180deg, #1f1913 0%, #161014 100%)",
    tile: "none",
    opacity: 1,
    blur: 0,
    dim: 0,
  },
  {
    id: "starry",
    name: "星野",
    group: "夜色",
    // 双色圆点错位排布，铺满时像稀疏星点；配 0.25 压暗保证文字对比度
    css:
      "radial-gradient(circle at 22% 28%, rgba(255,255,255,0.92) 0 1.2px, transparent 1.8px), radial-gradient(circle at 68% 62%, rgba(255,255,255,0.70) 0 1px, transparent 1.6px), radial-gradient(120% 90% at 50% 0%, #2b3a5e 0%, #182238 60%, #0b0f1a 100%)",
    cssDark:
      "radial-gradient(circle at 22% 28%, rgba(255,255,255,0.92) 0 1.2px, transparent 1.8px), radial-gradient(circle at 68% 62%, rgba(255,255,255,0.70) 0 1px, transparent 1.6px), radial-gradient(120% 90% at 50% 0%, #1a2440 0%, #0e1526 60%, #070a12 100%)",
    tile: "none",
    opacity: 0.95,
    blur: 0,
    dim: 0.25,
  },
];

/** 按 id 取内置壁纸（配置回放 / 面板选中态用） */
export function getBuiltinWallpaper(id?: string): WallpaperPreset | undefined {
  if (!id) return undefined;
  return BUILTIN_WALLPAPERS.find((item) => item.id === id);
}
