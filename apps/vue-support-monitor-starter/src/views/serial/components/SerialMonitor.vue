<template>
  <div class="serial-monitor-container system-container modern-bg">
    <!-- 工具栏 -->
    <div class="serial-toolbar flex justify-between items-center p-3 border-b border-[var(--el-border-color-light)]">
      <div class="serial-info flex items-center">
        <el-tag :type="isConnected ? 'success' : 'info'" class="mr-2">
          {{ isConnected ? "已连接" : "未连接" }}
        </el-tag>
        <span v-if="serialData.monitorSerialName" class="serial-name text-sm"> {{ serialData.monitorSerialName }} ({{ serialData.monitorSerialPort || "COM1" }}) </span>
        <span v-else class="text-[var(--el-text-color-placeholder)] text-sm">未选择串口</span>
      </div>
      <div class="serial-actions flex gap-2">
        <el-button-group>
          <el-button :type="isConnected ? 'danger' : 'primary'" size="small" :disabled="!serialData.monitorSerialId || connecting" @click="toggleConnection">
            <IconifyIconOnline :icon="isConnected ? 'ep:close-bold' : 'ep:connection'" class="mr-1" />
            {{ isConnected ? "断开" : "连接" }}
          </el-button>
          <el-button type="primary" size="small" @click="clearOutput">
            <IconifyIconOnline icon="ep:delete" class="mr-1" />
            清空
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="serial-content flex-1 flex flex-col">
      <!-- 输出区域 -->
      <div class="serial-output flex-1 p-3 overflow-auto" ref="outputRef">
        <div v-if="!serialData.monitorSerialId" class="serial-empty flex flex-col items-center justify-center h-full">
          <IconifyIconOnline icon="mdi:serial-port" class="text-5xl text-[var(--el-text-color-disabled)] mb-4" />
          <p class="text-[var(--el-text-color-placeholder)]">请从左侧列表选择一个串口</p>
        </div>
        <pre v-else class="output-content" :class="{ 'text-[var(--el-text-color-placeholder)]': !isConnected }">{{ outputText }}</pre>
      </div>

      <!-- 输入区域 -->
      <div class="serial-input p-3 border-t border-[var(--el-border-color-light)]">
        <div class="flex items-center">
          <el-input v-model="inputText" placeholder="输入发送内容" :disabled="!isConnected" @keyup.enter="handleSend" class="flex-1">
            <template #append>
              <el-select v-model="sendMode" style="width: 120px" :disabled="!isConnected">
                <el-option label="发送文本" value="text" />
                <el-option label="发送HEX" value="hex" />
              </el-select>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSend" class="ml-2" :disabled="!isConnected"> 发送 </el-button>
        </div>
        <div class="send-options mt-2 flex items-center">
          <el-checkbox v-model="autoScroll" :disabled="!isConnected">自动滚动</el-checkbox>
          <el-checkbox v-model="addTimestamp" class="ml-4" :disabled="!isConnected">添加时间戳</el-checkbox>
          <el-checkbox v-model="addNewline" class="ml-4" :disabled="!isConnected">发送后添加换行</el-checkbox>
        </div>

        <!-- 快捷命令 -->
        <div class="quick-commands mt-3" v-if="quickCommands.length > 0">
          <p class="text-sm text-[var(--el-text-color-regular)] mb-2">快捷命令:</p>
          <div class="flex flex-wrap gap-2">
            <el-button v-for="(cmd, index) in quickCommands" :key="index" size="small" :disabled="!isConnected" @click="sendQuickCommand(cmd)">
              {{ cmd.name }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { indexedDBProxy, message } from "@repo/utils";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps({
  serialData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["connect", "disconnect", "send"]);

// 状态
const isConnected = ref(false);
const connecting = ref(false);
const outputText = ref("");
const inputText = ref("");
const outputRef = ref(null);
const autoScroll = ref(true);
const addTimestamp = ref(true);
const addNewline = ref(true);
const sendMode = ref("text");
const quickCommands = ref([]);

// 模拟连接对象
let serialConnection = null;

// 监听串口数据变化
watch(
  () => props.serialData,
  async (newData) => {
    if (newData && newData.monitorSerialId) {
      // 如果已连接，先断开连接
      if (isConnected.value) {
        await handleDisconnect();
      }

      // 加载快捷命令
      loadQuickCommands();

      // 清空输出
      outputText.value = `准备连接到串口: ${newData.monitorSerialPort || "COM1"}\n`;
    }
  },
  { deep: true }
);

// 加载快捷命令
const loadQuickCommands = async () => {
  try {
    // 从配置中加载快捷命令
    const config = await indexedDBProxy.getItem("serialGlobalConfig");
    if (config && config.monitorSerialCommandPresets) {
      quickCommands.value = config.monitorSerialCommandPresets;
    } else {
      quickCommands.value = [];
    }
  } catch (error) {
    console.error("加载快捷命令失败:", error);
    quickCommands.value = [];
  }
};

// 切换连接状态
const toggleConnection = () => {
  if (isConnected.value) {
    handleDisconnect();
  } else {
    handleConnect();
  }
};

// 连接串口
const handleConnect = async () => {
  if (!props.serialData.monitorSerialId) {
    message.warning("请先选择串口");
    return;
  }

  try {
    connecting.value = true;

    // 这里应该调用实际的API来连接串口
    // 模拟连接
    await new Promise((resolve) => setTimeout(resolve, 800));

    isConnected.value = true;
    appendOutput("系统", `已连接到串口 ${props.serialData.monitorSerialPort}，波特率 ${props.serialData.monitorSerialBaudRate}`);

    // 发送连接事件
    emit("connect", props.serialData);

    // 模拟定期接收数据
    serialConnection = setInterval(() => {
      const randomData = `接收数据: ${Math.random().toString(16).substring(2, 10)}`;
      appendOutput("接收", randomData);
    }, 3000);

    message.success(`已连接到串口 ${props.serialData.monitorSerialPort}`);
  } catch (error) {
    console.error("连接串口失败:", error);
    message.error("连接串口失败");
  } finally {
    connecting.value = false;
  }
};

// 断开连接
const handleDisconnect = async () => {
  try {
    // 这里应该调用实际的API来断开串口
    // 模拟断开连接
    if (serialConnection) {
      clearInterval(serialConnection);
      serialConnection = null;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    isConnected.value = false;
    appendOutput("系统", `已断开串口连接`);

    // 发送断开连接事件
    emit("disconnect", props.serialData);

    message.success("已断开串口连接");
  } catch (error) {
    console.error("断开串口失败:", error);
    message.error("断开串口失败");
  }
};

// 发送数据
const handleSend = () => {
  if (!isConnected.value) {
    message.warning("请先连接串口");
    return;
  }

  if (!inputText.value) {
    message.warning("发送内容不能为空");
    return;
  }

  sendData(inputText.value, sendMode.value);
  inputText.value = "";
};

// 发送快捷命令
const sendQuickCommand = (command) => {
  if (!isConnected.value) {
    message.warning("请先连接串口");
    return;
  }

  sendData(command.command, command.type, command.addNewline);
};

// 发送数据
const sendData = (data, mode, forceNewline = null) => {
  try {
    // 这里应该调用实际的API来发送数据
    // 模拟发送
    let dataToSend = data;
    const useNewline = forceNewline !== null ? forceNewline : addNewline.value;

    if (useNewline) {
      dataToSend += "\n";
    }

    appendOutput("发送", dataToSend);

    // 发送数据事件
    emit("send", {
      data: dataToSend,
      mode: mode,
      serialData: props.serialData,
    });
  } catch (error) {
    console.error("发送数据失败:", error);
    message.error("发送数据失败");
  }
};

// 添加输出内容
const appendOutput = (type, data) => {
  const timestamp = addTimestamp.value ? `[${new Date().toLocaleTimeString()}] ` : "";
  const prefix = `${timestamp}[${type}] `;
  outputText.value += prefix + data + "\n";

  if (autoScroll.value) {
    scrollToBottom();
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  });
};

// 清空输出
const clearOutput = () => {
  outputText.value = "";
};

// 组件卸载时断开连接
onUnmounted(() => {
  if (serialConnection) {
    clearInterval(serialConnection);
    serialConnection = null;
  }
  if (isConnected.value) {
    handleDisconnect();
  }
});

// 组件挂载时加载设置
onMounted(() => {
  loadQuickCommands();
});
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
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


.serial-monitor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.serial-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.serial-output {
  flex: 1;
  background-color: #1e1e1e;
  color: #f0f0f0;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  min-height: 100px;

  .output-content {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.serial-empty {
  height: 100%;
}

.serial-input {
  background-color: var(--el-bg-color);
}

.send-options {
  display: flex;
  align-items: center;
}

.quick-commands {
  border-top: 1px dashed var(--el-border-color-light);
  padding-top: 8px;
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
