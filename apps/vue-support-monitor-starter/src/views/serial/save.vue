<template>
  <div class="serial-config-container system-container modern-bg">
    <div class="header-actions flex justify-between items-center mb-4">
      <div class="flex items-center">
        <IconifyIconOnline
          icon="mdi:serial-port"
          class="mr-2 text-primary text-xl"
        />
        <h3 class="text-lg font-medium">串口配置</h3>
      </div>
      <div class="flex items-center gap-2">
        <ScButton type="primary" @click="saveConfig">
          <IconifyIconOnline icon="ep:check" class="mr-1" />
          保存配置
        </ScButton>
      </div>
    </div>

    <ScCard class="config-content">
      <ScForm :model="serialConfig" label-width="120px" label-position="right">
        <h4 class="mb-4 font-medium">基本配置</h4>

        <ScFormItem label="配置名称" prop="monitorSerialName">
          <ScInput
            v-model="serialConfig.monitorSerialName"
            placeholder="请输入配置名称"
          />
        </ScFormItem>

        <ScFormItem label="描述" prop="monitorSerialDescription">
          <ScInput
            v-model="serialConfig.monitorSerialDescription"
            type="textarea"
            :rows="2"
            placeholder="请输入配置描述"
          />
        </ScFormItem>

        <ScDivider />
        <h4 class="mb-4 font-medium">串口参数</h4>

        <ScFormItem label="默认串口" prop="monitorSerialDefaultPort">
          <ScInput
            v-model="serialConfig.monitorSerialDefaultPort"
            placeholder="请输入默认串口，如COM1、/dev/ttyUSB0"
          />
        </ScFormItem>

        <ScFormItem label="默认波特率" prop="monitorSerialDefaultBaudRate">
          <ScSelect
            v-model="serialConfig.monitorSerialDefaultBaudRate"
            placeholder="选择默认波特率"
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

        <ScFormItem label="默认数据位" prop="monitorSerialDefaultDataBits">
          <ScSelect
            v-model="serialConfig.monitorSerialDefaultDataBits"
            placeholder="选择默认数据位"
            class="w-full"
          >
            <ScOption :value="5" label="5" />
            <ScOption :value="6" label="6" />
            <ScOption :value="7" label="7" />
            <ScOption :value="8" label="8" />
          </ScSelect>
        </ScFormItem>

        <ScFormItem label="默认停止位" prop="monitorSerialDefaultStopBits">
          <ScSelect
            v-model="serialConfig.monitorSerialDefaultStopBits"
            placeholder="选择默认停止位"
            class="w-full"
          >
            <ScOption :value="1" label="1" />
            <ScOption :value="1.5" label="1.5" />
            <ScOption :value="2" label="2" />
          </ScSelect>
        </ScFormItem>

        <ScFormItem label="默认校验位" prop="monitorSerialDefaultParity">
          <ScSelect
            v-model="serialConfig.monitorSerialDefaultParity"
            placeholder="选择默认校验位"
            class="w-full"
          >
            <ScOption value="none" label="无校验" />
            <ScOption value="even" label="偶校验" />
            <ScOption value="odd" label="奇校验" />
            <ScOption value="mark" label="标记校验" />
            <ScOption value="space" label="空格校验" />
          </ScSelect>
        </ScFormItem>

        <ScFormItem label="默认流控制" prop="monitorSerialDefaultFlowControl">
          <ScSelect
            v-model="serialConfig.monitorSerialDefaultFlowControl"
            placeholder="选择默认流控制"
            class="w-full"
          >
            <ScOption value="none" label="无" />
            <ScOption value="hardware" label="硬件流控" />
            <ScOption value="software" label="软件流控" />
          </ScSelect>
        </ScFormItem>

        <ScDivider />
        <h4 class="mb-4 font-medium">显示设置</h4>

        <ScFormItem
          label="默认接收格式"
          prop="monitorSerialDefaultReceiveFormat"
        >
          <ScSelect
            v-model="serialConfig.monitorSerialDefaultReceiveFormat"
            placeholder="选择默认接收格式"
            class="w-full"
          >
            <ScOption value="text" label="文本" />
            <ScOption value="hex" label="HEX" />
          </ScSelect>
        </ScFormItem>

        <ScFormItem label="自动滚动" prop="monitorSerialAutoScroll">
          <ScSwitch v-model="serialConfig.monitorSerialAutoScroll" />
        </ScFormItem>

        <ScFormItem label="添加时间戳" prop="monitorSerialAddTimestamp">
          <ScSwitch v-model="serialConfig.monitorSerialAddTimestamp" />
        </ScFormItem>

        <ScFormItem label="发送后换行" prop="monitorSerialAddNewline">
          <ScSwitch v-model="serialConfig.monitorSerialAddNewline" />
        </ScFormItem>

        <ScDivider />
        <h4 class="mb-4 font-medium">命令预设</h4>

        <ScFormItem>
          <div class="command-presets">
            <div
              v-for="(
                preset, index
              ) in serialConfig.monitorSerialCommandPresets"
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
    </ScCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@repo/utils";
