<template>
  <div class="serial-config-container">
    <div class="header-actions flex justify-between items-center mb-4">
      <div class="flex items-center">
        <IconifyIconOnline icon="mdi:serial-port" class="mr-2 text-primary text-xl" />
        <h3 class="text-lg font-medium">串口配置</h3>
      </div>
      <div class="flex items-center gap-2">
        <el-button type="primary" @click="saveConfig">
          <IconifyIconOnline icon="ep:check" class="mr-1" />
          保存配置
        </el-button>
      </div>
    </div>

    <el-card class="config-content">
      <el-form :model="serialConfig" label-width="120px" label-position="right">
        <h4 class="mb-4 font-medium">基本配置</h4>
        
        <el-form-item label="配置名称" prop="monitorSerialName">
          <el-input v-model="serialConfig.monitorSerialName" placeholder="请输入配置名�? />
        </el-form-item>
        
        <el-form-item label="描述" prop="monitorSerialDescription">
          <el-input v-model="serialConfig.monitorSerialDescription" type="textarea" :rows="2" placeholder="请输入配置描�? />
        </el-form-item>
        
        <el-divider />
        <h4 class="mb-4 font-medium">串口参数</h4>
        
        <el-form-item label="默认串口" prop="monitorSerialDefaultPort">
          <el-input v-model="serialConfig.monitorSerialDefaultPort" placeholder="请输入默认串口，如COM1�?dev/ttyUSB0" />
        </el-form-item>
        
        <el-form-item label="默认波特�? prop="monitorSerialDefaultBaudRate">
          <el-select v-model="serialConfig.monitorSerialDefaultBaudRate" placeholder="选择默认波特�? class="w-full">
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
        
        <el-form-item label="默认数据�? prop="monitorSerialDefaultDataBits">
          <el-select v-model="serialConfig.monitorSerialDefaultDataBits" placeholder="选择默认数据�? class="w-full">
            <el-option :value="5" label="5" />
            <el-option :value="6" label="6" />
            <el-option :value="7" label="7" />
            <el-option :value="8" label="8" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="默认停止�? prop="monitorSerialDefaultStopBits">
          <el-select v-model="serialConfig.monitorSerialDefaultStopBits" placeholder="选择默认停止�? class="w-full">
            <el-option :value="1" label="1" />
            <el-option :value="1.5" label="1.5" />
            <el-option :value="2" label="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="默认校验�? prop="monitorSerialDefaultParity">
          <el-select v-model="serialConfig.monitorSerialDefaultParity" placeholder="选择默认校验�? class="w-full">
            <el-option value="none" label="无校�? />
            <el-option value="even" label="偶校�? />
            <el-option value="odd" label="奇校�? />
            <el-option value="mark" label="标记校验" />
            <el-option value="space" label="空格校验" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="默认流控�? prop="monitorSerialDefaultFlowControl">
          <el-select v-model="serialConfig.monitorSerialDefaultFlowControl" placeholder="选择默认流控�? class="w-full">
            <el-option value="none" label="�? />
            <el-option value="hardware" label="硬件流控" />
            <el-option value="software" label="软件流控" />
          </el-select>
        </el-form-item>
        
        <el-divider />
        <h4 class="mb-4 font-medium">显示设置</h4>
        
        <el-form-item label="默认接收格式" prop="monitorSerialDefaultReceiveFormat">
          <el-select v-model="serialConfig.monitorSerialDefaultReceiveFormat" placeholder="选择默认接收格式" class="w-full">
            <el-option value="text" label="文本" />
            <el-option value="hex" label="HEX" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="自动滚动" prop="monitorSerialAutoScroll">
          <el-switch v-model="serialConfig.monitorSerialAutoScroll" />
        </el-form-item>
        
        <el-form-item label="添加时间�? prop="monitorSerialAddTimestamp">
          <el-switch v-model="serialConfig.monitorSerialAddTimestamp" />
        </el-form-item>
        
        <el-form-item label="发送后换行" prop="monitorSerialAddNewline">
          <el-switch v-model="serialConfig.monitorSerialAddNewline" />
        </el-form-item>
        
        <el-divider />
        <h4 class="mb-4 font-medium">命令预设</h4>
        
        <el-form-item>
          <div class="command-presets">
            <div v-for="(preset, index) in serialConfig.monitorSerialCommandPresets" :key="index" class="command-preset-item mb-4">
              <div class="flex items-center justify-between mb-2">
                <h5 class="font-medium">预设命令 {{ index + 1 }}</h5>
                <el-button type="danger" size="small" @click="removeCommandPreset(index)">
                  <IconifyIconOnline icon="ep:delete" />
                </el-button>
              </div>
              <el-input v-model="preset.name" placeholder="命令名称" class="mb-2" />
              <el-input v-model="preset.command" placeholder="命令内容" class="mb-2" />
              <div class="flex items-center">
                <el-checkbox v-model="preset.addNewline">发送后添加换行</el-checkbox>
                <el-radio-group v-model="preset.type" class="ml-4">
                  <el-radio label="text">文本</el-radio>
                  <el-radio label="hex">HEX</el-radio>
                </el-radio-group>
              </div>
            </div>
            
            <el-button type="primary" plain @click="addCommandPreset">
              <IconifyIconOnline icon="ep:plus" class="mr-1" />
              添加命令预设
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from "@repo/utils";
import { indexedDBProxy } from '@repo/utils';

