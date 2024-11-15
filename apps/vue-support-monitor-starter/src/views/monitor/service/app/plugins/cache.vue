<template>
  <el-dialog v-model="visible" class="bg-blue-gray-50/50" width="60%" draggable style="background-color: #f6f8f9" :title="metadata?.applicationName + '[缓存配置]'" :close-on-click-modal="false">
    <el-empty v-if="Object.keys(cacheData).length == 0" />
    <div v-else class="flex flex-wrap -mx-3">
      <div v-for="item in Object.keys(cacheData)" :key="item" style="padding: 10px" class="w-full max-w-full px-3 mb-6 sm:w-1/2 sm:flex-none xl:mb-0 xl:w-1/4">
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
                  <el-button circle>{{ Object.keys(cacheData[item]?.caches).length }}</el-button>
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
import { defineComponent } from "vue";
import { fetchActuatorCall } from "@/api/monitor/actuator";
import { cloneDeep } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
export default defineComponent({
  data() {
    return {
      visible: false,
      cacheData: {}
    };
  },
  methods: {
    useRenderIcon,
    open(item) {
      this.item = item;
      this.metadata = item.metadata;
      const metadata = this.metadata;
      this.loading = true;
      this.visible = true;
      fetchActuatorCall({
        url: `http://${item.host}:${item.port}${metadata.contextPath}${metadata.endpointsUrl}/caches`,
        method: "GET",
        body: JSON.stringify(item)
      })
        .then(res => {
          if (res.code === "00000") {
            const data = JSON.parse(res.data);
            this.cacheData = data?.cacheManagers || {};
          }
        })
        .finally(() => {
          this.loading = !1;
        });
    }
  }
});
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
