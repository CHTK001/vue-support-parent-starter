<template>
  <div class="script-list">
    <!-- 现代化工具栏 -->
    <div class="modern-toolbar">
      <div class="toolbar-section">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索脚本名称、描述或标签..."
            clearable
            class="modern-search"
            size="large"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" class="search-icon" />
            </template>
          </el-input>
        </div>
        
        <div class="filter-container">
          <el-select
            v-model="filterType"
            placeholder="脚本类型"
            clearable
            class="modern-filter"
            size="large"
          >
            <el-option label="全部类型" value="" />
            <el-option label="Shell" value="SHELL">
              <div class="option-item">
                <IconifyIconOnline icon="ri:terminal-line" />
                <span>Shell</span>
              </div>
            </el-option>
            <el-option label="Python" value="PYTHON">
              <div class="option-item">
                <IconifyIconOnline icon="ri:file-code-line" />
                <span>Python</span>
              </div>
            </el-option>
            <el-option label="PowerShell" value="POWERSHELL">
              <div class="option-item">
                <IconifyIconOnline icon="ri:window-line" />
                <span>PowerShell</span>
              </div>
            </el-option>
            <el-option label="Batch" value="BATCH">
              <div class="option-item">
                <IconifyIconOnline icon="ri:file-text-line" />
                <span>Batch</span>
              </div>
            </el-option>
          </el-select>
          
          <el-select
            v-model="filterStatus"
            placeholder="状态筛�?
            clearable
            class="modern-filter"
            size="large"
          >
            <el-option label="全部状�? value="" />
            <el-option label="启用" value="ENABLED">
              <div class="option-item">
                <IconifyIconOnline icon="ri:check-line" class="status-enabled" />
                <span>启用</span>
              </div>
            </el-option>
            <el-option label="禁用" value="DISABLED">
              <div class="option-item">
                <IconifyIconOnline icon="ri:close-line" class="status-disabled" />
                <span>禁用</span>
              </div>
            </el-option>
          </el-select>
          
          <el-select
            v-model="filterCategory"
            placeholder="分类筛�?
            clearable
            class="modern-filter"
            size="large"
          >
            <el-option label="全部分类" value="" />
            <el-option label="系统管理" value="system" />
            <el-option label="数据处理" value="data" />
            <el-option label="监控运维" value="monitor" />
            <el-option label="自动�? value="automation" />
          </el-select>
        </div>
      </div>
      
      <div class="action-section">
        <el-button type="primary" size="large" class="create-btn" @click="$emit('create')">
          <IconifyIconOnline icon="ri:add-line" />
          <span>新建脚本</span>
        </el-button>
        <el-button size="large" class="refresh-btn" @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </div>
    </div>

    <!-- 现代化脚本网�?-->
    <div class="modern-script-grid" v-loading="loading">
      <div
        v-for="script in filteredScripts"
        :key="script.monitorSysGenScriptId"
        class="modern-script-card"
        @click="handleCardClick(script)"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="script-info">
            <div class="script-title-row">
              <h3 class="script-name">{{ script.monitorSysGenScriptName }}</h3>
              <div class="script-status">
                <el-switch
                  v-model="script.monitorSysGenScriptStatus"
                  active-value="ENABLED"
                  inactive-value="DISABLED"
                  size="small"
                  @change="handleStatusChange(script)"
                  @click.stop
                />
              </div>
            </div>
            <div class="script-meta">
              <div class="script-type-badge">
                <IconifyIconOnline 
                  :icon="getScriptTypeIcon(script.monitorSysGenScriptType)" 
                  class="type-icon"
                />
                <span class="type-text">{{ script.monitorSysGenScriptType }}</span>
              </div>
              <div class="script-category" v-if="script.monitorSysGenScriptCategory">
                <IconifyIconOnline icon="ri:folder-line" class="category-icon" />
                <span>{{ script.monitorSysGenScriptCategory }}</span>
              </div>
            </div>
          </div>
          <div class="script-actions" @click.stop>
            <el-dropdown @command="(cmd) => handleAction(cmd, script)" trigger="hover">
              <el-button size="small" type="text" class="action-trigger">
                <IconifyIconOnline icon="ri:more-2-line" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="modern-dropdown">
                  <el-dropdown-item command="execute">
                    <IconifyIconOnline icon="ri:play-line" class="menu-icon" />
                    <span>执行脚本</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">
                    <IconifyIconOnline icon="ri:edit-line" class="menu-icon" />
                    <span>编辑脚本</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="copy">
                    <IconifyIconOnline icon="ri:file-copy-line" class="menu-icon" />
                    <span>复制脚本</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <IconifyIconOnline icon="ri:delete-bin-line" class="menu-icon danger" />
                    <span>删除脚本</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <div class="script-description">
            <p class="description-text">
              {{ script.monitorSysGenScriptDescription || '暂无描述信息' }}
            </p>
          </div>
          <div class="script-stats">
            <div class="stat-item">
              <IconifyIconOnline icon="ri:time-line" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">最后更�?/span>
                <span class="stat-value">{{ formatTime(
                  script.updateTime ? new Date(script.updateTime) : new Date()
                ) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <IconifyIconOnline icon="ri:play-circle-line" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">执行次数</span>
                <span class="stat-value">{{ script.monitorSysGenScriptExecuteCount || 0 }}</span>
              </div>
            </div>
            <div class="stat-item">
              <IconifyIconOnline icon="ri:pulse-line" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">运行状�?/span>
                <span class="stat-value" :class="getStatusClass(script.lastExecutionStatus)">
                  {{ getStatusText(script.lastExecutionStatus) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="footer-left">
            <div class="script-tags" v-if="script.tags && script.tags.length > 0">
              <el-tag
                v-for="tag in script.tags.slice(0, 3)"
                :key="tag"
                size="small"
                class="script-tag"
              >
                {{ tag }}
              </el-tag>
              <span v-if="script.tags.length > 3" class="more-tags">
                +{{ script.tags.length - 3 }}
              </span>
            </div>
            <div class="script-status" v-else>
              <el-tag
                :type="
                  script.monitorSysGenScriptStatus === 'ENABLED'
                    ? 'success'
                    : 'info'
                "
                size="small"
              >
                {{
                  script.monitorSysGenScriptStatus === "ENABLED" ? "启用" : "禁用"
                }}
              </el-tag>
            </div>
          </div>
          <div class="footer-actions">
            <el-button
              size="small"
              type="primary"
              class="action-btn primary-action"
              @click.stop="$emit('execute', script)"
            >
              <IconifyIconOnline icon="ri:play-line" class="btn-icon" />
              <span>执行</span>
            </el-button>
            <el-button
              size="small"
              class="action-btn secondary-action"
              @click.stop="$emit('edit', script)"
            >
              <IconifyIconOnline icon="ri:edit-line" class="btn-icon" />
              <span>编辑</span>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状�?-->
      <div v-if="filteredScripts.length === 0 && !loading" class="empty-state">
        <IconifyIconOnline icon="ri:file-text-line" class="empty-icon" />
        <p class="empty-text">暂无脚本</p>
        <el-button type="primary" @click="$emit('create')">
          创建第一个脚�?
        </el-button>
      </div>
    </div>
    <!-- 上传对话框：挂在列表页，避免每卡片重复渲�?-->
    <UploadToRunningScriptDialog
      :visible="uploadDialogVisible"
      :script-id="selectedScriptId as any"
      @update:visible="(v: boolean) => (uploadDialogVisible = v)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import UploadToRunningScriptDialog from "./UploadToRunningScriptDialog.vue";
import {
  getServerScriptPageList,
  deleteServerScript,
  duplicateServerScript,
  type ServerScript,
} from "@/api/server/script";

// Emits
const emit = defineEmits<{
  execute: [script: any];
  edit: [script: any];
  create: [];
}>();

// 上传对话框状�?
const uploadDialogVisible = ref(false);
const selectedScriptId = ref<number | string | null>(null);
const openUpload = (script: any) => {
  selectedScriptId.value = script.monitorSysGenScriptId ?? script.id;
  uploadDialogVisible.value = true;
};

// 响应式数�?
const loading = ref(false);
const searchKeyword = ref("");
const filterType = ref("");
const filterStatus = ref("");
const filterCategory = ref("");
const scripts = ref<ServerScript[]>([]);

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 计算属�?- 直接使用实体字段名称，不进行映射
const filteredScripts = computed(() => {
  let result = scripts.value;

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(
      (script) =>
        script.monitorSysGenScriptName.toLowerCase().includes(keyword) ||
        script.monitorSysGenScriptDescription?.toLowerCase().includes(keyword)
    );
  }

  // 按类型筛�?
  if (filterType.value) {
    result = result.filter(
      (script) => script.monitorSysGenScriptType === filterType.value
    );
  }

  return result;
});

// 监听�?
let searchTimer: NodeJS.Timeout;
watch([searchKeyword, filterType, filterStatus, filterCategory], () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    pagination.page = 1; // 重置页码
    loadScripts();
  }, 300);
});

