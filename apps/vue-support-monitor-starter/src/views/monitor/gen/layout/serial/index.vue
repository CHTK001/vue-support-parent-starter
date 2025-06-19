<template>
  <div class="serial-container h-full">
    <!-- 顶部状态栏 -->
    <div class="status-bar mb-4">
      <div class="status-info flex items-center justify-between">
        <div class="connection-status flex items-center">
          <div class="status-indicator" :class="{ 'connected': connected, 'disconnected': !connected }"></div>
          <span class="status-text ml-2">
            {{ connected ? `已连接 - ${currentSerial?.monitorSysGenSerialName || '未知设备'}` : '未连接' }}
          </span>
          <el-tag v-if="connected" type="success" size="small" class="ml-2">
            {{ settings.baudRate }} bps
          </el-tag>
        </div>
        <div class="data-stats flex items-center gap-4">
          <div class="stat-item">
            <span class="stat-label">Socket:</span>
            <span class="stat-value" :class="{ 'text-green-500': socketConnected, 'text-red-500': !socketConnected }">
              {{ socketConnected ? '已连接' : '未连接' }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">发送:</span>
            <span class="stat-value">{{ stats.sent }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">接收:</span>
            <span class="stat-value">{{ stats.received }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">错误:</span>
            <span class="stat-value text-red-500">{{ stats.errors }}</span>
          </div>
          <div v-if="reconnectAttempts > 0" class="stat-item">
            <span class="stat-label">重连:</span>
            <span class="stat-value text-orange-500">{{ reconnectAttempts }}/{{ maxReconnectAttempts }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content flex gap-4 h-full">
      <!-- 左侧串口列表 -->
      <div class="serial-list-panel w-80 flex-shrink-0">
        <el-card class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <IconifyIconOnline icon="mdi:view-list" class="mr-2" />
                <span>串口设备</span>
              </div>
              <div class="flex gap-2">
                <el-button size="small" @click="refreshSerialList" :loading="loading">
                  <IconifyIconOnline icon="ep:refresh" />
                </el-button>
                <el-button size="small" type="primary" @click="showAddDialog = true">
                  <IconifyIconOnline icon="ep:plus" />
                </el-button>
              </div>
            </div>
          </template>

          <div class="serial-list">
            <div v-if="serialList.length === 0" class="empty-state text-center py-8">
              <IconifyIconOnline icon="ep:box" class="text-4xl text-gray-400 mb-2" />
              <p class="text-gray-500">暂无串口设备</p>
              <el-button size="small" type="primary" @click="showAddDialog = true" class="mt-2">
                添加设备
              </el-button>
            </div>

            <div v-for="serial in serialList" :key="serial.monitorSysGenSerialId"
                 class="serial-item"
                 :class="{ 'active': currentSerial?.monitorSysGenSerialId === serial.monitorSysGenSerialId }"
                 @click="selectSerial(serial)">
              <div class="serial-item-header flex items-center justify-between">
                <div class="serial-info flex items-center">
                  <div class="status-dot" :class="{ 'online': serial.monitorSysGenSerialStatus === 1 }"></div>
                  <div class="ml-2">
                    <div class="serial-name font-medium">{{ serial.monitorSysGenSerialName }}</div>
                    <div class="serial-port text-sm text-gray-500">{{ serial.monitorSysGenSerialPort }}</div>
                  </div>
                </div>
                <el-dropdown @command="handleSerialAction" trigger="click">
                  <el-button size="small" text>
                    <IconifyIconOnline icon="ep:more" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="`connect_${serial.monitorSysGenSerialId}`"
                                        :disabled="serial.monitorSysGenSerialStatus === 1">
                        <IconifyIconOnline icon="ep:connection" class="mr-1" />
                        连接
                      </el-dropdown-item>
                      <el-dropdown-item :command="`disconnect_${serial.monitorSysGenSerialId}`"
                                        :disabled="serial.monitorSysGenSerialStatus !== 1">
                        <IconifyIconOnline icon="ep:close" class="mr-1" />
                        断开
                      </el-dropdown-item>
                      <el-dropdown-item :command="`edit_${serial.monitorSysGenSerialId}`">
                        <IconifyIconOnline icon="ep:edit" class="mr-1" />
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item :command="`delete_${serial.monitorSysGenSerialId}`" divided>
                        <IconifyIconOnline icon="ep:delete" class="mr-1 text-red-500" />
                        <span class="text-red-500">删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="serial-config text-xs text-gray-400 mt-1">
                {{ serial.monitorSysGenSerialBaudRate }}bps, {{ serial.monitorSysGenSerialDataBits }}N{{ serial.monitorSysGenSerialStopBits }}
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧监控面板 -->
      <div class="monitor-panel flex-1 flex flex-col">
        <el-card class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <IconifyIconOnline icon="mdi:monitor" class="mr-2" />
                <span>串口监控</span>
                <el-tag v-if="currentSerial" size="small" class="ml-2">
                  {{ currentSerial.monitorSysGenSerialName }}
                </el-tag>
              </div>
              <div class="flex items-center gap-2">
                <el-button-group size="small">
                  <el-button @click="toggleAutoScroll" :type="autoScroll ? 'primary' : 'default'">
                    <IconifyIconOnline icon="ep:sort-down" class="mr-1" />
                    自动滚动
                  </el-button>
                  <el-button @click="toggleTimestamp" :type="showTimestamp ? 'primary' : 'default'">
                    <IconifyIconOnline icon="ep:timer" class="mr-1" />
                    时间戳
                  </el-button>
                  <el-button @click="toggleHexMode" :type="hexMode ? 'primary' : 'default'">
                    <IconifyIconOnline icon="ep:document-copy" class="mr-1" />
                    HEX
                  </el-button>
                </el-button-group>
                <el-button size="small" @click="clearLogs">
                  <IconifyIconOnline icon="ep:delete" class="mr-1" />
                  清空
                </el-button>
                <el-button size="small" @click="exportLogs">
                  <IconifyIconOnline icon="ep:download" class="mr-1" />
                  导出
                </el-button>
              </div>
            </div>
          </template>

          <div class="monitor-content h-full flex flex-col">
            <!-- 数据显示区域 -->
            <div ref="logContainer" class="log-display flex-1 overflow-auto bg-gray-900 text-green-400 p-4 rounded font-mono text-sm leading-relaxed">
              <div v-if="logs.length === 0" class="empty-logs text-center py-8">
                <IconifyIconOnline icon="ep:chat-dot-round" class="text-4xl text-gray-600 mb-2" />
                <p class="text-gray-500">等待数据传输...</p>
              </div>
              <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="log.type">
                <span v-if="showTimestamp" class="timestamp">{{ log.timestamp }}</span>
                <span class="direction">{{ log.direction }}</span>
                <span class="content">{{ formatLogContent(log.content) }}</span>
              </div>
            </div>

            <!-- 发送区域 -->
            <div class="send-panel mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <div class="send-controls mb-3 flex items-center gap-4">
                <el-radio-group v-model="sendMode" size="small">
                  <el-radio-button value="text">文本</el-radio-button>
                  <el-radio-button value="hex">HEX</el-radio-button>
                </el-radio-group>
                <el-checkbox v-model="sendWithNewline" size="small">发送后换行</el-checkbox>
                <el-checkbox v-model="sendWithTimestamp" size="small">添加时间戳</el-checkbox>
              </div>

              <div class="send-input flex gap-2">
                <el-input
                  v-model="messageInput"
                  :placeholder="sendMode === 'hex' ? '输入十六进制数据 (如: FF 00 01)' : '输入要发送的文本'"
                  class="flex-1"
                  @keyup.enter="handleSend"
                  :disabled="!connected"
                />
                <el-button type="primary" @click="handleSend" :disabled="!connected || !messageInput.trim()">
                  <IconifyIconOnline icon="ep:promotion" class="mr-1" />
                  发送
                </el-button>
              </div>

              <!-- 快捷命令 -->
              <div class="quick-commands mt-3">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm text-gray-600">快捷命令:</span>
                  <el-button-group size="small">
                    <el-button @click="sendQuickCommand('AT')" :disabled="!connected">AT</el-button>
                    <el-button @click="sendQuickCommand('AT+GMR')" :disabled="!connected">版本</el-button>
                    <el-button @click="sendQuickCommand('AT+RST')" :disabled="!connected">重启</el-button>
                    <el-button @click="sendQuickCommand('\\r\\n')" :disabled="!connected">回车换行</el-button>
                  </el-button-group>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 添加串口设备对话框 -->
    <el-dialog v-model="showAddDialog" title="添加串口设备" width="600px" destroy-on-close>
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="设备名称" prop="monitorSysGenSerialName">
          <el-input v-model="formData.monitorSysGenSerialName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="串口端口" prop="monitorSysGenSerialPort">
          <div class="flex gap-2 w-full">
            <el-select
              v-model="formData.monitorSysGenSerialPort"
              placeholder="选择串口端口"
              class="flex-1"
              filterable
              allow-create
              :loading="loadingPorts"
              @focus="loadAvailablePorts"
            >
              <el-option
                v-for="port in availablePorts"
                :key="port"
                :label="port"
                :value="port"
              />
            </el-select>
            <el-button
              size="default"
              @click="loadAvailablePorts"
              :loading="loadingPorts"
              title="刷新可用串口"
            >
              <IconifyIconOnline icon="ep:refresh" />
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="波特率" prop="monitorSysGenSerialBaudRate">
          <el-select v-model="formData.monitorSysGenSerialBaudRate" placeholder="选择波特率" class="w-full">
            <el-option v-for="rate in baudRates" :key="rate" :label="rate" :value="rate" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据位" prop="monitorSysGenSerialDataBits">
          <el-select v-model="formData.monitorSysGenSerialDataBits" placeholder="选择数据位" class="w-full">
            <el-option v-for="bit in dataBits" :key="bit" :label="bit" :value="bit" />
          </el-select>
        </el-form-item>
        <el-form-item label="停止位" prop="monitorSysGenSerialStopBits">
          <el-select v-model="formData.monitorSysGenSerialStopBits" placeholder="选择停止位" class="w-full">
            <el-option v-for="bit in stopBits" :key="bit" :label="bit" :value="bit" />
          </el-select>
        </el-form-item>
        <el-form-item label="校验位" prop="monitorSysGenSerialParity">
          <el-select v-model="formData.monitorSysGenSerialParity" placeholder="选择校验位" class="w-full">
            <el-option v-for="p in parityOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="超时时间" prop="monitorSysGenSerialTimeout">
          <el-input-number v-model="formData.monitorSysGenSerialTimeout" :min="1000" :max="60000" :step="1000" class="w-full" />
          <div class="text-xs text-gray-500 mt-1">单位：毫秒</div>
        </el-form-item>
        <el-form-item label="设备描述" prop="monitorSysGenSerialDesc">
          <el-input v-model="formData.monitorSysGenSerialDesc" type="textarea" :rows="3" placeholder="请输入设备描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveSerial" :loading="loading">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑串口设备对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑串口设备" width="600px" destroy-on-close>
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="设备名称" prop="monitorSysGenSerialName">
          <el-input v-model="formData.monitorSysGenSerialName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="串口端口" prop="monitorSysGenSerialPort">
          <div class="flex gap-2 w-full">
            <el-select
              v-model="formData.monitorSysGenSerialPort"
              placeholder="选择串口端口"
              class="flex-1"
              filterable
              allow-create
              :loading="loadingPorts"
              @focus="loadAvailablePorts"
            >
              <el-option
                v-for="port in availablePorts"
                :key="port"
                :label="port"
                :value="port"
              />
            </el-select>
            <el-button
              size="default"
              @click="loadAvailablePorts"
              :loading="loadingPorts"
              title="刷新可用串口"
            >
              <IconifyIconOnline icon="ep:refresh" />
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="波特率" prop="monitorSysGenSerialBaudRate">
          <el-select v-model="formData.monitorSysGenSerialBaudRate" placeholder="选择波特率" class="w-full">
            <el-option v-for="rate in baudRates" :key="rate" :label="rate" :value="rate" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据位" prop="monitorSysGenSerialDataBits">
          <el-select v-model="formData.monitorSysGenSerialDataBits" placeholder="选择数据位" class="w-full">
            <el-option v-for="bit in dataBits" :key="bit" :label="bit" :value="bit" />
          </el-select>
        </el-form-item>
        <el-form-item label="停止位" prop="monitorSysGenSerialStopBits">
          <el-select v-model="formData.monitorSysGenSerialStopBits" placeholder="选择停止位" class="w-full">
            <el-option v-for="bit in stopBits" :key="bit" :label="bit" :value="bit" />
          </el-select>
        </el-form-item>
        <el-form-item label="校验位" prop="monitorSysGenSerialParity">
          <el-select v-model="formData.monitorSysGenSerialParity" placeholder="选择校验位" class="w-full">
            <el-option v-for="p in parityOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="超时时间" prop="monitorSysGenSerialTimeout">
          <el-input-number v-model="formData.monitorSysGenSerialTimeout" :min="1000" :max="60000" :step="1000" class="w-full" />
          <div class="text-xs text-gray-500 mt-1">单位：毫秒</div>
        </el-form-item>
        <el-form-item label="设备描述" prop="monitorSysGenSerialDesc">
          <el-input v-model="formData.monitorSysGenSerialDesc" type="textarea" :rows="3" placeholder="请输入设备描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateSerial" :loading="loading">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch, inject } from 'vue';
import { message } from "@repo/utils";
import { useConfigStore } from "@repo/core";
import {
  fetchSerialPage,
  fetchSerialSave,
  fetchSerialUpdate,
  fetchSerialDelete,
  fetchSerialStart,
  fetchSerialStop,
  fetchSerialAvailablePorts
} from "@/api/serial";
import type { MonitorSysGenSerial } from "@/api/serial/types";
import { ElMessageBox } from 'element-plus';

// 组件属性
const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  socket: {
    type: Object,
    default: null
  }
});

// 获取配置和socket
const configStore = useConfigStore();
const socketInstance = inject('socket') || props.socket || configStore.getSocket();

// 响应式状态
const loading = ref(false);
const connected = ref(false);
const currentSerial = ref<MonitorSysGenSerial | null>(null);
const serialList = ref<MonitorSysGenSerial[]>([]);
const availablePorts = ref<string[]>([]);
const loadingPorts = ref(false);
const messageInput = ref('');
const logs = ref<Array<{
  id: string;
  type: 'send' | 'receive' | 'system' | 'error';
  direction: string;
  content: string;
  timestamp: string;
  raw?: string;
}>>([]);

// 显示控制
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const editingSerial = ref<MonitorSysGenSerial | null>(null);

// 监控设置
const autoScroll = ref(true);
const showTimestamp = ref(true);
const hexMode = ref(false);
const sendMode = ref<'text' | 'hex'>('text');
const sendWithNewline = ref(true);
const sendWithTimestamp = ref(false);

// 统计数据
const stats = reactive({
  sent: 0,
  received: 0,
  errors: 0
});

// 串口设置选项
const baudRates = [110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 128000, 256000];
const dataBits = [5, 6, 7, 8];
const stopBits = [1, 1.5, 2];
const parityOptions = [
  { label: '无', value: 'none' },
  { label: '奇校验', value: 'odd' },
  { label: '偶校验', value: 'even' },
  { label: '标记', value: 'mark' },
  { label: '空格', value: 'space' }
];

// 串口设置
const settings = reactive({
  port: 'COM1',
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
});

// DOM引用
const logContainer = ref<HTMLElement>();
const formRef = ref();

// 表单数据
const formData = reactive<Partial<MonitorSysGenSerial>>({
  monitorSysGenSerialName: '',
  monitorSysGenSerialPort: '',
  monitorSysGenSerialBaudRate: 9600,
  monitorSysGenSerialDataBits: 8,
  monitorSysGenSerialStopBits: 1,
  monitorSysGenSerialParity: 'none',
  monitorSysGenSerialFlowControl: 'none',
  monitorSysGenSerialTimeout: 5000,
  monitorSysGenSerialDesc: '',
  genId: 0
});

// 表单验证规则
const formRules = {
  monitorSysGenSerialName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ],
  monitorSysGenSerialPort: [
    { required: true, message: '请输入串口端口', trigger: 'blur' }
  ],
  monitorSysGenSerialBaudRate: [
    { required: true, message: '请选择波特率', trigger: 'change' }
  ],
  monitorSysGenSerialDataBits: [
    { required: true, message: '请选择数据位', trigger: 'change' }
  ],
  monitorSysGenSerialStopBits: [
    { required: true, message: '请选择停止位', trigger: 'change' }
  ],
  monitorSysGenSerialParity: [
    { required: true, message: '请选择校验位', trigger: 'change' }
  ]
};

