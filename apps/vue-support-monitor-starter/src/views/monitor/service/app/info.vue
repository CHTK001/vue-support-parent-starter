<template>
  <div class="h-full">
    <!-- 现代化对话框设计 -->
    <el-dialog v-model="config.visible" :close-on-click-modal="false" width="700" class="modern-dialog" destroy-on-close
      draggable @closed="handleClose">
      <!-- 空状态展示 -->
      <el-empty v-if="config.form.length == 0" :image-size="200" description="暂无应用实例" class="empty-state">
        <template #description>
          <p class="empty-text">暂无应用实例</p>
        </template>
      </el-empty>

      <!-- 应用实例列表 -->
      <div v-else class="instance-list">
        <transition-group name="instance-fade" tag="div">
          <div v-for="(item, index) in config.form" :key="index" class="instance-card"
            :class="{ 'instance-active': item?.metadata?.applicationActive === 'UP' }">
            <!-- 卡片头部图标 -->
            <div class="instance-icon">
              <IconifyIconOnline icon="ep:monitor" class="text-2xl" />
            </div>

            <!-- 卡片主体内容 -->
            <div class="instance-content">
              <!-- 状态标签区 -->
              <div class="instance-status">
                <el-tag :type="item?.metadata?.applicationActive === 'UP' ? 'success' : 'warning'" effect="light"
                  class="status-tag">
                  <span class="status-dot"></span>
                  {{ item?.metadata?.applicationActive }}
                </el-tag>
              </div>

              <!-- 应用名称 -->
              <h3 class="instance-name">
                {{ item?.metadata?.applicationName }}
              </h3>

              <!-- 服务信息 -->
              <div class="instance-info">
                <div class="server-address">
                  <IconifyIconOnline icon="ep:connection" class="address-icon" />
                  <span>{{ item.host }}:{{ item.port }}</span>
                </div>

                <!-- 快捷操作按钮组 -->
                <div class="action-buttons">
                  <!-- 按钮分组容器 -->
                  <div class="button-group">
                    <el-tooltip v-for="(action, idx) in getActionButtons(item)" :key="idx" :content="action.title"
                      placement="top" :show-after="300" effect="dark">
                      <el-button class="action-btn" :class="[`action-btn--${action.type}`]" circle size="small"
                        @click="action.handler(item)">
                        <IconifyIconOnline :icon="action.icon" />
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </el-dialog>

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
import dayjs from 'dayjs';
const logDialogRef = ref();
const configpropsDialogRef = ref();
const mapDialogVisibleRef = ref();
const threadDialogVisibleRef = ref();
const cacheDialogRef = ref();
const memDialogVisibleRef = ref();
const cpuDialogVisibleRef = ref();
const envDialogRef = ref();
const logSearchDialogVisibleRef = ref();
const LogDialog = defineAsyncComponent(() => import("./plugins/logger.vue"));
const EnvDialog = defineAsyncComponent(() => import("./plugins/env.vue"));
const ConfigpropsDialog = defineAsyncComponent(() => import("./plugins/configprops.vue"));
const CacheDialog = defineAsyncComponent(() => import("./plugins/cache.vue"));
const CpuDialog = defineAsyncComponent(() => import("../dashboard/portlet/cpu.vue"));
const MemDialog = defineAsyncComponent(() => import("../dashboard/portlet/mem.vue"));
const ThreadDialog = defineAsyncComponent(() => import("./plugins/thread.vue"));
const MapDialog = defineAsyncComponent(() => import("./plugins/map.vue"));
const LogSearchDialog = defineAsyncComponent(() => import("./plugins/log.vue"));
const emit = defineEmits([]);
const config = reactive({
  visible: false,
  isSaveing: false,
  configList: [],
  title: "详情",
  mode: "",
  appName: "",
  form: []
});

