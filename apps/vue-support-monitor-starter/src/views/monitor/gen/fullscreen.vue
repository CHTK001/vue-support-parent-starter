<template>
  <div
    :class="containerClasses"
    :style="{
      '--layoutRadius': ($storage?.configure.layoutRadius || 10) + 'px',
      '--layoutBlur': ($storage?.configure.layoutBlur || 4) + 'px'
    }"
  >
    <el-container class="manage-layout rounded">
      <!-- 主内容区域 - 占满整个屏幕 -->
      <el-main class="manage-main !p-0">
        <div class="manage-full-content h-full">
          <component :is="layout[item.data.genType]" ref="componentRef" :data="item.data" class="h-full" @success="handleNodeSuccess" />
        </div>
      </el-main>

      <!-- 右侧悬浮按钮区域 -->
      <div class="floating-controls">
        <div class="floating-button" @click="showControls = !showControls">
          <IconifyIconOnline :icon="showControls ? 'ep:close' : 'ep:menu'" />
        </div>

        <!-- 控制面板 -->
        <transition name="slide-fade">
          <div v-if="showControls" class="control-panel">
            <!-- 数据源信息 -->
            <div class="control-panel-header">
              <el-avatar :size="28" class="mr-2 flex-shrink-0 bg-primary-light">
                <IconifyIconOnline :icon="getDataSourceIcon()" />
              </el-avatar>
              <span class="control-panel-title text-text_color_primary font-medium truncate" :title="item.data.genName">
                {{ item.data.genName }}
              </span>
            </div>

            <div class="control-panel-actions">
              <el-tooltip content="刷新数据" placement="top">
                <el-button type="primary" circle class="control-panel-btn" @click="handleHits">
                  <IconifyIconOnline icon="ep:refresh" />
                </el-button>
              </el-tooltip>

              <el-tooltip content="退出全屏" placement="top">
                <el-button type="warning" circle class="control-panel-btn" @click="router.push('/database/index')">
                  <IconifyIconOnline icon="ep:back" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </transition>
      </div>
    </el-container>
  </div>
</template>

<script setup>
import { fetchGenSessionHits } from "@/api/monitor/gen/session";
import { useGlobal } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScLazy from "@repo/components/ScLazy/index.vue";
import { useConfigStore } from "@repo/core";
import { message } from "@repo/utils";
import { Base64 } from "js-base64";
import { computed, defineAsyncComponent, onMounted, reactive, ref, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";

// 全局配置
const { $storage, $config } = useGlobal();
const router = useRouter();

// 组件引用
const componentRef = ref();

// 控制面板显示状态
const showControls = ref(false);

/**
 * 异步加载各类型数据源的组件
 * 根据数据源类型动态加载对应的组件
 */
const layout = reactive({
  VNC: defineAsyncComponent(() => import("./layout/vnc/index.vue")),
  JDBC: defineAsyncComponent(() => import("./layout/jdbc/index.vue")),
  WEBRTC: defineAsyncComponent(() => import("./layout/webrtc/index.vue")),
  INFLUXDB: defineAsyncComponent(() => import("./layout/influxdb/index.vue")),
  ZOOKEEPER: defineAsyncComponent(() => import("./layout/zookeeper/index.vue")),
  MONGODB: defineAsyncComponent(() => import("./layout/mongodb/index.vue")),
  SHELL: defineAsyncComponent(() => import("./layout/shell/index.vue")),
  MQTT: defineAsyncComponent(() => import("./layout/mqtt/index.vue")),
  REDIS: defineAsyncComponent(() => import("./layout/redis/index.vue")),
  NACOS: defineAsyncComponent(() => import("./layout/nacos/index.vue")),
  PROMETHEUS: defineAsyncComponent(() => import("./layout/prometheus/index.vue"))
});

// 数据状态
const item = reactive({
  data: {}, // 当前数据源信息
  hits: {} // 数据源命中信息
});

/**
 * 获取数据源图标
 * @returns {string} 图标名称
 */
const getDataSourceIcon = () => {
  const type = item.data.genType;
  const iconMap = {
    JDBC: "ri:database-2-line",
    ZOOKEEPER: "devicon:electron",
    WEBRTC: "ri:video-chat-line",
    VNC: "simple-icons:victronenergy",
    PROMETHEUS: "devicon:prometheus",
    REDIS: "devicon:redis",
    MONGODB: "devicon:mongodb",
    MQTT: "simple-icons:mqtt",
    SHELL: "devicon:powershell",
    INFLUXDB: "devicon:influxdb",
    NACOS: "simple-icons:alibabacloud"
  };

  return iconMap[type] || "ri:database-2-line";
};

/**
 * 设置数据源数据
 * @param {Object} data - 数据源信息
 * @returns {Object} - 当前实例，支持链式调用
 */
const setData = data => {
  Object.assign(item.data, data);
  return this;
};

/**
 * 处理节点操作成功事件
 * @param {Object} node - 节点对象
 */
const handleNodeSuccess = async node => {
  // 在全屏模式下，不需要处理节点操作
};

/**
 * 获取数据源命中信息
 */
const handleHits = async () => {
  if (!componentRef.value?.upgradeHits) {
    return;
  }

  try {
    const res = await fetchGenSessionHits(item.data);
    (res?.data || []).forEach(element => {
      item.hits[element.name] = element.fields;
    });
    componentRef.value.upgradeHits(item.hits);
    message("数据刷新成功", { type: "success" });
    // 刷新后自动隐藏控制面板
    setTimeout(() => {
      showControls.value = false;
    }, 1000);
  } catch (error) {
    message("数据刷新失败", { type: "error" });
  }
};

// 组件挂载时初始化
onMounted(async () => {
  const route = useRoute();
  // 从URL参数中解析数据源信息
  setData(JSON.parse(Base64.decode(route.query.data)));
  // 获取命中信息
  handleHits();
  // 加载配置
  useConfigStore().load();
  // 添加全局样式
  document.documentElement.classList.add("prometheus-theme");
});

// 组件卸载时清理全局样式
onBeforeUnmount(() => {
  document.documentElement.classList.remove("prometheus-theme");
});

// 计算容器类名
const containerClasses = computed(() => {
  return {
    "manage-container": true,
    "!overflow-hidden": true,
    "h-[100vh]": true,
    "fullscreen-mode": true,
    [`${item.data.genType?.toLowerCase()}-type`]: !!item.data.genType
  };
});
</script>

<style lang="scss" scoped>
.manage-container {
  background-color: var(--el-bg-color);
}

.manage-layout {
  height: 100%;
  position: relative;
}

.manage-main {
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.manage-full-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 右侧悬浮控制区域 */
.floating-controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: row-reverse;
  align-items: flex-start;
}

/* 悬浮按钮样式 */
.floating-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  z-index: 10;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
  }
}

