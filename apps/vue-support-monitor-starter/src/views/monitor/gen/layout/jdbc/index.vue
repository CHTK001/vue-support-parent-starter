<template>
  <div class="jdbc-container h-full">
    <!-- 空数据状态 -->
    <el-empty v-if="!data.genId" class="h-full" description="请选择数据源" />

    <!-- 数据库管理界面 -->
    <div v-else class="jdbc-content h-full">
      <!-- 工具栏 -->
      <div class="jdbc-toolbar">
        <!-- 数据库名称 -->
        <div class="jdbc-toolbar__title">
          <IconifyIconOnline icon="ri:table-3" class="mr-1" />
          <span class="truncate" :title="data.genName">{{ data.genName }}</span>
        </div>

        <!-- SQL执行按钮 -->
        <template v-if="!settingTB.openLog">
          <el-divider direction="vertical" />
          <div class="jdbc-toolbar__btn" :class="{ 'jdbc-toolbar__btn--disabled': visible.searchVisible }" @click="handleExecuteSql">
            <IconifyIconOnline icon="ri:play-line" />
            <span>{{ $t("buttons.run") }}</span>
          </div>

          <el-divider direction="vertical" />
          <div class="jdbc-toolbar__btn" :class="{ 'jdbc-toolbar__btn--disabled': visible.searchVisible }" @click="handleExplainSql">
            <IconifyIconOnline icon="ri:node-tree" />
            <span>{{ $t("buttons.explain") }}</span>
          </div>

          <el-divider direction="vertical" />
          <div class="jdbc-toolbar__btn" :class="{ 'jdbc-toolbar__btn--disabled': visible.searchVisible }" @click="handleFormatSql">
            <IconifyIconOnline icon="ri:magic-line" />
            <span>{{ $t("buttons.formSql") }}</span>
          </div>
        </template>

        <el-divider direction="vertical" />
        <div class="jdbc-toolbar__btn" @click="handleOpenDocument">
          <IconifyIconOnline icon="humbleicons:documents" />
          <span>{{ $t("buttons.document") }}</span>
        </div>

        <!-- 执行时间 -->
        <template v-if="!settingTB.openLog">
          <el-divider direction="vertical" />
          <div class="jdbc-toolbar__info">
            <IconifyIconOnline icon="ri:time-line" />
            <span>{{ result.cost }} ms</span>
          </div>
        </template>

        <!-- 工具栏右侧设置 -->
        <div class="jdbc-toolbar__settings">
          <!-- 分页设置 -->
          <el-select v-if="!settingTB.openLog" v-model="form.searchType" class="jdbc-toolbar__select" size="small">
            <template #prefix>
              <span class="jdbc-toolbar__select-label">分页</span>
            </template>
            <el-option value="NONE" label="无" />
            <el-option value="HIDE_PAGE" label="隐藏分页" />
            <el-option value="SHOW_PAGE" label="显示分页" />
          </el-select>

          <!-- 注释设置 -->
          <el-select v-if="!settingTB.openLog" v-model="settingTB.remarkTitle" class="jdbc-toolbar__select" size="small">
            <template #prefix>
              <span class="jdbc-toolbar__select-label">注释</span>
            </template>
            <el-option value="NONE" label="无" />
            <el-option value="INNER" label="嵌入" />
            <el-option value="TITLE" label="浮动" />
          </el-select>

          <!-- 内部注释开关 -->
          <div v-if="!settingTB.openLog" class="jdbc-toolbar__switch">
            <span class="jdbc-toolbar__switch-label">内部注释</span>
            <el-switch v-model="settingTB.remarkBody" :active-value="true" :inactive-value="false" />
          </div>

          <!-- 日志切换 -->
          <div class="jdbc-toolbar__switch">
            <span class="jdbc-toolbar__switch-label">切换日志</span>
            <el-switch v-model="settingTB.openLog" :active-value="true" :inactive-value="false" />
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="jdbc-main">
        <!-- SQL编辑和结果展示区域 -->
        <splitpane v-if="!settingTB.openLog" :splitSet="settingTB">
          <!-- SQL编辑器 -->
          <template #paneL>
            <div class="jdbc-editor">
              <ScCodeEditor ref="codeRef" v-model="form.sql" :height="200" mode="text/x-mysql" :options="options" />
            </div>
          </template>

          <!-- 结果展示区域 -->
          <template #paneR>
            <div class="jdbc-result">
              <el-tabs v-model="settingTB.card" type="border-card" class="jdbc-tabs">
                <!-- 消息标签页 -->
                <el-tab-pane label="消息" name="message" class="jdbc-tab-pane">
                  <div v-if="result.message" class="jdbc-message" v-html="ansiUp.ansi_to_html(result.message || '')" />
                  <el-empty v-else description="暂无数据" class="h-full" />
                </el-tab-pane>

                <!-- 结果标签页 - 表格模式 -->
                <el-tab-pane v-if="visible.isExecuteTable" label="结果" name="result" class="jdbc-tab-pane">
                  <scDymaicTable
                    ref="tableRef"
                    key="gen"
                    class="jdbc-table"
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
                    @success="handleSuccess"
                  >
                    <el-table-column type="index" fixed />
                    <el-table-column v-for="item in result.fields" :key="item" :prop="item" :label="item" width="180" show-overflow-tooltip />
                  </scDymaicTable>
                </el-tab-pane>

                <!-- 结果标签页 - 普通模式 -->
                <el-tab-pane v-else label="结果" name="result" class="jdbc-tab-pane">
                  <el-table :remarkBody="settingTB.remarkBody" :column="getColumnSetting()" :tableName="'jdbc' + data.genId" :data="result.data" height="100%" border class="jdbc-table">
                    <el-table-column type="index" fixed />
                    <el-table-column v-for="item in result.fields" :key="item" :prop="item" :label="item" width="180" show-overflow-tooltip />
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </div>
          </template>
        </splitpane>

        <!-- 日志模式 -->
        <log v-else :data="data" />
      </div>

      <!-- 文档组件 -->
      <document v-if="visible.documentVisible" ref="documentRef" />
    </div>
  </div>