const condition = reactive({
  appName: config.form?.metadata?.applicationName,
  serverHost: config.form.host,
  serverPort: config.form.port,
  fromTimestamp: new Date(),
  toTimestamp: new Date(new Date().getTime() - 60 * 60 * 1000),
  count: 100
});
const registerCondition = () => {
  condition.appName = config.form?.metadata?.applicationName;
  condition.serverHost = config.form.host;
  condition.serverPort = config.form.port;
  condition.toTimestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");
  condition.fromTimestamp = dayjs().subtract(6, 'hour').format("YYYY-MM-DD HH:mm:ss");
  condition.count = 100;
}

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
const hasEndpoint = async (item, endpointsValue) => {
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

const doOpenSys = async item => {
  // window.open("/monitor.html?data="+Base64.encode(JSON.stringify(item))+"&appName="+this.appName, '_blank');
  this.$router.push({
    path: "/monitor/monitor",
    query: {
      data: Base64.encode(JSON.stringify(item)),
      appName: this.appName
    }
  });
};
const doOpenPin = async item => {
  router.push({
    path: "/service/app/monitor",
    query: {
      data: Base64.encode(JSON.stringify(item)),
      appName: config.appName
    }
  });
};
const doDatav = async item => {
  this.$router.push({
    path: "/datav",
    query: {
      data: Base64.encode(JSON.stringify(item)),
      appName: this.appName
    }
  });
};
const doOpenSysLog = async item => {
  this.$router.push({
    path: "/monitor/log",
    query: {
      data: Base64.encode(JSON.stringify(item)),
      appName: this.appName
    }
  });
};
const doOpenCache = async item => {
  setTimeout(() => {
    nextTick(() => {
      cacheDialogRef.value.open(item);
    });
  }, 200);
};
const doMap = async item => {
  setTimeout(() => {
    nextTick(() => {
      mapDialogVisibleRef.value.open(item);
    });
  }, 300);
};
const doThread = async item => {
  setTimeout(() => {
    nextTick(() => {
      threadDialogVisibleRef.value.open(item);
    });
  }, 300);
};

const doLogSearch = async item => {
  setTimeout(() => {
    nextTick(() => {
      logSearchDialogVisibleRef.value.open(item);
    });
  }, 300);
};
const doMem = async item => {
  setTimeout(() => {
    nextTick(() => {
      memDialogVisibleRef.value.open(item);
    });
  }, 300);
};
const doCpu = async item => {
  setTimeout(() => {
    nextTick(() => {
      registerCondition();
      cpuDialogVisibleRef.value.open(item);
    });
  }, 300);
};
const doOpenRedis = async item => {
  setTimeout(() => {
    nextTick(() => {
      logSearchDialogVisibleRef.value.open(item);
    });
  }, 300);
};
const doOpenLog = async item => {
  setTimeout(() => {
    nextTick(() => {
      logDialogRef.value.open(item);
    });
  }, 300);
};
const doOpenEnv = async item => {
  setTimeout(() => {
    nextTick(() => {
      envDialogRef.value.open(item);
    });
  }, 300);
};
const doIoenConfigprops = async item => {
  setTimeout(() => {
    nextTick(() => {
      configpropsDialogRef.value.open(item);
    });
  }, 300);
};
//显示
const open = (mode = "add") => {
  config.mode = mode;
  if (mode == "add") {
    config.title = "新增";
  }
  config.visible = true;
  return this;
};
const handleClose = () => {
  config.visible = false;
  emit("closed");
};
//表单注入数据
const setData = data => {
  //可以和上面一样单个注入，也可以像下面一样直接合并进去
  Object.assign(config.form, data?.monitorRequests);
  config.appName = data?.monitorAppname;
  registerCondition();
  return this;
};

defineExpose({
  setData,
  open
});
</script>

<style lang="scss" scoped>
// 空状态样式
.empty-state {
  padding: 60px 0;
  animation: float 6s ease-in-out infinite;
  
  :deep(.el-empty__image) {
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
    transition: transform 0.5s;
    
    &:hover {
      transform: scale(1.05);
    }
  }

  .empty-text {
    color: var(--el-text-color-secondary);
    font-size: 18px;
    margin-top: 20px;
    font-weight: 500;
    background: linear-gradient(45deg, var(--el-text-color-secondary), var(--el-text-color-primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    padding: 8px 0;
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

// 实例列表布局
.instance-list {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  animation: fade-in 0.8s ease-out forwards;

  // 实例卡片样式
  .instance-card {
    position: relative;
    background: var(--el-bg-color);
    border-radius: 16px;
    padding: 24px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid var(--el-border-color-lighter);
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    
    // 顶部彩条
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
      opacity: 0;
      transition: opacity 0.3s, height 0.3s;
    }
    
    // 背景纹理
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: radial-gradient(var(--el-color-primary-light-9) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.2;
      z-index: 0;
      pointer-events: none;
    }

    // 悬浮效果
    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12),
                  0 0 0 1px rgba(var(--el-color-primary-rgb), 0.1);

      &::before {
        opacity: 1;
        height: 6px;
      }
    }

    // 活跃状态样式
    &.instance-active {
      border-color: var(--el-color-success);

      &::before {
        background: var(--el-color-success);
        opacity: 1;
      }
    }

    // 卡片图标
    .instance-icon {
      position: absolute;
      top: -12px;
      right: -12px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--el-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: scale(0.9);
      transition: all 0.3s;
      z-index: 2;

      &:hover {
        transform: scale(1.1) rotate(15deg);
      }
    }

    // 卡片内容
    .instance-content {
      padding-top: 10px;

      // 状态标签区
      .instance-status {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;

        .status-tag {
          font-size: 12px;
          padding: 0 12px;
          height: 24px;
          line-height: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s;
          font-weight: 500;

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: currentColor;
            display: inline-block;
            animation: pulse 2s infinite;
          }
        }

        .action-tag {
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        }
      }

      // 应用名称
      .instance-name {
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 20px 0;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      // 服务信息
      .instance-info {
        display: flex;
        flex-direction: column;
        gap: 16px;

        // 服务器地址
        .server-address {
          color: var(--el-text-color-secondary);
          font-size: 14px;
          padding: 8px 12px;
          background: var(--el-fill-color-lighter);
          border-radius: 8px;
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          border-left: 3px solid var(--el-color-primary-light-5);
          
          &:hover {
            transform: translateX(4px);
            background: var(--el-color-primary-light-9);
            color: var(--el-color-primary-dark-2);
            border-left-color: var(--el-color-primary);
          }

          .address-icon {
            color: var(--el-color-primary);
            animation: bounce 2s infinite;
            filter: drop-shadow(0 0 2px rgba(var(--el-color-primary-rgb), 0.3));
          }
        }

        // 操作按钮组
        .action-buttons {
          margin-top: 16px;
          padding: 16px;
          background: var(--el-fill-color-light);
          border-radius: 12px;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
          
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, rgba(var(--el-color-primary-rgb), 0.05) 0%, transparent 70%);
            opacity: 0;
            transition: opacity 0.5s;
          }

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            
            &::before {
              opacity: 1;
            }
          }

          .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            position: relative;
            z-index: 1;
          }

          // 操作按钮
          .action-btn {
            width: 40px;
            height: 40px;
            padding: 0;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
            border: none;

            &::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              width: 0;
              height: 0;
            }

            &:hover {
              transform: translateY(-4px);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12);

              &::before {
                width: 120%;
                height: 120%;
              }
            }

            &:active {
              transform: translateY(0);
            }

            // 按钮类型样式
            &--primary {
              background: var(--el-color-primary);
              color: white;
            }

            &--success {
              background: var(--el-color-success);
              color: white;
            }

            &--warning {
              background: var(--el-color-warning);
              color: white;
            }

            &--danger {
              background: var(--el-color-danger);
              color: white;
            }

            &--info {
              background: var(--el-color-info);
              color: white;
            }
          }
        }
      }
    }
  }
}