// 加载可用串口列表
const loadAvailablePorts = async () => {
  try {
    loadingPorts.value = true;
    const response = await fetchSerialAvailablePorts({});

    if ((response as any).code === '00000') {
      availablePorts.value = (response as any).data || [];
    } else {
      console.warn('获取可用串口失败:', (response as any).msg);
      // 如果接口失败，提供默认的串口选项
      availablePorts.value = getDefaultPorts();
    }
  } catch (error) {
    console.error('获取可用串口失败:', error);
    // 如果接口失败，提供默认的串口选项
    availablePorts.value = getDefaultPorts();
  } finally {
    loadingPorts.value = false;
  }
};

// 获取默认串口选项（用于接口失败时的备选方案）
const getDefaultPorts = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('windows') || userAgent.includes('win32') || userAgent.includes('win64')) {
    // Windows 系统
    return ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8'];
  } else if (userAgent.includes('mac') || userAgent.includes('darwin')) {
    // macOS 系统
    return ['/dev/tty.usbserial', '/dev/tty.usbmodem', '/dev/tty.SLAB_USBtoUART'];
  } else {
    // Linux 系统
    return ['/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyACM0', '/dev/ttyACM1', '/dev/ttyS0', '/dev/ttyS1'];
  }
};

// 加载串口列表
const loadSerialList = async () => {
  try {
    loading.value = true;
    const response = await fetchSerialPage({
      page: 1,
      pageSize: 100,
      genId: props.data?.genId
    });

    if ((response as any).code === '00000') {
      serialList.value = (response as any).data?.data || [];
    } else {
      message.error((response as any).msg || '加载串口列表失败');
    }
  } catch (error) {
    console.error('加载串口列表失败:', error);
    message.error('加载串口列表失败');
  } finally {
    loading.value = false;
  }
};

