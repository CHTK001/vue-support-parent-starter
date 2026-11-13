/**
 * 饰品状态（单例）
 *
 * <p>与壁纸同一套「服务端为准 + 本地快路径」：</p>
 * <ul>
 *   <li>目录从 {@code /v2/ornament/list} 拉，失败时用 {@link BUILTIN_ORNAMENTS} 兜底；</li>
 *   <li>佩戴关系从 {@code /v2/ornament/mine} 拉，领取记录从 {@code /v2/ornament/grants} 拉；</li>
 *   <li>佩戴/取下走 {@code PUT /v2/ornament/mine}，领取走 {@code POST /v2/ornament/acquire}；</li>
 *   <li>localStorage 只做首屏不闪：佩戴快照 + 领取快照各一份。</li>
 * </ul>
 *
 * <p>开关口径：{@code other.ornament.enable} 未开时 {@link syncOrnaments} 直接返回，
 * 一个请求都不发；组件里也只读本地兜底，不触发任何网络。</p>
 *
 * <p>过期口径：目录项自带 {@code expire}，领取记录也可能带 {@code expireAt}；
 * 任一过期即视为「不可佩戴」，已戴的自动从渲染与下发结果里消失。</p>
 */
import { reactive, ref } from "vue";
import { getConfig } from "@repo/config";
import { getAccessToken } from "@repo/utils";
import { BUILTIN_ORNAMENTS } from "./builtinOrnaments";
import { isOrnamentSlot, ORNAMENT_SLOTS, type Ornament, type OrnamentSlot } from "./types";

/** 本地佩戴快照（版本化，改结构时换 v2 自动回落默认） */
const WEAR_KEY = "koi:ornament:wear:v1";
/** 本地领取快照：ornamentId -> 过期时间（null = 永久） */
const GRANT_KEY = "koi:ornament:grants:v1";
/** 接口地址 */
const API_LIST = "/v2/ornament/list";
const API_MINE = "/v2/ornament/mine";
const API_GRANTS = "/v2/ornament/grants";
const API_ACQUIRE = "/v2/ornament/acquire";

/** 开关：app.yaml other.ornament.enable（默认关闭） */
export function isOrnamentEnabled(): boolean {
  return getConfig()?.other?.ornament?.enable === true;
}

/** 目录：默认用静态兜底，拉到服务端后整体替换 */
export const ornamentCatalog = ref<Ornament[]>([...BUILTIN_ORNAMENTS]);

/** 每个槽位当前佩戴的一件（null = 不佩戴） */
export const ornamentWear = reactive<Record<OrnamentSlot, Ornament | null>>({
  avatar: null,
  nameplate: null,
});

/** 已领取记录：ornamentId -> 过期时间（null = 永久；未知格式按原样存，读取时统一解析） */
export const ornamentGrants = ref<Record<number, unknown>>({});

/** 是否正在同步（面板用于 loading） */
export const ornamentLoading = ref(false);

/**
 * 时间解析：兼容 ISO 字符串与 Jackson 的数组格式。
 *
 * @param value 服务端下发的日期
 * @returns 毫秒时间戳；无法解析时为 NaN
 */
function parseTime(value: unknown): number {
  if (value === null || value === undefined || value === "") return Number.NaN;
  if (typeof value === "number") return value;
  if (Array.isArray(value)) {
    const parts = value as number[];
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] = parts;
    if (!Number.isFinite(year)) return Number.NaN;
    return new Date(year, month - 1, day, hour, minute, second).getTime();
  }
  if (typeof value === "string") return Date.parse(value);
  return Number.NaN;
}

/** 把服务端行归一成 Ornament */
function toOrnament(row: Record<string, unknown>): Ornament | null {
  const slot = row.sysOrnamentSlot;
  if (!isOrnamentSlot(slot)) return null;
  const id = Number(row.sysOrnamentId);
  if (!Number.isFinite(id)) return null;
  const glyph = typeof row.sysOrnamentGlyph === "string" ? row.sysOrnamentGlyph : undefined;
  const image = typeof row.sysOrnamentImage === "string" ? row.sysOrnamentImage : undefined;
  const css = typeof row.sysOrnamentCss === "string" ? row.sysOrnamentCss : undefined;
  const effect = row.sysOrnamentEffect;
  return {
    id,
    code: typeof row.sysOrnamentCode === "string" ? row.sysOrnamentCode : `ornament-${id}`,
    name: typeof row.sysOrnamentName === "string" && row.sysOrnamentName ? row.sysOrnamentName : "饰品",
    slot,
    kind: row.sysOrnamentKind === "css" ? "css" : "glyph",
    glyph,
    image,
    css,
    color: typeof row.sysOrnamentColor === "string" ? row.sysOrnamentColor : undefined,
    acquire: row.sysOrnamentAcquire === "limited" ? "limited" : "default",
    effect:
      effect === "pulse" || effect === "spin" || effect === "glow"
        ? effect
        : "none",
    expire: typeof row.sysOrnamentExpire === "string" ? row.sysOrnamentExpire : null,
  };
}

