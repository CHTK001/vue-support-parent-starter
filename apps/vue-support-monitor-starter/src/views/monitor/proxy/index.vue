<template>
  <div class="proxy-container">
    <div class="proxy-header">
      <h2 class="proxy-title">
        <IconifyIconOnline icon="mdi:server-network" />
        代理服务管理
      </h2>
      <el-button type="primary" class="add-proxy-btn" @click="doSave">
        <IconifyIconOnline icon="ep:plus" />
        添加代理
      </el-button>
    </div>

    <div class="proxy-content">
      <ScTable ref="tableRef" layout="card" :data-loaded="handleDataLoaded" :url="fetchProxyPage" :params="form" class="proxy-card" :appendable="false">
        <template #default="{ row }">
          <div class="proxy-item" :class="{ 'proxy-active': row?.proxyStatus == 1 }">
            <div class="proxy-item-header">
              <div class="proxy-icon">
                <el-icon>
                  <component :is="useRenderIcon(getProxyIcon(row.proxyProtocol))" />
                </el-icon>
                <div class="proxy-status" :class="{ 'status-active': row.proxyStatus == 1 }">
                  <span v-if="row.proxyStatus == 1" class="status-dot" />
                  {{ row.proxyStatus == 1 ? "运行中" : "已停止" }}
                </div>
              </div>
              <div class="proxy-info">
                <div class="proxy-name" @click="doOpenUrl(row)">
                  {{ row.proxyName }}
                  <IconifyIconOnline icon="mdi:open-in-new" class="open-icon" />
                </div>
                <div class="proxy-desc">
                  {{ row.proxyDesc || "暂无描述" }}
                </div>
                <div class="proxy-details">
                  <el-tag size="small" effect="plain" class="proxy-tag">
                    {{ row.proxyProtocol }}
                  </el-tag>
                  <el-tag size="small" effect="plain" class="proxy-tag">
                    {{ row.proxyHost }}
                  </el-tag>
                  <el-tag size="small" effect="plain" class="proxy-tag">
                    {{ row.proxyPort }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="proxy-actions">
              <el-tooltip content="设置" placement="top" :show-after="300">
                <el-button circle :loading="startDialogStatus" :icon="useRenderIcon('ep:setting')" @click="doSetting(row)" />
              </el-tooltip>

              <el-tooltip content="日志" placement="top" :show-after="300">
                <el-button circle :loading="startDialogStatus" :icon="useRenderIcon('simple-icons:logitechg')" @click="doLog(row)" />
              </el-tooltip>

              <el-tooltip content="实时日志" placement="top" :show-after="300">
                <el-button circle :loading="startDialogStatus" :icon="useRenderIcon('simple-icons:logstash')" @click="doTail(row)" />
              </el-tooltip>

              <el-tooltip v-if="row.proxyStatus != 1" content="编辑" placement="top" :show-after="300">
                <el-button circle :loading="startDialogStatus" :icon="useRenderIcon('ep:edit')" @click="doEdit(row)" />
              </el-tooltip>

              <el-popconfirm v-if="row.proxyStatus != 1" :title="$t('message.confimDelete')" confirm-button-type="danger" cancel-button-type="info" @confirm="doDelete(row)">
                <template #reference>
                  <el-tooltip content="删除" placement="top" :show-after="300">
                    <el-button circle :loading="startDialogStatus" :icon="useRenderIcon('ep:delete')" type="danger" />
                  </el-tooltip>
                </template>
              </el-popconfirm>

              <el-tooltip :content="row.proxyStatus != 1 ? '启动' : '停止'" placement="top" :show-after="300">
                <el-button
                  circle
                  :loading="startDialogStatus"
                  :type="row.proxyStatus != 1 ? 'success' : 'warning'"
                  :icon="useRenderIcon(row.proxyStatus != 1 ? 'ri:play-large-fill' : 'ri:pause-large-fill')"
                  @click="row.proxyStatus != 1 ? doStart(row) : doStop(row)"
                />
              </el-tooltip>
            </div>
          </div>
        </template>
      </ScTable>

      <div v-if="isEmpty" class="proxy-empty">
        <IconifyIconOnline icon="mdi:server-off" class="empty-icon" />
        <p>暂无代理服务</p>
        <el-button type="primary" @click="doSave">
          <IconifyIconOnline icon="ep:plus" />
          添加代理
        </el-button>
      </div>
    </div>

    <save-dialog ref="saveDialog" @success="afterPropertiesSet" />
    <ProxyLog ref="proxyLogRef" />
    <LogDialog ref="proxyTailRef" />
    <setting-dialog ref="settingDialog" />
  </div>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchProxyDelete, fetchProxyPage, fetchProxyStart, fetchProxyStop } from "@/api/monitor/proxy";
import { defineAsyncComponent, ref } from "vue";
import SettingDialog from "./setting.vue";

