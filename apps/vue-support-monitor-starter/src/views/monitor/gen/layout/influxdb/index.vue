<template>
  <div class="influxdb-container h-full">
    <!-- 空状态展示 -->
    <el-empty v-if="!data.genId" class="h-full" description="请选择数据源" />

    <!-- 主内容区域 -->
    <div v-else class="influxdb-content h-full">
      <!-- 顶部工具栏 -->
      <div class="influxdb-header">
        <!-- 数据源信息 -->
        <div class="influxdb-header__title">
          <IconifyIconOnline icon="ri:table-3" class="influxdb-header__icon" />
          <span class="influxdb-header__name" :title="data.genName">{{ data.genName }}</span>
        </div>

        <!-- 操作按钮组 -->
        <template v-if="!settingTB.openLog">
          <el-divider direction="vertical" />

          <!-- 执行按钮 -->
          <div class="influxdb-header__action cursor-pointer" :disabled="visible.searchVisible" @click="handleExecuteSql">
            <IconifyIconOnline icon="ri:play-line" class="influxdb-header__icon" />
            <span>{{ $t("buttons.run") }}</span>
          </div>

          <el-divider direction="vertical" />

          <!-- 格式化按钮 -->
          <div class="influxdb-header__action cursor-pointer" :disabled="visible.searchVisible" @click="handleFormatSql">
            <IconifyIconOnline icon="ri:magic-line" class="influxdb-header__icon" />
            <span>{{ $t("buttons.formSql") }}</span>
          </div>

          <el-divider direction="vertical" />

          <!-- 执行时间 -->
          <div class="influxdb-header__info">
            <IconifyIconOnline icon="ri:time-line" class="influxdb-header__icon" />
            <span>{{ result.cost }} ms</span>
          </div>

          <!-- 分页设置 -->
          <el-button plain text class="influxdb-header__setting">
            <span class="influxdb-header__label">分页</span>
            <el-radio-group v-model="form.searchType" size="small">
              <el-radio-button value="NONE">无</el-radio-button>
              <el-radio-button value="HIDE_PAGE">隐藏分页</el-radio-button>
              <el-radio-button value="SHOW_PAGE">显示分页</el-radio-button>
            </el-radio-group>
          </el-button>

          <!-- 注释设置 -->
          <el-button plain text class="influxdb-header__setting">
            <span class="influxdb-header__label">注释</span>
            <el-radio-group v-model="settingTB.remarkTitle" size="small">
              <el-radio-button value="NONE">无</el-radio-button>
              <el-radio-button value="INNER">嵌入</el-radio-button>
              <el-radio-button value="TITLE">浮动</el-radio-button>
            </el-radio-group>
          </el-button>

          <!-- 内部注释设置 -->
          <el-button plain text class="influxdb-header__setting">
            <span class="influxdb-header__label">内部注释</span>
            <el-switch v-model="settingTB.remarkBody" :active-value="true" :inactive-value="false" class="influxdb-header__switch" />
          </el-button>
        </template>
      </div>

      <!-- 主体内容区域 -->
      <div class="influxdb-body">
        <splitpane :splitSet="settingTB">
          <!-- 左侧代码编辑器 -->
          <template #paneL>
            <el-scrollbar class="influxdb-editor-wrapper">
              <div class="influxdb-editor">
                <ScCodeEditor ref="codeRef" v-model="form.sql" :height="200" mode="text/x-mysql" :options="options" />
              </div>
            </el-scrollbar>
          </template>

          <!-- 右侧结果展示 -->
          <template #paneR>
            <el-scrollbar class="influxdb-result-wrapper">
              <div class="influxdb-result">
                <el-tabs v-model="settingTB.card" type="border-card" class="influxdb-tabs">
                  <!-- 消息标签页 -->
                  <el-tab-pane label="消息" name="message" class="influxdb-tab-pane">
                    <span v-if="result.message" class="influxdb-message" v-html="ansiUp.ansi_to_html(result.message || '')" />
                    <el-empty v-else description="暂无数据" class="h-full" />
                  </el-tab-pane>

                  <!-- 结果标签页 - 分页表格 -->
                  <el-tab-pane v-if="visible.isExecuteTable" label="结果" name="result" class="influxdb-tab-pane">
                    <scDymaicTable
                      ref="tableRef"
                      key="gen"
                      class="influxdb-table"
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

                  <!-- 结果标签页 - 普通表格 -->
                  <el-tab-pane v-else label="结果" name="result" class="influxdb-tab-pane">
                    <el-table :remarkBody="settingTB.remarkBody" :column="getColumnSetting()" :tableName="'jdbc' + data.genId" :data="result.data" height="100%" border class="influxdb-table">
                      <el-table-column type="index" fixed />
                      <el-table-column v-for="item in result.fields" :key="item" :prop="item" :label="item" width="180" show-overflow-tooltip />
                    </el-table>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-scrollbar>
          </template>
        </splitpane>
      </div>

      <!-- 文档组件 -->
      <document v-if="visible.documentVisible" ref="documentRef" />
    </div>
  </div>
</template>

