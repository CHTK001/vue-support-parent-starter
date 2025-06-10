<template>
  <div class="h-full">
    <!-- 现代化对话框设计 -->
    <ScDialog v-model="config.visible" :close-on-click-modal="false" width="700" class="modern-dialog" destroy-on-close
      draggable @closed="handleClose">
      <template #header>
        <div class="dialog-header">
          <IconifyIconOnline icon="ep:monitor" class="mr-2" />
          <span>应用实例详情</span>
        </div>
      </template>
      
      <!-- 空状态展示 -->
      <el-empty v-if="config.form.length == 0" :image-size="200" description="暂无应用实例" class="empty-state" />

      <!-- 应用实例列表 -->
      <div v-else class="instance-list">
        <div v-for="(item, index) in config.form.monitorRequests" :key="index" class="app-wrapper"
          :class="{ 'app-wrapper-active': item?.metadata?.applicationActive === 'UP' }">
          <div class="media-content">
            <div class="app-logo">
              <IconifyIconOnline icon="ep:monitor" />
            </div>
            
            <div class="app-content">
              <h3 class="app-title">{{ item?.metadata?.applicationName }}</h3>
              <div class="app-tags">
                <el-tag :type="item?.metadata?.applicationActive === 'UP' ? 'success' : 'warning'" effect="light" size="small">
                  {{ item?.metadata?.applicationActive }}
                </el-tag>
                <el-tag v-if="item?.metadata?.applicationProfile" size="small" type="info" effect="plain" class="ml-2">
                  {{ item?.metadata?.applicationProfile }}
                </el-tag>
              </div>
              
              <div class="app-meta">
                <div class="meta-item">
                  <IconifyIconOnline icon="ep:connection" class="mr-1" />
                  <span>{{ item.host }}:{{ item.port }}</span>
                </div>
                <div class="meta-item" v-if="item?.metadata?.contextPath">
                  <IconifyIconOnline icon="ep:link" class="mr-1" />
                  <span>{{ item?.metadata?.contextPath }}</span>
                </div>
              </div>
              
              <div class="app-desc">
                {{ item?.metadata?.applicationDesc || `${item?.metadata?.applicationName} 服务实例` }}
              </div>
              
              <div class="app-footer">
                <div class="app-actions">
                  <el-button v-for="(action, idx) in getActionButtons(item)" :key="idx"
                    :type="action.type" class="action-btn btn-text"
                    @click="action.handler(item)">
                    <IconifyIconOnline :icon="action.icon"  />
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScDialog>

    <!-- 插件对话框组件 -->
    <component :is="LogDialog" ref="logDialogRef" />
    <component :is="LogSearchDialog" ref="logSearchDialogVisibleRef" />
    <component :is="EnvDialog" ref="envDialogRef" />
    <component :is="CpuDialog" ref="cpuDialogVisibleRef" :history="true" :condition="condition" />
    <component :is="MemDialog" ref="memDialogVisibleRef" :history="true" :condition="condition" />
    <component :is="CacheDialog" ref="cacheDialogRef" />
    <component :is="ThreadDialog" ref="threadDialogVisibleRef" />
    <component :is="MapDialog" ref="mapDialogVisibleRef" />
    <component :is="ConfigpropsDialog" ref="configpropsDialogRef" />
  </div>
</template>

<script setup>
import { Base64 } from "js-base64";
import { defineAsyncComponent, nextTick, reactive, ref, defineEmits, defineExpose } from "vue";
import { router } from "@repo/core";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import dayjs from 'dayjs';

// 组件引用
const logDialogRef = ref();
const configpropsDialogRef = ref();
const mapDialogVisibleRef = ref();
const threadDialogVisibleRef = ref();
const cacheDialogRef = ref();
const memDialogVisibleRef = ref();
const cpuDialogVisibleRef = ref();
const envDialogRef = ref();
const logSearchDialogVisibleRef = ref();

// 异步组件加载
const LogDialog = defineAsyncComponent(() => import("./plugins/logger.vue"));
const EnvDialog = defineAsyncComponent(() => import("./plugins/env.vue"));
const ConfigpropsDialog = defineAsyncComponent(() => import("./plugins/configprops.vue"));
const CacheDialog = defineAsyncComponent(() => import("./plugins/cache.vue"));
const CpuDialog = defineAsyncComponent(() => import("../dashboard/portlet/cpu.vue"));
const MemDialog = defineAsyncComponent(() => import("../dashboard/portlet/mem.vue"));
const ThreadDialog = defineAsyncComponent(() => import("./plugins/thread.vue"));
const MapDialog = defineAsyncComponent(() => import("./plugins/map.vue"));
const LogSearchDialog = defineAsyncComponent(() => import("./plugins/log.vue"));

// 事件
const emit = defineEmits([]);

// 配置数据
const config = reactive({
  visible: false,
  isSaveing: false,
  configList: [],
  title: "详情",
  mode: "",
  appName: "",
  form: []
});

