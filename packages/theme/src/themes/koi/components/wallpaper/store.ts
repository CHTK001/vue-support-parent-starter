/**
 * 壁纸状态（单例）
 *
 * <p><b>服务端为准，本地只做快路径。</b>选择结果存服务端（{@code sys_user_wallpaper}，
 * 一人一条），换设备登录看到同一张；localStorage 只是首屏不闪的缓存：</p>
 * <ul>
 *   <li>模块加载即读本地并写 CSS 变量，早于 app.mount，刷新不会先画默认底色；</li>
 *   <li>挂载后拉 {@code /v2/wallpaper/mine}，有记录就以服务端覆盖本地；</li>
 *   <li>服务端没有记录（老用户首次升级）而本地有选择，则把本地补推一次；</li>
 *   <li>之后每次改动防抖 600ms 推服务端；推送失败不阻断显示，本地继续可用。</li>
 * </ul>
 *
 * <p>图片预加载成功后才挂 html.koi-wallpaper-on / -ready —— 先挂类会让面板先变透明、
 * 再跳出图片，比慢 200ms 更难看。</p>
 */
import { reactive, ref } from "vue";
import { getConfig } from "@repo/config";
import { getAccessToken } from "@repo/utils";
import { BUILTIN_WALLPAPERS } from "./builtinWallpapers";
import type { WallpaperPreset, WallpaperSetting, WallpaperTile } from "./types";

/** 配置与上传清单的存储键（版本化，改结构时换 v2 即可自动回落默认） */
const SETTING_KEY = "koi:wallpaper:v1";
const UPLOAD_KEY = "koi:wallpaper:uploads:v1";
/** 上传记录上限：再多也没有意义，面板一屏放不下 */
const MAX_UPLOADS = 12;
/** 淡出到撤掉语义底色的等待时长，与 .koi-wallpaper 的 opacity 过渡一致 */
const FADE_MS = 240;
/** 参数改动推送服务端的防抖时长 */
const PUSH_DELAY_MS = 600;

/** 接口地址 */
const API_LIST = "/v2/wallpaper/list";
const API_MINE = "/v2/wallpaper/mine";
const API_UPLOADS = "/v2/wallpaper/uploads";

/** 用户上传过的壁纸（只存地址与名字，删除时不动服务端文件） */
export interface UploadedWallpaper {
  id: string;
  /** 服务端记录主键；本地新建、尚未推上去时为空 */
  serverId?: number;
  url: string;
  name: string;
  createdAt: number;
}

/** 平铺方式 → background-size / background-repeat（面板预览与真实图层共用同一张表） */
export const WALLPAPER_TILE_MAP: Record<WallpaperTile, { size: string; repeat: string }> = {
  none: { size: "cover", repeat: "no-repeat" },
  cover: { size: "cover", repeat: "no-repeat" },
  contain: { size: "contain", repeat: "no-repeat" },
  repeat: { size: "auto", repeat: "repeat" },
  "repeat-x": { size: "auto", repeat: "repeat-x" },
  "repeat-y": { size: "auto", repeat: "repeat-y" },
};

/** 默认配置：不铺图，等价于「现在的效果」 */
export function createDefaultSetting(): WallpaperSetting {
  return {
    source: "default",
    tile: "none",
    opacity: 1,
    blur: 0,
    dim: 0,
  };
}

/** 能力开关：app.yaml other.wallpaper.enable（默认关闭） */
export function isWallpaperEnabled(): boolean {
  return getConfig()?.other?.wallpaper?.enable === true;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** 把任意输入归一到合法平铺方式 */
function normalizeTile(value: unknown): WallpaperTile {
  if (typeof value === "string" && Object.prototype.hasOwnProperty.call(WALLPAPER_TILE_MAP, value)) {
    return value as WallpaperTile;
  }
  return "none";
}

function readSetting(): WallpaperSetting {
  const fallback = createDefaultSetting();
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(SETTING_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<WallpaperSetting>;
    const merged: WallpaperSetting = { ...fallback, ...parsed };
    merged.opacity = clamp(Number(merged.opacity), 0, 1);
    merged.blur = clamp(Number(merged.blur), 0, 24);
    merged.dim = clamp(Number(merged.dim), 0, 0.8);
    merged.tile = normalizeTile(merged.tile);
    return merged;
  } catch {
    return fallback;
  }
}

function readUploads(): UploadedWallpaper[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(UPLOAD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.url === "string" && item.url)
      .slice(0, MAX_UPLOADS) as UploadedWallpaper[];
  } catch {
    return [];
  }
}

