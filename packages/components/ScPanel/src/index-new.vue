<template>
  <!-- Tech 主题模式：使用 scifiPanel -->
  <tech-panel v-if="theme === 'tech'" :title="title" :icon="icon" :disabled="disabled">
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </tech-panel>

  <!-- Element Plus 原生模式：使用 el-collapse-item -->
  <el-collapse-item v-else :name="name" :title="title" :disabled="disabled">
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <slot />
  </el-collapse-item>
</template>

<script setup lang="ts">
/**
 * ScPanel 面板组件
 * 封装 el-collapse-item 和 scifiPanel
 * @author CH
 * @since 2025-12-03
 * @version 3.0.0
 */
import { ElCollapseItem } from "element-plus";
import TechPanel from "./tech.vue";

interface Props {
  /** 面板名称，作为唯一标识 */
  name?: string | number;
  /** 面板标题 */
  title?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 主题风格 */
  theme?: "default" | "tech";
  /** 图标 */
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  name: "",
  title: "",
  disabled: false,
  theme: "default",
  icon: ""
});
</script>
