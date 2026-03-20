<template>
  <div class="page flex flex-col h-full">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:database-2-line" class="title-icon" />
            数据库表信息
          </h1>
          <p class="page-subtitle">查看和管理数据库表结构信息</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ data.length }}</div>
            <div class="stat-label">总表数</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="flex-1 overflow-hidden">
      <ScCard class="h-full" shadow="never">
        <ScTable :data="data" border stripe style="width: 100%" row-key="name" height="100%">
          <ScTableColumn type="index" label="#" width="60" align="center" />
          <ScTableColumn prop="name" label="表名" min-width="200">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <IconifyIconOnline icon="ri:table-line" class="text-primary" />
                <span class="font-medium">{{ row.name }}</span>
              </div>
            </template>
          </ScTableColumn>
          <ScTableColumn prop="comment" label="注释" min-width="250" show-overflow-tooltip />
          <ScTableColumn prop="engine" label="引擎" width="120" align="center">
            <template #default="{ row }">
              <ScTag size="small" type="info">{{ row.engine }}</ScTag>
            </template>
          </ScTableColumn>
          <ScTableColumn prop="rows" label="行数" width="120" align="right">
            <template #default="{ row }">
              <span class="font-mono">{{ row.rows?.toLocaleString() }}</span>
            </template>
          </ScTableColumn>
          <ScTableColumn label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <ScButton link type="primary" @click="handleInfo(row)">
                <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                详情
              </ScButton>
            </template>
          </ScTableColumn>
        </ScTable>
      </ScCard>
    </div>

    <!-- 详情对话框 -->
    <sc-dialog v-model="infoVisible" title="表详情" width="60%" destroy-on-close>
      <pre class="code-block"><code>{{ info }}</code></pre>
    </sc-dialog>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { onBeforeMount, onUnmounted, ref } from "vue";
import { wsService } from "@/utils/websocket";

const data = ref([]);
let unsubscribe = null;
const infoVisible = ref(false);
const info = ref("");

const handleInfo = row => {
  info.value = JSON.stringify(row, null, 2);
  infoVisible.value = true;
};

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "TABLE_INFO") {
    try {
      const wsData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      data.value = wsData.data || wsData || [];
    } catch (error) {
      console.error("解析表信息失败:", error);
    }
  }
};

onBeforeMount(async () => {
  http.get((window.agentPath || "/agent") + "/table_info").then(res => {
    data.value = res.data.data || [];
  });
  // 订阅 WebSocket 消息
  wsService.connect();
  unsubscribe = wsService.subscribe("SQL", "TABLE_INFO", handleWsMessage);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>
<style lang="scss" scoped>
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  padding: 24px 32px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 5%);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-section {
  flex: 1;
}

.page-title {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.stats-section {
  display: flex;
  gap: 16px;
}

.stat-card {
  padding: 16px 24px;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);

  .stat-number {
    margin-bottom: 4px;
    font-size: 28px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.code-block {
  padding: 16px;
  overflow-x: auto;
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-table) {
  font-size: 14px;

  .el-table__header th {
    font-weight: 600;
    background: var(--el-fill-color-light);
  }
}
</style>
