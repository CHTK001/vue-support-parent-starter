<template>
  <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true" top="10px" width="80%" draggable @close="onClose">
    <el-skeleton :rows="5" :animated="true" :loading="codeLoading">
      <el-tabs v-model="activeName" class="demo-tabs">
        <el-tab-pane label="基本信息" name="first">
          <el-card>
            <el-empty v-if="editData == null" />
            <el-form v-else :model="editData" label-width="120px">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="表名称">
                    <el-input v-model="editData.tabName" readonly disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="实体类名称">
                    <el-input v-model="editData.tabClassName" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="表描述">
                    <el-input v-model="editData.tabDesc" />
                  </el-form-item>
                </el-col>
                <el-col :span="12" />
              </el-row>
              <el-row :gutter="10">
                <el-col :span="24">
                  <el-form-item label="备注">
                    <el-input v-model="editData.tabRemark" type="textarea" :rows="5" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="10">
                <el-col :span="24" style="text-align: -webkit-center">
                  <el-form-item style="width: max-content">
                    <el-button type="primary" :loading="saveLoading" @click="saveFirst">保存</el-button>
                    <el-button @click="callback">返回</el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </el-tab-pane>
        <el-tab-pane label="字段信息" name="second">
          <el-card>
            <el-empty v-if="editData == null" />
            <el-form v-else label-width="100px">
              <el-form-item prop="list">
                <ScFormTable ref="table" v-model="tabColumns" :addTemplate="addTemplate" :height="550" placeholder="暂无数据">
                  <el-table-column fixed prop="colColumnName" label="字段名称" width="250">
                    <template #default="scope">
                      <el-input v-model="scope.row.colColumnName" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colColumnComment" label="字段描述" width="250">
                    <template #default="scope">
                      <el-input v-model="scope.row.colColumnComment" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colColumnType" label="字段类型" width="150">
                    <template #default="scope">
                      <el-select v-model="scope.row.colColumnType" placeholder="请选择" :filterable="true" :allow-create="true">
                        <el-option v-for="item in typeDic" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </template>
                  </el-table-column>

                  <el-table-column prop="colColumnLength" label="字段长度" width="100">
                    <template #default="scope">
                      <el-input v-model="scope.row.colColumnLength" type="number" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colColumnDecimal" label="小数点">
                    <template #default="scope">
                      <el-input v-model="scope.row.colColumnDecimal" type="number" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colJavaType" label="Java类型" width="150">
                    <template #default="scope">
                      <el-select v-model="scope.row.colJavaType" placeholder="请选择">
                        <el-option label="Long" value="Long" />
                        <el-option label="String" value="String" />
                        <el-option label="Integer" value="Integer" />
                        <el-option label="Double" value="Double" />
                        <el-option label="BigDecimal" value="BigDecimal" />
                        <el-option label="Date" value="Date" />
                        <el-option label="Boolean" value="Boolean" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="colJavaField" label="Java属性" width="250">
                    <template #default="scope">
                      <el-input v-model="scope.row.colJavaField" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colIsInsert" label="插入" align="center">
                    <template #default="scope">
                      <el-checkbox v-model="scope.row.colIsInsert" true-label="1" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colIsEdit" label="编辑" align="center">
                    <template #default="scope">
                      <el-checkbox v-model="scope.row.colIsEdit" true-label="1" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colIsList" label="列表" align="center">
                    <template #default="scope">
                      <el-checkbox v-model="scope.row.colIsList" true-label="1" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colIsQuery" label="查询" align="center">
                    <template #default="scope">
                      <el-checkbox v-model="scope.row.colIsQuery" true-label="1" />
                    </template>
                  </el-table-column>

                  <el-table-column prop="colQueryType" label="查询方式" width="150">
                    <template #default="scope">
                      <el-select v-model="scope.row.colQueryType" placeholder="请选择">
                        <el-option label="=" value="EQ" />
                        <el-option label="!=" value="NE" />
                        <el-option label=">" value="GT" />
                        <el-option label=">=" value="GE" />
                        <el-option label="<" value="LT" />
                        <el-option label="<=" value="LE" />
                        <el-option label="LIKE" value="LIKE" />
                        <el-option label="BETWEEN" value="BETWEEN" />
                      </el-select>
                    </template>
                  </el-table-column>

                  <el-table-column label="必填">
                    <template #default="scope">
                      <el-checkbox v-model="scope.row.colIsRequired" false-label="0" true-label="1" />
                    </template>
                  </el-table-column>

                  <el-table-column label="显示类型" width="250">
                    <template #default="scope">
                      <el-select v-model="scope.row.colHtmlType">
                        <el-option label="文本框" value="input" />
                        <el-option label="文本域" value="textarea" />
                        <el-option label="下拉框" value="select" />
                        <el-option label="单选框" value="radio" />
                        <el-option label="复选框" value="checkbox" />
                        <el-option label="日期控件" value="datetime" />
                        <el-option label="图片上传" value="imageUpload" />
                        <el-option label="文件上传" value="fileUpload" />
                        <el-option label="富文本控件" value="editor" />
                      </el-select>
                    </template>
                  </el-table-column>
                </ScFormTable>
              </el-form-item>
              <el-row :gutter="10">
                <el-col :span="24" style="text-align: -webkit-center">
                  <el-form-item style="width: max-content">
                    <el-button type="primary" :loading="saveLoading" @click="saveSecond">保存</el-button>
                    <el-button @click="callback">返回</el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-skeleton>
  </el-dialog>
