/**
 * 头像框（图片/APNG 帧）共享定义
 *
 * 供主题 Header / 布局 / 个人中心等渲染点复用。
 * 渐变框（baseFrames 中的 color 类）由 Personage.vue 宫格统一展示；
 * 此处仅维护"佩戴后需要以图片覆盖头像"的帧 ID → 图片路径 映射。
 *
 * 注意：ID 与后端 sys_avatar_frame 种子数据保持一致（见
 * V1.0__init_system.sql 前缀 1-27）。
 */
export const BIRTHDAY_FRAME_ID = 100;

/** 图片/APNG 帧 ID → 资源路径（普通位图与 APNG 动画均走此映射） */
export const AVATAR_FRAME_IMAGES: Record<number, string> = {
  23: "/assets/avatar-frames/frame-gold.png",
  24: "/assets/avatar-frames/frame-royal.png",
  25: "/assets/avatar-frames/frame-rose.png",
  26: "/assets/avatar-frames/frame-flame.apng",
  27: "/assets/avatar-frames/frame-azure.apng",
};

/** 通过 helmet | 挂件 | 头像栏目展示的头像框图片；非图片帧返回空串 */
export function getAvatarFrameImage(frameId: number): string {
  return AVATAR_FRAME_IMAGES[frameId] ?? "";
}