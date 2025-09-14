<template>
  <div class="sc-window-modal-demo">
    <!-- 基础功能演示 -->
    <div class="demo-section">
      <h3 class="section-title">基础窗口功能</h3>
      <div class="demo-controls">
        <el-button type="primary" @click="createBasicWindow">
          <IconifyIconOnline icon="carbon:add" class="mr-1" />
          创建基础窗口
        </el-button>
        <el-button type="success" @click="createCustomWindow">
          <IconifyIconOnline icon="carbon:settings" class="mr-1" />
          创建自定义窗口
        </el-button>
        <el-button type="warning" @click="createModalWindow">
          <IconifyIconOnline icon="carbon:popup" class="mr-1" />
          创建模态窗口
        </el-button>
        <el-button type="info" @click="createMultipleWindows">
          <IconifyIconOnline icon="carbon:copy" class="mr-1" />
          创建多个窗口
        </el-button>
      </div>
    </div>

    <!-- 窗口管理功能 -->
    <div class="demo-section">
      <h3 class="section-title">窗口管理功能</h3>
      <div class="demo-controls">
        <el-button @click="minimizeAllWindows">
          <IconifyIconOnline icon="carbon:minimize" class="mr-1" />
          最小化所有窗口
        </el-button>
        <el-button @click="restoreAllWindows">
          <IconifyIconOnline icon="carbon:restore" class="mr-1" />
          恢复所有窗口
        </el-button>
        <el-button @click="maximizeAllWindows">
          <IconifyIconOnline icon="carbon:maximize" class="mr-1" />
          最大化所有窗口
        </el-button>
        <el-button type="danger" @click="closeAllWindows">
          <IconifyIconOnline icon="carbon:close" class="mr-1" />
          关闭所有窗口
        </el-button>
      </div>
    </div>

    <!-- 拖拽模式切换 -->
    <div class="demo-section">
      <h3 class="section-title">拖拽模式设置</h3>
      <div class="demo-controls">
        <el-radio-group v-model="dragMode" @change="changeDragMode">
          <el-radio-button label="free">自由拖拽</el-radio-button>
          <el-radio-button label="grid">网格拖拽</el-radio-button>
        </el-radio-group>
        <el-input-number v-model="gridSize" :min="10" :max="50" :step="5" @change="changeGridSize" class="ml-4" />
        <span class="ml-2">网格大小</span>
      </div>
    </div>

    <!-- 磁吸功能设置 -->
    <div class="demo-section">
      <h3 class="section-title">磁吸功能设置</h3>
      <div class="demo-controls">
        <el-switch v-model="snapEnabled" @change="toggleSnap" active-text="启用磁吸" inactive-text="禁用磁吸" />
        <el-input-number v-model="snapDistance" :min="5" :max="50" :step="5" @change="changeSnapDistance" class="ml-4" :disabled="!snapEnabled" />
        <span class="ml-2">磁吸距离</span>
      </div>
    </div>

    <!-- 窗口信息显示 -->
    <div class="demo-section">
      <h3 class="section-title">窗口信息</h3>
      <div class="window-info">
        <el-card class="info-card">
          <template #header>
            <span>当前窗口统计</span>
          </template>
          <div class="info-item">
            <span>总窗口数：</span>
            <el-tag>{{ windowManager.windowInstances.value.length }}</el-tag>
          </div>
          <div class="info-item">
            <span>活跃窗口：</span>
            <el-tag type="success">{{ activeWindowCount }}</el-tag>
          </div>
          <div class="info-item">
            <span>最小化窗口：</span>
            <el-tag type="warning">{{ minimizedWindowCount }}</el-tag>
          </div>
          <div class="info-item">
            <span>最大化窗口：</span>
            <el-tag type="info">{{ maximizedWindowCount }}</el-tag>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 代码示例 -->
    <div class="demo-section">
      <h3 class="section-title">代码示例</h3>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础用法" name="basic">
          <CodeDisplay :code="basicCode" language="vue" />
        </el-tab-pane>
        <el-tab-pane label="自定义配置" name="custom">
          <CodeDisplay :code="customCode" language="vue" />
        </el-tab-pane>
        <el-tab-pane label="窗口管理" name="management">
          <CodeDisplay :code="managementCode" language="vue" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 窗口容器 -->
    <ScWindowModal ref="windowModalRef" />
  </div>
