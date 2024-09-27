<template>
  <div class="h-full">
    <el-empty v-if="!data.genId" class="h-full" />
    <div v-else class="h-full">
      <div class="header border h-[48px] leading-[40px] w-full p-[2px] flex flex-1 items-center">
        <div class="p-1 text-gray-400 text-[14px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:table-3')" />
          </el-icon>
          <span class="text-black pl-1">{{ data.genName }}</span>
        </div>
        <el-divider direction="vertical" />
        <div v-loading="visible.searchVisible" class="p-1 cursor-pointer text-blue-400 text-[14px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:play-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ $t("buttons.run") }}</span>
        </div>
        <el-divider direction="vertical" />
        <div v-loading="visible.searchVisible" class="p-1 cursor-pointer text-blue-400 text-[14px]" @click="handleExplainSql">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:node-tree')" />
          </el-icon>
          <span class="text-black pl-1">{{ $t("buttons.explain") }}</span>
        </div>
        <el-divider direction="vertical" />
        <div v-loading="visible.searchVisible" class="p-1 cursor-pointer text-blue-400 text-[14px]" @click="handleFormatSql">
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
        <div class="p-1 cursor-pointer text-blue-400 text-[14px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:time-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ result.cost }} ms</span>
        </div>
      </div>
      <splitpane :splitSet="settingTB">
        <template #paneL>
          <el-scrollbar>
            <div class="dv-b">
              <ScCodeEditor ref="codeRef" v-model="form.sql" :height="200" mode="text/x-mysql" :options="options" />
            </div>
          </el-scrollbar>
        </template>
        <template #paneR>
          <el-scrollbar>
            <div class="dv-c">
              <el-skeleton v-if="visible.searchVisible" :animated="true" />
              <div v-else>
                <ScTable :data="result.data" :columns="getColumnSetting()" />
              </div>
            </div>
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
import { format } from "sql-formatter";
import ScCodeEditor from "@/components/scCodeEditor/index.vue";
import { fetchGenSessionExplain } from "@/api/monitor/gen/session";
import ScTable from "@/components/ScTable/index.vue";
const documentRef = ref();
const codeRef = ref();

const props = defineProps({
  data: Object
});

const result = reactive({
  cost: 0
});

const filterData = reactive({
  tableData: {},
  tableNode: {}
});

const form = reactive({
  sql: "SELECT * FROM file_storage"
});

const visible = reactive({
  documentVisible: false,
  searchVisible: false
});

const settingTB = reactive({
  minPercent: 10,
  defaultPercent: 20,
  split: "horizontal"
});

const options = reactive({
  lineNumbers: true,
  line: true,
  extraKeys: {
    Tab: "autocomplete"
  },
  hintOptions: {
    completeSingle: false, // 当匹配只有一项的时候是否自动补全
    tables: props.hits
  }
});

const getColumnSetting = () => {
  return result.fields?.map(item => {
    return {
      prop: item,
      label: item
    };
  });
};

const upgrade = async (tableData, node) => {
  filterData.tableData = tableData;
  filterData.tableNode = node;
};

const upgradeHits = async hits => {
  codeRef.value.upgradeHits(hits);
};

const handleExplainSql = async () => {
  visible.searchVisible = true;
  let res;
  try {
    res = await fetchGenSessionExplain({
      content: form.sql,
      genId: props.data.genId
    });
  } catch (error) {}
  visible.searchVisible = false;
  console.log(res);
  Object.assign(result, res?.data);
};
/**
 * 格式化sql
 */
const handleFormatSql = async () => {
  form.sql = format(form.sql);
};
/**
 * 打开文档
 */
const handleOpenDocument = async () => {
  visible.documentVisible = true;
  await nextTick();
  documentRef.value.setData(props.data).open();
};

defineExpose({ upgrade, upgradeHits });
</script>
<stype scoped>
  
</stype>
