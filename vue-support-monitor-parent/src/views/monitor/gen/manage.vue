<template>
  <div>
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
      <el-main>
        <div class="split-pane">
          <splitpane :splitSet="settingLR">
            <!-- #paneL 表示指定该组件为左侧面板 -->
            <template #paneL>
              <!-- 自定义左侧面板的内容 -->
              <el-scrollbar>
                <div class="dv-a">A</div>
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

const router = useRouter();
const item = reactive({
  data: {}
});
const visible = reactive({
  visible: false
});

const settingLR = reactive({
  minPercent: 20,
  defaultPercent: 40,
  split: "vertical"
});

const settingTB = reactive({
  minPercent: 20,
  defaultPercent: 40,
  split: "horizontal"
});

const setData = data => {
  Object.assign(item.data, data);
  return this;
};

const open = async mode => {
  visible.visible = true;
};

onMounted(async () => {
  const route = useRoute();
  setData(JSON.parse(Base64.decode(route.query.data)));
  open();
});
</script>

<style lang="scss" scoped>
.split-pane {
  width: 100%;
  height: calc(100vh - 300px);
  font-size: 50px;
  text-align: center;
  border: 1px solid #e5e6eb;

  .dv-a {
    padding-top: 30vh;
    color: rgba($color: dodgerblue, $alpha: 80%);
  }

  .dv-b {
    padding-top: 10vh;
    color: rgba($color: #000, $alpha: 80%);
  }

  .dv-c {
    padding-top: 18vh;
    color: rgba($color: #ce272d, $alpha: 80%);
  }
}
</style>
