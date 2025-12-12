<template>
  <div class="page flex flex-col h-full">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:cpu-line" class="title-icon" />
            线程监控
          </h1>
          <p class="page-subtitle">实时查看系统线程状态和CPU使用情况</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ data.length }}</div>
            <div class="stat-label">总线程数</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <el-card class="h-full" shadow="never">
        <el-table :data="data" border stripe style="width: 100%" row-key="id" height="100%">
          <el-table-column type="index" label="#" width="60" align="center" />
          <el-table-column prop="id" label="线程ID" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ row.id }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="线程名称" min-width="250">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <IconifyIconOnline icon="ri:thread-line" class="text-primary" />
                <span class="font-medium">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="state" label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStateType(row.state)" size="small">{{ row.state }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cpu" label="CPU使用率" width="120" align="center">
            <template #default="{ row }">
              <span class="font-mono font-semibold">{{ row.cpu }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleInfo(row)">
                <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="infoVisible" title="线程详情" width="60%" destroy-on-close>
      <pre class="code-block"><code>{{ info }}</code></pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { onBeforeMount, ref } from "vue";

const data = ref([]);
const infoVisible = ref(false);
const info = ref("");

const getStateType = state => {
  const stateMap = {
    RUNNABLE: "success",
    WAITING: "warning",
    TIMED_WAITING: "info",
    BLOCKED: "danger",
    NEW: "",
    TERMINATED: "info"
  };
  return stateMap[state] || "";
};

const handleInfo = row => {
  info.value = JSON.stringify(row, null, 2);
  infoVisible.value = true;
};

onBeforeMount(async () => {
  http.get((window.agentPath || "/agent") + "/thread").then(res => {
    data.value = res.data || [];
  });
});
</script>
<style lang="scss" scoped>
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.stats-section {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .stat-number {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.code-block {
  background: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
