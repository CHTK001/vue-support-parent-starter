/**
 * 壁纸类型定义
 *
 * <p>字段名与后端 {@code GET /v2/wallpaper/list} 的下发结构保持一致：
 * P0 阶段内置清单是静态的（builtinWallpapers.ts），接后端时只换数据源，
 * 渲染层与设置面板不动。</p>
 */

/**
 * 平铺方式
 *
 * <ul>
 *   <li>{@code none} / {@code cover}：等比铺满视口，不重复；</li>
 *   <li>{@code contain}：等比装进视口，留边；</li>
 *   <li>{@code repeat} / {@code repeat-x} / {@code repeat-y}：按原图尺寸平铺。</li>
 * </ul>
 */
export type WallpaperTile = "none" | "cover" | "contain" | "repeat" | "repeat-x" | "repeat-y";

/** 壁纸来源；{@code default} 即「不铺图」，与没有这个功能时逐字一致 */
export type WallpaperSource = "default" | "builtin" | "upload";

/** 内置壁纸（静态清单 / 服务端下发的同构结构） */
export interface WallpaperPreset {
  id: string;
  name: string;
  /** 服务端目录主键；静态兜底清单没有这一项，保存时按 id(code) 解析 */
  remoteId?: number;
  /** 分组标题（面板里按组展示） */
  group?: string;
  /** CSS 背景值（渐变 / 图案）；与 url 二选一 */
  css?: string;
  /** 暗色专用 CSS 背景值；缺省沿用 css */
  cssDark?: string;
  /** 位图地址；与 css 二选一 */
  url?: string;
  /** 选中该壁纸时的推荐值 */
  tile?: WallpaperTile;
  opacity?: number;
  blur?: number;
  dim?: number;
}

/** 用户当前壁纸配置（整份持久化到 localStorage） */
export interface WallpaperSetting {
  source: WallpaperSource;
  /** source=builtin 时指向内置清单 id（即服务端目录的 code，跨设备稳定） */
  presetId?: string;
  /** 服务端目录主键；保存时优先用它，缺失时服务端按 presetId(code) 解析 */
  remotePresetId?: number;
  /** source=upload 时的位图地址 */
  url?: string;
  /** 内置渐变 / 图案的 CSS 背景值 */
  css?: string;
  /** 暗色专用 CSS 背景值 */
  cssDark?: string;
  tile: WallpaperTile;
  /** 图层不透明度 0~1 */
  opacity: number;
  /** 模糊半径 0~24（px） */
  blur: number;
  /** 压暗遮罩 0~0.8 */
  dim: number;
}
