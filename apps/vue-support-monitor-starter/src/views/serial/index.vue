<template>
  <div class="serial-monitor-container system-container modern-bg">
    <div class="header-actions flex justify-between items-center mb-4">
      <div class="flex items-center">
        <IconifyIconOnline
          icon="mdi:serial-port"
          class="mr-2 text-primary text-xl"
        />
        <h3 class="text-lg font-medium">串口监控</h3>
      </div>
      <div class="flex items-center gap-2">
        <ScButton type="primary" @click="goToManage">
          <IconifyIconOnline icon="ep:monitor" class="mr-1" />
          高级管理
        </ScButton>
        <ScButton type="primary" @click="openSerialSettings">
          <IconifyIconOnline icon="ep:setting" class="mr-1" />
          配置
        </ScButton>
        <ScButton
          type="success"
          :disabled="isConnected"
          @click="handleConnect"
        >
          <IconifyIconOnline icon="ep:connection" class="mr-1" />
          连接
        </ScButton>
        <ScButton
          type="danger"
          :disabled="!isConnected"
          @click="handleDisconnect"
        >
          <IconifyIconOnline icon="ep:close-bold" class="mr-1" />
          断开
        </ScButton>
      </div>
    </div>

    <ScCard class="serial-content">
      <div class="serial-monitor">
        <div ref="serialOutputRef" class="serial-output">
          <pre class="output-content">{{ serialOutput }}</pre>
        </div>
        <div class="serial-input mt-4">
          <div class="flex items-center">
            <ScInput
              v-model="serialInput"
              placeholder="输入发送内容"
              class="flex-1"
              @keyup.enter="handleSend"
            >
              <template #append>
                <ScSelect v-model="sendMode" style="width: 120px">
                  <ScOption label="发送文本" value="text" />
                  <ScOption label="发送HEX" value="hex" />
                </ScSelect>
              </template>
            </ScInput>
            <ScButton
              type="primary"
              class="ml-2"
              :disabled="!isConnected"
              @click="handleSend"
            >
              发送
            </ScButton>
            <ScButton class="ml-2" @click="clearOutput"> 清空 </ScButton>
          </div>
          <div class="send-options mt-2 flex items-center">
            <ScCheckbox v-model="autoScroll">自动滚动</ScCheckbox>
            <ScCheckbox v-model="addTimestamp" class="ml-4"
              >添加时间戳</ScCheckbox
            >
            <ScCheckbox v-model="addNewline" class="ml-4"
              >发送后添加换行</ScCheckbox
            >
          </div>
        </div>
      </div>
    </ScCard>

    <!-- 串口设置对话框 -->
    <sc-dialog
      v-model="settingsVisible"
      title="串口设置"
      width="500px"
      destroy-on-close
    >
      <ScForm :model="serialSettings" label-width="100px">
        <ScFormItem label="串口">
          <ScSelect
            v-model="serialSettings.monitorSerialPort"
            placeholder="选择串口"
            class="w-full"
          >
            <ScOption
              v-for="port in availablePorts"
              :key="port.path"
              :label="`${port.path} (${port.manufacturer || '未知设备'})`"
              :value="port.path"
            />
          </ScSelect>
          <div class="text-right mt-2">
            <ScButton size="small" @click="refreshPorts"
              >刷新串口列表</ScButton
            >
          </div>
        </ScFormItem>
        <ScFormItem label="波特率">
          <ScSelect
            v-model="serialSettings.monitorSerialBaudRate"
            placeholder="选择波特率"
            class="w-full"
          >
            <ScOption :value="110" label="110" />
            <ScOption :value="300" label="300" />
            <ScOption :value="1200" label="1200" />
            <ScOption :value="2400" label="2400" />
            <ScOption :value="4800" label="4800" />
            <ScOption :value="9600" label="9600" />
            <ScOption :value="14400" label="14400" />
            <ScOption :value="19200" label="19200" />
            <ScOption :value="38400" label="38400" />
            <ScOption :value="57600" label="57600" />
            <ScOption :value="115200" label="115200" />
            <ScOption :value="230400" label="230400" />
            <ScOption :value="460800" label="460800" />
            <ScOption :value="921600" label="921600" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="数据位">
          <ScSelect
            v-model="serialSettings.monitorSerialDataBits"
            placeholder="选择数据位"
            class="w-full"
          >
            <ScOption :value="5" label="5" />
            <ScOption :value="6" label="6" />
            <ScOption :value="7" label="7" />
            <ScOption :value="8" label="8" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="停止位">
          <ScSelect
            v-model="serialSettings.monitorSerialStopBits"
            placeholder="选择停止位"
            class="w-full"
          >
            <ScOption :value="1" label="1" />
            <ScOption :value="1.5" label="1.5" />
            <ScOption :value="2" label="2" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="校验位">
          <ScSelect
            v-model="serialSettings.monitorSerialParity"
            placeholder="选择校验位"
            class="w-full"
          >
            <ScOption value="none" label="无校验" />
            <ScOption value="even" label="偶校验" />
            <ScOption value="odd" label="奇校验" />
            <ScOption value="mark" label="标记校验" />
            <ScOption value="space" label="空格校验" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="流控制">
          <ScSelect
            v-model="serialSettings.monitorSerialFlowControl"
            placeholder="选择流控制"
            class="w-full"
          >
            <ScOption value="none" label="无" />
            <ScOption value="hardware" label="硬件流控" />
            <ScOption value="software" label="软件流控" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="接收格式">
          <ScSelect
            v-model="serialSettings.monitorSerialReceiveFormat"
            placeholder="选择接收格式"
            class="w-full"
          >
            <ScOption value="text" label="文本" />
            <ScOption value="hex" label="HEX" />
          </ScSelect>
        </ScFormItem>
      </ScForm>
      <template #footer>
        <span class="dialog-footer">
          <ScButton @click="settingsVisible = false">取消</ScButton>
          <ScButton type="primary" @click="saveSettings">确定</ScButton>
        </span>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from "vue";
