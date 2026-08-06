<script setup lang="ts">
/**
 * ReCron —— Cron 表达式选择组件
 *
 * 封装 el-popover + 内置 cron 面板，提供 layout 切换：
 *   <ReCron layout="card" v-model="cron" />            // rin-card 风格
 *   <ReCron layout="default" v-model="cron" />          // 默认 element 风格
 *
 * cron 表达式格式：
 *   - 5 字段：分 时 日 月 周                ("0 0 12 * * ?")
 *   - 6 字段：秒 分 时 日 月 周            ("0 0 0 12 * * ?")
 */
import { defineAsyncComponent } from "vue";
import { ElPopover } from "element-plus";

defineOptions({ name: "ReCron", inheritAttrs: true });

const CardLayout = defineAsyncComponent(() => import("./layouts/CardReCron.vue"));

const model = defineModel<string>({ default: "" });

withDefaults(
  defineProps<{
    /** 布局变体：default（默认 element 风格）/ card（rin-card 卡片风格） */
    layout?: "default" | "card";
    /** cron 字段数：5（默认）= 分 时 日 月 周；6 = 秒 分 时 日 月 周 */
    fields?: 5 | 6;
    /** 触发栏占位符 */
    placeholder?: string;
    /** 禁用 */
    disabled?: boolean;
    /** 触发栏宽度 */
    width?: string | number;
  }>(),
  {
    layout: "default",
    fields: 5,
    placeholder: "请选择 cron 表达式",
    disabled: false,
    width: undefined,
  },
);
</script>

<template>
  <!-- card 布局：rin-card 风格面板（异步加载） -->
  <CardLayout
    v-if="layout === 'card'"
    v-model="model"
    v-bind="$attrs"
    :fields="fields"
    :placeholder="placeholder"
    :disabled="disabled"
    :width="width"
  >
    <slot />
  </CardLayout>

  <!-- default 布局：el-popover + 默认 cron 面板 -->
  <ElPopover
    v-else
    v-bind="$attrs"
    trigger="click"
    placement="bottom-start"
    :width="480"
    :disabled="disabled"
  >
    <template #reference>
      <div
        :class="[
          'recron-default',
          { 'is-disabled': disabled, 'is-empty': !model },
        ]"
        :style="width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined"
      >
        <span v-if="model" class="recron-default__value">{{ model }}</span>
        <span v-else class="recron-default__placeholder">{{ placeholder }}</span>
      </div>
    </template>
    <div class="recron-default-panel">
      <slot :model-value="model" :update="(v: string) => (model = v)">
        <pre class="recron-default-panel__hint">默认布局：可传入 #default="{ modelValue, update }" 自定义面板</pre>
      </slot>
    </div>
  </ElPopover>
</template>

<style scoped lang="scss">
.recron-default {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  background-color: var(--el-fill-color-blank, #ffffff);
  cursor: pointer;
  user-select: none;
  transition: border-color 0.2s ease;

  &:hover:not(.is-disabled) {
    border-color: var(--el-border-color-hover, #c0c4cc);
  }

  &.is-disabled {
    background-color: var(--el-fill-color-light, #f5f7fa);
    color: var(--el-text-color-placeholder, #a8abb2);
    cursor: not-allowed;
  }
}

.recron-default__value {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  color: var(--el-text-color-primary, #303133);
}

.recron-default__placeholder {
  font-size: 13px;
  color: var(--el-text-color-placeholder, #a8abb2);
}

.recron-default-panel {
  padding: 4px 0;
}

.recron-default-panel__hint {
  margin: 0;
  padding: 12px;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  background-color: var(--el-fill-color-light, #f5f7fa);
  border-radius: 4px;
}
</style>