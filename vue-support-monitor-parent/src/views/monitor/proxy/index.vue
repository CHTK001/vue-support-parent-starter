<template>
  <div class="h-full p-4">
    <div class="h-full">
      <ScCard ref="tableRef" :url="fetchProxyPage" :params="form" class="h-full" :appendable="true">
        <template #default="{ row }">
          <el-row class="relation" style="min-height: 128px">
            <el-col :span="8">
              <div>
                <el-icon :style="{ 'font-size': '80px', color: row.proxyStatus == 1 ? '#5ca8ea' : '#999', 'margin-top': '4px' }">
                  <component :is="useRenderIcon('ep:add-location')" />
                </el-icon>
                <el-tag v-if="row.proxyStatus == 1" style="margin-left: 13px">{{ row.proxyPort }}</el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <ul>
                <li class="pt-1">
                  <h4>代理名称</h4>
                  <el-tag>{{ row.proxyName }}</el-tag>
                </li>
                <li>
                  <h4>代理说明</h4>
                  <p>
                    <el-tag v-if="row.proxyDesc" effect="light">{{ row.proxyDesc }}</el-tag>
                    <el-tag v-else>暂无描述</el-tag>
                  </p>
                </li>
              </ul>
            </el-col>
          </el-row>
          <div class="bottom">
            <div class="state">
              <el-button circle size="small" :loading="startDialogStatus" :icon="useRenderIcon('ep:setting')" class="cursor-pointer" title="设置" @click="doSetting(row)" />
              <el-button circle size="small" :loading="startDialogStatus" :icon="useRenderIcon('simple-icons:logitechg')" class="cursor-pointer" title="日志" @click="doLog(row)" />
              <el-button v-if="row.proxyStatus == 0" :loading="startDialogStatus" circle size="small" :icon="useRenderIcon('ep:edit')" class="cursor-pointer" title="编辑" @click="doEdit(row)" />

              <el-popconfirm title="确定删除吗？" @confirm="doDelete(row)">
                <template #reference>
                  <el-button
                    v-if="row.proxyStatus == 0"
                    :loading="startDialogStatus"
                    circle
                    size="small"
                    :icon="useRenderIcon('ep:delete')"
                    type="danger"
                    style="font-size: 16px"
                    class="cursor-pointer"
                    title="删除"
                  />
                </template>
              </el-popconfirm>
              <el-button
                v-if="!row.proxyStatus || row.proxyStatus == 0"
                :loading="startDialogStatus"
                circle
                size="small"
                :icon="useRenderIcon('ri:play-large-fill')"
                style="font-size: 16px"
                class="cursor-pointer"
                title="启动"
                @click="doStart(row)"
              />
              <el-button
                v-else
                :icon="useRenderIcon('ri:pause-large-fill')"
                :loading="startDialogStatus"
                style="font-size: 16px"
                circle
                size="small"
                class="cursor-pointer"
                title="暂停"
                @click="doStop(row)"
              />
            </div>
          </div>
        </template>
        <template #appendable>
          <el-card class="task task-add" shadow="never" @click="doSave">
            <el-icon><component :is="useRenderIcon('ep:plus')" /></el-icon>
            <p>添加代理</p>
          </el-card>
        </template>
      </ScCard>
    </div>
    <Suspense v-if="saveDialogStatus">
      <template #default>
        <div>
          <save-dialog ref="saveDialog" @success="afterPropertiesSet" />
        </div>
      </template>
    </Suspense>
    <Suspense v-if="logDialogStatus">
      <template #default>
        <div>
          <ProxyLog v-if="logDialogVisible" ref="proxyLogRef" />
        </div>
      </template>
    </Suspense>
    <setting-dialog ref="settingDialog" />
  </div>
</template>

