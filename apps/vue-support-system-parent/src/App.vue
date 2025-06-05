<template>
  <el-config-provider :locale="currentLocale">
    <router-view :key="$route.fullPath"  />
    <ReDialog />
  </el-config-provider>
</template>

<script lang="ts">
import { ReDialog } from "@repo/components/ReDialog";
import { ElConfigProvider } from "element-plus";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { defineComponent } from "vue";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
  },
  computed: {
    currentLocale() {
      return this.$storage.locale?.locale === "zh-CN" ? zhCn : en;
    },
  },
});
</script>
