<template>
  <div class="script-list">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索脚本..."
          size="small"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="filterType"
          placeholder="脚本类型"
          size="small"
          style="width: 120px"
          clearable
        >
          <el-option label="Shell" value="SHELL" />
          <el-option label="Python" value="PYTHON" />
          <el-option label="PowerShell" value="POWERSHELL" />
          <el-option label="Batch" value="BATCH" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" size="small" @click="$emit('create')">
          <IconifyIconOnline icon="ri:add-line" />
          新建脚本
        </el-button>
        <el-button size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
      </div>
    </div>

    <!-- 脚本卡片列表 -->
    <div class="script-cards" v-loading="loading">
      <div
        v-for="script in filteredScripts"
        :key="script.monitorSysGenScriptId"
        class="script-card"
        @click="handleCardClick(script)"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="script-info">
            <div class="script-name">{{ script.monitorSysGenScriptName }}</div>
            <div class="script-type">
              <el-tag
                :type="getScriptTypeTagType(script.monitorSysGenScriptType)"
                size="small"
              >
                {{ script.monitorSysGenScriptType }}
              </el-tag>
            </div>
          </div>
          <div class="script-actions" @click.stop>
            <el-dropdown @command="(cmd) => handleAction(cmd, script)">
              <el-button size="small" type="text">
                <IconifyIconOnline icon="ri:more-line" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="execute">
                    <IconifyIconOnline icon="ri:play-line" />
                    执行
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">
                    <IconifyIconOnline icon="ri:edit-line" />
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="copy">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <div class="script-description">
            {{ script.monitorSysGenScriptDescription || "暂无描述" }}
          </div>
          <div class="script-stats">
            <div class="stat-item">
              <IconifyIconOnline icon="ri:time-line" />
              <span>{{
                formatTime(
                  script.updateTime ? new Date(script.updateTime) : new Date()
                )
              }}</span>
            </div>
            <div class="stat-item">
              <IconifyIconOnline icon="ri:play-circle-line" />
              <span
                >执行 {{ script.monitorSysGenScriptExecuteCount || 0 }} 次</span
              >
            </div>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="script-status">
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
          <div class="quick-actions">
            <el-button
              size="small"
              type="primary"
              @click.stop="$emit('execute', script)"
            >
              <IconifyIconOnline icon="ri:play-line" />
              执行
            </el-button>
            <el-button size="small" @click.stop="$emit('edit', script)">
              <IconifyIconOnline icon="ri:edit-line" />
              编辑
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
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

// 响应式数据
const loading = ref(false);
const searchKeyword = ref("");
const filterType = ref("");
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
watch([searchKeyword, filterType], () => {
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

// 临时格式化时间函数
const formatTime = (date: Date) => {
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
.script-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;

  .toolbar-left {
    display: flex;
    gap: 16px;
    align-items: center;

    .el-input {
      :deep(.el-input__wrapper) {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.is-focus {
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
      }
    }

    .el-select {
      :deep(.el-input__wrapper) {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;

    .el-button {
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }

      &.el-button--primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;

        &:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }
      }
    }
  }
}

.script-cards {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  align-content: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }
}

.script-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.03) 0%,
      rgba(118, 75, 162, 0.03) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 10px 25px rgba(102, 126, 234, 0.15),
      0 4px 10px rgba(0, 0, 0, 0.1);
    border-color: rgba(102, 126, 234, 0.2);

    &::before {
      opacity: 1;
    }

    &::after {
      opacity: 1;
    }

    .card-header .script-info .script-name {
      color: #3b82f6;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 20px 16px;
    background: #ffffff;
    position: relative;
    z-index: 1;

    .script-info {
      flex: 1;

      .script-name {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
        line-height: 1.4;
        transition: color 0.3s ease;
      }

      .script-type {
        .el-tag {
          border-radius: 6px;
          font-weight: 500;
          font-size: 12px;
          border: none;
          padding: 4px 8px;

          &.el-tag--primary {
            background: #f0f9ff;
            color: #0369a1;
          }

          &.el-tag--success {
            background: #f0fdf4;
            color: #166534;
          }

          &.el-tag--warning {
            background: #fffbeb;
            color: #d97706;
          }

          &.el-tag--info {
            background: #f8fafc;
            color: #475569;
          }
        }
      }
    }

    .script-actions {
      margin-left: 16px;

      .el-button {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }

  .card-content {
    padding: 0 20px 16px;
    position: relative;
    z-index: 1;

    .script-description {
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 42px;
    }

    .script-stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #64748b;
        background: #f8fafc;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;

        &:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #475569;
        }

        .iconify {
          font-size: 14px;
          opacity: 0.7;
        }
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px 16px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    position: relative;
    z-index: 1;

    .script-status {
      .el-tag {
        border-radius: 6px;
        font-weight: 500;
        font-size: 12px;
        border: none;
        padding: 4px 8px;

        &.el-tag--success {
          background: #dcfce7;
          color: #166534;
        }

        &.el-tag--info {
          background: #f1f5f9;
          color: #475569;
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: 8px;

      .el-button {
        border-radius: 6px;
        font-weight: 500;
        font-size: 12px;
        padding: 6px 12px;
        transition: all 0.2s ease;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        color: #64748b;

        &:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #475569;
          transform: translateY(-1px);
        }

        &.el-button--primary {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #ffffff;

          &:hover {
            background: #2563eb;
            border-color: #2563eb;
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
