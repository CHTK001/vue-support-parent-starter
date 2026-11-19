<!-- 这里是一次性加载 LayoutComponents -->
<template>
  <div>
    <!-- 壁纸层：z-index:-1，落在所有布局组件的背景之下（见 styles/wallpaper.scss） -->
    <WallpaperLayer />
    <AnnouncementBar position="fixed-top" />
    <component :is="LayoutComponent[layout]" v-if="!isMobile" />
    <component :is="LayoutMobile" v-if="isMobile" />
    <!-- 站内消息右下角浮窗（app.yaml message.position=right-bottom 时挂载；hidden 时两处都不渲染） -->
    <ReStationMessage v-if="messageFloating" mode="floating" />
    <component :is="ThemeConfig" />
    <KoiLockScreen />
  </div>
</template>

<script setup lang="ts" name="layout">
import { useScreenStore } from "@repo/utils";
import { computed, onMounted, type Component } from "vue";
// 全局主题配置
import useGlobalStore from "@repo/pinia/modules/global";
import { useUserStore } from "@repo/pinia";
import {
  getWatermarkTamperCount,
  message,
  registerWatermarkTraceProvider,
  setupWatermark,
  WATERMARK_TAMPER_EVENT
} from "@repo/core";
import { getConfig } from "@repo/config";
import { useUnreadFlash } from "./useUnreadFlash";

// 未读消息标签页闪烁提示
useUnreadFlash();

// 水印溯源：全局水印文案拼入当前登录用户与生成时间（store 未就绪时由 core 侧降级为仅时间）
registerWatermarkTraceProvider(() => {
  const userStore = useUserStore();
  const info = (userStore?.userInfo ?? {}) as Record<string, unknown>;
  const user =
    userStore?.nickname || userStore?.username || (info.nickname as string) || (info.username as string) || "";
  const uid = info.userId != null ? String(info.userId) : "";
  return { user, uid };
});

// 水印篡改告警消费方：控制台留痕 + 低频用户提示（自愈逻辑在 core 防篡改层）。
// 审计上报待后端安全事件接口就绪后在此补充，前端不虚构契约。
let lastTamperToastAt = 0;
window.addEventListener(WATERMARK_TAMPER_EVENT, () => {
  const count = getWatermarkTamperCount();
  console.warn(`[watermark] 检测到水印被篡改，已自动恢复（累计 ${count} 次）`);
  const now = Date.now();
  if (now - lastTamperToastAt > 60_000) {
    lastTamperToastAt = now;
    message.warning("检测到水印被篡改，已自动恢复");
  }
});

// 应用全局水印：幂等装配（立即渲染 + web 字体就绪重绘）。
// 配置热重载后的自动重绘由 createApp 的 onConfigHotReload 通道负责，此处不重复订阅。
onMounted(() => {
  setupWatermark();
});
import ThemeConfig from "@repo/theme/koi/layouts/components/ThemeConfig/index.vue";
import ReStationMessage from "@repo/ui/re-station-message";
import KoiLockScreen from "@repo/theme/koi/layouts/components/LockScreen/index.vue";
import AnnouncementBar from "@repo/theme/koi/layouts/components/AnnouncementBar/index.vue";
import WallpaperLayer from "@repo/theme/koi/components/wallpaper/WallpaperLayer.vue";
import LayoutVertical from "@repo/theme/koi/layouts/LayoutVertical/index.vue";
import LayoutColumns from "@repo/theme/koi/layouts/LayoutColumns/index.vue";
import LayoutDouble from "@repo/theme/koi/layouts/LayoutDouble/index.vue";
import LayoutClassic from "@repo/theme/koi/layouts/LayoutClassic/index.vue";
import LayoutHorizontal from "@repo/theme/koi/layouts/LayoutHorizontal/index.vue";
import LayoutOptimum from "@repo/theme/koi/layouts/LayoutOptimum/index.vue";
import LayoutGroup from "@repo/theme/koi/layouts/LayoutGroup/index.vue";
import LayoutMobile from "@repo/theme/koi/layouts/LayoutMobile/index.vue";

type LayoutType = "vertical" | "columns" | "double" | "classic" | "horizontal" | 'optimum' | "group" | string;
const LayoutComponent: Record<LayoutType, Component> = {
  vertical: LayoutVertical,
  columns: LayoutColumns,
  double: LayoutDouble,
  classic: LayoutClassic,
  horizontal: LayoutHorizontal,
  optimum: LayoutOptimum,
  group: LayoutGroup
};

// 全局主题仓库
const globalStore = useGlobalStore();

/** 获取布局格式 */
const layout = computed(() => globalStore.layout);

/** 站内消息是否走右下角浮窗（app.yaml `message.position=right-bottom`） */
const messageFloating = computed(() => getConfig().message?.position === "right-bottom");

// 获取当前为[移动端、IPad、PC端]仓库，阔以使用 watchEffect(() => {}) 进行监听。
const { isMobile } = useScreenStore();
</script>

<style scoped lang="scss"></style>