/** 读本地佩戴快照 */
function readWear(): Record<OrnamentSlot, Ornament | null> {
  const empty: Record<OrnamentSlot, Ornament | null> = { avatar: null, nameplate: null };
  if (typeof window === "undefined" || !window.localStorage) return empty;
  try {
    const raw = window.localStorage.getItem(WEAR_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const slot of ORNAMENT_SLOTS) {
      const item = parsed?.[slot];
      if (!item || typeof item !== "object") continue;
      const one = item as Record<string, unknown>;
      const id = Number(one.id);
      if (!Number.isFinite(id)) continue;
      empty[slot] = {
        id,
        code: typeof one.code === "string" ? one.code : "",
        name: typeof one.name === "string" && one.name ? one.name : "饰品",
        slot,
        kind: one.kind === "css" ? "css" : "glyph",
        glyph: typeof one.glyph === "string" ? one.glyph : undefined,
        image: typeof one.image === "string" ? one.image : undefined,
        css: typeof one.css === "string" ? one.css : undefined,
        color: typeof one.color === "string" ? one.color : undefined,
        acquire: one.acquire === "limited" ? "limited" : "default",
        effect:
          one.effect === "pulse" || one.effect === "spin" || one.effect === "glow"
            ? one.effect
            : "none",
        expire: typeof one.expire === "string" ? one.expire : null,
      };
    }
    return empty;
  } catch {
    return empty;
  }
}

/** 落盘佩戴快照 */
function persistWear(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(WEAR_KEY, JSON.stringify(ornamentWear));
  } catch {
    /* 存不下不影响本次会话 */
  }
}

/** 读本地领取快照 */
function readGrants(): Record<number, unknown> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(GRANT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<number, unknown>) : {};
  } catch {
    return {};
  }
}

/** 落盘领取快照 */
function persistGrants(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(GRANT_KEY, JSON.stringify(ornamentGrants.value));
  } catch {
    /* 存不下不影响本次会话 */
  }
}

// 模块加载即恢复一次，首屏不会先没有挂件再跳出来
Object.assign(ornamentWear, readWear());
ornamentGrants.value = readGrants();

function hasToken(): boolean {
  try {
    return Boolean(getAccessToken());
  } catch {
    return false;
  }
}

/** 动态取接口实例：避免 theme ↔ core 的静态循环依赖（与壁纸 / 头像框同一写法） */
async function api(): Promise<{
  get: (url: string) => any;
  put: (url: string) => any;
  post: (url: string) => any;
}> {
  const { getApiHttp } = await import("@repo/core");
  return getApiHttp();
}

let syncPromise: Promise<void> | null = null;
/** 是否已经成功跑过一次同步（避免每次 Header 重挂载都重复拉目录） */
let syncedOnce = false;
/**
 * 装扮版本号：本地每改一次（佩戴 / 领取）+1。
 *
 * <p>连续操作会并发多个请求，响应到达顺序不保证；早期响应里带的是旧的整体列表，
 * 直接套用会把后一次操作抹掉。请求发出时记下版本，回来时版本变了就丢弃这次响应。</p>
 */
let wearVersion = 0;

/** 用服务端返回的整体佩戴列表覆盖本地 */
function applyWorn(list: Ornament[]): void {
  for (const slot of ORNAMENT_SLOTS) {
    ornamentWear[slot] = list.find((item) => item.slot === slot) || null;
  }
  persistWear();
}

/** 用服务端返回的领取记录覆盖本地 */
function applyGrants(rows: Record<string, unknown>[]): void {
  const next: Record<number, unknown> = {};
  for (const row of rows) {
    const id = Number(row.sysOrnamentId);
    if (!Number.isFinite(id)) continue;
    next[id] = row.expireAt ?? null;
  }
  ornamentGrants.value = next;
  persistGrants();
}

/**
 * 拉目录 + 我的佩戴 + 领取记录
 *
 * <p>任何一步失败都静默：后端未部署时继续用兜底目录与本地快照，功能不降级成不可用。</p>
 */
export function syncOrnaments(force = false): Promise<void> {
  if (!isOrnamentEnabled() || typeof window === "undefined") return Promise.resolve();
  if (!force && syncedOnce) return Promise.resolve();
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    ornamentLoading.value = true;
    const version = wearVersion;
    try {
      const http = await api();
      const listBody = await http
        .get(API_LIST)
        .loading(false)
        .noToast(true)
        .then((r: any) => r.data);
      const rows = Array.isArray(listBody?.data) ? listBody.data : [];
      const items = rows
        .map((row: Record<string, unknown>) => toOrnament(row))
        .filter((item: Ornament | null): item is Ornament => Boolean(item));
      if (items.length) {
        ornamentCatalog.value = items;
      }

      if (!hasToken()) return;

      const mineBody = await http
        .get(API_MINE)
        .loading(false)
        .noToast(true)
        .then((r: any) => r.data);
      // 空数组是服务端的权威结论（当前没戴任何饰品），此时清掉本地快照。
      // 但同步期间用户又改过装扮（版本变了）就以本地为准，不拿旧快照回退。
      if (Array.isArray(mineBody?.data) && version === wearVersion) {
        applyWorn(
          mineBody.data
            .map((row: Record<string, unknown>) => toOrnament(row))
            .filter((item: Ornament | null): item is Ornament => Boolean(item)),
        );
      }

      const grantBody = await http
        .get(API_GRANTS)
        .loading(false)
        .noToast(true)
        .then((r: any) => r.data);
      if (Array.isArray(grantBody?.data) && version === wearVersion) {
        applyGrants(grantBody.data);
      }
    } catch {
      /* 静默：继续用兜底目录与本地快照 */
    } finally {
      syncedOnce = true;
      ornamentLoading.value = false;
      syncPromise = null;
    }
  })();
  return syncPromise;
}

