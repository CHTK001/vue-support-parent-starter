<template>
  <div class="system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-content">
        <IconifyIconOnline icon="ep:video-camera" class="page-header-icon" />
        <div>
          <h2 class="page-header-title">视频源管理</h2>
          <p class="page-header-desc">管理视频源平台配置和连接状态</p>
        </div>
      </div>
    </div>

    <!-- 视频源列表 -->
    <div class="source-list flex flex-col h-full">
      <div class="list-header">
        <div class="list-header-content">
          <div class="list-actions">
            <div class="search-input">
              <ScInput 
                v-model="searchKeyword"
                placeholder="搜索视频源平台或URL"
                @input="handleSearch"
              >
                <template #prefix>
                  <ScIcon>
                    <IconifyIconOnline icon="ep:search" />
                  </ScIcon>
                </template>
              </ScInput>
            </div>

            <div class="filter-select">
              <ScSelect 
                v-model="statusFilter"
                placeholder="状态筛选"
                @change="handleFilter"
              >
                <ScOption label="全部" value="" />
                <ScOption label="启用" value="1" />
                <ScOption label="禁用" value="0" />
              </ScSelect>
            </div>

            <div class="header-actions">
              <ScButton 
                type="primary"
                @click="showAddDialog = true"
                class="action-btn primary-action"
              >
                <IconifyIconOnline icon="ep:plus" />
                新增视频源
              </ScButton>
              <ScButton 
                @click="refreshSources"
                class="action-btn secondary-action"
              >
                <ScIcon>
                  <IconifyIconOnline icon="ep:refresh" />
                </ScIcon>
              </ScButton>
            </div>
          </div>
        </div>
      </div>

      <div class="list-content flex-1">
        <ScTable
          :url="getSourceList"
          :params="{
            keyword: searchKeyword,
            status: statusFilter,
          }"
          :col-size="4"
          layout="card"
          :page-size="pageSize"
          @selection-change="handleSelectionChange"
          @data-loaded="handleDataLoaded"
          class="source-cards"
          ref="tableRef"
        >
          <!-- 空状态模板 -->
          <template #empty>
            <div class="empty-state">
              <div class="empty-icon">
                <IconifyIconOnline icon="ep:video-camera" />
              </div>
              <div class="empty-title">暂无视频源数据</div>
              <div class="empty-description">
                还没有添加任何视频源，点击上方按钮开始添加
              </div>
              <ScButton 
                type="primary"
                @click="showAddDialog = true"
                class="empty-action"
              >
                <IconifyIconOnline icon="ep:plus" class="mr-2" />
                新增视频源
              </ScButton>
            </div>
          </template>

          <!-- 卡片模板 -->
          <template #default="{ row }">
            <SourceCard
              :source="row"
              @action="handleCommand"
              @test-connection="testConnection"
            />
          </template>
        </ScTable>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <sc-dialog
      v-model="showAddDialog"
      :title="editingSource ? '编辑视频源' : '新增视频源'"
      width="80%"
      :close-on-click-modal="false"
      class="source-dialog"
      draggable
    >
      <SourceForm
        :source="editingSource"
        @submit="handleSubmit"
        @cancel="handleCancel"
        ref="formRef"
      />
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 视频源管理页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */
import { message, ScMessageBox } from "@repo/utils";
import { onMounted, onUnmounted, ref } from "vue";
import {
  deleteSource,
  getSourceList,
  saveSource,
  updateSource,
} from "../../api/source";
import type { VideoSource } from "../../api/types";
import SourceCard from "./components/SourceCard.vue";
import SourceForm from "./components/SourceForm.vue";

// 响应式数据
const searchKeyword = ref("");
const statusFilter = ref("");
const pageSize = ref(12);
const showAddDialog = ref(false);
const editingSource = ref<VideoSource | null>(null);
const selectedSources = ref<VideoSource[]>([]);
const sourceList = ref<VideoSource[]>([]);
const totalCount = ref(0);