</template>

<script setup>
import { useWindowManager } from "@repo/components/ScWindowModal/composables/useWindowManager";
import ScWindowModal from "@repo/components/ScWindowModal/index.vue";
import { message } from "@repo/utils";
import { computed, onMounted, ref } from "vue";
import CodeDisplay from "./CodeDisplay.vue";

// 窗口管理器实例
const windowManager = useWindowManager();
const windowModalRef = ref();

// 拖拽模式
const dragMode = ref("free");
const gridSize = ref(20);

// 磁吸功能
const snapEnabled = ref(true);
const snapDistance = ref(20);

// 标签页
const activeTab = ref("basic");

// 计算属性
const activeWindowCount = computed(() => {
  return windowManager.windowInstances.value.filter((w) => !w.minimized && !w.maximized).length;
});

const minimizedWindowCount = computed(() => {
  return windowManager.windowInstances.value.filter((w) => w.minimized).length;
});

const maximizedWindowCount = computed(() => {
  return windowManager.windowInstances.value.filter((w) => w.maximized).length;
});

// 创建基础窗口
const createBasicWindow = () => {
  const windowInstance = windowManager.createWindow({
    title: "基础窗口",
    content: `
      <div style="padding: 20px;">
        <h4>这是一个基础窗口</h4>
        <p>支持拖拽、缩放、最大化、最小化等基本功能。</p>
        <el-button type="primary">按钮示例</el-button>
      </div>
    `,
    width: 400,
    height: 300,
    x: Math.random() * 200 + 100,
    y: Math.random() * 200 + 100,
  });
  message(`创建窗口成功，ID: ${windowInstance.id}`, { type: "success" });
};

// 创建自定义窗口
const createCustomWindow = () => {
  const windowInstance = windowManager.createWindow({
    title: "自定义窗口",
    icon: "carbon:settings",
    content: `
      <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
        <h4 style="margin: 0 0 16px 0;">自定义样式窗口</h4>
        <p>这个窗口使用了自定义的样式和图标。</p>
        <div style="margin-top: 16px;">
          <el-tag effect="dark">标签1</el-tag>
          <el-tag effect="dark" type="success" style="margin-left: 8px;">标签2</el-tag>
        </div>
      </div>
    `,
    width: 450,
    height: 350,
    x: Math.random() * 200 + 150,
    y: Math.random() * 200 + 150,
    resizable: true,
    minimizable: true,
    maximizable: true,
  });
  message(`创建自定义窗口成功，ID: ${windowInstance.id}`, { type: "success" });
};

// 创建模态窗口
const createModalWindow = () => {
  const windowInstance = windowManager.createWindow({
    title: "模态窗口",
    icon: "carbon:popup",
    content: `
      <div style="padding: 20px; text-align: center;">
        <h4>这是一个模态窗口</h4>
        <p>模态窗口会阻止用户与其他窗口交互，直到关闭此窗口。</p>
        <el-button type="danger" onclick="window.windowManager.closeAllWindows()">关闭所有窗口</el-button>
      </div>
    `,
    width: 400,
    height: 250,
    modal: true,
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight / 2 - 125,
  });
  message(`创建模态窗口成功，ID: ${windowInstance.id}`, { type: "success" });
};

// 创建多个窗口
const createMultipleWindows = () => {
  const titles = ["窗口A", "窗口B", "窗口C"];
  const colors = ["#409EFF", "#67C23A", "#E6A23C"];

  titles.forEach((title, index) => {
    setTimeout(() => {
      windowManager.createWindow({
        title,
        content: `
          <div style="padding: 20px; background-color: ${colors[index]}20; border-left: 4px solid ${colors[index]};">
            <h4 style="color: ${colors[index]}; margin: 0 0 16px 0;">${title}</h4>
            <p>这是第 ${index + 1} 个窗口，演示多窗口管理功能。</p>
            <p>每个窗口都有独立的 z-index 层级管理。</p>
          </div>
        `,
        width: 350,
        height: 250,
        x: 100 + index * 50,
        y: 100 + index * 50,
      });
    }, index * 200);
  });
  message("正在创建多个窗口...", { type: "info" });
};