/* 控制面板样式 */
.control-panel {
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 16px;
  margin-right: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-width: 200px;
  margin-bottom: 10px;

  &-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &-title {
    font-size: 15px;
    max-width: 150px;
  }

  &-actions {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
  }

  &-btn {
    transition: all 0.3s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.bg-primary-light {
  background-color: var(--el-color-primary-light-8);
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* 为不同数据源类型应用不同的样式 */
.manage-container.nacos-type,
.manage-container.prometheus-type {
  .manage-main {
    padding: 0;
  }
}

/* Prometheus 特定样式 */
.prometheus-dashboard {
  :deep(.el-main) {
    background-color: var(--prometheus-bg-color, #111217);
  }

  :deep(.grid-item-content) {
    background-color: var(--prometheus-card-bg, #181b1f);
    border: 1px solid var(--prometheus-border-color, #242424);
    border-radius: 6px;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.3);
  }

  :deep(.chart-container) {
    background-color: transparent;
  }

  :deep(.el-card) {
    background-color: var(--prometheus-card-bg, #181b1f);
    border: 1px solid var(--prometheus-border-color, #242424);
    color: var(--prometheus-text-color, #e0e0e0);
  }

  :deep(.el-card__header) {
    border-bottom: 1px solid var(--prometheus-border-color, #242424);
  }

  :deep(.el-table) {
    background-color: var(--prometheus-card-bg, #181b1f);
    color: var(--prometheus-text-color, #e0e0e0);

    th,
    td {
      background-color: var(--prometheus-card-bg, #181b1f);
      border-bottom: 1px solid var(--prometheus-border-color, #242424);
    }

    tr:hover > td {
      background-color: rgba(77, 182, 172, 0.1) !important;
    }
  }

  :deep(.el-input__inner) {
    background-color: var(--prometheus-card-bg, #181b1f);
    border-color: var(--prometheus-border-color, #242424);
    color: var(--prometheus-text-color, #e0e0e0);
  }

  :deep(.el-button--primary) {
    background-color: var(--prometheus-highlight-color, #4db6ac);
    border-color: var(--prometheus-highlight-color, #4db6ac);
  }

  :deep(.el-pagination) {
    background-color: var(--prometheus-card-bg, #181b1f);
    color: var(--prometheus-text-color, #e0e0e0);
  }

  :deep(.el-pagination button:disabled) {
    background-color: var(--prometheus-bg-color, #111217);
    color: var(--prometheus-text-secondary, #a0a0a0);
  }

  :deep(.el-select-dropdown) {
    background-color: var(--prometheus-card-bg, #181b1f);
    border: 1px solid var(--prometheus-border-color, #242424);
  }

  :deep(.el-select-dropdown__item) {
    color: var(--prometheus-text-color, #e0e0e0);

    &.hover,
    &:hover {
      background-color: rgba(77, 182, 172, 0.1);
    }

    &.selected {
      color: var(--prometheus-highlight-color, #4db6ac);
    }
  }

  :deep(.el-tabs__item) {
    color: var(--prometheus-text-secondary, #a0a0a0);

    &.is-active {
      color: var(--prometheus-highlight-color, #4db6ac);
    }
  }

  :deep(.el-tabs__nav-wrap::after) {
    background-color: var(--prometheus-border-color, #242424);
  }

  :deep(.el-tabs__active-bar) {
    background-color: var(--prometheus-highlight-color, #4db6ac);
  }

  /* 图表样式 */
  :deep(.echarts) {
    background-color: transparent !important;
  }

  :deep(.chart-title) {
    color: var(--prometheus-text-color, #e0e0e0);
  }
}
</style>
