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
          <div class="script-info flex flex-row">
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(248, 250, 252, 0.85) 100%
    );
    backdrop-filter: blur(20px);
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

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
  padding: 32px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  align-content: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 20px;
    gap: 20px;
  }

  @media (min-width: 1400px) {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 28px;
  }
}

.script-card {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border: none;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.24);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow:
      0 14px 28px rgba(0, 0, 0, 0.25),
      0 10px 10px rgba(0, 0, 0, 0.22);

    &::before {
      opacity: 1;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 28px 28px 20px;
    background: transparent;

    .script-info {
      flex: 1;

      .script-name {
        font-size: 20px;
        font-weight: 700;
        color: #1a202c;
        margin-bottom: 12px;
        line-height: 1.2;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .script-type {
        .el-tag {
          border-radius: 24px;
          font-weight: 600;
          font-size: 11px;
          border: none;
          padding: 8px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

          &.el-tag--primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
          }

          &.el-tag--success {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: #ffffff;
          }

          &.el-tag--warning {
            background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
            color: #ffffff;
          }

          &.el-tag--info {
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: #ffffff;
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
    padding: 0 28px 24px;

    .script-description {
      color: #4a5568;
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 20px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 51px;
      font-weight: 400;
    }

    .script-stats {
      display: flex;
      gap: 20px;
      align-items: center;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #718096;
        background: rgba(102, 126, 234, 0.08);
        padding: 8px 12px;
        border-radius: 12px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(102, 126, 234, 0.15);
          transform: translateY(-1px);
        }

        .iconify {
          font-size: 16px;
          color: #667eea;
        }
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 28px 28px;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.02) 0%,
      rgba(118, 75, 162, 0.02) 100%
    );
    border-top: 1px solid rgba(102, 126, 234, 0.1);

    .script-status {
      .el-tag {
        border-radius: 24px;
        font-weight: 600;
        font-size: 11px;
        border: none;
        padding: 8px 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        &.el-tag--success {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: #ffffff;
        }

        &.el-tag--info {
          background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
          color: #ffffff;
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: 12px;

      .el-button {
        border-radius: 12px;
        font-weight: 600;
        font-size: 12px;
        padding: 10px 20px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-transform: uppercase;
        letter-spacing: 0.5px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        &.el-button--primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;

          &:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          }
        }

        &:not(.el-button--primary) {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          color: #4a5568;

          &:hover {
            background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
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
