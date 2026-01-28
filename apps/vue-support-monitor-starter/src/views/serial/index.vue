<template>
  <div class="serial-monitor-container system-container modern-bg">
    <div class="header-actions flex justify-between items-center mb-4">
      <div class="flex items-center">
        <IconifyIconOnline icon="mdi:serial-port" class="mr-2 text-primary text-xl" />
        <h3 class="text-lg font-medium">串口监控</h3>
      </div>
      <div class="flex items-center gap-2">
        <el-button type="primary" @click="goToManage">
          <IconifyIconOnline icon="ep:monitor" class="mr-1" />
          高级管理
        </el-button>
        <el-button type="primary" @click="openSerialSettings">
          <IconifyIconOnline icon="ep:setting" class="mr-1" />
          配置
        </el-button>
        <el-button type="success" @click="handleConnect" :disabled="isConnected">
          <IconifyIconOnline icon="ep:connection" class="mr-1" />
          连接
        </el-button>
        <el-button type="danger" @click="handleDisconnect" :disabled="!isConnected">
          <IconifyIconOnline icon="ep:close-bold" class="mr-1" />
          断开
        </el-button>
      </div>
    </div>

    <el-card class="serial-content">
      <div class="serial-monitor">
        <div class="serial-output" ref="serialOutputRef">
          <pre class="output-content">{{ serialOutput }}</pre>
        </div>
        <div class="serial-input mt-4">
          <div class="flex items-center">
            <el-input
              v-model="serialInput"
              placeholder="输入发送内容"
              @keyup.enter="handleSend"
              class="flex-1"
            >
              <template #append>
                <el-select v-model="sendMode" style="width: 120px">
                  <el-option label="发送文本" value="text" />
                  <el-option label="发送HEX" value="hex" />
                </el-select>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSend" class="ml-2" :disabled="!isConnected">
              发送
            </el-button>
            <el-button @click="clearOutput" class="ml-2">
              清空
            </el-button>
          </div>
          <div class="send-options mt-2 flex items-center">
            <el-checkbox v-model="autoScroll">自动滚动</el-checkbox>
            <el-checkbox v-model="addTimestamp" class="ml-4">添加时间戳</el-checkbox>
            <el-checkbox v-model="addNewline" class="ml-4">发送后添加换行</el-checkbox>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 串口设置对话框 -->
    <sc-dialog
      v-model="settingsVisible"
      title="串口设置"
      width="500px"
      destroy-on-close
    >
      <el-form :model="serialSettings" label-width="100px">
        <el-form-item label="串口">
          <el-select v-model="serialSettings.monitorSerialPort" placeholder="选择串口" class="w-full">
            <el-option
              v-for="port in availablePorts"
              :key="port.path"
              :label="`${port.path} (${port.manufacturer || '未知设备'})`"
              :value="port.path"
            />
          </el-select>
          <div class="text-right mt-2">
            <el-button size="small" @click="refreshPorts">刷新串口列表</el-button>
          </div>
        </el-form-item>
        <el-form-item label="波特率">
          <el-select v-model="serialSettings.monitorSerialBaudRate" placeholder="选择波特率" class="w-full">
            <el-option :value="110" label="110" />
            <el-option :value="300" label="300" />
            <el-option :value="1200" label="1200" />
            <el-option :value="2400" label="2400" />
            <el-option :value="4800" label="4800" />
            <el-option :value="9600" label="9600" />
            <el-option :value="14400" label="14400" />
            <el-option :value="19200" label="19200" />
            <el-option :value="38400" label="38400" />
            <el-option :value="57600" label="57600" />
            <el-option :value="115200" label="115200" />
            <el-option :value="230400" label="230400" />
            <el-option :value="460800" label="460800" />
            <el-option :value="921600" label="921600" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据位">
          <el-select v-model="serialSettings.monitorSerialDataBits" placeholder="选择数据位" class="w-full">
            <el-option :value="5" label="5" />
            <el-option :value="6" label="6" />
            <el-option :value="7" label="7" />
            <el-option :value="8" label="8" />
          </el-select>
        </el-form-item>
        <el-form-item label="停止位">
          <el-select v-model="serialSettings.monitorSerialStopBits" placeholder="选择停止位" class="w-full">
            <el-option :value="1" label="1" />
            <el-option :value="1.5" label="1.5" />
            <el-option :value="2" label="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="校验位">
          <el-select v-model="serialSettings.monitorSerialParity" placeholder="选择校验位" class="w-full">
            <el-option value="none" label="无校验" />
            <el-option value="even" label="偶校验" />
            <el-option value="odd" label="奇校验" />
            <el-option value="mark" label="标记校验" />
            <el-option value="space" label="空格校验" />
          </el-select>
        </el-form-item>
        <el-form-item label="流控制">
          <el-select v-model="serialSettings.monitorSerialFlowControl" placeholder="选择流控制" class="w-full">
            <el-option value="none" label="无" />
            <el-option value="hardware" label="硬件流控" />
            <el-option value="software" label="软件流控" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收格式">
          <el-select v-model="serialSettings.monitorSerialReceiveFormat" placeholder="选择接收格式" class="w-full">
            <el-option value="text" label="文本" />
            <el-option value="hex" label="HEX" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">确定</el-button>
        </span>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { message } from "@repo/utils";
