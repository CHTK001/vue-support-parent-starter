<template>
  <div class="raw-props">
    <div class="raw-props__header">
      <span class="raw-props__title">通用参数（JSON）</span>
      <el-tag type="warning" effect="plain">{{ Object.keys(parsed).length }} 项</el-tag>
    </div>

    <div class="raw-props__body">
      <el-form label-position="top" size="default">
        <el-form-item label="props（合法 JSON）">
          <el-input
            v-model="rawText"
            type="textarea"
            :rows="10"
            placeholder='{ "title": "示例" }'
            @update:model-value="onTextChange"
          />
          <div v-if="error" class="raw-props__error">{{ error }}</div>
        </el-form-item>

        <el-form-item label="v-model 绑定值">
          <el-input
            v-model="modelText"
            placeholder="任意字符串或布尔"
            @update:model-value="onModelChange"
          />
        </el-form-item>

        <el-form-item label="默认插槽（default）">
          <el-input
            v-model="slotText"
            type="textarea"
            :rows="3"
            placeholder="默认插槽文本内容"
            @update:model-value="onSlotChange"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="raw-props__tip">
      该组件未配置参数面板，可直接编辑 JSON 透传 props；
      修改后将实时刷新右侧预览与代码片段。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { TemplateState } from "../templates";

const props = defineProps<{
  componentName: string;
  state: TemplateState;
}>();

const emit = defineEmits<{
  (e: "update", state: TemplateState): void;
}>();

/** 已解析的 props 对象 */
const parsed = computed<Record<string, unknown>>(
  () => (props.state.values as Record<string, unknown>) ?? {},
);

/** JSON 文本 */
const rawText = ref("");
const error = ref<string>("");
const modelText = ref<string>(String(props.state.model ?? ""));
const slotText = ref<string>(props.state.slots.default ?? "");

/** 同步初始值 */
watch(
  () => props.state,
  (s) => {
    rawText.value = JSON.stringify(s.values ?? {}, null, 2);
    modelText.value = String(s.model ?? "");
    slotText.value = s.slots?.default ?? "";
    error.value = "";
  },
  { deep: true, immediate: true },
);

const onTextChange = (val: string) => {
  if (!val.trim()) {
    emit("update", { ...props.state, values: {} });
    error.value = "";
    return;
  }
  try {
    const obj = JSON.parse(val) as Record<string, unknown>;
    emit("update", { ...props.state, values: obj });
    error.value = "";
  } catch (e) {
    error.value = `JSON 解析失败：${(e as Error).message}`;
  }
};

const onModelChange = (val: string) => {
  emit("update", { ...props.state, model: val });
};

const onSlotChange = (val: string) => {
  emit("update", {
    ...props.state,
    slots: { ...props.state.slots, default: val },
  });
};
</script>

<style lang="scss" scoped>
.raw-props {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原 10px，取最近档 lg(12px)：参数面板属卡片层 */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}

.raw-props__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  /* 头部是「通用调试（未配置面板）」的告警语境，原米黄底改走 warning 浅色档 */
  background: linear-gradient(135deg, var(--el-color-warning-light-9) 0%, var(--el-color-warning-light-7) 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.raw-props__body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

.raw-props__error {
  margin-top: 4px;
  font-size: 12px;
  /* #f56c6c 正是 --el-color-danger */
  color: var(--el-color-danger);
}

.raw-props__tip {
  padding: 10px 16px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

/* 尊重系统「减少动态效果」偏好：本组件样式未声明 transition / animation
   （动效都在 el-form / el-input 内部），这里做显式归零兜底。 */
@media (prefers-reduced-motion: reduce) {
  .raw-props,
  .raw-props__header,
  .raw-props__body,
  .raw-props__tip {
    transition: none;
    animation: none;
  }
}
</style>