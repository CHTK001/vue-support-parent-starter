<template>
  <el-dialog v-model="visiable" class="bg-blue-gray-50/50" width="60%" draggable style="background-color: #f6f8f9" :title="appName + '[缓存配置]'" :close-on-click-modal="false">
    <el-empty v-if="Object.keys(data).length == 0" />
    <div v-else class="flex flex-wrap -mx-3">
      <div v-for="item in Object.keys(data)" :key="item" style="padding: 10px" class="w-full max-w-full px-3 mb-6 sm:w-1/2 sm:flex-none xl:mb-0 xl:w-1/4">
        <div class="relative flex flex-col min-w-0 break-words bg-white shadow-xl dark:bg-slate-850 dark:shadow-dark-xl rounded-2xl bg-clip-border">
          <div class="flex-auto p-4">
            <div class="flex flex-row -mx-3">
              <div class="flex-none w-2/3 max-w-full px-3">
                <div>
                  <p class="mb-0 font-sans text-sm font-semibold leading-normal uppercase dark:text-white dark:opacity-60" />
                  <h5 class="mb-2 font-bold dark:text-white" />
                  <p class="mb-0 dark:text-white dark:opacity-60">
                    <el-icon><component :is="useRenderIcon('ri:chat-search-line')" /></el-icon>
                    <span class="cache-text">{{ item }}</span>
                  </p>
                </div>
              </div>
              <div class="px-3 text-right basis-1/3">
                <span title="缓存数量" class="text-sm font-bold leading-normal text-emerald-500">
                  <el-button circle>{{ Object.keys(data[item]?.caches).length }}</el-button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
export default {
  data() {
    return {
      appName: "",
      visiable: false,
      apiObj: this.$API.monitor.actuator.page,
      data: {}
    };
  },
  methods: {
    useRenderIcon,
    open(item) {
      this.appName = item?.appName;
      this.profile = item?.profile;
      this.visiable = true;
      this.apiObj.get({ dataId: 1, command: "caches", method: "get", data: JSON.stringify(item) }).then(res => {
        if (res.code === "00000") {
          this.data = res.data?.cacheManagers;
        }
      });
    }
  }
};
</script>
<style>
.cache-text {
  color: #48bb78;
  display: inline-block;
  position: relative;
  top: -2px;
  left: 6px;
}
</style>
