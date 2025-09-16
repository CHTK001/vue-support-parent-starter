<template>
  <div class="sc-filterBar">
    <slot :filterLength="filterObjLength" :openFilter="openFilter">
      <el-badge :value="filterObjLength" type="danger" :hidden="filterObjLength <= 0">
        <el-button icon="el-icon-filter" @click="openFilter" />
      </el-badge>
    </slot>

    <el-drawer v-model="drawer" title="过滤器" :size="650" append-to-body>
      <el-container v-loading="saveLoading">
        <el-main style="padding: 0">
          <el-tabs class="root">
            <el-tab-pane lazy>
              <template #label>
                <div class="tabs-label">过滤项</div>
              </template>
              <el-scrollbar>
                <div class="sc-filter-main">
                  <h2>设置过滤条件</h2>
                  <div v-if="filter.length <= 0" class="nodata">没有默认过滤条件，请点击增加过滤项</div>
                  <table v-else>
                    <colgroup>
                      <col width="50" />
                      <col width="140" />
                      <col v-if="showOperator" width="120" />
                      <col />
                      <col width="40" />
                    </colgroup>
                    <tr v-for="(item, index) in filter" :key="index">
                      <td>
                        <el-tag :disable-transitions="true">{{ index + 1 }}</el-tag>
                      </td>
                      <td>
                        <py-select v-model="item.field" :options="fields" :filter="filter" placeholder="过滤字段" filterable @change="fieldChange(item)" />
                      </td>
                      <td v-if="showOperator">
                        <el-select v-model="item.operator" placeholder="运算符">
                          <el-option v-for="ope in item.field.operators || effectiveOperators" :key="ope.value" :label="ope.label" :value="ope.value" />
                        </el-select>
                      </td>
                      <td>
                        <el-input v-if="!item.field.type" v-model="item.value" placeholder="请选择过滤字段" disabled />
                        <!-- 输入框 -->
                        <el-input v-if="item.field.type == 'text'" v-model="item.value" :placeholder="item.field.placeholder || '请输入'" />
                        <!-- 下拉框 -->
                        <el-select
                          v-if="item.field.type == 'select'"
                          v-model="item.value"
                          :placeholder="item.field.placeholder || '请选择'"
                          filterable
                          :multiple="item.field.extend?.multiple"
                          :loading="item.selectLoading"
                          :remote="item.field.extend?.remote"
                          :remote-method="
                            query => {
                              remoteMethod(query, item);
                            }
                          "
                          @visible-change="visibleChange($event, item)"
                        >
                          <el-option v-for="field in item.field.extend?.data || []" :key="field.value" :label="field.label" :value="field.value" />
                        </el-select>
                        <!-- 日期 -->
                        <el-date-picker
                          v-if="item.field.type == 'date'"
                          v-model="item.value"
                          type="date"
                          value-format="YYYY-MM-DD"
                          :placeholder="item.field.placeholder || '请选择日期'"
                          style="width: 100%"
                        />
                        <!-- 日期范围 -->
                        <el-date-picker
                          v-if="item.field.type == 'daterange'"
                          v-model="item.value"
                          type="daterange"
                          value-format="YYYY-MM-DD"
                          start-placeholder="开始日期"
                          end-placeholder="结束日期"
                          style="width: 100%"
                        />
                        <!-- 日期时间 -->
                        <el-date-picker
                          v-if="item.field.type == 'datetime'"
                          v-model="item.value"
                          type="datetime"
                          value-format="YYYY-MM-DD HH:mm:ss"
                          :placeholder="item.field.placeholder || '请选择日期'"
                          style="width: 100%"
                        />
                        <!-- 日期时间范围 -->
                        <el-date-picker
                          v-if="item.field.type == 'datetimerange'"
                          v-model="item.value"
                          type="datetimerange"
                          value-format="YYYY-MM-DD HH:mm:ss"
                          start-placeholder="开始日期"
                          end-placeholder="结束日期"
                          style="width: 100%"
                        />
                        <!-- 自定义日期 -->
                        <el-date-picker
                          v-if="item.field.type == 'customDate'"
                          v-model="item.value"
                          :type="item.field.extend?.dateType || 'date'"
                          :value-format="item.field.extend?.valueFormat"
                          :placeholder="item.field.placeholder || '请选择'"
                          start-placeholder="开始日期"
                          end-placeholder="结束日期"
                          style="width: 100%"
                        />
                        <!-- 开关 -->
                        <el-switch v-if="item.field.type == 'switch'" v-model="item.value" active-value="1" inactive-value="0" />
                        <!-- 标签 -->
                        <el-select
                          v-if="item.field.type == 'tags'"
                          v-model="item.value"
                          multiple
                          filterable
                          allow-create
                          default-first-option
                          no-data-text="输入关键词后按回车确认"
                          :placeholder="item.field.placeholder || '请输入'"
                        />
                      </td>
                      <td>
                        <el-icon class="del" @click="delFilter(index)"><el-icon-delete /></el-icon>
                      </td>
                    </tr>
                  </table>
                  <el-button type="primary" text icon="el-icon-plus" @click="addFilter">增加过滤项</el-button>
                </div>
              </el-scrollbar>
            </el-tab-pane>
            <el-tab-pane lazy>
              <template #label>
                <div class="tabs-label">常用</div>
              </template>
              <el-scrollbar>
                <my ref="my" :data="myFilter" :filterName="filterName" @selectMyfilter="selectMyfilter" />
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
        </el-main>
        <el-footer>
          <el-button type="primary" :disabled="filter.length <= 0" @click="ok">立即过滤</el-button>
          <el-button type="primary" plain :disabled="filter.length <= 0" @click="saveMy">另存为常用</el-button>
          <el-button @click="clear">清空过滤</el-button>
        </el-footer>
      </el-container>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import my from "../plugin/FilterMySetting.vue";
