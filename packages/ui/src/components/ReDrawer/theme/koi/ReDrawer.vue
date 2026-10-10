<script setup lang="ts">
/**
 * ReDrawer koi 主题 —— 抽屉组件（KoiDrawer 移植）
 *
 * 提供窗口壳能力：最小化浮标、全屏切换、关闭二次确认。
 * 使用方式与 default 主题对齐（v-model 控制显隐）。
 */
import { message } from "@repo/core";
import { ref, toRefs, computed, onMounted, onUnmounted, type Component } from "vue";
import { ElDrawer, ElButton, ElMessageBox } from "element-plus";
import { Aim } from "@element-plus/icons-vue";
import { useKoiWindowShell } from "./useKoiWindowShell";
import KoiShellHeaderActions from "./KoiShellHeaderActions.vue";
import KoiShellMinimizedDock from "./KoiShellMinimizedDock.vue";

defineOptions({ name: "ReDrawer", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 标题栏图标（Element Plus 图标组件） */
    icon?: Component;
    size?: number | string;
    destroyOnClose?: boolean;
    closeOnClickModal?: boolean;
    confirmText?: string;
    cancelText?: string;
    direction?: "ltr" | "rtl" | "ttb" | "btt";
    loading?: boolean;
    footerHidden?: boolean;
    showWindowShell?: boolean;
    lockScroll?: boolean;
    modalClass?: string;
    drawerClass?: string;
    /** 关闭是否二次确认（默认 false 直接关闭） */
    closeConfirm?: boolean;
    /** 仅保留关闭按钮（隐藏最小化/全屏），设置类抽屉使用 */
    closeOnly?: boolean;
  }>(),
  {
    title: "ReDrawer",
    icon: Aim,
    size: "450",
    destroyOnClose: false,
    closeOnClickModal: false,
    confirmText: "",
    cancelText: "",
    direction: "rtl",
    loading: false,
    footerHidden: false,
    showWindowShell: true,
    lockScroll: true,
    modalClass: "",
    drawerClass: "",
    closeConfirm: false,
    closeOnly: false,
  },
);

const visible = defineModel<boolean>({ default: false });

const { loading } = toRefs(props);
const confirmLoading = ref(loading);

const {
  minimized,
  fullscreen: windowFullscreen,
  minimize,
  restoreFromDock,
  toggleFullscreen,
  clearMinimized,
  dockStackIndex,
} = useKoiWindowShell(visible);

const windowWidth = ref(window.innerWidth);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const baseDrawerSize = computed(() => {
  const sizeValue = parseFloat(String(props.size));
  const isHorizontal = props.direction === "ltr" || props.direction === "rtl";
  if (isHorizontal) {
    if (windowWidth.value < 600) return "86%";
    if (sizeValue > windowWidth.value) return "86%";
    if (sizeValue > windowWidth.value * 0.9) return "90%";
  } else {
    if (windowWidth.value < 600) return "60%";
  }
  return props.size;
});

const mergedDrawerSize = computed(() => (windowFullscreen.value ? "100%" : baseDrawerSize.value));

onMounted(() => window.addEventListener("resize", handleResize));
onUnmounted(() => window.removeEventListener("resize", handleResize));

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function koiClose() {
  if (props.closeConfirm && !props.closeOnClickModal) {
    ElMessageBox.confirm("关闭后所有未保存内容将丢失，确认关闭？", "温馨提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        visible.value = false;
        clearMinimized();
        message.warning("已关闭");
      })
      .catch(() => {
        message.warning("已取消");
      });
  } else {
    visible.value = false;
    clearMinimized();
  }
}

function koiConfirm() {
  emit("confirm");
}

function koiCancel() {
  emit("cancel");
}

function koiOpen() {
  visible.value = true;
}

function koiQuickClose() {
  clearMinimized();
  visible.value = false;
}

defineExpose({ koiOpen, koiClose, koiQuickClose });
</script>

<template>
  <ElDrawer
    :class="['koi-drawer-shell', drawerClass]"
    v-model="visible"
    :title="title"
    :size="mergedDrawerSize"
    :direction="direction"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    :before-close="koiClose"
    :loading="loading"
    :show-close="!showWindowShell"
    :lock-scroll="lockScroll"
    :modal-class="modalClass"
  >
    <template v-if="showWindowShell" #header="{ titleId, titleClass }">
      <div class="koi-drawer-custom-header">
        <span class="koi-drawer-header-left">
          <span v-if="icon" class="koi-drawer-header-icon-wrap">
            <el-icon class="koi-drawer-header-icon"><component :is="icon" /></el-icon>
          </span>
          <span :id="titleId" :class="titleClass">{{ title }}</span>
        </span>
        <KoiShellHeaderActions
          :is-fullscreen="windowFullscreen"
          :enabled="visible"
          :close-only="closeOnly"
          @minimize="minimize"
          @toggle-fullscreen="toggleFullscreen"
          @close="koiClose"
        />
      </div>
    </template>
    <div class="koi-drawer-body">
      <div class="body">
        <!--
          必须保留默认插槽兜底：default 主题的 ReDrawer 渲染的是 `<slot />`，
          而 ReDrawer 是按主题切换的组件（defineThemeComponent）。
          若此处只渲染具名 content，则所有按 default 主题习惯书写的
          `<ReDrawer>内容</ReDrawer>` 在 koi 主题下内容会被静默丢弃（抽屉空白）。
          写法与 ReDialog/theme/koi 保持一致。
        -->
        <slot name="content">
          <slot></slot>
        </slot>
      </div>
      <div class="footer" v-if="!footerHidden">
        <el-button class="koi-btn-borderless" type="primary" :loading="confirmLoading" @click="koiConfirm">
          {{ confirmText || "确定" }}
        </el-button>
        <el-button class="koi-btn-borderless" type="danger" @click="koiCancel">{{ cancelText || "取消" }}</el-button>
      </div>
    </div>
  </ElDrawer>
  <KoiShellMinimizedDock
    :visible="minimized"
    :title="title"
    tooltip="恢复窗口"
    :stack-index="dockStackIndex"
    @restore="restoreFromDock"
  />
</template>

<style scoped lang="scss">
.koi-drawer-custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;

  .koi-drawer-header-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .koi-drawer-header-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-bg-color);
  }

  .koi-drawer-header-icon {
    font-size: 16px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  > span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.koi-drawer-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .body {
    flex: 1;
    padding-right: 8px;
    overflow-y: auto;
    color: var(--theme-color-text, var(--el-text-color-primary));
  }

  .footer {
    display: flex;
    align-items: center;
    height: 50px;
    margin-top: auto;
  }
}

:deep(.el-drawer__title) {
  color: var(--theme-color-text, var(--el-text-color-primary));
}

.koi-btn-borderless {
  border: none;
  box-shadow: none;
}
</style>

<style lang="scss">
.el-drawer.koi-drawer-shell .el-drawer__header {
  margin-bottom: 0;
}

.el-drawer.koi-drawer-shell .el-drawer__body {
  padding-bottom: 8px;
}
</style>
