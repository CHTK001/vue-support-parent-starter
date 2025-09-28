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
            placeholder="状态筛选"
            clearable
            class="modern-filter"
            size="large"
          >
            <el-option label="全部状态" value="" />
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
            placeholder="分类筛选"
            clearable
            class="modern-filter"
            size="large"
          >
            <el-option label="全部分类" value="" />
            <el-option label="系统管理" value="system" />
            <el-option label="数据处理" value="data" />
            <el-option label="监控运维" value="monitor" />
            <el-option label="自动化" value="automation" />
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

    <!-- 现代化脚本网格 -->
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
                <span class="stat-label">最后更新</span>
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
                <span class="stat-label">运行状态</span>
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

      <!-- 空状态 -->
      <div v-if="filteredScripts.length === 0 && !loading" class="empty-state">
        <IconifyIconOnline icon="ri:file-text-line" class="empty-icon" />
        <p class="empty-text">暂无脚本</p>
        <el-button type="primary" @click="$emit('create')">
          创建第一个脚本
        </el-button>
      </div>
    </div>
    <!-- 上传对话框：挂在列表页，避免每卡片重复渲染 -->
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

// 上传对话框状态
const uploadDialogVisible = ref(false);
const selectedScriptId = ref<number | string | null>(null);
const openUpload = (script: any) => {
  selectedScriptId.value = script.monitorSysGenScriptId ?? script.id;
  uploadDialogVisible.value = true;
};

// 响应式数据
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

// 计算属性 - 直接使用实体字段名称，不进行映射
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

  // 按类型筛选
  if (filterType.value) {
    result = result.filter(
      (script) => script.monitorSysGenScriptType === filterType.value
    );
  }

  return result;
});

// 监听器
let searchTimer: NodeJS.Timeout;
watch([searchKeyword, filterType, filterStatus, filterCategory], () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    pagination.page = 1; // 重置页码
    loadScripts();
  }, 300);
});

// 初始化
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
      `确定要删除脚本 "${script.monitorSysGenScriptName}" 吗？`,
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

// 处理状态变化
const handleStatusChange = async (script: any) => {
  try {
    // 这里需要调用更新脚本状态的API
    // await updateServerScript({
    //   ...script,
    //   monitorSysGenScriptStatus: script.monitorSysGenScriptStatus
    // })
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 回滚状态
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

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    RUNNING: '运行中',
    SUCCESS: '成功',
    FAILED: '失败',
    PENDING: '等待中'
  }
  return textMap[status] || '未知'
}

