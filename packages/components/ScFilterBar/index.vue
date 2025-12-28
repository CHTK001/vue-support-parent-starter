<template>
  <div class="sc-filter-bar" :class="containerClass">
    <!-- 内联过滤表单 -->
    <div class="filter-inline">
      <el-form :inline="layout === 'inline'" :model="formData" class="filter-form" :class="formClass" :style="gridStyle" @submit.prevent="handleSearch">
        <template v-for="(field, index) in visibleFields" :key="field.value">
          <el-form-item :label="field.label" class="filter-item" :style="{ '--input-width': field.width || inputWidthValue }">
            <!-- 输入框 -->
            <el-input
              v-if="!field.type || field.type === 'text'"
              v-model="formData[field.value]"
              :placeholder="field.placeholder || `请输入${field.label}`"
              :style="{ width: field.width || inputWidthValue }"
              clearable
              @keyup.enter="handleSearch"
              @input="onRealtimeChange"
            />
            <!-- 下拉框 -->
            <el-select
              v-else-if="field.type === 'select'"
              v-model="formData[field.value]"
              :placeholder="field.placeholder || `请选择${field.label}`"
              :style="{ width: field.width || inputWidthValue }"
              clearable
              filterable
              :multiple="field.extend?.multiple"
              :remote="!!field.extend?.request"
              :remote-method="query => handleRemoteSearch(field, query)"
              :loading="selectLoadingMap[field.value]"
              @change="onRealtimeChange"
              @visible-change="visible => handleSelectVisible(field, visible)"
            >
              <el-option v-for="opt in getSelectOptions(field)" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <!-- 日期 -->
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="formData[field.value]"
              type="date"
              value-format="YYYY-MM-DD"
              :placeholder="field.placeholder || '请选择日期'"
              @change="onRealtimeChange"
            />
            <!-- 日期范围 -->
            <el-date-picker
              v-else-if="field.type === 'daterange'"
              v-model="formData[field.value]"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="onRealtimeChange"
            />
            <!-- 日期时间 -->
            <el-date-picker
              v-else-if="field.type === 'datetime'"
              v-model="formData[field.value]"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              :placeholder="field.placeholder || '请选择时间'"
              @change="onRealtimeChange"
            />
            <!-- 日期时间范围 -->
            <el-date-picker
              v-else-if="field.type === 'datetimerange'"
              v-model="formData[field.value]"
              type="datetimerange"
              value-format="YYYY-MM-DD HH:mm:ss"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              @change="onRealtimeChange"
            />
            <!-- 时间 -->
            <el-time-picker v-else-if="field.type === 'time'" v-model="formData[field.value]" value-format="HH:mm:ss" :placeholder="field.placeholder || '请选择时间'" @change="onRealtimeChange" />
            <!-- 开关 -->
            <el-switch v-else-if="field.type === 'switch'" v-model="formData[field.value]" @change="onRealtimeChange" />
            <!-- 标签 -->
            <el-select
              v-else-if="field.type === 'tags'"
              v-model="formData[field.value]"
              multiple
              filterable
              allow-create
              default-first-option
              :placeholder="field.placeholder || '输入后按回车'"
              @change="onRealtimeChange"
            />
            <!-- 数字 -->
            <el-input-number v-else-if="field.type === 'number'" v-model="formData[field.value]" :placeholder="field.placeholder" controls-position="right" @change="onRealtimeChange" />
          </el-form-item>
        </template>

        <!-- 操作按钮 -->
        <el-form-item class="filter-actions">
          <el-button type="primary" @click="handleSearch">
            <IconifyIconOnline icon="ep:search" />
            搜索
          </el-button>
          <el-button @click="handleReset">
            <IconifyIconOnline icon="ep:refresh" />
            重置
          </el-button>
          <el-button v-if="showAdvanced && hasMoreFields" text @click="toggleExpand">
            {{ isExpanded ? "收起" : "展开" }}
            <IconifyIconOnline :icon="isExpanded ? 'ep:arrow-up' : 'ep:arrow-down'" />
          </el-button>
          <el-button v-if="showDrawer" text type="primary" @click="openFilter">
            <IconifyIconOnline icon="ep:filter" />
            高级筛选
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 高级过滤抽屉 -->
    <sc-drawer v-if="showDrawer" v-model="drawer" title="高级过滤器" :size="650" append-to-body>
      <el-container v-loading="saveLoading">
        <el-main style="padding: 0">
          <el-tabs class="root">
            <el-tab-pane lazy>
              <template #label>
                <div class="tabs-label">过滤项</div>
              </template>
              <el-scrollbar>
                <div class="sc-filter-main">
                  <div class="filter-header">
                    <h2>设置过滤条件</h2>
                    <div class="filter-options">
                      <span class="option-label">条件逻辑：</span>
                      <el-radio-group v-model="logicOperator" size="small">
                        <el-radio-button value="and">AND</el-radio-button>
                        <el-radio-button value="or">OR</el-radio-button>
                      </el-radio-group>
                    </div>
                  </div>
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
                        <el-tag :disable-transitions="true">
                          {{ index + 1 }}
                        </el-tag>
                      </td>
                      <td>
                        <py-select v-model="item.field" :options="fields" :filter="filter" placeholder="过滤字段" filterable @change="fieldChange(item)" />
                      </td>
                      <td v-if="showOperator">
                        <el-select v-model="item.operator" placeholder="运算符">
                          <el-option v-for="ope in item.field.operators || operatorOptions" :key="ope.value" :label="ope.label" :value="ope.value" />
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
                          :multiple="item.field.extend.multiple"
                          :loading="item.selectLoading"
                          :remote="item.field.extend.remote"
                          :remote-method="
                            query => {
                              remoteMethod(query, item);
                            }
                          "
                          @visible-change="visibleChange($event, item)"
                        >
                          <el-option v-for="field in item.field.extend.data" :key="field.value" :label="field.label" :value="field.value" />
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
                          :type="item.field.extend.dateType || 'date'"
                          :value-format="item.field.extend.valueFormat"
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
                        <el-icon class="del" @click="delFilter(index)">
                          <el-icon-delete />
                        </el-icon>
                      </td>
                    </tr>
                  </table>
                  <el-button type="primary" text icon="el-icon-plus" @click="addFilter">增加过滤项</el-button>
                </div>
              </el-scrollbar>
            </el-tab-pane>
            <!-- <el-tab-pane lazy>
              <template #label>
                <div class="tabs-label">常用</div>
              </template>
              <el-scrollbar>
                <my ref="my" :data="myFilter" :filterName="filterName" @selectMyfilter="selectMyfilter" />
              </el-scrollbar>
            </el-tab-pane> -->
          </el-tabs>
        </el-main>
        <!-- 表达式预览 -->
        <div v-if="filter.length > 0 && expressionFormat !== 'default'" class="expression-preview">
          <div class="expression-label">
            <span>{{ expressionFormat === "sql" ? "SQL" : "Lucene" }} 表达式：</span>
          </div>
          <el-input type="textarea" :value="filterExpression" :rows="2" readonly class="expression-input" />
        </div>
        <el-footer class="filter-footer">
          <el-button type="primary" :disabled="filter.length <= 0" @click="handleFilter">立即过滤</el-button>
          <el-button @click="clear">清空过滤</el-button>
          <el-button v-if="filter.length > 0" text type="info" @click="copyExpression">复制表达式</el-button>
        </el-footer>
      </el-container>
    </sc-drawer>
  </div>
