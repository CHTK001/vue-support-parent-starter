<script setup lang="ts">
/**
 * 方向对比开关（仅在方向探索阶段存在）
 *
 * <p>三个方向要能在同一份真实数据上切换着看，否则只能靠记性比较。开关固定在
 * 右下角，写 localStorage 后由页面重建外壳；选定方向后这个组件会被删掉，
 * 页面只剩一个外壳，不留「选择器」这种开发残留。</p>
 */
import type { SvcShellName } from './context'

const props = defineProps<{ modelValue: SvcShellName }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: SvcShellName): void }>()

/** 三个方向的简称与一句话说明 */
const options: Array<{ value: SvcShellName; label: string; hint: string }> = [
  { value: 'ledger', label: 'A 台账', hint: '表格式清单 + 下方工作区' },
  { value: 'rack', label: 'B 机架', hint: '三栏：清单 / 工作区 / 检查器' },
  { value: 'console', label: 'C 控制台', hint: '态势条 + 左树 + 大工作区' },
]
</script>

<template>
  <div class="ssw" role="group" aria-label="切换设计方向">
    <button
      v-for="it in options"
      :key="it.value"
      type="button"
      class="ssw-btn"
      :class="{ 'is-active': props.modelValue === it.value }"
      :aria-pressed="props.modelValue === it.value"
      :title="it.hint"
      @click="emit('update:modelValue', it.value)"
    >
      {{ it.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.ssw {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2100;
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgb(15 23 42 / 16%));
}

.ssw-btn {
  height: 26px;
  padding: 0 11px;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
}

.ssw-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.ssw-btn.is-active {
  font-weight: 600;
  color: var(--el-color-primary-foreground, #fff);
  background: var(--el-color-primary);
}
</style>
