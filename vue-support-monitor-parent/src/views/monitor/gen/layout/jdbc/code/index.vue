<template>
  <el-container>
    <el-header>
      <div class="left-panel">
        <el-button type="primary" icon="el-icon-refresh" @click="importColumn">导入</el-button>
        <el-button plain type="primary" icon="el-icon-download" @click="openGen(null, false)">生成</el-button>
        <el-button type="danger" icon="el-icon-delete" @click="batchDelete" />
      </div>
      <div class="right-panel">
        <div class="right-panel-search">
          <el-input v-model="form.keyword" placeholder="表名" clearable />
          <el-button type="primary" icon="el-icon-search" @click="refresh" />
        </div>
      </div>
    </el-header>
    <el-main class="nopadding">
      <scTable ref="table1" :params="form" :apiObj="apiObj" row-key="id" stripe @selection-change="selectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column label="表名" prop="tabName" width="200" />
        <el-table-column label="实体" prop="tabClassName" />
        <el-table-column label="业务名" prop="tabBusinessName" />
        <el-table-column label="模块名" prop="tabModuleName" />
        <el-table-column label="描述" prop="tabDesc" />
        <el-table-column label="备注" prop="tabRemark" />
        <el-table-column label="操作" fixed="right" width="370">
          <template #default="scope">
            <el-button-group>
              <el-button text icon="el-icon-view" type="primary" size="small" @click="openView(scope.row, false)">预览</el-button>
              <el-button text icon="el-icon-edit" type="primary" size="small" @click="openEdit(scope.row, false)">编辑</el-button>
              <el-popconfirm v-if="scope.row.genType !== 'SYSTEM'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                <template #reference>
                  <el-button icon="el-icon-delete" text type="primary" size="small">删除</el-button>
                </template>
              </el-popconfirm>
              <el-button text :loading="syncLoading[scope.row.tabId]" icon="el-icon-refresh" type="primary" size="small" @click="openSync(scope.row, false)">同步</el-button>
              <el-button text icon="el-icon-office-building" type="primary" size="small" @click="openGen(scope.row, false)">生成代码</el-button>
              <el-button text icon="el-icon-download" type="primary" size="small" @click="openDownFile(scope.row)">下载</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </scTable>
    </el-main>
  </el-container>

  <el-dialog v-model="dialogTableImport" title="导入" :close-on-click-modal="false" width="70%" destroy-on-close draggable @closed="$emit('closed')">
    <scTable ref="table" :pageSize="10" :apiObj="tableApi" :params="form" row-key="id" stripe @selection-change="selectionImportChange">
      <el-table-column type="selection" width="50" />
      <el-table-column label="#" type="index" width="50" />
      <el-table-column label="数据库" prop="database" width="150" />
      <el-table-column label="表名" prop="tableName" width="350" />
      <el-table-column label="描述" prop="remark" width="200" />
    </scTable>
    <template #footer>
      <el-button @click="dialogTableImport = false">取 消</el-button>
      <el-button :modelValue="mode" type="primary" :loading="importing" @click="submitImport()">导入</el-button>
    </template>
  </el-dialog>

  <ImportCode ref="importCodeRef" :v-model="importCodeStatus" />
  <viewCode ref="viewCodeRef" :v-model="viewCodeStatus" />

  <EditDialog v-if="editDialogStatus" ref="editDialogRef" />
  <TemplateDialog v-if="templateDialogStatus" ref="templateDialogRef" />
</template>

<script>
import { downLoadZip } from "@/utils/zipdownload";
import TemplateDialog from "../template/index.vue";
import EditDialog from "./edit.vue";
import ImportCode from "./importCode.vue";
import viewCode from "./view.vue";
import { fetchGenTableDelete, fetchGenTableGenCode, fetchGenTableSyncConstruct, fetchGenTableSyncTable } from "@/api/monitor/gen/table";