export default {
  components: {
    SettingDialog,
    LogDialog: defineAsyncComponent(() => import("./log.vue")),
    ProxyLog: defineAsyncComponent(() => import("./log/index.vue")),
    SaveDialog: defineAsyncComponent(() => import("./save.vue"))
  },
  data() {
    return {
      socket: null,
      data: [],
      total: 0,
      loading: false,
      tailDialogVisible: false,
      tailDialogStatus: false,
      logDialogVisible: false,
      logDialogStatus: false,
      saveDialogStatus: false,
      settingDialogStatus: false,
      infoDialogStatus: false,
      deleteStatus: false,
      startDialogStatus: false,
      isEmpty: false,
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
      this.tailDialogStatus = true;
      this.settingDialogStatus = true;
      this.checkIfEmpty();
    }, 50);
  },
  methods: {
    useRenderIcon,
    fetchProxyPage,

    // 获取代理图标
    getProxyIcon(protocol) {
      switch (protocol) {
        case "websockify":
          return "simple-icons:proxmox";
        case "http-proxy":
          return "simple-icons:apache";
        case "tcp-proxy":
          return "simple-icons:lineageos";
        default:
          return "mdi:server-network";
      }
    },

    // 检查是否为空
    checkIfEmpty() {
      setTimeout(() => {
        this.isEmpty = this.data.length === 0;
      }, 500);
    },

    handleDataLoaded(data, total) {
      this.data = data;
      this.total = total;
      this.isEmpty = this.data.length === 0;
    },

    // 打开URL
    doOpenUrl(row) {
      window.open(`http://${row.proxyHost}:${row.proxyPort}`);
    },

    // 刷新数据
    afterPropertiesSet() {
      this.$refs?.tableRef?.reload(this.form);
      this.checkIfEmpty();
    },

    // 打开应用
    doOpenApps(item) {
      this.infoDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.infoDialog.open("view").setData(item);
      });
    },

    // 新增代理
    doSave() {
      this.saveDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.saveDialog.setData({}).open("add");
      });
    },

    // 编辑代理
    doEdit(item) {
      this.saveDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.saveDialog.setData(item).open("edit");
      });
    },

    // 设置代理
    doSetting(item) {
      this.settingDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.settingDialog.setData(item).open("edit");
      });
    },

    // 查看日志
    doLog(item) {
      this.logDialogVisible = true;
      setTimeout(() => {
        this.$nextTick(() => {
          this.$refs.proxyLogRef.setData(item).open("edit");
        });
      }, 200);
    },

    // 查看实时日志
    doTail(item) {
      this.tailDialogVisible = true;
      setTimeout(() => {
        this.$nextTick(() => {
          this.$refs.proxyTailRef.setData(item).open("edit");
        });
      }, 200);
    },

    // 启动代理
    doStart(row) {
      this.startDialogStatus = true;
      fetchProxyStart({ id: row.proxyId })
        .then(res => {
          if (res.code != "00000") {
            this.$message.error(res.msg);
            row.proxyStatus = 1;
            return;
          }
          this.$message.success("代理服务启动成功");
          this.afterPropertiesSet();
        })
        .finally(() => (this.startDialogStatus = false));
    },

    // 停止代理
    doStop(row) {
      this.startDialogStatus = true;
      fetchProxyStop({ id: row.proxyId })
        .then(res => {
          if (res.code != "00000") {
            this.$message.error(res.msg);
            row.proxyStatus = 0;
            return;
          }
          this.$message.success("代理服务已停止");
          this.afterPropertiesSet();
        })
        .finally(() => (this.startDialogStatus = false));
    },

    // 删除代理
    doDelete(row) {
      this.deleteStatus = true;
      fetchProxyDelete({ id: row.proxyId })
        .then(res => {
          if (res.code != "00000") {
            this.$message.error(res.msg);
            return;
          }
          this.$message.success("代理服务已删除");
          this.afterPropertiesSet();
        })
        .finally(() => (this.deleteStatus = false));
    }
  }
};
</script>

<style scoped>
.proxy-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.proxy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.proxy-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-proxy-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

.proxy-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.proxy-card {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
}

.proxy-item {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-light);
  position: relative;
  overflow: hidden;
}

.proxy-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.proxy-active {
  border-left: 4px solid var(--el-color-success);
}

.proxy-item-header {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.proxy-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
}

.proxy-icon .el-icon {
  font-size: 40px;
  color: var(--el-color-primary);
  margin-bottom: 10px;
}

.proxy-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.status-active {
  background-color: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.proxy-info {
  flex: 1;
}

.proxy-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.proxy-name:hover .open-icon {
  opacity: 1;
}

.open-icon {
  font-size: 16px;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.proxy-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.proxy-details {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.proxy-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.proxy-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 80px;
  color: var(--el-color-info-light-5);
  margin-bottom: 20px;
}

.proxy-empty p {
  font-size: 16px;
  margin-bottom: 20px;
}

/* 动画效果 */
.proxy-item {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .proxy-item-header {
    flex-direction: column;
  }

  .proxy-icon {
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
    gap: 15px;
    margin-bottom: 15px;
  }

  .proxy-actions {
    flex-wrap: wrap;
  }
}
</style>
