<template>
  <div class="project-console">
    <!-- console -->
    <log-view2 :ref="`logView`" height="calc(100vh - 140px)" class="console-log-view">
      <template #before>
        <div class="console-toolbar">
          <a-space>
            <a-button size="small" :disabled="project.status" :loading="optButtonLoading" type="primary" class="action-button start-button" @click="start">
              <template #icon><PlayCircleOutlined /></template>
              {{ $t("i18n_8e54ddfe24") }}
            </a-button>

            <a-button size="small" :disabled="!project.status" :loading="optButtonLoading" type="primary" danger class="action-button restart-button" @click="restart">
              <template #icon><ReloadOutlined /></template>
              {{ $t("i18n_01b4e06f39") }}
            </a-button>

            <a-button size="small" :disabled="!project.status" :loading="optButtonLoading" type="primary" danger class="action-button stop-button" @click="stop">
              <template #icon><PauseCircleOutlined /></template>
              {{ $t("i18n_095e938e2a") }}
            </a-button>

            <template v-if="project.runMode === 'Dsl'">
              <template v-if="canReload">
                <a-popover :title="$t('i18n_8b2e274414')" class="reload-popover">
                  <template #content>
                    <div class="reload-status">
                      <template v-if="project.lastReloadResult">
                        <p>
                          <a-tag v-if="project.lastReloadResult.success" color="green">{{ $t("i18n_330363dfc5") }}</a-tag>
                          <a-tag v-else color="red">{{ $t("i18n_330363dfc5") }}</a-tag>
                        </p>
                        <div class="reload-messages">
                          <p v-for="(item, index) in project.lastReloadResult.msgs" :key="index">
                            {{ item }}
                          </p>
                        </div>
                      </template>
                      <template v-else>{{ $t("i18n_14dcfcc4fa") }}</template>
                    </div>
                  </template>
                  <a-button size="small" :loading="optButtonLoading" type="primary" class="action-button reload-button" @click="reload">
                    <template #icon><SyncOutlined /></template>
                    {{ $t("i18n_aaeb54633e") }}
                  </a-button>
                </a-popover>
              </template>
              <template v-else>
                <a-button size="small" :disabled="true" :loading="optButtonLoading" type="primary" class="action-button reload-button disabled">
                  <template #icon><SyncOutlined /></template>
                  {{ $t("i18n_aaeb54633e") }}
                </a-button>
              </template>
            </template>

            <a-button size="small" type="primary" class="action-button file-button" @click="goFile">
              <template #icon><FolderOutlined /></template>
              {{ $t("i18n_8780e6b3d1") }}
            </a-button>

            <a-dropdown v-if="project.dslProcessInfo" class="process-dropdown">
              <template #overlay>
                <a-menu class="process-menu">
                  <a-menu-item v-for="(item, index) in project.dslProcessInfo" :key="index" class="process-item">
                    <template v-if="item.status">
                      <a-tag class="process-tag">
                        {{ item.process }}
                      </a-tag>
                      <template v-if="item.type === 'file'">
                        <span class="process-text">{{ $t("i18n_4df483b9c7") }}{{ item.scriptId }}</span>
                      </template>
                      <template v-else-if="item.type === 'script'">
                        <a-button
                          type="link"
                          size="small"
                          class="edit-script-button"
                          @click="
                            () => {
                              temp = { scriptId: item.scriptId };
                              editScriptVisible = true;
                            }
                          "
                        >
                          <EditOutlined />
                          {{ $t("i18n_e0ba3b9145") }}
                        </a-button>
                      </template>
                      <template v-else-if="item.type === 'library'">
                        <a-button type="link" size="small" disabled class="library-button">{{ $t("i18n_91a10b8776") }}{{ item.scriptId }}</a-button>
                      </template>
                    </template>
                    <template v-else>
                      <a-space class="process-error">
                        <a-tag class="process-tag">
                          {{ item.process }}
                        </a-tag>
                        <ExclamationCircleOutlined class="error-icon" />
                        <span class="error-message">{{ item.msg }}</span>
                      </a-space>
                    </template>
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button size="small" type="primary" class="process-button">
                <template #icon><ApiOutlined /></template>
                {{ $t("i18n_ce40cd6390") }}
                <DownOutlined />
              </a-button>
            </a-dropdown>

            <a-button
              size="small"
              class="log-info-button"
              @click="
                e => {
                  e.preventDefault();
                  handleLogBack();
                }
              "
            >
              <template #icon><FileTextOutlined /></template>
              {{ $t("i18n_76aebf3cc6") }}:
              <span class="log-size">{{ project.logSize || "-" }}</span>
              <FullscreenOutlined class="fullscreen-icon" />
            </a-button>
          </a-space>
        </div>
      </template>
    </log-view2>

    <!-- 日志备份 -->
    <CustomModal v-if="lobbackVisible" v-model:open="lobbackVisible" destroy-on-close :title="$t('i18n_15f01c43e8')" width="850px" :footer="null" :mask-closable="false" class="log-backup-modal">
      <ProjectLog v-if="lobbackVisible" :node-id="nodeId" :project-id="projectId" />
    </CustomModal>

    <!-- 编辑区 -->
    <ScriptEdit
      v-if="editScriptVisible"
      :node-id="nodeId"
      :script-id="temp.scriptId"
      @close="
        () => {
          editScriptVisible = false;
        }
      "
    />
  </div>