</template>

<script setup>
import splitpane from "@repo/components/ReSplitPane";
import document from "../../model/document.vue";
import { defineProps, ref, reactive, onMounted, nextTick, defineExpose, computed } from "vue";
import { format } from "sql-formatter";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import { fetchGenSessionExecute, fetchGenSessionExplain } from "@/api/monitor/gen/session";
import scDymaicTable from "@repo/components/ScDymaicTable/index.vue";
import { AnsiUp } from "ansi_up";
import log from "./log.vue";
import { message } from "@repo/utils";

// 初始化ANSI转换器
const ansiUp = new AnsiUp();

// 组件引用
const tableRef = ref();
const documentRef = ref();
const codeRef = ref();

// 组件属性
const props = defineProps({
  data: Object
});

// 结果数据
const result = reactive({
  cost: 0,
  message: "",
  fields: [],
  data: []
});

// 过滤数据
const filterData = reactive({
  tableData: {},
  tableNode: {}
});

// 表单数据
const form = reactive({
  sql: "",
  searchType: "SHOW_PAGE"
});

// 计算属性：结果列配置
const resultColumn = computed(() => {
  return getColumnSetting();
});

// 当前数据库和表名
const currentDatabase = computed(() => props.data?.genDatabase || "");
const currentTable = computed(() => filterData.tableData?.nodeName || "");

// 可见性控制
const visible = reactive({
  documentVisible: false,
  searchVisible: false,
  isExecuteTable: false
});

// 分屏设置
const settingTB = reactive({
  minPercent: 10,
  defaultPercent: 30,
  split: "horizontal",
  card: "message",
  remarkTitle: "INNER",
  remarkBody: false,
  openLog: false
});

// 代码编辑器选项
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

/**
 * 获取表格列设置
 * @returns {Array} 列配置数组
 */
const getColumnSetting = () => {
  return (
    result.fields?.map(item => {
      return {
        prop: item,
        label: item
      };
    }) || []
  );
};

/**
 * 更新表格数据
 * @param {Object} tableData - 表格数据
 * @param {Object} node - 节点数据
 */
