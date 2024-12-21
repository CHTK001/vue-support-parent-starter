<template>
  <div class="h-full">
    <el-dialog
      v-model="config.visible"
      :close-on-click-modal="false"
      :title="config.title"
      width="600"
      class="bg-blue-gray-50/50"
      style="background-color: #f6f8f9"
      destroy-on-close
      draggable
      @closed="handleClose"
    >
      <el-empty v-if="config.form.length == 0" />
      <div v-else>
        <div v-for="(item, index) in config.form" :key="index" class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
          <div class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 absolute grid h-12 w-12 place-items-center">
            <el-icon size="40" class="text-white m-0">
              <component :is="useRenderIcon('ri:settings-4-line')" />
            </el-icon>
          </div>
          <div class="p-4 text-right">
            <p class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">
              <el-tag>{{ item?.metadata?.applicationActive }}</el-tag>
            </p>
            <h4 class="block antialiased tracking-normal font-sans text-1xl font-semibold leading-snug text-blue-gray-100">
              {{ item?.metadata?.applicationName }}
            </h4>
          </div>
          <div class="border-t border-blue-gray-50 p-4">
            <p class="flex items-center font-light text-gray-500 text-md dark:text-gray-300">
              <span>{{ item.host }}:{{ item.port }}</span>
              <a title="服务器地址" style="margin-left: 10px; padding-top: -13px" target="_blank" :href="'http://' + item.host + ':' + item.port + item.metadata?.contextPath">
                <el-icon><component :is="useRenderIcon('ep:eleme-filled')" /></el-icon>
              </a>
              <a
                v-if="item.metadata?.endpointUrl && item.metadata?.endpointUrl.length > 0"
                title="监控地址"
                style="margin-left: 10px; padding-top: -13px"
                target="_blank"
                :href="'http://' + item.serverHost + ':' + item.serverPort + item.metadata?.contextPath + item.metadata?.endpointsUrl"
              >
                <el-icon><component :is="useRenderIcon('ri:wechat-channels-fill')" /></el-icon>
              </a>
              <a v-if="hasEndpoint(item, 'loggers')" class="cursor-pointer" title="日志" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenLog(item)">
                <el-icon><component :is="useRenderIcon('ri:layout-right-2-line')" /></el-icon>
              </a>
              <a v-if="hasEndpoint(item, 'env')" class="cursor-pointer" title="环境" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenEnv(item)">
                <el-icon><component :is="useRenderIcon('line-md:paint-drop')" /></el-icon>
              </a>
              <a v-if="hasEndpoint(item, 'configprops')" class="cursor-pointer" title="系统参数" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doIoenConfigprops(item)">
                <el-icon><component :is="useRenderIcon('ri:expand-vertical-fill')" /></el-icon>
              </a>
              <a v-if="hasEndpoint(item, 'caches')" class="cursor-pointer" title="系统缓存" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenCache(item)">
                <el-icon><component :is="useRenderIcon('ri:chat-search-line')" /></el-icon>
              </a>
              <a v-if="hasEndpoint(item, 'map')" class="cursor-pointer" title="系统内存" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doMap(item)">
                <el-icon><component :is="useRenderIcon('ri:map-2-line')" /></el-icon>
              </a>
              <a v-if="hasEndpoint(item, 'thread')" class="cursor-pointer" title="系统线程" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doThread(item)">
                <el-icon><component :is="useRenderIcon('ri:threads-line')" /></el-icon>
              </a>
              <!-- <a class="cursor-pointer" title="日志查询" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doLogSearch(item)">
                <el-icon><component :is="useRenderIcon('simple-icons:logitechg')" /></el-icon>
              </a> -->
              <a class="cursor-pointer" title="系统信息" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenPin(item)">
                <el-icon><component :is="useRenderIcon('ri:settings-4-line')" /></el-icon>
              </a>
              <!--
              <a class="cursor-pointer" title="大屏" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doDatav(item)">
                <el-icon><component :is="useRenderIcon('simple-icons:databricks')" /></el-icon>
              </a>
              -->
              <!--
            <a class="cursor-pointer" title="日志查询" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doLogSearch(item)">
              <el-icon><component :is="useRenderIcon('simple-icons:logitech')" /></el-icon>
            </a>
            <a class="cursor-pointer" title="CPU" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doCpu(item)">
              <el-icon><component :is="useRenderIcon('ri:cpu-fill')" /></el-icon>
            </a>
            <a class="cursor-pointer" title="内存" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doMem(item)">
              <el-icon><component :is="useRenderIcon('simple-icons:moscowmetro')" /></el-icon>
            </a> -->
            </p>
          </div>
        </div>
      </div>
    </el-dialog>

    <component :is="LogDialog" ref="logDialogRef" />
    <component :is="LogSearchDialog" ref="logSearchDialogVisibleRef" />
    <component :is="EnvDialog" ref="envDialogRef" />
    <component :is="CpuDialog" ref="cpuDialogVisibleRef" />
    <component :is="MemDialog" ref="memDialogVisibleRef" />
    <component :is="CacheDialog" ref="cacheDialogRef" />
    <component :is="ThreadDialog" ref="threadDialogVisibleRef" />
    <component :is="MapDialog" ref="mapDialogVisibleRef" />
    <component :is="ConfigpropsDialog" ref="configpropsDialogRef" />
  </div>
</template>

<script setup>
import { Base64 } from "js-base64";
import { defineAsyncComponent, nextTick, reactive, ref, defineEmits, defineExpose } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { router } from "@repo/core";
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
const CpuDialog = defineAsyncComponent(() => import("./plugins/cpu.vue"));
const MemDialog = defineAsyncComponent(() => import("./plugins/mem.vue"));
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
  return this;
};

defineExpose({
  setData,
  open
});
</script>

<style lang="scss">
::deep(.redis path) {
  fill: red;
}
</style>