</template>
<script>
import { getProjectData, getProjectLogSize } from "@/api/node-project";
import { getWebSocketUrl } from "@/api/config";
import { mapState } from "pinia";

import LogView2 from "@/components/logView/index2.vue";
import ProjectLog from "./project-log.vue";
import ScriptEdit from "@/views/maintenance/node/script-edit.vue";

import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
  FolderOutlined,
  FileTextOutlined,
  FullscreenOutlined,
  DownOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ApiOutlined
} from "@ant-design/icons-vue";

export default {
  components: {
    LogView2,
    ProjectLog,
    ScriptEdit,
    PlayCircleOutlined,
    PauseCircleOutlined,
    ReloadOutlined,
    SyncOutlined,
    FolderOutlined,
    FileTextOutlined,
    FullscreenOutlined,
    DownOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    ApiOutlined
  },
  props: {
    nodeId: {
      type: String,
      default: ""
    },
    projectId: {
      type: String,
      default: ""
    },
    id: {
      type: String,
      default: ""
    }
  },
  emits: ["goFile"],
  data() {
    return {
      project: {},
      optButtonLoading: true,
      loading: false,
      socket: null,
      logExist: false,
      lobbackVisible: false,
      canReload: false,
      heart: null,
      editScriptVisible: false,
      temp: {}
    };
  },
  computed: {
    socketUrl() {
      return getWebSocketUrl("/socket/console", `id=${this.id}&nodeId=${this.nodeId}&type=console`);
    }
  },
  mounted() {
    this.loadProject();
    this.initWebSocket();
    // 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
    window.onbeforeunload = () => {
      this.close();
    };
  },
  beforeUnmount() {
    this.close();
  },
  methods: {
    close() {
      this.socket?.close();

      clearInterval(this.heart);
    },
    // 加载项目
    loadProject(loading) {
      const params = {
        id: this.projectId,
        nodeId: this.nodeId
      };
      getProjectData(params, loading).then(res => {
        if (res.code === 200) {
          this.project = { ...this.project, ...res.data };

          // 加载日志文件大小
          this.loadFileSize();
        }
      });
    },
    // 初始化
    initWebSocket() {
      //this.logContext = "";
      if (!this.socket || this.socket.readyState !== this.socket.OPEN || this.socket.readyState !== this.socket.CONNECTING) {
        this.socket = new WebSocket(this.socketUrl);
      }
      // 连接成功后
      this.socket.onopen = () => {
        this.sendMsg("status");
        this.sendMsg("showlog");
      };
      this.socket.onerror = err => {
        console.error(err);
        $notification.error({
          message: `web socket ${this.$t("i18n_7030ff6470")},${this.$t("i18n_226a6f9cdd")}`
        });
        clearInterval(this.heart);
      };
      this.socket.onclose = err => {
        //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
        console.error(err);
        $message.warning(this.$t("i18n_d6cdafe552"));
        clearInterval(this.heart);
      };
      this.socket.onmessage = msg => {
        if (msg.data.indexOf("JPOM_MSG") > -1 && msg.data.indexOf("op") > -1) {
          // console.log(msg.data);
          const res = JSON.parse(msg.data);
          if (res.op === "stop" || res.op === "start" || res.op === "restart" || res.op === "status" || res.op === "reload") {
            this.optButtonLoading = false;
            $message.info(res.msg);
            if (res.code === 200) {
              // 如果操作是启动或者停止
              if (res.op === "stop") {
                this.project = { ...this.project, status: false };
              } else if (res.op === "start") {
                this.project = { ...this.project, status: true };
              } else if (res.op === "status") {
                // 如果是 status
                this.project = { ...this.project, status: true };
              }
              if (res.op === "reload") {
                // 刷新项目信息（reload页面消息）
                this.loadProject();
              }
            } else {
              this.project = { ...this.project, status: false };
            }
            this.canReload = res.canReload;
            if (res.data) {
              this.$refs.logView.appendLine(res.data.statusMsg);
              if (res.data.msgs) {
                res.data.msgs.forEach(element => {
                  this.$refs.logView.appendLine(element);
                });
              }
              res.data.ports && this.$refs.logView.appendLine(this.$t("i18n_b6c9619081") + res.data.ports);
              res.data.pids && this.$refs.logView.appendLine(this.$t("i18n_2b04210d33") + res.data.pids.join(","));
            }
            this.$refs.logView.appendLine(res.op + " " + res.msg);
            return;
          }
        }
        this.$refs.logView.appendLine(msg.data);

        clearInterval(this.heart);
        // 创建心跳，防止掉线
        this.heart = setInterval(() => {
          this.sendMsg("heart");
          this.loadFileSize();
        }, 5000);
      };
    },
    // 发送消息
    sendMsg(op) {
      const data = {
        op: op,
        projectId: this.projectId
      };
      this.socket.send(JSON.stringify(data));
      if (op === "stop" || op === "start" || op === "restart") {
        this.optButtonLoading = true;
      }
    },

    // 加载日志文件大小
    loadFileSize() {
      const params = {
        nodeId: this.nodeId,
        id: this.projectId
      };
      getProjectLogSize(params).then(res => {
        if (res.code === 200) {
          this.project = { ...this.project, logSize: res.data.logSize };
          if (!this.logExist && res.data?.logSize) {
            this.sendMsg("showlog");
            this.logExist = true;
          }
        }
      });
    },
    // 启动
    start() {
      this.sendMsg("start");
    },
    // 重载
    reload() {
      this.sendMsg("reload");
    },
    // 重启
    restart() {
      $confirm({
        title: this.$t("i18n_c4535759ee"),
        zIndex: 1009,
        content: this.$t("i18n_989f1f2b61"),
        okText: this.$t("i18n_e83a256e4f"),
        cancelText: this.$t("i18n_625fb26b4b"),
        onOk: () => {
          this.sendMsg("restart");
        }
      });
    },
    // 停止
    stop() {
      $confirm({
        title: this.$t("i18n_c4535759ee"),
        zIndex: 1009,
        content: this.$t("i18n_010865ca50"),
        okText: this.$t("i18n_e83a256e4f"),
        cancelText: this.$t("i18n_625fb26b4b"),
        onOk: () => {
          this.sendMsg("stop");
        }
      });
    },

    // 日志备份列表
    handleLogBack() {
      // 设置显示的数据
      // this.detailData = [];
      this.lobbackVisible = true;
    },

    goFile() {
      this.$emit("goFile");
    }
  }
};
</script>
<style lang="less" scoped>
.project-console {
  background-color: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.console-log-view {
  background-color: #f0f7ff;
  border-radius: 4px;
  overflow: hidden;
}

.console-toolbar {
  padding: 12px;
  background-color: #f0f5ff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  .ant-space {
    flex-wrap: wrap;
    gap: 8px !important;
  }
}