/** 推送单个槽位的佩戴结果（失败保留本地，不回滚） */
async function pushWear(slot: OrnamentSlot, ornamentId: number | null, version: number): Promise<void> {
  if (!isOrnamentEnabled() || !hasToken()) return;
  try {
    const http = await api();
    const body = await http
      .put(API_MINE)
      .data({ slot, ornamentId })
      .loading(false)
      .noToast(true)
      .then((r: any) => r.data);
    // 这次响应返回时本地又改过装扮：丢弃，避免用旧列表覆盖新选择
    if (version !== wearVersion) return;
    if (Array.isArray(body?.data)) {
      applyWorn(
        body.data
          .map((row: Record<string, unknown>) => toOrnament(row))
          .filter((item: Ornament | null): item is Ornament => Boolean(item)),
      );
    }
  } catch {
    /* 静默：本地先戴着，下次同步以服务端为准 */
  }
}

/**
 * 是否已过期（目录级或领取记录级）
 *
 * @param item 饰品
 * @returns 任一过期时间为过去时返回 true
 */
export function isOrnamentExpired(item: Ornament): boolean {
  const now = Date.now();
  const catalog = parseTime(item.expire);
  const grant = parseTime(ornamentGrants.value[item.id]);
  return (Number.isFinite(catalog) && catalog <= now) || (Number.isFinite(grant) && grant <= now);
}

/**
 * 是否拥有（默认款人人有；限定款看领取记录）
 *
 * @param item 饰品
 * @returns 可佩戴时为 true
 */
export function isOrnamentOwned(item: Ornament): boolean {
  if ((item.acquire ?? "default") !== "limited") return true;
  const granted = Object.prototype.hasOwnProperty.call(ornamentGrants.value, item.id);
  return granted && !isOrnamentExpired(item);
}

/**
 * 佩戴一件；传 null 表示取下该槽位。
 *
 * @returns 未拥有或已过期时返回 false，调用方据此提示
 */
export function wearOrnament(slot: OrnamentSlot, ornament: Ornament | null): boolean {
  if (ornament && (!isOrnamentOwned(ornament) || isOrnamentExpired(ornament))) {
    return false;
  }
  ornamentWear[slot] = ornament;
  persistWear();
  wearVersion += 1;
  void pushWear(slot, ornament ? ornament.id : null, wearVersion);
  return true;
}

/**
 * 领取一件限定饰品
 *
 * <p>未登录（纯本地预览）时直接记到本地，方便兜底目录也能试戴；
 * 登录后走服务端，返回值是操作后的领取列表。</p>
 *
 * @returns 领取是否成功
 */
export async function acquireOrnament(item: Ornament): Promise<boolean> {
  if (!isOrnamentEnabled()) return false;
  if (!hasToken()) {
    ornamentGrants.value = { ...ornamentGrants.value, [item.id]: item.expire ?? null };
    persistGrants();
    wearVersion += 1;
    return true;
  }
  try {
    const http = await api();
    const body = await http
      .post(API_ACQUIRE)
      .data({ ornamentId: item.id })
      .loading(false)
      .noToast(true)
      .then((r: any) => r.data);
    if (Array.isArray(body?.data)) {
      wearVersion += 1;
      applyGrants(body.data);
    }
    return true;
  } catch {
    // 服务端不可用（未部署 / 404 / 网络）：与未登录一致，先记在本机，
    // 接口恢复后由 /mine 与 /grants 覆盖。不要让兜底目录连试戴都做不了。
    ornamentGrants.value = { ...ornamentGrants.value, [item.id]: item.expire ?? null };
    persistGrants();
    wearVersion += 1;
    return true;
  }
}

/** 某槽位可用饰品 */
export function ornamentsForSlot(slot: OrnamentSlot): Ornament[] {
  return ornamentCatalog.value.filter((item) => item.slot === slot);
}

/** 某件是否正戴着 */
export function isOrnamentWorn(ornament: Ornament): boolean {
  return ornamentWear[ornament.slot]?.id === ornament.id;
}

/** 昵称牌的行内样式；未佩戴、未拥有或已过期时返回空对象 */
export function nameplateStyle(): Record<string, string> {
  const item = ornamentWear.nameplate;
  if (!item || !isOrnamentOwned(item) || isOrnamentExpired(item)) return {};
  const style: Record<string, string> = {
    display: "inline-block",
    padding: "1px 10px",
    borderRadius: "999px",
  };
  if (item.css) style.background = item.css;
  if (item.color) style.color = item.color;
  return style;
}