export default {
  name: "console",
  components: {
    ImportCode,
    viewCode,
    EditDialog
  },
  data() {
    return {
      mode: false,
      editDialogStatus: false,
      templateDialogStatus: false,
      viewCodeStatus: false,
      importCodeStatus: false,
      importing: 0,
      syncLoading: {},
      dialogTableImport: false,
      form: {
        genId: undefined
      },
      selectionImport: [],
      selection: [],
      downloadForm: {}
    };
  },
  created() {
    this.form.genId = this.$route.params.genId;
    if (!this.form.genId || this.form.genId === "null") {
      delete this.form.genId;
    }
  },
  methods: {
    open() {
      return this;
    },
    setData(item) {
      this.form = item;
      this.refresh();
    },
    openEdit(row) {
      this.editDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.editDialogRef.open(row);
      });
    },
    openTemplate(item) {
      this.templateDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.templateDialogRef.open("edit").setData(item);
      });
    },
    async openSync(row) {
      const _this = this;
      this.syncLoading[row.tabId] = true;
      const tableName = row.tabName;
      this.$confirm('确认要强制同步"' + tableName + '"表结构吗？', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(function () {
          return fetchGenTableSyncConstruct({ tabId: row.tabId });
        })
        .then(() => {
          this.$message.success("同步成功");
        })
        .catch(() => {})
        .finally(() => {
          this.syncLoading[row.tabId] = false;
        });
    },
    batchDelete() {
      if (!this.selection || this.selection.length == 0) {
        this.$message.error("请选择表");
        return;
      }
      const tableName = [];
      for (const item of this.selection) {
        tableName.push(item.tabId);
      }
      this.table_del({ tabId: tableName.join(",") });
    },
    openDownFile(row) {
      this.openGen(row, true);
      downLoadZip(fetchGenTableGenCode, this.downloadForm, "code");
    },
    openView(row) {
      this.viewCodeStatus = true;
      this.$refs.viewCodeRef.open(row);
    },
    openGen(row, noOpen) {
      this.downloadForm = {};
      var tabIds = null;
      const tabNames = [];
      if (row) {
        tabIds = row.tabId;
        tabNames.push(row.tabName);
      } else {
        if (!this.selection || this.selection.length == 0) {
          this.$message.error("请选择表");
          return;
        } else {
          const tableName = [];
          for (const item of this.selection) {
            tableName.push(item.tabId);
            tabNames.push(item.tabName);
          }
          tabIds = tableName.join(",");
        }
      }
      this.downloadForm["tabIds"] = tabIds;
      this.downloadForm["tableNames"] = tabNames;
      console.log(this.downloadForm);
      if (!noOpen) {
        this.$refs.importCodeRef.open(this.downloadForm);
      }
    },

    //删除
    async table_del(row) {
      var reqData = { tableId: row.tabId };
      var res = await fetchGenTableDelete(reqData);
      if (res.code == "00000") {
        this.$refs.table1.refresh();
      } else {
        this.$notify.error({ title: "提示", message: res.msg });
      }
    },
    async refresh() {
      this.$refs.table1.reload(this.form);
    },
    async submitImport() {
      if (!this.selectionImport || this.selectionImport.length == 0) {
        this.$message.error("请选择表");
        return;
      }
      this.importing = !0;
      var tableName = [];
      for (const item of this.selectionImport) {
        tableName.push(item.tableName);
      }
      const tpl = {};
      Object.assign(tpl, this.form);
      tpl["tableName"] = tableName;
      const res = await this.importColumnApi.imports(tpl);
      if (res.code == "00000") {
        this.dialogTableImport = false;
        this.$notify.success({ title: "提示", message: "导入成功" });
        this.$refs.table1.refresh();
      } else {
        this.$notify.error({ title: "提示", message: res.msg });
      }
    },
    //表格选择后回调事件
    selectionImportChange(selection) {
      this.selectionImport = selection;
    },
    //批量生成
    selectionChange(selection) {
      this.selection = selection;
    },
    importColumn() {
      this.active = 0;
      this.importing = 0;
      this.dialogTableImport = true;
    }
  }
};
</script>
