<template>
  <div class="h-full">
    <el-empty v-if="!data.genId" class="h-full" />
    <div v-else class="h-full">
      <div class="header border h-[48px] leading-[40px] w-full p-[2px] flex flex-1 items-center">
        <div class="p-1 text-gray-400 text-[14px]" @click="handleOpenDocument">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:table-3')" />
          </el-icon>
          <span class="text-black pl-1">{{ filterData.tableData.nodeName }}</span>
        </div>
        <el-divider direction="vertical" />
        <div class="p-1 cursor-pointer text-blue-400 text-[14px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:play-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ $t("buttons.run") }}</span>
        </div>
        <el-divider direction="vertical" />
        <div class="p-1 cursor-pointer text-blue-400 text-[14px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:node-tree')" />
          </el-icon>
          <span class="text-black pl-1">{{ $t("buttons.explain") }}</span>
        </div>
        <el-divider direction="vertical" />
        <div class="p-1 cursor-pointer text-blue-400 text-[14px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:magic-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ $t("buttons.formSql") }}</span>
        </div>
        <el-divider direction="vertical" />
        <div class="p-1 cursor-pointer text-blue-400 text-[14px]" @click="handleOpenDocument">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('humbleicons:documents')" />
          </el-icon>
          <span class="text-black pl-1">{{ $t("buttons.document") }}</span>
        </div>

        <el-divider direction="vertical" />
      </div>
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
      <document v-if="visible.documentVisible" ref="documentRef" />
    </div>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import splitpane from "@/components/ReSplitPane";
import document from "../model/document.vue";
import { defineProps, ref, reactive, onMounted, nextTick, defineExpose } from "vue";

const documentRef = ref();

const props = defineProps({
  data: Object
});
const filterData = reactive({
  tableData: {},
  tableNode: {}
});
const visible = reactive({
  documentVisible: false
});
const settingTB = reactive({
  minPercent: 10,
  defaultPercent: 20,
  split: "horizontal"
});

const upgrade = async (tableData, node) => {
  filterData.tableData = tableData;
  filterData.tableNode = node;
};
/**
 * 打开文档
 */
const handleOpenDocument = async () => {
  visible.documentVisible = true;
  await nextTick();
  documentRef.value.setData(props.data).open();
};

defineExpose({ upgrade });
</script>
