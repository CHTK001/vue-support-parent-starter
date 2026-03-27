<template>
  <div class="page flex flex-col h-full">
    <!-- 内容区域 -->
    <ScCard shadow="hover" class="content-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <IconifyIconOnline icon="ri:database-2-line" class="header-icon" />
            <span>SQL 监控</span>
            <ScTag type="info" size="small">{{ dataList.length }} 条记�?</ScTag>
          </div>
          <div class="header-actions">
            <ScButton v-if="config.lock" type="primary" size="small" @click="config.lock = false">
              <IconifyIconOnline icon="ri:lock-line" class="mr-1" />
              锁定滚动
            </ScButton>
            <ScButton v-else size="small" @click="config.lock = true">
              <IconifyIconOnline icon="ri:lock-unlock-line" class="mr-1" />
              解锁滚动
            </ScButton>
            <ScButton type="danger" size="small" @click="dataList.length = 0">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              清空
            </ScButton>
          </div>
        </div>
      </template>
      <div class="sql-container">
        <ScRow :gutter="16" class="h-full">
          <!-- SQL 列表 -->
          <ScCol :span="8" class="sql-list-col">
            <div class="section-header">
              <IconifyIconOnline icon="ri:list-check" class="section-icon" />
              <span>SQL 列表</span>
            </div>
            <div id="containerRef" class="sql-list">
              <div v-for="(item, index) in getData(dataList)" :key="index" class="sql-item" @click="handleEventOne(item)">
                <span class="sql-index">{{ index + 1 }}</span>
                <span class="sql-content">{{ item?.data?.sql || "SQL" }}</span>
              </div>
            </div>
          </ScCol>

          <!-- SQL 详情 -->
          <ScCol :span="16" class="sql-detail-col">
            <div class="section-header">
              <IconifyIconOnline icon="ri:code-box-line" class="section-icon" />
              <span>SQL 详情</span>
            </div>
            <div class="sql-detail-wrapper">
              <div v-if="config.mainData" class="sql-detail">
                <pre class="sql-code"><code class="language-sql">{{ format(config.mainData?.data?.sql || "SELECT 1") }}</code></pre>
              </div>
              <ScEmpty v-else description="请选择 SQL 记录查看详情" />
            </div>
          </ScCol>
        </ScRow>
      </div>
    </ScCard>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon";

import Prism from "prismjs";
import "prismjs/components/prism-http.min.js";
import "prismjs/components/prism-sql.min.js";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/themes/prism-tomorrow.min.css";
import { format } from "sql-formatter";
import { nextTick, onMounted, onUnmounted, reactive } from "vue";
import { wsService } from "@/utils/websocket";

const form = reactive({
  message: null
});
const dataList = reactive([]);
const config = reactive({
  lock: true,
  mainData: null
});
let unsubscribe = null;

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "SQL_RECORD") {
    try {
      const sqlData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      dataList.push({ data: sqlData });
      // 限制最大记录数
      while (dataList.length > 10000) {
        dataList.shift();
      }
      // 自动滚动到底�?
      if (config.lock) {
        nextTick(() => {
          const container = document.querySelector("#containerRef");
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }
    } catch (error) {
      console.error("解析 SQL 数据失败:", error);
    }
  }
};

const handleEventOne = row => {
  config.mainData = row;
  setTimeout(async () => {
    Prism.highlightAll();
    try {
      document.querySelectorAll("pre code").forEach(ele => {
        Prism.highlightElement(ele);
      });
    } catch (error) {}
  }, 300);
};

const getData = data => {
  return data.filter(item => filter(item));
};

const filter = row => {
  if (!form.message) {
    return true;
  }
  if (!row?.data?.sql) {
    return false;
  }
  return row.data.sql?.indexOf(form.message) > -1;
};

onMounted(() => {
  // 订阅 SQL 消息
  unsubscribe = wsService.subscribe("SQL", "SQL_RECORD", handleWsMessage);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>
<style scoped lang="scss">
.page {
  padding: 20px;
  background: var(--el-bg-color-page);
}

.content-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 12px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-card__body) {
    flex: 1;
    padding: 16px;
    overflow: hidden;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-left {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 16px;
    font-weight: 600;

    .header-icon {
      font-size: 20px;
      color: var(--el-color-primary);
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.sql-container {
  height: 100%;
}

.sql-list-col,
.sql-detail-col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-header {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border-radius: 6px;

  .section-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }
}

.sql-list {
  flex: 1;
  padding-right: 8px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.sql-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 6px;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }

  .sql-index {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 4px;
  }

  .sql-content {
    flex: 1;
    overflow: hidden;
    font-family: Monaco, Menlo, monospace;
    font-size: 12px;
    color: var(--el-text-color-regular);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.sql-detail-wrapper {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.sql-detail {
  flex: 1;
  overflow: auto;
}

.sql-code {
  padding: 16px;
  margin: 0;
  overflow: auto;
  font-family: Monaco, Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

// 深色主题
html.dark {
  .content-card {
    box-shadow: 0 2px 12px rgb(0 0 0 / 20%);
  }

  .sql-item {
    background: var(--el-bg-color);
  }
}
</style>