// 窗口管理功能
const minimizeAllWindows = () => {
  windowManager.windowInstances.value.forEach((window) => {
    if (!window.minimized) {
      windowManager.minimizeWindow(window.id);
    }
  });
  message("所有窗口已最小化", { type: "success" });
};

const restoreAllWindows = () => {
  windowManager.windowInstances.value.forEach((window) => {
    if (window.minimized || window.maximized) {
      windowManager.restoreWindow(window.id);
    }
  });
  message("所有窗口已恢复", { type: "success" });
};

const maximizeAllWindows = () => {
  windowManager.windowInstances.value.forEach((window) => {
    if (!window.maximized) {
      windowManager.toggleMaximize(window);
    }
  });
  message("所有窗口已最大化", { type: "success" });
};

const closeAllWindows = () => {
  const windowIds = [...windowManager.windowInstances.value.map((w) => w.id)];
  windowIds.forEach((id) => {
    windowManager.closeWindow(id);
  });
  message("所有窗口已关闭", { type: "success" });
};

// 设置功能
const changeDragMode = (mode) => {
  // windowManager.setDragMode(mode); // 方法不存在，已注释
  message(`拖拽模式已切换为: ${mode === "free" ? "自由拖拽" : "网格拖拽"}`, { type: "info" });
};

const changeGridSize = (size) => {
  // windowManager.setGridSize(size); // 方法不存在，已注释
  message(`网格大小已设置为: ${size}px`, { type: "info" });
};

const toggleSnap = (enabled) => {
  // windowManager.setSnapEnabled(enabled); // 方法不存在，已注释
  message(`磁吸功能已${enabled ? "启用" : "禁用"}`, { type: "info" });
};

const changeSnapDistance = (distance) => {
  // windowManager.setSnapDistance(distance); // 方法不存在，已注释
  message(`磁吸距离已设置为: ${distance}px`, { type: "info" });
};

// 代码示例
const basicCode = `<template>
  <div>
    <el-button @click="createWindow">创建窗口</el-button>
    <ScWindowModal ref="windowModalRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ScWindowModal, useWindowManager } from '@repo/components'

const windowManager = useWindowManager()
const windowModalRef = ref()

const createWindow = () => {
  windowManager.createWindow({
    title: '我的窗口',
    content: '<div style="padding: 20px;">窗口内容</div>',
    width: 400,
    height: 300
  })
}
<\/script>`;

const customCode = `<script setup>
const createCustomWindow = () => {
  windowManager.createWindow({
    title: '自定义窗口',
    icon: 'carbon:settings',
    content: '<div>自定义内容</div>',
    width: 500,
    height: 400,
    x: 100,
    y: 100,
    resizable: true,
    minimizable: true,
    maximizable: true,
    modal: false,
    zIndex: 1000
  })
}
<\/script>`;

const managementCode = `<script setup>
// 窗口管理操作
const minimizeWindow = (id) => windowManager.minimizeWindow(id)
const maximizeWindow = (id) => windowManager.toggleMaximize(id)
const restoreWindow = (id) => windowManager.restoreWindow(id)
const closeWindow = (id) => windowManager.closeWindow(id)
const activateWindow = (id) => windowManager.setActiveWindow(id)

// 设置拖拽模式
// windowManager.setDragMode('grid') // 方法不存在，已注释
// windowManager.setGridSize(20) // 方法不存在，已注释

// 设置磁吸功能
// windowManager.setSnapEnabled(true) // 方法不存在，已注释
// windowManager.setSnapDistance(15) // 方法不存在，已注释
<\/script>`;

// 组件挂载时的初始化
onMounted(() => {
  // 设置全局窗口管理器引用，供内联脚本使用
  window.windowManager = windowManager;
});
</script>

<style scoped>
.sc-window-modal-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.demo-controls .el-button {
  margin: 0;
}

.window-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.info-item span:first-child {
  font-weight: 500;
  color: #606266;
}

.mr-1 {
  margin-right: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.ml-4 {
  margin-left: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .demo-controls .el-button {
    width: 100%;
  }

  .window-info {
    grid-template-columns: 1fr;
  }
}
</style>