// 组件引用
const tableRef = ref();
const formRef = ref();

/**
 * 数据加载完成回调
 * @param data 加载的数据
 */
const handleDataLoaded = (data: any) => {
  sourceList.value = data.data || [];
  totalCount.value = data.total || 0;
};

/**
 * 刷新视频源列表
 */
const refreshSources = () => {
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

/**
 * 处理筛选
 */
const handleFilter = () => {
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: VideoSource[]) => {
  selectedSources.value = selection;
};

/**
 * 编辑视频源
 */
const editSource = (source: VideoSource) => {
  editingSource.value = source;
  showAddDialog.value = true;
};

/**
 * 删除视频源
 */
const deleteSourceItem = (source: VideoSource) => {
  ScMessageBox.confirm(
    `确定要删除视频源 "${source.videoSourcePlatform}" 吗？`,
    "确认删除",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    },
  )
    .then(() => {
      deleteSource(source.videoSourceId)
        .then(() => {
          message("删除成功", { type: "success" });
          refreshSources();
        })
        .catch((error) => {
          message(error.message || "删除失败", { type: "error" });
        });
    })
    .catch(() => {
      // 用户取消操作
    });
};

/**
 * 测试连接
 */
const testConnection = (source: VideoSource) => {
  message("正在测试连接...", { type: "info" });
  // TODO: 实现连接测试逻辑
  setTimeout(() => {
    message("连接测试成功", { type: "success" });
  }, 2000);
};

/**
 * 处理命令
 */
const handleCommand = (command: string, source: VideoSource) => {
  switch (command) {
    case "enable":
    case "disable":
      toggleSourceStatus(source, command === "enable");
      break;
    case "edit":
      editSource(source);
      break;
    case "delete":
      deleteSourceItem(source);
      break;
    case "test":
      testConnection(source);
      break;
  }
};

/**
 * 切换视频源状态
 */
const toggleSourceStatus = (source: VideoSource, enable: boolean) => {
  const updatedSource = {
    ...source,
    videoSourceEnable: enable ? 1 : 0,
  };

  updateSource(updatedSource)
    .then(() => {
      message(enable ? "启用成功" : "禁用成功", { type: "success" });
      refreshSources();
    })
    .catch((error) => {
      message(error.message || "操作失败", { type: "error" });
    });
};

/**
 * 处理表单提交
 */
const handleSubmit = (sourceData: VideoSource) => {
  const isEdit = !!editingSource.value;
  const apiCall = isEdit ? updateSource : saveSource;

  apiCall(sourceData)
    .then(() => {
      message(isEdit ? "更新成功" : "添加成功", { type: "success" });
      showAddDialog.value = false;
      editingSource.value = null;
      refreshSources();
    })
    .catch((error) => {
      message(error.message || "操作失败", { type: "error" });
    });
};

/**
 * 处理表单取消
 */
const handleCancel = () => {
  showAddDialog.value = false;
  editingSource.value = null;
};

// 生命周期
onMounted(() => {
  // 页面初始化
});

onUnmounted(() => {
  // 清理资源
});
</script>

<style scoped lang="scss">
/* 页面头部 */
.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-3) 0%,
    var(--el-color-primary) 100%
  );
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header-icon {
  font-size: 48px;
  opacity: 0.9;
}

.page-header-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.source-list {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
}

.list-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  height: 38px;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.primary-action {
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
}

.secondary-action {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-regular);

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

.list-content {
  padding: 24px;
}

.source-cards {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 72px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  font-weight: 600;
}

.empty-description {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 32px;
  line-height: 1.6;
}

.empty-action {
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
  font-weight: 500;
}

.source-dialog {
  border-radius: 12px;
}

.source-dialog :deep(.el-dialog__header) {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-5) 0%,
    var(--el-color-primary-light-3) 100%
  );
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 20px 24px;
  border-radius: 12px 12px 0 0;
}

.source-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

@media (max-width: 768px) {
  .list-header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .list-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .header-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
  }
}
</style>