import config from "../setting/filterBar";

interface FilterField {
  value: string;
  label: string;
  type?: string;
  operator?: string;
  operators?: { label: string; value: string }[];
  extend?: any;
  placeholder?: string;
  repeat?: boolean;
  selected?: boolean;
}

interface FilterItem {
  field: FilterField;
  operator: string;
  value: any;
  selectLoading?: boolean;
}

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: ""
  },
  options: {
    type: Array as () => FilterField[],
    default: () => []
  },
  labelWidth: {
    type: String,
    default: "100px"
  },
  filterOutputFormat: {
    type: String,
    default: "default",
    validator: (v: string) => ["default", "array", "sql", "lucene"].includes(v)
  },
  filterOperator: {
    type: String,
    default: "in",
    validator: (v: string) => ["in", "eq", "ne", "gt", "gte", "lt", "lte", "like", "between"].includes(v)
  },
  filterField: {
    type: String,
    default: "field"
  },
  filterName: {
    type: String,
    default: ""
  },
  showOperator: {
    type: Boolean,
    default: true
  },
  customOperators: {
    type: Array as () => { label: string; value: string }[],
    default: () => []
  },
  sqlTablePrefix: {
    type: String,
    default: ""
  },
  fieldMapping: {
    type: Object as () => Record<string, string>,
    default: () => ({})
  },
  strictMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "change", "filterChange", "formatChange"]);

const drawer = ref(false);
const fields = ref<FilterField[]>(props.options);
const filter = ref<FilterItem[]>([]);
const myFilter = ref<any[]>([]);
const filterObjLength = ref(0);
const saveLoading = ref(false);

const filterObj = computed(() => {
  const obj: Record<string, any> = {};
  filter.value.forEach(item => {
    if (props.strictMode && (!item.value || item.value === "")) return;
    const fieldKey = props.fieldMapping[item.field.value] || item.field.value;
    obj[fieldKey] = props.showOperator ? `${item.value}${config.separator}${item.operator}` : `${item.value}`;
  });
  return obj;
});

const effectiveOperators = computed(() => {
  return props.customOperators.length > 0 ? props.customOperators : config.operator;
});

const formattedOutput = computed(() => {
  switch (props.filterOutputFormat) {
    case "sql":
      return generateSQLOutput();
    case "lucene":
      return generateLuceneOutput();
    case "array":
      return generateArrayOutput();
    default:
      return filterObj.value;
  }
});

onMounted(() => {
  fields.value.forEach(item => {
    if (item.selected) {
      filter.value.push({
        field: item,
        operator: item.operator || "include",
        value: ""
      });
    }
  });
});

function openFilter() {
  drawer.value = true;
}

function addFilter() {
  const filterArr = fields.value.filter(field => !filter.value.some(item => field.value == item.field.value && !item.field.repeat));
  if (fields.value.length <= 0 || filterArr.length <= 0) {
    // @ts-ignore
    window?.$message?.warning?.("无过滤项");
    return false;
  }
  const filterNum = filterArr[0];
  filter.value.push({
    field: filterNum,
    operator: filterNum.operator || "include",
    value: ""
  });
}

