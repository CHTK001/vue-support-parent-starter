<template>
  <div class="page flex flex-col h-full">
    <!-- 内容区域 -->
    <el-card shadow="hover" class="content-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <IconifyIconOnline icon="ri:database-2-line" class="header-icon" />
            <span>SQL 监控</span>
            <el-tag type="info" size="small">{{ dataList.length }} 条记录</el-tag>
          </div>
          <div class="header-actions">
            <el-button v-if="config.lock" type="primary" size="small" @click="config.lock = false">
              <IconifyIconOnline icon="ri:lock-line" class="mr-1" />锁定滚动
            </el-button>
            <el-button v-else size="small" @click="config.lock = true">
              <IconifyIconOnline icon="ri:lock-unlock-line" class="mr-1" />解锁滚动
            </el-button>
            <el-button type="danger" size="small" @click="dataList.length = 0">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />清空
            </el-button>
          </div>
        </div>
      </template>
      <div class="sql-container">
        <el-row :gutter="16" class="h-full">
          <!-- SQL 列表 -->
          <el-col :span="8" class="sql-list-col">
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
          </el-col>

          <!-- SQL 详情 -->
          <el-col :span="16" class="sql-detail-col">
            <div class="section-header">
              <IconifyIconOnline icon="ri:code-box-line" class="section-icon" />
              <span>SQL 详情</span>
            </div>
            <div class="sql-detail-wrapper">
              <div v-if="config.mainData" class="sql-detail">
                <pre class="sql-code"><code class="language-sql">{{ format(config.mainData?.data?.sql || "SELECT 1") }}</code></pre>
              </div>
              <el-empty v-else description="请选择 SQL 记录查看详情" />
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
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
      // 自动滚动到底部
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
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;

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
  justify-content: space-between;
  align-items: center;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
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

.sql-list-col, .sql-detail-col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
  flex-shrink: 0;

  .section-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }
}

.sql-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;

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
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .sql-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .sql-content {
    flex: 1;
    font-size: 12px;
    font-family: "Monaco", "Menlo", monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-regular);
  }
}

.sql-detail-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sql-detail {
  flex: 1;
  overflow: auto;
}

.sql-code {
  background: var(--el-fill-color-lighter);
  padding: 16px;
  border-radius: 6px;
  font-family: "Monaco", "Menlo", monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

// 深色主题
 html.dark {
  .content-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .sql-item {
    background: var(--el-bg-color);
  }
}
</style>
