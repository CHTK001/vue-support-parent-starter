<template>
  <div class="file-management system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header modern-header">
      <div class="header-right">
        <ScButton 
          v-auth="'file:upload'"
          type="primary"
          @click="showUploadDialog = true"
        >
          <IconifyIconOnline icon="ri:upload-cloud-2-line" />
          上传文件
        </ScButton>
        <ScTooltip v-if="hasAdminRole" content="文件服务设置" placement="top">
          <ScButton 
            v-auth="'file:setting'"
            type="primary"
            plain
            @click="showSettingDialog = true"
          >
            <IconifyIconOnline icon="ri:settings-4-line" />
          </ScButton>
        </ScTooltip>
        <ScTooltip content="刷新" placement="top">
          <ScButton v-auth="'file:list'" type="primary" plain @click="refresh">
            <IconifyIconOnline icon="ri:refresh-line" />
          </ScButton>
        </ScTooltip>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <ScCard
          layout="stats"
          label="文件总数"
          :value="stats.totalCount"
          icon="ri:file-3-line"
          theme="primary"
          size="small"
          hoverable
        />
        <ScCard
          layout="stats"
          label="已完成"
          :value="stats.completedCount"
          icon="ri:checkbox-circle-line"
          theme="success"
          size="small"
          hoverable
        />
        <ScCard
          layout="stats"
          label="待合并"
          :value="stats.pendingMergeCount"
          icon="ri:time-line"
          theme="warning"
          size="small"
          hoverable
        />
        <ScCard
          layout="stats"
          label="上传失败"
          :value="stats.errorCount"
          icon="ri:error-warning-line"
          theme="danger"
          size="small"
          hoverable
        />
      </div>
    </div>

    <!-- 操作区域 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <!-- 分组选择 -->
        <ScSelect 
          v-model="queryParams.groupId"
          placeholder="选择分组"
          clearable
          style="width: 180px"
          @change="handleSearch"
        >
          <ScOption 
            v-for="group in groupList"
            :key="group.sysFileSystemGroupId"
            :label="group.sysFileSystemGroupName"
            :value="group.sysFileSystemGroupId"
          />
        </ScSelect>
        <!-- 状态筛选 -->
        <ScSelect 
          v-model="queryParams.status"
          placeholder="文件状态"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <ScOption label="待上传" :value="0" />
          <ScOption label="上传中" :value="1" />
          <ScOption label="待合并" :value="2" />
          <ScOption label="合并中" :value="3" />
          <ScOption label="已完成" :value="4" />
          <ScOption label="处理异常" :value="-1" />
        </ScSelect>
        <!-- 关键词搜索 -->
        <ScInput 
          v-model="queryParams.keyword"
          placeholder="搜索文件名"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </ScInput>
        <ScButton type="primary" @click="handleSearch">搜索</ScButton>
      </div>
      <div class="toolbar-right">
        <!-- 分组管理 -->
        <ScButton v-auth="'file:group'" plain @click="showGroupDialog = true">
          <IconifyIconOnline icon="ri:folder-settings-line" />
          分组管理
        </ScButton>
        <!-- 视图切换 -->
        <ScRadioGroup v-model="viewMode" size="default">
          <el-radio-button value="table">
            <IconifyIconOnline icon="ri:list-check" />
          </el-radio-button>
          <el-radio-button value="card">
            <IconifyIconOnline icon="ri:grid-line" />
          </el-radio-button>
        </ScRadioGroup>
      </div>
    </div>

    <!-- 文件列表 - 表格视图 -->
    <div v-if="viewMode === 'table'" class="table-section">
      <ScTable
        ref="tableRef"
        :url="fetchFileList"
        :columns="tableColumns"
        row-key="sysFileSystemId"
        @selection-change="handleSelectionChange"
      >
        <template #sysFileSystemName="{ row }">
          <div class="file-name-cell">
            <IconifyIconOnline
              :icon="getFileIcon(row.sysFileSystemExtension)"
              class="file-icon"
            />
            <span class="file-name">{{
              row.sysFileSystemOriginalName || row.sysFileSystemName
            }}</span>
          </div>
        </template>
        <template #sysFileSystemSize="{ row }">
          {{ formatFileSize(row.sysFileSystemSize) }}
        </template>
        <template #sysFileSystemStatus="{ row }">
          <ScTag :type="getStatusType(row.sysFileSystemStatus)" size="small">
            {{ getStatusText(row.sysFileSystemStatus) }}
          </ScTag>
        </template>
        <template #actions="{ row }">
          <ScButton 
            v-if="
              row.sysFileSystemStatus === 2 &&
              setting?.sysFileSystemSettingManualMergeEnabled
            "
            v-auth="'file:merge'"
            type="primary"
            link
            size="small"
            @click="handleMerge(row)"
          >
            合并
          </ScButton>
          <ScButton 
            v-if="row.sysFileSystemHttpUrl"
            v-auth="'file:preview'"
            type="primary"
            link
            size="small"
            @click="handlePreview(row)"
          >
            预览
          </ScButton>
          <ScButton 
            v-if="row.sysFileSystemHttpUrl"
            v-auth="'file:copy'"
            type="primary"
            link
            size="small"
            @click="handleCopyUrl(row)"
          >
            复制
          </ScButton>
          <ScButton 
            v-auth="'file:delete'"
            type="danger"
            link
            size="small"
            @click="handleDelete(row)"
          >
            删除
          </ScButton>
        </template>
      </ScTable>
    </div>

    <!-- 文件列表 - 卡片视图 -->
    <div v-else class="card-section">
      <div v-if="fileList.length > 0" class="file-cards">
        <div
          v-for="file in fileList"
          :key="file.sysFileSystemId"
          class="file-card"
          @click="handleCardClick(file)"
        >
          <div class="card-preview">
            <img
              v-if="
                isImageFile(file.sysFileSystemExtension) &&
                file.sysFileSystemHttpUrl
              "
              :src="file.sysFileSystemHttpUrl"
              :alt="file.sysFileSystemName"
              class="preview-image"
            />
            <IconifyIconOnline
              v-else
              :icon="getFileIcon(file.sysFileSystemExtension)"
              class="preview-icon"
            />
          </div>
          <div class="card-info">
            <div
              class="card-name"
              :title="file.sysFileSystemOriginalName || file.sysFileSystemName"
            >
              {{ file.sysFileSystemOriginalName || file.sysFileSystemName }}
            </div>
            <div class="card-meta">
              <span>{{ formatFileSize(file.sysFileSystemSize) }}</span>
              <ScTag 
                :type="getStatusType(file.sysFileSystemStatus)"
                size="small"
              >
                {{ getStatusText(file.sysFileSystemStatus) }}
              </ScTag>
            </div>
          </div>
          <div class="card-actions">
            <ScButton 
              v-if="file.sysFileSystemStatus === 2"
              size="small"
              type="primary"
              circle
              @click.stop="handleMerge(file)"
            >
              <IconifyIconOnline icon="ri:merge-cells-horizontal" />
            </ScButton>
            <ScButton 
              size="small"
              type="danger"
              circle
              @click.stop="handleDelete(file)"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </ScButton>
          </div>
        </div>
      </div>
      <ScEmpty v-else description="暂无文件" />

      <!-- 卡片视图分页 -->
      <div class="card-pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadFileList"
          @current-change="loadFileList"
        />
      </div>
    </div>

    <!-- 设置对话框 -->
    <FileSettingDialog
      v-model="showSettingDialog"
      :setting="setting"
      @saved="handleSettingSaved"
    />

    <!-- 上传对话框 -->
    <FileUploadDialog
      v-model="showUploadDialog"
      :setting="setting"
      :groups="groupList"
      @uploaded="handleUploaded"
    />

    <!-- 分组管理对话框 -->
    <FileGroupDialog
      v-model="showGroupDialog"
      :groups="groupList"
      @saved="loadGroupList"
    />

    <!-- 实时上传进度浮窗 -->
    <UploadProgressFloat
      v-if="setting?.sysFileSystemSettingPreviewEnabled"
      :visible="uploadProgressVisible"
      :tasks="uploadTasks"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message , ScMessageBox} from "@repo/utils";

