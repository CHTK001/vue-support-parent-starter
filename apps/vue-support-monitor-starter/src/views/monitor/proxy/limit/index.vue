<template>
  <div class="h-[600px]">
    <el-container>
      <el-header>
        <div class="left-panel" />
        <div class="right-panel">
          <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="search" />
          <el-button type="primary" :icon="useRenderIcon('ep:plus')" @click="doEdit({})" />
        </div>
      </el-header>
      <el-main class="nopadding">
        <scTable ref="table" :url="fetchProxyLimitPage" :params="searchParams" row-key="id" stripe
          @selection-change="selectionChange">
          <el-table-column type="index" width="50" />
          <!-- <el-table-column label="应用名称" prop="proxyName"></el-table-column> -->
          <el-table-column label="限流IP地址" prop="proxyConfigLimitPathOrIp" show-overflow-tooltip />
          <el-table-column label="每秒次数" prop="proxyConfigLimitPerSeconds" show-overflow-tooltip />
          <el-table-column label="是否开启" prop="proxyConfigLimitPathOrIp" :filters="statusFilters"
            :filter-method="filterHandler">
            <template #default="scope">
              <el-switch v-model="scope.row.proxyConfigLimitDisabled" class="ml-2" :active-value="1" :inactive-value="0"
                @change="doUpdate(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" align="right" width="260">
            <template #default="scope">
              <el-button-group>
                <el-button text type="primary" size="small" @click="doEdit(scope.row, scope.$index)">编辑</el-button>
                <el-popconfirm :title="$t('message.confimDelete')" @confirm="doDelete(scope.row, scope.$index)">
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

    <save-layout v-if="saveLayoutVisiable" ref="saveLayoutRef" @success="search" />
  </div>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchProxyLimitDelete, fetchProxyLimitPage, fetchProxyLimitUpdate } from "@/api/monitor/proxy";
import SaveLayout from "./save.vue";
export default {
  name: "tableBase",
  components: {
    SaveLayout
  },
  props: {
    form: {
      type: Object,
      default: () => ({})
    },
    plugin: {
      type: Object,
      default: () => ({})
    },
    pluginId: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      saveLayoutVisiable: false,
      visible: !1,
      searchParams: {
        proxyConfigLimitType: this.plugin.proxyPluginSpi !== "ip-limit" ? "PATH" : "IP",
        proxyId: this.form.proxyId,
        proxyPluginId: this.form.proxyPluginId
      },
      limitType: {}
    };
  },
  mounted() {
    console.log(this.form);
  },
  methods: {
    useRenderIcon,
    fetchProxyLimitPage,
    close() {
      this.visible = !1;
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
        this.$refs.saveLayoutRef.setData(row, this.plugin.proxyPluginSpi !== "ip-limit" ? "PATH" : "IP").open(row.proxyConfigLimitId ? "edit" : "add");
      });
    },
    doUpdate(row) {
      row.proxyId = this.form.proxyId;
      fetchProxyLimitUpdate(row)
        .then(res => {
          if (res.code === "00000") {
            return 0;
          }
          this.$message.error(res.msg);
        })
        .finally(() => { });
    },
    //批量删除
    async doDelete(row) {
      this.$confirm(`确定删除选中项吗？如果删除项中含有子集将会被一并删除`, "提示", {
        type: "warning"
      })
        .then(() => {
          fetchProxyLimitDelete({ proxyConfigLimitId: row.proxyConfigLimitId }).then(res => {
            if (res.code === "00000") {
              this.$message.success("操作成功");
              this.search();
              return 0;
            }
          });
        })
        .catch(() => { });
    }
  }
};
</script>

<style lang="scss" scoped>
:deep(.el-dialog__body) {
  height: 100%;
}
</style>
