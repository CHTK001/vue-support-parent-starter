<script setup lang="ts">
/**
 * ReTag koi 主题 —— 标签组件（KoiTag 移植）
 *
 * 当选项带 dictClass 时渲染为自定义 class 的 div 标签；
 * 否则回退到 el-tag。样式走主题令牌（--theme-* 变量）。
 */
import { computed } from "vue";
import { ElTag } from "element-plus";

defineOptions({ name: "ReTag", inheritAttrs: true });

interface TagOption {
  /** 字典值 */
  dictValue: string | number;
  /** 展示文案 */
  dictLabel: string;
  /** el-tag 类型 */
  dictTag?: "primary" | "success" | "warning" | "info" | "danger";
  /** 自定义 div 标签的 class */
  dictClass?: string;
}

const props = withDefaults(
  defineProps<{
    tagOptions?: TagOption[];
    value?: string | number;
    size?: "large" | "default" | "small";
    effect?: "dark" | "light" | "plain";
    round?: boolean;
    disableTransitions?: boolean;
  }>(),
  {
    tagOptions: () => [],
    value: "",
    size: "default",
    effect: "light",
    round: false,
    disableTransitions: true,
  },
);

/** 当前命中的选项 */
const matched = computed(() =>
  props.tagOptions.find(
    (o) =>
      props.value != null &&
      String(props.value) === String(o.dictValue),
  ),
);
</script>

<template>
  <span class="koi-tag">
    <!-- 带 dictClass 时使用自定义 div 标签 -->
    <div
      v-if="matched?.dictClass"
      class="koi-tag__custom"
      :class="matched.dictClass"
    >
      {{ matched.dictLabel || "ERROR" }}
    </div>

    <!-- 无 dictClass 时回退 el-tag -->
    <ElTag
      v-else-if="matched"
      :disable-transitions="disableTransitions"
      :type="matched.dictTag"
      :effect="effect"
      :size="size"
      :round="round"
    >
      {{ matched.dictLabel || "ERROR" }}
    </ElTag>
  </span>
</template>

<style scoped lang="scss">
.koi-tag {
  &__custom {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 10px;
    height: 24px;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    cursor: default;
    border-radius: 4px;
    outline: none;
    transition: all 0.3s;

    &:focus {
      outline: none;
    }
  }
}
</style>
