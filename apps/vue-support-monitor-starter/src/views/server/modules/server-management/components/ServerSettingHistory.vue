<template>
  <div class="server-setting-history">
    <!-- 头部操作�?-->
    <div class="history-header">
      <div class="header-left">
        <h3 class="history-title">
          <IconifyIconOnline icon="ri:history-line" class="mr-2" />
          配置变更历史
        </h3>
        <el-tag v-if="serverInfo" type="info" size="small">
          {{ serverInfo.monitorSysGenServerName }}
        </el-tag>
      </div>
      
      <div class="header-right">
        <el-button-group>
          <el-button 
            size="small" 
            @click="handleRefresh"
            :loading="loading"
          >
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            刷新
          </el-button>
          <el-button 
            size="small" 
            @click="handleExport"
            :loading="exportLoading"
          >
            <IconifyIconOnline icon="ri:download-line" class="mr-1" />
            导出
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <div class="statistics-cards" v-if="statistics">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ statistics.totalCount || 0 }}</div>
              <div class="stat-label">总变更次�?/div>
            </div>
            <IconifyIconOnline icon="ri:file-list-line" class="stat-icon" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ statistics.createCount || 0 }}</div>
              <div class="stat-label">创建次数</div>
            </div>
            <IconifyIconOnline icon="ri:add-circle-line" class="stat-icon create" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ statistics.updateCount || 0 }}</div>
              <div class="stat-label">更新次数</div>
            </div>
            <IconifyIconOnline icon="ri:edit-circle-line" class="stat-icon update" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ statistics.deleteCount || 0 }}</div>
              <div class="stat-label">删除次数</div>
            </div>
            <IconifyIconOnline icon="ri:delete-bin-line" class="stat-icon delete" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条�?-->
    <div class="filter-bar">
      <el-form :model="filterForm" inline>
        <el-form-item label="变更类型">
          <el-select 
            v-model="filterForm.changeType" 
            placeholder="全部类型"
            clearable
            @change="handleFilter"
          >
            <el-option 
              v-for="(name, type) in ChangeTypeNames" 
              :key="type"
              :label="name" 
              :value="type"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.timeRange"
            type="datetimerange"
            range-separator="�?
            start-placeholder="开始时�?
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            @change="handleFilter"
          />
        </el-form-item>
        
        <el-form-item label="变更用户">
          <el-input
            v-model="filterForm.changeUser"
            placeholder="请输入用户名"
            clearable
            @change="handleFilter"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-list">
      <el-table 
        :data="historyList" 
        v-loading="loading"
        stripe
        @row-click="handleRowClick"
        style="cursor: pointer;"
      >
        <el-table-column prop="changeTime" label="变更时间" width="180">
          <template #default="{ row }">
            <div class="time-cell">
              <IconifyIconOnline icon="ri:time-line" class="mr-1" />
              {{ formatTime(row.changeTime) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="changeType" label="变更类型" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="ChangeTypeColors[row.changeType]" 
              size="small"
            >
              {{ ChangeTypeNames[row.changeType] }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="changeDescription" label="变更描述" min-width="200">
          <template #default="{ row }">
            <div class="description-cell">
              {{ row.changeDescription }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="changeUser" label="变更用户" width="120">
          <template #default="{ row }">
            <div class="user-cell">
              <IconifyIconOnline icon="ri:user-line" class="mr-1" />
              {{ row.changeUser || '系统' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                type="primary" 
                text 
                size="small"
                @click.stop="handleViewDetail(row)"
              >
                <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                详情
              </el-button>
              
              <el-button 
                v-if="row.settingSnapshot"
                type="warning" 
                text 
                size="small"
                @click.stop="handleRestore(row)"
              >
                <IconifyIconOnline icon="ri:restart-line" class="mr-1" />
                恢复
              </el-button>
              
              <el-button 
                type="info" 
                text 
                size="small"
                @click.stop="handleCompare(row)"
              >
                <IconifyIconOnline icon="ri:git-compare-line" class="mr-1" />
                对比
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 历史详情对话�?-->
    <HistoryDetailDialog
      v-model:visible="detailDialogVisible"
      :history-data="selectedHistory"
      @restore="handleRestoreFromDetail"
    />

    <!-- 配置对比对话�?-->
    <HistoryCompareDialog
      v-model:visible="compareDialogVisible"
      :history-list="historyList"
      :selected-history="selectedHistory"
      @compare="handleCompareConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { message } from "@repo/utils";
import { getServerSettingHistory } from "@/api/server/setting";
import type { ServerInfo } from "@/api/server";
import HistoryDetailDialog from "./HistoryDetailDialog.vue";
import HistoryCompareDialog from "./HistoryCompareDialog.vue";
import { HistoryStatistics } from "@/api/server/settingHistory";

// 简化的历史记录类型定义
interface ServerSettingHistory {
  id: number;
  changeType: string;
  description: string;
  user: string;
  time: string;
}

// 变更类型显示名称
const ChangeTypeNames = {
  CREATE: "创建",
  UPDATE: "更新",
  DELETE: "删除",
  RESTORE: "恢复"
} as const;

// 变更类型颜色
const ChangeTypeColors = {
  CREATE: "success",
  UPDATE: "primary",
  DELETE: "danger",
  RESTORE: "warning"
} as const;

// 定义属�?
interface Props {
  serverId: number;
  serverInfo?: ServerInfo;
}

const props = defineProps<Props>();

// 定义事件
const emit = defineEmits<{
  back: [];
  restored: [historyId: number];
}>();

// 响应式状�?
const loading = ref(false);
const exportLoading = ref(false);
const historyList = ref<ServerSettingHistory[]>([]);
const statistics = ref<HistoryStatistics | null>(null);
const selectedHistory = ref<ServerSettingHistory | null>(null);
const detailDialogVisible = ref(false);
const compareDialogVisible = ref(false);

// 筛选表�?
const filterForm = reactive({
  changeType: "",
  timeRange: [] as string[],
  changeUser: ""
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

/**
 * 加载历史记录
 */
const loadHistoryList = async () => {
  try {
    loading.value = true;

    const result = await getServerSettingHistory(props.serverId, pagination.pageSize);

    if (result.code === '00000') {
      historyList.value = result.data || [];
      pagination.total = result.data?.length || 0;
    }
  } catch (error) {
    message.error("加载历史记录失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 加载统计信息
 */
const loadStatistics = async () => {
  try {
    // 简化统计信息，基于历史记录列表计算
    if (historyList.value.length > 0) {
      const stats = {
        totalCount: historyList.value.length,
        serverCount: 1,
        createCount: historyList.value.filter(h => h.changeType === 'CREATE').length,
        updateCount: historyList.value.filter(h => h.changeType === 'UPDATE').length,
        deleteCount: historyList.value.filter(h => h.changeType === 'DELETE').length,
        latestChangeTime: historyList.value[0]?.time || '',
        earliestChangeTime: historyList.value[historyList.value.length - 1]?.time || ''
      };
      statistics.value = stats;
    }
  } catch (error) {
    console.error("加载统计信息失败:", error);
  }
};

/**
 * 格式化时�?
 */
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadHistoryList();
  loadStatistics();
};

/**
 * 处理导出
 */
const handleExport = async () => {
  try {
    exportLoading.value = true;

    // 简化导出，直接导出当前历史记录列表
    const exportData = {
      serverId: props.serverId,
      exportTime: new Date().toISOString(),
      historyList: historyList.value
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `server-${props.serverId}-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    message.success("导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败");
  } finally {
    exportLoading.value = false;
  }
};

/**
 * 处理筛�?
 */
const handleFilter = () => {
  pagination.page = 1;
  loadHistoryList();
};

/**
 * 处理行点�?
 */
const handleRowClick = (row: ServerSettingHistory) => {
  selectedHistory.value = row;
  detailDialogVisible.value = true;
};

/**
 * 处理查看详情
 */
const handleViewDetail = (row: ServerSettingHistory) => {
  selectedHistory.value = row;
  detailDialogVisible.value = true;
};

/**
 * 处理恢复配置
 */
const handleRestore = async (row: ServerSettingHistory) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复到此历史配置吗？\n变更时间�?{formatTime(row.changeTime)}\n变更描述�?{row.changeDescription}`,
      "确认恢复",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    
    // 简化恢复功能，只是提示用户手动恢复
    message.info("请根据历史记录信息手动恢复配�?);
    emit("restored", row.id);
  } catch (error) {
    if (error !== "cancel") {
      console.error("恢复配置失败:", error);
      message.error("恢复配置失败");
    }
  }
};

/**
 * 处理对比
 */
const handleCompare = (row: ServerSettingHistory) => {
  selectedHistory.value = row;
  compareDialogVisible.value = true;
};

/**
 * 处理从详情恢�?
 */
const handleRestoreFromDetail = (historyId: number) => {
  const history = historyList.value.find(h => h.monitorSysGenServerSettingHistoryId === historyId);
  if (history) {
    handleRestore(history);
  }
};

/**
 * 处理对比确认
 */
const handleCompareConfirm = (historyId1: number, historyId2: number) => {
  // 实现对比逻辑
  console.log("对比历史记录:", historyId1, historyId2);
};

/**
 * 处理页面大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadHistoryList();
};

/**
 * 处理当前页变�?
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadHistoryList();
};

// 监听服务器ID变化
watch(() => props.serverId, () => {
  if (props.serverId) {
    handleRefresh();
  }
}, { immediate: true });

// 组件挂载时加载数�?
onMounted(() => {
  if (props.serverId) {
    handleRefresh();
  }
});
</script>

<style lang="scss" scoped>
.server-setting-history {
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .history-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;
      }
    }
  }

  .statistics-cards {
    margin-bottom: 20px;

    .stat-card {
      position: relative;
      overflow: hidden;

      :deep(.el-card__body) {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .stat-content {
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
           color: var(--el-text-color-primary);
        }
      }

      .stat-icon {
        font-size: 32px;
        color: #409eff;
        opacity: 0.8;

        &.create {
          color: #67c23a;
        }

        &.update {
          color: #e6a23c;
        }

        &.delete {
          color: #f56c6c;
        }
      }
    }
  }

  .filter-bar {
    margin-bottom: 20px;
    padding: 16px 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .history-list {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .time-cell,
    .user-cell {
      display: flex;
      align-items: center;
      color: #606266;
    }

    .description-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pagination-wrapper {
      padding: 20px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
