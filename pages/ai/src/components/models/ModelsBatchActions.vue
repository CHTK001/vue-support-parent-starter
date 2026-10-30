<template>
  <!--
    供应商多选 / 批量删除的操作组。

    <p>为什么单独拆一个组件：模型管理现在有**两个入口**（主页 /models 整页、
    配置中心 → 模型管理 内嵌块），两个入口的页头形态不同 —— 整页用 PageHeader 的
    actions 插槽，内嵌块用自己的一条操作条 —— 但这排按钮必须完全一样。
    复制两遍迟早漂移（改了一处忘了另一处），所以抽成组件，两边都引它。</p>

    <p>纯展示 + 事件：多选状态仍由 ModelsPage 持有，这里不做任何数据请求。
    按钮样式也随本组件走 —— 组件被两个入口引用，样式只能有一份来源。</p>
  -->
  <div class="mba">
    <button v-if="!multiSelect" class="mw-act" @click="emit('start')">多选</button>
    <template v-else>
      <span class="mba-count">已选 {{ selectedCount }} 个</span>
      <button class="mw-act" @click="emit('cancel')">取消</button>
      <button
        v-if="selectedCount > 0"
        class="mw-act mw-act-del"
        :disabled="deleting"
        @click="emit('remove')"
      >
        删除供应商
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 供应商批删操作组。
 *
 * @property multiSelect 是否处于多选模式
 * @property selectedCount 已选供应商数
 * @property deleting 批量删除进行中（禁用来防重复提交）
 */
defineProps<{
  multiSelect: boolean
  selectedCount: number
  deleting?: boolean
}>()

/** start: 进入多选；cancel: 退出多选；remove: 执行批量删除。 */
const emit = defineEmits<{
  start: []
  cancel: []
  remove: []
}>()
</script>

<style scoped>
.mba {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mba-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-gray);
  white-space: nowrap;
}

.mw-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  flex-shrink: 0;
  outline: none;
}
.mw-act:hover { background: var(--color-surface-border); }
.mw-act:disabled { opacity: 0.5; cursor: not-allowed; }
.mw-act + .mw-act { margin-left: 0; }
.mw-act-del {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, var(--color-surface-border));
}
.mw-act-del:hover {
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

/* 键盘焦点可见性：这排按钮是全站同一套操作，补一个与其它按钮体系一致的主色环 */
.mw-act:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 动效降级：只关本组件自己的按钮过渡 */
@media (prefers-reduced-motion: reduce) {
  .mw-act { transition: none; }
}
</style>