function persist(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(SETTING_KEY, JSON.stringify(wallpaperSetting));
  } catch {
    // 隐私模式 / 配额满：不阻断当前会话的显示
  }
}

/**
 * 防抖落盘
 *
 * <p>拖滑杆时 input 每帧都会来一次，localStorage 是同步写，逐帧写会卡手；
 * 只有参数调节走这里，选中壁纸这种一次性操作仍然立即写。</p>
 */
let persistTimer = 0;
function persistSoon(): void {
  if (typeof window === "undefined") return;
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(persist, 240);
}

function persistUploads(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(UPLOAD_KEY, JSON.stringify(uploadedWallpapers.value));
  } catch {
    // 同上
  }
}

/** 当前配置（响应式，面板直接绑） */
export const wallpaperSetting = reactive<WallpaperSetting>(readSetting());

/** 上传过的壁纸 */
export const uploadedWallpapers = ref<UploadedWallpaper[]>(readUploads());

/** 可选壁纸列表：默认用静态兜底清单，拉到服务端目录后替换 */
export const wallpaperPresets = ref<WallpaperPreset[]>([...BUILTIN_WALLPAPERS]);

/**
 * 当前是否有网络
 *
 * <p>在线图片壁纸（服务端目录里 url 是 http(s) 的项）离线时既不该出现在面板里，
 * 也不该继续显示在页面上——否则会留一张裂图或一块空白。</p>
 */
export const networkOnline = ref(
  typeof navigator === "undefined" ? true : navigator.onLine,
);

/** 当前壁纸是否依赖网络（远程图片） */
function isRemoteWallpaper(setting: WallpaperSetting = wallpaperSetting): boolean {
  if (setting.source === "upload") return true;
  return Boolean(setting.url && /^https?:/i.test(setting.url));
}

/** 监听网络状态：恢复联网重画，断网时只隐藏图层、不清配置 */
export function initNetworkWatch(): void {
  if (typeof window === "undefined") return;
  const update = () => {
    const was = networkOnline.value;
    networkOnline.value = window.navigator.onLine;
    if (!was && networkOnline.value) {
      // 恢复联网：允许重新退避重试，并立刻重画
      loadFailures = 0;
      commit();
      return;
    }
    if (was && !networkOnline.value && isRemoteWallpaper()) {
      // 断网：只撤显示，配置仍保留在本地与服务端，联网后恢复
      document.documentElement.classList.remove("koi-wallpaper-ready");
    }
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  networkOnline.value = window.navigator.onLine;
}

/** 当前是否真的会显示一层壁纸 */
export function isWallpaperActive(setting: WallpaperSetting = wallpaperSetting): boolean {
  if (!isWallpaperEnabled()) return false;
  if (setting.source === "default") return false;
  return Boolean(setting.css || setting.url);
}

/** 把配置写进 html 的行内 CSS 变量（只写变量，不换 DOM） */
function writeVars(setting: WallpaperSetting): void {
  if (typeof document === "undefined") return;
  const style = document.documentElement.style;
  const image = setting.css || (setting.url ? `url(${JSON.stringify(setting.url)})` : "none");
  const darkImage = setting.cssDark || image;
  const tile = WALLPAPER_TILE_MAP[setting.tile] ?? WALLPAPER_TILE_MAP.none;
  style.setProperty("--koi-wallpaper-image", image);
  style.setProperty("--koi-wallpaper-image-dark", darkImage);
  style.setProperty("--koi-wallpaper-size", tile.size);
  style.setProperty("--koi-wallpaper-repeat", tile.repeat);
  style.setProperty("--koi-wallpaper-opacity", String(setting.opacity));
  style.setProperty("--koi-wallpaper-blur", `${setting.blur}px`);
  style.setProperty("--koi-wallpaper-dim", String(setting.dim));
}

let applyToken = 0;
/** 远程图片连续加载失败次数（用于退避重试；到上限后只隐藏，不动配置） */
let loadFailures = 0;
let retryTimer = 0;

/**
 * 远程图片加载失败：隐藏图层并按 5s/15s/45s 退避重试。
 *
 * <p>不能像以前那样直接 resetWallpaper() —— 图床被墙、超时、CDN 抖动都会被判成
 * 「图片失效」，把用户的选择清掉并回写服务端为默认。只有用户主动「恢复默认」
 * 才该清配置；加载失败最多是暂时看不见。</p>
 */
function scheduleRetry(token: number): void {
  if (typeof window === "undefined") return;
  if (!networkOnline.value) return;
  if (loadFailures >= 3) return;
  const delay = [5000, 15000, 45000][Math.min(loadFailures, 2)];
  loadFailures += 1;
  window.clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => {
    if (token === applyToken) commit();
  }, delay);
}

