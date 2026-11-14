<script setup lang="ts">
/**
 * 第 1 步：导入类型。
 *
 * <p>只有两个选项，直接摊开写清楚差异，不放任何图形示意 —— 用户在这一步要判断的
 * 只是「手上这个文件是 CSV 还是 Excel」。</p>
 */
import WizardStepHead from "../wizard/WizardStepHead.vue";
import { IMPORT_TYPES, type ImportWizardCtx } from "./useImportWizard";

defineProps<{
  /** 向导控制器 */
  ctx: ImportWizardCtx;
}>();
</script>

<template>
  <section class="wz-pane">
    <WizardStepHead
      title="导入类型"
      desc="选择数据来源的格式。Excel 可以一次导入多张工作表，CSV 只读一个文件。"
    >
      <template #meta>步骤 1 / 7</template>
    </WizardStepHead>

    <div class="wz-types">
      <div
        v-for="t in IMPORT_TYPES"
        :key="t.value"
        class="wz-type"
        :class="{ 'is-on': ctx.type === t.value }"
        :data-testid="`iw-type-${t.value}`"
        @click="ctx.type = t.value"
      >
        <el-radio :model-value="ctx.type" :value="t.value">{{ t.label }}</el-radio>
        <span class="wz-type-hint">{{ t.hint }}</span>
      </div>
    </div>

    <p v-if="!ctx.excelAvailable" class="wz-note is-warn">
      当前后端实例未装配 Excel 解析能力（classpath 缺少 Apache POI），只能导入 CSV。
    </p>
  </section>
</template>

<style scoped>
.wz-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.wz-types {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wz-type {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.wz-type:hover {
  border-color: var(--el-color-primary-light-5);
}
.wz-type.is-on {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.wz-type :deep(.el-radio) {
  height: auto;
  margin-right: 0;
}
.wz-type :deep(.el-radio__label) {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.wz-type-hint {
  display: block;
  padding-left: 22px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.wz-note {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--el-radius-md);
  font-size: 12px;
  line-height: 1.6;
}
.wz-note.is-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
}
</style>