// 刷新串口列表
const refreshSerialList = () => {
  loadSerialList();
};

// 选择串口
const selectSerial = (serial: MonitorSysGenSerial) => {
  if (currentSerial.value?.monitorSysGenSerialId === serial.monitorSysGenSerialId) {
    return;
  }

  // 如果当前有连接，先断开
  if (connected.value && currentSerial.value) {
    handleDisconnect();
  }

  currentSerial.value = serial;

  // 更新设置
  Object.assign(settings, {
    port: serial.monitorSysGenSerialPort,
    baudRate: serial.monitorSysGenSerialBaudRate,
    dataBits: serial.monitorSysGenSerialDataBits,
    stopBits: serial.monitorSysGenSerialStopBits,
    parity: serial.monitorSysGenSerialParity
  });

  addLog('system', `已选择串口设备: ${serial.monitorSysGenSerialName}`);
};

// 处理串口操作
const handleSerialAction = async (command: string) => {
  const [action, id] = command.split('_');
  const serialId = parseInt(id);
  const serial = serialList.value.find(s => s.monitorSysGenSerialId === serialId);

  if (!serial) return;

  try {
    switch (action) {
      case 'connect':
        await handleConnect(serial);
        break;
      case 'disconnect':
        await handleDisconnect(serial);
        break;
      case 'edit':
        editingSerial.value = { ...serial };
        showEditDialog.value = true;
        break;
      case 'delete':
        await handleDeleteSerial(serial);
        break;
    }
  } catch (error) {
    console.error(`执行操作 ${action} 失败:`, error);
    message.error(`操作失败: ${error.message || '未知错误'}`);
  }
};

