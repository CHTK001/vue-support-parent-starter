<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:route-line" class="title-icon" />
            链路追踪
          </h1>
          <p class="page-subtitle">实时查看请求调用链和执行路径</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ dataList.length }}</div>
            <div class="stat-label">追踪记录</div>
          </div>
        </div>
      </div>
    </div>

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
import { useConfigStore } from "@repo/core";
import { dateFormat } from "@repo/utils";
import { AnsiUp } from "ansi_up";
import { nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const timeLayoutRef = ref(null);
const openLogTime = ref(false);
const config = reactive({
  dialogVisible: false,
  dialogDetailData: {}
});
const heartbeatInterval = 30 * 1000; // 心跳间隔为30秒
const heartbeatTimeout = 60 * 1000; // 心跳超时时间为60秒
let heartbeatIntervalId, heartbeatTimeoutId;

// 心跳检测启动函数
const startHeartbeat = () => {
  heartbeatIntervalId = setInterval(function () {
    socketClient.value.send("ping"); // 发送心跳包

    // 重置心跳超时定时器
    clearTimeout(heartbeatTimeoutId);
    heartbeatTimeoutId = setTimeout(function () {
      console.log("Heartbeat timeout, closing the connection.");
      socketClient.value?.close(); // 超时未收到响应，关闭连接
      openSocket("ws://127.0.0.1:" + window.websocketPort);
      // 这里可以添加重新连接的逻辑
    }, heartbeatTimeout);
  }, heartbeatInterval);
};

const handleOpen = () => {
  console.log("WebSocket connection established.");
  startHeartbeat();
};

const handleClose = () => {
  console.log("WebSocket connection closed.");
  clearInterval(heartbeatIntervalId);
  clearTimeout(heartbeatTimeoutId);
};
// 判断消息是否为pong消息
function isPongMessage(message) {
  return message === "pong";
}

const ansiUp = new AnsiUp();
const form = reactive({
  message: null
});
const socketClient = ref();
const eventName = ref("message");
const sqlPre = ref();
const useConfigStoreObject = useConfigStore();
const dataList = reactive([]);
const closeSocket = async () => {
  socketClient.value?.close();
  socketClient.value = null;
};

const handleShowTrack = async data => {
  config.dialogVisible = true;
  config.dialogDetailData = data;
  await nextTick();
  setTimeout(async () => {
    Prism.highlightAll();
    // 假设你的SQL代码在模板的pre标签中
    // 使用Prism.highlightElement来高亮代码
    try {
      document.querySelectorAll("pre code").forEach(ele => {
        Prism.highlightElement(ele);
      });
    } catch (error) {}
  }, 300);
};
const openSocket = async urls => {
  closeSocket();
  socketClient.value = new WebSocket(urls);
  socketClient.value.onmessage = handleEvent;
  socketClient.value.onopen = handleOpen;
  socketClient.value.onclose = handleClose;
};
const filter = row => {
  if (!form.message) {
    return true;
  }

  if (!row.message) {
    return false;
  }
  return row?.message?.indexOf(form.message) > -1;
};
const handleEvent = async row => {
  try {
    row.data.text().then(data => {
      if (isPongMessage(data)) {
        // 重置心跳超时定时器
        return;
      }
      var item;
      try {
        item = JSON.parse(data);
      } catch (error) {}

      if ("AGENT_TRACE" !== item.event || !filter(item)) {
        return;
      }
      try {
        const it = JSON.parse(item.data);
        dataList.unshift(it);
        console.log(it);
        if (dataList.length > 10000) {
          dataList.pop();
        }
      } catch (error) {}
    });
  } catch (error) {
    return;
  }
};

onMounted(async () => {
  openSocket("ws://127.0.0.1:" + window.websocketPort);
});
onUnmounted(() => {
  closeSocket();
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
