<template>
  <header class="editor-toolbar">
    <div class="editor-toolbar__left">
      <button
        class="tb-btn tb-btn--fold"
        :title="showPalette ? '折叠组件库' : '展开组件库'"
        @click="$emit('togglePalette')"
      >
        <IconifyIconOffline :icon="showPalette ? 'ep:folder-opened' : 'ep:folder'" />
      </button>
      <IconifyIconOffline icon="ep:edit" class="editor-toolbar__icon" />
      <input
        class="editor-toolbar__name"
        :value="projectName"
        @input="onNameChange"
      />
    </div>

    <div class="editor-toolbar__center">
      <!-- 模式切换 -->
      <div class="toolbar__mode-toggle">
        <button
          class="toggle-btn"
          :class="{ active: isEdit }"
          @click="$emit('switchMode', 'edit')"
        >
          <IconifyIconOffline icon="ep:edit" />
          编辑
        </button>
        <button
          class="toggle-btn"
          :class="{ active: !isEdit }"
          @click="$emit('switchMode', 'preview')"
        >
          <IconifyIconOffline icon="ep:view" />
          预览
        </button>
      </div>

      <!-- 缩放控制 -->
      <div class="toolbar__zoom">
        <button class="tb-btn" title="缩小" @click="$emit('zoomOut')">
          <IconifyIconOffline icon="ep:minus" />
        </button>
        <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
        <button class="tb-btn" title="放大" @click="$emit('zoomIn')">
          <IconifyIconOffline icon="ep:plus" />
        </button>
        <button class="tb-btn" title="适应" @click="$emit('zoomFit')">
          <IconifyIconOffline icon="ep:full-screen" />
        </button>
      </div>
    </div>

    <div class="editor-toolbar__right">
      <button
        class="tb-btn tb-btn--fold"
        :title="showConfigPanel ? '折叠属性面板' : '展开属性面板'"
        @click="$emit('toggleConfigPanel')"
      >
        <IconifyIconOffline icon="ep:setting" />
      </button>
      <button class="tb-btn tb-btn--save" :disabled="!isDirty" @click="$emit('save')">
        <IconifyIconOffline icon="ep:check" /> 保存
      </button>
      <button class="tb-btn" @click="$emit('clear')">
        <IconifyIconOffline icon="ep:delete" /> 清空
      </button>
      <button class="tb-btn" @click="onFullscreen">
        <IconifyIconOffline icon="ep:full-screen" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  projectName: string;
  isEdit: boolean;
  isDirty: boolean;
  zoom: number;
  showPalette: boolean;
  showConfigPanel: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  nameChange: [name: string];
  switchMode: [mode: "edit" | "preview"];
  zoomIn: [];
  zoomOut: [];
  zoomFit: [];
  save: [];
  clear: [];
  togglePalette: [];
  toggleConfigPanel: [];
}>();

function onNameChange(e: Event) {
  emit("nameChange", (e.target as HTMLInputElement).value);
}

function onFullscreen() {
  document.documentElement.requestFullscreen?.();
}
</script>

<style lang="scss" scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 14px;
  background: rgba(5, 15, 30, 0.95);
  border-bottom: 1px solid rgba(0, 246, 255, 0.15);
  user-select: none;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    font-size: 16px;
    color: rgba(0, 246, 255, 0.7);
  }

  &__name {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 3px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 600;
    padding: 2px 6px;
    outline: none;
    width: 140px;

    &:focus {
      border-color: rgba(0, 246, 255, 0.25);
      background: rgba(0, 20, 40, 0.4);
    }
  }

  &__center {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 6px;
  }
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

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    background: rgba(0, 246, 255, 0.1);
    border-color: rgba(0, 246, 255, 0.5);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--save {
    background: rgba(0, 246, 255, 0.12);
    border-color: rgba(0, 246, 255, 0.3);
    color: #00f6ff;

    &:hover:not(:disabled) {
      background: rgba(0, 246, 255, 0.25);
    }
  }
}
</style>