<script>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { fetchProxyDelete, fetchProxyPage, fetchProxyStart, fetchProxyStop } from "@/api/monitor/proxy";
import { defineAsyncComponent } from "vue";
import SettingDialog from "./setting.vue";
import { set } from "nprogress";
export default {
  components: {
    ScCard: defineAsyncComponent(() => import("@/components/ScCard/index.vue")),
    SettingDialog,
    ProxyLog: defineAsyncComponent(() => import("./log/index.vue")),
    SaveDialog: defineAsyncComponent(() => import("./save.vue"))
  },
  data() {
    return {
      socket: null,
      data: [],
      total: 0,
      loading: false,
      logDialogVisible: false,
      saveDialogStatus: false,
      logDialogStatus: false,
      settingDialogStatus: false,
      infoDialogStatus: false,
      deleteStatus: false,
      startDialogStatus: false,
      form: {
        pageSize: 20,
        page: 1
      }
    };
  },
  mounted() {
    setTimeout(() => {
      this.saveDialogStatus = true;
      this.logDialogStatus = true;
      this.infoDialogStatus = true;
      this.settingDialogStatus = true;
    }, 50);
  },
  methods: {
    useRenderIcon,
    fetchProxyPage,
    afterPropertiesSet() {
      this.$refs?.tableRef?.reload(this.form);
    },
    doOpenApps(item) {
      this.infoDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.infoDialog.open("view").setData(item);
      });
    },
    doSave() {
      this.saveDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.saveDialog.setData({}).open("add");
      });
    },
    doEdit(item) {
      this.saveDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.saveDialog.setData(item).open("edit");
      });
    },
    doSetting(item) {
      this.settingDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.settingDialog.setData(item).open("edit");
      });
    },
    doLog(item) {
      this.logDialogVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.proxyLogRef.setData(item).open("edit");
        }, 200);
      });
    },
    doStart(row) {
      this.startDialogStatus = true;
      fetchProxyStart({ id: row.proxyId })
        .then(res => {
          if (res.code != "00000") {
            this.$message.error(res.msg);
            row.proxyStatus = 1;
            return;
          }
          this.afterPropertiesSet();
        })
        .finally(() => (this.startDialogStatus = false));
    },
    doStop(row) {
      this.startDialogStatus = true;
      fetchProxyStop({ id: row.proxyId })
        .then(res => {
          if (res.code != "00000") {
            this.$message.error(res.msg);
            row.proxyStatus = 0;
            return;
          }
          this.afterPropertiesSet();
        })
        .finally(() => (this.startDialogStatus = false));
    },
    doDelete(row) {
      this.deleteStatus = true;
      fetchProxyDelete({ id: row.proxyId })
        .then(res => {
          if (res.code != "00000") {
            this.$message.error(res.msg);
            return;
          }
          this.afterPropertiesSet();
        })
        .finally(() => (this.deleteStatus = false));
    }
  }
};
</script>

<style scoped>
.tool {
  font-size: 16px;
  position: relative;
  top: -2px;
  height: 40px;
}

:deep(.el-progress-circle path) {
  fill: #fff;
}

.task-item h2 {
  font-size: 15px;
  color: #3c4a54;
  padding-bottom: 15px;
}

.task-item li {
  list-style-type: none;
  margin-bottom: 10px;
}

.task-item li h4 {
  font-size: 12px;
  font-weight: normal;
  color: #999;
}

.task-item li p {
  margin-top: 5px;
}

.task-item .bottom {
  border-top: 1px solid var(--el-border-color-light);
  text-align: right;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  color: #999;
}
:deep(.task-add .el-card__body) {
  margin-top: 28px;
  padding-top: 38px;
}

.task-add:hover {
  color: #409eff;
}

.task-add i {
  font-size: 30px;
}

.task-add p {
  font-size: 12px;
  margin-top: 20px;
}

.dark .task-item .bottom {
  border-color: var(--el-border-color-light);
}

.progress {
  margin-top: -45px;
}

.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 16px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}
.bottom {
  border-top: 1px solid #ebeef5;
  text-align: right;
  padding-top: 10px;
  align-items: center;
}
.demo-progress .el-progress--line {
  margin-bottom: 15px;
  width: 350px;
}

.demo-progress .el-progress--circle {
  margin-right: 15px;
}

li h4 {
  font-size: 12px;
  font-weight: normal;
  color: #999;
}
</style>