// 条件设置
const condition = reactive({
  appName: config.form?.metadata?.applicationName,
  serverHost: config.form.host,
  serverPort: config.form.port,
  fromTimestamp: new Date(),
  toTimestamp: new Date(new Date().getTime() - 60 * 60 * 1000),
  count: 100
});

// 注册条件
const registerCondition = () => {
  condition.appName = config.form?.metadata?.applicationName;
  condition.serverHost = config.form.host;
  condition.serverPort = config.form.port;
  condition.toTimestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");
  condition.fromTimestamp = dayjs().subtract(6, 'hour').format("YYYY-MM-DD HH:mm:ss");
  condition.count = 100;
};

// 处理关闭
const handleClose = () => {
  config.form = [];
};

// 打开数据监控面板
const doOpenPin = (item) => {
  router.push({
    path: "/service/view",
    query: {
      data: Base64.encode(JSON.stringify(item))
    }
  });
};

// 打开环境配置
const doOpenEnv = (item) => {
  registerCondition();
  nextTick(() => {
    envDialogRef.value.open(item);
  });
};

// 打开系统参数
const doIoenConfigprops = (item) => {
  registerCondition();
  nextTick(() => {
    configpropsDialogRef.value.open(item);
  });
};

// 打开系统缓存
const doOpenCache = (item) => {
  registerCondition();
  nextTick(() => {
    cacheDialogRef.value.open(item);
  });
};

// 打开系统内存
const doMap = (item) => {
  registerCondition();
  nextTick(() => {
    mapDialogVisibleRef.value.open(item);
  });
};

// 打开系统线程
const doThread = (item) => {
  registerCondition();
  nextTick(() => {
    threadDialogVisibleRef.value.open(item);
  });
};

// 快捷操作按钮配置
const getActionButtons = (item) => {
  return [
    {
      title: '访问服务',
      icon: 'ep:link',
      type: 'primary',
      handler: () => window.open(`http://${item.host}:${item.port}${item.metadata?.contextPath}`, '_blank'),
      show: true
    },
    {
      title: '监控面板',
      icon: 'ep:data-board',
      type: 'success',
      handler: () => doOpenPin(item),
      show: item.metadata?.endpointUrl?.length > 0
    },
    {
      title: '环境配置',
      icon: 'ep:setting',
      type: 'warning',
      handler: () => doOpenEnv(item),
      show: hasEndpoint(item, 'env')
    },
    {
      title: '系统参数',
      icon: 'ep:tools',
      type: 'info',
      handler: () => doIoenConfigprops(item),
      show: hasEndpoint(item, 'configprops')
    },
    {
      title: '系统缓存',
      icon: 'ep:cpu',
      type: 'success',
      handler: () => doOpenCache(item),
      show: hasEndpoint(item, 'caches')
    },
    {
      title: '系统内存',
      icon: 'ep:histogram',
      type: 'warning',
      handler: () => doMap(item),
      show: hasEndpoint(item, 'map')
    },
    {
      title: '系统线程',
      icon: 'ep:share',
      type: 'info',
      handler: () => doThread(item),
      show: hasEndpoint(item, 'thread')
    },
  ].filter(btn => btn.show);
};

// 检查端点
const hasEndpoint = (item, endpointsValue) => {
  const metadata = item.metadata;
  if (!metadata) {
    return false;
  }
  const endpoints = metadata.endpoints;
  if (!endpoints) {
    return false;
  }

  if (endpoints === "*") {
    return true;
  }
  const endpintsArray = endpoints.split(",");
  return endpintsArray.indexOf(endpointsValue) > -1;
};

// 打开对话框
const open = async (mode, appName) => {
  config.visible = true;
  config.mode = mode;
  config.appName = appName;
  return this;
};

// 设置数据
const setData = (form) => {
  config.form = form;
  registerCondition();
  return this;
};

// 导出方法
defineExpose({
  open,
  setData
});
</script>

<style lang="scss" scoped>
.dialog-header {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}

.instance-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
  padding: 4px;
}

.app-wrapper {
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);
    
    &::before {
      height: 4px;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0;
    background-color: var(--el-color-primary);
    transition: height 0.3s ease;
    z-index: 1;
  }
  
  &.app-wrapper-active {
    &::before {
      background-color: var(--el-color-success);
    }
  }
  
  .media-content {
    display: flex;
    padding: 16px;
  }
  
  .app-logo {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    margin-right: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color-light);
    font-size: 32px;
    color: var(--el-color-primary);
  }
  
  .app-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .app-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .app-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 8px;
    
    .meta-item {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: var(--el-text-color-secondary);
      padding: 4px 10px;
      background-color: var(--el-fill-color-light);
      border-radius: 12px;
      
      &:hover {
        background-color: var(--el-fill-color);
        color: var(--el-color-primary);
      }
    }
  }
  
  .app-desc {
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
  }
  
  .app-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    
    .app-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .action-btn {
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
      }
    }
  }
}

.empty-state {
  padding: 40px 0;
  
  .empty-text {
    margin-top: 10px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}
</style>