</template>

<script>
import pySelect from "./pySelect.vue";
import { debounce } from "lodash-es";

export default {
  name: "ScFilterBar",
  components: {
    pySelect
  },
  props: {
    // 过滤字段配置
    options: { type: Array, default: () => [] },
    // 默认显示的字段数量
    showNumber: { type: Number, default: 4 },
    // 是否显示展开/收起
    showAdvanced: { type: Boolean, default: true },
    // 是否显示高级筛选抽屉按钮
    showDrawer: { type: Boolean, default: false },
    // 是否显示运算符（抽屉模式）
    showOperator: { type: Boolean, default: true },
    // 过滤器名称
    filterName: { type: String, default: "" },
    // 是否启用防抖
    enableDebounce: { type: Boolean, default: true },
    // 防抖延迟时间(ms)
    debounceDelay: { type: Number, default: 300 },
    // 初始表单数据
    modelValue: { type: Object, default: () => ({}) },
    // 布局模式: inline, grid
    layout: { type: String, default: "inline" },
    // 网格列数
    columns: { type: Number, default: 4 },
    // 是否显示边框
    border: { type: Boolean, default: false },
    // 是否显示背景
    background: { type: Boolean, default: false },
    // 是否实时搜索（输入时自动搜索）
    realtime: { type: Boolean, default: false },
    // 表达式格式: default(对象), sql, lucene
    expressionFormat: { type: String, default: "default" },
    // 默认逻辑运算符: and, or
    defaultLogic: { type: String, default: "and" },
    // 输入框宽度
    inputWidth: { type: [String, Number], default: 180 },
    // 下拉选项数量限制
    selectLimit: { type: Number, default: 100 }
  },
  emits: ["filterChange", "search", "reset", "update:modelValue", "expressionChange"],
  data() {
    return {
      drawer: false,
      isExpanded: false,
      formData: { ...this.modelValue },
      // 条件间逻辑运算符
      logicOperator: this.defaultLogic,
      fields: this.options || [],
      filter: [],
      myFilter: [],
      filterObjLength: 0,
      saveLoading: false,
      debouncedSearch: null,
      // 远程数据加载状态
      selectLoadingMap: {},
      // 远程数据缓存
      selectOptionsMap: {},
      // 运算符选项
      operatorOptions: [
        { value: "=", label: "等于" },
        { value: "!=", label: "不等于" },
        { value: ">", label: "大于" },
        { value: ">=", label: "大于等于" },
        { value: "<", label: "小于" },
        { value: "<=", label: "小于等于" },
        { value: "like", label: "包含" },
        { value: "not like", label: "不包含" },
        { value: "in", label: "在列表中" },
        { value: "not in", label: "不在列表中" },
        { value: "is null", label: "为空" },
        { value: "is not null", label: "不为空" }
      ]
    };
  },
  computed: {
    // 容器类名
    containerClass() {
      return {
        "has-border": this.border,
        "has-background": this.background
      };
    },
    // 表单类名
    formClass() {
      return {
        "is-grid": this.layout === "grid"
      };
    },
    // 网格样式
    gridStyle() {
      if (this.layout === "grid") {
        return {
          display: "grid",
          gridTemplateColumns: `repeat(${this.columns}, 1fr)`,
          gap: "12px"
        };
      }
      return {};
    },
    // 输入框宽度值
    inputWidthValue() {
      if (typeof this.inputWidth === "number") {
        return `${this.inputWidth}px`;
      }
      return this.inputWidth;
    },
    // 可见字段
    visibleFields() {
      if (this.isExpanded || !this.showAdvanced) {
        return this.fields;
      }
      return this.fields.slice(0, this.showNumber);
    },
    // 是否有更多字段
    hasMoreFields() {
      return this.fields.length > this.showNumber;
    },
    // 内联表单过滤数据
    inlineFilterData() {
      const result = {};
      Object.keys(this.formData).forEach(key => {
        const val = this.formData[key];
        if (val !== undefined && val !== null && val !== "") {
          result[key] = val;
        }
      });
      return result;
    },
    // 内联表单 SQL 表达式
    inlineSqlExpression() {
      const conditions = Object.entries(this.inlineFilterData).map(([field, value]) => {
        if (typeof value === "string") {
          return `${field} = '${value}'`;
        }
        if (Array.isArray(value)) {
          const values = value.map(v => (typeof v === "string" ? `'${v}'` : v)).join(", ");
          return `${field} IN (${values})`;
        }
        return `${field} = ${value}`;
      });
      return conditions.length > 0 ? conditions.join(` ${this.logicOperator.toUpperCase()} `) : "";
    },
    // 内联表单 Lucene 表达式
    inlineLuceneExpression() {
      const conditions = Object.entries(this.inlineFilterData).map(([field, value]) => {
        if (Array.isArray(value)) {
          return `${field}:(${value.join(" OR ")})`;
        }
        if (typeof value === "string" && value.includes(" ")) {
          return `${field}:"${value}"`;
        }
        return `${field}:${value}`;
      });
      return conditions.length > 0 ? conditions.join(` ${this.logicOperator.toUpperCase()} `) : "";
    },
    // 抽屉过滤对象（默认格式）
    filterObj() {
      const obj = {};
      this.filter.forEach(item => {
        if (item.value !== undefined && item.value !== null && item.value !== "") {
          obj[item.field.value] = {
            value: item.value,
            operator: item.operator,
            label: item.field.label
          };
        }
      });
      return obj;
    },
    // SQL 表达式
    sqlExpression() {
      const conditions = this.filter
        .filter(item => item.value !== undefined && item.value !== null && item.value !== "")
        .map(item => {
          const field = item.field.value;
          const op = item.operator;
          let value = item.value;

          // 处理不同运算符
          if (op === "is null" || op === "is not null") {
            return `${field} ${op}`;
          }
          if (op === "like" || op === "not like") {
            return `${field} ${op} '%${value}%'`;
          }
          if (op === "in" || op === "not in") {
            const values = Array.isArray(value) ? value : [value];
            return `${field} ${op} (${values.map(v => (typeof v === "string" ? `'${v}'` : v)).join(", ")})`;
          }
          // 字符串值加引号
          if (typeof value === "string") {
            value = `'${value}'`;
          }
          return `${field} ${op} ${value}`;
        });

      return conditions.length > 0 ? conditions.join(` ${this.logicOperator.toUpperCase()} `) : "";
    },
    // Lucene 表达式
    luceneExpression() {
      const conditions = this.filter
        .filter(item => item.value !== undefined && item.value !== null && item.value !== "")
        .map(item => {
          const field = item.field.value;
          const op = item.operator;
          let value = item.value;

          // Lucene 格式转换
          if (op === "is null") {
            return `-${field}:*`;
          }
          if (op === "is not null") {
            return `${field}:*`;
          }
          if (op === "=" || op === "like") {
            return `${field}:${value}`;
          }
          if (op === "!=" || op === "not like") {
            return `-${field}:${value}`;
          }
          if (op === ">") {
            return `${field}:{${value} TO *}`;
          }
          if (op === ">=") {
            return `${field}:[${value} TO *]`;
          }
          if (op === "<") {
            return `${field}:{* TO ${value}}`;
          }
          if (op === "<=") {
            return `${field}:[* TO ${value}]`;
          }
          if (op === "in") {
            const values = Array.isArray(value) ? value : [value];
            return `${field}:(${values.join(" OR ")})`;
          }
          if (op === "not in") {
            const values = Array.isArray(value) ? value : [value];
            return `-${field}:(${values.join(" OR ")})`;
          }
          return `${field}:${value}`;
        });

      const connector = this.logicOperator === "or" ? " OR " : " AND ";
      return conditions.length > 0 ? conditions.join(connector) : "";
    },
    // 根据格式返回表达式
    filterExpression() {
      switch (this.expressionFormat) {
        case "sql":
          return this.sqlExpression;
        case "lucene":
          return this.luceneExpression;
        default:
          return this.filterObj;
      }
    },
    // 版本号用于监听 modelValue 变化，避免深度监听
    modelValueVersion() {
      return JSON.stringify(this.modelValue);
    }
  },
  watch: {
    // 使用 JSON.stringify 生成版本号避免深度监听
    modelValueVersion(newVersion, oldVersion) {
      if (newVersion !== oldVersion) {
        this.formData = { ...this.modelValue };
      }
    },
    options: {
      handler(val) {
        this.fields = val || [];
      },
      immediate: true
    }
  },
  created() {
    // 创建防抖搜索函数
    this.debouncedSearch = debounce(() => {
      this.doSearch();
    }, this.debounceDelay);
  },
  beforeUnmount() {
    if (this.debouncedSearch?.cancel) {
      this.debouncedSearch.cancel();
    }
  },
  mounted() {
    // 默认显示的过滤项（抽屉模式）
    this.fields.forEach(item => {
      if (item.selected) {
        this.filter.push({
          field: item,
          operator: item.operator || "include",
          value: ""
        });
      }
    });
  },
  methods: {
    // ========== 内联过滤方法 ==========
    // 搜索
    handleSearch() {
      if (this.enableDebounce) {
        this.debouncedSearch();
      } else {
        this.doSearch();
      }
    },
    // 执行搜索
    doSearch() {
      // 过滤掉空值
      const result = {};
      Object.keys(this.formData).forEach(key => {
        const val = this.formData[key];
        if (val !== undefined && val !== null && val !== "") {
          result[key] = val;
        }
      });

      // 根据格式选择返回的数据
      let resultData;
      switch (this.expressionFormat) {
        case "sql":
          resultData = this.inlineSqlExpression;
          break;
        case "lucene":
          resultData = this.inlineLuceneExpression;
          break;
        default:
          resultData = result;
      }

      this.$emit("update:modelValue", this.formData);
      this.$emit("search", resultData);
      this.$emit("filterChange", resultData);
    },
    // 重置
    handleReset() {
      this.formData = {};
      this.$emit("update:modelValue", {});
      this.$emit("reset", {});
      this.$emit("filterChange", {});
    },
    // 展开/收起
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    // 实时搜索处理
    onRealtimeChange() {
      if (this.realtime) {
        this.handleSearch();
      }
    },
    // 获取下拉选项（支持远程数据）
    getSelectOptions(field) {
      // 优先使用远程数据
      if (this.selectOptionsMap[field.value]) {
        const options = this.selectOptionsMap[field.value];
        return this.selectLimit ? options.slice(0, this.selectLimit) : options;
      }
      // 使用静态数据
      const options = field.extend?.data || field.children || [];
      return this.selectLimit ? options.slice(0, this.selectLimit) : options;
    },
    // 下拉框显示时加载数据
    async handleSelectVisible(field, visible) {
      if (!visible) return;
      // 如果有远程请求函数且不是远程搜索模式，则加载数据
      if (field.extend?.request && !field.extend?.remote) {
        await this.loadRemoteData(field);
      }
    },
    // 远程搜索
    async handleRemoteSearch(field, query) {
      if (!field.extend?.request) return;
      if (!query && !field.extend?.loadOnEmpty) return;

      this.$set(this.selectLoadingMap, field.value, true);
      try {
        const data = await field.extend.request(query);
        this.$set(this.selectOptionsMap, field.value, data || []);
      } catch (error) {
        console.error("Remote search error:", error);
        this.$set(this.selectOptionsMap, field.value, []);
      } finally {
        this.$set(this.selectLoadingMap, field.value, false);
      }
    },
    // 加载远程数据
    async loadRemoteData(field) {
      if (!field.extend?.request) return;
      // 如果已加载过，跳过
      if (this.selectOptionsMap[field.value]) return;

      this.$set(this.selectLoadingMap, field.value, true);
      try {
        const data = await field.extend.request();
        this.$set(this.selectOptionsMap, field.value, data || []);
      } catch (error) {
        console.error("Load remote data error:", error);
        this.$set(this.selectOptionsMap, field.value, []);
      } finally {
        this.$set(this.selectLoadingMap, field.value, false);
      }
    },

    // ========== 抽屉过滤方法 ==========
    //打开过滤器
    openFilter() {
      this.drawer = true;
    },
    //增加过滤项
    addFilter() {
      //下一组新增过滤
      var filterArr = this.fields.filter(field => !this.filter.some(item => field.value == item.field.value && !item.field.repeat));
      if (this.fields.length <= 0 || filterArr.length <= 0) {
        this.$message.warning("无过滤项");
        return false;
      }
      const filterNum = filterArr[0];
      this.filter.push({
        field: filterNum,
        operator: filterNum.operator || "=",
        value: ""
      });
    },
    //删除过滤项
    delFilter(index) {
      this.filter.splice(index, 1);
    },
    //过滤项字段变更事件
    fieldChange(tr) {
      let oldType = tr.field.type;
      tr.field.type = "";
      this.$nextTick(() => {
        tr.field.type = oldType;
      });
      tr.operator = tr.field.operator || "include";
      tr.value = "";
    },
    //下拉框显示事件处理异步
    async visibleChange(isopen, item) {
      if (isopen && item.field.extend.request && !item.field.extend.remote) {
        item.selectLoading = true;
        try {
          var data = await item.field.extend.request();
        } catch (error) {
          // request error ignored
        }
        item.field.extend.data = data;
        item.selectLoading = false;
      }
    },
    //下拉框显示事件处理异步搜索
    async remoteMethod(query, item) {
      if (!item.field.extend.request) {
        return false;
      }
      if (query !== "") {
        item.selectLoading = true;
        try {
          var data = await item.field.extend.request(query);
        } catch (error) {
          // request error ignored
        }
        item.field.extend.data = data;
        item.selectLoading = false;
      } else {
        item.field.extend.data = [];
      }
    },
    //选择常用过滤
    selectMyfilter(item) {
      //常用过滤回显当前过滤项
      this.filter = [];
      this.fields.forEach(field => {
        var filterValue = item.filterObj[field.value];
        if (filterValue) {
          var operator = filterValue.split("|")[1];
          var value = filterValue.split("|")[0];
          if (field.type == "select" && field.extend.multiple) {
            value = value.split(",");
          } else if (field.type == "daterange") {
            value = value.split(",");
          }
          this.filter.push({
            field: field,
            operator: operator,
            value: value
          });
        }
      });
      this.filterObjLength = Object.keys(item.filterObj).length;
      this.$emit("filterChange", item.filterObj);
      this.drawer = false;
    },
    //立即过滤
    ok() {
      this.filterObjLength = this.filter.length;

      // 根据格式选择返回的数据
      let resultData;
      switch (this.expressionFormat) {
        case "sql":
          resultData = this.sqlExpression;
          break;
        case "lucene":
          resultData = this.luceneExpression;
          break;
        default:
          resultData = this.filterObj;
      }

      // 发送事件 - 与内联搜索行为一致
      this.$emit("filterChange", resultData);
      this.$emit("search", resultData);

      // 发送完整表达式数据
      this.$emit("expressionChange", {
        format: this.expressionFormat,
        logic: this.logicOperator,
        expression: this.filterExpression,
        sql: this.sqlExpression,
        lucene: this.luceneExpression,
        object: this.filterObj
      });
      this.drawer = false;
    },
    //处理过滤按钮点击（支持防抖）
    handleFilter() {
      if (this.enableDebounce) {
        this.debouncedOk();
      } else {
        this.ok();
      }
    },
    // 复制表达式到剪贴板
    async copyExpression() {
      const text = typeof this.filterExpression === "string" ? this.filterExpression : JSON.stringify(this.filterExpression, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        this.$message.success("表达式已复制到剪贴板");
      } catch (err) {
        this.$message.error("复制失败");
      }
    },
    //保存常用
    saveMy() {
      this.$prompt("常用过滤名称", "另存为常用", {
        inputPlaceholder: "请输入识别度较高的常用过滤名称",
        inputPattern: /\S/,
        inputErrorMessage: "名称不能为空"
      })
        .then(async ({ value }) => {
          this.saveLoading = true;
          const saveObj = {
            title: value,
            filterObj: this.filterObj
          };
          try {
            var save = await config.saveMy(this.filterName, saveObj);
          } catch (error) {
            this.saveLoading = false;
            return false;
          }
          if (!save) {
            return false;
          }

          this.myFilter.push(saveObj);
          this.$message.success(`${this.filterName} 保存常用成功`);
          this.saveLoading = false;
        })
        .catch(() => {
          //
        });
    },
    //清空过滤
    clear() {
      this.filter = [];
      this.filterObjLength = 0;
      this.$emit("filterChange", this.filterObj);
    }
  }
};
</script>

