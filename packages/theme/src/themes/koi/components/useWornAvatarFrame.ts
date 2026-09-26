/**
 * 已佩戴头像框的展示逻辑（Header / 侧栏布局 / 个人中心共用）
 *
 * 头像框是否可见取决于三件事：功能开关开启、用户打开了「显示头像框」、
 * 该帧确有可视内容（渐变帧或特效帧；透明占位帧「经典」视为不佩戴）。
 */
import { computed, type ComputedRef } from "vue";
import { resolveUserDisplayInfo } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";
import {
  defaultFrameLayerStyle,
  getAvatarFrameLayerStyle,
  hasAvatarFrame,
  isAvatarFrameEnabled,
  loadAvatarFrames,
  wornFrameSpillPx,
} from "./avatarFrames";

/** 头像框佩戴状态来源 */
export interface WornFrameSource {
  avatarFrame?: number;
  avatarFrameShow?: number;
}

/**
 * 取当前佩戴头像框的渲染状态
 *
 * @param source 佩戴信息来源，默认合并 authStore 与 storage 快照（个人中心需传 /me 的最新数据）
 */
export function useWornAvatarFrame(
  source?: () => WornFrameSource | undefined,
): {
  visible: ComputedRef<boolean>;
  layerStyle: (avatarSize: number, maxMultiple?: number) => Record<string, string>;
  spillPx: (avatarSize: number, maxMultiple?: number) => number;
  /** 未佩戴头像框（或功能关闭/隐藏）时展示默认光环 */
  defaultVisible: ComputedRef<boolean>;
  /** 默认光环叠加层样式（配合全局类 .koi-avatar-default-frame） */
  defaultStyle: (avatarSize: number) => Record<string, string>;
} {
  const authStore = useAuthStore();
  // 刷新页面时守卫可能命中菜单缓存而不再调 /v2/user/me，loginUser 仍是初始零值；
  // resolveUserDisplayInfo 会回落到 storage 里的 sysUserAvatarFrame 快照
  const worn =
    source ??
    (() =>
      resolveUserDisplayInfo({
        authLoginUser: authStore.loginUser as Record<string, unknown>,
      }));
  // 渐变帧的 color 只在字典接口里，进入渲染点即预载（内部去重，只发一次请求）
  if (isAvatarFrameEnabled()) void loadAvatarFrames();
  const visible = computed(() => {
    if (!isAvatarFrameEnabled()) return false;
    const info = worn();
    if (Number(info?.avatarFrameShow ?? 0) !== 1) return false;
    return hasAvatarFrame(Number(info?.avatarFrame ?? 0));
  });
  const layerStyle = (avatarSize: number, maxMultiple?: number): Record<string, string> =>
    getAvatarFrameLayerStyle(Number(worn()?.avatarFrame ?? 0), avatarSize, maxMultiple);
  // 预留外边距：无帧时也占同样的位置，避免佩戴/取下时布局跳动
  const spillPx = (avatarSize: number, maxMultiple?: number): number =>
    wornFrameSpillPx(avatarSize, maxMultiple);
  // 未佩戴（或隐藏/功能关闭）时用默认光环兜底，保证头像始终有精致的收边
  const defaultVisible = computed(() => !visible.value);
  const defaultStyle = (avatarSize: number): Record<string, string> =>
    defaultFrameLayerStyle(avatarSize);
  return { visible, layerStyle, spillPx, defaultVisible, defaultStyle };
}
