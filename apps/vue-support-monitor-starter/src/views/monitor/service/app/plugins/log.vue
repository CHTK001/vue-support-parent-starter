<template>
  <el-dialog v-model="visiable" width="80%" top="10px" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" @close="close">
    <template #header>
      <div class="flex flex-1">
        <span>日志管理</span>
        <div class="ml-4 flex-1 flex">
          <el-select v-model="filter.traceId" class="ml-4 -mt-1 !w-[80px]">
            <el-option v-for="item in traceIds" :key="item" :value="item" />
          </el-select>

          <el-button v-if="lock === false" class="ml-4" size="small" type="primary" circle :icon="useRenderIcon('ri:lock-2-fill')" @click="() => (lock = true)" />
          <el-button v-else class="ml-4" size="small" type="default" circle :icon="useRenderIcon('ri:lock-unlock-fill')" @click="() => (lock = false)" />

          <el-button
            class="ml-4"
            size="small"
            type="danger"
            circle
            :icon="useRenderIcon('ep:delete')"
            @click="
              () => {
                data.length = 0;
                traceIds.length = 0;
              }
            "
          />
        </div>
      </div>
    </template>
    <div class="relative h-full">
      <div v-if="data.length > 0" ref="logRef" style="overflow: auto" class="overflow-auto h-[700px]">
        <ul class="overflow-hidden">
          <li v-for="(item, i) in filterData" :key="i" class="infinite-list-item">
            <span style="color: rgb(22 165 67)">
              <b>[{{ dateFormat(item?.timestamp) }}]</b>
            </span>
            <span v-if="item?.level == 'INFO'" class="ml-1" style="color: rgb(93 137 239)">
              <b>[ {{ item?.level }}]</b>
            </span>
            <span v-else-if="item?.level == 'ERROR'" class="ml-1" style="color: rgb(255 0 0)">
              <b>[ {{ item?.level }}]</b>
            </span>

            <span class="ml-1">
              <b>[{{ item?.traceId }}]</b>
            </span>

            <span class="ml-1" style="color: rgb(207 55 55)">
              <b>[{{ item?.thread }}]</b>
            </span>

            <span class="ml-1">
              <b>[{{ item?.className }}]</b>
            </span>

            <span class="ml-1">
              <b>- {{ item?.message }}</b>
            </span>
          </li>
        </ul>
      </div>
      <el-empty v-else />
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { useConfigStore } from "@repo/core";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { dateFormat } from "@repo/utils";
import { AnsiUp } from "ansi_up";
import { defineComponent } from "vue";

const ansi_up = new AnsiUp();
type LogEvent = {
  level: string;
  line: number;
  className: string;
  traceId: string;
  logger: string;
  thread: string;
  timestamp: number;
};
export default defineComponent({
  data() {
    return {
      visiable: false,
      keyword: "*",
      form: {},
      lock: false,
      filter: {
        traceId: null
      },
      disabled: false,
      total: 0,
      noMore: false,
      loading: false,
      traceIds: [],
      data: [],
      offset: 0,
      current: 0,
      socket: null,
      eventName: null
    };
  },
  computed: {
    filterData() {
      return this.filter.traceId
        ? this.data.filter(it => {
            return it.traceId == this.filter.traceId;
          })
        : this.data;
    }
  },
  mounted() {
    this.socket = useConfigStore().socket;
  },
  methods: {
    useRenderIcon,
    dateFormat,
    toHtml(vl) {
      return ansi_up.ansi_to_html(vl).replaceAll("\n", "<br/>");
    },
    event(data: any) {
      const logEvent = JSON.parse(data?.data || "{}") as LogEvent;
      if (this.data.length > 10000) {
        this.data.slice(0, 1);
      }
      this.data.push(logEvent);
      if (this.traceIds.indexOf(logEvent.traceId) == -1) {
        this.traceIds.push(logEvent.traceId);
      }

      if (!this.lock) {
        this.$nextTick(() => {
          this.$refs.logRef.scrollTop = this.$refs.logRef.scrollHeight;
        });
      }
    },
    open(item) {
      this.visiable = true;
      const metadata = item.metadata;
      this.eventName = "LOG:" + metadata.applicationHost + metadata.applicationPort;
      if (this.socket) {
        this.socket.on(this.eventName, this.event);
      }
      Object.assign(this.form, item);
    },
    close() {
      this.visiable = false;
      this.form = {};
      if (this.socket) {
        this.socket.off(this.eventName);
      }
      this.data.length = 0;
    }
  }
});
</script>

<style scoped>
.infinite-list-wrapper {
  height: 600px;
}
.infinite-list-wrapper .list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.infinite-list-wrapper .list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.infinite-list-wrapper .list-item + .list-item {
  margin-top: 10px;
}
</style>