/**
 * 挂上壁纸语义类
 *
 * <p>已经显示着的时候只换图不做淡入：否则每次换图都要先回到透明再出现，
 * 页面会闪一下。首次显示（或从默认切过来）才走一次 opacity 过渡。</p>
 */
function activate(token: number): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const wasReady = root.classList.contains("koi-wallpaper-ready");
  root.classList.add("koi-wallpaper-on");
  if (wasReady) return;
  // 等一帧再加 ready，让 opacity 从 0 开始过渡；同一帧加两个类不会触发过渡
  window.requestAnimationFrame(() => {
    if (token === applyToken) root.classList.add("koi-wallpaper-ready");
  });
}

/** 按当前配置重画（预加载 → 写变量 → 挂类） */
function commit(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (typeof window !== "undefined") window.clearTimeout(retryTimer);
  const token = ++applyToken;

  if (!isWallpaperActive()) {
    root.classList.remove("koi-wallpaper-ready");
    // 等淡出走完再撤语义底色：立刻撤会让页面先变实色、再淡出一张图
    window.setTimeout(() => {
      if (token !== applyToken) return;
      root.classList.remove("koi-wallpaper-on");
      writeVars(wallpaperSetting);
    }, FADE_MS);
    return;
  }

  if (wallpaperSetting.url) {
    const image = new window.Image();
    image.onload = () => {
      if (token !== applyToken) return;
      loadFailures = 0;
      writeVars(wallpaperSetting);
      activate(token);
    };
    image.onerror = () => {
      if (token !== applyToken) return;
      // 先撤显示、保留配置，再按退避重试；不自动清空用户的选择
      root.classList.remove("koi-wallpaper-ready");
      scheduleRetry(token);
    };
    image.src = wallpaperSetting.url;
    return;
  }

  writeVars(wallpaperSetting);
  activate(token);
}

/* ==================== 服务端同步 ==================== */

/** 同步期间抑制回推，避免「拉下来再写回去」的死循环 */
let suppressPush = false;
let pushTimer = 0;
let syncPromise: Promise<void> | null = null;

function hasToken(): boolean {
  try {
    return Boolean(getAccessToken());
  } catch {
    return false;
  }
}

/** 动态取接口实例：避免 theme ↔ core 的静态循环依赖（与头像框同一写法） */
async function api(): Promise<{
  get: (url: string) => any;
  put: (url: string) => any;
  post: (url: string) => any;
  delete: (url: string) => any;
}> {
  const { getApiHttp } = await import("@repo/core");
  return getApiHttp();
}

/** 推送当前设置（防抖由调用方控制） */
async function pushWallpaper(): Promise<void> {
  if (!isWallpaperEnabled() || !hasToken()) return;
  try {
    const http = await api();
    await http
      .put(API_MINE)
      .data({
        source: wallpaperSetting.source,
        presetId: wallpaperSetting.remotePresetId,
        presetCode: wallpaperSetting.presetId,
        url: wallpaperSetting.url,
        tile: wallpaperSetting.tile,
        opacity: wallpaperSetting.opacity,
        blur: wallpaperSetting.blur,
        dim: wallpaperSetting.dim,
      })
      .loading(false)
      .noToast(true);
  } catch {
    // 后端未部署 / 未登录：静默，保留本地选择
  }
}

/** 安排一次推送 */
function schedulePush(immediate = false): void {
  if (suppressPush || !isWallpaperEnabled() || typeof window === "undefined") return;
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushWallpaper();
  }, immediate ? 0 : PUSH_DELAY_MS);
}

/** 服务端行 → 目录项 */
function toPreset(row: Record<string, unknown>): WallpaperPreset | null {
  const code = typeof row.sysWallpaperCode === "string" ? row.sysWallpaperCode : "";
  const name = typeof row.sysWallpaperName === "string" ? row.sysWallpaperName : "";
  const css = typeof row.sysWallpaperCss === "string" && row.sysWallpaperCss ? row.sysWallpaperCss : undefined;
  const url = typeof row.sysWallpaperUrl === "string" && row.sysWallpaperUrl ? row.sysWallpaperUrl : undefined;
  if (!code || !name || (!css && !url)) return null;
  return {
    id: code,
    remoteId: typeof row.sysWallpaperId === "number" ? row.sysWallpaperId : undefined,
    name,
    group: typeof row.sysWallpaperGroup === "string" ? row.sysWallpaperGroup : undefined,
    css,
    cssDark:
      typeof row.sysWallpaperCssDark === "string" && row.sysWallpaperCssDark
        ? row.sysWallpaperCssDark
        : undefined,
    url,
    remote: Boolean(url && /^https?:/i.test(url)),
    tile: normalizeTile(row.sysWallpaperTile),
    opacity: clamp(Number(row.sysWallpaperOpacity ?? 1), 0, 1),
    blur: clamp(Number(row.sysWallpaperBlur ?? 0), 0, 24),
    dim: clamp(Number(row.sysWallpaperDim ?? 0), 0, 0.8),
  };
}