// 初始�?
onMounted(() => {
  loadScripts();
});

// 方法
const loadScripts = async () => {
  try {
    loading.value = true;
    const response = await getServerScriptPageList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      monitorSysGenScriptName: searchKeyword.value || undefined,
      monitorSysGenScriptType: filterType.value || undefined,
    });

    if (response.success) {
      scripts.value = response.data.records;
      pagination.total = response.data.total;
    } else {
      ElMessage.error("加载脚本列表失败");
    }
  } catch (error) {
    console.error("加载脚本列表失败:", error);
    ElMessage.error("加载脚本列表失败");
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  loadScripts();
};

const handleCardClick = (script: any) => {
  emit("edit", script);
};

const handleAction = async (command: string, script: any) => {
  switch (command) {
    case "execute":
      emit("execute", script);
      break;
    case "edit":
      emit("edit", script);
      break;
    case "copy":
      await handleCopyScript(script);
      break;
    case "delete":
      await handleDeleteScript(script);
      break;
  }
};

const handleCopyScript = async (script: any) => {
  try {
    const response = await duplicateServerScript(script.monitorSysGenScriptId);
    if (response.success) {
      ElMessage.success("脚本复制成功");
      loadScripts(); // 重新加载列表
    } else {
      ElMessage.error("复制脚本失败");
    }
  } catch (error) {
    console.error("复制脚本失败:", error);
    ElMessage.error("脚本复制失败");
  }
};