import { useUserStoreHook } from "@repo/core";
import {
  getFileStats,
  getFileList,
  getGroupList,
  getFileSystemSetting,
  mergeFile,
  deleteFile,
  type FileStats,
  type SysFileSystem,
  type SysFileSystemGroup,
  type SysFileSystemSetting,
  type FileListParams,
} from "../api/file";
import FileSettingDialog from "./components/FileSettingDialog.vue";
import FileUploadDialog from "./components/FileUploadDialog.vue";
import FileGroupDialog from "./components/FileGroupDialog.vue";
import UploadProgressFloat from "./components/UploadProgressFloat.vue";

// 状态
const tableRef = ref();
const viewMode = ref<"table" | "card">("table");
const showSettingDialog = ref(false);
const showUploadDialog = ref(false);
const showGroupDialog = ref(false);
const uploadProgressVisible = ref(false);

// 数据
const stats = reactive<FileStats>({
  totalCount: 0,
  pendingMergeCount: 0,
  errorCount: 0,
  completedCount: 0,
  uploadingCount: 0,
});
const setting = ref<SysFileSystemSetting>();
const groupList = ref<SysFileSystemGroup[]>([]);
const fileList = ref<SysFileSystem[]>([]);
const total = ref(0);
const selectedFiles = ref<SysFileSystem[]>([]);
const uploadTasks = ref<
  Array<{ id: string; name: string; progress: number; status: string }>
