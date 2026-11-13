<template>
  <div class="home-layout-toolbar">
    <button
      v-if="!editMode"
      type="button"
      class="home-layout-toolbar__btn"
      title="进入自定义布局"
      aria-label="自定义布局"
      @click="emit('enter-edit')"
    >
      <span class="home-layout-toolbar__icon">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path d="M3 3h7v2H5v5H3V3zm0 11h2v3h7v-2H3v-1zm14-11h-7v2h5v5h2V3zm0 11h-2v3h-7v-2h5v-5h2v3h2v1z" />
          <path d="M7 7h6v6H7V7zm1 1v4h4V8H8z" />
        </svg>
      </span>
      <span class="home-layout-toolbar__label">自定义布局</span>
    </button>

    <template v-else>
      <button
        type="button"
        class="home-layout-toolbar__btn home-layout-toolbar__btn--reset"
        title="恢复默认布局（清空所有组件）"
        aria-label="恢复默认"
        @click="emit('reset')"
      >
        <span class="home-layout-toolbar__icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M10 4a6 6 0 1 0 5.66 8H14.5a4.5 4.5 0 1 1-4.5-4.5V10l4-3.5L10 3v1z" />
          </svg>
        </span>
        <span class="home-layout-toolbar__label">恢复默认</span>
      </button>

      <button
        type="button"
        class="home-layout-toolbar__btn"
        title="放弃本次编辑"
        aria-label="取消"
        @click="emit('cancel')"
      >
        <span class="home-layout-toolbar__icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M5.3 5.3 10 10l4.7-4.7 1.4 1.4L11.4 11.4l4.7 4.7-1.4 1.4-4.7-4.7-4.7 4.7-1.4-1.4 4.7-4.7-4.7-4.7z" />
          </svg>
        </span>
        <span class="home-layout-toolbar__label">取消</span>
      </button>

      <button
        type="button"
        class="home-layout-toolbar__btn home-layout-toolbar__btn--save"
        title="保存布局"
        aria-label="保存"
        @click="emit('save')"
      >
        <span class="home-layout-toolbar__icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M17 5H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-2-2zm-1 10H4V7h10v2H6v2h8V7h.59L17 8.41V15zM6 9h8V7H6v2z" />
            <path d="M16 16H4v-2h12v2zM6 11h8v2H6v-2z" opacity=".4" />
          </svg>
        </span>
        <span class="home-layout-toolbar__label">保存</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts" name="HomeLayoutToolbar">
/**
 * 主页布局工具栏按钮
 *
 * - 视图模式：显示「自定义布局」按钮（点击进入编辑模式）
 * - 编辑模式：显示「恢复默认 / 取消 / 保存」三个按钮
 *
 * <p>编辑期有 800ms 防抖自动保存，所以「取消」不是简单退出：父组件会先回滚到
 * 进入编辑时的快照再退出，否则用户点了取消、刷新后改动还在。</p>
 */
defineProps<{ editMode: boolean }>();
const emit = defineEmits<{
  (e: "enter-edit"): void;
  (e: "save"): void;
  (e: "cancel"): void;
  (e: "reset"): void;
}>();
</script>

<style lang="scss" scoped>
.home-layout-toolbar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.home-layout-toolbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: auto;
  align-self: center;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
}

.home-layout-toolbar__btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-blank));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.home-layout-toolbar__btn:active {
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-fill-color-blank));
}

.home-layout-toolbar__btn--reset {
  color: var(--el-color-warning);
  border-color: color-mix(in srgb, var(--el-color-warning) 40%, var(--el-border-color-lighter));
}

.home-layout-toolbar__btn--reset:hover {
  color: var(--el-color-warning);
  border-color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 6%, var(--el-fill-color-blank));
}

.home-layout-toolbar__btn--save {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white, #fff);
}.home-layout-toolbar__btn--save:hover {
  background: color-mix(in srgb, var(--el-color-primary) 88%, white);
  color: var(--el-color-white, #fff);
  border-color: var(--el-color-primary);
}

.home-layout-toolbar__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.home-layout-toolbar__label {
  letter-spacing: 0.02em;
}
</style>
