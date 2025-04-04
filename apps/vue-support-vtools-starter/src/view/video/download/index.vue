<template>
  <div class="video-download-container">
    <div class="video-download-header">
      <h1 class="video-download-title">下载地址管理</h1>
      <div class="video-download-actions">
        <el-input v-model="queryParams.keyword" placeholder="请输入下载名称/URL" class="search-input" @keyup.enter="handleSearch" clearable>
          <template #append>
            <el-button @click="handleSearch">
              <IconifyIconOnline icon="ep:search" />
            </el-button>
          </template>
        </el-input>

        <el-select v-model="queryParams.uploadType" placeholder="下载类型" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="网盘资源" value="网盘资源" />
          <el-option label="磁力资源" value="磁力资源" />
          <el-option label="在线资源" value="在线资源" />
          <el-option label="百度网盘" value="百度网盘" />
          <el-option label="阿里云盘" value="阿里云盘" />
          <el-option label="天翼网盘" value="天翼网盘" />
        </el-select>

        <el-select v-model="queryParams.uploadStatus" placeholder="状态" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="可用" :value="0" />
          <el-option label="不可用" :value="1" />
        </el-select>

        <el-button type="primary" @click="goToAddPage">
          <IconifyIconOnline icon="ep:plus" />
          新增下载
        </el-button>
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
          刷新
        </el-button>
      </div>
    </div>

    <div class="video-download-list">
      <ScTable ref="tableRef" :url="getDownloadList" :params="queryParams" row-key="uploadId" v-loading="loading">
        <el-table-column label="序号" width="80" type="index" align="center" />
        <el-table-column prop="uploadName" label="下载名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="uploadUrl" label="下载地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="uploadType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.uploadType)">{{ row.uploadType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploadSize" label="大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.uploadSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.uploadStatus === 0 ? 'success' : 'danger'">
              {{ row.uploadStatus === 0 ? "可用" : "不可用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <IconifyIconOnline icon="ep:edit" />
            </el-button>
            <el-button type="success" size="small" @click="handleCopy(row)">
              <IconifyIconOnline icon="ep:copy-document" />
            </el-button>
            <el-popconfirm title="确定要删除该下载地址吗?" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" size="small">
                  <IconifyIconOnline icon="ep:delete" />
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </ScTable>
    </div>

    <!-- 新增/编辑下载地址对话框 -->
    <add-download-link-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增下载地址' : '编辑下载地址'" :video-id="form.uploadVideoId" ref="addLinkDialogRef" @success="handleDialogSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { deleteDownload, getDownloadList } from "@/api/download";
import { message } from "@repo/utils";
import AddDownloadLinkDialog from "../components/AddDownloadLinkDialog.vue";
import type { DownloadItem } from "@/types/upload";

const router = useRouter();

// 查询参数
const queryParams = reactive({
  keyword: "",
  uploadType: "",
  uploadStatus: "",
  pageNum: 1,
  pageSize: 10,
});

// 表格相关
const tableRef = ref();
const loading = ref(false);

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const addLinkDialogRef = ref();

// 当前表单数据
const form = reactive<DownloadItem>({
  uploadId: "",
  uploadName: "",
  uploadUrl: "",
  uploadPath: "",
  uploadType: "网盘资源",
  uploadSize: 0,
  uploadStatus: 0,
  uploadDescription: "",
  uploadVideoId: ""
});

// 根据类型获取标签样式
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    网盘资源: "primary",
    磁力资源: "warning",
    在线资源: "success",
    百度网盘: "info",
    阿里云盘: "danger",
    天翼网盘: "",
  };
  return typeMap[type] || "info";
};

// 格式化文件大小
const formatFileSize = (size?: number) => {
  if (!size) return "未知";

  if (size < 1024) {
    return size + " KB";
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + " MB";
  } else {
    return (size / (1024 * 1024)).toFixed(2) + " GB";
  }
};

// 搜索
const handleSearch = () => {
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

// 刷新
const handleRefresh = () => {
  queryParams.keyword = "";
  queryParams.uploadType = "";
  queryParams.uploadStatus = "";
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

// 跳转到添加下载链接页面
const goToAddPage = () => {
  router.push("/video/download/add");
};

// 新增下载地址
const handleAdd = () => {
  dialogType.value = "add";
  form.uploadId = "";
  form.uploadVideoId = "";
  dialogVisible.value = true;
};

// 编辑下载地址
const handleEdit = (row: DownloadItem) => {
  // 使用对话框方式编辑
  dialogType.value = "edit";
  form.uploadId = row.uploadId;
  form.uploadVideoId = row.uploadVideoId || "";
  dialogVisible.value = true;
  
  // 也可以跳转到添加页面并传递编辑参数
  // router.push({
  //   path: "/video/download/add",
  //   query: {
  //     downloadId: row.uploadId,
  //   },
  // });
};

// 处理对话框提交成功
const handleDialogSuccess = (data: DownloadItem) => {
  message(dialogType.value === "add" ? "新增成功" : "更新成功", { type: "success" });
  dialogVisible.value = false;
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

// 复制下载地址
const handleCopy = (row: DownloadItem) => {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(row.uploadUrl)
      .then(() => {
        message("复制成功", { type: "success" });
      })
      .catch(() => {
        message("复制失败，请手动复制", { type: "error" });
      });
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = row.uploadUrl;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    message("复制成功", { type: "success" });
  }
};

// 删除下载地址
const handleDelete = async (row: DownloadItem) => {
  loading.value = true;
  try {
    const res = await deleteDownload(row.uploadId);
    if (res.code === "00000") {
      message("删除成功", { type: "success" });
      if (tableRef.value) {
        tableRef.value.refresh();
      }
    } else {
      message(res.msg || "删除失败", { type: "error" });
    }
  } catch (error) {
    console.error("删除下载地址出错:", error);
    message("删除失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 提交表单逻辑已移至AddDownloadLinkDialog组件
</script>

<style lang="scss" scoped>
.video-download-container {
  padding: 24px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.video-download-header {
  margin-bottom: 24px;

  .video-download-title {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 20px;
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

  .video-download-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;

    .search-input,
    .el-select {
      width: 220px;
    }
  }
}

.video-download-list {
  flex: 1;
  overflow: hidden;

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;

    .el-table__header-wrapper th {
      background-color: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    .el-table__row:hover {
      background-color: var(--el-fill-color);
    }
  }
}

:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;

  .el-dialog__header {
    background: var(--el-color-primary-light-9);
    padding: 16px 20px;
    margin: 0;

    .el-dialog__title {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 16px 20px;
  }
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .video-download-container {
    padding: 16px;
  }

  .video-download-header {
    .video-download-title {
      font-size: 18px;
    }

    .video-download-actions {
      flex-direction: column;
      align-items: flex-start;

      .search-input,
      .el-select {
        width: 100%;
      }
    }
  }
}
</style>
