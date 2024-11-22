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
        <div v-if="!settingTB.openLog" :disabled="visible.searchVisible" class="p-1 cursor-pointer text-blue-400 text-[14px] !min-w-[70px]" @click="handleExecuteSql">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:play-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ $t("buttons.run") }}</span>
        </div>
        <el-divider v-if="!settingTB.openLog" direction="vertical" />
        <div v-if="!settingTB.openLog" :disabled="visible.searchVisible" class="p-1 cursor-pointer text-blue-400 text-[14px] !min-w-[90px]" @click="handleFormatSql">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:magic-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ $t("buttons.formSql") }}</span>
        </div>

        <el-divider v-if="!settingTB.openLog" direction="vertical" />
        <div v-if="!settingTB.openLog" class="p-1 cursor-pointer text-blue-400 text-[14px] !min-w-[100px]">
          <el-icon class="top-[5px]" size="20">
            <component :is="useRenderIcon('ri:time-line')" />
          </el-icon>
          <span class="text-black pl-1">{{ result.cost }} ms</span>
        </div>

        <el-button v-if="!settingTB.openLog" plain text>
          <span style="margin-right: 10px">分页</span>
          <el-radio-group v-model="form.searchType">
            <el-radio-button value="NONE" label="无">无</el-radio-button>
            <el-radio-button value="HIDE_PAGE" label="隐藏分页">隐藏分页</el-radio-button>
            <el-radio-button value="SHOW_PAGE" label="显示分页">显示分页</el-radio-button>
          </el-radio-group>
        </el-button>

        <el-button v-if="!settingTB.openLog" plain text>
          <span style="margin-right: 10px">注释</span>
          <el-radio-group v-model="settingTB.remarkTitle">
            <el-radio-button value="NONE" label="无">无</el-radio-button>
            <el-radio-button value="INNER" label="嵌入">嵌入</el-radio-button>
            <el-radio-button value="TITLE" label="浮动">浮动</el-radio-button>
          </el-radio-group>
        </el-button>

        <el-button v-if="!settingTB.openLog" plain text>
          <span style="margin-right: 10px">内部注释</span>
          <el-switch v-model="settingTB.remarkBody" :active-value="true" :inactive-value="false" />
        </el-button>
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
                  <el-tabs v-model="settingTB.card" type="border-card" class="h-full">
                    <el-tab-pane label="消息" name="message" class="message h-full">
                      <span v-if="result.message" v-html="ansiUp.ansi_to_html(result.message || '')" />
                      <el-empty v-else description="暂无数据" class="h-full" />
                    </el-tab-pane>
                    <el-tab-pane v-if="visible.isExecuteTable" label="结果" name="result" class="h-full">
                      <scDymaicTable
                        ref="tableRef"
                        key="gen"
                        class="h-full"
                        :remarkTitle="settingTB.remarkTitle"
                        :remarkBody="settingTB.remarkBody"
                        :column="resultColumn"
                        :tableName="'jdbc' + currentDatabase + currentTable"
                        :apiObj="fetchGenSessionExecute"
                        :hidePagination="form.searchType !== 'SHOW_PAGE'"
                        :isPost="true"
                        :initiSearch="false"
                        row-key="id"
                        stripe
                        height="100%"
                        :border="true"
                        style="width: 100%"
                        @success="handleSuccess"
                      >
                        <el-table-column type="index" fixed />
                        <el-table-column v-for="item in result.fields" :key="item" :prop="item" :label="item" width="180" show-overflow-tooltip />
                      </scDymaicTable>
                    </el-tab-pane>
                    <el-tab-pane v-else label="结果" name="result" class="h-full">
                      <el-table :remarkBody="settingTB.remarkBody" :column="getColumnSetting()" :tableName="'jdbc' + data.genId" :data="result.data" height="100%" border style="width: 100%">
                        <el-table-column type="index" fixed />
                        <el-table-column v-for="item in result.fields" :key="item" :prop="item" :label="item" width="180" show-overflow-tooltip />
                      </el-table>
                    </el-tab-pane>
                  </el-tabs>
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
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import splitpane from "@repo/components/ReSplitPane";
import document from "../../model/document.vue";
import { defineProps, ref, reactive, onMounted, nextTick, defineExpose, computed } from "vue";
import { format } from "sql-formatter";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import { fetchGenSessionExecute, fetchGenSessionExplain } from "@/api/monitor/gen/session";
import scDymaicTable from "@repo/components/ScDymaicTable/index.vue";
import { AnsiUp } from "ansi_up";
import { message } from "@repo/utils";

const ansiUp = new AnsiUp();
const tableRef = ref();
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
  sql: "",
  searchType: "SHOW_PAGE"
});

const resultColumn = computed(() => {
  return getColumnSetting();
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
  form.sql = "SELECT * FROM " + tableData.nodeName;
  filterData.tableNode = node;
};

const handleSuccess = async res => {
  result.message = res?.data?.message;
  result.cost = res?.data?.cost;
  Object.assign(result, res?.data);
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
  await nextTick();
  setTimeout(() => {
    tableRef.value.reload(request);
    visible.searchVisible = false;
  }, 70);
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