</template>
<script>
import { fetchGenColumnInfo, fetchGenColumnUpdate } from "@/api/monitor/gen/column";
import { fetchGenTableInfo, fetchGenTableUpdate } from "@/api/monitor/gen/table";
import ScFormTable from "@/components/scFormTable/index.vue";
export default {
  name: "consoleEdit",
  components: { ScFormTable },
  data() {
    return {
      typeDic: [
        { value: "BITINT", label: "BITINT" },
        { value: "BINARY", label: "BINARY" },
        { value: "BIT", label: "BIT" },
        { value: "BLOB", label: "BLOB" },
        { value: "CHAR", label: "CHAR" },
        { value: "DATE", label: "DATE" },
        { value: "DATETIME", label: "DATETIME" },
        { value: "DECIMAL", label: "DECIMAL" },
        { value: "DOUBLE", label: "DOUBLE" },
        { value: "ENUM", label: "ENUM" },
        { value: "FLOAT", label: "FLOAT" },
        { value: "GEOMETRY", label: "GEOMETRY" },
        { value: "GEOMETRYCOLLECTION", label: "GEOMETRYCOLLECTION" },
        { value: "INT", label: "INT" },
        { value: "INTEGER", label: "INTEGER" },
        { value: "JSON", label: "JSON" },
        { value: "LONGBLOB", label: "LONGBLOB" },
        { value: "LONGTEXT", label: "LONGTEXT" },
        { value: "POINT", label: "POINT" },
        { value: "POLYGON", label: "POLYGON" },
        { value: "TEXT", label: "TEXT" },
        { value: "TIME", label: "TIME" },
        { value: "TIMESTAMP", label: "TIMESTAMP" },
        { value: "VARCHAR", label: "VARCHAR" },
        { value: "YEAR", label: "YEAR" }
      ],
      // 表格的高度
      tableHeight: document.documentElement.scrollHeight - 245 + "px",
      addTemplate: {
        colId: "",
        colColumnComment: "",
        colColumnName: "",
        colColumnType: "VARCHAR",
        colColumnLength: 255,
        colJavaField: "",
        colJavaType: "String",
        colQueryType: "EQ",
        colIsRequired: "0",
        colIsList: "1",
        colIsQuery: "1",
        colIsInsert: "1",
        colIsEdit: "1",
        colHtmlType: "input"
      },
      editData: null,
      activeName: "first",
      saveLoading: 0,
      codeLoading: 0,
      form: {},
      editDialogStatus: false,
      tabColumns: []
    };
  },
  methods: {
    onClose() {
      this.form = {};
      this.editData = {};
      this.editDialogStatus = false;
      this.tabColumns.length = 0;
    },
    open(row) {
      this.form = row;
      this.editDialogStatus = true;
      this.initial();
      return this;
    },
    saveFirst() {
      this.saveLoading = true;
      fetchGenTableUpdate(this.editData)
        .then(res => {
          if (res.code === "00000") {
            this.$message.success("保存成功");
            return;
          }

          this.$message.error(res.msg);
        })
        .finally(() => (this.saveLoading = false));
    },
    saveSecond() {
      this.saveLoading = true;
      fetchGenColumnUpdate({
        tabId: this.editData.tabId,
        columns: this.tabColumns
      })
        .then(res => {
          if (res.code === "00000") {
            this.$message.success("保存成功");
            return;
          }

          this.$message.error(res.msg);
        })
        .finally(() => (this.saveLoading = false));
    },
    callback() {
      this.editDialogStatus = false;
      // this.$router.push({ path: '/ext/jdbc/console/' +  this.form.genId});
    },
    initial() {
      fetchGenColumnInfo(this.form)
        .then(res => {
          if (res.code === "00000") {
            this.tabColumns = res.data;
            return;
          }

          this.$message.error(res.msg);
        })
        .finally(() => (this.codeLoading = false));
      fetchGenTableInfo(this.form)
        .then(res => {
          if (res.code === "00000") {
            this.editData = res.data;
            return;
          }

          this.$message.error(res.msg);
        })
        .finally(() => (this.codeLoading = false));
    }
  }
};
</script>
<style scoped lang="scss">
:deep(.el-form-item__content) {
  margin-left: 10px !important;
}
:deep(.el-tabs__nav-wrap) {
  background: white !important;
}
:deep(.el-tabs__nav-scroll) {
  overflow: hidden;
  margin-left: 20px !important;
}
</style>
