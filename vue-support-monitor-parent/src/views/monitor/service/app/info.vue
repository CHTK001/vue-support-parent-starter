<template>
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
    <div v-for="(item, index) in form" :key="index" style="margin-top: 20px" class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
      <div class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 absolute grid h-12 w-12 place-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="w-6 h-6 text-white">
          <path
            d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z"
          />
        </svg>
      </div>
      <div class="p-4 text-right">
        <p class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">
          <el-tag>{{ item.profile }}</el-tag>
        </p>
        <h4 class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
          {{ item.appName }}
        </h4>
      </div>
      <div class="border-t border-blue-gray-50 p-4">
        <p class="flex items-center font-light text-gray-500 text-md dark:text-gray-300">
          <span>{{ item.serverHost }}:{{ item.serverPort }}</span>
          <a title="服务器地址" style="margin-left: 10px; padding-top: -13px" target="_blank" :href="'http://' + item.serverHost + ':' + item.serverPort + item.contextPath">
            <el-icon><component :is="useRenderIcon('ep:eleme-filled')" /></el-icon>
          </a>
          <a
            v-if="item.data.endpoint && item.data.endpoint.length > 0"
            title="监控地址"
            style="margin-left: 10px; padding-top: -13px"
            target="_blank"
            :href="'http://' + item.serverHost + ':' + item.serverPort + item.contextPath + item.endpointsUrl"
          >
            <el-icon><component :is="useRenderIcon('ri:wechat-channels-fill')" /></el-icon>
          </a>
          <a v-if="(item.data.endpoint || []).indexOf('loggers') > -1" class="cursor-pointer" title="日志" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenLog(item)">
            <el-icon><component :is="useRenderIcon('ri:layout-right-2-line')" /></el-icon>
          </a>
          <a v-if="(item.data.endpoint || []).indexOf('env') > -1" class="cursor-pointer" title="环境" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenEnv(item)">
            <el-icon><component :is="useRenderIcon('line-md:paint-drop')" /></el-icon>
          </a>
          <a
            v-if="(item.data.endpoint || []).indexOf('configprops') > -1"
            class="cursor-pointer"
            title="系统参数"
            style="margin-left: 10px; padding-top: -13px"
            target="_blank"
            @click="doIoenConfigprops(item)"
          >
            <el-icon><component :is="useRenderIcon('ri:expand-vertical-fill')" /></el-icon>
          </a>
          <a v-if="(item.data.endpoint || []).indexOf('caches') > -1" class="cursor-pointer" title="系统缓存" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenCache(item)">
            <el-icon><component :is="useRenderIcon('ri:chat-search-line')" /></el-icon>
          </a>
          <a v-if="(item.data.endpoint || []).indexOf('map') > -1" class="cursor-pointer" title="系统内存" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doMap(item)">
            <el-icon><component :is="useRenderIcon('ri:map-2-line')" /></el-icon>
          </a>
          <a v-if="(item.data.endpoint || []).indexOf('thread') > -1" class="cursor-pointer" title="系统线程" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doThread(item)">
            <el-icon><component :is="useRenderIcon('ri:threads-line')" /></el-icon>
          </a>

          <a class="cursor-pointer" title="系统信息" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenPin(item)">
            <el-icon><component :is="useRenderIcon('ri:settings-4-line')" /></el-icon>
          </a>
          <a class="cursor-pointer" title="日志查询" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doLogSearch(item)">
            <el-icon><component :is="useRenderIcon('simple-icons:logitech')" /></el-icon>
          </a>
          <a class="cursor-pointer" title="CPU" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doCpu(item)">
            <el-icon><component :is="useRenderIcon('ri:cpu-fill')" /></el-icon>
          </a>
          <a class="cursor-pointer" title="内存" style="margin-left: 10px; padding-top: -13px" target="_blank" @click="doMem(item)">
            <el-icon><component :is="useRenderIcon('simple-icons:moscowmetro')" /></el-icon>
          </a>
        </p>
      </div>
    </div>
  </el-dialog>

  <log-dialog ref="logDialogRef" v-model:visible="logDialogVisible" />
  <log-search-dialog ref="logSearchDialogVisibleRef" v-model:visible="logSearchDialogVisible" />
  <env-dialog ref="envDialogRef" v-model:visible="envDialogVisible" />

  <cpu-dialog ref="cpuDialogVisibleRef" v-model:visible="cpuDialogVisible" />
  <mem-dialog ref="memDialogVisibleRef" v-model:visible="memDialogVisible" />
  <cache-dialog ref="cacheDialogRef" v-model:visible="cacheDialogVisible" />
  <thread-dialog ref="threadDialogVisibleRef" v-model:visible="threadDialogVisible" />
  <map-dialog ref="mapDialogVisibleRef" v-model:visible="mapDialogVisible" />
  <configprops-dialog ref="configpropsDialogRef" v-model:visible="configpropsDialogVisible" />
</template>

<script>
import Base64 from "@/utils/base64";
import { defineAsyncComponent } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export default {
  components: {
    LogDialog: defineAsyncComponent(() => import("./plugins/log.vue")),
    EnvDialog: defineAsyncComponent(() => import("./plugins/env.vue")),
    ConfigpropsDialog: defineAsyncComponent(() => import("./plugins/configprops.vue")),
    CacheDialog: defineAsyncComponent(() => import("./plugins/cache.vue")),
    CpuDialog: defineAsyncComponent(() => import("./plugins/cpu.vue")),
    MemDialog: defineAsyncComponent(() => import("./plugins/mem.vue")),
    ThreadDialog: defineAsyncComponent(() => import("./plugins/thread.vue")),
    MapDialog: defineAsyncComponent(() => import("./plugins/map.vue")),
    LogSearchDialog: defineAsyncComponent(() => import("./logsearch.vue"))
  },
  emits: ["success", "closed"],
  data() {
    return {
      logSearchDialogVisible: false,
      logDialogVisible: false,
      threadDialogVisible: false,
      cpuDialogVisible: false,
      envDialogVisible: false,
      cacheDialogVisible: false,
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
    doOpenPin(item) {
      window.open("/monitor.html?data=" + Base64.encode(JSON.stringify(item)) + "&appName=" + this.appName, "_blank");
    },
    doOpenTrace(item) {
      this.$router.push({
        path: "/monitor/trace",
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
        this.$refs.cacheDialogRef.open(item);
      });
    },
    doMap(item) {
      this.mapDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.mapDialogVisibleRef.open(item);
      });
    },
    doThread(item) {
      this.threadDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.threadDialogVisibleRef.open(item);
      });
    },
    doLogSearch(item) {
      this.logSearchDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.logSearchDialogVisibleRef.open(item);
      });
    },
    doMem(item) {
      this.memDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.memDialogVisibleRef.open(item);
      });
    },
    doCpu(item) {
      this.cpuDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.cpuDialogVisibleRef.open(item);
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
        this.$refs.logDialogRef.open(item);
      });
    },
    doOpenEnv(item) {
      this.envDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.envDialogRef.open(item);
      });
    },
    doIoenConfigprops(item) {
      this.configpropsDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.configpropsDialogRef.open(item);
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
    }
  }
};
</script>

<style lang="scss">
::deep(.redis path) {
  fill: red;
}
</style>
