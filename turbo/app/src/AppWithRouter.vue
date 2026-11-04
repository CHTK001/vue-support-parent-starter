<template>
  <el-config-provider :locale="locale" :size="dimension">
    <router-view></router-view>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { useAppUiContext } from "@repo/theme";

// 主题适配器 provide 的 UI 上下文（语言 / 尺寸）
const uiContext = useAppUiContext();

// 全局 i18n（由 createApp 安装）
const i18n = useI18n();

/** element-plus locale：优先读主题上下文语言，其次 i18n locale */
const locale = computed(() => {
  const lang = uiContext?.language.value ?? i18n.locale.value;
  return lang === "zh" ? zhCn : en;
});

/** element-plus 尺寸：主题提供则用主题，否则默认 */
const dimension = computed(() => uiContext?.dimension.value ?? "default");
</script>
