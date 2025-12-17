<template>
  <div class="page flex flex-col h-full">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper primary">
              <IconifyIconOnline icon="ri:route-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dataList.length }}</div>
              <div class="stat-label">追踪记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div :class="['stat-icon-wrapper', wsConnected ? 'success' : 'danger']">
              <IconifyIconOnline icon="ri:wifi-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ wsConnected ? '已连接' : '未连接' }}</div>
              <div class="stat-label">WebSocket 状态</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper warning">
              <IconifyIconOnline icon="ri:time-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">实时</div>
              <div class="stat-label">数据推送</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper danger">
              <IconifyIconOnline icon="ri:delete-bin-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <el-button type="danger" size="small" @click="clearData">清空数据</el-button>
              <div class="stat-label">操作</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <el-card shadow="never" class="h-full trace-card">
        <div ref="containerRef" class="h-full overflow-auto">
          <el-tree
            :data="dataList"
            :style="{
              height: '100%',
              'background- color': datav ? 'transparent' : '',
              '--datav': datav ? 'transparent' : '',
              color: datav ? '#fff' : 'unset',
              overflow: 'auto'
            }"
            :props="defaultProps"
          >
            <template #default="{ data }">
              <div class="flex flex-wrap bg-transparent">
                <div class="w-full max-w-full px-3 sm:flex-0 shrink-0 bg-transparent">
                  <div class="relative flex flex-col min-w-0 break-words bg-transparent shadow-soft-xl dark:shadow-soft-dark-xl rounded-2xl bg-clip-border">
                    <div class="flex-auto">
                      <span class="custom-tree-node bg-transparent" :title="data.description">
                        <span v-if="data.id == data.linkId">
                          <span v-if="(data.description || '').indexOf('span') > -1" v-html="data.description || data.ex" />
                          <span v-else>
                            <el-tag>Http</el-tag>
                            <el-tag type="primary" class="ml-1">{{ data.description || data.ex }}</el-tag>
                          </span>
                        </span>
                        <span v-else>
                          <span>
                            <span v-if="(data.description || '').indexOf('span') > -1" v-html="data.description || data.ex" />
                            <span v-else-if="(data.typeName || '').indexOf('span') > -1 || (data.typeName || '').indexOf('el-tag') > -1" v-html="data.typeName" />
                            <span v-else class="text-pretty">{{ data.description }}</span>
                          </span>
                        </span>
                        @
                        <span v-if="data?.timestamp" style="height: 26px">
                          {{ dateFormat(data?.timestamp * 1) }}
                        </span>
                        耗时:
                        <span style="height: 26px">{{ data?.costTime }} ms</span>
                        <el-icon class="z-[10]" @click="handleShowTrack(data)">
                          <component :is="useRenderIcon('ri:information-2-line')" />
                        </el-icon>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </el-card>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer ref="drawerRef" v-model="config.dialogVisible" :append-to-body="true" size="60%" direction="rtl" class="trace-drawer" :destroy-on-close="true">
      <template #title>
        <span v-html="config.dialogDetailData.description" />
      </template>
      <div class="demo-drawer__content bg-transparent">
        <el-descriptions border :column="1">
          <el-descriptions-item label="linkId">
            {{ config.dialogDetailData.linkId }}
          </el-descriptions-item>
          <el-descriptions-item v-if="config.dialogDetailData.applicationName" label="应用地址">
            <el-tag>{{ config.dialogDetailData.applicationName }}</el-tag>
            {{ config.dialogDetailData.applicationHost }}:{{ config.dialogDetailData.applicationPort }}
          </el-descriptions-item>
          <el-descriptions-item label="进入方法时间">{{ dateFormat(config.dialogDetailData.enterTime * 1) }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ config.dialogDetailData.costTime }} ms</el-descriptions-item>
        </el-descriptions>
        <div v-if="config.dialogDetailData.headers && config.dialogDetailData.headers.length > 0">
          <div>header</div>
          <pre><code class="language-http">{{ config.dialogDetailData.headers?.join("\n") }}</code></pre>
        </div>
        <div v-if="config.dialogDetailData.tips && config.dialogDetailData.tips.length > 0">
          <el-divider />
          <div>tips</div>
          <pre><code class="language-http"><span v-html="config.dialogDetailData.tips.join('\n')"/></code></pre>
        </div>
        <div v-if="config.dialogDetailData.category == 'SQL'">
          <el-divider />
          <div>sql</div>
          <pre><code class="language-sql">{{ format(config.dialogDetailData.description) }}</code></pre>
        </div>

        <div v-if="config.dialogDetailData.stackTrace && config.dialogDetailData.stackTrace.length > 0">
          <el-divider />
          <div>堆栈</div>
          <pre><code class="language-java">{{ config.dialogDetailData.stackTrace  instanceof Array ? config.dialogDetailData.stackTrace?.join('\r\n') : config.dialogDetailData.stackTrace}}</code></pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script setup>
