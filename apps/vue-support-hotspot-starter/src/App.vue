<template>
  <el-config-provider :locale="currentLocale">
    <router-view :key="$route.fullPath" />
    <ReDialog />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@repo/components/ReDialog";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { wsService } from "./utils/websocket";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog
  },
  setup() {
    onMounted(() => {
      // 初始化全局 WebSocket 连接
      wsService.connect();
    });

    onUnmounted(() => {
      wsService.disconnect();
    });
  },
  computed: {
    currentLocale() {
      return this.$storage.locale?.locale === "zh-CN" ? zhCn : en;
    }
  }
});
</script>
