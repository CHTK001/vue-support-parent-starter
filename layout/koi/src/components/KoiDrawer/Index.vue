<template>
  <div>
    <!-- append-to-body：避免渐变布局等 overflow:hidden 裁剪；不写死 z-index，便于 ElMessageBox 等同栈后进层叠在上 -->
    <el-drawer
      :class="['koi-drawer-shell', drawerClass]"
      v-model="visible"
      :title="title"
      :size="mergedDrawerSize"
      :direction="direction"
      :close-on-click-modal="closeOnClickModel"
      :destroy-on-close="destroyOnClose"
      :before-close="koiClose"
      :loading="loading"
      :footerHidden="footerHidden"
      :show-close="!showWindowShell"
      :lock-scroll="lockScroll"
      :modal-class="modalClass"
      append-to-body
    >
      <template v-if="showWindowShell" #header="{ titleId, titleClass }">
        <div class="koi-drawer-custom-header">
          <span :id="titleId" :class="titleClass">{{ title }}</span>
          <KoiShellHeaderActions
            :is-fullscreen="windowFullscreen"
            :enabled="visible"
            @minimize="minimize"
            @toggle-fullscreen="toggleFullscreen"
            @close="koiClose"
          />
        </div>
      </template>
      <div class="formDrawer">
        <div class="body">
          <slot name="content"></slot>
        </div>
        <div class="footer" v-if="!footerHidden">
          <el-button type="primary" loading-icon="Eleme" :loading="confirmLoading" v-throttle="koiConfirm">{{
            confirmText || $t("button.confirm")
          }}</el-button>
          <el-button type="danger" @click="koiCancel">{{ cancelText || $t("button.cancel") }}</el-button>
        </div>
      </div>
    </el-drawer>
    <KoiShellMinimizedDock
      :visible="minimized"
      :title="title"
      :tooltip="$t('button.restoreMinimized')"
      :stack-index="dockStackIndex"
      @restore="restoreFromDock"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs, computed, onMounted, onUnmounted } from "vue";
import { koiMsgWarning } from "../../utils/koi.ts";
import { ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
import { useKoiWindowShell } from "../../composables/useKoiWindowShell.ts";
import KoiShellHeaderActions from "../../components/KoiWindowShell/KoiShellHeaderActions.vue";
import KoiShellMinimizedDock from "../../components/KoiWindowShell/KoiShellMinimizedDock.vue";

const { t } = useI18n();

// 定义参数的类型
interface IDrawerProps {
  title?: string;
  visible?: boolean;
  size?: number | string;
  destroyOnClose?: boolean;
  closeOnClickModel?: boolean;
  confirmText?: string;
  cancelText?: string;
  direction?: any;
  loading?: boolean;
  /** 是否隐藏底部确认/取消按钮 */
  footerHidden?: boolean; 
  /** 是否显示右上角窗口壳操作区（收起 / 全屏 / 关闭，样式对齐 KoiToolbar） */
  showWindowShell?: boolean;
  /** 打开时是否锁定 body 滚动（部分场景会引发主布局宽度抖动） */
  lockScroll?: boolean;
  /** 遮罩层自定义 class */
  modalClass?: string;
  /** 抽屉面板自定义 class（与 koi-drawer-shell 并存） */
  drawerClass?: string;
}

const props = withDefaults(defineProps<IDrawerProps>(), {
  title: "KoiDrawer",
  visible: false,
  size: "450",
  closeOnClickModel: false,
  destroyOnClose: false,
  confirmText: "",
  cancelText: "",
  direction: "rtl",
  loading: false,
  footerHidden: false,
  showWindowShell: true,
  lockScroll: true,
  modalClass: "",
  drawerClass: ""
});

const visible = ref(false);
const { loading } = toRefs(props);
const confirmLoading = ref(loading);

const {
  minimized,
  fullscreen: windowFullscreen,
  minimize,
  restoreFromDock,
  toggleFullscreen,
  clearMinimized,
  dockStackIndex
} = useKoiWindowShell(visible);

const windowWidth = ref(window.innerWidth);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const baseDrawerSize = computed(() => {
  const sizeValue = parseFloat(String(props.size));
  const isHorizontal = props.direction === "ltr" || props.direction === "rtl";

  if (isHorizontal) {
    if (windowWidth.value < 600) {
      return "86%";
    }
    if (sizeValue > windowWidth.value) {
      return "86%";
    }
    if (sizeValue > windowWidth.value * 0.9) {
      return "90%";
    }
  } else {
    if (windowWidth.value < 600) {
      return "60%";
    }
  }
  return props.size;
});

const mergedDrawerSize = computed(() => {
  if (windowFullscreen.value) {
    return "100%";
  }
  return baseDrawerSize.value;
});

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

/** 打开抽屉 */
const koiOpen = () => {
  visible.value = true;
};

/** 关闭抽屉 */
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

/** 确认提交后关闭抽屉 */
const koiQuickClose = () => {
  clearMinimized();
  visible.value = false;
};

/** 确认 */
const koiConfirm = () => {
  emits("koiConfirm");
};

const koiCancel = () => {
  emits("koiCancel");
};

const emits = defineEmits(["koiConfirm", "koiCancel"]);

defineExpose({
  koiOpen,
  koiClose,
  koiQuickClose
});
</script>

<style lang="scss" scoped>
.koi-drawer-custom-header {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;

  > span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.formDrawer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .body {
    bottom: 50px;
    flex: 1;
    padding-right: 8px;
    overflow-y: auto;
    @apply text-14px text-#303133 dark:text-#E5EAF3;
  }

  .footer {
    display: flex;
    align-items: center;
    height: 50px;
    margin-top: auto;
  }
}

:deep(.el-drawer__title) {
  @apply text-#303133 dark:text-#CFD3DC;
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