// 串口配置
const serialConfig = reactive({
  monitorSerialName: '默认配置',
  monitorSerialDescription: '默认串口配置',
  monitorSerialDefaultPort: 'COM1',
  monitorSerialDefaultBaudRate: 115200,
  monitorSerialDefaultDataBits: 8,
  monitorSerialDefaultStopBits: 1,
  monitorSerialDefaultParity: 'none',
  monitorSerialDefaultFlowControl: 'none',
  monitorSerialDefaultReceiveFormat: 'text',
  monitorSerialAutoScroll: true,
  monitorSerialAddTimestamp: true,
  monitorSerialAddNewline: true,
  monitorSerialCommandPresets: [
    {
      name: '查询版本',
      command: 'version',
      addNewline: true,
      type: 'text'
    },
    {
      name: '重启设备',
      command: 'reboot',
      addNewline: true,
      type: 'text'
    }
  ]
});

// 加载保存的配�?
const loadConfig = async () => {
  try {
    const savedConfig = await indexedDBProxy.getItem('serialGlobalConfig');
    if (savedConfig) {
      Object.assign(serialConfig, savedConfig);
    }
  } catch (error) {
    console.error('加载串口配置失败:', error);
  }
};

// 保存配置
const saveConfig = async () => {
  try {
    await indexedDBProxy.setItem('serialGlobalConfig', serialConfig);
    
    // 同时更新串口设置页面的默认�?
    await indexedDBProxy.setItem('serialSettings', {
      monitorSerialPort: serialConfig.monitorSerialDefaultPort,
      monitorSerialBaudRate: serialConfig.monitorSerialDefaultBaudRate,
      monitorSerialDataBits: serialConfig.monitorSerialDefaultDataBits,
      monitorSerialStopBits: serialConfig.monitorSerialDefaultStopBits,
      monitorSerialParity: serialConfig.monitorSerialDefaultParity,
      monitorSerialFlowControl: serialConfig.monitorSerialDefaultFlowControl,
      monitorSerialReceiveFormat: serialConfig.monitorSerialDefaultReceiveFormat
    });
    
    await indexedDBProxy.setItem('serialOptions', {
      autoScroll: serialConfig.monitorSerialAutoScroll,
      addTimestamp: serialConfig.monitorSerialAddTimestamp,
      addNewline: serialConfig.monitorSerialAddNewline,
      sendMode: 'text'
    });
    
    message.success('串口配置已保�?);
  } catch (error) {
    console.error('保存串口配置失败:', error);
    message.error('保存串口配置失败');
  }
};

// 添加命令预设
const addCommandPreset = () => {
  serialConfig.monitorSerialCommandPresets.push({
    name: '',
    command: '',
    addNewline: true,
    type: 'text'
  });
};

// 删除命令预设
const removeCommandPreset = (index: number) => {
  serialConfig.monitorSerialCommandPresets.splice(index, 1);
};

// 组件挂载时加载配�?
onMounted(() => {
  loadConfig();
});
</script>

<style scoped lang="scss">
.serial-config-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-content {
  flex: 1;
  overflow-y: auto;
}

h4 {
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.command-preset-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
}
</style> 