/** 服务端行 → 上传记录 */
function toUploaded(row: Record<string, unknown>): UploadedWallpaper | null {
  const url = typeof row.url === "string" ? row.url : "";
  if (!url) return null;
  const id = typeof row.sysUserWallpaperUploadId === "number" ? row.sysUserWallpaperUploadId : undefined;
  return {
    id: id === undefined ? url : String(id),
    serverId: id,
    url,
    name: typeof row.name === "string" && row.name ? row.name : "我的图片",
    createdAt: Date.now(),
  };
}

/** 用服务端设置覆盖本地并重画（不回推） */
function applyServerSetting(row: Record<string, unknown>): void {
  const source =
    row.source === "builtin" || row.source === "upload" ? row.source : "default";
  suppressPush = true;
  try {
    Object.assign(wallpaperSetting, {
      source,
      presetId: typeof row.presetCode === "string" ? row.presetCode : undefined,
      remotePresetId: typeof row.presetId === "number" ? row.presetId : undefined,
      url: typeof row.url === "string" && row.url ? row.url : undefined,
      css: typeof row.css === "string" && row.css ? row.css : undefined,
      cssDark: typeof row.cssDark === "string" && row.cssDark ? row.cssDark : undefined,
      tile: normalizeTile(row.tile),
      opacity: clamp(Number(row.opacity ?? 1), 0, 1),
      blur: clamp(Number(row.blur ?? 0), 0, 24),
      dim: clamp(Number(row.dim ?? 0), 0, 0.8),
    });
    persist();
    commit();
  } finally {
    suppressPush = false;
  }
}

/**
 * 拉取目录 + 当前设置 + 上传记录
 *
 * <p>任何一步失败都静默：后端未部署时继续用本地与静态清单，功能不降级成不可用。</p>
 */
export function syncWallpaperFromServer(force = false): Promise<void> {
  if (!isWallpaperEnabled() || typeof window === "undefined") return Promise.resolve();
  if (syncPromise && !force) return syncPromise;
  syncPromise = (async () => {
    try {
      const http = await api();

      const listBody = await http.get(API_LIST).loading(false).noToast(true).then((r: any) => r.data);
      const rows = Array.isArray(listBody?.data) ? listBody.data : [];
      const presets = rows
        .map((row: Record<string, unknown>) => toPreset(row))
        .filter((item: WallpaperPreset | null): item is WallpaperPreset => Boolean(item));
      if (presets.length) {
        wallpaperPresets.value = presets;
      }

      if (!hasToken()) return;

      const mineBody = await http.get(API_MINE).loading(false).noToast(true).then((r: any) => r.data);
      const mine = mineBody?.data;
      if (mine && typeof mine === "object" && typeof mine.source === "string") {
        applyServerSetting(mine as Record<string, unknown>);
      } else if (isWallpaperActive()) {
        // 老用户首次上云：本地已有选择，服务端还没有记录 → 补推一次
        schedulePush(true);
      }

      const uploadBody = await http
        .get(API_UPLOADS)
        .loading(false)
        .noToast(true)
        .then((r: any) => r.data);
      const uploadRows = Array.isArray(uploadBody?.data) ? uploadBody.data : [];
      const remote = uploadRows
        .map((row: Record<string, unknown>) => toUploaded(row))
        .filter((item: UploadedWallpaper | null): item is UploadedWallpaper => Boolean(item));
      if (remote.length) {
        // 远端有的以远端为准；本地还没推上去的补在后面并补推
        const merged = [...remote];
        for (const local of uploadedWallpapers.value) {
          if (local.serverId) continue;
          if (merged.some((one) => one.url === local.url)) continue;
          merged.push(local);
          void pushUploadRecord(local);
        }
        uploadedWallpapers.value = merged.slice(0, MAX_UPLOADS);
        persistUploads();
      } else if (uploadedWallpapers.value.length) {
        for (const local of uploadedWallpapers.value) {
          void pushUploadRecord(local);
        }
      }
    } catch {
      // 接口不可用：保持本地与静态清单
    }
  })().finally(() => {
    syncPromise = null;
  });
  return syncPromise;
}

