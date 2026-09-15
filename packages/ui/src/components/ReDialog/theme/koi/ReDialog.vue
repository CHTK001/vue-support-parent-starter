<script setup lang="ts">
/**
 * ReDialog koi 主题 —— 弹窗组件（KoiDialog 移植）
 *
 * 提供窗口壳能力：最小化浮标、全屏切换、关闭二次确认。
 * 使用方式与 default 主题对齐（v-model 控制显隐），
 * 额外支持 koi 专属能力：showWindowShell / fullscreen / footerHidden。
 */
import { ref, toRefs, computed, watch, onMounted, onUnmounted, type Component } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { Aim } from "@element-plus/icons-vue";
import { useKoiWindowShell } from "./useKoiWindowShell";
import KoiShellHeaderActions from "./KoiShellHeaderActions.vue";
import KoiShellMinimizedDock from "./KoiShellMinimizedDock.vue";
import ReDialogCloseFab from "../../CloseFab.vue";

defineOptions({ name: "ReDialog", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 标题栏图标（Element Plus 图标组件） */
    icon?: Component;
    width?: number | string;
    /** 距视口顶部的偏移，对应 el-dialog 的 top（如 6vh） */
    top?: string;
    /** 标题与页脚内容是否居中排版 */
    center?: boolean;
    /** 弹窗是否在视口中水平、垂直居中 */
    alignCenter?: boolean;
    height?: number;
    closeOnClickModal?: boolean;
    confirmText?: string;
    cancelText?: string;
    destroyOnClose?: boolean;
    /** 打开时是否全屏（可用右上角按钮切换） */
    fullscreen?: boolean;
    loading?: boolean;
    footerHidden?: boolean;
    /** 是否显示右上角窗口壳操作区（收起 / 全屏 / 关闭） */
    showWindowShell?: boolean;
    /** 最小化按钮是否显示（默认仅关闭可见） */
    showMinimize?: boolean;
    /** 全屏按钮是否显示（默认仅关闭可见） */
    showFullscreen?: boolean;
    /** headless：隐藏标题栏，右上角圆形悬浮关闭按钮替代 */
    headless?: boolean;
  }>(),
  {
    title: "ReDialog",
    icon: Aim,
    height: 300,
    width: 650,
    top: "",
    center: true,
    alignCenter: true,
    closeOnClickModal: false,
    confirmText: "",
    cancelText: "",
    destroyOnClose: false,
    fullscreen: false,
    loading: false,
    footerHidden: false,
    showWindowShell: true,
    showMinimize: false,
    showFullscreen: false,
    headless: false,
  },
);

/** v-model 控制显隐（与 default 主题 API 对齐） */
const visible = defineModel<boolean>({ default: false });

/**
 * 本地可见性镜像：关闭时本地立即生效，不依赖父组件是否响应 update:modelValue
 * （防御 v-model 绑定只读 props 等错误用法——父不响应时弹窗也能关闭；父重新打开时再同步）
 */
const localOpen = ref(false);
watch(visible, (v) => { localOpen.value = v; }, { immediate: true });

const { loading, width } = toRefs(props);
const confirmLoading = ref(loading);

const {
  minimized,
  fullscreen: windowFullscreen,
  minimize,
  restoreFromDock,
  toggleFullscreen,
  clearMinimized,
  dockStackIndex,
} = useKoiWindowShell(visible, () => props.fullscreen);

const dialogFullscreen = computed(() => windowFullscreen.value);

const windowWidth = ref(window.innerWidth);

const dialogWidth = computed(() => {
  if (dialogFullscreen.value) return "100%";
  if (windowWidth.value < 600) return "90%";
  const numericWidth = typeof width.value === "number" ? width.value : Number.parseFloat(String(width.value)) || windowWidth.value;
  if (numericWidth > windowWidth.value) return "90%";
  if (numericWidth > windowWidth.value * 0.95) return "95%";
  return width.value;
});

function handleResize() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => window.addEventListener("resize", handleResize));
onUnmounted(() => window.removeEventListener("resize", handleResize));

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function koiClose() {
  localOpen.value = false;
  visible.value = false;
  clearMinimized();
}

function koiConfirm() {
  emit("confirm");
}

function koiCancel() {
  emit("cancel");
  localOpen.value = false;
  visible.value = false;
  clearMinimized();
}

/** 编程式打开 */
function koiOpen() {
  visible.value = true;
}

/** 编程式快速关闭（跳过二次确认） */
function koiQuickClose() {
  clearMinimized();
  localOpen.value = false;
  visible.value = false;
}

defineExpose({ koiOpen, koiClose, koiQuickClose });
</script>

