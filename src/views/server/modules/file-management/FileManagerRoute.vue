<template>
  <div class="file-manager-route">
    <FileManagerPage
      v-if="serverId"
      :server-id="serverId"
      :server-info="serverInfo"
    />
    <div v-else class="error-container">
      <el-result icon="error" title="参数错误" sub-title="缺少服务器ID参数">
        <template #extra>
          <el-button type="primary" @click="goBack"> 返回 </el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import FileManagerPage from "./FileManagerPage.vue";
import { getServerInfo } from "@/api/server";

const route = useRoute();
const router = useRouter();

// 从路由参数获取serverId
const serverId = computed(() => {
  const id = route.params.serverId;
  return id ? parseInt(id as string, 10) : null;
});

// 服务器信息
const serverInfo = ref(null);

/**
 * 加载服务器信息
 */
const loadServerInfo = async () => {
  if (!serverId.value) return;

  try {
    const response = await getServerInfo(String(serverId.value));
    if (response.code === "00000") {
      serverInfo.value = response.data;
    } else {
      ElMessage.error(`加载服务器信息失败: ${response.msg}`);
    }
  } catch (error) {
    console.error("加载服务器信息失败:", error);
    ElMessage.error("加载服务器信息失败");
  }
};

/**
 * 返回上一页
 */
const goBack = () => {
  router.go(-1);
};

// 生命周期
onMounted(() => {
  if (serverId.value) {
    loadServerInfo();
  } else {
    ElMessage.error("缺少服务器ID参数");
  }
});
</script>

<style scoped>
.file-manager-route {
  height: 100vh;
  width: 100vw;
  background: #ffffff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  overflow: hidden;
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
}
</style>
