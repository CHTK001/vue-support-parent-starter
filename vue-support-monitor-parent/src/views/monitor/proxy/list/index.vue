<template>
  <div>
    <el-dialog v-model="visible" :title="title" :destroy-on-close="true" :close-on-click-modal="false" :close-on-press-escape="false" draggable @close="close">
      <el-container>
        <el-header>
          <div class="left-panel" />
          <div class="right-panel">
            <el-button type="primary" icon="el-icon-search" @click="search" />
            <el-button type="primary" icon="el-icon-plus" @click="doEdit({})" />
          </div>
        </el-header>
        <el-main class="nopadding">
          <scTable ref="table" :apiObj="$API.proxy_list.page" :params="searchParams" row-key="id" stripe @selection-change="selectionChange">
            <el-table-column type="index" width="50" />
            <!-- <el-table-column label="应用名称" prop="proxyName"></el-table-column> -->
            <el-table-column v-if="listType == 0" label="限流地址" prop="listUrl" show-overflow-tooltip />
            <el-table-column v-if="listType == 1" label="限流IP地址" prop="listIp" show-overflow-tooltip />
            <el-table-column label="是否开启" prop="listStatus" :filters="statusFilters" :filter-method="filterHandler">
              <template #default="scope">
                <el-switch v-model="scope.row.listStatus" class="ml-2" :active-value="1" :inactive-value="0" @change="doUpdate(scope.row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" align="right" width="260">
              <template #default="scope">
                <el-button-group>
                  <el-button text type="primary" size="small" @click="doEdit(scope.row, scope.$index)">编辑</el-button>
                  <el-popconfirm title="确定删除吗？" @confirm="doDelete(scope.row, scope.$index)">
                    <template #reference>
                      <el-button text type="primary" size="small">删除</el-button>
                    </template>
                  </el-popconfirm>
                </el-button-group>
              </template>
            </el-table-column>
          </scTable>
        </el-main>
      </el-container>
    </el-dialog>

    <save-layout v-if="saveLayoutVisiable" ref="saveLayoutRef" @success="search" />
  </div>
</template>

<script>
import SaveLayout from "./save.vue";
export default {
  name: "tableBase",
  components: {
    SaveLayout
  },
  data() {
    return {
      saveLayoutVisiable: false,
      form: {},
      visible: !1,
      searchParams: {},
      limitType: {}
    };
  },
  methods: {
    setData(form, value) {
      Object.assign(this.form, form);
      this.title = form.proxyName + " [" + (value == 0 ? "白名单" : "黑名单") + "]";
      this.searchParams.proxyId = form.proxyId;
      this.searchParams.listType = value;
      this.listType = value;
      return this;
    },
    open() {
      this.visible = !0;
    },
    close() {
      this.visible = !1;
      this.form = {};
      this.searchParams = {};
    },
    search() {
      if (!this.searchParams.configProfile) {
        delete this.searchParams.configProfile;
      }
      this.$refs.table.reload(this.searchParams);
    },
    doEdit(row) {
      this.saveLayoutVisiable = true;
      this.$nextTick(() => {
        row.proxyId = this.form.proxyId;
        this.$refs.saveLayoutRef.setData(row, this.listType).open(row.proxyId ? "edit" : "add");
      });
    },
    doUpdate(row) {
      this.$API.proxy_list.update
        .put(row)
        .then(res => {
          if (res.code === "00000") {
            return 0;
          }
          this.$message.error(res.msg);
        })
        .finally(() => {});
    },
    //批量删除
    async doDelete(row) {
      this.$confirm(`确定删除选中项吗？如果删除项中含有子集将会被一并删除`, "提示", {
        type: "warning"
      })
        .then(() => {
          this.$API.proxy_list.delete.delete({ id: row.listId }).then(res => {
            if (res.code === "00000") {
              this.$message.success("操作成功");
              this.search();
              return 0;
            }
          });
        })
        .catch(() => {});
    }
  }
};
</script>

<style></style>