<style scoped>
/* 内联过滤表单 */
.sc-filter-bar {
  width: 100%;
}

.sc-filter-bar.has-border {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 16px;
}

.sc-filter-bar.has-background {
  background: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
}

.sc-filter-bar.has-border.has-background {
  padding: 16px;
}

.filter-inline {
  width: 100%;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}

.filter-form.is-grid {
  display: grid;
}

.filter-form.is-grid .filter-actions {
  grid-column: 1 / -1;
  margin-left: 0;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
}

.filter-form :deep(.el-form-item__label) {
  padding-right: 8px;
}

.filter-item :deep(.el-input),
.filter-item :deep(.el-select) {
  width: 180px;
}

.filter-item :deep(.el-date-editor) {
  width: 180px;
}

.filter-item :deep(.el-date-editor--daterange) {
  width: 260px;
}

.filter-actions {
  margin-left: auto;
}

.filter-actions :deep(.el-button + .el-button) {
  margin-left: 8px;
}

/* 抽屉样式 */
.tabs-label {
  padding: 0 20px;
}

.nodata {
  height: 46px;
  line-height: 46px;
  margin: 15px 0;
  border: 1px dashed var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  text-align: center;
  border-radius: 3px;
}

.sc-filter-main {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

/* 过滤头部 */
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 表达式预览 */
.expression-preview {
  padding: 12px 20px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.expression-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.expression-input :deep(.el-textarea__inner) {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  background: var(--el-bg-color);
}

/* 过滤底部 */
.filter-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sc-filter-main h2 {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
}
.sc-filter-main table td .del:hover {
  background: var(--el-color-danger);
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
  background: var(--el-fill-color-light);
}
.root:deep(.el-tabs__content) .el-tab-pane {
  overflow: auto;
  height: 100%;
}

.dark .root:deep(.el-tabs__content) {
  background: var(--el-bg-color-overlay);
}
.dark .sc-filter-main {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-light);
}
.dark .sc-filter-main table td .del {
  background: none;
}
.dark .sc-filter-main table td .del:hover {
  background: var(--el-color-danger);
}
.dark .nodata {
  border-color: var(--el-border-color-light);
}
</style>
