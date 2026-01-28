<template>
  <div class="file-manager system-container modern-bg">
    <!-- 使用新的文件管理页面组件 -->
    <FileManagerPage
      ref="fileManagerPageRef"
      :server-id="serverId"
      :server-info="serverInfo"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { getServerInfo } from "@/api/server";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import FileManagerPage from "./FileManagerPage.vue";

// 路由实例
const route = useRoute();
const router = useRouter();

// Props
defineProps<{
  server?: any;
}>();

// Emits
defineEmits<{
  close: [];
}>();

// 响应式数据
const serverId = ref<number>(0);
const serverInfo = ref<any>(null);

// 组件引用
const fileManagerPageRef = ref();

// 处理关闭
const handleClose = () => {
  // 返回上一页或者跳转到服务器管理页面
  router.back();
};

// 初始化
onMounted(async () => {
  // 从路由参数获取 serverId
  const routeServerId = route.params.serverId;
  if (routeServerId) {
    serverId.value = Number(routeServerId);

    // 根据 serverId 获取服务器信息
    try {
      const response = await getServerInfo(String(serverId.value));
      if (response.code === "00000") {
        serverInfo.value = response.data;
      }
    } catch (error) {
      console.error("获取服务器信息失败:", error);
    }
  }
});
</script>

<style scoped lang="scss">
@import "@/styles/mixins.scss";

.file-manager {
  @include system-container;
  @include modern-bg;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--el-bg-color-overlay);
  z-index: 1000;
  overflow: hidden;
}

</style>
