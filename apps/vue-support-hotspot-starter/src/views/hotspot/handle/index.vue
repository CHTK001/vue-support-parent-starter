<template>
  <div class="page flex flex-col h-full">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:file-list-3-line" class="title-icon" />
            句柄监控
          </h1>
          <p class="page-subtitle">实时查看系统句柄信息和调用链</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ data.data.length }}</div>
            <div class="stat-label">总句柄数</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速导航 -->
    <div class="quick-nav">
      <el-card shadow="hover">
        <div class="nav-header">
          <IconifyIconOnline icon="ri:list-check" />
          <span>快速导航</span>
        </div>
        <div class="nav-list">
          <div v-for="it in data.data" :key="it.index" class="nav-item" :title="it.title" @click="handleClick(it.index)">
            <IconifyIconOnline icon="ri:arrow-right-s-line" class="nav-icon" />
            <span class="truncate" v-html="it.title" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 信息卡片 -->
    <div class="info-card">
      <el-card shadow="never">
        <div class="info-content" v-html="data.title" />
      </el-card>
    </div>

    <!-- 句柄列表 -->
    <div class="flex-1 overflow-auto">
      <div v-for="it in data.data" :id="'element' + it.index" :key="it.index" class="handle-item">
        <el-card shadow="hover" class="mb-4">
          <template #header>
            <div class="card-header">
              <span class="item-number">{{ it.index + 1 }}</span>
              <span class="item-title" v-html="it.title" />
            </div>
          </template>
          <pre class="code-block"><code v-html="it.code" /></pre>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { onBeforeMount, onUnmounted, reactive, ref } from "vue";
import { wsService } from "@/utils/websocket";

let unsubscribe = null;
const loading = ref(false);

function scrollToElement(element) {
  element?.scrollIntoView({
    behavior: "smooth", // 平滑滚动
    block: "start", // 元素顶部与视窗顶部对齐
    // 或者 'end' 让元素底部与视窗底部对齐
    // 或者 'center' 让元素在视窗中垂直居中
    inline: "nearest" // 水平方向上，选择最近的边缘对齐
    // 或者 'start', 'end', 'center'
  });
}

const data = reactive({
  data: [],
  title: ""
});

const handleClick = async index => {
  scrollToElement(document.getElementById("element" + index));
};

// 解析句柄数据
const parseHandleData = json => {
  const arr = [];
  if (json.data && json.data.length > 0) {
    json.data.forEach((item, index) => {
      const message = item.message || "";
      let resourceType = "未知资源";
      let resourceColor = "var(--el-text-color-regular)";

      if (message.includes("FileChannel")) {
        resourceType = "文件通道";
        resourceColor = "var(--el-color-primary)";
      } else if (message.includes("socket")) {
        resourceType = "Socket 连接";
        resourceColor = "var(--el-color-success)";
      } else if (message.includes("Pipe")) {
        resourceType = "管道";
        resourceColor = "var(--el-color-warning)";
      } else if (message.includes("selector")) {
        resourceType = "选择器";
        resourceColor = "var(--el-color-info)";
      } else if (message.includes("Opened")) {
        resourceType = "文件句柄";
        resourceColor = "var(--el-color-danger)";
      }

      let stackTrace = "";
      if (item.stack && item.stack.length > 0) {
        stackTrace = item.stack
          .map(s => {
            if (typeof s === "string") return `  at ${s}`;
            return `  at ${s.className || ""}.${s.methodName || ""}(${s.fileName || ""}:${s.lineNumber || ""})`;
          })
          .join("\n");
      }

      arr.push({
        index: index,
        id: item.id || `handle_${index}`,
        title: `<span style='color:${resourceColor};'>${resourceType}</span>`,
        code: `${message}\n\n调用堆栈:\n${stackTrace || "无堆栈信息"}`
      });
    });
  }

  const total = json.total || arr.length;
  const agentStatus = json.agentInstalled ? "已安装" : "未安装";
  data.title = `<strong>句柄监控</strong> - 发现 <span style='color:var(--el-color-danger);'>${total}</span> 个打开的句柄 (Agent: ${agentStatus})`;
  data.data = arr;
};

// 刷新数据
const refreshData = () => {
  loading.value = true;
  http
    .get((window.agentPath || "/agent") + "/handle")
    .then(res => {
      parseHandleData(res.data);
    })
    .catch(() => {
      data.title = "<strong>句柄监控</strong> - 无法获取数据";
      data.data = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "HANDLE_INFO") {
    try {
      const wsData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      parseHandleData(wsData);
    } catch (error) {
      console.error("解析句柄数据失败:", error);
    }
  }
};

onBeforeMount(async () => {
  refreshData();
  // 订阅 WebSocket 消息
  wsService.connect();
  unsubscribe = wsService.subscribe("JVM", "HANDLE_INFO", handleWsMessage);
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

.quick-nav {
  position: fixed;
  top: 200px;
  right: 16px;
  z-index: 100;
  width: 280px;
  max-height: 400px;

  .nav-header {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-bottom: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .nav-list {
    max-height: 320px;
    overflow-y: auto;
  }

  .nav-item {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }

    .nav-icon {
      flex-shrink: 0;
      font-size: 16px;
    }
  }
}

.info-card {
  margin-bottom: 16px;

  .info-content {
    font-size: 14px;
    line-height: 1.6;
  }
}

.handle-item {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    gap: 12px;
    align-items: center;

    .item-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-radius: 50%;
    }

    .item-title {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }
  }

  .code-block {
    padding: 16px;
    margin: 0;
    overflow-x: auto;
    font-family: "Courier New", monospace;
    font-size: 13px;
    line-height: 1.6;
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
