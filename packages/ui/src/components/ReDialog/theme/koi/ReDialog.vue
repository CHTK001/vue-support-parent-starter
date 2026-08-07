<script setup lang="ts">
/**
 * ReDialog koi 主题 —— 弹窗组件（KoiDialog 移植）
 *
 * 提供窗口壳能力：最小化浮标、全屏切换、关闭二次确认。
 * 使用方式与 default 主题对齐（v-model 控制显隐），
 * 额外支持 koi 专属能力：showWindowShell / fullscreen / footerHidden。
 */
import { ref, toRefs, computed, onMounted, onUnmounted } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { useKoiWindowShell } from "./useKoiWindowShell";
import KoiShellHeaderActions from "./KoiShellHeaderActions.vue";
import KoiShellMinimizedDock from "./KoiShellMinimizedDock.vue";

defineOptions({ name: "ReDialog", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
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
  }>(),
  {
    title: "ReDialog",
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
  },
);

/** v-model 控制显隐（与 default 主题 API 对齐） */
const visible = defineModel<boolean>({ default: false });

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
  visible.value = false;
  clearMinimized();
}

function koiConfirm() {
  emit("confirm");
}

function koiCancel() {
  emit("cancel");
}

/** 编程式打开 */
function koiOpen() {
  visible.value = true;
}

/** 编程式快速关闭（跳过二次确认） */
function koiQuickClose() {
  clearMinimized();
  visible.value = false;
}

defineExpose({ koiOpen, koiClose, koiQuickClose });
</script>

<template>
  <ElDialog
    class="koi-dialog-shell"
    :model-value="visible"
    :title="title"
    :width="dialogWidth"
    :top="top"
    :center="center"
    :align-center="alignCenter"
    :close-on-click-modal="closeOnClickModal"
    append-to-body
    draggable
    :destroy-on-close="destroyOnClose"
    :before-close="koiClose"
    :fullscreen="dialogFullscreen"
    :loading="loading"
    :show-close="!showWindowShell"
  >
    <template v-if="showWindowShell" #header>
      <div class="koi-dialog-custom-header">
        <span class="el-dialog__title">{{ title }}</span>
        <KoiShellHeaderActions
          :is-fullscreen="dialogFullscreen"
          :enabled="visible"
          @minimize="minimize"
          @toggle-fullscreen="toggleFullscreen"
          @close="koiClose"
        />
      </div>
    </template>
    <slot name="header"></slot>
    <div
      class="dialog-content-wrapper"
      :style="dialogFullscreen ? { height: 'auto' } : { height: height + 'px' }"
    >
      <slot name="content"></slot>
    </div>
    <template v-if="!footerHidden" #footer>
      <span class="dialog-footer">
        <el-button class="koi-btn-borderless" type="primary" :loading="confirmLoading" @click="koiConfirm">
          {{ confirmText || "确定" }}
        </el-button>
        <el-button class="koi-btn-borderless" type="danger" @click="koiCancel">
          {{ cancelText || "取消" }}
        </el-button>
      </span>
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
  width: 100%;
  min-width: 0;
  padding-right: 0;

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
</style>
