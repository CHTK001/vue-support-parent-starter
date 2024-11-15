<template>
  <div>
    <el-container>
      <el-header>
        <div class="left-panel">
          <el-button :icon="useRenderIcon('ep:plus')" @click="save({}, 'add')" />
        </div>
        <div class="right-panel">
          <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="afterPrepertiesSet" />
        </div>
      </el-header>
      <el-main class="nopadding">
        <scTable ref="table" :url="fetchOssProtocolPage" :params="searchParams" row-key="id" stripe>
          <el-table-column type="selection" width="50" />
          <el-table-column label="应用名称" prop="fileStorageProtocolDesc">
            <template #default="{ row }">
              <span v-if="row.fileStorageProtocolStatus != 1">{{ row.fileStorageProtocolDesc }}</span>
              <span v-else style="color: blue; cursor: pointer" @click="doDetail(row)">{{ row.fileStorageProtocolDesc }}</span>
            </template>
          </el-table-column>
          <el-table-column label="协议" prop="fileStorageProtocolName" />
          <el-table-column label="主机" prop="fileStorageProtocolHost" />
          <el-table-column label="端口" prop="fileStorageProtocolPort" show-overflow-tooltip />
          <el-table-column label="插件" prop="fileStorageProtocolPlugins" show-overflow-tooltip>
            <template #default="{ row }">
              <div>{{ row.fileStorageProtocolPlugins }}</div>
              <div>
                <el-switch
                  v-if="row.fileStorageProtocolStatus != 1"
                  v-model="row.fileStorageProtocolPluginOpen"
                  :active-value="1"
                  :inactive-value="0"
                  type="primary"
                  size="small"
                  @click="doTriggerPlugin(row)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="配置" prop="fileStorageProtocolSetting" show-overflow-tooltip>
            <template #default="{ row }">
              <div>{{ row.fileStorageProtocolSetting }}</div>
              <div>
                <el-switch
                  v-if="row.fileStorageProtocolStatus != 1"
                  v-model="row.fileStorageProtocolSettingOpen"
                  :active-value="1"
                  :inactive-value="0"
                  type="primary"
                  size="small"
                  @click="doTriggerSetting(row)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="代理UA" prop="fileStorageProtocolUa" show-overflow-tooltip>
            <template #default="{ row }">
              <div>{{ row.fileStorageProtocolUa }}</div>
              <div>
                <el-switch
                  v-if="row.fileStorageProtocolStatus != 1"
                  v-model="row.fileStorageProtocolUaOpen"
                  :active-value="1"
                  :inactive-value="0"
                  type="primary"
                  size="small"
                  @click="doTriggerUa(row)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="下载UA" prop="fileStorageProtocolDownloadUa" show-overflow-tooltip />
          <el-table-column label="分段下载" prop="fileStorageProtocolRangeOpen" show-overflow-tooltip>
            <template #default="{ row }">
              <div>
                <el-switch
                  v-if="row.fileStorageProtocolStatus != 1"
                  v-model="row.fileStorageProtocolRangeOpen"
                  :active-value="1"
                  :inactive-value="0"
                  type="primary"
                  size="small"
                  @click="doTriggerUa(row)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="水印" prop="fileStorageProtocolWatermarkOpen" show-overflow-tooltip>
            <template #default="{ row }">
              <div>
                <el-switch
                  v-if="row.fileStorageProtocolStatus != 1"
                  v-model="row.fileStorageProtocolWatermarkOpen"
                  :active-value="1"
                  :inactive-value="0"
                  type="primary"
                  size="small"
                  @click="doTriggerWatermark(row)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" align="right" width="260">
            <template #default="scope">
              <el-button-group>
                <el-button v-if="scope.row.fileStorageProtocolStatus != 1" text type="primary" size="small" @click="start(scope.row)">启动</el-button>
                <span v-else>
                  <el-button text type="primary" size="small" @click="stop(scope.row)">停止</el-button>
                </span>
                <el-button text type="primary" size="small">
                  <span
                    v-copy:click="scope.row.fileStorageProtocolName.toLowerCase() + '://' + scope.row.fileStorageProtocolHost.replace('0.0.0.0', '127.0.0.1') + ':' + scope.row.fileStorageProtocolPort"
                  >
                    复制
                  </span>
                </el-button>
                <el-button text type="primary" size="small" @click="doDetail(scope.row)">存储</el-button>
                <el-button text type="primary" size="small" @click="save(scope.row, 'edit')">编辑</el-button>
                <el-popconfirm v-if="scope.row.fileStorageProtocolStatus != 1" title="确定删除吗？" @confirm="doDelete(scope.row, scope.$index)">
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

    <save-dialog v-if="saveDialogStatus" ref="saveDialogRef" @success="afterPrepertiesSet" />
    <detail-dialog v-if="detailDialogStatus" ref="detailDialogRef" @success="afterPrepertiesSet" />
  </div>
</template>

<script>
import SaveDialog from "./save.vue";
import DetailDialog from "./detail.vue";
import { fetchOssProtocolDelete, fetchOssProtocolPage, fetchOssProtocolStart, fetchOssProtocolStop, fetchOssProtocolUpdate } from "@/api/monitor/oss";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
export default {
  components: {
    SaveDialog,
    DetailDialog
  },
  data() {
    return {
      saveDialogStatus: false,
      detailDialogStatus: false,
      uaValue: 0,
      settingValue: 0,
      pluginValue: 0,
      searchParams: {}
    };
  },
  methods: {
    useRenderIcon,
    fetchOssProtocolPage,
    doTriggerWatermark(row) {
      fetchOssProtocolUpdate(row).then(res => {
        if (res.code == "00000") {
          this.$message.success("水印修改成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    doTriggerUa(row) {
      fetchOssProtocolUpdate(row).then(res => {
        if (res.code == "00000") {
          this.$message.success("UA修改成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    doTriggerSetting(row) {
      fetchOssProtocolUpdate(row).then(res => {
        if (res.code == "00000") {
          this.$message.success("Setting 修改成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    doTriggerPlugin(row) {
      fetchOssProtocolUpdate(row).then(res => {
        if (res.code == "00000") {
          this.$message.success("Plugin 修改成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    doDetail(row) {
      this.detailDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.detailDialogRef.setData(row).open("add");
      });
    },
    doDelete(row) {
      fetchOssProtocolDelete({ id: row.fileStorageProtocolId }).then(res => {
        if (res.code == "00000") {
          this.$message.success("删除成功");
          this.afterPrepertiesSet();
          return;
        }
        this.$message.error(res.msg);
      });
    },
    start(row) {
      fetchOssProtocolStart({ id: row.fileStorageProtocolId }).then(res => {
        if (res.code == "00000") {
          row.fileStorageProtocolStatus = 1;
          this.$message.success("启动成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    stop(row) {
      fetchOssProtocolStop({ id: row.fileStorageProtocolId }).then(res => {
        if (res.code == "00000") {
          row.fileStorageProtocolStatus = 0;
          this.$message.success("停止成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    async save(row, mode) {
      this.saveDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.saveDialogRef.setData(row).open(mode);
      });
    },
    async afterPrepertiesSet() {
      this.$refs.table.reload(this.searchParams);
    }
  }
};
</script>
