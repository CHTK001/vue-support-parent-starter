<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { http } from "@repo/utils";
import { ElMessage, ElMessageBox } from "element-plus";
import { wsService } from "@/utils/websocket";

const loading = ref(false);
let unsubscribe: (() => void) | null = null;
const status = ref<any>({});
const classList = ref<any[]>([]);
const searchKeyword = ref("");
const activeTab = ref("status");

// 获取热重载状态
const fetchStatus = async () => {
  try {
    const res = await http.get((window.agentPath || "/agent") + "/hotswap?action=status");
    status.value = res.data || {};
  } catch (error) {
    console.error("获取热重载状态失败:", error);
  }
};

// 获取已加载类列表
const fetchClassList = async () => {
  loading.value = true;
  try {
    const res = await http.get((window.agentPath || "/agent") + "/hotswap?action=list&pattern=" + (searchKeyword.value || "") + "&limit=200");
    classList.value = res.data?.classes || [];
  } catch (error) {
    console.error("获取类列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 过滤后的类列表
const filteredClassList = computed(() => {
  if (!searchKeyword.value) return classList.value;
  const keyword = searchKeyword.value.toLowerCase();
  return classList.value.filter(item => item.className?.toLowerCase().includes(keyword));
});

// 手动重载类
const reloadClass = () => {
  ElMessageBox.prompt("请输入要重载的类全限定名", "手动重载类", {
    confirmButtonText: "重载",
    cancelButtonText: "取消",
    inputPattern: /^[\w.]+$/,
    inputErrorMessage: "请输入有效的类名（如 com.example.MyClass）"
  })
    .then(async ({ value }) => {
      try {
        await http.post((window.agentPath || "/agent") + `/hotswap?action=reload&className=${value}`);
        ElMessage.success(`类 ${value} 重载成功`);
        fetchClassList();
      } catch (error) {
        ElMessage.error("重载失败");
        console.error(error);
      }
    })
    .catch(() => {});
};

// 从文件重载类
const reloadFromFile = () => {
  ElMessageBox.prompt("请输入 class 文件路径", "从文件重载", {
    confirmButtonText: "重载",
    cancelButtonText: "取消"
  })
    .then(async ({ value: filePath }) => {
      ElMessageBox.prompt("请输入类全限定名", "从文件重载", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^[\w.]+$/,
        inputErrorMessage: "请输入有效的类名"
      })
        .then(async ({ value: className }) => {
          try {
            await http.post((window.agentPath || "/agent") + `/hotswap?action=reloadFile&filePath=${encodeURIComponent(filePath)}&className=${className}`);
            ElMessage.success("重载成功");
            fetchClassList();
          } catch (error) {
            ElMessage.error("重载失败");
            console.error(error);
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

// 搜索类
const searchClasses = () => {
  fetchClassList();
};

// 刷新所有
const refreshAll = () => {
  fetchStatus();
  fetchClassList();
};

// 重载单个类
const reloadSingleClass = async (className: string) => {
  try {
    await ElMessageBox.confirm(`确定要重载类 ${className} 吗？`, "确认重载", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    await http.post((window.agentPath || "/agent") + `/hotswap?action=reload&className=${className}`);
    ElMessage.success("重载成功");
    fetchClassList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("重载失败");
    }
  }
};

// 处理 WebSocket 消息
const handleWsMessage = (message: any) => {
  if (message.event === "HOTSWAP_STATUS") {
    try {
      const wsData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      status.value = wsData.status || {};
      if (wsData.classes) {
        classList.value = wsData.classes;
      }
    } catch (error) {
      console.error("解析热重载数据失败:", error);
    }
  }
};

onMounted(() => {
  fetchStatus();
  fetchClassList();
  // 订阅 WebSocket 消息
  wsService.connect();
  unsubscribe = wsService.subscribe("JVM", "HOTSWAP_STATUS", handleWsMessage);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper primary">
              <IconifyIconOnline icon="ri:stack-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ status.loadedClassCount || 0 }}</div>
              <div class="stat-label">已加载类</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div :class="['stat-icon-wrapper', status.enabled ? 'success' : 'danger']">
              <IconifyIconOnline icon="ri:refresh-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ status.enabled ? "已启用" : "未启用" }}</div>
              <div class="stat-label">热重载状态</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div :class="['stat-icon-wrapper', status.instrumentation ? 'success' : 'info']">
              <IconifyIconOnline icon="ri:tools-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ status.instrumentation ? "可用" : "不可用" }}</div>
              <div class="stat-label">Instrumentation</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper warning">
              <IconifyIconOnline icon="ri:upload-2-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <el-button type="primary" size="small" @click="reloadClass">
                <IconifyIconOnline icon="ri:upload-2-line" class="mr-1" />
                手动重载
              </el-button>
              <div class="stat-label">操作</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 类列表卡片 -->
    <el-card class="modern-card class-list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:list-check-2" class="card-icon" />
            已加载类列表
          </span>
          <div class="header-actions">
            <el-input v-model="searchKeyword" placeholder="搜索类名..." clearable class="search-input" @keyup.enter="searchClasses">
              <template #prefix>
                <IconifyIconOnline icon="ep:search" />
              </template>
            </el-input>
            <el-button type="primary" @click="searchClasses">搜索</el-button>
            <el-button @click="reloadFromFile">
              <IconifyIconOnline icon="ri:file-upload-line" class="mr-1" />
              从文件重载
            </el-button>
            <el-button type="info" :loading="loading" @click="refreshAll">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="filteredClassList" stripe class="modern-table" max-height="500">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="className" label="类名" min-width="400">
          <template #default="{ row }">
            <div class="class-name-cell">
              <IconifyIconOnline icon="ri:code-box-line" class="class-icon" />
              <span class="class-name">{{ row.className || row }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="classLoader" label="类加载器" min-width="200">
          <template #default="{ row }">
            <el-tag v-if="row.classLoader" type="info" effect="plain" size="small">
              {{ row.classLoader }}
            </el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="reloadSingleClass(row.className || row)">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              重载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="filteredClassList.length === 0" description="暂无数据" />
    </el-card>

    <!-- 使用说明 -->
    <el-card class="modern-card info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:question-line" class="card-icon" />
            使用说明
          </span>
        </div>
      </template>
      <el-alert type="info" :closable="false" show-icon>
        <template #title>
          <span class="alert-title">热重载功能说明</span>
        </template>
        <template #default>
          <div class="alert-content">
            <p>• 热重载允许在不重启应用的情况下更新类代码</p>
            <p>• 需要 JetBrains Runtime 或 DCEVM 支持完整的类结构修改</p>
            <p>• 标准 JDK 仅支持方法体内容的修改</p>
            <p>• 建议在开发环境使用，生产环境谨慎操作</p>
          </div>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;

  :deep(.el-card__body) {
    padding: 20px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.primary {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-primary);
      }
    }
    &.success {
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-success);
      }
    }
    &.warning {
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-warning);
      }
    }
    &.danger {
      background: linear-gradient(135deg, rgba(var(--el-color-danger-rgb), 0.1), rgba(var(--el-color-danger-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-danger);
      }
    }
    &.info {
      background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-info);
      }
    }

    .stat-icon {
      font-size: 24px;
    }
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .search-input {
        width: 250px;
      }
    }
  }
}

.modern-table {
  :deep(th.el-table__cell) {
    background: var(--el-fill-color-lighter);
    font-weight: 600;
  }

  .class-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .class-icon {
      color: var(--el-color-primary);
      font-size: 16px;
      flex-shrink: 0;
    }

    .class-name {
      font-family: "Monaco", "Menlo", monospace;
      font-size: 13px;
      word-break: break-all;
    }
  }
}

.highlight-number {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.text-placeholder {
  color: var(--el-text-color-placeholder);
}

.alert-title {
  font-weight: 600;
}

.alert-content {
  margin-top: 8px;
  line-height: 1.8;
  color: var(--el-text-color-regular);

  p {
    margin: 0;
  }
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .stat-card,
  .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
