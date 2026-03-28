<template>
  <div class="server-proxy-connection system-container modern-bg">
    <ScCard>
      <template #header>
        <div class="card-header">
          <span>代理连接</span>
          <ScTag v-if="server?.monitorSysGenServerProxyType" type="success">
            {{ server.monitorSysGenServerProxyType }}
          </ScTag>
          <ScTag v-else type="info">无代理</ScTag>
        </div>
      </template>

      <div v-if="!server?.monitorSysGenServerProxyType" class="no-proxy">
        <ScEmpty description="未配置代理服务器">
          <ScButton type="primary" @click="$emit('configure-proxy')">
            配置代理
          </ScButton>
        </ScEmpty>
      </div>

      <div v-else class="proxy-info">
        <ScDescriptions :column="2" border>
          <ScDescriptionsItem label="代理类型">
            {{ server.monitorSysGenServerProxyType }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="代理地址">
            {{ server.monitorSysGenServerProxyHost }}:{{
              server.monitorSysGenServerProxyPort
            }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="连接状态">
            <ScTag :type="proxyStatus.type">
              {{ proxyStatus.text }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="最后测试">
            {{ lastTestTime || "未测试" }}
          </ScDescriptionsItem>
        </ScDescriptions>

        <div class="proxy-actions">
          <el-button-group>
            <ScButton
              v-if="server.monitorSysGenServerProxyType === 'GUACAMOLE'"
              type="primary"
              :loading="connecting"
              @click="connectGuacamole"
            >
              <IconifyIconOnline icon="ri:remote-control-line" />
              连接 Guacamole
            </ScButton>

            <ScButton :loading="testing" @click="testProxyConnection">
              <IconifyIconOnline icon="ri:wifi-line" />
              测试连接
            </ScButton>

            <ScButton @click="$emit('configure-proxy')">
              <IconifyIconOnline icon="ri:settings-line" />
              配置代理
            </ScButton>
          </el-button-group>
        </div>

        <!-- Guacamole 连接选项 -->
        <div
          v-if="server.monitorSysGenServerProxyType === 'GUACAMOLE'"
          class="guacamole-options"
        >
          <ScDivider content-position="left">连接选项</ScDivider>

          <ScForm :model="guacamoleOptions" label-width="120px" size="small">
            <ScRow :gutter="16">
              <ScCol :span="12">
                <ScFormItem label="连接协议">
                  <ScSelect
                    v-model="guacamoleOptions.protocol"
                    style="width: 100%"
                  >
                    <ScOption label="SSH" value="ssh" />
                    <ScOption label="RDP" value="rdp" />
                    <ScOption label="VNC" value="vnc" />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem :label="portLabel">
                  <ScInputNumber
                    v-model="guacamoleOptions.port"
                    :min="1"
                    :max="65535"
                    style="width: 100%"
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>

            <ScRow :gutter="16">
              <ScCol :span="12">
                <ScFormItem
                  v-if="guacamoleOptions.protocol !== 'ssh'"
                  label="颜色深度"
                >
                  <ScSelect
                    v-model="guacamoleOptions.colorDepth"
                    style="width: 100%"
                  >
                    <ScOption label="256色" value="8" />
                    <ScOption label="高彩色(16位)" value="16" />
                    <ScOption label="真彩色(24位)" value="24" />
                    <ScOption label="真彩色(32位)" value="32" />
                  </ScSelect>
                </ScFormItem>
                <ScFormItem v-else label="字符编码">
                  <ScSelect
                    v-model="guacamoleOptions.charset"
                    style="width: 100%"
                  >
                    <ScOption label="UTF-8" value="UTF-8" />
                    <ScOption label="GBK" value="GBK" />
                    <ScOption label="GB2312" value="GB2312" />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol v-if="guacamoleOptions.protocol !== 'ssh'" :span="12">
                <!-- placeholder for layout balance -->
              </ScCol>
            </ScRow>

            <ScRow :gutter="16">
              <ScCol :span="12">
                <ScFormItem label="屏幕宽度">
                  <ScInputNumber
                    v-model="guacamoleOptions.width"
                    :min="800"
                    :max="1920"
                    style="width: 100%"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="屏幕高度">
                  <ScInputNumber
                    v-model="guacamoleOptions.height"
                    :min="600"
                    :max="1080"
                    style="width: 100%"
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>

            <ScFormItem label="启用音频">
              <ScSwitch v-model="guacamoleOptions.enableAudio" />
            </ScFormItem>

            <ScFormItem label="启用剪贴板">
              <ScSwitch v-model="guacamoleOptions.enableClipboard" />
            </ScFormItem>
          </ScForm>
        </div>

        <!-- 连接历史 -->
        <div class="connection-history">
          <ScDivider content-position="left">连接历史</ScDivider>

          <ScTable :data="connectionHistory" size="small" max-height="200">
            <ScTableColumn prop="time" label="时间" width="160" />
            <ScTableColumn prop="type" label="类型" width="80" />
            <ScTableColumn prop="status" label="状态" width="80">
              <template #default="{ row }">
                <ScTag
                  :type="row.status === 'success' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.status === "success" ? "成功" : "失败" }}
                </ScTag>
              </template>
            </ScTableColumn>
            <ScTableColumn prop="message" label="消息" />
          </ScTable>
        </div>
      </div>
    </ScCard>

    <!-- Guacamole 连接对话框 -->
    <sc-dialog
      v-model="guacamoleDialogVisible"
      title="Guacamole 远程连接"
      width="90%"
      :close-on-click-modal="false"
      destroy-on-close
      class="guacamole-dialog"
    >
      <div class="guacamole-container">
        <iframe
          v-if="guacamoleUrl"
          :src="guacamoleUrl"
          class="guacamole-iframe"
          frameborder="0"
          allowfullscreen
        />
        <div v-else class="loading-container">
          <el-loading-spinner />
          <p>正在建立连接...</p>
        </div>
      </div>

      <template #footer>
        <ScButton @click="disconnectGuacamole">断开连接</ScButton>
        <ScButton v-if="guacamoleUrl" type="primary" @click="openInNewWindow">
          在新窗口打开
        </ScButton>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { message } from "@repo/utils";
import { IconifyIconOnline as IconifyIconOnline } from "@repo/components/ReIcon";
import {
  getGuacamoleProxyUrl,
  testServerProxyConnection,
  type MonitorSysGenServer,
} from "@/api/monitor/gen/proxy";

// Props
interface Props {
  server?: MonitorSysGenServer;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "configure-proxy": [];
}>();

// 响应式数据
const testing = ref(false);
const connecting = ref(false);
const lastTestTime = ref<string>("");
const guacamoleDialogVisible = ref(false);
const guacamoleUrl = ref<string>("");

// Guacamole 连接选项
const guacamoleOptions = reactive({
  protocol: "ssh",
  port: 22,
  colorDepth: "24",
  charset: "UTF-8",
  width: 1024,
  height: 768,
  enableAudio: false,
  enableClipboard: true,
});

// 端口标签
const portLabel = computed(() => {
  switch (guacamoleOptions.protocol) {
    case "ssh":
      return "SSH端口";
    case "rdp":
      return "RDP端口";
    case "vnc":
      return "VNC端口";
    default:
      return "端口";
  }
});

// 监听协议变化，只在端口未设置时自动填充默认端口
const getDefaultPort = (protocol: string) => {
  switch (protocol) {
    case "ssh":
      return 22;
    case "rdp":
      return 3389;
    case "vnc":
      return 5900;
    default:
      return 22;
  }
};

// 初始化时设置默认端口
onMounted(() => {
  if (!guacamoleOptions.port) {
    guacamoleOptions.port = getDefaultPort(guacamoleOptions.protocol);
  }
});

// 连接历史
const connectionHistory = ref<
  Array<{
    time: string;
    type: string;
    status: "success" | "error";
    message: string;
  }>
>([]);

// 计算属性
const proxyStatus = computed(() => {
  // 这里可以根据实际的代理状态来返回
  return {
    type: "success" as const,
    text: "正常",
  };
});

// 方法
const testProxyConnection = async () => {
  if (!props.server?.id) return;

  try {
    testing.value = true;
    const res = await testServerProxyConnection(String(props.server.id));

    const historyItem = {
      time: new Date().toLocaleString(),
      type: "测试",
      status: res.code === "00000" ? ("success" as const) : ("error" as const),
      message: res.code === "00000" ? "连接正常" : res.msg || "连接失败",
    };

    connectionHistory.value.unshift(historyItem);
    lastTestTime.value = historyItem.time;

    if (res.code === "00000") {
      message("代理连接测试成功", { type: "success" });
    } else {
      message(`代理连接测试失败: ${res.msg}`, { type: "error" });
    }
  } catch (error) {
    console.error("测试代理连接失败:", error);
    message("测试代理连接失败", { type: "error" });

    connectionHistory.value.unshift({
      time: new Date().toLocaleString(),
      type: "测试",
      status: "error",
      message: "网络错误",
    });
  } finally {
    testing.value = false;
  }
};

const connectGuacamole = async () => {
  if (!props.server?.id) return;

  try {
    connecting.value = true;
    const res = await getGuacamoleProxyUrl(String(props.server.id));

    if (res.code === "00000" && res.data) {
      guacamoleUrl.value = res.data;
      guacamoleDialogVisible.value = true;

      connectionHistory.value.unshift({
        time: new Date().toLocaleString(),
        type: "Guacamole",
        status: "success",
        message: "连接建立成功",
      });

      message("Guacamole 连接建立成功", { type: "success" });
    } else {
      message(`连接失败: ${res.msg}`, { type: "error" });

      connectionHistory.value.unshift({
        time: new Date().toLocaleString(),
        type: "Guacamole",
        status: "error",
        message: res.msg || "连接失败",
      });
    }
  } catch (error) {
    console.error("连接 Guacamole 失败:", error);
    message("连接 Guacamole 失败", { type: "error" });

    connectionHistory.value.unshift({
      time: new Date().toLocaleString(),
      type: "Guacamole",
      status: "error",
      message: "网络错误",
    });
  } finally {
    connecting.value = false;
  }
};

const disconnectGuacamole = () => {
  guacamoleDialogVisible.value = false;
  guacamoleUrl.value = "";

  connectionHistory.value.unshift({
    time: new Date().toLocaleString(),
    type: "Guacamole",
    status: "success",
    message: "连接已断开",
  });
};

const openInNewWindow = () => {
  if (guacamoleUrl.value) {
    window.open(guacamoleUrl.value, "_blank");
  }
};

// 生命周期
onMounted(() => {
  // 初始化时可以加载连接历史
});
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.server-proxy-connection {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .no-proxy {
    text-align: center;
    padding: 40px 0;
  }

  .proxy-info {
    .proxy-actions {
      margin: 20px 0;
      text-align: center;
    }

    .guacamole-options {
      margin-top: 20px;
    }

    .connection-history {
      margin-top: 20px;
    }
  }
}

.guacamole-dialog {
  .guacamole-container {
    height: 70vh;
    position: relative;

    .guacamole-iframe {
      width: 100%;
      height: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--el-text-color-secondary);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
