<template>
  <header class="bigscreen-toolbar">
    <div class="toolbar__left">
      <!-- 大屏标题 -->
      <div class="toolbar__project-name">
        <IconifyIconOffline icon="ep:monitor" />
        <span>{{ projectName }}</span>
      </div>
    </div>

    <div class="toolbar__center">
      <!-- 模式切换 -->
      <div class="toolbar__mode-toggle">
        <button
          class="toggle-btn"
          :class="{ active: isEdit }"
          @click="switchMode('edit')"
        >
          <IconifyIconOffline icon="ep:edit" />
          编辑
        </button>
        <button
          class="toggle-btn"
          :class="{ active: !isEdit }"
          @click="switchMode('preview')"
        >
          <IconifyIconOffline icon="ep:view" />
          预览
        </button>
      </div>

      <!-- 缩放控制 -->
      <div class="toolbar__zoom">
        <button class="toolbar-btn" title="缩小" @click="$emit('zoomOut')">
          <IconifyIconOffline icon="ep:minus" />
        </button>
        <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
        <button class="toolbar-btn" title="放大" @click="$emit('zoomIn')">
          <IconifyIconOffline icon="ep:plus" />
        </button>
        <button class="toolbar-btn" title="重置" @click="$emit('zoomReset')">
          <IconifyIconOffline icon="ep:full-screen" />
        </button>
      </div>
    </div>

    <div class="toolbar__right">
      <!-- 保存 -->
      <button
        class="toolbar-btn toolbar-btn--primary"
        :disabled="!isDirty"
        @click="$emit('save')"
      >
        <IconifyIconOffline icon="ep:check" />
        保存
      </button>

      <!-- 清除 -->
      <button
        class="toolbar-btn toolbar-btn--danger"
        @click="$emit('clear')"
      >
        <IconifyIconOffline icon="ep:delete" />
        清空
      </button>

      <!-- 全屏 -->
      <button class="toolbar-btn" @click="$emit('fullscreen')">
        <IconifyIconOffline icon="ep:full-screen" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  projectName: string;
  isEdit: boolean;
  isDirty: boolean;
  zoom: number;
}>();

const emit = defineEmits<{
  switchMode: [mode: "edit" | "preview"];
  zoomIn: [];
  zoomOut: [];
  zoomReset: [];
  save: [];
  clear: [];
  fullscreen: [];
}>();

function switchMode(mode: "edit" | "preview") {
  emit("switchMode", mode);
}
</script>

<style lang="scss" scoped>
.bigscreen-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: rgba(5, 15, 30, 0.95);
  border-bottom: 1px solid rgba(0, 246, 255, 0.2);
  user-select: none;
  flex-shrink: 0;
}

.toolbar__left,
.toolbar__center,
.toolbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar__project-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(0, 246, 255, 0.9);
  font-size: 15px;
  font-weight: 600;
}

.toolbar__mode-toggle {
  display: flex;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;

  .toggle-btn {
    padding: 4px 14px;
    font-size: 13px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 4px;

    &.active {
      background: rgba(0, 246, 255, 0.15);
      color: #00f6ff;
    }

    &:hover:not(.active) {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.toolbar__zoom {
  display: flex;
  align-items: center;
  gap: 4px;

  .zoom-level {
    min-width: 48px;
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-family: "JetBrains Mono", monospace;
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 13px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(0, 246, 255, 0.1);
    border-color: rgba(0, 246, 255, 0.5);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--primary {
    background: rgba(0, 246, 255, 0.15);
    border-color: rgba(0, 246, 255, 0.4);
    color: #00f6ff;

    &:hover:not(:disabled) {
      background: rgba(0, 246, 255, 0.25);
    }
  }

  &--danger {
    &:hover {
      background: rgba(255, 50, 50, 0.2);
      border-color: rgba(255, 50, 50, 0.5);
      color: #ff6b6b;
    }
  }
}
</style>
