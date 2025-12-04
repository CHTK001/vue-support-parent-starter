<template>
  <div class="serial-settings-container">
    <el-form :model="form" label-width="100px" label-position="right">
      <h4 class="mb-4 font-medium">串口参数</h4>

      <el-form-item label="串口" prop="monitorSerialPort">
        <el-input v-model="form.monitorSerialPort" placeholder="请输入串口，如COM1、/dev/ttyUSB0" />
      </el-form-item>

      <el-form-item label="波特率" prop="monitorSerialBaudRate">
        <el-select v-model="form.monitorSerialBaudRate" placeholder="选择波特率" class="w-full">
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

      <el-form-item label="数据位" prop="monitorSerialDataBits">
        <el-select v-model="form.monitorSerialDataBits" placeholder="选择数据位" class="w-full">
          <el-option :value="5" label="5" />
          <el-option :value="6" label="6" />
          <el-option :value="7" label="7" />
          <el-option :value="8" label="8" />
        </el-select>
      </el-form-item>

      <el-form-item label="停止位" prop="monitorSerialStopBits">
        <el-select v-model="form.monitorSerialStopBits" placeholder="选择停止位" class="w-full">
          <el-option :value="1" label="1" />
          <el-option :value="1.5" label="1.5" />
          <el-option :value="2" label="2" />
        </el-select>
      </el-form-item>

      <el-form-item label="校验位" prop="monitorSerialParity">
        <el-select v-model="form.monitorSerialParity" placeholder="选择校验位" class="w-full">
          <el-option value="none" label="无校验" />
          <el-option value="even" label="偶校验" />
          <el-option value="odd" label="奇校验" />
          <el-option value="mark" label="标记校验" />
          <el-option value="space" label="空格校验" />
        </el-select>
      </el-form-item>

      <el-form-item label="流控制" prop="monitorSerialFlowControl">
        <el-select v-model="form.monitorSerialFlowControl" placeholder="选择流控制" class="w-full">
          <el-option value="none" label="无" />
          <el-option value="hardware" label="硬件流控" />
          <el-option value="software" label="软件流控" />
        </el-select>
      </el-form-item>

      <el-divider />
      <h4 class="mb-4 font-medium">显示设置</h4>

      <el-form-item label="接收格式" prop="monitorSerialReceiveFormat">
        <el-select v-model="form.monitorSerialReceiveFormat" placeholder="选择接收格式" class="w-full">
          <el-option value="text" label="文本" />
          <el-option value="hex" label="HEX" />
        </el-select>
      </el-form-item>

      <el-form-item label="自动滚动">
        <el-switch v-model="form.monitorSerialAutoScroll" />
      </el-form-item>

      <el-form-item label="添加时间戳">
        <el-switch v-model="form.monitorSerialAddTimestamp" />
      </el-form-item>

      <el-form-item label="发送后换行">
        <el-switch v-model="form.monitorSerialAddNewline" />
      </el-form-item>

      <el-divider />
      <h4 class="mb-4 font-medium">命令预设</h4>

      <el-form-item>
        <div class="command-presets">
          <div v-for="(preset, index) in form.monitorSerialCommandPresets" :key="index" class="command-preset-item mb-4">
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
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";

const props = defineProps({
  serialData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["save"]);

// 表单数据
const form = reactive({
  monitorSerialPort: "",
  monitorSerialBaudRate: 9600,
  monitorSerialDataBits: 8,
  monitorSerialStopBits: 1,
  monitorSerialParity: "none",
  monitorSerialFlowControl: "none",
  monitorSerialReceiveFormat: "text",
  monitorSerialAutoScroll: true,
  monitorSerialAddTimestamp: true,
  monitorSerialAddNewline: true,
  monitorSerialCommandPresets: [],
});

// 监听串口数据变化
watch(
  () => props.serialData,
  (newData) => {
    if (newData) {
      // 填充表单数据
      Object.keys(form).forEach((key) => {
        if (newData[key] !== undefined) {
          form[key] = newData[key];
        }
      });

      // 如果没有预设命令，初始化一个空数组
      if (!form.monitorSerialCommandPresets) {
        form.monitorSerialCommandPresets = [];
      }
    }
  },
  { deep: true, immediate: true }
);

// 添加命令预设
const addCommandPreset = () => {
  form.monitorSerialCommandPresets.push({
    name: "",
    command: "",
    addNewline: true,
    type: "text",
  });
};

// 删除命令预设
const removeCommandPreset = (index) => {
  form.monitorSerialCommandPresets.splice(index, 1);
};

// 获取设置
const getSettings = () => {
  return { ...form };
};

// 暴露方法给父组件
defineExpose({
  getSettings,
});
</script>

<style scoped lang="scss">
.serial-settings-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
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
