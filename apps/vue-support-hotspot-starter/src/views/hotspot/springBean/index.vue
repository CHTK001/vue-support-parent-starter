<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:seedling-line" class="header-icon" />
        <div class="header-info">
          <h2 class="header-title">SpringBean 管理</h2>
          <p class="header-desc">查看和管理 Spring 容器中的 Bean 信息</p>
        </div>
      </div>
      <div class="header-right">
        <ScTag type="info" effect="light" size="large" round>
          <IconifyIconOnline icon="ri:database-2-line" class="mr-1" />
          共 {{ data.length }} 个 Bean
        </ScTag>
      </div>
    </div>

    <!-- 数据卡片 -->
    <ScCard class="modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:list-check-2" class="card-icon" />
            Bean 列表
          </span>
          <ScInput v-model="searchKeyword" placeholder="搜索 Bean 名称或类名..." clearable class="search-input">
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </ScInput>
        </div>
      </template>

      <ScTable :data="filteredData" style="width: 100%" row-key="id" stripe highlight-current-row class="modern-table" max-height="600">
        <ScTableColumn prop="id" label="ID" width="100" />
        <ScTableColumn prop="name" label="Bean 名称" min-width="200">
          <template #default="{ row }">
            <ScTooltip placement="top">
              <template #content>
                <div style="max-width: 400px">
                  <div>
                    <strong>Bean 名称:</strong>
                    {{ row.name }}
                  </div>
                  <div>
                    <strong>类名:</strong>
                    {{ row.className }}
                  </div>
                  <div v-if="row.resource">
                    <strong>资源:</strong>
                    {{ row.resource }}
                  </div>
                </div>
              </template>
              <div class="bean-name">
                <IconifyIconOnline icon="ri:code-box-line" class="bean-icon" />
                <span>{{ row.name }}</span>
              </div>
            </ScTooltip>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="className" label="类名" min-width="300">
          <template #default="{ row }">
            <ScTooltip placement="top" :show-after="300">
              <template #content>
                <div style="max-width: 500px; word-break: break-all">
                  {{ row.className }}
                </div>
              </template>
              <span class="class-name">{{ row.className }}</span>
            </ScTooltip>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="resource" label="资源" min-width="200">
          <template #default="{ row }">
            <ScTag v-if="row.resource" type="info" effect="plain" size="small">
              {{ row.resource }}
            </ScTag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <ScButton type="primary" link @click="handleInfo(row)">
              <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
              详情
            </ScButton>
          </template>
        </ScTableColumn>
      </ScTable>
    </ScCard>

    <!-- 详情对话框 -->
    <sc-dialog v-model="infoVisible" title="Bean 详情" width="60%" destroy-on-close class="modern-dialog">
      <div class="detail-content">
        <pre class="code-block"><code>{{ info }}</code></pre>
      </div>
    </sc-dialog>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { computed, onBeforeMount, onUnmounted, ref } from "vue";
import { wsService } from "@/utils/websocket";

const data = ref([]);
let unsubscribe = null;
const infoVisible = ref(false);
const info = ref("");
const searchKeyword = ref("");

// 过滤后的数据
const filteredData = computed(() => {
  if (!searchKeyword.value) return data.value;
  const keyword = searchKeyword.value.toLowerCase();
  return data.value.filter(item => item.name?.toLowerCase().includes(keyword) || item.className?.toLowerCase().includes(keyword));
});

const handleInfo = row => {
  info.value = JSON.stringify(row, null, 2);
  infoVisible.value = true;
};

// 解析 Bean 数据
const parseBeanData = res => {
  if (res && typeof res === "object" && Array.isArray(res.data)) {
    data.value = res.data;
  } else if (res && typeof res === "object" && Array.isArray(res.data?.data)) {
    data.value = res.data.data;
  } else if (Array.isArray(res)) {
    data.value = res;
  } else {
    data.value = [];
  }
};

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "SPRING_BEAN_UPDATE") {
    try {
      const wsData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      parseBeanData(wsData);
    } catch (error) {
      console.error("解析 Bean 数据失败:", error);
    }
  }
};

onBeforeMount(async () => {
  http.get((window.agentPath || "/agent") + "/spring-bean-data").then(res => {
    parseBeanData(res.data);
  });
  // 订阅 WebSocket 消息
  wsService.connect();
  unsubscribe = wsService.subscribe("SPRING", "SPRING_BEAN_UPDATE", handleWsMessage);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100%;
  padding: 20px;
  background: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  margin-bottom: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 6%);

  .header-left {
    display: flex;
    gap: 16px;
    align-items: center;

    .header-icon {
      padding: 12px;
      font-size: 40px;
      color: var(--el-color-primary);
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
      border-radius: 12px;
    }

    .header-info {
      .header-title {
        margin: 0 0 4px;
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
}

.modern-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 6%);

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }

    .search-input {
      width: 280px;
    }
  }
}

.modern-table {
  :deep(th.el-table__cell) {
    font-weight: 600;
    background: var(--el-fill-color-lighter);
  }

  .bean-name {
    display: flex;
    gap: 8px;
    align-items: center;

    .bean-icon {
      font-size: 16px;
      color: var(--el-color-success);
    }
  }

  .class-name {
    display: block;
    max-width: 300px;
    overflow: hidden;
    font-family: Monaco, Menlo, monospace;
    font-size: 12px;
    color: var(--el-text-color-regular);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .text-placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.modern-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .detail-content {
    .code-block {
      padding: 16px;
      margin: 0;
      overflow-x: auto;
      font-family: Monaco, Menlo, monospace;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-primary);
      background: var(--el-fill-color-lighter);
      border-radius: 8px;
    }
  }
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .page-header {
    background: var(--el-bg-color);
    box-shadow: 0 2px 12px rgb(0 0 0 / 20%);
  }

  .modern-card {
    box-shadow: 0 2px 12px rgb(0 0 0 / 20%);
  }
}
</style>
