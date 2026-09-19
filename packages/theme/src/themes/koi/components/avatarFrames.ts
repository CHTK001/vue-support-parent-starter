/**
 * 头像框共享定义（渲染 + 字典）
 *
 * 供主题 Header / 布局 / 个人中心 / 设置面板四处渲染点复用。
 * 头像框字典来自服务端 `/v2/avatar-frame/list`（含生日框按生日窗口下发），
 * 本模块把字典缓存在模块级 ref 上，渲染函数直接读缓存，因此组件里调用即响应式。
 *
 * 目录构成（种子 id=1 为透明占位「经典」，即不佩戴）：
 *  - 生肖 201-212、神兽 221-226、生日 100：`sys_avatar_frame_image` 指向
 *    public/assets/avatar-frames/*.svg，统一 200 画布、暗珐琅底 + 描金剪影。
 *  - 若某行只有 `sys_avatar_frame_color`（完整 CSS 渐变串），仍按「渐变 + 径向遮罩挖孔」画环。
 */
import { shallowRef } from "vue";
import { getConfig } from "@repo/config";

/** 生日框记录ID（数据库固定 id=100，type=birthday） */
export const BIRTHDAY_FRAME_ID = 100;

/** 头像框字典项（字段与 sys_avatar_frame 列对应） */
export interface AvatarFrame {
  id: number;
  name: string;
  type?: string;
  /** 获取方式：default 直接可戴，birthday 等需先解锁 */
  acquire?: string;
  /** 特效帧资源路径（服务端下发，根路径不带应用 base） */
  image?: string;
  /** 渐变帧的 CSS 背景值 */
  color?: string;
}

/**
 * 孔径占画布的比例（洞径 ÷ 画布边长）。
 * <p>素材统一为 200 画布、中心透明孔半径 58（环带外径 78，剪影可伸出环带），
 * 故渐变环与图片环共用一个比例，叠加层尺寸 = 头像尺寸 ÷ 该比例即可让环贴合头像边缘。</p>
 */
const HOLE_RATIO = 0.58;

/** 遮罩：中心挖空到 HOLE_RATIO，其余保留，用于把渐变画成环 */
const HOLE_MASK =
  "radial-gradient(circle farthest-side, rgba(0,0,0,0) 0 58%, #000 58.4%)";

/** 生肖框资源路径（种子 201-212 与兜底字典共用） */
function zodiac(file: string): string {
  return `/assets/avatar-frames/${file}.svg`;
}

/** 服务端不可用、或生日窗口外仍可解析生日框时的兜底字典 */
export const FALLBACK_AVATAR_FRAMES: AvatarFrame[] = [
  { id: 201, name: "子鼠", type: "zodiac", acquire: "default", image: zodiac("zodiac-rat") },
  { id: 202, name: "丑牛", type: "zodiac", acquire: "default", image: zodiac("zodiac-ox") },
  { id: 203, name: "寅虎", type: "zodiac", acquire: "default", image: zodiac("zodiac-tiger") },
  { id: 204, name: "卯兔", type: "zodiac", acquire: "default", image: zodiac("zodiac-rabbit") },
  { id: 205, name: "辰龙", type: "zodiac", acquire: "default", image: zodiac("zodiac-dragon") },
  { id: 206, name: "巳蛇", type: "zodiac", acquire: "default", image: zodiac("zodiac-snake") },
  { id: 207, name: "午马", type: "zodiac", acquire: "default", image: zodiac("zodiac-horse") },
  { id: 208, name: "未羊", type: "zodiac", acquire: "default", image: zodiac("zodiac-goat") },
  { id: 209, name: "申猴", type: "zodiac", acquire: "default", image: zodiac("zodiac-monkey") },
  { id: 210, name: "酉鸡", type: "zodiac", acquire: "default", image: zodiac("zodiac-rooster") },
  { id: 211, name: "戌狗", type: "zodiac", acquire: "default", image: zodiac("zodiac-dog") },
  { id: 212, name: "亥猪", type: "zodiac", acquire: "default", image: zodiac("zodiac-pig") },
  { id: 221, name: "狮鹫", type: "beast", acquire: "limit", image: zodiac("beast-griffin") },
  { id: 222, name: "独角兽", type: "beast", acquire: "limit", image: zodiac("beast-unicorn") },
  { id: 223, name: "凤凰", type: "beast", acquire: "limit", image: zodiac("beast-phoenix") },
  { id: 224, name: "麒麟", type: "beast", acquire: "limit", image: zodiac("beast-qilin") },
  { id: 225, name: "九尾狐", type: "beast", acquire: "limit", image: zodiac("beast-fox") },
  { id: 226, name: "天马", type: "beast", acquire: "limit", image: zodiac("beast-pegasus") },
  { id: BIRTHDAY_FRAME_ID, name: "生日快乐", type: "birthday", acquire: "birthday", image: zodiac("birthday") },
];

