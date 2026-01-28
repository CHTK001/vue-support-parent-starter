<template>
  <div class="setting-history-container system-container modern-bg">
    <!-- 工具栏 -->
    <div class="toolbar-section">
      <el-card class="toolbar-card" shadow="never">
        <div class="toolbar-container">
          <div class="toolbar-left">
            <el-input
              v-model="searchForm.group"
              placeholder="配置分组"
              class="filter-input"
              clearable
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">
              <i class="ri-search-line"></i>
              搜索
            </el-button>
            <el-button @click="handleRefresh">
              <i class="ri-refresh-line"></i>
              刷新
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-button type="success" @click="handleExport">
              <i class="ri-download-line"></i>
              导出配置
            </el-button>
            <el-button type="warning" @click="handleImportDialog">
              <i class="ri-upload-line"></i>
              导入配置
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-section">
      <el-card shadow="never">
        <el-table
          v-loading="loading"
          :data="historyList"
          row-key="sysSettingHistoryId"
          stripe
          border
        >
          <el-table-column prop="sysSettingHistoryId" label="ID" width="80" align="center" />
          <el-table-column prop="sysSettingGroup" label="分组" width="120" />
          <el-table-column prop="sysSettingName" label="配置名称" min-width="150" />
          <el-table-column label="操作类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getOperationTagType(row.sysSettingOperation)" size="small">
                {{ getOperationLabel(row.sysSettingOperation) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="旧值" min-width="150">
            <template #default="{ row }">
              <el-tooltip v-if="row.sysSettingOldValue" :content="row.sysSettingOldValue" placement="top">
                <span class="value-cell">{{ truncateValue(row.sysSettingOldValue) }}</span>
              </el-tooltip>
              <span v-else class="empty-value">-</span>
            </template>
          </el-table-column>
          <el-table-column label="新值" min-width="150">
            <template #default="{ row }">
              <el-tooltip v-if="row.sysSettingNewValue" :content="row.sysSettingNewValue" placement="top">
                <span class="value-cell">{{ truncateValue(row.sysSettingNewValue) }}</span>
              </el-tooltip>
              <span v-else class="empty-value">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="sysSettingOperatorName" label="操作人" width="100" />
          <el-table-column prop="sysSettingRemark" label="备注" width="120" />
          <el-table-column prop="createTime" label="操作时间" width="170" />
          <el-table-column label="批次号" width="130">
            <template #default="{ row }">
              <el-link type="primary" @click="handleViewBatch(row.sysSettingBatchNo)">
                {{ truncateBatchNo(row.sysSettingBatchNo) }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="handleViewDetail(row)">
                详情
              </el-button>
              <el-button 
                size="small" 
                type="warning" 
                @click="handleRollbackSingle(row)"
                :disabled="row.sysSettingOperation === 'ROLLBACK'"
              >
                回滚
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSearch"
            @current-change="handleSearch"
          />
        </div>
      </el-card>
    </div>

    <!-- 历史详情对话框 -->
    <sc-dialog v-model="detailDialogVisible" title="变更详情" width="700px">
      <div v-if="currentHistory" class="history-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentHistory.sysSettingHistoryId }}</el-descriptions-item>
          <el-descriptions-item label="配置ID">{{ currentHistory.sysSettingId }}</el-descriptions-item>
          <el-descriptions-item label="分组">{{ currentHistory.sysSettingGroup }}</el-descriptions-item>
          <el-descriptions-item label="配置名称">{{ currentHistory.sysSettingName }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getOperationTagType(currentHistory.sysSettingOperation)">
              {{ getOperationLabel(currentHistory.sysSettingOperation) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ currentHistory.createTime }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentHistory.sysSettingOperatorName }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentHistory.sysSettingBatchNo }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentHistory.sysSettingRemark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="旧值" :span="2">
            <pre class="value-content">{{ currentHistory.sysSettingOldValue || '-' }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="新值" :span="2">
            <pre class="value-content">{{ currentHistory.sysSettingNewValue || '-' }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          type="warning" 
          @click="handleRollbackSingle(currentHistory)"
          :disabled="currentHistory?.sysSettingOperation === 'ROLLBACK'"
        >
        回滚此变更
        </el-button>
      </template>
    </sc-dialog>

    <!-- 批次详情对话框 -->
    <sc-dialog v-model="batchDialogVisible" title="批次变更详情" width="900px">
      <el-table :data="batchHistoryList" stripe border>
        <el-table-column prop="sysSettingName" label="配置名称" min-width="150" />
        <el-table-column prop="sysSettingGroup" label="分组" width="120" />
        <el-table-column label="操作类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getOperationTagType(row.sysSettingOperation)" size="small">
              {{ getOperationLabel(row.sysSettingOperation) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="旧值" min-width="150">
          <template #default="{ row }">
            <el-tooltip v-if="row.sysSettingOldValue" :content="row.sysSettingOldValue" placement="top">
              <span class="value-cell">{{ truncateValue(row.sysSettingOldValue) }}</span>
            </el-tooltip>
            <span v-else class="empty-value">-</span>
          </template>
        </el-table-column>
        <el-table-column label="新值" min-width="150">
          <template #default="{ row }">
            <el-tooltip v-if="row.sysSettingNewValue" :content="row.sysSettingNewValue" placement="top">
              <span class="value-cell">{{ truncateValue(row.sysSettingNewValue) }}</span>
            </el-tooltip>
            <span v-else class="empty-value">-</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchDialogVisible = false">关闭</el-button>
        <el-button type="warning" @click="handleRollbackBatch">
          回滚整个批次
        </el-button>
      </template>
    </sc-dialog>

    <!-- 导入配置对话框 -->
    <sc-dialog v-model="importDialogVisible" title="导入配置" width="600px">
      <el-form label-width="100px">
        <el-form-item label="配置数据">
          <el-input
            v-model="importJson"
            type="textarea"
            :rows="12"
            placeholder="请粘贴导出的 JSON 配置数据"
          />
        </el-form-item>
        <el-form-item label="覆盖选项">
          <el-switch v-model="importOverwrite" active-text="覆盖已存在配置" inactive-text="跳过已存在配置" />
        </el-form-item>
        <el-form-item>
          <el-upload
            action=""
            :auto-upload="false"
            :show-file-list="false"
            accept=".json"
            @change="handleFileChange"
          >
            <el-button type="primary">
              <i class="ri-file-upload-line"></i>
              从文件加载
            </el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImport">
          确认导入
        </el-button>
      </template>
    </sc-dialog>

    <!-- 导出配置对话框 -->
    <sc-dialog v-model="exportDialogVisible" title="导出配置" width="600px">
      <el-form label-width="100px">
        <el-form-item label="配置分组">
          <el-input
            v-model="exportGroup"
            placeholder="留空导出全部配置，填写则只导出指定分组"
            clearable
          />
        </el-form-item>
      </el-form>
      <div v-if="exportedJson" class="export-result">
        <el-input
          v-model="exportedJson"
          type="textarea"
          :rows="12"
          readonly
        />
        <div class="export-actions">
          <el-button type="primary" @click="handleCopyExport">
            <i class="ri-file-copy-line"></i>
            复制到剪贴板
          </el-button>
          <el-button type="success" @click="handleDownloadExport">
            <i class="ri-download-line"></i>
            下载 JSON 文件
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="exportLoading" @click="handleExportConfirm">
          {{ exportedJson ? '重新导出' : '确认导出' }}
        </el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  fetchHistoryPage,
  fetchHistoryByBatch,
  fetchRollbackBatch,
  fetchRollbackSingle,
  fetchExportSettings,
  fetchImportSettings,
  type SettingHistory,
} from "../api/history";

// 状态
const loading = ref(false);
const importLoading = ref(false);
const exportLoading = ref(false);
const detailDialogVisible = ref(false);
const batchDialogVisible = ref(false);
const importDialogVisible = ref(false);
const exportDialogVisible = ref(false);

// 搜索表单
const searchForm = reactive({
  group: "",
  settingId: undefined as number | undefined,
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 历史记录列表
const historyList = ref<SettingHistory[]>([]);

// 当前查看的历史记录
const currentHistory = ref<SettingHistory | null>(null);

// 批次历史记录列表
const batchHistoryList = ref<SettingHistory[]>([]);
const currentBatchNo = ref("");

// 导入配置
const importJson = ref("");
const importOverwrite = ref(false);

// 导出配置
const exportGroup = ref("");
const exportedJson = ref("");

// 操作类型映射
const operationMap: Record<string, { label: string; type: string }> = {
  CREATE: { label: "新增", type: "success" },
  UPDATE: { label: "更新", type: "warning" },
  DELETE: { label: "删除", type: "danger" },
  IMPORT: { label: "导入", type: "info" },
  ROLLBACK: { label: "回滚", type: "" },
};

const getOperationLabel = (operation: string) => {
  return operationMap[operation]?.label || operation;
};

const getOperationTagType = (operation: string): any => {
  return operationMap[operation]?.type || "";
};

const truncateValue = (value: string, maxLength = 50) => {
  if (!value) return "-";
  return value.length > maxLength ? value.substring(0, maxLength) + "..." : value;
};

const truncateBatchNo = (batchNo: string) => {
  if (!batchNo) return "-";
  return batchNo.substring(0, 8) + "...";
};

// 加载历史记录
const loadHistoryList = async () => {
  loading.value = true;
  try {
    const response = await fetchHistoryPage({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    if (response.success) {
      historyList.value = response.data?.records || [];
      pagination.total = response.data?.total || 0;
    } else {
      ElMessage.error(response.msg || "加载历史记录失败");
    }
  } catch (error) {
    console.error("加载历史记录失败:", error);
    ElMessage.error("加载历史记录失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadHistoryList();
};

// 刷新
const handleRefresh = () => {
  loadHistoryList();
};

// 查看详情
const handleViewDetail = (row: SettingHistory) => {
  currentHistory.value = row;
  detailDialogVisible.value = true;
};

// 查看批次详情
const handleViewBatch = async (batchNo: string) => {
  currentBatchNo.value = batchNo;
  try {
    const response = await fetchHistoryByBatch(batchNo);
    if (response.success) {
      batchHistoryList.value = response.data || [];
      batchDialogVisible.value = true;
    } else {
      ElMessage.error(response.msg || "加载批次详情失败");
    }
  } catch (error) {
    console.error("加载批次详情失败:", error);
    ElMessage.error("加载批次详情失败");
  }
};

// 回滚单条记录
const handleRollbackSingle = async (row: SettingHistory | null) => {
  if (!row) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要回滚配置 "${row.sysSettingName}" 的变更吗？这将撤销此次操作。`,
      "确认回滚",
      { type: "warning" }
    );
    
    const response = await fetchRollbackSingle(row.sysSettingHistoryId);
    if (response.success) {
      ElMessage.success("回滚成功");
      detailDialogVisible.value = false;
      loadHistoryList();
    } else {
      ElMessage.error(response.msg || "回滚失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("回滚失败:", error);
      ElMessage.error("回滚失败");
    }
  }
};

// 回滚整个批次
const handleRollbackBatch = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要回滚批次 "${currentBatchNo.value}" 的所有变更吗？这将撤销该批次的所有操作。`,
      "确认回滚",
      { type: "warning" }
    );
    
    const response = await fetchRollbackBatch(currentBatchNo.value);
    if (response.success) {
      ElMessage.success("批次回滚成功");
      batchDialogVisible.value = false;
      loadHistoryList();
    } else {
      ElMessage.error(response.msg || "批次回滚失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批次回滚失败:", error);
      ElMessage.error("批次回滚失败");
    }
  }
};

// 打开导出对话框
const handleExport = () => {
  exportGroup.value = "";
  exportedJson.value = "";
  exportDialogVisible.value = true;
};

// 确认导出
const handleExportConfirm = async () => {
  exportLoading.value = true;
  try {
    const response = await fetchExportSettings(exportGroup.value || undefined);
    if (response.success) {
      exportedJson.value = response.data || "";
      ElMessage.success("导出成功");
    } else {
      ElMessage.error(response.msg || "导出失败");
    }
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败");
  } finally {
    exportLoading.value = false;
  }
};

// 复制导出结果
const handleCopyExport = async () => {
  try {
    await navigator.clipboard.writeText(exportedJson.value);
    ElMessage.success("已复制到剪贴板");
  } catch (error) {
    ElMessage.error("复制失败，请手动选择复制");
  }
};

// 下载导出结果
const handleDownloadExport = () => {
  const blob = new Blob([exportedJson.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `settings_${exportGroup.value || "all"}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  ElMessage.success("下载成功");
};

// 打开导入对话框
const handleImportDialog = () => {
  importJson.value = "";
  importOverwrite.value = false;
  importDialogVisible.value = true;
};

// 处理文件选择
const handleFileChange = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    importJson.value = e.target?.result as string;
  };
  reader.readAsText(file.raw);
};

// 确认导入
const handleImport = async () => {
  if (!importJson.value.trim()) {
    ElMessage.warning("请输入配置数据");
    return;
  }

  try {
    // 验证JSON格式
    JSON.parse(importJson.value);
  } catch (error) {
    ElMessage.error("JSON格式错误，请检查输入");
    return;
  }

  importLoading.value = true;
  try {
    const response = await fetchImportSettings(importJson.value, importOverwrite.value);
    if (response.success) {
      ElMessage.success(`导入成功，批次号: ${response.data}`);
      importDialogVisible.value = false;
      loadHistoryList();
    } else {
      ElMessage.error(response.msg || "导入失败");
    }
  } catch (error) {
    console.error("导入失败:", error);
    ElMessage.error("导入失败");
  } finally {
    importLoading.value = false;
  }
};

onMounted(() => {
  loadHistoryList();
});
</script>

<style scoped lang="scss">
.setting-history-container {
  padding: 16px;
  min-height: 100%;
  background-color: var(--el-bg-color-page);

  .toolbar-section {
    margin-bottom: 16px;

    .toolbar-card {
      :deep(.el-card__body) {
        padding: 12px 16px;
      }
    }

    .toolbar-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .filter-input {
          width: 200px;
        }
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
  }

  .history-section {
    .pagination-container {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .value-cell {
    display: inline-block;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .empty-value {
    color: var(--el-text-color-placeholder);
  }

  .history-detail,
  .export-result {
    .value-content {
      margin: 0;
      padding: 8px;
      background-color: var(--el-fill-color-lighter);
      border-radius: 4px;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }
  }

  .export-result {
    margin-top: 16px;

    .export-actions {
      margin-top: 12px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  }
}
</style>
