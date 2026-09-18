<script setup lang="ts">
/**
 * ReTag koi 主题 —— 标签组件（KoiTag 移植）
 *
 * 契约必须与 default 主题对齐（ReTag 是按主题切换的组件，调用方代码不变）：
 *   <ReTag :type="'success'">{{ text }}</ReTag>
 *   <ReTag :value="1" :map="{ 1: { label: '启用', type: 'success' } }" />
 * koi 额外支持字典直出：tagOptions + value，命中 dictClass 时渲染自定义 div。
 *
 * 注意：早期实现只渲染 `matched` 命中的分支且**没有兜底分支**，
 * 导致全仓（server/system/project 等）所有按 default 契约书写的标签
 * 在 koi 主题下渲染为空白标签（内容与 type 全部丢失）。
 */
import { computed } from "vue";
import { ElTag } from "element-plus";

defineOptions({ name: "ReTag", inheritAttrs: false });

type TagType = "primary" | "success" | "warning" | "info" | "danger";

interface TagOption {
  /** 字典值 */
  dictValue: string | number;
  /** 展示文案 */
  dictLabel: string;
  /** el-tag 类型 */
  dictTag?: TagType;
  /** 自定义 div 标签的 class */
  dictClass?: string;
}

const props = withDefaults(
  defineProps<{
    /** koi 字典选项；命中 value 时优先按字典渲染 */
    tagOptions?: TagOption[];
    /** 当前值（字典匹配与 map 映射共用） */
    value?: string | number;
    /** 值 → { label, type } 映射（与 default 主题一致） */
    map?: Record<string, { label?: string; type?: TagType | "" }>;
    type?: TagType | "";
    size?: "large" | "default" | "small";
    closable?: boolean;
    effect?: "dark" | "light" | "plain";
    round?: boolean;
    disableTransitions?: boolean;
    hit?: boolean;
    color?: string;
  }>(),
  {
    tagOptions: () => [],
    value: "",
    map: undefined,
    type: undefined as undefined | TagType,
    size: "default",
    closable: false,
    effect: "light",
    round: false,
    disableTransitions: true,
    hit: false,
    color: "",
  },
);

/** 当前命中的字典选项 */
const matched = computed(() =>
  props.tagOptions.find(
    (o) =>
      props.value != null &&
      String(props.value) === String(o.dictValue),
  ),
);

/** map 映射命中（对齐 default 主题） */
const mapped = computed(() => {
  if (props.value === "" || !props.map) return null;
  return props.map[String(props.value)] ?? null;
});

/** 最终 el-tag 类型：字典 > map > type */
const displayType = computed<TagType | undefined>(
  () => matched.value?.dictTag || mapped.value?.type || props.type || undefined,
);

/** 最终文案：字典 > map；均无则由默认插槽提供 */
const displayText = computed<string | undefined>(
  () => matched.value?.dictLabel ?? mapped.value?.label ?? undefined,
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

    <!--
      其余情况统一回退 el-tag：既覆盖字典命中（无 dictClass），
      也覆盖未命中字典的 default 契约用法（type + 默认插槽 / map 映射）。
      不可省略兜底分支，否则标签会渲染成空白。
    -->
    <ElTag
      v-else
      v-bind="$attrs"
      :type="displayType"
      :size="size"
      :closable="closable"
      :disable-transitions="disableTransitions"
      :hit="hit"
      :color="color"
      :effect="effect"
      :round="round"
    >
      <slot>{{ displayText }}</slot>
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
