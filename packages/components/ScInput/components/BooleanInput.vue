<template>
  <div>
    <el-segmented v-model="currentValue" :options="options" class="sc-boolean-input" v-bind="$attrs" @update:modelValue="handleUpdate" @change="handleChange" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: boolean;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 输入框尺寸
   */
  size?: "large" | "default" | "small";
  /**
   * 真值文本
   */
  trueLabel?: string;
  /**
   * 假值文本
   */
  falseLabel?: string;
  /**
   * 是否占满父容器宽度
   */
  block?: boolean;
  /**
   * 激活状态颜色
   */
  activeColor?: string;
  /**
   * 未激活状态颜色
   */
  inactiveColor?: string;
  /**
   * 前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
}

const { t } = useI18n();

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  size: "default",
  trueLabel: "",
  falseLabel: "",
  block: false,
  activeColor: "",
  inactiveColor: "",
  prefixIcon: "",
  showPrefix: true
});

const emit = defineEmits(["update:modelValue", "change", "focus", "blur"]);

// 获取真假值的显示文本
const trueText = computed(() => props.trueLabel || t("buttons.open"));
const falseText = computed(() => props.falseLabel || t("buttons.close"));

// 选项列表
const options = computed(() => [
  { label: trueText.value, value: true },
  { label: falseText.value, value: false }
]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

/**
 * 处理值更新事件
 */
const handleUpdate = (value: boolean) => {
  emit("update:modelValue", value);
};

/**
 * 处理change事件
 */
const handleChange = (value: boolean) => {
  emit("change", value);
};

/**
 * 对外暴露方法
 */
defineExpose({
  focus: () => emit("focus"),
  blur: () => emit("blur")
});
</script>

<style lang="scss" scoped></style>
