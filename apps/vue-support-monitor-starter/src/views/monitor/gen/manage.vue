<template>
  <div
    class="!overflow-hidden h-[100vh]"
    :style="{
      '--layoutRadius': ($storage?.configure.layoutRadius || 10) + 'px',
      '--layoutBlur': ($storage?.configure.layoutBlur || 4) + 'px',
    }"
  >
    <el-container class="rounded">
      <el-header class="rounded">
        <div class="cursor-pointer hover:!transition-all hover:!duration-200 hover:!text-base !h-[20px]" @click="router.go(-1)">
          <div class="flex items-center">
            <el-icon>
              <component :is="useRenderIcon('ep:arrow-left')" />
            </el-icon>
            <span class="ml-2">{{ $t("buttons.back") }}</span>
          </div>
        </div>
      </el-header>
      <el-main class="overflow-hidden !p-[5px]">
        <div v-if="singleSplit" class="split-pane overflow-hidden relative">
          <splitpane :splitSet="settingLR">
            <!-- #paneL 表示指定该组件为左侧面板 -->
            <template #paneL>
              <!-- 自定义左侧面板的内容 -->
              <el-scrollbar v-if="visible.sideShow" view-class="h-full">
                <div class="dv-a relative h-full">
                  <panel v-if="!!item.data.genId" ref="panelRef" :data="item.data" @node-click="handleNodeClick" @node-save-click="handleNodeSaveClick" @node-edit-click="handleNodeEditClick" @node-delete-click="handleNodeDeleteClick" />
                </div>
              </el-scrollbar>
            </template>
            <!-- #paneR 表示指定该组件为右侧面板 -->
            <template #paneR>
              <Suspense>
                <template #default>
                  <ScLazy :time="200">
                    <keep-alive>
                      <component :is="layout[item.data.genType]" ref="componentRef" :data="item.data" class="h-full" @success="handleNodeSuccess" />
                    </keep-alive>
                  </ScLazy>
                </template>
              </Suspense>
            </template>
          </splitpane>
        </div>
        <div v-else class="h-full">
          <component :is="layout[item.data.genType]" ref="componentRef" :data="item.data" class="h-full" @success="handleNodeSuccess" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>
<script setup>
import { fetchGenSessionHits } from "@/api/monitor/gen/session";
import { useGlobal } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import splitpane from "@repo/components/ReSplitPane";
import ScLazy from "@repo/components/ScLazy/index.vue";
import { useConfigStore } from "@repo/core";
import { message } from "@repo/utils";
import { Base64 } from "js-base64";
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import panel from "./plugin/panel.vue";
const { $storage, $config } = useGlobal();
const componentRef = ref();
const panelRef = ref();
const layout = reactive({
  VNC: defineAsyncComponent(() => {
    return import("./layout/vnc/index.vue");
  }),
  JDBC: defineAsyncComponent(() => {
    return import("./layout/jdbc/index.vue");
  }),
  WEBRTC: defineAsyncComponent(() => {
    return import("./layout/webrtc/index.vue");
  }),
  INFLUXDB: defineAsyncComponent(() => {
    return import("./layout/influxdb/index.vue");
  }),
  ZOOKEEPER: defineAsyncComponent(() => {
    return import("./layout/zookeeper/index.vue");
  }),
  MONGODB: defineAsyncComponent(() => {
    return import("./layout/mongodb/index.vue");
  }),
  SHELL: defineAsyncComponent(() => {
    return import("./layout/shell/index.vue");
  }),
  MQTT: defineAsyncComponent(() => {
    return import("./layout/mqtt/index.vue");
  }),
  REDIS: defineAsyncComponent(() => {
    return import("./layout/redis/index.vue");
  }),
});
const router = useRouter();
const item = reactive({
  data: {},
  hits: {},
});
const visible = reactive({
  visible: false,
  sideShow: true,
});

const singleSplit = computed(() => {
  return item.data.genType != "SHELL" && item.data.genType != "WEBRTC" && item.data.genType != "VNC";
});
const settingLR = computed(() => {
  return {
    minPercent: visible.sideShow ? 10 : 0,
    defaultPercent: visible.sideShow ? 20 : 0,
    split: "vertical",
  };
});
const hideSide = () => {
  visible.sideShow = !visible.sideShow;
};

const setData = (data) => {
  Object.assign(item.data, data);
  return this;
};

const open = async (mode) => {
  visible.visible = true;
};

const handleNodeClick = async (data, node) => {
  componentRef.value.upgrade(data, node);
};

const handleNodeSaveClick = async (data, node) => {
  componentRef.value?.handleNodeSaveClick(data, node);
};

const handleNodeEditClick = async (data, node) => {
  componentRef.value?.handleNodeEditClick(data, node);
};
const handleNodeDeleteClick = async (data, node) => {
  const success = componentRef.value?.handleNodeDeleteClick(data, node);
  if (success) {
    panelRef.value.handleRefreshTreeParentNode(node);
    message("删除成功", { type: "success" });
  }
};

const handleNodeSuccess = async (node) => {
  panelRef.value.handleRefreshTreeParentNode(node);
};
const handleHits = async () => {
  if (!componentRef.value?.upgradeHits) {
    return;
  }
  fetchGenSessionHits(item.data).then((res) => {
    (res?.data || []).forEach((element) => {
      item.hits[element.name] = element.fields;
    });
    componentRef.value.upgradeHits(item.hits);
  });
};

onMounted(async () => {
  const route = useRoute();
  setData(JSON.parse(Base64.decode(route.query.data)));
  handleHits();
  useConfigStore().load();
  open();
});
</script>
<style lang="scss" scoped>
:deep(.splitter-pane-resizer.horizontal),
:deep(.splitter-pane-resizer.vertical) {
  background-color: gray !important;
}

.split-pane {
  width: 100%;
  height: calc(100vh - 113px);
  border: 1px solid #e5e6eb;
}

.box-show {
  background: var(--el-bg-color);
  border: 1px solid var(--pure-border-color);
  border-radius: 4px;
  transform: translate(12px, -50%);
}
</style>