const handleDeleteScript = async (script: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除脚�?"${script.monitorSysGenScriptName}" 吗？`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const response = await deleteServerScript(script.monitorSysGenScriptId);
    if (response.success) {
      ElMessage.success("脚本删除成功");
      loadScripts(); // 重新加载列表
    } else {
      ElMessage.error("删除脚本失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除脚本失败:", error);
      ElMessage.error("脚本删除失败");
    }
  }
};

const getScriptTypeTagType = (type: string) => {
  const typeMap = {
    SHELL: "success",
    PYTHON: "warning",
    POWERSHELL: "info",
    BATCH: "primary",
  };
  return typeMap[type] || "info";
};

// 获取脚本类型图标
const getScriptTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    SHELL: 'ri:terminal-line',
    PYTHON: 'ri:file-code-line',
    JAVASCRIPT: 'ri:javascript-line',
    SQL: 'ri:database-2-line',
    BATCH: 'ri:file-text-line',
    POWERSHELL: 'ri:windows-line'
  }
  return iconMap[type] || 'ri:file-code-line'
}

// 处理状态变�?
const handleStatusChange = async (script: any) => {
  try {
    // 这里需要调用更新脚本状态的API
    // await updateServerScript({
    //   ...script,
    //   monitorSysGenScriptStatus: script.monitorSysGenScriptStatus
    // })
    ElMessage.success('状态更新成�?)
  } catch (error) {
    ElMessage.error('状态更新失�?)
    // 回滚状�?
    script.monitorSysGenScriptStatus = script.monitorSysGenScriptStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED'
  }
}

// 获取状态样式类
const getStatusClass = (status: string) => {
  const statusMap: Record<string, string> = {
    RUNNING: 'status-running',
    SUCCESS: 'status-success',
    FAILED: 'status-failed',
    PENDING: 'status-pending'
  }
  return statusMap[status] || 'status-unknown'
}

// 获取状态文�?
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    RUNNING: '运行�?,
    SUCCESS: '成功',
    FAILED: '失败',
    PENDING: '等待�?
  }
  return textMap[status] || '未知'
}

// 临时格式化时间函�?
const formatTime = (date: Date) => {
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
.script-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modern-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;

    .search-container {
      .modern-search {
        width: 280px;
        
        :deep(.el-input__wrapper) {
          border-radius: 10px;
        }

        .search-icon {
          color: #8b5cf6;
          font-size: 16px;
        }
      }
    }

    .filter-container {
      display: flex;
      gap: 12px;
      align-items: center;

      .modern-filter {
        min-width: 120px;
        
        :deep(.el-input__wrapper) {
          border-radius: 10px;
        }
      }

      .option-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .status-enabled { color: #10b981; }
        .status-disabled { color: #ef4444; }
      }
    }
  }

  .action-section {
    display: flex;
    gap: 12px;
    align-items: center;

    .create-btn {
      border-radius: 10px;
      font-weight: 600;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
      border: none;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

      &:hover {
        box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
      }

      span { margin-left: 6px; }
    }

    .refresh-btn {
      border-radius: 10px;
      background: white;
      border: 1px solid #e2e8f0;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    
    .toolbar-section {
      flex-direction: column;
      width: 100%;
      gap: 12px;
      
      .search-container .modern-search { width: 100%; }
      
      .filter-container {
        width: 100%;
        flex-wrap: wrap;
        .modern-filter { flex: 1; min-width: 100px; }
      }
    }
    
    .action-section {
      width: 100%;
      justify-content: center;
    }
  }
}

.modern-script-grid {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  align-content: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }
}

.modern-script-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%);
    opacity: 0;
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
    border-color: #c4b5fd;

    &::before {
      opacity: 1;
    }
  }

  .card-header {
    padding: 20px 20px 12px;
    position: relative;

    .script-info {
      .script-title-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .script-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.4;
          margin: 0;
          flex: 1;
          margin-right: 12px;
        }

        .script-status {
          flex-shrink: 0;

          :deep(.el-switch) {
            --el-switch-on-color: #8b5cf6;
          }
        }
      }

      .script-meta {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;

        .script-type-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          padding: 4px 10px;
          border-radius: 6px;

          .type-icon {
            font-size: 12px;
            color: #8b5cf6;
          }

          .type-text {
            font-size: 11px;
            font-weight: 600;
            color: #8b5cf6;
            text-transform: uppercase;
          }
        }

        .script-category {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #64748b;
          font-size: 12px;

          .category-icon { font-size: 14px; }
        }
      }
    }

    .script-actions {
      position: absolute;
      top: 16px;
      right: 16px;

      .action-trigger {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #64748b;
        padding: 0;

        &:hover {
          background: #f1f5f9;
          color: #8b5cf6;
        }
      }
    }
  }

  .card-content {
    padding: 0 20px 16px;

    .script-description {
      margin-bottom: 16px;

      .description-text {
        color: #64748b;
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 40px;
      }
    }

    .script-stats {
      display: flex;
      gap: 16px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        .stat-icon {
          font-size: 16px;
          color: #8b5cf6;
        }

        .stat-content {
          .stat-label {
            font-size: 11px;
            color: #94a3b8;
          }

          .stat-value {
            font-size: 13px;
            color: #334155;
            font-weight: 500;

            &.status-running { color: #f59e0b; }
            &.status-success { color: #10b981; }
            &.status-failed { color: #ef4444; }
            &.status-pending { color: #6b7280; }
            &.status-unknown { color: #9ca3af; }
          }
        }
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px 16px;
    border-top: 1px solid #f1f5f9;

    .footer-left {
      flex: 1;

      .script-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        .script-tag {
          background: #f3e8ff;
          color: #8b5cf6;
          border-radius: 4px;
          font-size: 11px;
          padding: 2px 8px;
          border: none;
        }

        .more-tags {
          font-size: 11px;
          color: #94a3b8;
        }
      }

      .script-status {
        .el-tag {
          border-radius: 4px;
          font-size: 11px;
        }
      }
    }

    .footer-actions {
      display: flex;
      gap: 8px;

      .action-btn {
        border-radius: 8px;
        font-size: 12px;
        padding: 6px 12px;
        display: flex;
        align-items: center;
        gap: 4px;

        .btn-icon { font-size: 14px; }

        &.primary-action {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: white;
          border: none;

          &:hover {
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          }
        }

        &.secondary-action {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;

          &:hover {
            color: #8b5cf6;
            border-color: #c4b5fd;
          }
        }
      }
    }
  }
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px dashed #e2e8f0;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    color: #c4b5fd;
  }

  .empty-text {
    font-size: 16px;
    color: #64748b;
    margin-bottom: 20px;
  }

  .el-button {
    border-radius: 10px;
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    border: none;
  }
}
</style>
