/**
 * Ruffle（`@ruffle-rs/ruffle` selfhosted 运行时）最小类型声明
 *
 * <p>npm 包只发一个自托管版 IIFE（`ruffle.js`），<b>不带任何 d.ts</b>，它在脚本
 * 求值时把 `window.RufflePlayer` 注册为公共 API 对象（`PublicAPI`）。本文件只声明
 * 预览面板真正用到的一小部分 API（创建播放器、加载、播放/暂停、全屏、元数据），
 * 不追求覆盖上游全量接口 —— 覆盖不到的部分用类型断言兜住即可。</p>
 *
 * <p>接口口径来自 Ruffle v0.7.1 运行时源码（`ruffle.js` + sourcemap 中的 TS 源）：</p>
 * <ul>
 *   <li>`window.RufflePlayer.newest()` → {@link RuffleSourceApi}（取最新已注册版本）；</li>
 *   <li>`source.createPlayer()` → 生成 {@code <ruffle-player>} 自定义元素；</li>
 *   <li>`player.load({ url })` 或 `player.load({ data })`（`load(string)` 等价于 `{ url }`）；</li>
 *   <li>加载成功派发 `loadedmetadata` / `loadeddata` 事件，失败则在容器内渲染 `#panic` 兜底屏。</li>
 * </ul>
 *
 * @author CH
 * @since 2026/10/08
 */

/**
 * 影片元数据（wasm 侧 `MovieMetadata` 结构体，字段名取自 wasm 二进制导出符号）。
 *
 * <p>仅在播放器派发 `loadedmetadata` 之后可用，未加载时为 `null`。</p>
 */
export interface RuffleMovieMetadata {
  /** 舞台宽度（像素） */
  width: number;
  /** 舞台高度（像素） */
  height: number;
  /** 帧率（fps） */
  frameRate: number;
  /** 总帧数 */
  numFrames: number;
  /** SWF 格式版本（如 6 / 10） */
  swfVersion: number;
  /** SWF 背景色（ARGB 整数），未指定时为 null */
  backgroundColor: number | null;
  /** 是否为 ActionScript 3 影片 */
  isActionScript3: boolean;
  /** 解压后字节数 */
  uncompressedLength: number;
}

/**
 * `load()` 的选项。
 *
 * <p>其余键会被合入 Ruffle 的 `loadedConfig`（如 {@code allowFullscreen}、
 * {@code backgroundColor} 等），此处用索引签名放行。</p>
 */
export interface RuffleLoadOptions {
  /** 影片地址（blob: / http(s): 均可） */
  url?: string;
  /** 或直接喂原始字节（与 url 二选一） */
  data?: ArrayBuffer | Uint8Array;
  /** `data` 模式下的下载文件名提示 */
  swfFileName?: string;
  /** FlashVars */
  parameters?: Record<string, string>;
  /** 透传其它 Ruffle 配置项 */
  [key: string]: unknown;
}

/** `<ruffle-player>` 元素对外暴露的 API 子集 */
export interface RufflePlayerElement extends HTMLElement {
  /** 加载影片；元素必须已挂载到文档（未挂载会被静默忽略） */
  load(options: RuffleLoadOptions | string): Promise<void>;
  /** 以相同配置重新加载 */
  reload(): Promise<void>;
  /** 播放 / 继续 */
  play(): void;
  /** 暂停 */
  pause(): void;
  /** 销毁底层实例（幂等） */
  destroy(): void;
  /** 当前是否正在播放 */
  readonly isPlaying: boolean;
  /** 主音量（线性，1.0 = 100%） */
  volume: number;
  /** 浏览器是否允许全屏 */
  readonly fullscreenEnabled: boolean;
  /** 是否处于全屏 */
  readonly isFullscreen: boolean;
  /** 设置全屏状态（内部按需调用 enter/exit） */
  setFullscreen(isFull: boolean): void;
  /** 进入全屏 */
  enterFullscreen(): void;
  /** 退出全屏 */
  exitFullscreen(): void;
  /** 加载状态（0 = 未加载） */
  readonly readyState: number;
  /** 影片元数据（未加载时为 null） */
  readonly metadata: RuffleMovieMetadata | null;
}

/** Source API：某一版 Ruffle 的入口 */
export interface RuffleSourceApi {
  /** 创建一个新的 `<ruffle-player>` 元素 */
  createPlayer(): RufflePlayerElement;
}

/**
 * 公共 API（`window.RufflePlayer`）。
 *
 * <p>脚本尚未求值时它可能只是用户预设的纯配置对象（只有 `config`），
 * 故所有成员均为可选；使用前需判空。</p>
 */
export interface RufflePublicApi {
  /** 全局配置（脚本求值时会读取其中的 publicPath / polyfills 等） */
  config?: Record<string, unknown>;
  /** 取最新已注册的 Source API；未就绪时返回 null */
  newest?(): RuffleSourceApi | null;
}

declare global {
  interface Window {
    /** Ruffle 公共 API（由 `public/ruffle/ruffle.js` 注册） */
    RufflePlayer?: RufflePublicApi;
  }
}

export {};
