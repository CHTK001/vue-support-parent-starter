<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:database-2-line" class="title-icon" />
            SQL 监控
          </h1>
          <p class="page-subtitle">实时监控和分析 SQL 执行情况</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ dataList.length }}</div>
            <div class="stat-label">SQL 记录</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <el-card shadow="never" class="h-full">
        <div class="sql-container">
          <!-- 控制按钮 -->
          <div class="control-buttons">
            <el-button v-if="config.lock" type="primary" circle :icon="useRenderIcon('ep:lock')" @click="config.lock = false" title="解锁滚动" />
            <el-button v-else circle :icon="useRenderIcon('ep:unlock')" @click="config.lock = true" title="锁定滚动" />
            <el-button circle type="danger" :icon="useRenderIcon('ep:delete-filled')" @click="dataList.length = 0" title="清空记录" />
          </div>

          <el-row :gutter="16" class="h-full">
            <!-- SQL 列表 -->
            <el-col :span="8" class="h-full">
              <div class="section-header">
                <IconifyIconOnline icon="ri:list-check" class="section-icon" />
                <span>SQL 列表</span>
              </div>
              <ul id="containerRef" class="sql-list">
                <li v-for="(item, index) in getData(dataList)" :key="index" class="sql-item">
                  <el-button class="sql-button" @click="handleEventOne(item)">
                    <span class="sql-index">{{ index + 1 }}</span>
                    <span class="sql-content">{{ item?.data?.sql || "SQL" }}</span>
                  </el-button>
                </li>
              </ul>
            </el-col>

            <!-- SQL 详情 -->
            <el-col :span="16" class="h-full">
              <div v-if="config.mainData" class="sql-detail">
                <div class="section-header">
                  <IconifyIconOnline icon="ri:code-box-line" class="section-icon" />
                  <span>SQL 语句</span>
                </div>
                <pre class="sql-code"><code class="language-sql">{{ format(config.mainData?.data?.sql || "SELECT 1") }}</code></pre>
              </div>
              <el-empty v-else description="请选择 SQL 记录查看详情" />
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
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

.sql-container {
  height: 100%;
  position: relative;
}

.control-buttons {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .section-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }
}

.sql-list {
  list-style: none;
  padding: 0;
  margin: 0;
  height: calc(100% - 60px);
  overflow-y: auto;
}

.sql-item {
  margin-bottom: 8px;
}

.sql-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
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
    width: 24px;
    height: 24px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .sql-content {
    flex: 1;
    text-align: left;
    font-weight: 500;
    font-size: 12px;
    font-family: "Courier New", monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-regular);
  }
}

.sql-detail {
  height: 100%;
}

.sql-code {
  background: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  max-height: calc(100% - 60px);
  margin: 0;
}

:deep(.el-card) {
  border-radius: 8px;

  .el-card__body {
    height: 100%;
    padding: 16px;
  }
}
</style>