// 临时格式化时间函数
const formatTime = (date: Date) => {
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
.modern-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(102, 126, 234, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border-radius: 0 0 20px 20px;

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;

    .search-container {
      .modern-search {
        width: 320px;
        
        :deep(.el-input__wrapper) {
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.08);
          border: 2px solid transparent;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 8px 16px;

          &:hover {
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
            transform: translateY(-2px);
          }

          &.is-focus {
            border-color: #667eea;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
            transform: translateY(-2px);
          }
        }

        .search-icon {
          color: #667eea;
          font-size: 18px;
        }
      }
    }

    .filter-container {
      display: flex;
      gap: 16px;
      align-items: center;

      .modern-filter {
        min-width: 140px;
        
        :deep(.el-input__wrapper) {
          border-radius: 14px;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          transition: all 0.3s ease;
          padding: 6px 12px;

          &:hover {
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.1);
            border-color: rgba(102, 126, 234, 0.3);
            transform: translateY(-1px);
          }
        }
      }

      .option-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .iconify {
          font-size: 16px;
        }
        
        .status-enabled {
          color: #48bb78;
        }
        
        .status-disabled {
          color: #f56565;
        }
      }
    }
  }

  .action-section {
    display: flex;
    gap: 12px;
    align-items: center;

    .create-btn {
      border-radius: 16px;
      font-weight: 600;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      }

      span {
        margin-left: 8px;
      }
    }

    .refresh-btn {
      border-radius: 14px;
      padding: 12px;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border: 1px solid rgba(226, 232, 240, 0.8);
      color: #4a5568;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
        border-color: rgba(102, 126, 234, 0.3);
      }
    }
  }

  @media (max-width: 1200px) {
    .toolbar-section {
      .search-container .modern-search {
        width: 280px;
      }
      
      .filter-container {
        gap: 12px;
        
        .modern-filter {
          min-width: 120px;
        }
      }
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    
    .toolbar-section {
      flex-direction: column;
      width: 100%;
      gap: 16px;
      
      .search-container .modern-search {
        width: 100%;
      }
      
      .filter-container {
        width: 100%;
        flex-wrap: wrap;
        
        .modern-filter {
          flex: 1;
          min-width: 100px;
        }
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
  padding: 32px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 28px;
  align-content: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 20px;
    gap: 20px;
  }

  @media (min-width: 1400px) {
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    gap: 32px;
  }

  @media (min-width: 1600px) {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
    gap: 36px;
  }
}

.modern-script-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    opacity: 0;
    transition: all 0.4s ease;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
    opacity: 0;
    transition: all 0.4s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(102, 126, 234, 0.15),
      0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: rgba(102, 126, 234, 0.3);

    &::before {
      opacity: 1;
    }

    &::after {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-4px) scale(1.01);
  }

  .card-header {
    padding: 24px 24px 16px;
    background: transparent;
    position: relative;
    z-index: 2;

    .script-info {
      .script-title-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;

        .script-name {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
          line-height: 1.3;
          margin: 0;
          flex: 1;
          margin-right: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          word-break: break-word;
        }

        .script-status {
          flex-shrink: 0;

          :deep(.el-switch) {
            --el-switch-on-color: #667eea;
            --el-switch-off-color: #ddd;
            
            .el-switch__core {
              border-radius: 12px;
              transition: all 0.3s ease;
            }
          }
        }
      }

      .script-meta {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;

        .script-type-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          padding: 6px 12px;
          border-radius: 12px;
          border: 1px solid rgba(102, 126, 234, 0.2);
          transition: all 0.3s ease;

          &:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
            border-color: rgba(102, 126, 234, 0.3);
            transform: translateY(-1px);
          }

          .type-icon {
            font-size: 14px;
            color: #667eea;
          }

          .type-text {
            font-size: 12px;
            font-weight: 600;
            color: #667eea;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }

        .script-category {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #64748b;
          font-size: 12px;
          font-weight: 500;

          .category-icon {
            font-size: 14px;
          }
        }
      }
    }

    .script-actions {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 3;

      .action-trigger {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(102, 126, 234, 0.2);
        color: #667eea;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;

        &:hover {
          background: rgba(102, 126, 234, 0.1);
          border-color: rgba(102, 126, 234, 0.4);
          transform: scale(1.1);
        }
      }

      .modern-dropdown {
        .el-dropdown-menu__item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          transition: all 0.3s ease;

          .menu-icon {
            font-size: 16px;
            width: 16px;

            &.danger {
              color: #ef4444;
            }
          }

          &:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            color: #667eea;

            .menu-icon.danger {
              color: #ef4444;
            }
          }
        }
      }
    }
  }

  .card-content {
    padding: 0 24px 20px;
    position: relative;
    z-index: 2;

    .script-description {
      margin-bottom: 20px;

      .description-text {
        color: #64748b;
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 44px;
        font-weight: 400;
        background: rgba(248, 250, 252, 0.6);
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid rgba(226, 232, 240, 0.5);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(248, 250, 252, 0.8);
          border-color: rgba(102, 126, 234, 0.2);
        }
      }
    }

    .script-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%);
        border: 1px solid rgba(226, 232, 240, 0.5);
        border-radius: 12px;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);

        &:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          border-color: rgba(102, 126, 234, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .stat-icon {
          font-size: 18px;
          color: #667eea;
          flex-shrink: 0;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;

          .stat-label {
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .stat-value {
            font-size: 14px;
            color: #334155;
            font-weight: 600;

            &.status-running {
              color: #f59e0b;
            }

            &.status-success {
              color: #10b981;
            }

            &.status-failed {
              color: #ef4444;
            }

            &.status-pending {
              color: #6b7280;
            }

            &.status-unknown {
              color: #9ca3af;
            }
          }
        }
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 24px;
    background: linear-gradient(
      135deg,
      rgba(248, 250, 252, 0.8) 0%,
      rgba(241, 245, 249, 0.6) 100%
    );
    border-top: 1px solid rgba(226, 232, 240, 0.5);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 2;

    .footer-left {
      flex: 1;
      display: flex;
      align-items: center;

      .script-tags {
        display: flex;
        gap: 6px;
        align-items: center;
        flex-wrap: wrap;

        .script-tag {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border: 1px solid rgba(102, 126, 234, 0.2);
          color: #667eea;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
          padding: 4px 8px;
          transition: all 0.3s ease;

          &:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
            border-color: rgba(102, 126, 234, 0.3);
            transform: translateY(-1px);
          }
        }

        .more-tags {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          padding: 4px 6px;
          background: rgba(148, 163, 184, 0.1);
          border-radius: 6px;
        }
      }

      .script-status {
        .el-tag {
          border-radius: 16px;
          font-weight: 600;
          font-size: 11px;
          border: none;
          padding: 6px 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          &.el-tag--success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
          }

          &.el-tag--info {
            background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
            color: #ffffff;
          }
        }
      }
    }

    .footer-actions {
      display: flex;
      gap: 8px;
      align-items: center;

      .action-btn {
        border-radius: 12px;
        font-weight: 600;
        font-size: 12px;
        padding: 8px 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        display: flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        min-height: 36px;

        .btn-icon {
          font-size: 14px;
        }

        &.primary-action {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px var(--el-shadow-color);

          &:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
          }
        }

        &.secondary-action {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
          color: #64748b;
          border: 1px solid rgba(226, 232, 240, 0.8);
          backdrop-filter: blur(10px);

          &:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            color: #667eea;
            border-color: rgba(102, 126, 234, 0.3);
            transform: translateY(-1px);
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
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  margin: 20px;

  .empty-icon {
    font-size: 80px;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .empty-text {
    font-size: 18px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 24px;
  }

  .el-button {
    border-radius: 12px;
    font-weight: 600;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    }
  }
}
</style>