import { indexedDBProxy } from "@repo/utils";

// 串口配置
const serialConfig = reactive({
  monitorSerialName: "默认配置",
  monitorSerialDescription: "默认串口配置",
  monitorSerialDefaultPort: "COM1",
  monitorSerialDefaultBaudRate: 115200,
  monitorSerialDefaultDataBits: 8,
  monitorSerialDefaultStopBits: 1,
  monitorSerialDefaultParity: "none",
  monitorSerialDefaultFlowControl: "none",
  monitorSerialDefaultReceiveFormat: "text",
  monitorSerialAutoScroll: true,
  monitorSerialAddTimestamp: true,
  monitorSerialAddNewline: true,
  monitorSerialCommandPresets: [
    {
      name: "查询版本",
      command: "version",
      addNewline: true,
      type: "text",
    },
    {
      name: "重启设备",
      command: "reboot",
      addNewline: true,
      type: "text",
    },
  ],
});

// 加载保存的配置
const loadConfig = async () => {
  try {
    const savedConfig = await indexedDBProxy.getItem("serialGlobalConfig");
    if (savedConfig) {
      Object.assign(serialConfig, savedConfig);
    }
  } catch (error) {
    console.error("加载串口配置失败:", error);
  }
};

// 保存配置
const saveConfig = async () => {
  try {
    await indexedDBProxy.setItem("serialGlobalConfig", serialConfig);

    // 同时更新串口设置页面的默认值
    await indexedDBProxy.setItem("serialSettings", {
      monitorSerialPort: serialConfig.monitorSerialDefaultPort,
      monitorSerialBaudRate: serialConfig.monitorSerialDefaultBaudRate,
      monitorSerialDataBits: serialConfig.monitorSerialDefaultDataBits,
      monitorSerialStopBits: serialConfig.monitorSerialDefaultStopBits,
      monitorSerialParity: serialConfig.monitorSerialDefaultParity,
      monitorSerialFlowControl: serialConfig.monitorSerialDefaultFlowControl,
      monitorSerialReceiveFormat:
        serialConfig.monitorSerialDefaultReceiveFormat,
    });

    await indexedDBProxy.setItem("serialOptions", {
      autoScroll: serialConfig.monitorSerialAutoScroll,
      addTimestamp: serialConfig.monitorSerialAddTimestamp,
      addNewline: serialConfig.monitorSerialAddNewline,
      sendMode: "text",
    });

    message.success("串口配置已保存");
  } catch (error) {
    console.error("保存串口配置失败:", error);
    message.error("保存串口配置失败");
  }
};

// 添加命令预设
const addCommandPreset = () => {
  serialConfig.monitorSerialCommandPresets.push({
    name: "",
    command: "",
    addNewline: true,
    type: "text",
  });
};

// 删除命令预设
const removeCommandPreset = (index: number) => {
  serialConfig.monitorSerialCommandPresets.splice(index, 1);
};

// 组件挂载时加载配置
onMounted(() => {
  loadConfig();
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

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
