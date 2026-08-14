/**
 * 头像框（图片/APNG 帧）共享定义
 *
 * 供主题 Header / 布局 / 个人中心等渲染点复用。
 * 渐变框（baseFrames 中的 color 类）由 Personage.vue 宫格统一展示；
 * 此处仅维护"佩戴后需要以图片覆盖头像"的帧 ID → 图片路径 映射。
 *
 * 注意：ID 与后端 sys_avatar_frame 种子数据保持一致（见
 * V1.0__init_system.sql（DB 初始化：渐变 1-22、图片帧 23-28、生日框 id=100；已合并 V1.3）。
 */
/** 生日框记录ID（数据库固定 id=100，type=birthday） */
export const BIRTHDAY_FRAME_ID = 100;

/** 图片/APNG 帧 ID → 资源路径（普通位图与 APNG 动画均走此映射） */
export const AVATAR_FRAME_IMAGES: Record<number, string> = {
  23: "/assets/avatar-frames/frame-gold.png",
  24: "/assets/avatar-frames/frame-royal.png",
  25: "/assets/avatar-frames/frame-rose.png",
  26: "/assets/avatar-frames/frame-flame.apng",
  27: "/assets/avatar-frames/frame-azure.apng",
  28: "/assets/avatar-frames/frame-onyx.png",
  [BIRTHDAY_FRAME_ID]: "/assets/avatar-frames/birthday.png",
};

/**
 * 图片/APNG 帧 ID → 中心透明孔径占画布的比例（洞径 ÷ 画布边长）。
 * <p>用于还原头像框：叠加层尺寸 = 头像尺寸 ÷ 该比例，使中心洞恰好容纳头像、环贴合头像边缘。</p>
 * <p>所有帧图已统一为圆形孔、内半径 63/160（口径 0.7875），故各帧比例一致。</p>
 */
export const AVATAR_FRAME_HOLE_RATIO: Record<number, number> = {
  23: 0.7875,
  24: 0.7875,
  25: 0.7875,
  26: 0.7875,
  27: 0.7875,
  28: 0.7875,
  [BIRTHDAY_FRAME_ID]: 0.7875,
};

/** 未收录帧的兜底比例 */
const DEFAULT_HOLE_RATIO = 0.7;

/** 通过 helmet | 挂件 | 头像栏目展示的头像框图片；非图片帧返回空串 */
export function getAvatarFrameImage(frameId: number): string {
  return AVATAR_FRAME_IMAGES[frameId] ?? "";
}

/**
 * 获取头像框叠加层样式：背景图 + 层尺寸（头像尺寸 ÷ 洞径比），使框环贴合头像
 *
 * @param frameId 头像框ID
 * @param avatarSize 头像渲染尺寸（px）
 */
export function getAvatarFrameLayerStyle(frameId: number, avatarSize: number): Record<string, string> {
  const image = getAvatarFrameImage(frameId);
  if (!image) return {};
  const ratio = AVATAR_FRAME_HOLE_RATIO[frameId] ?? DEFAULT_HOLE_RATIO;
  const size = `${Math.round(avatarSize / ratio)}px`;
  return {
    backgroundImage: `url(${image})`,
    width: size,
    height: size,
  };
}