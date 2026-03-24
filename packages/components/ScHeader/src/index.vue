<template>
  <!-- Tech 主题模式：使用 scifiHeader -->
  <scifi-header v-if="theme === 'tech'" v-bind="scifiHeaderProps">
    <template v-if="$slots.left" #left>
      <slot name="left" />
    </template>

    <template v-if="$slots.center" #center>
      <slot name="center" />
    </template>

    <template v-if="$slots.right" #right>
      <slot name="right" />
    </template>

    <slot />
  </scifi-header>

  <!-- 默认模式：使用 el-header -->
  <el-header v-else :height="height">
    <slot />
  </el-header>
</template>

<script setup lang="ts">
/**
 * ScHeader 头部组件
 * 封装 el-header 和 scifiHeader
 * @author CH
 * @since 2025-12-03
 * @version 3.0.0
 */
import { computed } from "vue";
import { ElHeader } from "element-plus";

interface Props {
  /** 头部高度 */
  height?: string;
  /** 主题风格 */
  theme?: "default" | "tech";
  /** Logo 图片地址 */
  logo?: string;
  /** 标题 */
  title?: string;
  /** 图标 */
  icon?: string;
  /** 是否固定 */
  fixed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: "60px",
  theme: "default",
  logo: "",
  title: "",
  icon: "",
  fixed: false
});

const scifiHeaderProps = computed(() => ({
  // scifiHeader 的属性，根据实际 API 调整
  logo: props.logo,
  title: props.title,
  icon: props.icon,
  fixed: props.fixed,
  height: props.height
}));
</script>

<style lang="scss" scoped>
// 自定义样式
</style>
