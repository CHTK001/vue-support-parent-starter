<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="70%" :destroy-on-close="true" :close-on-click-modal="false" :close-on-press-escape="false" draggable class="h-[600px]" @close="close">
      <el-container>
        <el-header>
          <div class="left-panel" />
          <div class="right-panel">
            <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="search" />
            <el-button type="primary" :icon="useRenderIcon('ep:plus')" @click="doEdit({})" />
          </div>
        </el-header>
        <el-main class="nopadding">
          <scTable ref="table" :url="fetchProxyStatisticPage" :params="searchParams" row-key="id" stripe @selection-change="selectionChange">
            <el-table-column type="index" width="50" />
            <!-- <el-table-column label="应用名称" prop="proxyName"></el-table-column> -->
            <el-table-column label="服务名称" prop="proxyStatisticName" show-overflow-tooltip />
            <el-table-column label="服务地址" prop="proxyStatisticUrl" show-overflow-tooltip />
            <el-table-column label="协议" prop="proxyStatisticProtocol" show-overflow-tooltip />
            <el-table-column label="映射地址" prop="proxyStatisticHostname" show-overflow-tooltip />
            <el-table-column label="权重" prop="proxyStatisticWeight" show-overflow-tooltip />
            <el-table-column label="是否开启" prop="proxyStatisticStatus" :filters="statusFilters" :filter-method="filterHandler">
              <template #default="scope">
                <el-switch v-model="scope.row.proxyStatisticStatus" class="ml-2" :active-value="1" :inactive-value="0" @change="doUpdate(scope.row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" align="right" width="260">
              <template #default="scope">
                <el-button-group>
                  <el-button text type="primary" size="small" :icon="useRenderIcon('ep:edit')" @click="doEdit(scope.row, scope.$index)">{{ $t("buttons.edit") }}</el-button>
                  <el-popconfirm title="确定删除吗？" @confirm="doDelete(scope.row, scope.$index)">
                    <template #reference>
                      <el-button :icon="useRenderIcon('ep:delete')" text type="primary" size="small">{{ $t("buttons.delete") }}</el-button>
                    </template>
                  </el-popconfirm>
                </el-button-group>
              </template>
            </el-table-column>
          </scTable>
        </el-main>
      </el-container>
    </el-dialog>

    <Suspense v-if="saveLayoutVisiable1">
      <template #default>
        <SaveLayout v-if="saveLayoutVisiable" ref="saveLayoutRef" @success="search" />
      </template>
    </Suspense>
  </div>
</template>

<script>
import { fetchProxyStatisticDelete, fetchProxyStatisticPage, fetchProxyStatisticUpdate } from "@/api/monitor/proxy";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { defineAsyncComponent } from "vue";
export default {
  name: "tableBase",
  components: {
    SaveLayout: defineAsyncComponent(() => import("./save.vue"))
  },
  data() {
    return {
      saveLayoutVisiable: false,
      saveLayoutVisiable1: false,
      form: {},
      title: "",
      visible: !1,
      searchParams: {}
    };
  },
  mounted() {
    this.saveLayoutVisiable1 = true;
  },
  methods: {
    useRenderIcon,
    fetchProxyStatisticPage,
    setData(form) {
      Object.assign(this.form, form);
      this.title = "代理配置";
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
        this.$refs.saveLayoutRef.setData(row).open(row.proxyId ? "edit" : "add");
      });
    },
    doUpdate(row) {
      fetchProxyStatisticUpdate(row)
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
          fetchProxyStatisticDelete({ id: row.proxyStatisticId }).then(res => {
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

<style lang="scss" scoped>
:deep(.el-dialog__body) {
  height: 100%;
}
</style>
