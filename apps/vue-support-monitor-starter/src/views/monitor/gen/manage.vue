<template>
  <div
    class="!overflow-hidden"
    :style="{
      '--layoutRadius': ($storage?.configure.layoutRadius || 10) + 'px',
      '--layoutBlur': ($storage?.configure.layoutBlur || 10) + 'px'
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
      <el-main class="overflow-hidden">
        <div class="split-pane overflow-hidden relative">
          <splitpane v-if="item.data.genType != 'SHELL'" :splitSet="settingLR">
            <!-- #paneL 表示指定该组件为左侧面板 -->
            <template #paneL>
              <!-- 自定义左侧面板的内容 -->
              <el-scrollbar v-if="visible.sideShow" view-class="h-full">
                <div class="dv-a relative h-full">
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
          <div v-else class="h-full">
            <ScLazy :time="200">
              <keep-alive>
                <component :is="layout[item.data.genType]" ref="componentRef" :data="item.data" class="h-full" @success="handleNodeSuccess" />
              </keep-alive>
            </ScLazy>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import splitpane from "@repo/components/ReSplitPane";
import ScLazy from "@repo/components/ScLazy/index.vue";
import { Base64 } from "js-base64";
import { computed, defineComponent, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import panel from "./plugin/panel.vue";
import { useGlobal } from "@pureadmin/utils";
import jdbc from "./layout/jdbc/index.vue";
import influxdb from "./layout/influxdb/index.vue";
import zookeeper from "./layout/zookeeper/index.vue";
import mqtt from "./layout/mqtt/index.vue";
import shell from "./layout/shell/index.vue";
import redis from "./layout/redis/index.vue";
import mongodb from "./layout/mongodb/index.vue";
import { message } from "@repo/utils/message";
import { fetchGenSessionHits } from "@/api/monitor/gen/session";
const { $storage, $config } = useGlobal();
const componentRef = ref();
const panelRef = ref();
import { useConfigStore } from "@/store/modules/config";
const layout = reactive({
  JDBC: jdbc,
  INFLUXDB: influxdb,
  ZOOKEEPER: zookeeper,
  MONGODB: mongodb,
  SHELL: shell,
  MQTT: mqtt,
  REDIS: redis
});
const router = useRouter();
const item = reactive({
  data: {},
  hits: {}
});
const visible = reactive({
  visible: false,
  sideShow: true
});

const settingLR = computed(() => {
  return {
    minPercent: visible.sideShow ? 10 : 0,
    defaultPercent: visible.sideShow ? 20 : 0,
    split: "vertical"
  };
});
const hideSide = () => {
  visible.sideShow = !visible.sideShow;
};

const setData = data => {
  Object.assign(item.data, data);
  return this;
};

const open = async mode => {
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

const handleNodeSuccess = async node => {
  panelRef.value.handleRefreshTreeParentNode(node);
};
const handleHits = async () => {
  if (!componentRef.value?.upgradeHits) {
    return;
  }
  fetchGenSessionHits(item.data).then(res => {
    (res?.data || []).forEach(element => {
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