function delFilter(index: number) {
  filter.value.splice(index, 1);
}

function fieldChange(tr: FilterItem) {
  const oldType = tr.field.type;
  tr.field.type = "";
  nextTick(() => {
    tr.field.type = oldType;
  });
  tr.operator = tr.field.operator || "include";
  tr.value = "";
}

async function visibleChange(isopen: boolean, item: FilterItem) {
  if (isopen && item.field.extend?.request && !item.field.extend.remote) {
    item.selectLoading = true;
    try {
      const data = await item.field.extend.request();
      item.field.extend.data = data;
    } catch (error) {
      console.log(error);
    }
    item.selectLoading = false;
  }
}

async function remoteMethod(query: string, item: FilterItem) {
  if (!item.field.extend?.request) return false;
  if (query !== "") {
    item.selectLoading = true;
    try {
      const data = await item.field.extend.request(query);
      item.field.extend.data = data;
    } catch (error) {
      console.log(error);
    }
    item.selectLoading = false;
  } else {
    item.field.extend.data = [];
  }
}

function selectMyfilter(item: any) {
  filter.value = [];
  fields.value.forEach(field => {
    const filterValue = item.filterObj[field.value];
    if (filterValue) {
      let operator = filterValue.split("|")[1];
      let value = filterValue.split("|")[0];
      if (field.type == "select" && field.extend?.multiple) {
        value = value.split(",");
      } else if (field.type == "daterange") {
        value = value.split(",");
      }
      filter.value.push({
        field,
        operator,
        value
      });
    }
  });
  filterObjLength.value = Object.keys(item.filterObj).length;
  emit("filterChange", item.filterObj);
  drawer.value = false;
}

function ok() {
  filterObjLength.value = filter.value.length;
  const output = formattedOutput.value;
  emit("update:modelValue", output);
  emit("change", output);
  emit("filterChange", output);
  emit("formatChange", {
    format: props.filterOutputFormat,
    data: output,
    originalData: filterObj.value
  });
  drawer.value = false;
}

function saveMy() {
  // @ts-ignore
  window
    ?.$prompt?.("常用过滤名称", "另存为常用", {
      inputPlaceholder: "请输入识别度较高的常用过滤名称",
      inputPattern: /\S/,
      inputErrorMessage: "名称不能为空"
    })
    .then(async ({ value }: any) => {
      saveLoading.value = true;
      const saveObj = {
        title: value,
        filterObj: filterObj.value
      };
      try {
        await config.saveMy(props.filterName, saveObj);
      } catch (error) {
        saveLoading.value = false;

        console.log(error);
        return false;
      }
      myFilter.value.push(saveObj);
      // @ts-ignore
      window?.$message?.success?.(`${props.filterName} 保存常用成功`);
      saveLoading.value = false;
    })
    .catch(() => {});
}

function clear() {
  filter.value = [];
  filterObjLength.value = 0;
  const output = formattedOutput.value;
  emit("update:modelValue", output);
  emit("change", output);
  emit("filterChange", output);
  emit("formatChange", {
    format: props.filterOutputFormat,
    data: output,
    originalData: filterObj.value
  });
}

function generateSQLOutput() {
  if (filter.value.length === 0) return "";
  const conditions: string[] = [];
  filter.value.forEach(item => {
    if (props.strictMode && (!item.value || item.value === "")) return;
    const fieldKey = props.fieldMapping[item.field.value] || item.field.value;
    const tableName = props.sqlTablePrefix ? `${props.sqlTablePrefix}.` : "";
    const fullFieldName = `${tableName}${fieldKey}`;
    const operator = props.showOperator ? item.operator : "=";
    let value = item.value;
    switch (operator) {
      case "=":
      case "!=":
      case ">":
      case ">=":
      case "<":
      case "<=":
        if (typeof value === "string" && isNaN(Number(value))) {
          value = `'${value.replace(/'/g, "''")}'`;
        }
        conditions.push(`${fullFieldName} ${operator} ${value}`);
        break;
      case "include":
        conditions.push(`${fullFieldName} LIKE '%${value.replace(/'/g, "''").replace(/%/g, "\\%")}%'`);
        break;
      case "notinclude":
        conditions.push(`${fullFieldName} NOT LIKE '%${value.replace(/'/g, "''").replace(/%/g, "\\%")}%'`);
        break;
      default:
        if (typeof value === "string" && isNaN(Number(value))) {
          value = `'${value.replace(/'/g, "''")}'`;
        }
        conditions.push(`${fullFieldName} ${operator} ${value}`);
    }
  });
  return conditions.length > 0 ? conditions.join(" AND ") : "";
}

