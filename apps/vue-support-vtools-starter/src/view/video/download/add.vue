<template>
  <div class="download-add-container">
    <div class="download-add-header">
      <h1 class="download-add-title">添加下载链接</h1>
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
    </div>

    <div class="download-add-content">
      <AddDownloadLink :mode="mode" :initial-data="initialData" :video-id="videoId" @success="handleSuccess" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import AddDownloadLink from "../components/AddDownloadLink.vue";
import type { DownloadItem } from "@/types/upload";

const route = useRoute();
const router = useRouter();

// 获取路由参数
const videoId = ref<number>();
const downloadId = ref<string | number>("");
const mode = ref<"add" | "edit">("add");
const initialData = ref<Partial<DownloadItem>>({});

onMounted(() => {
  // 从路由参数中获取视频ID和下载ID
  if (route.query.videoId) {
    videoId.value = ~~route.query.videoId;
  }

  if (route.query.downloadId) {
    downloadId.value = route.query.downloadId as string;
    mode.value = "edit";
    // 如果是编辑模式，可以在这里加载下载链接数据
    // loadDownloadData(downloadId.value);
  }
});

// 返回列表页
const goBack = () => {
  router.push("/video/download");
};

// 处理提交成功
const handleSuccess = (data: DownloadItem) => {
  ElMessage.success(mode.value === "add" ? "添加成功" : "更新成功");

  // 如果是编辑模式，返回列表页
  if (mode.value === "edit") {
    goBack();
  } else {
    // 如果是添加模式，可以继续添加或返回列表
    ElMessage.info("可以继续添加下载链接或返回列表");
  }
};

// 加载下载链接数据的函数（编辑模式使用）
// const loadDownloadData = async (id: string | number) => {
//   try {
//     // 这里可以调用API获取下载链接详情
//     // const res = await getDownloadDetail(id);
//     // if (res.code === "00000" && res.data) {
//     //   initialData.value = res.data;
//     // }
//   } catch (error) {
//     console.error("加载下载链接数据出错:", error);
//     ElMessage.error("加载数据失败");
//   }
// };
</script>

<style lang="scss" scoped>
.download-add-container {
  padding: 24px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.download-add-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .download-add-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -6px;
      left: 0;
      width: 40px;
      height: 3px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border-radius: 3px;
    }
  }
}

.download-add-content {
  flex: 1;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .download-add-container {
    padding: 16px;
  }

  .download-add-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .download-add-title {
      font-size: 18px;
    }
  }
}
</style>