import { message } from "@repo/utils";
import { indexedDBProxy } from "@repo/utils";
import { useRouter } from "vue-router";

const router = useRouter();

// 串口状态
const isConnected = ref(false);
const serialOutput = ref("");
const serialInput = ref("");
const serialOutputRef = ref();
const autoScroll = ref(true);
const addTimestamp = ref(true);
const addNewline = ref(true);
const sendMode = ref("text");

// 设置对话框
const settingsVisible = ref(false);
const availablePorts = ref([]);
const serialSettings = reactive({
  monitorSerialPort: "",
  monitorSerialBaudRate: 115200,
  monitorSerialDataBits: 8,
  monitorSerialStopBits: 1,
  monitorSerialParity: "none",
  monitorSerialFlowControl: "none",
  monitorSerialReceiveFormat: "text",
});

// 模拟串口连接对象
let serialConnection = null;

// 跳转到高级管理页面
const goToManage = () => {
  router.push("/serial/manage");
};

// 加载保存的设置
const loadSettings = async () => {
  try {
    //@ts-ignore
    const savedSettings = await indexedDBProxy.getItem("serialSettings");
    if (savedSettings) {
      Object.assign(serialSettings, savedSettings);
    }

    //@ts-ignore
    const savedOptions = await indexedDBProxy.getItem("serialOptions");
    if (savedOptions) {
      autoScroll.value = savedOptions.autoScroll ?? true;
      addTimestamp.value = savedOptions.addTimestamp ?? true;
      addNewline.value = savedOptions.addNewline ?? true;
      sendMode.value = savedOptions.sendMode ?? "text";
    }
  } catch (error) {
    console.error("加载串口设置失败:", error);
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    //@ts-ignore
    await indexedDBProxy.setItem("serialSettings", serialSettings);
    //@ts-ignore
    await indexedDBProxy.setItem("serialOptions", {
      autoScroll: autoScroll.value,
      addTimestamp: addTimestamp.value,
      addNewline: addNewline.value,
      sendMode: sendMode.value,
    });
    settingsVisible.value = false;
    message.success("串口设置已保存");
  } catch (error) {
    console.error("保存串口设置失败:", error);
    message.error("保存串口设置失败");
  }
};

// 打开设置对话框
const openSerialSettings = () => {
  refreshPorts();
  settingsVisible.value = true;
};

// 刷新可用串口列表
const refreshPorts = async () => {
  try {
    // 这里应该调用实际的API来获取可用串口列表
    // 模拟获取串口列表
    availablePorts.value = [
      { path: "COM1", manufacturer: "模拟串口设备" },
      { path: "COM2", manufacturer: "模拟串口设备" },
      { path: "COM3", manufacturer: "模拟串口设备" },
      { path: "/dev/ttyUSB0", manufacturer: "USB转串口" },
      { path: "/dev/ttyACM0", manufacturer: "Arduino" },
    ];
  } catch (error) {
    console.error("获取串口列表失败:", error);
    message.error("获取串口列表失败");
  }
};

// 连接串口
const handleConnect = async () => {
  if (!serialSettings.monitorSerialPort) {
    message.warning("请先选择串口");
    openSerialSettings();
    return;
  }

  try {
    // 这里应该调用实际的API来连接串口
    // 模拟连接
    await new Promise((resolve) => setTimeout(resolve, 500));
    isConnected.value = true;
    appendOutput(
      "系统",
      `已连接到串口 ${serialSettings.monitorSerialPort}，波特率 ${serialSettings.monitorSerialBaudRate}`,
    );
    message.success(`已连接到串口 ${serialSettings.monitorSerialPort}`);

    // 模拟定期接收数据
    serialConnection = setInterval(() => {
      const randomData = `接收数据: ${Math.random().toString(16).substring(2, 10)}`;
      appendOutput("接收", randomData);
    }, 3000);
  } catch (error) {
    console.error("连接串口失败:", error);
    message.error("连接串口失败");
  }
};

// 断开串口
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

  if (!serialInput.value) {
    message.warning("发送内容不能为空");
    return;
  }

  try {
    // 这里应该调用实际的API来发送数据
    // 模拟发送
    let dataToSend = serialInput.value;
    if (addNewline.value) {
      dataToSend += "\n";
    }

    appendOutput("发送", dataToSend);
    serialInput.value = "";
  } catch (error) {
    console.error("发送数据失败:", error);
    message.error("发送数据失败");
  }
};

// 添加输出内容
const appendOutput = (type, data) => {
  const timestamp = addTimestamp.value
    ? `[${new Date().toLocaleTimeString()}] `
    : "";
  const prefix = `${timestamp}[${type}] `;
  serialOutput.value += prefix + data + "\n";

  if (autoScroll.value) {
    nextTick(() => {
      if (serialOutputRef.value) {
        serialOutputRef.value.scrollTop = serialOutputRef.value.scrollHeight;
      }
    });
  }
};

// 清空输出
const clearOutput = () => {
  serialOutput.value = "";
};

// 监听组件卸载，断开连接
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
  loadSettings();
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
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.serial-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.serial-monitor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.serial-output {
  flex: 1;
  background-color: #1e1e1e;
  color: #f0f0f0;
  padding: 12px;
  border-radius: 4px;
  overflow-y: auto;
  min-height: 300px;
  max-height: calc(100vh - 300px);
  font-family: "Courier New", monospace;

  .output-content {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.serial-input {
  margin-top: 16px;
}

.send-options {
  margin-top: 8px;
  display: flex;
  align-items: center;
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