// 连接串口 - 增强版本
const handleConnect = async (serial?: MonitorSysGenSerial) => {
  const targetSerial = serial || currentSerial.value;
  if (!targetSerial) {
    message.warning('请先选择串口设备');
    return;
  }

  // 检查Socket连接状态
  if (!socketInstance) {
    message.error('Socket连接未建立，请检查网络连接');
    addLog('error', 'Socket连接未建立');
    return;
  }

  try {
    loading.value = true;
    addLog('system', `正在连接串口: ${targetSerial.monitorSysGenSerialName}...`);

    const response = await fetchSerialStart(targetSerial.monitorSysGenSerialId);

    if ((response as any).code === '00000') {
      connected.value = true;
      targetSerial.monitorSysGenSerialStatus = 1;

      // 重置重连计数
      reconnectAttempts.value = 0;

      // 开始监听socket消息
      setupSocketListener();

      // 发送初始化命令，类似terminal的初始化
      setTimeout(() => {
        sendData('\r'); // 发送回车初始化连接
      }, 500);

      addLog('system', `串口连接成功: ${targetSerial.monitorSysGenSerialName}`);
      addLog('system', `配置: ${targetSerial.monitorSysGenSerialBaudRate}bps, ${targetSerial.monitorSysGenSerialDataBits}N${targetSerial.monitorSysGenSerialStopBits}`);
      message.success('串口连接成功');

    } else {
      const errorMsg = (response as any).msg || '连接失败';
      addLog('error', `连接失败: ${errorMsg}`);
      message.error(errorMsg);
    }
  } catch (error) {
    console.error('连接串口失败:', error);
    const errorMsg = error.message || '连接串口失败';
    addLog('error', `连接异常: ${errorMsg}`);
    message.error('连接串口失败');
  } finally {
    loading.value = false;
  }
};

