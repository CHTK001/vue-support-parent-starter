/**
 * 头像框共享定义（渲染 + 字典）
 *
 * 供主题 Header / 布局 / 个人中心 / 设置面板四处渲染点复用。
 * 头像框字典来自服务端 `/v2/avatar-frame/list`（含生日框按生日窗口下发），
 * 本模块把字典缓存在模块级 ref 上，渲染函数直接读缓存，因此组件里调用即响应式。
 *
 * 目录构成（种子 id=1 为透明占位「经典」，即不佩戴）：
 *  - 生肖 201-212、生日 100：`sys_avatar_frame_image` 指向
 *    public/assets/avatar-frames/*.apng，统一 400 画布、静态珐琅环 + 动物动画。
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
 * 特效帧素材的孔径占画布比例（洞径 ÷ 画布边长）。
 * <p>素材统一 400 画布、中心孔径 0.72（环带较细、外径 1.39 倍头像），
 * 叠加层放大到 1/0.72 ≈ 1.39 倍头像即可把孔对准头像。</p>
 * <p>与 generate_avatar_frames.py 的 HOLE_SIZE 保持一致；改素材需同步改这里。</p>
 */
const HOLE_RATIO_IMG = 0.72;

/**
 * 渐变环（常规款）的孔径比例。
 * <p>素环没有剪影，按素材的 1.72 倍画只会糊成一大块；但收到 3px 以下时
 * 浅色款（素环）在白底上等于看不见，故取 0.74：层约 1.35 倍头像，环带 5~6px。</p>
 */
const HOLE_RATIO_GRAD = 0.74;

/**
 * 佩戴位（Header / 侧栏 / 个人中心）头像框超出头像的最大倍数。
 * <p>当前素材环带外径 1.39 倍头像（孔径 0.72），已小于该上限，正常不触发裁剪；
 * 保留此上限用于兜底更宽的旧素材，避免小尺寸下压到卡片圆角与文字。</p>
 */
export const WORN_FRAME_MAX_MULTIPLE = 1.45;

/** 遮罩：中心挖空到渐变环的孔径比例，其余保留，用于把渐变画成环 */
const HOLE_MASK = `radial-gradient(circle farthest-side, rgba(0,0,0,0) 0 ${
  HOLE_RATIO_GRAD * 100
}%, #000 ${HOLE_RATIO_GRAD * 100 + 0.4}%)`;

/** 生肖框资源路径（种子 201-212 与兜底字典共用） */
function zodiac(file: string): string {
  return `/assets/avatar-frames/${file}.apng`;
}


/** 服务端不可用时的兜底字典（常规 + 十二生肖） */
export const FALLBACK_AVATAR_FRAMES: AvatarFrame[] = [
  { id: 101, name: "鎏金", type: "regular", acquire: "default", image: "/assets/avatar-frames/reg-gold.apng" },
  { id: 102, name: "银辉", type: "regular", acquire: "default", image: "/assets/avatar-frames/reg-silver.apng" },
  { id: 103, name: "玫瑰金", type: "regular", acquire: "default", image: "/assets/avatar-frames/reg-rose.apng" },
  { id: 104, name: "宝蓝", type: "regular", acquire: "default", image: "/assets/avatar-frames/reg-sapphire.apng" },
  { id: 105, name: "翡翠", type: "regular", acquire: "default", image: "/assets/avatar-frames/reg-emerald.apng" },
  { id: 106, name: "紫晶", type: "regular", acquire: "default", image: "/assets/avatar-frames/reg-amethyst.apng" },
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
];

/** 当前生效的头像框字典（响应式；初始为兜底字典） */
export const avatarFrameDict = shallowRef<AvatarFrame[]>(FALLBACK_AVATAR_FRAMES);

let loadPromise: Promise<void> | null = null;