>([]);

// 查询参数
const queryParams = reactive<FileListParams>({
  page: 1,
  size: 20,
  groupId: undefined,
  status: undefined,
  keyword: "",
});

// 表格列配置
const tableColumns = [
  { type: "selection", width: 50 },
  { prop: "sysFileSystemName", label: "文件名", minWidth: 200, slot: true },
  { prop: "sysFileSystemSize", label: "大小", width: 100, slot: true },
  { prop: "sysFileSystemType", label: "类型", width: 100 },
  { prop: "sysFileSystemStatus", label: "状态", width: 100, slot: true },
  { prop: "createTime", label: "上传时间", width: 160 },
  { prop: "actions", label: "操作", width: 200, fixed: "right", slot: true },
];

// 计算属性
const hasAdminRole = computed(() => {
  const userStore = useUserStoreHook();
  const roles = userStore.roles || [];
  return roles.includes("admin") || roles.includes("superadmin");
});

// 获取文件图标
const getFileIcon = (ext?: string): string => {
  if (!ext) return "ri:file-line";
  const lower = ext.toLowerCase();
  const iconMap: Record<string, string> = {
    jpg: "ri:image-line",
    jpeg: "ri:image-line",
    png: "ri:image-line",
    gif: "ri:image-line",
    svg: "ri:image-line",
    webp: "ri:image-line",
    pdf: "ri:file-pdf-line",
    doc: "ri:file-word-line",
    docx: "ri:file-word-line",
    xls: "ri:file-excel-line",
    xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line",
    pptx: "ri:file-ppt-line",
    zip: "ri:file-zip-line",
    rar: "ri:file-zip-line",
    "7z": "ri:file-zip-line",
    mp3: "ri:music-line",
    wav: "ri:music-line",
    mp4: "ri:video-line",
    avi: "ri:video-line",
    mov: "ri:video-line",
    txt: "ri:file-text-line",
    md: "ri:markdown-line",
    json: "ri:code-line",
    js: "ri:javascript-line",
    ts: "ri:code-line",
    vue: "ri:vuejs-line",
  };
  return iconMap[lower] || "ri:file-line";
};

// 判断是否是图片
const isImageFile = (ext?: string): boolean => {
  if (!ext) return false;
  return ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(
    ext.toLowerCase()
  );
};

