<template>
  <div>
    <el-container>
      <el-header>
        <div class="left-panel">
          <el-date-picker v-model="value" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
        </div>
        <div class="right-panel">
          <el-button type="danger" icon="el-icon-delete" @click="deleteDialog" />
          <el-button type="primary" icon="el-icon-search" @click="search" />
        </div>
      </el-header>
      <el-main class="nopadding">
        <scTable ref="table" :apiObj="list.apiObj" row-key="id" :query="searchParams" stripe @selection-change="selectionChange">
          <el-table-column type="selection" width="50" />
          <el-table-column label="应用名称" prop="proxyName" />
          <el-table-column label="访问地址" prop="limitLogUrl" show-overflow-tooltip />
          <el-table-column label="客户端地址" prop="limitLogAddress" show-overflow-tooltip>
            <template #default="scope">
              <span class="cursor-pointer" @click="doCharts(scope.row.limitLogAddress)">
                {{ scope.row.limitLogAddress }}
                <b>({{ scope.row.limitLogAddressGeo }})</b>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="防火墙类型" prop="limitLogType" show-overflow-tooltip>
            <template #default="scope">
              <el-tag type="success">allow</el-tag>
              <el-tag type="success">{{ scope.row.allowCount }}</el-tag>
              <el-tag type="danger">deny</el-tag>
              <el-tag type="danger">{{ scope.row.denyCount }}</el-tag>
              <el-tag type="warning">warn</el-tag>
              <el-tag type="warning">{{ scope.row.warnCount }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="访问时间" prop="createTime">
            <template #default="scope">
              <el-tag v-time="scope.row.createTimeMin" />
            </template>
          </el-table-column>
        </scTable>
      </el-main>
    </el-container>

    <el-dialog v-model="deleteStatus" :width="700" title="清除日志" draggable>
      <el-select v-model="deleteMonth" style="width: 100%">
        <el-option :value="0" label="全部" />
        <el-option :value="1" label="近1月">近1月</el-option>
        <el-option :value="2" label="近2月">近2月</el-option>
        <el-option :value="3" label="近3月">近3月</el-option>
        <el-option :value="6" label="近6月">近6月</el-option>
        <el-option :value="12" label="近1年">近1年</el-option>
      </el-select>
      <template #footer>
        <el-button @click="deleteStatus = false">取 消</el-button>
        <el-button type="primary" @click="cleanLog">确定</el-button>
      </template>
    </el-dialog>

    <address-charts v-if="AddressChartsVisible" ref="addressChartsRef" />
  </div>
</template>

<script>
import AddressCharts from "./addressCharts.vue";
export default {
  name: "tableBase",
  components: {
    AddressCharts
  },
  data() {
    return {
      AddressChartsVisible: false,
      statusFilters: [
        { text: "启用", value: 0 },
        { text: "禁用", value: 1 }
      ],
      form: {
        mapMethod: []
      },
      searchQuery: {},
      rules: {
        proxyId: [{ required: true, message: "请选择代理", trigger: "blur" }],
        limitUrl: [{ required: true, message: "请输入限流地址", trigger: "blur" }],
        limitPermitsPerSecond: [{ required: true, message: "请输入每秒访问次数", trigger: "blur" }]
      },
      deleteMonth: 3,
      mode: "add",
      isSaveing: false,
      apps: [],
      tableData: [],
      tableDataCopy: [],
      visible: 0,
      searchParams: {},
      data: [
        {
          title: "环境",
          key: "limitProfile",
          multiple: !1,
          options: []
        }
      ],
      row: {
        limitDisable: 1
      },
      applications: [],
      list: {
        apiObj: this.$API.proxy_limit.log.page,
        apiObjUpdate: this.$API.proxy_limit.update,
        apiObjSave: this.$API.proxy_limit.save,
        apiObjUpload: this.$API.proxy_limit.upload,
        apiObjDelete: this.$API.proxy_limit.log.delete
      },
      value: [],
      selection: [],
      deleteStatus: false
    };
  },
  mounted() {
    this.data[0].options = this.profiles;
    this.afterPrepertiesSet();
  },
  methods: {
    getTime(i) {
      try {
        return this.value[i].getTime();
      } catch (error) {
        return this.value[i]?.$d?.getTime();
      }
    },
    doCharts(address) {
      this.AddressChartsVisible = !0;
      this.$nextTick(() => {
        this.$refs.addressChartsRef.setData(address).open();
      });
    },
    getType(type) {
      if (type === "allow") {
        return "success";
      }
      if (type === "deny") {
        return "danger";
      }

      return "warning";
    },
    cleanLog() {
      this.list.apiObjDelete.delete({ limitMonth: this.deleteMonth }).then(res => {
        if (res.code === "00000") {
          this.$message.success("操作成功");
          this.search();
          return 0;
        }
        this.$message.error(res.msg);
      });
    },
    async afterPrepertiesSet() {
      this.$API.proxy.list.get().then(res => {
        if (res.code === "00000") {
          this.apps = res.data;
        }
      });
    },
    //表格选择后回调事件
    selectionChange(selection) {
      this.selection = selection;
    },
    deleteDialog() {
      this.deleteStatus = true;
    },
    search() {
      this.searchParams.startDate = this.getTime(0);
      this.searchParams.endDate = this.getTime(1);
      this.$refs.table.reload(this.searchParams);
    },
    table_del(row) {
      this.list.apiObjDelete.delete({ id: row.limitId }).then(res => {
        if (res.code === "00000") {
          this.$message.success("操作成功");
          this.search();
          return 0;
        }
        this.$message.error(res.msg);
      });
    },
    //批量删除
    async batch_del() {
      this.$confirm(`确定删除选中的 ${this.selection.length} 项吗？如果删除项中含有子集将会被一并删除`, "提示", {
        type: "warning"
      })
        .then(() => {
          const loading = this.$loading();
          const ids = [];
          for (const item of this.selection) {
            ids.push(item.limitId);
          }
          this.list.apiObjDelete
            .delete({ id: ids.join(",") })
            .then(res => {
              if (res.code === "00000") {
                this.$message.success("操作成功");
                this.search();
                return 0;
              }
            })
            .finally(() => {
              loading.close();
            });
        })
        .catch(() => {});
    },
    table_upload(row) {
      this.list.apiObjUpload.post(row || this.row).then(res => {
        if (res.code === "00000") {
          this.search();
          this.$message.success("下发成功");
          return 0;
        }
        this.$message.error(res.msg);
      });
    },
    table_edit(row) {
      this.visible = !0;
      if (!row.limitId) {
        row.limitDisable = 0;
      }
      this.changeRow(row);
      this.row = row;
      delete this.row.disable;
    },
    changeRow(row) {},
    submitFormUpdate(row) {
      this.$refs.dialogForm.validate(valid => {
        if (valid) {
          if (!row.limitId) {
            this.list.apiObjSave
              .post(row || this.row)
              .then(res => {
                if (res.code === "00000") {
                  this.search();
                  this.visible = !1;
                  return 0;
                }
                this.$message.error(res.msg);
              })
              .finally(() => {
                this.changeRow(row);
              });
            return false;
          }
          this.list.apiObjUpdate
            .put(row || this.row)
            .then(res => {
              if (res.code === "00000") {
                this.search();
                this.visible = !1;
                return 0;
              }
              this.$message.error(res.msg);
            })
            .finally(() => {
              this.changeRow(row);
            });
        }
      });
    },
    filterHandler(value, row, column) {
      const property = column["property"];
      return row[property] === value;
    },
    change(selected) {
      this.searchParams = selected;
      if (!selected.limitProfile) {
        delete selected.limitProfile;
      }
      this.$refs.table.reload(selected);
    }
  }
};
</script>

<style></style>
