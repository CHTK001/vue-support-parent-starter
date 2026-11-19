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
    <!-- 水印篡改告警横幅：持续可见入口，点击展开最近事件明细（toast 只弹一次/60s） -->
    <div v-if="wmTampers.length" class="wm-alert">
      <button class="wm-alert__bar" type="button" @click="wmAlertOpen = !wmAlertOpen">
        <span class="wm-alert__icon">!</span>
        <span class="wm-alert__text">水印防护触发 {{ wmTampers.length }} 次，均已自动恢复</span>
        <span class="wm-alert__arrow" :class="{ open: wmAlertOpen }">▾</span>
      </button>
      <div v-if="wmAlertOpen" class="wm-alert__detail">
        <div v-for="(ev, i) in wmTampers" :key="i" class="wm-alert__row">
          <span>{{ wmTimeLabel(ev.time) }}</span>
          <span>{{ wmTypeLabel(ev.type) }}</span>
        </div>
        <div v-if="wmTampers.length >= 20" class="wm-alert__more">仅保留最近 20 条</div>
        <button
          class="wm-alert__close"
          type="button"
          @click.stop="wmAlertOpen = false; wmTampers = [];"
        >
          知道了，隐藏
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="layout">
import { useScreenStore } from "@repo/utils";
import { computed, onMounted, ref, type Component } from "vue";
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
// 横幅提供持续可见入口（toast 每 60s 至多一次，横幅隐藏前一直在），可展开最近事件明细。
// 审计上报待后端安全事件接口就绪后在此补充，前端不虚构契约。
let lastTamperToastAt = 0;
/** 最近篡改事件（保留 20 条，供横幅展开明细） */
const wmTampers = ref<{ type: string; time: number }[]>([]);
const wmAlertOpen = ref(false);
const WM_TYPE_LABEL: Record<string, string> = {
  remove: "水印节点被删除",
  style: "水印样式被篡改",
  integrity: "完整性巡检异常"
};
function wmTypeLabel(type: string): string {
  return WM_TYPE_LABEL[type] ?? type;
}
function wmTimeLabel(time: number): string {
  return new Date(time).toLocaleTimeString("zh-CN", { hour12: false });
}
window.addEventListener(WATERMARK_TAMPER_EVENT, (event) => {
  const detail = (event as CustomEvent<{ type?: string; time?: number }>).detail ?? {};
  wmTampers.value = [
    ...wmTampers.value.slice(-19),
    { type: String(detail.type ?? "integrity"), time: Number(detail.time ?? Date.now()) }
  ];
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

<style scoped lang="scss">
/* 水印篡改告警横幅：右下角持续入口；z-index 低于消息/弹层，不挡交互 */
.wm-alert {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1500;
  width: 320px;
  max-width: calc(100vw - 32px);
  border: 1px solid var(--el-color-warning-light-7);
  border-radius: 10px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
}
.wm-alert__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: var(--el-color-warning-light-9);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
}
.wm-alert__bar:hover .wm-alert__text {
  color: var(--el-color-warning);
}
.wm-alert__icon {
  flex: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--el-color-warning);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}
.wm-alert__text {
  flex: 1;
  min-width: 0;
}
.wm-alert__arrow {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
}
.wm-alert__arrow.open {
  transform: rotate(180deg);
}
.wm-alert__detail {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px 12px 8px;
}
.wm-alert__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
  font-size: 11px;
  color: var(--el-text-color-regular);
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.wm-alert__row:last-of-type {
  border-bottom: none;
}
.wm-alert__more {
  padding: 2px 0;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
.wm-alert__close {
  margin-top: 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.wm-alert__close:hover {
  color: var(--el-color-primary);
}
</style>
