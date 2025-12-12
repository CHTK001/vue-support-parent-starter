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
            <span v-html="it.title" class="truncate" />
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
import { onBeforeMount, reactive } from "vue";

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

onBeforeMount(async () => {
  http.get((window.agentPath || "/agent") + "/process").then(res => {
    const json = res.data;
    const arr = [];
    let _index = 0;

    // 基本进程信息
    arr.push({
      index: _index++,
      id: "process_info",
      title: `<span style='color:var(--el-color-primary);'>进程信息</span>`,
      code: `进程名称: ${json.name}\nPID: ${json.pid}\nJVM: ${json.vmName} ${json.vmVersion}\n厂商: ${json.vmVendor}\n处理器数: ${json.availableProcessors}`
    });

    // 内存信息
    if (json.memory) {
      const mem = json.memory;
      const formatBytes = (bytes) => {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
        return (bytes / 1024).toFixed(2) + " KB";
      };
      arr.push({
        index: _index++,
        id: "memory_info",
        title: `<span style='color:var(--el-color-success);'>内存使用</span>`,
        code: `最大内存: ${formatBytes(mem.maxMemory)}\n已分配: ${formatBytes(mem.totalMemory)}\n已使用: ${formatBytes(mem.usedMemory)}\n空闲: ${formatBytes(mem.freeMemory)}\n使用率: ${((mem.usedMemory / mem.maxMemory) * 100).toFixed(2)}%`
      });
    }

    // 启动参数
    if (json.inputArguments && json.inputArguments.length > 0) {
      arr.push({
        index: _index++,
        id: "jvm_args",
        title: `<span style='color:var(--el-color-warning);'>JVM 启动参数</span>`,
        code: json.inputArguments.join("\n")
      });
    }

    // 运行时间
    const formatDuration = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`;
      if (hours > 0) return `${hours}小时 ${minutes % 60}分钟 ${seconds % 60}秒`;
      if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`;
      return `${seconds}秒`;
    };
    arr.push({
      index: _index++,
      id: "uptime",
      title: `<span style='color:var(--el-color-info);'>运行时间</span>`,
      code: `启动时间: ${new Date(json.startTime).toLocaleString()}\n运行时长: ${formatDuration(json.uptime)}`
    });

    data.title = `<strong>JVM 进程信息</strong> - PID: ${json.pid}`;
    data.data = arr;
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

.title-section {
  flex: 1;
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

.quick-nav {
  position: fixed;
  top: 200px;
  right: 16px;
  width: 280px;
  max-height: 400px;
  z-index: 100;

  .nav-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .nav-list {
    max-height: 320px;
    overflow-y: auto;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    font-size: 13px;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
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
    align-items: center;
    gap: 12px;

    .item-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      border-radius: 50%;
      font-weight: 600;
      font-size: 14px;
    }

    .item-title {
      flex: 1;
      font-weight: 500;
      font-size: 14px;
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
    margin: 0;
  }
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
