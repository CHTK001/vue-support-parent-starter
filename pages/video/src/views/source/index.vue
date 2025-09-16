<template>
  <div class="video-source">
    <!-- 视频源列表 -->
    <div class="source-list flex flex-col h-full">
      <div class="list-header">
        <div class="list-header-content">
          <div class="list-title-section">
            <div class="list-icon">
              <IconifyIconOnline icon="ep:video-camera" />
            </div>
            <h3 class="list-title">视频源管理</h3>
          </div>

          <div class="list-actions">
            <div class="search-input">
              <el-input v-model="searchKeyword" placeholder="搜索视频源平台或URL" @input="handleSearch">
                <template #prefix>
                  <el-icon>
                    <IconifyIconOnline icon="ep:search" />
                  </el-icon>
                </template>
              </el-input>
            </div>

            <div class="filter-select">
              <el-select v-model="statusFilter" placeholder="状态筛选" @change="handleFilter">
                <el-option label="全部" value="" />
                <el-option label="启用" value="1" />
                <el-option label="禁用" value="0" />
              </el-select>
            </div>

            <div class="header-actions">
              <el-button type="primary" @click="showAddDialog = true" class="action-btn primary-action">
                <IconifyIconOnline icon="ep:plus" />
                新增视频源
              </el-button>
              <el-button @click="refreshSources" class="action-btn secondary-action">
                <el-icon>
                  <IconifyIconOnline icon="ep:refresh" />
                </el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="list-content flex-1">
        <ScTable :url="getSourceList" :params="{
          keyword: searchKeyword,
          status: statusFilter,
        }" :col-size="4" layout="card" :page-size="pageSize" @selection-change="handleSelectionChange"
          @data-loaded="handleDataLoaded" class="source-cards" ref="tableRef">
          <!-- 空状态模板 -->
          <template #empty>
            <div class="empty-state">
              <div class="empty-icon">
                <IconifyIconOnline icon="ep:video-camera" />
              </div>
              <div class="empty-title">暂无视频源数据</div>
              <div class="empty-description">还没有添加任何视频源，点击上方按钮开始添加</div>
              <el-button type="primary" @click="showAddDialog = true" class="empty-action">
                <IconifyIconOnline icon="ep:plus" class="mr-2" />
                新增视频源
              </el-button>
            </div>
          </template>

          <!-- 卡片模板 -->
          <template #default="{ row }">
            <SourceCard :source="row" @action="handleCommand" @test-connection="testConnection" />
          </template>
        </ScTable>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingSource ? '编辑视频源' : '新增视频源'" width="80%"
      :close-on-click-modal="false" class="source-dialog" draggable>
      <SourceForm :source="editingSource" @submit="handleSubmit" @cancel="handleCancel" ref="formRef" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 视频源管理页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, onUnmounted, ref } from "vue";
import { deleteSource, getSourceList, saveSource, updateSource } from "../../api/source";
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
  ElMessageBox.confirm(`确定要删除视频源 "${source.videoSourcePlatform}" 吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      deleteSource(source.videoSourceId)
        .then(() => {
          ElMessage.success("删除成功");
          refreshSources();
        })
        .catch((error) => {
          ElMessage.error(error.message || "删除失败");
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
  ElMessage.info("正在测试连接...");
  // TODO: 实现连接测试逻辑
  setTimeout(() => {
    ElMessage.success("连接测试成功");
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
      ElMessage.success(enable ? "启用成功" : "禁用成功");
      refreshSources();
    })
    .catch((error) => {
      ElMessage.error(error.message || "操作失败");
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
      ElMessage.success(isEdit ? "更新成功" : "添加成功");
      showAddDialog.value = false;
      editingSource.value = null;
      refreshSources();
    })
    .catch((error) => {
      ElMessage.error(error.message || "操作失败");
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

<style scoped>
.video-source {
  padding: 20px;
  background: #f5f7fa;
}

.source-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  background: #fafbfc;
}

.list-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.list-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
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
  width: 120px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  height: 36px;
  border-radius: 6px;
}

.primary-action {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.secondary-action {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.list-content {
  padding: 20px;
}

.source-cards {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #909399;
  margin-bottom: 24px;
}

.empty-action {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.source-dialog {
  border-radius: 8px;
}

.source-dialog :deep(.el-dialog__header) {
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;
  padding: 20px 24px;
}

.source-dialog :deep(.el-dialog__body) {
  padding: 24px;
}
</style>
