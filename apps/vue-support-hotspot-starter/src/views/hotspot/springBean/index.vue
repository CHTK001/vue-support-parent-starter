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
        <el-tag type="info" effect="light" size="large" round>
          <IconifyIconOnline icon="ri:database-2-line" class="mr-1" />
          共 {{ data.length }} 个 Bean
        </el-tag>
      </div>
    </div>

    <!-- 数据卡片 -->
    <el-card class="modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:list-check-2" class="card-icon" />
            Bean 列表
          </span>
          <el-input v-model="searchKeyword" placeholder="搜索 Bean 名称或类名..." clearable class="search-input">
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>
        </div>
      </template>

      <el-table :data="filteredData" style="width: 100%" row-key="id" stripe highlight-current-row class="modern-table">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="name" label="Bean 名称" min-width="200">
          <template #default="{ row }">
            <el-tooltip placement="top">
              <template #content>
                <div style="max-width: 400px">
                  <div><strong>Bean 名称:</strong> {{ row.name }}</div>
                  <div><strong>类名:</strong> {{ row.className }}</div>
                  <div v-if="row.resource"><strong>资源:</strong> {{ row.resource }}</div>
                </div>
              </template>
              <div class="bean-name">
                <IconifyIconOnline icon="ri:code-box-line" class="bean-icon" />
                <span>{{ row.name }}</span>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="className" label="类名" min-width="300">
          <template #default="{ row }">
            <el-tooltip placement="top" :show-after="300">
              <template #content>
                <div style="max-width: 500px; word-break: break-all">
                  {{ row.className }}
                </div>
              </template>
              <span class="class-name">{{ row.className }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="resource" label="资源" min-width="200">
          <template #default="{ row }">
            <el-tag v-if="row.resource" type="info" effect="plain" size="small">
              {{ row.resource }}
            </el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleInfo(row)">
              <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="infoVisible" title="Bean 详情" width="60%" destroy-on-close class="modern-dialog">
      <div class="detail-content">
        <pre class="code-block"><code>{{ info }}</code></pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { computed, onBeforeMount, ref } from "vue";

const data = ref([]);
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

onBeforeMount(async () => {
  http.get((window.agentPath || "/agent") + "/spring-bean-data").then(res => {
    data.value = res.data.data || [];
  });
});
</script>

<style lang="scss" scoped>
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
  background: var(--el-bg-color);
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
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

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

    .search-input {
      width: 280px;
    }
  }
}

.modern-table {
  :deep(th.el-table__cell) {
    background: var(--el-fill-color-lighter);
    font-weight: 600;
  }

  .bean-name {
    display: flex;
    align-items: center;
    gap: 8px;

    .bean-icon {
      color: var(--el-color-success);
      font-size: 16px;
    }
  }

  .class-name {
    font-family: "Monaco", "Menlo", monospace;
    font-size: 12px;
    color: var(--el-text-color-regular);
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
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
      margin: 0;
      padding: 16px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;
      overflow-x: auto;
      font-family: "Monaco", "Menlo", monospace;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-primary);
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
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
