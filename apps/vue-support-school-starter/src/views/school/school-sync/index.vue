<template>
  <div class="school-sync-container">
    <div class="header-section">
      <div class="header-title">
        <h2>学校数据同步</h2>
        <p class="header-subtitle">配置和管理学校数据同步任务</p>
      </div>
      <div class="header-actions">
        <el-button type="default" :icon="useRenderIcon('ep:refresh')" @click="handleRefresh"></el-button>
        <el-button type="primary" :icon="useRenderIcon('ep:plus')" @click="handleAdd"></el-button>
      </div>
    </div>
    <div class="sync-list-section" v-show="total > 0">
      <div class="list-header">
        <div class="total-count">
          共 <span class="highlight">{{ total }}</span> 个同步配置
        </div>
      </div>

      <ScTable ref="tableRef" :url="getSchoolSyncConfigList" layout="card" @data-loaded="handleDataLoaded" class="hidden-table">
        <template #default="{ row }">
          <div class="sync-card">
            <div class="sync-card-header">
              <div class="sync-icon">
                <IconifyIconOnline icon="ri:database-2-line" />
              </div>
              <div class="sync-basic-info">
                <h3 class="sync-name">{{ row.schoolSyncConfigName }}</h3>
                <div class="sync-badges">
                  <el-tag :type="row.schoolSyncConfigEnabled ? 'success' : 'info'" size="small">
                    {{ row.schoolSyncConfigEnabled ? "启用" : "停用" }}
                  </el-tag>
                  <el-tag type="warning" size="small" v-if="row.schoolSyncConfigSyncType">
                    {{ row.schoolSyncConfigSyncType }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="sync-card-body">
              <div class="sync-info-row">
                <div class="info-label">同步地址:</div>
                <div class="info-value">
                  <IconifyIconOnline icon="ri:link" class="info-icon" />
                  {{ row.schoolSyncConfigUrl || "未设置" }}
                </div>
              </div>

              <div class="sync-info-row">
                <div class="info-label">上次同步:</div>
                <div class="info-value">
                  <IconifyIconOnline icon="ri:history-line" class="info-icon" />
                  {{ row.schoolSyncConfigSyncTime || "未同步" }}
                </div>
              </div>

              <!-- 添加进度条组件 -->
              <ScSocketEventProcess :eventId="row.schoolSyncConfigId" title="同步进度" eventName="school-sync-progress" ref="progressRefs[row.schoolSyncConfigId]" />
            </div>
            <div class="sync-card-footer">
              <el-button type="primary" size="small" plain @click="handleExecute(row)" :loading="syncingIds.includes(row.schoolSyncConfigId)" :disabled="syncingIds.includes(row.schoolSyncConfigId)">
                {{ syncingIds.includes(row.schoolSyncConfigId) ? "同步中" : "执行同步" }}
                <IconifyIconOnline v-if="!syncingIds.includes(row.schoolSyncConfigId)" icon="ri:play-line" />
              </el-button>
              <div class="action-buttons">
                <el-button type="primary" link @click="handleEdit(row)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
                <el-button type="danger" link @click="handleDelete(row)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>

    <!-- 空状态显示 -->
    <div v-if="total === 0" class="empty-state">
      <el-empty description="暂无同步配置">
        <div class="empty-text">点击下方按钮创建第一个数据同步配置</div>
        <el-button type="primary" @click="handleAdd" class="empty-button">
          <IconifyIconOnline icon="ri:add-line" class="button-icon" />
          新增配置
        </el-button>
      </el-empty>
    </div>

    <!-- 新增/编辑弹框 -->
    <SyncConfigDialog v-model="dialogVisible" :type="dialogType" :data="currentConfig" @submit="handleDialogSubmit" />
  </div>
</template>

<script setup lang="ts">
import { addSchoolSyncConfig, fetchSyncConfigExecute, deleteSchoolSyncConfig, getSchoolSyncConfigList, updateSchoolSyncConfig } from "@/api";
import type { SchoolSyncConfig } from "@/api/school-sync";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { ref, reactive } from "vue";
import SyncConfigDialog from "./components/SyncConfigDialog.vue";
import ScSocketEventProcess from "@repo/components/ScSocketEventProcess/index.vue";

const tableRef = ref();
const searchKeyword = ref("");
const dialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentConfig = ref<SchoolSyncConfig>();
const total = ref(0);

// 处理新增
const handleAdd = () => {
  dialogType.value = "add";
  currentConfig.value = undefined;
  dialogVisible.value = true;
};

// 处理编辑
const handleEdit = (row: SchoolSyncConfig) => {
  dialogType.value = "edit";
  currentConfig.value = row;
  dialogVisible.value = true;
};

const handleRefresh = () => {
  tableRef.value?.refresh();
};

// 处理删除
const handleDelete = async (row: SchoolSyncConfig) => {
  try {
    ElMessageBox.confirm("确定要删除该配置吗？", "提示", {
      type: "warning",
    }).then(() => {
      deleteSchoolSyncConfig(row.schoolSyncConfigId).then((res) => {
        message("删除成功", { type: "success" });
        handleRefresh();
      });
    });
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除配置失败:", error);
      message("删除配置失败", { type: "error" });
    }
  }
};

