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
        <div class="cursor-pointer hover:!transition-all hover:!duration-200 hover:!text-base !h-[50px]" @click="router.go(-1)">
          <div class="flex items-center">
            <el-icon>
              <component :is="useRenderIcon('ep:arrow-left')" />
            </el-icon>
            <span class="ml-2">{{ $t("buttons.back") }}</span>
          </div>
        </div>
      </el-header>
      <el-main class="overflow-hidden">
        <div class="split-pane overflow-hidden">
          <splitpane :splitSet="settingLR">
            <!-- #paneL 表示指定该组件为左侧面板 -->
            <template #paneL>
              <!-- 自定义左侧面板的内容 -->
              <el-scrollbar>
                <div class="dv-a">
                  <panel v-if="!!item.data.genId" :data="item.data" @node-click="handleNodeClick" />
                </div>
              </el-scrollbar>
            </template>
            <!-- #paneR 表示指定该组件为右侧面板 -->
            <template #paneR>
              <Suspense>
                <template #default>
                  <keep-alive>
                    <component :is="layout[item.data.genType]" ref="componentRef" :data="item.data" class="h-full" />
                  </keep-alive>
                </template>
              </Suspense>
            </template>
          </splitpane>
        </div>
      </el-main>
    </el-container>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import splitpane from "@/components/ReSplitPane";
import { Base64 } from "js-base64";
import { defineComponent, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import panel from "./plugin/panel.vue";
import { useGlobal } from "@pureadmin/utils";
import jdbc from "./layout/jdbc.vue";
import { fetchGenSessionHits } from "@/api/monitor/gen/session";
const { $storage, $config } = useGlobal();
const componentRef = ref();

const layout = reactive({
  JDBC: jdbc
});
const router = useRouter();
const item = reactive({
  data: {},
  hits: {}
});
const visible = reactive({
  visible: false
});

const settingLR = reactive({
  minPercent: 10,
  defaultPercent: 20,
  split: "vertical"
});
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

const handleHits = async () => {
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
</style>
