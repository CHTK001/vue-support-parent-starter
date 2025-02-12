<template>
  <el-dialog v-model="visible" :title="title" :width="width" :fullscreen="isFullscreen" :modal="modal"
    :lock-scroll="lockScroll" :close-on-click-modal="closeOnClickModal" :close-on-press-escape="closeOnPressEscape"
    :show-close="false" :before-close="handleBeforeClose" :destroy-on-close="destroyOnClose" :draggable="draggable"
    :append-to-body="appendToBody" :custom-class="customClass" @open="handleOpen" @opened="handleOpened"
    @close="handleClose" @closed="handleClosed" @fullscreen-change="handleFullscreenChange" class="custom-dialog">
    <template #header>
      <div class="dialog-header">
        <span>{{ title }}</span>
        <div class="header-buttons">
          <el-icon v-if="minimizable" class="header-button">
            <component :is="useRenderIcon('ep:minus')" @click="minimizeDialog" />
          </el-icon>
          <el-icon v-if="fullscreenable" class="header-button">
            <component :is="useRenderIcon('ep:full-screen')" @click="toggleFullscreen" />
          </el-icon>
          <el-icon v-if="showClose" class="header-button">
            <component :is="useRenderIcon('ep:close')" @click="handleClose" />
          </el-icon>
        </div>
      </div>
    </template>

    <div class="dialog-content">
      <slot></slot>
    </div>

    <template v-if="showFooter" #footer>
    </template>
  </el-dialog>

  <!-- 最小化时显示的悬浮按钮 -->
  <div v-if="isMinimized" class="minimized-dialog" @click="restoreDialog">
    <span>{{ title }}</span>
  </div>
</template>

<script>
import { useRenderIcon } from "../ReIcon/src/hooks";

export default {
  props: {
    modelValue: Boolean,
    title: String,
    width: String,
    fullscreenable: { type: Boolean, default: false },
    fullscreen: { type: Boolean, default: false },
    modal: { type: Boolean, default: true },
    lockScroll: { type: Boolean, default: true },
    closeOnClickModal: { type: Boolean, default: true },
    closeOnPressEscape: { type: Boolean, default: true },
    beforeClose: Function,
    destroyOnClose: { type: Boolean, default: false },
    showClose: { type: Boolean, default: true },
    appendToBody: { type: Boolean, default: false },
    customClass: String,
    draggable: { type: Boolean, default: false },
    minimizable: { type: Boolean, default: false },
    showFooter: { type: Boolean, default: true },
  },
  data() {
    return {
      isFullscreen: false,
      visible: false,
      isMinimized: false,
    };
  },
  watch: {
    modelValue: {
      handler(newVal) {
        this.visible = newVal;
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    useRenderIcon,
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
    },
    handleConfirm() {
      this.$emit('confirm');
      this.visible = false;
    },
    handleCancel() {
      this.$emit('cancel');
      this.visible = false;
    },
    handleOpen() {
      this.$emit('open');
    },
    handleOpened() {
      this.$emit('opened');
    },
    handleClose() {
      this.$emit('close');
    },
    handleClosed() {
      this.$emit('closed');
    },
    handleFullscreenChange(fullscreen) {
      this.$emit('fullscreen-change', fullscreen);
    },
    minimizeDialog() {
      this.isMinimized = true;
      this.visible = false; // 隐藏对话框
    },
    restoreDialog() {
      this.isMinimized = false;
      this.visible = true; // 恢复对话框
    },
    handleBeforeClose(done) {
      if (this.beforeClose) {
        this.beforeClose(done);
      } else {
        done();
      }
    },
  },
};
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.dialog-content {
  padding: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.minimized-dialog {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  z-index: 2000;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.minimized-dialog span {
  font-size: 14px;
  color: #606266;
}

.custom-dialog .el-dialog__headerbtn {
  width: 24px !important;
  height: 24px !important;
  padding: 6px;
}

.header-button {
  cursor: pointer;
}

.right-24 {
  right: 24px;
}

.right-48 {
  right: 48px;
}

.right-96 {
  right: 96px;
}
</style>