<template>
  <!-- Tech 主题模式：使用 scifiButton -->
  <scifi-button v-if="theme === 'tech'" v-bind="scifiButtonProps" @click="handleClick">
    <slot />
  </scifi-button>

  <!-- 默认模式：使用 el-button -->
  <el-button
    v-else
    :size="size"
    :type="type"
    :plain="plain"
    :text="text"
    :bg="bg"
    :link="link"
    :round="round"
    :circle="circle"
    :loading="loading"
    :loading-icon="loadingIcon"
    :disabled="disabled"
    :icon="icon"
    :autofocus="autofocus"
    :native-type="nativeType"
    :auto-insert-space="autoInsertSpace"
    :color="color"
    :dark="dark"
    :tag="tag"
    @click="handleClick"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
/**
 * ScButton 按钮组件
 * 封装 el-button 和 scifiButton
 * @author CH
 * @since 2025-12-03
 * @version 3.0.0
 */
import { computed, PropType } from "vue";
import { ElButton } from "element-plus";

interface Props {
  /** 按钮类型 */
  type?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  /** 按钮尺寸 */
  size?: "large" | "default" | "small";
  /** 主题风格 */
  theme?: "default" | "tech";
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否朴素按钮 */
  plain?: boolean;
  /** 是否圆角按钮 */
  round?: boolean;
  /** 是否圆形按钮 */
  circle?: boolean;
  /** 是否文字按钮 */
  text?: boolean;
  /** 是否链接按钮 */
  link?: boolean;
  /** 图标 */
  icon?: string;
  /** 后置图标 */
  suffixIcon?: string;
  /** 原生 type 属性 */
  nativeType?: "button" | "submit" | "reset";
  /** 自动聚焦 */
  autofocus?: boolean;
  /** 自定义按钮颜色 */
  color?: string;
  /** 暗黑模式 */
  dark?: boolean;
  /** 自动在中文字符间插入空格 */
  autoInsertSpace?: boolean;
  /** 自定义元素标签 */
  tag?: keyof HTMLElementTagNameMap;
  /** 加载图标 */
  loadingIcon?: string;
  /** 是否显示背景色 */
  bg?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "default",
  size: "default",
  theme: "default",
  disabled: false,
  loading: false,
  plain: false,
  round: false,
  circle: false,
  text: false,
  link: false,
  icon: "",
  suffixIcon: "",
  nativeType: "button",
  autofocus: false,
  color: "",
  dark: false,
  autoInsertSpace: undefined,
  tag: "button",
  loadingIcon: "",
  bg: false
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const scifiButtonProps = computed(() => ({
  disabled: props.disabled,
  loading: props.loading
  // scifiButton 的其他属性可以根据实际 API 调整
}));

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit("click", event);
  }
};
</script>

<style lang="scss" scoped>
// 可以添加一些自定义样式来调整 scifiButton 的显示
</style>
