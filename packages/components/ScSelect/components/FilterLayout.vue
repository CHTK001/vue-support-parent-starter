<!--
 * @Descripttion: 过滤器V2
 * @version: 2.6
 * @Author: sakuya
 * @Date: 2021年7月30日14:48:41
 * @LastEditors: sakuya
 * @LastEditTime: 2023年2月7日09:46:45
-->

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

<script>
import my from "../plugin/FilterMySetting.vue";
import config from "../setting/filterBar";

export default {
  name: "filterBar",
  components: {
    my
  },
  props: {
    filterName: { type: String, default: "" },
    showOperator: { type: Boolean, default: true },
    options: { type: Object, default: () => {} },
    // 输出格式：default(默认对象格式)、sql(SQL WHERE子句)、lucene(Lucene查询语法)、array(数组格式)
    outputFormat: { type: String, default: "default", validator: value => ["default", "sql", "lucene", "array"].includes(value) },
    // 自定义运算符配置
    customOperators: { type: Array, default: () => [] },
    // SQL表名前缀（用于SQL格式输出）
    sqlTablePrefix: { type: String, default: "" },
    // 字段映射配置（用于格式转换）
    fieldMapping: { type: Object, default: () => ({}) },
    // 是否启用严格模式（空值过滤）
    strictMode: { type: Boolean, default: false }
  },
  emits: ["filterChange", "formatChange"],
  data() {
    return {
      drawer: false,
      operator: this.effectiveOperators,
      fields: this.options,
      filter: [],
      myFilter: [],
      filterObjLength: 0,
      saveLoading: false
    };
  },
  computed: {
    filterObj() {
      const obj = {};
      this.filter.forEach(item => {
        if (this.strictMode && (!item.value || item.value === "")) {
          return; // 严格模式下跳过空值
        }
        const fieldKey = this.fieldMapping[item.field.value] || item.field.value;
        obj[fieldKey] = this.showOperator ? `${item.value}${config.separator}${item.operator}` : `${item.value}`;
      });
      return obj;
    },
    // 获取有效的运算符列表
    effectiveOperators() {
      return this.customOperators.length > 0 ? this.customOperators : config.operator;
    },
    // 格式化输出结果
    formattedOutput() {
      switch (this.outputFormat) {
        case "sql":
          return this.generateSQLOutput();
        case "lucene":
          return this.generateLuceneOutput();
        case "array":
          return this.generateArrayOutput();
        default:
          return this.filterObj;
      }
    }
  },
  mounted() {
    //默认显示的过滤项
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
        operator: filterNum.operator || "include",
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
          console.log(error);
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
          console.log(error);
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
      const output = this.formattedOutput;
      this.$emit("filterChange", output);
      this.$emit("formatChange", {
        format: this.outputFormat,
        data: output,
        originalData: this.filterObj
      });
      this.drawer = false;
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
            console.log(error);
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
      const output = this.formattedOutput;
      this.$emit("filterChange", output);
      this.$emit("formatChange", {
        format: this.outputFormat,
        data: output,
        originalData: this.filterObj
      });
    },
    
    /**
     * 生成SQL WHERE子句格式输出
     * @returns {string} SQL WHERE子句
     */
    generateSQLOutput() {
      if (this.filter.length === 0) return "";
      
      const conditions = [];
      this.filter.forEach(item => {
        if (this.strictMode && (!item.value || item.value === "")) {
          return;
        }
        
        const fieldKey = this.fieldMapping[item.field.value] || item.field.value;
        const tableName = this.sqlTablePrefix ? `${this.sqlTablePrefix}.` : "";
        const fullFieldName = `${tableName}${fieldKey}`;
        const operator = this.showOperator ? item.operator : "=";
        let value = item.value;
        
        // 处理不同的运算符
        switch (operator) {
          case "=":
          case "!=":
          case ">":
          case ">=":
          case "<":
          case "<=":
            if (typeof value === "string" && isNaN(value)) {
              value = `'${value.replace(/'/g, "''")}'`; // 转义单引号
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
            if (typeof value === "string" && isNaN(value)) {
              value = `'${value.replace(/'/g, "''")}'`;
            }
            conditions.push(`${fullFieldName} ${operator} ${value}`);
        }
      });
      
      return conditions.length > 0 ? conditions.join(" AND ") : "";
    },
    
    /**
     * 生成Lucene查询语法格式输出
     * @returns {string} Lucene查询字符串
     */
    generateLuceneOutput() {
      if (this.filter.length === 0) return "";
      
      const conditions = [];
      this.filter.forEach(item => {
        if (this.strictMode && (!item.value || item.value === "")) {
          return;
        }
        
        const fieldKey = this.fieldMapping[item.field.value] || item.field.value;
        const operator = this.showOperator ? item.operator : "=";
        let value = item.value;
        
        // 转义Lucene特殊字符
        const escapeLucene = (str) => {
          return str.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&');
        };
        
        // 处理不同的运算符
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
    },
    
    /**
     * 生成数组格式输出
     * @returns {Array} 过滤条件数组
     */
    generateArrayOutput() {
      const result = [];
      this.filter.forEach(item => {
        if (this.strictMode && (!item.value || item.value === "")) {
          return;
        }
        
        const fieldKey = this.fieldMapping[item.field.value] || item.field.value;
        const operator = this.showOperator ? item.operator : "=";
        
        result.push({
          field: fieldKey,
          operator: operator,
          value: item.value,
          originalField: item.field.value,
          fieldType: item.field.type || "text",
          fieldLabel: item.field.label || item.field.value
        });
      });
      
      return result;
    }
  }
};
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
.sc-filter-main table tr {
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
</style>
