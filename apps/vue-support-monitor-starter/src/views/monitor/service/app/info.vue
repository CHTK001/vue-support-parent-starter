<template>
  <div class="h-full">
    <el-dialog
      v-model="visible"
      :close-on-click-modal="false"
      :title="title"
      width="600"
      class="bg-blue-gray-50/50"
      style="background-color: #f6f8f9"
      destroy-on-close
      draggable
      @closed="$emit('closed')"
    >
      <el-empty v-if="form.length == 0" />
      <div v-else>
        <div v-for="(item, index) in form" :key="index" class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
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
              <a class="cursor-pointer" title="日志查询" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doLogSearch(item)">
                <el-icon><component :is="useRenderIcon('simple-icons:logitechg')" /></el-icon>
              </a>
              <a class="cursor-pointer" title="系统信息" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenPin(item)">
                <el-icon><component :is="useRenderIcon('ri:settings-4-line')" /></el-icon>
              </a>
              <a class="cursor-pointer" title="大屏" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doDatav(item)">
                <el-icon><component :is="useRenderIcon('simple-icons:databricks')" /></el-icon>
              </a>
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

    <Suspense>
      <template #default>
        <div>
          <log-dialog v-if="logDialogVisible" ref="logDialogRef" />
          <log-search-dialog ref="logSearchDialogVisibleRef" />
          <env-dialog v-if="envDialogVisible" ref="envDialogRef" />

          <MonitorDialog v-if="monitorDialogVisible" ref="monitorDialogRef" />
          <cpu-dialog v-if="cpuDialogVisible" ref="cpuDialogVisibleRef" />
          <mem-dialog v-if="memDialogVisible" ref="memDialogVisibleRef" />
          <cache-dialog v-if="cacheDialogVisible" ref="cacheDialogRef" />
          <thread-dialog v-if="threadDialogVisible" ref="threadDialogVisibleRef" />
          <map-dialog v-if="mapDialogVisible" ref="mapDialogVisibleRef" />
          <configprops-dialog v-if="configpropsDialogVisible" ref="configpropsDialogRef" />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script>
import { Base64 } from "js-base64";
import { defineAsyncComponent, defineComponent } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
// import LogDialog from "./plugins/logger.vue";
// import EnvDialog from "./plugins/env.vue";
// import ConfigpropsDialog from "./plugins/configprops.vue";
// import CacheDialog from "./plugins/cache.vue";
// import MapDialog from "./plugins/map.vue";
// import ThreadDialog from "./plugins/thread.vue";
// import LogSearchDialog from "./plugins/log.vue";

export default {
  components: {
    LogDialog: defineAsyncComponent(() => import("./plugins/logger.vue")),
    EnvDialog: defineAsyncComponent(() => import("./plugins/env.vue")),
    MonitorDialog: defineAsyncComponent(() => import("./monitor.vue")),
    ConfigpropsDialog: defineAsyncComponent(() => import("./plugins/configprops.vue")),
    CacheDialog: defineAsyncComponent(() => import("./plugins/cache.vue")),
    CpuDialog: defineAsyncComponent(() => import("./plugins/cpu.vue")),
    MemDialog: defineAsyncComponent(() => import("./plugins/mem.vue")),
    ThreadDialog: defineAsyncComponent(() => import("./plugins/thread.vue")),
    MapDialog: defineAsyncComponent(() => import("./plugins/map.vue")),
    LogSearchDialog: defineAsyncComponent(() => import("./plugins/log.vue"))
  },
  emits: ["success", "closed"],
  data() {
    return {
      logSearchDialogVisible: false,
      logDialogVisible: false,
      threadDialogVisible: false,
      monitorDialogVisible: false,
      cpuDialogVisible: false,
      envDialogVisible: false,
      cacheDialogVisible: false,
      mapDialogVisible: false,
      memDialogVisible: false,
      configpropsDialogVisible: false,
      redisDialogVisible: false,
      visible: false,
      isSaveing: false,
      configList: [],
      title: "详情",
      mode: "",
      appName: "",
      form: []
    };
  },
  mounted() {},
  methods: {
    useRenderIcon,
    hasEndpoint(item, endpointsValue) {
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
    },
    doOpenSys(item) {
      // window.open("/monitor.html?data="+Base64.encode(JSON.stringify(item))+"&appName="+this.appName, '_blank');
      this.$router.push({
        path: "/monitor/monitor",
        query: {
          data: Base64.encode(JSON.stringify(item)),
          appName: this.appName
        }
      });
    },

    doDatav(item) {
      this.$router.push({
        path: "/datav",
        query: {
          data: Base64.encode(JSON.stringify(item)),
          appName: this.appName
        }
      });
    },
    doOpenSysLog(item) {
      this.$router.push({
        path: "/monitor/log",
        query: {
          data: Base64.encode(JSON.stringify(item)),
          appName: this.appName
        }
      });
    },
    doOpenCache(item) {
      this.cacheDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.cacheDialogRef.open(item);
        }, 200);
      });
    },
    doMap(item) {
      this.mapDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.mapDialogVisibleRef.open(item);
        }, 300);
      });
    },
    doThread(item) {
      this.threadDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.threadDialogVisibleRef.open(item);
        }, 300);
      });
    },
    doOpenPin(item) {
      this.monitorDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.monitorDialogRef.setData(item).open();
        }, 300);
      });
    },
    doLogSearch(item) {
      this.logSearchDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.logSearchDialogVisibleRef.open(item);
        }, 300);
      });
    },
    doMem(item) {
      this.memDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.memDialogVisibleRef.open(item);
        }, 300);
      });
    },
    doCpu(item) {
      this.cpuDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.cpuDialogVisibleRef.open(item);
        }, 300);
      });
    },
    doOpenRedis(item) {
      this.logSearchDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.logSearchDialogVisibleRef.open(item);
      });
    },
    doOpenLog(item) {
      this.logDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.logDialogRef.open(item);
        }, 300);
      });
    },
    doOpenEnv(item) {
      this.envDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.envDialogRef.open(item);
        }, 300);
      });
    },
    doIoenConfigprops(item) {
      this.configpropsDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.configpropsDialogRef.open(item);
        }, 300);
      });
    },
    //显示
    open(mode = "add") {
      this.mode = mode;
      if (mode == "add") {
        this.title = "新增";
      }
      this.visible = true;
      return this;
    },
    //表单注入数据
    setData(data) {
      //可以和上面一样单个注入，也可以像下面一样直接合并进去
      Object.assign(this.form, data?.monitorRequests);
      this.appName = data?.monitorAppname;
      return this;
    }
  }
};
</script>

<style lang="scss">
::deep(.redis path) {
  fill: red;
}
</style>