/** 头像框总开关：系统设置 other.avatarFrame.enable（默认开启，显式 false 才关闭） */
export function isAvatarFrameEnabled(): boolean {
  return getConfig()?.other?.avatarFrame?.enable ?? true;
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
export function hasFrameVisual(frame: AvatarFrame | undefined): frame is AvatarFrame {
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
 * 头像框叠加层样式：层尺寸 = 头像尺寸 ÷ 对应素材的洞径比，使孔洞正好罩住头像
 *
 * <p>层盒始终按素材比例取尺寸（孔洞才能与头像同心），`maxMultiple` 只做同心
 * 圆形裁剪：把超出头像 N 倍的剪影尖角切掉，不改变孔洞位置。</p>
 *
 * @param frame 字典项
 * @param avatarSize 头像渲染尺寸（px）
 * @param maxMultiple 头像框最大外溢倍数，0 表示不裁剪（预览位用）
 */
export function frameLayerStyle(
  frame: AvatarFrame | undefined,
  avatarSize: number,
  maxMultiple = 0,
): Record<string, string> {
  if (!hasFrameVisual(frame)) return {};
  if (frame.image) {
    const layer = Math.round(avatarSize / HOLE_RATIO_IMG);
    const style: Record<string, string> = {
      width: `${layer}px`,
      height: `${layer}px`,
      "background-size": "100% 100%",
      "background-repeat": "no-repeat",
      "background-position": "center",
      "filter": "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.28))",
    };
    if (maxMultiple > 0) {
      const outer = Math.round(avatarSize * maxMultiple);
      if (outer < layer) {
        const clip = `circle(${outer / 2}px at 50% 50%)`;
        style["-webkit-clip-path"] = clip;
        style["clip-path"] = clip;
      }
    }
    style["background-image"] = `url("${resolveAvatarFrameUrl(frame.image)}")`;
    return style;
  }
  return {
    width: `${Math.round(avatarSize / HOLE_RATIO_GRAD)}px`,
    height: `${Math.round(avatarSize / HOLE_RATIO_GRAD)}px`,
    background: frame.color as string,
    "border-radius": "50%",
    "-webkit-mask-image": HOLE_MASK,
    "mask-image": HOLE_MASK,
  };
}

/**
 * 佩戴位头像框相对头像需要预留的外边距（px）
 *
 * @param avatarSize 头像渲染尺寸（px）
 * @param maxMultiple 与叠加层一致的裁剪倍数，0 表示不裁剪
 */
export function wornFrameSpillPx(avatarSize: number, maxMultiple = WORN_FRAME_MAX_MULTIPLE): number {
  const outer = maxMultiple > 0
    ? Math.min(avatarSize / HOLE_RATIO_IMG, Math.round(avatarSize * maxMultiple))
    : Math.round(avatarSize / HOLE_RATIO_IMG);
  return Math.max(0, Math.round((outer - avatarSize) / 2));
}

/**
 * 按头像框 ID 取佩戴位叠加层样式
 *
 * @param frameId 头像框ID
 * @param avatarSize 头像渲染尺寸（px）
 */
export function getAvatarFrameLayerStyle(
  frameId: number,
  avatarSize: number,
  maxMultiple = WORN_FRAME_MAX_MULTIPLE,
): Record<string, string> {
  return frameLayerStyle(findAvatarFrame(frameId), avatarSize, maxMultiple);
}

/* ==================== 默认光环（未佩戴头像框时的底款） ==================== */

/**
 * 默认光环宽度（px）：随头像尺寸轻微缩放，
 * 保证小头像看得见、大头像不过粗（32→2 / 56→3 / 104→5）。
 */
export function defaultRingWidth(avatarSize: number): number {
  return Math.min(5, Math.max(2, Math.round(avatarSize * 0.05)));
}

/**
 * 默认光环叠加层样式（四处渲染点共用，配合全局类 `.koi-avatar-default-frame`）
 *
 * <p>层尺寸 = 头像 + 2×环宽（环正好贴在头像外沿）；居中用 50%/50% + 负 margin，
 * 不使用 transform —— 留给光环自身的旋转动画。</p>
 *
 * @param avatarSize 头像渲染尺寸（px）
 */
export function defaultFrameLayerStyle(avatarSize: number): Record<string, string> {
  const width = defaultRingWidth(avatarSize);
  const size = avatarSize + width * 2;
  return {
    width: `${size}px`,
    height: `${size}px`,
    "margin-left": `${-size / 2}px`,
    "margin-top": `${-size / 2}px`,
    "--koi-avatar-ring-w": `${width}px`,
  };
}
