<template>
  <div class="h-full">
    <el-empty v-if="!data.genId" class="h-full" />
    <div v-else class="h-full">
      <div class="header border h-[48px] leading-[40px] w-full p-[2px] flex flex-1 items-center">
        <div class="p-1 text-gray-400 text-[14px] !min-w-[100px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:table-3')" />
          </el-icon>
          <span class="text-black pl-1 truncate break-words text-ellipsis" :title="data.genName">{{ data.genName }}</span>
        </div>

        <el-divider v-if="!settingTB.openLog" direction="vertical" />
        <div v-if="!settingTB.openLog" class="p-1 cursor-pointer text-blue-400 text-[14px] !min-w-[100px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:time-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ cost }} ms</span>
        </div>

        <el-divider v-if="!settingTB.openLog" direction="vertical" />
        <div v-if="!settingTB.openLog" class="p-1 cursor-pointer text-blue-400 text-[14px] !min-w-[100px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:time-zone-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ ttl }} ms</span>
        </div>
      </div>
      <div style="height: calc(100% - 50px)">
        <splitpane :splitSet="settingTB">
          <template #paneL>
            <el-scrollbar>
              <div class="dv-b">
                <ScCodeEditor ref="codeRef" v-model="form.sql" :height="200" mode="text/x-mysql" :options="options" />
              </div>
            </el-scrollbar>
          </template>
          <template #paneR>
            <el-scrollbar class="h-full" wrap-class="h-full" view-class="h-full">
              <div class="dv-c h-full">
                <div class="h-full">
                  <el-skeleton :loading="visible.isExecuteTable" :animated="true">
                    <StringLayout v-if="form.dataType == 'STRING'" :data="result" />
                    <HashLayout v-else-if="form.dataType == 'HASH'" :data="result" />
                    <ListLayout v-else-if="form.dataType == 'LIST'" :data="result" />
                    <SetLayout v-else-if="form.dataType == 'SET'" :data="result" />
                    <ZSetLayout v-else-if="form.dataType == 'ZSET'" :data="result" />
                  </el-skeleton>
                </div>
              </div>
            </el-scrollbar>
          </template>
        </splitpane>
      </div>
      <document v-if="visible.documentVisible" ref="documentRef" />
    </div>
  </div>
</template>
<script setup>
import { fetchGenSessionExecute } from "@/api/monitor/gen/session";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import splitpane from "@/components/ReSplitPane";
import ScCodeEditor from "@/components/scCodeEditor/index.vue";
import { message } from "@/utils/message";
import { AnsiUp } from "ansi_up";
import { format } from "sql-formatter";
import { computed, defineAsyncComponent, defineExpose, defineProps, reactive, ref } from "vue";
import document from "../../model/document.vue";
const StringLayout = defineAsyncComponent(() => import("./layout/string.vue"));
const HashLayout = defineAsyncComponent(() => import("./layout/hash.vue"));
const ListLayout = defineAsyncComponent(() => import("./layout/list.vue"));
const SetLayout = defineAsyncComponent(() => import("./layout/set.vue"));
const ZSetLayout = defineAsyncComponent(() => import("./layout/zset.vue"));

const ansiUp = new AnsiUp();
const tableRef = ref();
const documentRef = ref();
const codeRef = ref();

const props = defineProps({
  data: Object
});

const result = reactive({});

const ttl = ref();
const cost = ref();

const filterData = reactive({
  tableData: {},
  tableNode: {}
});

const form = reactive({
  sql: "",
  searchType: "SHOW_PAGE"
});

const visible = reactive({
  documentVisible: false,
  searchVisible: false,
  isExecuteTable: false
});

const settingTB = reactive({
  minPercent: 10,
  defaultPercent: 20,
  split: "horizontal",
  card: "message",
  remarkTitle: "INNER"
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

const upgrade = async (tableData, node) => {
  filterData.tableData = tableData;
  form.dataType = tableData.dataType?.toUpperCase();
  form.sql = "GET " + tableData.nodeName;
  form.database = tableData.nodePid * 1;
  filterData.tableNode = node;
  handleExecuteSql();
};

const upgradeHits = async hits => {
  codeRef.value.upgradeHits(hits);
};

const handleExecuteSql = async () => {
  if (!form.sql) {
    message("请输入sql", { type: "warning" });
    return;
  }
  visible.searchVisible = true;
  const request = {};
  visible.isExecuteTable = true;
  Object.assign(request, form);
  request.content = form.sql;
  request.genId = props.data.genId;
  request.searchType = form.searchType;
  fetchGenSessionExecute(request)
    .then(res => {
      Object.assign(result, res?.data?.data);
      ttl.value = res.data?.fields?.[0];
      cost.value = res.data?.cost;
    })
    .finally(() => (visible.isExecuteTable = false));
};
/**
 * 格式化sql
 */
const handleFormatSql = async () => {
  form.sql = format(form.sql);
};

defineExpose({ upgrade, upgradeHits });
</script>
<stype scoped>
  
</stype>