const upgrade = async (tableData, node) => {
  filterData.tableData = tableData;
  form.sql = "SELECT * FROM " + tableData.nodeName;
  filterData.tableNode = node;
};

/**
 * 更新代码提示
 * @param {Object} hits - 提示数据
 */
const upgradeHits = async hits => {
  codeRef.value.upgradeHits(hits);
};

/**
 * 执行SQL
 */
const handleExecuteSql = async () => {
  if (!form.sql) {
    message("请输入SQL语句", { type: "warning" });
    return;
  }

  visible.searchVisible = true;
  const request = {};
  visible.isExecuteTable = true;

  // 构建请求参数
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
 * 处理执行成功回调
 * @param {Object} res - 响应数据
 */
const handleSuccess = async res => {
  result.message = res?.data?.message;
  result.cost = res?.data?.cost;
  Object.assign(result, res?.data);
};

/**
 * 执行SQL解释
 */
const handleExplainSql = async () => {
  if (!form.sql) {
    message("请输入SQL语句", { type: "warning" });
    return;
  }

  visible.searchVisible = true;
  visible.isExecuteTable = false;

  try {
    const res = await fetchGenSessionExplain({
      content: form.sql,
      genId: props.data.genId
    });

    Object.assign(result, res?.data);
  } catch (error) {
    message("执行解释失败", { type: "error" });
  } finally {
    visible.searchVisible = false;
  }
};

/**
 * 格式化SQL
 */
const handleFormatSql = async () => {
  if (!form.sql) {
    message("请输入SQL语句", { type: "warning" });
    return;
  }

  try {
    form.sql = format(form.sql);
    message("格式化成功", { type: "success" });
  } catch (error) {
    message("格式化失败", { type: "error" });
  }
};

/**
 * 打开文档
 */
const handleOpenDocument = async () => {
  visible.documentVisible = true;
  await nextTick();
  documentRef.value.setData(props.data).open();
};

// 导出组件方法
defineExpose({ upgrade, upgradeHits });
</script>

<style lang="scss" scoped>
.jdbc-container {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.jdbc-content {
  display: flex;
  flex-direction: column;
}

.jdbc-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);

  &__title {
    display: flex;
    align-items: center;
    min-width: 100px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    padding: 0 5px;

    span {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    padding: 0 8px;
    height: 32px;
    font-size: 14px;
    color: var(--el-color-primary);
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 4px;

    &:hover {
      background-color: var(--el-color-primary-light-9);
    }

    span {
      margin-left: 5px;
      color: var(--el-text-color-primary);
    }

    &--disabled {
      opacity: 0.6;
      cursor: not-allowed;

      &:hover {
        background-color: transparent;
      }
    }
  }

  &__info {
    display: flex;
    align-items: center;
    padding: 0 8px;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    span {
      margin-left: 5px;
    }
  }

  &__settings {
    display: flex;
    align-items: center;
    margin-left: auto;
    gap: 10px;
  }

  &__select {
    width: 150px;

    &-label {
      margin-right: 5px;
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }
  }

  &__switch {
    display: flex;
    align-items: center;

    &-label {
      margin-right: 8px;
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }
  }
}

.jdbc-main {
  flex: 1;
  height: calc(100% - 48px);
  overflow: hidden;
}

.jdbc-editor {
  height: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color);
}

.jdbc-result {
  height: 100%;
  overflow: hidden;
}

.jdbc-tabs {
  height: 100%;
  border: none;

  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    overflow: hidden;
  }
}

.jdbc-tab-pane {
  height: 100%;
  overflow: hidden;
}

.jdbc-table {
  height: 100%;
}

.jdbc-message {
  padding: 10px;
  font-family: monospace;
  white-space: pre-wrap;
  overflow: auto;
  height: 100%;
}

:deep(.el-divider--vertical) {
  height: 20px;
  margin: 0 8px;
}

:deep(.splitter-pane-resizer) {
  background-color: var(--el-border-color-lighter);

  &:hover {
    background-color: var(--el-color-primary-light-5);
  }
}
</style>