// 动画效果
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-success-rgb), 0.7);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(var(--el-color-success-rgb), 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-success-rgb), 0);
  }
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

// 列表项动画
.instance-fade {
  &-enter-active {
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    transition-delay: calc(var(--el-transition-duration) * 0.1 * var(--index, 0));
  }

  &-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: absolute;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
    filter: blur(10px);
  }
}

// 添加实例列表容器动画
.instance-list {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  animation: fade-in 0.8s ease-out forwards;
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

// 暗黑模式适配
:root[data-theme='dark'] {
  .instance-card {
    background: rgba(30, 30, 30, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    
    &::after {
      background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    }
    
    &:hover {
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3),
                  0 0 0 1px rgba(var(--el-color-primary-rgb), 0.2);
    }

    .server-address {
      background: var(--el-fill-color-darker);
      border-left-color: rgba(var(--el-color-primary-rgb), 0.3);
      
      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.15);
        border-left-color: var(--el-color-primary);
      }
    }

    .action-buttons {
      background: rgba(30, 30, 30, 0.8);
      
      &::before {
        background: radial-gradient(circle at center, rgba(var(--el-color-primary-rgb), 0.1) 0%, transparent 70%);
      }
    }
    
    .instance-name::after {
      background: var(--el-color-primary);
    }
  }
  
  :deep(.modern-dialog) {
    background: rgba(30, 30, 30, 0.8);
    backdrop-filter: blur(16px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    
    .el-dialog__header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      
      &:after {
        background: linear-gradient(90deg, transparent, rgba(var(--el-color-primary-rgb), 0.3) 50%, transparent);
      }
    }
    
    .el-dialog__footer {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      background-color: rgba(30, 30, 30, 0.6);
    }
  }
}
</style>
