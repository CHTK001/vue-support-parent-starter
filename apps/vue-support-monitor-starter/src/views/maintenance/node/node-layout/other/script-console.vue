<template>
  <div>
    <!-- <div ref="filter" class="filter">
          <a-space> </a-space>
        </div> -->
    <!-- console -->
    <div>
      <log-view1 :ref="`logView`" height="calc(100vh - 140px)">
        <template #before>
          <a-space>
            <a-button size="small" :loading="btnLoading" :disabled="scriptStatus !== 0" type="primary" @click="start">{{ $t("i18n_1a6aa24e76") }}</a-button>
            <a-button size="small" :loading="btnLoading" :disabled="scriptStatus !== 1" type="primary" @click="stop">{{ $t("i18n_095e938e2a") }}</a-button>
          </a-space>
        </template>
      </log-view1>
    </div>

    <!--运行  -->
    <CustomModal v-if="editArgs" v-model:open="editArgs" destroy-on-close :confirm-loading="confirmLoading" :title="$t('i18n_43886d7ac3')" :mask-closable="false" @ok="startExecution">
      <a-form ref="ruleForm" :model="temp" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item :label="$t('i18n_abba4775e1')" :help="`${commandParams.length ? $t('i18n_916cde39c4') : ''}`">
          <a-space direction="vertical" style="width: 100%">
            <a-row v-for="(item, index) in commandParams" :key="item.key">
              <a-col :span="22">
                <a-input
                  v-model:value="item.value"
                  :addon-before="`${$t('i18n_3d0a2df9ec')}${index + 1}${$t('i18n_fe7509e0ed')}`"
                  :placeholder="`${$t('i18n_3d0a2df9ec')}${$t('i18n_fe7509e0ed')} ${item.desc ? ',' + item.desc : ''}`"
                >
                  <template #suffix>
                    <a-tooltip v-if="item.desc" :title="item.desc">
                      <InfoCircleOutlined style="color: rgba(0, 0, 0, 0.45)" />
                    </a-tooltip>
                  </template>
                </a-input>
              </a-col>

              <a-col v-if="!item.desc" :span="2">
                <a-row type="flex" justify="center" align="middle">
                  <a-col>
                    <MinusCircleOutlined style="color: #ff0000" @click="() => commandParams.splice(index, 1)" />
                  </a-col>
                </a-row>
              </a-col>
            </a-row>
            <a-button type="primary" size="small" @click="() => commandParams.push({})">{{ $t("i18n_4c0eead6ff") }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </CustomModal>
  </div>
</template>
<script>
import { getWebSocketUrl } from "@/api/config";
import LogView1 from "@/components/logView/index2.vue";
// 导入全局方法
import { $notification, $message } from "@/components/AntdConfig";

export default {
  components: {
    LogView1
  },
  props: {
    nodeId: { type: String, default: "" },
    scriptId: {
      type: String,
      default: ""
    },
    id: {
      type: String,
      default: ""
    },
    defArgs: { type: String, default: "" }
  },
  data() {
    return {
      project: {},
      socket: null,
      heart: null,
      // script 状态 {0: 未运行, 1: 运行中}
      scriptStatus: 0,
      editArgs: false,
      temp: {
        // args: "",
      },
      commandParams: [],
      // 日志内容
      logContext: "",
      btnLoading: true,
      confirmLoading: false
    };
  },
  computed: {
    socketUrl() {
      return getWebSocketUrl("/socket/node/script_run", `id=${this.id}&nodeId=${this.nodeId}&type=nodeScript`);
    }
  },
  mounted() {
    this.initWebSocket();
    if (typeof this.defArgs === "string" && this.defArgs) {
      this.commandParams = JSON.parse(this.defArgs);
    } else {
      this.commandParams = [];
    }
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
    // 初始化
    initWebSocket() {
      this.logContext = "";
      if (!this.socket || this.socket.readyState !== this.socket.OPEN || this.socket.readyState !== this.socket.CONNECTING) {
        this.socket = new WebSocket(this.socketUrl);
      }
      // 连接成功后
      this.socket.onopen = () => {
        // this.logContext = "connect success......\r\n";
        this.btnLoading = false;
      };
      this.socket.onerror = err => {
        console.error(err);
        $notification.error({
          message: `web socket ${this.$t("i18n_7030ff6470")},${this.$t("i18n_226a6f9cdd")}`
        });
        clearInterval(this.heart);
        this.btnLoading = true;
      };
      this.socket.onclose = err => {
        //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
        console.error(err);
        clearInterval(this.heart);
        this.btnLoading = true;
        $message.warning(this.$t("i18n_5fafcadc2d"));
      };
      this.socket.onmessage = msg => {
        if (msg.data.indexOf("JPOM_MSG") > -1 && msg.data.indexOf("op") > -1) {
          const res = JSON.parse(msg.data);
          if (res.code === 200) {
            $notification.success({
              message: res.msg
            });
            // 如果操作是启动或者停止
            if (res.op === "stop") {
              this.scriptStatus = 0;
            }
            if (res.op === "start") {
              this.scriptStatus = 1;
            }
            if (res.executeId) {
              this.temp = { ...this.temp, executeId: res.executeId };
            }
          } else {
            $notification.error({
              message: res.msg
            });
            this.scriptStatus = 0;
          }
          return;
        }
        // this.logContext += `${msg.data}\r\n`;
        this.$refs.logView.appendLine(msg.data);
        clearInterval(this.heart);
        // 创建心跳，防止掉线
        this.heart = setInterval(() => {
          this.sendMsg("heart");
        }, 5000);
      };
    },
    startExecution() {
      this.editArgs = false;
      this.sendMsg("start");
      this.confirmLoading = false;
    },
    // 发送消息
    sendMsg(op) {
      const data = {
        op: op,
        scriptId: this.scriptId,
        args: JSON.stringify(this.commandParams),
        executeId: this.temp.executeId
      };
      this.socket.send(JSON.stringify(data));
    },
    // 启动
    start() {
      this.editArgs = true;
    },
    // 停止
    stop() {
      this.sendMsg("stop");
    }
  }
};
</script>
<style scoped>
.script-console-layout {
  padding: 0;
  margin: 0;
}
.filter {
  margin: 0 0 10px;
}
</style>
