<template>
  <!-- append-to-body 点击空白处不关闭弹窗 -->
  <el-dialog
    class="koi-dialog-shell"
    :model-value="visible"
    :title="title"
    :width="dialogWidth"
    :top="top"
    :center="center"
    :align-center="alignCenter"
    :close-on-click-modal="closeOnClickModel"
    append-to-body
    draggable
    :destroy-on-close="destroyOnClose"
    :before-close="koiClose"
    :fullscreen="dialogFullscreen"
    :loading="loading"
    :footerHidden="footerHidden"
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
    <div class="dialog-content-wrapper" :style="dialogFullscreen ? { height: 'auto' } : { height: height + 'px' }">
      <slot name="content"></slot>
    </div>
    <template #footer v-if="!footerHidden">
      <span class="dialog-footer">
        <el-button type="primary" loading-icon="Eleme" :loading="confirmLoading" v-throttle="koiConfirm">{{
          confirmText || $t("button.confirm")
        }}</el-button>
        <el-button type="danger" @click="koiCancel">{{ cancelText || $t("button.cancel") }}</el-button>
      </span>
    </template>
  </el-dialog>
  <KoiShellMinimizedDock
    :visible="minimized"
    :title="title"
    :tooltip="$t('button.restoreMinimized')"
    :stack-index="dockStackIndex"
    @restore="restoreFromDock"
  />
</template>

<script setup lang="ts">
import { ref, toRefs, computed, onMounted, onUnmounted } from "vue";
import { koiMsgWarning } from "@repo/theme/koi/utils/koi.ts";
import { ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
import { useKoiWindowShell } from "@repo/theme/koi/composables/useKoiWindowShell.ts";
import KoiShellHeaderActions from "@repo/theme/koi/components/KoiWindowShell/KoiShellHeaderActions.vue";
import KoiShellMinimizedDock from "@repo/theme/koi/components/KoiWindowShell/KoiShellMinimizedDock.vue";

const { t } = useI18n();

interface IDialogProps {
  title?: string;
  visible?: boolean;
  width?: number;
  /** 距视口顶部的偏移，对应 el-dialog 的 top（如 6vh） */
  top?: string;
  /** 标题与页脚内容是否居中排版 */
  center?: boolean;
  /** 弹窗是否在视口中水平、垂直居中（对应 el-dialog 的 align-center） */
  alignCenter?: boolean;
  height?: number;
  closeOnClickModel?: boolean;
  confirmText?: string;
  cancelText?: string;
  destroyOnClose?: boolean;
  /** 打开时是否全屏（可用右上角按钮切换） */
  fullscreen?: boolean;
  loading?: boolean;
  footerHidden?: boolean;
  /** 是否显示右上角窗口壳操作区（收起 / 全屏 / 关闭） */
  showWindowShell?: boolean;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<IDialogProps>(), {
  title: "KoiDialog",
  height: 300,
  width: 650,
  top: "",
  center: true,
  alignCenter: true,
  visible: false,
  closeOnClickModel: false,
  confirmText: "",
  cancelText: "",
  destroyOnClose: false,
  fullscreen: false,
  loading: false,
  footerHidden: false,
  showWindowShell: true
});

const visible = ref(false);
const { loading, width } = toRefs(props);
const confirmLoading = ref(loading);

const {
  minimized,
  fullscreen: windowFullscreen,
  minimize,
  restoreFromDock,
  toggleFullscreen,
  clearMinimized,
  dockStackIndex
} = useKoiWindowShell(visible, () => props.fullscreen);

const dialogFullscreen = computed(() => windowFullscreen.value);

const windowWidth = ref(window.innerWidth);

const dialogWidth = computed(() => {
  if (dialogFullscreen.value) {
    return "100%";
  }
  if (windowWidth.value < 600) {
    return "90%";
  }
  if (width.value > windowWidth.value) {
    return "90%";
  }
  if (width.value > windowWidth.value * 0.95) {
    return "95%";
  }
  return width.value;
});

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

const koiOpen = () => {
  visible.value = true;
};

const koiClose = () => {
  if (!props.closeOnClickModel) {
    ElMessageBox.confirm(t("msg.closeTips"), t("msg.remind"), {
      confirmButtonText: t("button.confirm"),
      cancelButtonText: t("button.cancel"),
      type: "warning"
    })
      .then(() => {
        visible.value = false;
        clearMinimized();
        koiMsgWarning(t("msg.closed"));
      })
      .catch(() => {
        koiMsgWarning(t("msg.cancelled"));
      });
  } else {
    visible.value = false;
    clearMinimized();
  }
};

const koiQuickClose = () => {
  clearMinimized();
  visible.value = false;
};

const emits = defineEmits(["koiConfirm", "koiCancel"]);

const koiConfirm = () => {
  emits("koiConfirm");
};

const koiCancel = () => {
  emits("koiCancel");
};

defineExpose({
  koiOpen,
  koiClose,
  koiQuickClose
});
</script>

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
</style>

<style lang="scss">
.koi-dialog-shell .el-dialog__header {
  margin-right: 0;
}
</style>
