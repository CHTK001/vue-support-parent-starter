<template>
  <div class="p-1">
    <el-container>
      <el-header>
        <div class="right-panel">
          <el-button :icon="useRenderIcon('ep:plus')" @click="save({}, 'add')" />
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
                <el-switch v-if="row.fileStorageProtocolStatus != 1" v-model="row.fileStorageProtocolPluginOpen" :active-value="1" :inactive-value="0" type="primary" size="small" @click="doTriggerPlugin(row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="配置" prop="fileStorageProtocolSetting" show-overflow-tooltip>
            <template #default="{ row }">
              <div>{{ row.fileStorageProtocolSetting }}</div>
              <div>
                <el-switch v-if="row.fileStorageProtocolStatus != 1" v-model="row.fileStorageProtocolSettingOpen" :active-value="1" :inactive-value="0" type="primary" size="small" @click="doTriggerSetting(row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="代理UA" prop="fileStorageProtocolUa" show-overflow-tooltip>
            <template #default="{ row }">
              <div>{{ row.fileStorageProtocolUa }}</div>
              <div>
                <el-switch v-if="row.fileStorageProtocolStatus != 1" v-model="row.fileStorageProtocolUaOpen" :active-value="1" :inactive-value="0" type="primary" size="small" @click="doTriggerUa(row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="下载UA" prop="fileStorageProtocolDownloadUa" show-overflow-tooltip />
          <el-table-column label="分段下载" prop="fileStorageProtocolRangeOpen" show-overflow-tooltip>
            <template #default="{ row }">
              <div>
                <el-switch v-if="row.fileStorageProtocolStatus != 1" v-model="row.fileStorageProtocolRangeOpen" :active-value="1" :inactive-value="0" type="primary" size="small" @click="doTriggerUa(row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="水印" prop="fileStorageProtocolWatermarkOpen" show-overflow-tooltip>
            <template #default="{ row }">
              <div>
                <el-tag v-if="row.fileStorageProtocolWatermarkOpen > 0">开启</el-tag>
                <el-tag v-else>关闭</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" align="right" width="260">
            <template #default="scope">
              <el-button class="btn-text mr-1" :icon="useRenderIcon('ri:settings-2-line')" @click="doDetail(scope.row)" />
              <el-button v-if="scope.row.fileStorageProtocolStatus != 1" type="primary" class="btn-text" :icon="useRenderIcon('ri:play-circle-line')" @click="start(scope.row)" />
              <el-button v-else type="danger" class="btn-text mr-1" :icon="useRenderIcon('ri:stop-circle-line')" @click="stop(scope.row)" />
              <el-button type="primary" class="btn-text mr-1" :icon="useRenderIcon('ri:edit-box-line')" @click="save(scope.row, 'edit')" />
              <el-button class="btn-text" :icon="useRenderIcon('ep:copy-document')">
                <span v-copy:click="scope.row.fileStorageProtocolName.toLowerCase() + '://' + scope.row.fileStorageProtocolHost.replace('0.0.0.0', '127.0.0.1') + ':' + scope.row.fileStorageProtocolPort" />
              </el-button>
              <el-popconfirm v-if="scope.row.fileStorageProtocolStatus != 1" class="mr-1" :title="$t('message.confimDelete')" @confirm="doDelete(scope.row, scope.$index)">
                <template #reference>
                  <el-button type="danger" class="btn-text" :icon="useRenderIcon('ri:delete-bin-2-line')" />
                </template>
              </el-popconfirm>
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
    DetailDialog,
  },
  data() {
    return {
      saveDialogStatus: false,
      detailDialogStatus: false,
      uaValue: 0,
      settingValue: 0,
      pluginValue: 0,
      searchParams: {},
    };
  },
  methods: {
    useRenderIcon,
    fetchOssProtocolPage,
    doTriggerWatermark(row) {
      fetchOssProtocolUpdate(row).then((res) => {
        if (res.code == "00000") {
          this.$message.success("水印修改成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    doTriggerUa(row) {
      fetchOssProtocolUpdate(row).then((res) => {
        if (res.code == "00000") {
          this.$message.success("UA修改成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    doTriggerSetting(row) {
      fetchOssProtocolUpdate(row).then((res) => {
        if (res.code == "00000") {
          this.$message.success("Setting 修改成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    doTriggerPlugin(row) {
      fetchOssProtocolUpdate(row).then((res) => {
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
      fetchOssProtocolDelete({ id: row.fileStorageProtocolId }).then((res) => {
        if (res.code == "00000") {
          this.$message.success("删除成功");
          this.afterPrepertiesSet();
          return;
        }
        this.$message.error(res.msg);
      });
    },
    start(row) {
      fetchOssProtocolStart({ id: row.fileStorageProtocolId }).then((res) => {
        if (res.code == "00000") {
          row.fileStorageProtocolStatus = 1;
          this.$message.success("启动成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    stop(row) {
      fetchOssProtocolStop({ id: row.fileStorageProtocolId }).then((res) => {
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
    },
  },
};
</script>