// 记录正在同步的ID
const syncingIds = ref<(string | number)[]>([]);
// 进度条组件引用
const progressRefs = reactive<Record<string | number, any>>({});

// 处理执行同步
const handleExecute = async (row: SchoolSyncConfig) => {
  try {
    // 添加到同步中的ID列表
    syncingIds.value.push(row.schoolSyncConfigId);

    // 如果有进度条组件引用，重置进度
    if (progressRefs[row.schoolSyncConfigId]) {
      progressRefs[row.schoolSyncConfigId].resetProgress();
      progressRefs[row.schoolSyncConfigId].updateProgress({
        percentage: 0,
        status: "processing",
        message: "正在启动同步任务...",
      });
      progressRefs[row.schoolSyncConfigId].show();
    }

    // 调用执行同步接口
    fetchSyncConfigExecute(row)
      .then((res) => {
        message("同步任务已启动", { type: "success" });
      })
      .catch((error) => {
        console.error("执行同步失败:", error);
        message("执行同步失败", { type: "error" });

        // 更新进度条状态为失败
        if (progressRefs[row.schoolSyncConfigId]) {
          progressRefs[row.schoolSyncConfigId].updateProgress({
            percentage: 0,
            status: "error",
            message: "同步任务启动失败",
          });
        }
      })
      .finally(() => {
        // 从同步中的ID列表移除
        const index = syncingIds.value.indexOf(row.schoolSyncConfigId);
        if (index !== -1) {
          syncingIds.value.splice(index, 1);
        }
      });
  } catch (error) {
    console.error("执行同步失败:", error);
    message("执行同步失败", { type: "error" });

    // 从同步中的ID列表移除
    const index = syncingIds.value.indexOf(row.schoolSyncConfigId);
    if (index !== -1) {
      syncingIds.value.splice(index, 1);
    }
  }
};

// 处理弹框提交
const handleDialogSubmit = async (data: SchoolSyncConfig) => {
  try {
    if (dialogType.value === "add") {
      addSchoolSyncConfig(data).then((res) => {
        handleRefresh();
      });
    } else {
      updateSchoolSyncConfig(data).then((res) => {
        handleRefresh();
      });
    }
    dialogVisible.value = false;
  } catch (error) {
    console.error("保存配置失败:", error);
    message("保存配置失败", { type: "error" });
  }
};

// 处理数据加载完成
const handleDataLoaded = (data: any[], count: number) => {
  total.value = count;
};
</script>

<style scoped>
.school-sync-container {
  padding: 16px;
  background-color: #f5f7fa;
}

.header-section {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-image: linear-gradient(to bottom, #f8f9fa, #ffffff);
  border: 1px solid #e6e6e6;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.header-title h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: bold;
}

.header-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.sync-list-section {
  background-color: #fff;
  padding: 24px;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e6e6e6;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.total-count {
  font-size: 16px;
  color: #606266;
}

.highlight {
  color: #ff6600;
  font-weight: bold;
  margin: 0 4px;
}

.sync-cards {
  margin-bottom: 24px;
}

.sync-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
  height: 100%;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background-color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.sync-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #ffcca6;
}

.sync-card-header {
  padding: 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.sync-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f7ff;
  border-radius: 8px;
  margin-right: 12px;
  flex-shrink: 0;
  color: #409eff;
  font-size: 24px;
}

.sync-basic-info {
  flex: 1;
  min-width: 0;
}

.sync-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sync-badges {
  display: flex;
  gap: 6px;
}

.sync-card-body {
  padding: 16px;
  flex: 1;
}

.sync-info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.sync-info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  color: #666;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: #333;
  display: flex;
  align-items: center;
  word-break: break-all;
}

.info-icon {
  font-size: 14px;
  color: #999;
  margin-right: 5px;
}

.sync-card-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.empty-state {
  background-color: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  text-align: center;
  border: 1px solid #e6e6e6;
}

.empty-text {
  color: #909399;
  font-size: 14px;
  margin: 10px 0 20px;
}

.empty-button {
  margin-top: 10px;
}

.button-icon {
  margin-right: 5px;
}

.hidden-table {
  margin-top: 15px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
