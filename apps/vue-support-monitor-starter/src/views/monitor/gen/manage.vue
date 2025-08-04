<template>
  <div
    :class="containerClasses"
    :style="{
      '--layoutRadius': ($storage?.configure.layoutRadius || 10) + 'px',
      '--layoutBlur': ($storage?.configure.layoutBlur || 4) + 'px'
    }"
  >
    <el-container class="manage-layout rounded">
      <!-- 顶部导航栏 -->
      <el-header class="manage-header rounded flex items-center">
        <div class="manage-header__back cursor-pointer flex items-center hover:!text-primary transition-all duration-300" @click="router.go(-1)">
          <IconifyIconOnline icon="ep:arrow-left" class="mr-2" />
          <span>{{ $t("buttons.back") }}</span>
        </div>

        <!-- 数据源信息 -->
        <div class="manage-header__info ml-4 flex items-center">
          <el-avatar :size="28" class="mr-2 flex-shrink-0 bg-primary-light">
            <IconifyIconOnline :icon="getDataSourceIcon()" />
          </el-avatar>
          <span class="manage-header__title text-text_color_primary font-medium truncate" :title="item.data.genName">
            {{ item.data.genName }}
          </span>
        </div>

        <!-- 右侧工具栏 -->
        <div class="manage-header__tools ml-auto flex items-center gap-3">
          <el-tooltip content="刷新数据" placement="bottom">
            <el-button type="primary" text circle class="manage-header__btn" @click="handleHits">
              <IconifyIconOnline icon="ep:refresh" />
            </el-button>
          </el-tooltip>

          <el-tooltip content="帮助文档" placement="bottom">
            <el-button type="info" text circle class="manage-header__btn">
              <IconifyIconOnline icon="ep:question" />
            </el-button>
          </el-tooltip>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-main class="manage-main !p-[5px]">
        <!-- 分屏模式 -->
        <div v-if="singleSplit" class="manage-split-pane relative">
          <splitpane :splitSet="settingLR">
            <!-- 左侧面板 -->
            <template #paneL>
              <div v-if="visible.sideShow" class="manage-panel h-full">
                <panel
                  v-if="!!item.data.genId"
                  ref="panelRef"
                  :data="item.data"
                  @node-click="handleNodeClick"
                  @node-save-click="handleNodeSaveClick"
                  @node-edit-click="handleNodeEditClick"
                  @node-delete-click="handleNodeDeleteClick"
                />
              </div>
            </template>

            <!-- 右侧面板 -->
            <template #paneR>
              <Suspense>
                <template #default>
                  <ScLazy :time="200">
                    <keep-alive>
                      <component :is="layout[item.data.genType]" ref="componentRef" :data="item.data" class="h-full" @success="handleNodeSuccess" />
                    </keep-alive>
                  </ScLazy>
                </template>
                <template #fallback>
                  <div class="manage-loading flex items-center justify-center h-full">
                    <div class="manage-loading__content text-center">
                      <el-skeleton :rows="10" animated />
                      <p class="manage-loading__text mt-4 text-text_color_secondary">正在加载数据，请稍候...</p>
                    </div>
                  </div>
                </template>
              </Suspense>
            </template>
          </splitpane>
        </div>

        <!-- 全屏模式 -->
        <div v-else class="manage-full-content h-full">
          <component :is="layout[item.data.genType]" ref="componentRef" :data="item.data" class="h-full" @success="handleNodeSuccess" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
// import { fetchGenSessionHits } from "@/api/monitor/gen/session";
import { useGlobal } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import splitpane from "@repo/components/ReSplitPane";
import ScLazy from "@repo/components/ScLazy/index.vue";
import { useConfigStore } from "@repo/core";
import { message } from "@repo/utils";
import { Base64 } from "js-base64";
import { computed, defineAsyncComponent, onMounted, reactive, ref, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import panel from "./plugin/panel.vue";

// 全局配置
const { $storage, $config } = useGlobal();
const router = useRouter();

// 组件引用
const componentRef = ref();
const panelRef = ref();

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
  PROMETHEUS: defineAsyncComponent(() => import("./layout/prometheus/index.vue")),
  SERIAL: defineAsyncComponent(() => import("./layout/serial/index.vue"))
});

// 数据状态
const item = reactive({
  data: {}, // 当前数据源信息
  hits: {} // 数据源命中信息
});

// 界面显示状态
const visible = reactive({
  visible: false,
  sideShow: true // 是否显示侧边栏
});

/**
 * 计算是否使用分屏模式
 * 优先使用数据源的genSplit配置，如果没有配置则根据类型判断
 * SHELL、WEBRTC、VNC、PROMETHEUS、NACOS和SERIAL类型默认不使用分屏
 */
