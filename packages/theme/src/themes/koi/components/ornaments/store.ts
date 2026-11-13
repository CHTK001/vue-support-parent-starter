/**
 * 饰品状态（单例）
 *
 * <p>与壁纸同一套「服务端为准 + 本地快路径」：</p>
 * <ul>
 *   <li>目录从 {@code /v2/ornament/list} 拉，失败时用 {@link BUILTIN_ORNAMENTS} 兜底；</li>
 *   <li>佩戴关系从 {@code /v2/ornament/mine} 拉，localStorage 只做首屏不闪；</li>
 *   <li>佩戴/取下走 {@code PUT /v2/ornament/mine}，本地先改、服务端失败保留本地。</li>
 * </ul>
 *
 * <p>开关口径：{@code other.ornament.enable} 未开时 {@link syncOrnaments} 直接返回，
 * 一个请求都不发；组件里也只读本地兜底，不触发任何网络。</p>
 */
import { reactive, ref } from "vue";
import { getConfig } from "@repo/config";
import { getAccessToken } from "@repo/utils";
import { BUILTIN_ORNAMENTS } from "./builtinOrnaments";
import { isOrnamentSlot, ORNAMENT_SLOTS, type Ornament, type OrnamentSlot } from "./types";

/** 本地佩戴快照（版本化，改结构时换 v2 自动回落默认） */
const WEAR_KEY = "koi:ornament:wear:v1";
/** 接口地址 */
const API_LIST = "/v2/ornament/list";
const API_MINE = "/v2/ornament/mine";

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

/** 是否正在同步（面板用于 loading） */
export const ornamentLoading = ref(false);

/** 把服务端行归一成 Ornament */
function toOrnament(row: Record<string, unknown>): Ornament | null {
  const slot = row.sysOrnamentSlot;
  if (!isOrnamentSlot(slot)) return null;
  const id = Number(row.sysOrnamentId);
  if (!Number.isFinite(id)) return null;
  const glyph = typeof row.sysOrnamentGlyph === "string" ? row.sysOrnamentGlyph : undefined;
  const image = typeof row.sysOrnamentImage === "string" ? row.sysOrnamentImage : undefined;
  const css = typeof row.sysOrnamentCss === "string" ? row.sysOrnamentCss : undefined;
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

// 模块加载即恢复一次，首屏不会先没有挂件再跳出来
Object.assign(ornamentWear, readWear());

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
}> {
  const { getApiHttp } = await import("@repo/core");
  return getApiHttp();
}

let syncPromise: Promise<void> | null = null;
/** 是否已经成功跑过一次同步（避免每次 Header 重挂载都重复拉目录） */
let syncedOnce = false;

/** 用服务端返回的整体佩戴列表覆盖本地 */
function applyWorn(list: Ornament[]): void {
  for (const slot of ORNAMENT_SLOTS) {
    ornamentWear[slot] = list.find((item) => item.slot === slot) || null;
  }
  persistWear();
}

/**
 * 拉目录 + 我的佩戴
 *
 * <p>任何一步失败都静默：后端未部署时继续用兜底目录与本地快照，功能不降级成不可用。</p>
 */
export function syncOrnaments(force = false): Promise<void> {
  if (!isOrnamentEnabled() || typeof window === "undefined") return Promise.resolve();
  if (!force && syncedOnce) return Promise.resolve();
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    ornamentLoading.value = true;
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
      // 空数组是服务端的权威结论（当前没戴任何饰品），此时清掉本地快照
      if (Array.isArray(mineBody?.data)) {
        applyWorn(
          mineBody.data
            .map((row: Record<string, unknown>) => toOrnament(row))
            .filter((item: Ornament | null): item is Ornament => Boolean(item)),
        );
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
async function pushWear(slot: OrnamentSlot, ornamentId: number | null): Promise<void> {
  if (!isOrnamentEnabled() || !hasToken()) return;
  try {
    const http = await api();
    const body = await http
      .put(API_MINE)
      .data({ slot, ornamentId })
      .loading(false)
      .noToast(true)
      .then((r: any) => r.data);
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

/** 佩戴一件；传 null 表示取下该槽位 */
export function wearOrnament(slot: OrnamentSlot, ornament: Ornament | null): void {
  ornamentWear[slot] = ornament;
  persistWear();
  void pushWear(slot, ornament ? ornament.id : null);
}

/** 某槽位可用饰品 */
export function ornamentsForSlot(slot: OrnamentSlot): Ornament[] {
  return ornamentCatalog.value.filter((item) => item.slot === slot);
}

/** 某件是否正戴着 */
export function isOrnamentWorn(ornament: Ornament): boolean {
  return ornamentWear[ornament.slot]?.id === ornament.id;
}

/** 昵称牌的行内样式；未佩戴时返回空对象 */
export function nameplateStyle(): Record<string, string> {
  const item = ornamentWear.nameplate;
  if (!item) return {};
  const style: Record<string, string> = {
    display: "inline-block",
    padding: "1px 10px",
    borderRadius: "999px",
  };
  if (item.css) style.background = item.css;
  if (item.color) style.color = item.color;
  return style;
}