<script setup>
import splitpane from "@repo/components/ReSplitPane";
import document from "../../model/document.vue";
import { defineProps, ref, reactive, nextTick, defineExpose, computed } from "vue";
import { format } from "sql-formatter";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import { fetchGenSessionExecute } from "@/api/monitor/gen/session";
import scDymaicTable from "@repo/components/ScDymaicTable/index.vue";
import { AnsiUp } from "ansi_up";
import { message } from "@repo/utils";

/**
 * ANSI转HTML工具
 * 用于将控制台输出转换为HTML格式
 */
const ansiUp = new AnsiUp();

// 组件引用
const tableRef = ref();
const documentRef = ref();
const codeRef = ref();

// 组件属性
const props = defineProps({
  data: Object
});

/**
 * 结果数据
 * 包含查询结果、执行时间等信息
 */
const result = reactive({
  cost: 0,
  message: "",
  fields: [],
  data: []
});

/**
 * 过滤数据
 * 存储当前选中的表和节点信息
 */
const filterData = reactive({
  tableData: {},
  tableNode: {}
});

/**
 * 表单数据
 * 包含SQL语句和搜索类型
 */
const form = reactive({
  sql: "",
  searchType: "SHOW_PAGE"
});

/**
 * 计算属性：结果列配置
 * 根据查询结果动态生成表格列
 */
const resultColumn = computed(() => {
  return getColumnSetting();
});

/**
 * 可见性控制
 * 控制各组件的显示状态
 */
const visible = reactive({
  documentVisible: false,
  searchVisible: false,
  isExecuteTable: false
});

/**
 * 分屏设置
 * 控制编辑器和结果区域的分屏比例
 */
const settingTB = reactive({
  minPercent: 10,
  defaultPercent: 30, // 增加默认高度比例
  split: "horizontal",
  card: "message",
  remarkTitle: "INNER",
  remarkBody: false,
  openLog: false
});

/**
 * 编辑器选项
 * 配置代码编辑器的行为
 */
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
 * 获取列设置
 * 根据查询结果字段生成表格列配置
 * @returns {Array} 列配置数组
 */
const getColumnSetting = () => {
  return result.fields?.map(item => {
    return {
      prop: item,
      label: item
    };
  });
};

/**
 * 更新数据
 * 当选择不同的表时更新SQL语句
 * @param {Object} tableData - 表数据
 * @param {Object} node - 节点数据
 */
const upgrade = async (tableData, node) => {
  filterData.tableData = tableData;
  form.sql = "SELECT * FROM " + tableData.nodeName;
  filterData.tableNode = node;
};

/**
 * 处理查询成功
 * 更新结果数据
 * @param {Object} res - 查询结果
 */
const handleSuccess = async res => {
  result.message = res?.data?.message;
  result.cost = res?.data?.cost;
  Object.assign(result, res?.data);
};

/**
 * 更新提示信息
 * 更新编辑器的自动完成提示
 * @param {Object} hits - 提示数据
 */
const upgradeHits = async hits => {
  codeRef.value.upgradeHits(hits);
};

/**
 * 执行SQL查询
 * 发送SQL语句到服务器并处理结果
 */
const handleExecuteSql = async () => {
  if (!form.sql) {
    message("请输入SQL语句", { type: "warning" });
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
 * 格式化SQL语句
 * 使用sql-formatter库格式化当前SQL
 */
const handleFormatSql = async () => {
  form.sql = format(form.sql);
};

// 导出组件方法
defineExpose({ upgrade, upgradeHits });
</script>

<style lang="scss" scoped>
.influxdb-container {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
}

.influxdb-content {
  display: flex;
  flex-direction: column;
}

.influxdb-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);

  &__title {
    display: flex;
    align-items: center;
    min-width: 100px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__icon {
    font-size: 18px;
    margin-right: 6px;
  }

  &__name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__action {
    display: flex;
    align-items: center;
    min-width: 70px;
    padding: 0 8px;
    font-size: 14px;
    cursor: pointer;
    color: var(--el-color-primary);
    transition: all 0.3s;

    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }

  &__info {
    display: flex;
    align-items: center;
    min-width: 100px;
    padding: 0 8px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__setting {
    margin-left: 16px;
    display: flex;
    align-items: center;
  }

  &__label {
    margin-right: 10px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__switch {
    margin-left: 8px;
  }
}

.influxdb-body {
  height: calc(100% - 48px);
  overflow: hidden;
}

.influxdb-editor-wrapper {
  height: 100%;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}

.influxdb-editor {
  height: 100%;
  padding: 8px;

  :deep(.CodeMirror) {
    height: 100%;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    font-family: "Fira Code", monospace;
  }
}

.influxdb-result-wrapper {
  height: 100%;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}

.influxdb-result {
  height: 100%;
}

.influxdb-tabs {
  height: 100%;

  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    padding: 0;
    overflow: hidden;
  }
}

.influxdb-tab-pane {
  height: 100%;
  overflow: hidden;
}

.influxdb-message {
  padding: 12px;
  font-family: "Fira Code", monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.influxdb-table {
  height: 100%;

  :deep(.el-table__header) {
    background-color: var(--el-bg-color-overlay);
  }

  :deep(.el-table__row) {
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--el-color-primary-light-9) !important;
    }
  }
}
</style>