import Prism from "prismjs";
import "prismjs/components/prism-sql.min.js";
import "prismjs/components/prism-http.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import { format } from "sql-formatter";
import { dateFormat } from "@repo/utils";
import { nextTick, onMounted, onUnmounted, reactive, ref, computed } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { wsService } from "@/utils/websocket";

const config = reactive({
  dialogVisible: false,
  dialogDetailData: {}
});

const dataList = reactive([]);
const datav = ref(false);
const defaultProps = {
  children: "children",
  label: "description"
};

let unsubscribe = null;

// WebSocket 连接状态
const wsConnected = computed(() => wsService.connected.value);

// 清空数据
const clearData = () => {
  dataList.length = 0;
};

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "AGENT_TRACE") {
    try {
      const traceData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      dataList.unshift(traceData);
      // 限制最大记录数
      while (dataList.length > 1000) {
        dataList.pop();
      }
    } catch (error) {
      console.error("解析链路数据失败:", error);
    }
  }
};

const handleShowTrack = async data => {
  config.dialogVisible = true;
  config.dialogDetailData = data;
  await nextTick();
  setTimeout(async () => {
    Prism.highlightAll();
    try {
      document.querySelectorAll("pre code").forEach(ele => {
        Prism.highlightElement(ele);
      });
    } catch (error) {}
  }, 300);
};

// 获取历史追踪记录
const fetchHistory = async () => {
  try {
    const response = await fetch("/agent/api/trace?action=list&limit=100");
    const data = await response.json();
    if (data.traces && Array.isArray(data.traces)) {
      // 清空并添加历史数据
      dataList.length = 0;
      data.traces.forEach(trace => dataList.push(trace));
    }
  } catch (error) {
    console.error("获取链路历史失败:", error);
  }
};

onMounted(() => {
  // 连接 WebSocket
  wsService.connect();
  // 订阅链路追踪消息
  unsubscribe = wsService.subscribe("TRACE", "AGENT_TRACE", handleWsMessage);
  // 加载历史数据
  fetchHistory();
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

.stats-row {
  margin-bottom: 16px;
  flex-shrink: 0;
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
      .stat-icon { color: var(--el-color-primary); }
    }
    &.success {
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      .stat-icon { color: var(--el-color-success); }
    }
    &.warning {
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
      .stat-icon { color: var(--el-color-warning); }
    }
    &.danger {
      background: linear-gradient(135deg, rgba(var(--el-color-danger-rgb), 0.1), rgba(var(--el-color-danger-rgb), 0.05));
      .stat-icon { color: var(--el-color-danger); }
    }
    &.info {
      background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
      .stat-icon { color: var(--el-color-info); }
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

.trace-card {
  :deep(.el-card__body) {
    height: 100%;
    padding: 16px;
  }
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-tree) {
  background: transparent;

  .el-tree-node__content {
    padding: 8px;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: var(--el-fill-color-lighter);
    }
  }
}

.trace-drawer {
  :deep(.el-drawer__header) {
    padding: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 0;
  }

  :deep(.el-drawer__body) {
    padding: 20px;
  }
}
</style>
