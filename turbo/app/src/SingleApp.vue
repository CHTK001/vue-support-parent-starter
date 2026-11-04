<template>
  <el-config-provider :locale="locale" :size="dimension">
    <!-- 单页面模式：渲染 .app() 传入的页面组件；未传时用默认插槽内容兜底 -->
    <component :is="page" v-if="page"></component>
    <slot v-else>
      <router-view v-if="hasRouter"></router-view>
    </slot>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import type { Component } from "vue";
import { useI18n } from "vue-i18n";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { useAppUiContext } from "@repo/theme";

/** 单页面根组件（由 createContextApp().app(App) 注入） */
defineProps<{ page?: Component }>();

// 主题适配器 provide 的 UI 上下文（语言 / 尺寸）
const uiContext = useAppUiContext();

// 全局 i18n（由 createContextApp 安装）
const i18n = useI18n();

/** 无 router 模式时，可通过 inject 得知是否启用 router 兜底渲染 */
const hasRouter = inject("app-has-router", false);

/** element-plus locale：优先读主题上下文语言，其次 i18n locale */
const locale = computed(() => {
  const lang = uiContext?.language.value ?? i18n.locale.value;
  return lang === "zh" ? zhCn : en;
});

/** element-plus 尺寸：主题提供则用主题，否则默认 */
const dimension = computed(() => uiContext?.dimension.value ?? "default");
</script>
