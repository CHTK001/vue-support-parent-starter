<template>
  <div
    class="!overflow-hidden"
    :style="{
      '--layoutRadius': $storage?.configure.layoutRadius || 10
    }"
  >
    <el-container>
      <el-header>
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
              <!-- 再次将右侧面板进行拆分 -->
              <splitpane :splitSet="settingTB">
                <template #paneL>
                  <el-scrollbar><div class="dv-b">B</div></el-scrollbar>
                </template>
                <template #paneR>
                  <el-scrollbar>
                    <div class="dv-c">C</div>
                  </el-scrollbar>
                </template>
              </splitpane>
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
import { onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import panel from "./plugin/panel.vue";
import { useGlobal } from "@pureadmin/utils";
const { $storage, $config } = useGlobal();

const router = useRouter();
const item = reactive({
  data: {}
});
const visible = reactive({
  visible: false
});

const settingLR = reactive({
  minPercent: 10,
  defaultPercent: 20,
  split: "vertical"
});

const settingTB = reactive({
  minPercent: 10,
  defaultPercent: 20,
  split: "horizontal"
});

const setData = data => {
  Object.assign(item.data, data);
  return this;
};

const open = async mode => {
  visible.visible = true;
};

const handleNodeClick = async (data, node) => {
  debugger;
};

onMounted(async () => {
  const route = useRoute();
  setData(JSON.parse(Base64.decode(route.query.data)));
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
  text-align: center;
  border: 1px solid #e5e6eb;
}
body,
html {
  overflow: hidden;
}
</style>
