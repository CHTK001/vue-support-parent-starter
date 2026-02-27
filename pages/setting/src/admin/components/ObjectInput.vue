<template>
  <div class="sc-object-input">
    <ScInput v-model="jsonString" type="textarea" :rows="rows" :disabled="disabled" :placeholder="placeholder" @blur="validateAndUpdate" class="object-textarea" />

    <div class="object-error" v-if="error">
      {{ error }}
    </div>

    <div class="object-actions" v-if="!disabled">
      <ScButton type="primary" plain size="small" @click="formatJson" :disabled="!isValidJson">
        <IconifyIconOnline icon="ep:magic-stick" />
        格式化JSON
      </ScButton>

      <ScButton type="info" plain size="small" @click="compactJson" :disabled="!isValidJson">
        <IconifyIconOnline icon="ep:compress" />
        压缩JSON
      </ScButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "@repo/utils";

/**
 * 组件属性定义
 */
interface Props {
  modelValue: string; // 绑定值
  disabled?: boolean; // 是否禁用
  placeholder?: string; // 占位文本
  rows?: number; // 文本域行数
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "{}",
  disabled: false,
  placeholder: "请输入JSON对象",
  rows: 8,
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 错误信息
 */
const error = ref("");

/**
 * JSON字符串，用于编辑
 */
const jsonString = ref(props.modelValue);

/**
 * 监听modelValue变化，更新jsonString
 */
watch(
  () => props.modelValue,
  (val) => {
    jsonString.value = val;
    validateJson(val);
  }
);

/**
 * 是否为有效的JSON
 */
const isValidJson = computed(() => {
  try {
    JSON.parse(jsonString.value);
    return true;
  } catch (e) {
    return false;
  }
});

/**
 * 验证JSON格式
 */
const validateJson = (value: string) => {
  try {
    JSON.parse(value);
    error.value = "";
    return true;
  } catch (e) {
    error.value = "输入内容不是有效的JSON格式";
    return false;
  }
};

/**
 * 验证并更新值
 */
const validateAndUpdate = () => {
  if (validateJson(jsonString.value)) {
    emit("update:modelValue", jsonString.value);
  }
};

/**
 * 格式化JSON
 */
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonString.value);
    const formatted = JSON.stringify(parsed, null, 2);
    jsonString.value = formatted;
    emit("update:modelValue", formatted);
    message("JSON已格式化", { type: "success" });
  } catch (e) {
    error.value = "格式化失败，请检查JSON格式";
  }
};

/**
 * 压缩JSON
 */
const compactJson = () => {
  try {
    const parsed = JSON.parse(jsonString.value);
    const compact = JSON.stringify(parsed);
    jsonString.value = compact;
    emit("update:modelValue", compact);
    message("JSON已压缩", { type: "success" });
  } catch (e) {
    error.value = "压缩失败，请检查JSON格式";
  }
};
</script>

<style lang="scss">
.sc-object-input {
  .object-textarea {
    font-family: monospace;

    .el-textarea__inner {
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
      }

      &:focus {
        box-shadow: 0 0 0 1px var(--el-color-primary);
      }
    }
  }

  .object-error {
    margin-top: 8px;
    color: var(--el-color-danger);
    font-size: 12px;
  }

  .object-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;

    .el-button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}
</style>