.action-button {
  border-radius: 4px;
  padding: 0 12px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  &.disabled {
    opacity: 0.6;
  }

  .anticon {
    font-size: 14px;
  }
}

.start-button {
  background-color: #52c41a;
  border-color: #52c41a;

  &:hover:not([disabled]) {
    background-color: #73d13d;
    border-color: #73d13d;
  }
}

.stop-button,
.restart-button {
  &:hover:not([disabled]) {
    opacity: 0.85;
  }
}

.reload-button {
  background-color: #722ed1;
  border-color: #722ed1;

  &:hover:not([disabled]) {
    background-color: #9254de;
    border-color: #9254de;
  }
}

.file-button {
  background-color: #1677ff;
  border-color: #1677ff;

  &:hover:not([disabled]) {
    background-color: #4096ff;
    border-color: #4096ff;
  }
}

.log-info-button {
  display: flex;
  align-items: center;
  background-color: #f0f7ff;
  border: 1px solid #d9d9d9;

  .log-size {
    font-weight: 500;
    margin: 0 4px;
  }

  .fullscreen-icon {
    margin-left: 4px;
    color: #1677ff;
  }

  &:hover {
    color: #1677ff;
    border-color: #1677ff;
    background-color: #e6f4ff;
  }
}

.process-button {
  background-color: #fa8c16;
  border-color: #fa8c16;

  &:hover {
    background-color: #ffa940;
    border-color: #ffa940;
  }
}

.process-menu {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  border-radius: 4px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);

  .process-item {
    padding: 6px 8px;
    margin-bottom: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background-color: #f0f7ff;
    }
  }
}

.process-tag {
  margin-right: 8px;
  font-weight: 500;
}

.process-text {
  color: rgba(0, 0, 0, 0.65);
}

.edit-script-button {
  color: #1677ff;

  &:hover {
    color: #4096ff;
    background-color: rgba(24, 144, 255, 0.1);
  }
}

.library-button {
  color: rgba(0, 0, 0, 0.45);
}

.process-error {
  .error-icon {
    color: #ff4d4f;
  }

  .error-message {
    color: rgba(0, 0, 0, 0.65);
  }
}

.reload-popover {
  .reload-status {
    max-width: 300px;

    .reload-messages {
      max-height: 200px;
      overflow-y: auto;
      padding: 4px 8px;
      margin-top: 8px;
      border-radius: 4px;
      background-color: #f5f5f5;

      p {
        margin-bottom: 4px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.log-backup-modal {
  :deep(.ant-modal-content) {
    border-radius: 8px;
    overflow: hidden;

    .ant-modal-header {
      background-color: #f0f5ff;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .ant-modal-body {
      padding: 20px;
    }
  }
}

// 响应式样式
@media (max-width: 768px) {
  .console-toolbar {
    .ant-space {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
