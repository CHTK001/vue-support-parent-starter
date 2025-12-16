<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { http } from "@repo/utils";
import { ElMessage, ElMessageBox } from "element-plus";

const loading = ref(false);
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
  return classList.value.filter(item => 
    item.className?.toLowerCase().includes(keyword)
  );
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

onMounted(() => {
  fetchStatus();
  fetchClassList();
});
</script>

<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:refresh-line" class="header-icon" />
        <div class="header-info">
          <h2 class="header-title">热重载管理</h2>
          <p class="header-desc">管理应用类的热重载和实时更新</p>
        </div>
      </div>
      <div class="header-right">
        <div class="stat-card">
          <div class="stat-number">{{ status.loadedClassCount || 0 }}</div>
          <div class="stat-label">已加载类</div>
        </div>
        <el-tag :type="status.enabled ? 'success' : 'danger'" effect="light" size="large">
          {{ status.enabled ? '热重载已启用' : '热重载未启用' }}
        </el-tag>
        <el-button type="info" @click="refreshAll" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="reloadClass">
          <IconifyIconOnline icon="ri:upload-2-line" class="mr-1" />
          手动重载
        </el-button>
      </div>
    </div>

    <!-- 状态卡片 -->
    <el-card class="modern-card status-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:information-line" class="card-icon" />
            热重载状态
          </span>
        </div>
      </template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="热重载">
          <el-tag :type="status.enabled ? 'success' : 'danger'" effect="plain">
            {{ status.enabled ? "已启用" : "未启用" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Instrumentation">
          <el-tag :type="status.instrumentation ? 'success' : 'info'" effect="plain">
            {{ status.instrumentation ? "可用" : "不可用" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="已加载类数">
          <span class="highlight-number">{{ status.loadedClassCount || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ status.timestamp ? new Date(status.timestamp).toLocaleString("zh-CN") : "-" }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 类列表卡片 -->
    <el-card class="modern-card class-list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:list-check-2" class="card-icon" />
            已加载类列表
          </span>
          <div class="header-actions">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索类名..." 
              clearable 
              class="search-input"
              @keyup.enter="searchClasses"
            >
              <template #prefix>
                <IconifyIconOnline icon="ep:search" />
              </template>
            </el-input>
            <el-button type="primary" @click="searchClasses">搜索</el-button>
            <el-button @click="reloadFromFile">
              <IconifyIconOnline icon="ri:file-upload-line" class="mr-1" />
              从文件重载
            </el-button>
          </div>
        </div>
      </template>
      <el-table 
        :data="filteredClassList" 
        v-loading="loading" 
        stripe 
        class="modern-table" 
        max-height="500"
      >
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
            <el-button 
              type="primary" 
              link 
              @click="reloadSingleClass(row.className || row)"
            >
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

<script>
export default {
  methods: {
    reloadSingleClass(className) {
      this.$confirm(`确定要重载类 ${className} 吗？`, "确认重载", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          try {
            await http.post((window.agentPath || "/agent") + `/hotswap?action=reload&className=${className}`);
            this.$message.success("重载成功");
          } catch (error) {
            this.$message.error("重载失败");
          }
        })
        .catch(() => {});
    }
  }
};
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      font-size: 40px;
      color: var(--el-color-primary);
      padding: 12px;
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
      border-radius: 12px;
    }

    .header-info {
      .header-title {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-desc {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .stat-card {
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .stat-number {
        font-size: 20px;
        font-weight: 700;
        color: var(--el-color-primary);
      }

      .stat-label {
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }
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

  .page-header {
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

    .header-right .stat-card {
      background: var(--el-bg-color);
    }
  }

  .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
