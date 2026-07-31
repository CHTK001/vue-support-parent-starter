<template>
  <el-config-provider :locale="locale">
    <router-view></router-view>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import en from "element-plus/es/locale/lang/en";

const i18n = useI18n();

const locale = computed(() => (i18n.locale.value === "en" ? en : zhCn));
</script>