// 格式化文件大小
const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取状态类型
const getStatusType = (
  status?: number
): "success" | "warning" | "danger" | "info" => {
  switch (status) {
    case 4:
      return "success";
    case 2:
    case 3:
      return "warning";
    case -1:
      return "danger";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status?: number): string => {
  const statusMap: Record<number, string> = {
    0: "待上传",
    1: "上传中",
    2: "待合并",
    3: "合并中",
    4: "已完成",
    [-1]: "处理异常",
  };
  return statusMap[status ?? 0] || "未知";
};

// 加载统计数据
const loadStats = async () => {
  const res = await getFileStats();
  if (res.code === 200 && res.data) {
    Object.assign(stats, res.data);
  }
};

// 加载配置
const loadSetting = async () => {
  const res = await getFileSystemSetting();
  if (res.code === 200 && res.data) {
    setting.value = res.data;
  }
};

// 加载分组列表
const loadGroupList = async () => {
  const res = await getGroupList();
  if (res.code === 200 && res.data) {
    groupList.value = res.data;
  }
};

// 文件列表数据源函数（供 ScTable 使用）
const fetchFileList = async (params: Record<string, unknown>) => {
  const res = await getFileList({
    ...queryParams,
    page: params.page as number,
    size: params.size as number,
  });
  return res;
};

// 加载文件列表（卡片视图使用）
const loadFileList = async () => {
  const res = await getFileList(queryParams);
  if (res.code === 200 && res.data) {
    fileList.value = res.data.records;
    total.value = res.data.total;
  }
};

// 搜索
const handleSearch = () => {
  queryParams.page = 1;
  if (viewMode.value === "table") {
    tableRef.value?.refresh();
  } else {
    loadFileList();
  }
};

// 刷新
const refresh = () => {
  loadStats();
  if (viewMode.value === "table") {
    tableRef.value?.refresh();
  } else {
    loadFileList();
  }
};

// 选择变化
const handleSelectionChange = (rows: SysFileSystem[]) => {
  selectedFiles.value = rows;
};

// 手动合并
const handleMerge = async (file: SysFileSystem) => {
  if (!file.sysFileSystemId) return;
  try {
    await ScMessageBox.confirm("确定要合并该文件吗？", "确认合并", {
      type: "warning",
    });
    const res = await mergeFile(file.sysFileSystemId);
    if (res.code === 200) {
      message("已触发合并任务", { type: "success" });
      refresh();
    } else {
      message(res.msg || "操作失败", { type: "error" });
    }
  } catch {
    // 取消
  }
};

// 删除
const handleDelete = async (file: SysFileSystem) => {
  if (!file.sysFileSystemId) return;
  try {
    await ScMessageBox.confirm("确定要删除该文件吗？", "确认删除", {
      type: "warning",
    });
    const res = await deleteFile(file.sysFileSystemId);
    if (res.code === 200) {
      message("删除成功", { type: "success" });
      refresh();
    } else {
      message(res.msg || "删除失败", { type: "error" });
    }
  } catch {
    // 取消
  }
};

// 预览
const handlePreview = (file: SysFileSystem) => {
  if (file.sysFileSystemHttpUrl) {
    window.open(file.sysFileSystemHttpUrl, "_blank");
  }
};

// 复制URL
const handleCopyUrl = async (file: SysFileSystem) => {
  if (file.sysFileSystemHttpUrl) {
    try {
      await navigator.clipboard.writeText(file.sysFileSystemHttpUrl);
      message("已复制到剪贴板", { type: "success" });
    } catch {
      message("复制失败", { type: "error" });
    }
  }
};

// 卡片点击
const handleCardClick = (file: SysFileSystem) => {
  if (file.sysFileSystemHttpUrl) {
    handlePreview(file);
  }
};

// 配置保存回调
const handleSettingSaved = () => {
  loadSetting();
};

// 上传完成回调
const handleUploaded = () => {
  refresh();
};

// 初始化
onMounted(() => {
  loadStats();
  loadSetting();
  loadGroupList();
  if (viewMode.value === "card") {
    loadFileList();
  }
});
</script>

<style lang="scss" scoped>
.file-management {
  padding: clamp(20px, 3vw, 32px);
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 2vw, 24px);
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: clamp(16px, 2vw, 24px);
  background: linear-gradient(
    135deg,
    rgba(64, 158, 255, 0.12),
    rgba(64, 158, 255, 0.06)
  );
  border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 70%, transparent);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.stats-section {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: clamp(14px, 2vw, 20px);
  }
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: clamp(16px, 2vw, 20px);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 60%, transparent);
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(8px);

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.table-section {
  background: color-mix(in srgb, var(--el-bg-color-overlay) 95%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 60%, transparent);
  border-radius: 14px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(8px);
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .file-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }

  .file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.card-section {
  .file-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .file-card {
    background: color-mix(in srgb, var(--el-bg-color-overlay) 95%, transparent);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 60%, transparent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    backdrop-filter: blur(8px);

    &:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color-lighter));

      .card-actions {
        opacity: 1;
      }
    }

    .card-preview {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-fill-color-lighter);

      .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .preview-icon {
        font-size: 48px;
        color: var(--el-color-primary);
      }
    }

    .card-info {
      padding: 12px;

      .card-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 8px;
      }

      .card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .card-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 0 12px 12px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
  }

  .card-pagination {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
