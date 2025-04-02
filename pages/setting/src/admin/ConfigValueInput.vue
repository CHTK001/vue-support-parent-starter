<template>
  <div class="sc-config-value-input">
    <!-- 根据类型选择不同的输入组件 -->
    <component :is="getComponentByType(type)" v-model="innerValue" v-bind="$attrs" :disabled="disabled" :placeholder="placeholder || getPlaceholderByType(type)" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import StringInput from "./components/StringInput.vue";
import NumberInput from "./components/NumberInput.vue";
import BooleanToggle from "./components/BooleanToggle.vue";
import ArrayInput from "./components/ArrayInput.vue";
import TextAreaInput from "./components/TextAreaInput.vue";
import DictInput from "./components/DictInput.vue";
import ColorPicker from "./components/ColorPicker.vue";
import MailInput from "./components/MailInput.vue";
import PasswordInput from "./components/PasswordInput.vue";
import SecretInput from "./components/SecretInput.vue";
import ObjectInput from "./components/ObjectInput.vue";

/**
 * 组件属性定义
 */
const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Array, Object],
    default: "",
  },
  type: {
    type: String,
    default: "String",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "",
  },
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 内部值，用于双向绑定
 */
const innerValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

/**
 * 根据类型获取对应的组件
 * @param {string} type - 配置类型
 * @returns {Component} - 对应的输入组件
 */
const getComponentByType = (type) => {
  // 类型到组件的映射关系
  const componentMap = {
    String: StringInput,
    Number: NumberInput,
    Boolean: BooleanToggle,
    Array: ArrayInput,
    TextArea: TextAreaInput,
    Dict: DictInput,
    Color: ColorPicker,
    Mail: MailInput,
    Password: PasswordInput,
    AppSecret: SecretInput,
    Object: ObjectInput,
  };

  // 返回对应组件，如果没有则返回默认的字符串输入组件
  return componentMap[type] || StringInput;
};

/**
 * 根据类型获取占位文本
 * @param {string} type - 配置类型
 * @returns {string} - 占位文本
 */
const getPlaceholderByType = (type) => {
  // 类型到占位文本的映射关系
  const placeholderMap = {
    String: "请输入字符串",
    Number: "请输入数字",
    Boolean: "",
    Array: '请输入数组，如: ["item1", "item2"]',
    TextArea: "请输入文本内容",
    Dict: "请输入字典数据",
    Color: "请选择颜色",
    Mail: "请输入邮件配置",
    Password: "请输入密码",
    AppSecret: "请输入密钥",
    Object: "请输入JSON对象",
  };

  // 返回对应占位文本，如果没有则返回空字符串
  return placeholderMap[type] || "";
};
</script>

<style lang="scss">
.sc-config-value-input {
  width: 100%;
}
</style>