<template>
  <ElDialog
    class="koi-dialog-shell"
    :class="{ 'is-headless': headless }"
    :model-value="localOpen"
    :title="title"
    :width="dialogWidth"
    :top="top"
    :center="center"
    :align-center="alignCenter"
    :close-on-click-modal="closeOnClickModal"
    append-to-body
    modal-class="koi-dialog-modal"
    draggable
    :destroy-on-close="destroyOnClose"
    :before-close="koiClose"
    :fullscreen="dialogFullscreen"
    :loading="loading"
    :show-close="!showWindowShell"
  >
    <template v-if="showWindowShell" #header>
      <div class="koi-dialog-custom-header" :class="{ 'is-empty': headless }">
        <template v-if="!headless">
          <span class="koi-dialog-header-left">
            <span v-if="icon" class="koi-dialog-header-icon-wrap">
              <el-icon class="koi-dialog-header-icon"><component :is="icon" /></el-icon>
            </span>
            <span class="el-dialog__title">{{ title }}</span>
          </span>
          <KoiShellHeaderActions
            :is-fullscreen="dialogFullscreen"
            :enabled="visible"
            :show-minimize="showMinimize"
            :show-fullscreen="showFullscreen"
            @minimize="minimize"
            @toggle-fullscreen="toggleFullscreen"
            @close="koiClose"
          />
        </template>
        <!-- headless：隐藏标题栏内容，仅保留一条极窄拖拽条 + 右上角关闭按钮 -->
        <template v-else>
          <span class="koi-dialog-header-drag" />
        </template>
      </div>
    </template>
    <slot v-if="!headless" name="header"></slot>
    <ReDialogCloseFab
      v-if="headless"
      :size="28"
      @click="koiClose"
    />
    <div
      class="dialog-content-wrapper"
      :style="dialogFullscreen ? { height: 'auto' } : { height: height + 'px' }"
    >
      <slot name="content">
        <slot></slot>
      </slot>
    </div>
     <template v-if="!footerHidden" #footer>
      <slot name="footer" v-bind="{ confirm: koiConfirm, cancel: koiCancel, loading: confirmLoading }">
        <span class="dialog-footer">
          <el-button class="koi-btn-borderless" type="primary" :loading="confirmLoading" @click="koiConfirm">
            {{ confirmText || "确定" }}
          </el-button>
          <el-button class="koi-btn-borderless" type="danger" @click="koiCancel">
            {{ cancelText || "取消" }}
          </el-button>
        </span>
      </slot>
    </template>
  </ElDialog>
  <KoiShellMinimizedDock
    :visible="minimized"
    :title="title"
    tooltip="恢复窗口"
    :stack-index="dockStackIndex"
    @restore="restoreFromDock"
  />
</template>

<style lang="scss" scoped>
.koi-dialog-custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  padding-right: 0;

  .koi-dialog-header-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .koi-dialog-header-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-radius-md, 8px);
    background: var(--el-bg-color);
  }

  .koi-dialog-header-icon {
    font-size: 16px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  .el-dialog__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dialog-content-wrapper {
  box-sizing: border-box;
  padding-right: 6px;
  overflow: hidden auto;

  & > * {
    padding-right: 4px;
  }

  &--headless {
    padding-top: 16px;
  }
}

.koi-btn-borderless {
  border: none;
  box-shadow: none;
}
</style>

<style lang="scss">
.koi-dialog-shell .el-dialog__header {
  margin-right: 0;
}

.koi-dialog-shell--headless .el-dialog__header {
  display: none;
}

/* 弹窗遮罩：纯色扁平遮罩 */
.koi-dialog-modal {
  background-color: rgba(0, 0, 0, 0.45);
}

/* headless：隐藏标题内容，仅保留一条悬浮于顶部的拖拽热区条（不占内容高度，可拖动），CloseFab 浮于右上角 */
.koi-dialog-shell.is-headless {
  position: relative;
}

/* 拖拽热区：44px 透明条覆盖在 body 顶部，扩大可拖拽范围 */
.koi-dialog-shell.is-headless .el-dialog__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  height: 44px;
  overflow: hidden;
  z-index: 6;
}

.koi-dialog-shell.is-headless .koi-dialog-custom-header.is-empty {
  height: 44px;
  padding: 0;
}

.koi-dialog-shell.is-headless .koi-dialog-header-drag {
  display: block;
  width: 100%;
  height: 44px;
}

.koi-dialog-shell.is-headless .el-dialog__body {
  padding-top: 0;
}

/* 弹窗本体：加大圆角（保持不透明白色背景） */
.koi-dialog-shell {
  --el-dialog-border-radius: var(--el-radius-xl);
  border-radius: var(--el-radius-xl);
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.04);
}
</style>