// 断开串口 - 增强版本
const handleDisconnect = async (serial?: MonitorSysGenSerial) => {
  const targetSerial = serial || currentSerial.value;
  if (!targetSerial) return;

  try {
    loading.value = true;
    addLog('system', `正在断开串口: ${targetSerial.monitorSysGenSerialName}...`);

    // 先发送断开命令，类似terminal的exit命令
    if (connected.value && socketInstance) {
      try {
        sendData('exit\r'); // 发送退出命令
        await new Promise(resolve => setTimeout(resolve, 300)); // 等待命令执行
      } catch (error) {
        console.warn('发送退出命令失败:', error);
      }
    }

    const response = await fetchSerialStop(targetSerial.monitorSysGenSerialId);

    if ((response as any).code === '00000') {
      connected.value = false;
      targetSerial.monitorSysGenSerialStatus = 0;

      // 停止监听socket消息
      removeSocketListener();

      addLog('system', `串口已断开: ${targetSerial.monitorSysGenSerialName}`);
      message.success('串口已断开');

    } else {
      const errorMsg = (response as any).msg || '断开失败';
      addLog('error', `断开失败: ${errorMsg}`);
      message.error(errorMsg);
    }
  } catch (error) {
    console.error('断开串口失败:', error);
    const errorMsg = error.message || '断开串口失败';
    addLog('error', `断开异常: ${errorMsg}`);
    message.error('断开串口失败');
  } finally {
    loading.value = false;

    // 确保状态被重置
    connected.value = false;
    if (targetSerial) {
      targetSerial.monitorSysGenSerialStatus = 0;
    }
    removeSocketListener();
  }
};

// 删除串口
const handleDeleteSerial = async (serial: MonitorSysGenSerial) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除串口设备 "${serial.monitorSysGenSerialName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const response = await fetchSerialDelete(serial.monitorSysGenSerialId);

    if ((response as any).code === '00000') {
      message.success('删除成功');
      await loadSerialList();

      // 如果删除的是当前选中的串口，清空选择
      if (currentSerial.value?.monitorSysGenSerialId === serial.monitorSysGenSerialId) {
        currentSerial.value = null;
        connected.value = false;
      }
    } else {
      message.error((response as any).msg || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除串口失败:', error);
      message.error('删除失败');
    }
  }
};

// 发送消息
const handleSend = () => {
  if (!messageInput.value.trim()) {
    message.warning('发送内容不能为空');
    return;
  }

  if (!connected.value) {
    message.warning('请先连接串口');
    return;
  }

  let content = messageInput.value;

  // 处理HEX模式
  if (sendMode.value === 'hex') {
    // 验证HEX格式
    const hexPattern = /^[0-9A-Fa-f\s]+$/;
    if (!hexPattern.test(content)) {
      message.error('HEX格式不正确，请输入有效的十六进制数据');
      return;
    }
    // 清理空格并转换为标准格式
    content = content.replace(/\s+/g, ' ').trim();
  }

  // 添加换行符
  if (sendWithNewline.value) {
    content += sendMode.value === 'hex' ? ' 0D 0A' : '\r\n';
  }

  // 发送数据
  sendData(content);

  // 清空输入框
  messageInput.value = '';
  stats.sent++;
};

// 发送快捷命令
const sendQuickCommand = (command: string) => {
  if (!connected.value) {
    message.warning('请先连接串口');
    return;
  }

  let content = command;
  if (command === '\\r\\n') {
    content = '\r\n';
  }

  sendData(content);
  stats.sent++;
};

// 实际发送数据的方法 - 参考terminal.vue的send模式
const sendData = (content: string) => {
  if (!socketInstance) {
    addLog('error', 'Socket连接未建立，无法发送数据');
    message.error('Socket连接未建立');
    return;
  }

  if (!currentSerial.value) {
    addLog('error', '未选择串口设备');
    message.error('请先选择串口设备');
    return;
  }

  if (!connected.value) {
    addLog('error', '串口未连接，无法发送数据');
    message.error('请先连接串口');
    return;
  }

  try {
    // 参考terminal.vue的数据发送格式
    const sendPayload = JSON.stringify({
      command: content,
      genId: props.data?.genId || currentSerial.value.monitorSysGenSerialId,
      serialId: currentSerial.value.monitorSysGenSerialId,
      mode: sendMode.value,
      timestamp: new Date().toISOString(),
      // 添加串口配置信息
      config: {
        baudRate: currentSerial.value.monitorSysGenSerialBaudRate,
        dataBits: currentSerial.value.monitorSysGenSerialDataBits,
        stopBits: currentSerial.value.monitorSysGenSerialStopBits,
        parity: currentSerial.value.monitorSysGenSerialParity
      }
    });

    // 使用与terminal相同的事件名称模式
    const eventName = `gen/serial/${currentSerial.value.monitorSysGenSerialId}`;
    socketInstance.emit(eventName, sendPayload);

    // 添加发送日志
    addLog('send', content);

    console.log(`发送数据到串口 ${currentSerial.value.monitorSysGenSerialName}:`, content);

  } catch (error) {
    console.error('发送数据失败:', error);
    addLog('error', `发送数据失败: ${error.message}`);
    message.error('发送数据失败');
  }
};