import { indexedDBProxy } from '@repo/utils';
import { useRouter } from 'vue-router';

const router = useRouter();

// 串口状态
const isConnected = ref(false);
const serialOutput = ref('');
const serialInput = ref('');
const serialOutputRef = ref();
const autoScroll = ref(true);
const addTimestamp = ref(true);
const addNewline = ref(true);
const sendMode = ref('text');

// 设置对话框
const settingsVisible = ref(false);
const availablePorts = ref([]);
const serialSettings = reactive({
  monitorSerialPort: '',
  monitorSerialBaudRate: 115200,
  monitorSerialDataBits: 8,
  monitorSerialStopBits: 1,
  monitorSerialParity: 'none',
  monitorSerialFlowControl: 'none',
  monitorSerialReceiveFormat: 'text'
});

// 模拟串口连接对象
let serialConnection = null;

// 跳转到高级管理页面
const goToManage = () => {
  router.push('/serial/manage');
};

// 加载保存的设置
const loadSettings = async () => {
  try {
    //@ts-ignore
    const savedSettings = await indexedDBProxy.getItem('serialSettings');
    if (savedSettings) {
      Object.assign(serialSettings, savedSettings);
    }
    
    //@ts-ignore
    const savedOptions = await indexedDBProxy.getItem('serialOptions');
    if (savedOptions) {
      autoScroll.value = savedOptions.autoScroll ?? true;
      addTimestamp.value = savedOptions.addTimestamp ?? true;
      addNewline.value = savedOptions.addNewline ?? true;
      sendMode.value = savedOptions.sendMode ?? 'text';
    }
  } catch (error) {
    console.error('加载串口设置失败:', error);
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    //@ts-ignore
    await indexedDBProxy.setItem('serialSettings', serialSettings);
    //@ts-ignore
    await indexedDBProxy.setItem('serialOptions', {
      autoScroll: autoScroll.value,
      addTimestamp: addTimestamp.value,
      addNewline: addNewline.value,
      sendMode: sendMode.value
    });
    settingsVisible.value = false;
    message.success('串口设置已保存');
  } catch (error) {
    console.error('保存串口设置失败:', error);
    message.error('保存串口设置失败');
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
      { path: 'COM1', manufacturer: '模拟串口设备' },
      { path: 'COM2', manufacturer: '模拟串口设备' },
      { path: 'COM3', manufacturer: '模拟串口设备' },
      { path: '/dev/ttyUSB0', manufacturer: 'USB转串口' },
      { path: '/dev/ttyACM0', manufacturer: 'Arduino' }
    ];
  } catch (error) {
    console.error('获取串口列表失败:', error);
    message.error('获取串口列表失败');
  }
};

// 连接串口
const handleConnect = async () => {
  if (!serialSettings.monitorSerialPort) {
    message.warning('请先选择串口');
    openSerialSettings();
    return;
  }

  try {
    // 这里应该调用实际的API来连接串口
    // 模拟连接
    await new Promise(resolve => setTimeout(resolve, 500));
    isConnected.value = true;
    appendOutput('系统', `已连接到串口 ${serialSettings.monitorSerialPort}，波特率 ${serialSettings.monitorSerialBaudRate}`);
    message.success(`已连接到串口 ${serialSettings.monitorSerialPort}`);
    
    // 模拟定期接收数据
    serialConnection = setInterval(() => {
      const randomData = `接收数据: ${Math.random().toString(16).substring(2, 10)}`;
      appendOutput('接收', randomData);
    }, 3000);
  } catch (error) {
    console.error('连接串口失败:', error);
    message.error('连接串口失败');
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
    
    await new Promise(resolve => setTimeout(resolve, 300));
    isConnected.value = false;
    appendOutput('系统', `已断开串口连接`);
    message.success('已断开串口连接');
  } catch (error) {
    console.error('断开串口失败:', error);
    message.error('断开串口失败');
  }
};

// 发送数据
const handleSend = () => {
  if (!isConnected.value) {
    message.warning('请先连接串口');
    return;
  }

  if (!serialInput.value) {
    message.warning('发送内容不能为空');
    return;
  }

  try {
    // 这里应该调用实际的API来发送数据
    // 模拟发送
    let dataToSend = serialInput.value;
    if (addNewline.value) {
      dataToSend += '\n';
    }
    
    appendOutput('发送', dataToSend);
    serialInput.value = '';
  } catch (error) {
    console.error('发送数据失败:', error);
    message.error('发送数据失败');
  }
};

// 添加输出内容
const appendOutput = (type, data) => {
  const timestamp = addTimestamp.value ? `[${new Date().toLocaleTimeString()}] ` : '';
  const prefix = `${timestamp}[${type}] `;
  serialOutput.value += prefix + data + '\n';
  
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
  serialOutput.value = '';
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
  font-family: 'Courier New', monospace;
  
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