function generateLuceneOutput() {
  if (filter.value.length === 0) return "";
  const conditions: string[] = [];
  filter.value.forEach(item => {
    if (props.strictMode && (!item.value || item.value === "")) return;
    const fieldKey = props.fieldMapping[item.field.value] || item.field.value;
    const operator = props.showOperator ? item.operator : "=";
    let value = item.value;
    const escapeLucene = (str: string) => str.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, "\\$&");
    switch (operator) {
      case "=":
        conditions.push(`${fieldKey}:"${escapeLucene(String(value))}"`);
        break;
      case "!=":
        conditions.push(`-${fieldKey}:"${escapeLucene(String(value))}"`);
        break;
      case ">":
        conditions.push(`${fieldKey}:{${escapeLucene(String(value))} TO *}`);
        break;
      case ">=":
        conditions.push(`${fieldKey}:[${escapeLucene(String(value))} TO *]`);
        break;
      case "<":
        conditions.push(`${fieldKey}:{* TO ${escapeLucene(String(value))}}`);
        break;
      case "<=":
        conditions.push(`${fieldKey}:[* TO ${escapeLucene(String(value))}]`);
        break;
      case "include":
        conditions.push(`${fieldKey}:*${escapeLucene(String(value))}*`);
        break;
      case "notinclude":
        conditions.push(`-${fieldKey}:*${escapeLucene(String(value))}*`);
        break;
      default:
        conditions.push(`${fieldKey}:"${escapeLucene(String(value))}"`);
    }
  });
  return conditions.length > 0 ? conditions.join(" AND ") : "";
}

function generateArrayOutput() {
  const result: any[] = [];
  filter.value.forEach(item => {
    if (props.strictMode && (!item.value || item.value === "")) return;
    const fieldKey = props.fieldMapping[item.field.value] || item.field.value;
    const operator = props.showOperator ? item.operator : "=";
    result.push({
      field: fieldKey,
      operator,
      value: item.value,
      originalField: item.field.value,
      fieldType: item.field.type || "text",
      fieldLabel: item.field.label || item.field.value
    });
  });
  return result;
}
</script>

<style scoped>
.tabs-label {
  padding: 0 20px;
}

.nodata {
  height: 46px;
  line-height: 46px;
  margin: 15px 0;
  border: 1px dashed #e6e6e6;
  color: #999;
  text-align: center;
  border-radius: 3px;
}

.sc-filter-main {
  padding: 20px;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
}
.sc-filter-main h2 {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}
.sc-filter-main table {
  width: 100%;
  margin: 15px 0;
}
.sc-filter-main table td {
  padding: 5px 10px 5px 0;
}
.sc-filter-main table td:deep(.el-input .el-input__inner) {
  vertical-align: top;
}

.sc-filter-main table td .el-select {
  display: block;
}
.sc-filter-main table td .el-date-editor.el-input {
  display: block;
  width: 100%;
}
.sc-filter-main table td .del {
  background: #fff;
  color: #999;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
}
.sc-filter-main table td .del:hover {
  background: #f56c6c;
  color: #fff;
}

.root {
  display: flex;
  height: 100%;
  flex-direction: column;
}
.root:deep(.el-tabs__header) {
  margin: 0;
}
.root:deep(.el-tabs__content) {
  flex: 1;
  background: #f6f8f9;
}
.root:deep(.el-tabs__content) .el-tab-pane {
  overflow: auto;
  height: 100%;
}

.dark .root:deep(.el-tabs__content) {
  background: var(--el-bg-color-overlay);
}
.dark .sc-filter-main {
  background: var(--el-bg-color);
  border-color: var(--el-border-color-light);
}
.dark .sc-filter-main table td .del {
  background: none;
}
.dark .sc-filter-main table td .del:hover {
  background: #f56c6c;
}
.dark .nodata {
  border-color: var(--el-border-color-light);
}

/* Footer pin and spacing to match screenshot */
.el-footer {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 20px;
  background: transparent;
}

.sc-filter-main h2 {
  margin-bottom: 12px;
}

.el-button[icon][text] {
  color: var(--el-color-primary);
}
</style>
