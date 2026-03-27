<template>
  <div class="serial-settings-container system-container modern-bg">
    <ScForm :model="form" label-width="100px" label-position="right">
      <h4 class="mb-4 font-medium">串口参数</h4>

      <ScFormItem label="串口" prop="monitorSerialPort">
        <ScInput
          v-model="form.monitorSerialPort"
          placeholder="请输入串口，如COM1、/dev/ttyUSB0"
        />
      </ScFormItem>

      <ScFormItem label="波特率" prop="monitorSerialBaudRate">
        <ScSelect
          v-model="form.monitorSerialBaudRate"
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

      <ScFormItem label="数据位" prop="monitorSerialDataBits">
        <ScSelect
          v-model="form.monitorSerialDataBits"
          placeholder="选择数据位"
          class="w-full"
        >
          <ScOption :value="5" label="5" />
          <ScOption :value="6" label="6" />
          <ScOption :value="7" label="7" />
          <ScOption :value="8" label="8" />
        </ScSelect>
      </ScFormItem>

      <ScFormItem label="停止位" prop="monitorSerialStopBits">
        <ScSelect
          v-model="form.monitorSerialStopBits"
          placeholder="选择停止位"
          class="w-full"
        >
          <ScOption :value="1" label="1" />
          <ScOption :value="1.5" label="1.5" />
          <ScOption :value="2" label="2" />
        </ScSelect>
      </ScFormItem>

      <ScFormItem label="校验位" prop="monitorSerialParity">
        <ScSelect
          v-model="form.monitorSerialParity"
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

      <ScFormItem label="流控制" prop="monitorSerialFlowControl">
        <ScSelect
          v-model="form.monitorSerialFlowControl"
          placeholder="选择流控制"
          class="w-full"
        >
          <ScOption value="none" label="无" />
          <ScOption value="hardware" label="硬件流控" />
          <ScOption value="software" label="软件流控" />
        </ScSelect>
      </ScFormItem>

      <ScDivider />
      <h4 class="mb-4 font-medium">显示设置</h4>

      <ScFormItem label="接收格式" prop="monitorSerialReceiveFormat">
        <ScSelect
          v-model="form.monitorSerialReceiveFormat"
          placeholder="选择接收格式"
          class="w-full"
        >
          <ScOption value="text" label="文本" />
          <ScOption value="hex" label="HEX" />
        </ScSelect>
      </ScFormItem>

      <ScFormItem label="自动滚动">
        <ScSwitch v-model="form.monitorSerialAutoScroll" />
      </ScFormItem>

      <ScFormItem label="添加时间戳">
        <ScSwitch v-model="form.monitorSerialAddTimestamp" />
      </ScFormItem>

      <ScFormItem label="发送后换行">
        <ScSwitch v-model="form.monitorSerialAddNewline" />
      </ScFormItem>

      <ScDivider />
      <h4 class="mb-4 font-medium">命令预设</h4>

      <ScFormItem>
        <div class="command-presets">
          <div
            v-for="(preset, index) in form.monitorSerialCommandPresets"
            :key="index"
            class="command-preset-item mb-4"
          >
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-medium">预设命令 {{ index + 1 }}</h5>
              <ScButton
                type="danger"
                size="small"
                @click="removeCommandPreset(index)"
              >
                <IconifyIconOnline icon="ep:delete" />
              </ScButton>
            </div>
            <ScInput
              v-model="preset.name"
              placeholder="命令名称"
              class="mb-2"
            />
            <ScInput
              v-model="preset.command"
              placeholder="命令内容"
              class="mb-2"
            />
            <div class="flex items-center">
              <ScCheckbox v-model="preset.addNewline"
                >发送后添加换行</ScCheckbox
              >
              <ScRadioGroup v-model="preset.type" class="ml-4">
                <ScRadio label="text">文本</ScRadio>
                <ScRadio label="hex">HEX</ScRadio>
              </ScRadioGroup>
            </div>
          </div>

          <ScButton type="primary" plain @click="addCommandPreset">
            <IconifyIconOnline icon="ep:plus" class="mr-1" />
            添加命令预设
          </ScButton>
        </div>
      </ScFormItem>
    </ScForm>
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
  { deep: true, immediate: true },
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

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