/** 上传记录推到服务端，成功后回填主键 */
async function pushUploadRecord(item: UploadedWallpaper): Promise<void> {
  if (!isWallpaperEnabled() || !hasToken() || item.serverId) return;
  try {
    const http = await api();
    const body = await http
      .post(API_UPLOADS)
      .data({ url: item.url, name: item.name })
      .loading(false)
      .noToast(true)
      .then((r: any) => r.data);
    const id = body?.data?.sysUserWallpaperUploadId;
    if (typeof id === "number") {
      item.serverId = id;
      item.id = String(id);
      persistUploads();
    }
  } catch {
    // 静默：本地记录仍然可用，下次同步再补
  }
}

/** 删除服务端上传记录 */
async function removeUploadRecord(serverId: number): Promise<void> {
  try {
    const http = await api();
    await http.delete(`${API_UPLOADS}/${serverId}`).loading(false).noToast(true);
  } catch {
    // 静默：本地已经删了，下次同步会以服务端为准
  }
}

/* ==================== 对外的操作 ==================== */

/** 整体替换配置（选中一套壁纸时用） */
export function applyWallpaper(next: WallpaperSetting): void {
  Object.assign(wallpaperSetting, next);
  persist();
  commit();
  schedulePush();
}

/** 只调参数（平铺 / 透明度 / 模糊 / 暗化），不换图 */
export function setWallpaperTuning(
  patch: Partial<Pick<WallpaperSetting, "tile" | "opacity" | "blur" | "dim">>,
): void {
  Object.assign(wallpaperSetting, patch);
  wallpaperSetting.opacity = clamp(Number(wallpaperSetting.opacity), 0, 1);
  wallpaperSetting.blur = clamp(Number(wallpaperSetting.blur), 0, 24);
  wallpaperSetting.dim = clamp(Number(wallpaperSetting.dim), 0, 0.8);
  persistSoon();
  if (isWallpaperActive()) writeVars(wallpaperSetting);
  schedulePush();
}

/** 回到默认（不铺图） */
export function resetWallpaper(): void {
  applyWallpaper(createDefaultSetting());
}

/** 选中一套内置壁纸 */
export function pickPreset(preset: WallpaperPreset): void {
  applyWallpaper({
    source: "builtin",
    presetId: preset.id,
    remotePresetId: preset.remoteId,
    url: preset.url,
    css: preset.css,
    cssDark: preset.cssDark,
    tile: preset.tile ?? "none",
    opacity: preset.opacity ?? 1,
    blur: preset.blur ?? 0,
    dim: preset.dim ?? 0,
  });
}

/** 选中一张自己上传的图 */
export function pickUploadedWallpaper(item: UploadedWallpaper): void {
  applyWallpaper({
    source: "upload",
    presetId: undefined,
    remotePresetId: undefined,
    url: item.url,
    css: undefined,
    cssDark: undefined,
    tile: "cover",
    opacity: 1,
    blur: 0,
    dim: 0.12,
  });
}

/** 记录一次上传（同一地址去重，最新的排最前），并推到服务端 */
export function addUploadedWallpaper(item: UploadedWallpaper): void {
  const rest = uploadedWallpapers.value.filter((one) => one.url !== item.url);
  uploadedWallpapers.value = [item, ...rest].slice(0, MAX_UPLOADS);
  persistUploads();
  void pushUploadRecord(item);
}

/** 删除一条上传记录；正戴着它时回到默认，避免引用一个已删除的地址 */
export function removeUploadedWallpaper(id: string): void {
  const target = uploadedWallpapers.value.find((one) => one.id === id);
  uploadedWallpapers.value = uploadedWallpapers.value.filter((one) => one.id !== id);
  persistUploads();
  if (target?.serverId) {
    void removeUploadRecord(target.serverId);
  }
  if (target && wallpaperSetting.url === target.url) {
    resetWallpaper();
  }
}

/** 启动时调用：模块加载即执行，早于 app.mount，尽量把首屏闪烁压掉 */
export function initWallpaper(): void {
  if (typeof document === "undefined") return;
  if (!isWallpaperEnabled()) {
    document.documentElement.classList.remove("koi-wallpaper-on", "koi-wallpaper-ready");
    return;
  }
  writeVars(wallpaperSetting);
  commit();
}

initWallpaper();
initNetworkWatch();