// 添加日志
const addLog = (type: 'send' | 'receive' | 'system' | 'error', content: string, raw?: string) => {
  const now = new Date();
  const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');

  const directionMap = {
    send: '→',
    receive: '←',
    system: '●',
    error: '✗'
  };

  logs.value.push({
    id: `${Date.now()}_${Math.random()}`,
    type,
    direction: directionMap[type],
    content,
    timestamp,
    raw
  });

  // 限制日志数量
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(-800);
  }

  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
      }
    });
  }

  // 更新统计
  if (type === 'receive') {
    stats.received++;
  } else if (type === 'error') {
    stats.errors++;
  }
};

// 格式化日志内容
const formatLogContent = (content: string) => {
  if (hexMode.value) {
    // 尝试将文本转换为HEX显示
    return content.split('').map(char =>
      char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
    ).join(' ');
  }
  return content;
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
  Object.assign(stats, { sent: 0, received: 0, errors: 0 });
};

// 导出日志
const exportLogs = () => {
  if (logs.value.length === 0) {
    message.warning('没有日志可导出');
    return;
  }

  const content = logs.value.map(log =>
    `[${log.timestamp}] ${log.direction} ${log.content}`
  ).join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `serial_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  message.success('日志导出成功');
};

// 控制方法
const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value;
};

const toggleTimestamp = () => {
  showTimestamp.value = !showTimestamp.value;
};

const toggleHexMode = () => {
  hexMode.value = !hexMode.value;
};

// Socket连接状态
const socketConnected = ref(false);
const reconnectAttempts = ref(0);
const maxReconnectAttempts = 3;
const reconnectDelay = 1000;

// Socket监听设置 - 参考TerminalSocketIOListener模式
const setupSocketListener = () => {
  if (!socketInstance || !currentSerial.value) {
    addLog('error', 'Socket实例或串口设备未初始化');
    return;
  }

  const eventName = `gen/serial/${currentSerial.value.monitorSysGenSerialId}`;

  // 移除之前的监听器，避免重复监听
  removeSocketListener();

  // 设置数据监听器
  socketInstance.on(eventName, handleSocketData);

  // 设置连接状态监听器
  socketInstance.on('connect', handleSocketConnect);
  socketInstance.on('disconnect', handleSocketDisconnect);
  socketInstance.on('connect_error', handleSocketError);
  socketInstance.on('reconnect', handleSocketReconnect);
  socketInstance.on('reconnect_error', handleSocketReconnectError);

  console.log(`开始监听串口事件: ${eventName}`);
  addLog('system', `开始监听串口设备: ${currentSerial.value.monitorSysGenSerialName}`);
};

// 处理Socket数据 - 参考terminal.vue的handleEvent模式
const handleSocketData = (data: any) => {
  try {
    // 处理字符串格式的数据
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // 如果不是JSON格式，直接作为文本处理
        addLog('receive', data);
        return;
      }
    }

    // 参考terminal.vue的数据处理逻辑
    if (data?.code === '00000') {
      if (data?.msg) {
        message.warning(data.msg);
        return;
      }

      // 处理串口数据
      if (data?.data) {
        addLog('receive', data.data, data.raw);
      }
      return;
    }

    // 处理不同类型的消息
    if (data?.type === 'data') {
      addLog('receive', data.content || data.data, data.raw);
    } else if (data?.type === 'status') {
      handleStatusChange(data);
    } else if (data?.type === 'error') {
      addLog('error', data.message || data.msg || '串口发生错误');
    } else {
      // 处理其他格式的数据
      const content = data?.data || data?.content || data?.message || JSON.stringify(data);
      addLog('receive', content);
    }

  } catch (error) {
    console.error('处理socket消息失败:', error);
    addLog('error', `处理接收数据失败: ${error.message}`);
  }
};

// 处理状态变化
const handleStatusChange = (data: any) => {
  switch (data.status) {
    case 'connected':
      connected.value = true;
      addLog('system', '串口连接已建立');
      break;
    case 'disconnected':
      connected.value = false;
      addLog('system', '串口连接已断开');
      break;
    case 'error':
      addLog('error', data.message || '串口发生错误');
      break;
    case 'timeout':
      addLog('error', '串口操作超时');
      break;
    default:
      addLog('system', `状态变化: ${data.status}`);
  }
};

// Socket连接状态处理器
const handleSocketConnect = () => {
  socketConnected.value = true;
  reconnectAttempts.value = 0;
  addLog('system', 'Socket连接已建立');
  console.log('Socket连接成功');
};

const handleSocketDisconnect = (reason: string) => {
  socketConnected.value = false;
  addLog('system', `Socket连接断开: ${reason}`);
  console.log('Socket连接断开:', reason);

  // 如果是串口连接状态，尝试重连
  if (connected.value && reconnectAttempts.value < maxReconnectAttempts) {
    setTimeout(() => {
      attemptReconnect();
    }, reconnectDelay * Math.pow(2, reconnectAttempts.value)); // 指数退避
  }
};

const handleSocketError = (error: any) => {
  console.error('Socket连接错误:', error);
  addLog('error', `Socket连接错误: ${error.message || error}`);
};

const handleSocketReconnect = (attemptNumber: number) => {
  socketConnected.value = true;
  addLog('system', `Socket重连成功 (尝试 ${attemptNumber})`);
  console.log(`Socket重连成功，尝试次数: ${attemptNumber}`);
};

const handleSocketReconnectError = (error: any) => {
  reconnectAttempts.value++;
  addLog('error', `Socket重连失败 (尝试 ${reconnectAttempts.value}/${maxReconnectAttempts})`);
  console.error('Socket重连失败:', error);

  if (reconnectAttempts.value >= maxReconnectAttempts) {
    addLog('error', 'Socket重连次数已达上限，请检查网络连接');
    connected.value = false;
  }
};

// 尝试重连
const attemptReconnect = () => {
  if (reconnectAttempts.value >= maxReconnectAttempts) {
    addLog('error', '重连次数已达上限，停止重连');
    return;
  }

  reconnectAttempts.value++;
  addLog('system', `尝试重连 Socket (${reconnectAttempts.value}/${maxReconnectAttempts})`);

  // 这里可以添加重连逻辑，比如重新初始化socket连接
  if (socketInstance) {
    try {
      socketInstance.connect();
    } catch (error) {
      console.error('重连失败:', error);
    }
  }
};

// 移除Socket监听 - 增强版本
const removeSocketListener = () => {
  if (!socketInstance) return;

  // 移除串口特定事件监听
  if (currentSerial.value) {
    const eventName = `gen/serial/${currentSerial.value.monitorSysGenSerialId}`;
    socketInstance.off(eventName, handleSocketData);
    console.log(`停止监听串口事件: ${eventName}`);
  }

  // 移除通用Socket事件监听
  socketInstance.off('connect', handleSocketConnect);
  socketInstance.off('disconnect', handleSocketDisconnect);
  socketInstance.off('connect_error', handleSocketError);
  socketInstance.off('reconnect', handleSocketReconnect);
  socketInstance.off('reconnect_error', handleSocketReconnectError);

  socketConnected.value = false;
  reconnectAttempts.value = 0;
};

// 监听当前串口变化
watch(currentSerial, (newSerial, oldSerial) => {
  if (oldSerial && socketInstance) {
    const oldEventName = `gen/serial/${oldSerial.monitorSysGenSerialId}`;
    socketInstance.off(oldEventName);
  }

  if (newSerial && connected.value && socketInstance) {
    setupSocketListener();
  }
});

// 检查和初始化Socket连接
const initializeSocket = () => {
  if (!socketInstance) {
    addLog('error', 'Socket实例未初始化，请检查配置');
    message.error('Socket连接未建立，串口功能可能不可用');
    return false;
  }

  // 检查Socket连接状态
  if (socketInstance.connected) {
    socketConnected.value = true;
    addLog('system', 'Socket连接正常');
  } else {
    socketConnected.value = false;
    addLog('system', 'Socket连接断开，尝试重新连接...');
  }

  return true;
};

// 组件挂载时
onMounted(async () => {
  // 初始化Socket连接
  initializeSocket();

  // 并行加载串口列表和可用端口
  await Promise.all([
    loadSerialList(),
    loadAvailablePorts()
  ]);

  // 如果有传入的数据，尝试选择对应的串口
  if (props.data?.serialId) {
    const serial = serialList.value.find(s => s.monitorSysGenSerialId === props.data.serialId);
    if (serial) {
      selectSerial(serial);
    }
  }

  // 添加欢迎信息
  addLog('system', '串口监控系统已启动');
  addLog('system', '请选择串口设备并连接开始监控');
});

// 组件卸载时 - 增强清理逻辑
onUnmounted(async () => {
  addLog('system', '正在关闭串口监控系统...');

  try {
    // 如果有连接的串口，先断开
    if (connected.value && currentSerial.value) {
      await handleDisconnect();
    }

    // 移除所有Socket监听器
    removeSocketListener();

    // 清理状态
    socketConnected.value = false;
    reconnectAttempts.value = 0;

    console.log('串口监控组件已清理完成');
  } catch (error) {
    console.error('组件卸载清理失败:', error);
  }
});

// 升级数据 - 外部调用接口
const upgrade = (data: any) => {
  console.log('升级串口数据:', data);
  if (data.serialList) {
    serialList.value = data.serialList;
  }
  if (data.currentSerial) {
    selectSerial(data.currentSerial);
  }
};

// 升级命中信息 - 外部调用接口
const upgradeHits = (hits: any) => {
  console.log('升级串口命中信息:', hits);
  // 可以根据命中信息高亮显示相关内容
};

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    monitorSysGenSerialName: '',
    monitorSysGenSerialPort: '',
    monitorSysGenSerialBaudRate: 9600,
    monitorSysGenSerialDataBits: 8,
    monitorSysGenSerialStopBits: 1,
    monitorSysGenSerialParity: 'none',
    monitorSysGenSerialFlowControl: 'none',
    monitorSysGenSerialTimeout: 5000,
    monitorSysGenSerialDesc: '',
    genId: props.data?.genId || 0
  });
  formRef.value?.clearValidate();
};

// 保存串口设备
const handleSaveSerial = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    const response = await fetchSerialSave({
      ...formData,
      genId: props.data?.genId || 0
    } as MonitorSysGenSerial);

    if ((response as any).code === '00000') {
      message.success('保存成功');
      showAddDialog.value = false;
      resetForm();
      await loadSerialList();
    } else {
      message.error((response as any).msg || '保存失败');
    }
  } catch (error) {
    console.error('保存串口设备失败:', error);
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
};

// 更新串口设备
const handleUpdateSerial = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    const response = await fetchSerialUpdate(formData as MonitorSysGenSerial);

    if ((response as any).code === '00000') {
      message.success('更新成功');
      showEditDialog.value = false;
      editingSerial.value = null;
      resetForm();
      await loadSerialList();
    } else {
      message.error((response as any).msg || '更新失败');
    }
  } catch (error) {
    console.error('更新串口设备失败:', error);
    message.error('更新失败');
  } finally {
    loading.value = false;
  }
};



// 监听编辑对话框打开，填充表单数据
watch(showEditDialog, (newVal) => {
  if (newVal && editingSerial.value) {
    Object.assign(formData, editingSerial.value);
  }
});

// 监听添加对话框打开，重置表单
watch(showAddDialog, (newVal) => {
  if (newVal) {
    resetForm();
  }
});

// 导出方法供外部调用
defineExpose({
  upgrade,
  upgradeHits,
  loadSerialList,
  selectSerial,
  handleConnect,
  handleDisconnect,
  clearLogs
});
</script>

<style lang="scss" scoped>
.serial-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

// 状态栏样式
.status-bar {
  .status-info {
    padding: 12px 16px;
    background: var(--el-bg-color);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);

    .connection-status {
      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--el-color-info);
        transition: all 0.3s;

        &.connected {
          background: var(--el-color-success);
          box-shadow: 0 0 8px rgba(103, 194, 58, 0.4);
        }

        &.disconnected {
          background: var(--el-color-danger);
        }
      }

      .status-text {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }

    .data-stats {
      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;

        .stat-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }

        .stat-value {
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}

// 主内容区域
.main-content {
  flex: 1;
  overflow: hidden;
}

// 串口列表面板
.serial-list-panel {
  .serial-list {
    max-height: calc(100vh - 200px);
    overflow-y: auto;

    .empty-state {
      color: var(--el-text-color-secondary);
    }

    .serial-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      background: var(--el-bg-color);

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &.active {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      .serial-item-header {
        .serial-info {
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--el-color-info);

            &.online {
              background: var(--el-color-success);
            }
          }

          .serial-name {
            color: var(--el-text-color-primary);
            font-size: 14px;
          }

          .serial-port {
            color: var(--el-text-color-secondary);
            font-size: 12px;
          }
        }
      }

      .serial-config {
        color: var(--el-text-color-placeholder);
        margin-left: 20px;
      }
    }
  }
}

// 监控面板
.monitor-panel {
  .monitor-content {
    height: calc(100vh - 280px);

    .log-display {
      background: #1a1a1a;
      color: #00ff00;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      border-radius: 6px;
      position: relative;

      .empty-logs {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #666;
      }

      .log-entry {
        margin-bottom: 2px;
        word-break: break-all;

        .timestamp {
          color: #888;
          margin-right: 8px;
        }

        .direction {
          margin-right: 8px;
          font-weight: bold;
        }

        .content {
          white-space: pre-wrap;
        }

        &.send {
          .direction {
            color: #00bfff;
          }
          .content {
            color: #00bfff;
          }
        }

        &.receive {
          .direction {
            color: #00ff00;
          }
          .content {
            color: #00ff00;
          }
        }

        &.system {
          .direction {
            color: #ffa500;
          }
          .content {
            color: #ffa500;
          }
        }

        &.error {
          .direction {
            color: #ff4444;
          }
          .content {
            color: #ff4444;
          }
        }
      }
    }

    .send-panel {
      border: 1px solid var(--el-border-color-light);

      .send-controls {
        border-bottom: 1px solid var(--el-border-color-lighter);
        padding-bottom: 12px;
        margin-bottom: 12px;
      }

      .quick-commands {
        border-top: 1px solid var(--el-border-color-lighter);
        padding-top: 12px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;

    .serial-list-panel {
      width: 100%;
      margin-bottom: 16px;

      .serial-list {
        max-height: 200px;
      }
    }
  }
}

// 深色模式适配
.dark {
  .status-bar .status-info {
    background: var(--el-bg-color-overlay);
  }

  .serial-list-panel .serial-list .serial-item {
    background: var(--el-bg-color-overlay);

    &.active {
      background: var(--el-color-primary-dark-2);
    }
  }

  .monitor-panel .monitor-content .send-panel {
    background: var(--el-bg-color-overlay);
  }
}

// 滚动条样式
:deep(.el-scrollbar__bar) {
  opacity: 0.3;

  &:hover {
    opacity: 0.6;
  }
}

// 卡片样式优化
:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .el-card__header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-card__body {
    padding: 20px;
  }
}

// 按钮组样式
:deep(.el-button-group) {
  .el-button {
    border-radius: 0;

    &:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    &:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
}
</style>