/** 当前生效的头像框字典（响应式；初始为兜底字典） */
export const avatarFrameDict = shallowRef<AvatarFrame[]>(FALLBACK_AVATAR_FRAMES);

let loadPromise: Promise<void> | null = null;

/** 头像框总开关：app.yaml 的 other.avatarFrame.enable（默认关闭） */
export function isAvatarFrameEnabled(): boolean {
  return getConfig()?.other?.avatarFrame?.enable ?? false;
}

/** 取应用 base（vite BASE_URL，末位不带斜杠）；非 vite 环境回退根路径 */
function assetBase(): string {
  // 必须是字面量 import.meta.env：vite 按该文本做常量替换，写成可选链会替换不到
  const env = (import.meta as unknown as { env: { BASE_URL?: string } }).env;
  return (env?.BASE_URL ?? "/").replace(/\/+$/, "");
}

/**
 * 把服务端下发的资源路径拼上应用 base。
 * <p>库里存的是 `/assets/...`，而静态目录挂在 base 之下（system 应用 base=/system/），
 * 直接引用会 404。</p>
 */
export function resolveAvatarFrameUrl(image: string): string {
  if (/^(https?:|data:|blob:)/.test(image)) return image;
  const base = assetBase();
  return `${base}${image.startsWith("/") ? "" : "/"}${image}`;
}

/** 把接口返回的行映射为字典项 */
function toFrame(row: Record<string, unknown>): AvatarFrame {
  return {
    id: row.sysAvatarFrameId as number,
    name: row.sysAvatarFrameName as string,
    type: row.sysAvatarFrameType as string | undefined,
    acquire: row.sysAvatarFrameAcquire as string | undefined,
    image: row.sysAvatarFrameImage as string | undefined,
    color: row.sysAvatarFrameColor as string | undefined,
  };
}

/**
 * 载入头像框字典
 * <p>同一页面多个渲染点共用一次请求；失败时保留兜底字典，不抛错。</p>
 */
export function loadAvatarFrames(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const { getApiHttp } = await import("@repo/core");
      const res = await getApiHttp()
        .get("/v2/avatar-frame/list")
        .loading(false)
        .then<{ code?: number; data?: Array<Record<string, unknown>> }>((r) => r.data);
      const rows = Array.isArray(res?.data) ? res.data : [];
      if (!rows.length) return;
      const fetched = rows.map(toFrame);
      // 生日窗口外后端不下发生日框，但已佩戴记录仍需能解析出资源
      const merged = [...fetched];
      for (const fallback of FALLBACK_AVATAR_FRAMES) {
        if (!merged.some((f) => f.id === fallback.id)) merged.push(fallback);
      }
      merged.sort((a, b) => a.id - b.id);
      avatarFrameDict.value = merged;
    } catch {
      // 服务端不可用时沿用兜底字典
    }
  })();
  return loadPromise;
}

/** 按 ID 查字典项 */
export function findAvatarFrame(frameId: number): AvatarFrame | undefined {
  if (!frameId) return undefined;
  return avatarFrameDict.value.find((f) => f.id === frameId);
}

/** 该帧是否有可视内容（透明占位帧「经典」返回 false，即不佩戴） */
export function hasFrameVisual(frame: AvatarFrame | undefined): boolean {
  if (!frame) return false;
  if (frame.image) return true;
  return Boolean(frame.color) && frame.color !== "transparent";
}

/** 该帧是否为需要解锁获取的限定帧 */
export function isAvatarFrameLocked(frame: AvatarFrame): boolean {
  return Boolean(frame.acquire) && frame.acquire !== "default";
}

/** 按 ID 判断是否有可视头像框 */
export function hasAvatarFrame(frameId: number): boolean {
  return hasFrameVisual(findAvatarFrame(frameId));
}

/**
 * 头像框叠加层样式：层尺寸 = 头像尺寸 ÷ 洞径比，使环贴合头像
 *
 * @param frame 字典项
 * @param avatarSize 头像渲染尺寸（px）
 */
export function frameLayerStyle(frame: AvatarFrame | undefined, avatarSize: number): Record<string, string> {
  if (!hasFrameVisual(frame)) return {};
  const size = `${Math.round(avatarSize / HOLE_RATIO)}px`;
  const box = { width: size, height: size };
  if (frame.image) {
    return { ...box, backgroundImage: `url("${resolveAvatarFrameUrl(frame.image)}")` };
  }
  return {
    ...box,
    background: frame.color as string,
    "border-radius": "50%",
    "-webkit-mask-image": HOLE_MASK,
    "mask-image": HOLE_MASK,
  };
}

/**
 * 按头像框 ID 取叠加层样式
 *
 * @param frameId 头像框ID
 * @param avatarSize 头像渲染尺寸（px）
 */
export function getAvatarFrameLayerStyle(frameId: number, avatarSize: number): Record<string, string> {
  return frameLayerStyle(findAvatarFrame(frameId), avatarSize);
}