const singleSplit = computed(() => {
  // 如果明确设置了genSplit，则使用该值
  if (item.data.genSplit !== undefined && item.data.genSplit !== null) {
    return item.data.genSplit;
  }
  // 否则根据类型判断
  return (
    item.data.genType != "SHELL" && item.data.genType != "WEBRTC" && item.data.genType != "VNC" && item.data.genType != "PROMETHEUS" && item.data.genType != "NACOS" && item.data.genType != "SERIAL"
  );
});

/**
 * 计算分屏设置
 * 根据侧边栏显示状态动态调整分屏比例
 */
const settingLR = computed(() => {
  return {
    minPercent: visible.sideShow ? 10 : 0,
    defaultPercent: visible.sideShow ? 20 : 0,
    split: "vertical"
  };
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
    SERIAL: "mdi:serial-port",
    INFLUXDB: "devicon:influxdb",
    NACOS: "simple-icons:alibabacloud"
  };

  return iconMap[type] || "ri:database-2-line";
};

/**
 * 切换侧边栏显示状态
 */
const hideSide = () => {
  // 添加日志以便调试
  console.log("切换侧边栏状态，当前状态:", visible.sideShow);
  visible.sideShow = !visible.sideShow;
  // 强制更新分屏设置
  nextTick(() => {
    console.log("侧边栏新状态:", visible.sideShow);
  });
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
 * 打开管理界面
 * @param {String} mode - 打开模式
 */
const open = async mode => {
  visible.visible = true;
};

/**
 * 处理节点点击事件
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleNodeClick = async (data, node) => {
  componentRef.value.upgrade(data, node);
};

/**
 * 处理节点保存事件
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleNodeSaveClick = async (data, node) => {
  componentRef.value?.handleNodeSaveClick(data, node);
};

/**
 * 处理节点编辑事件
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleNodeEditClick = async (data, node) => {
  componentRef.value?.handleNodeEditClick(data, node);
};

/**
 * 处理节点删除事件
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleNodeDeleteClick = async (data, node) => {
  const success = componentRef.value?.handleNodeDeleteClick(data, node);
  if (success) {
    panelRef.value.handleRefreshTreeParentNode(node);
    message("删除成功", { type: "success" });
  }
};

/**
 * 处理节点操作成功事件
 * @param {Object} node - 节点对象
 */
const handleNodeSuccess = async node => {
  panelRef.value.handleRefreshTreeParentNode(node);
};

/**
 * 获取数据源命中信息
 */
const handleHits = async () => {
  if (!componentRef.value?.upgradeHits) {
    return;
  }

  try {
    // const res = await fetchGenSessionHits(item.data);
    // (res?.data || []).forEach(element => {
    //   item.hits[element.name] = element.fields;
    // });
    // componentRef.value.upgradeHits(item.hits);
    message("数据刷新功能暂时不可用", { type: "warning" });
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
  // 打开管理界面
  open();
});

// 计算容器类名
const containerClasses = computed(() => {
  return {
    "manage-container": true,
    "!overflow-hidden": true,
    "h-[100vh]": true,
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
  box-shadow: var(--el-box-shadow-light);
}

.manage-header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  height: 60px !important;
  padding: 0 20px;

  &__back {
    font-size: 14px;
    font-weight: 500;
  }

  &__info {
    max-width: 200px;
  }

  &__title {
    font-size: 15px;
    max-width: 150px;
  }

  &__btn {
    transition: all 0.3s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.manage-main {
  height: calc(100vh - 60px);
  overflow: hidden;
  position: relative;
}

.manage-split-pane,
.manage-full-content {
  width: 100%;
  height: 100%;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  transition: all 0.3s ease;
}

.manage-panel {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
}

.manage-loading {
  padding: 20px;

  &__content {
    max-width: 600px;
  }

  &__text {
    font-size: 14px;
  }
}

:deep(.splitter-pane-resizer.horizontal),
:deep(.splitter-pane-resizer.vertical) {
  background-color: var(--el-border-color) !important;
  opacity: 0.6;
  transition: all 0.3s;

  &:hover {
    background-color: var(--el-color-primary) !important;
    opacity: 1;
  }
}

.bg-primary-light {
  background-color: var(--el-color-primary-light-8);
}

/* 为不同数据源类型应用不同的样式 */
.manage-container.nacos-type {
  .manage-main {
    padding: 5px;
  }

  .manage-full-content {
    box-shadow: var(--el-box-shadow-light);
  }
}
</style>
