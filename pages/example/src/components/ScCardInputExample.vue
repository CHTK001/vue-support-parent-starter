<template>
  <div class="sc-card-input-example" :class="{ 'el-dark': isDarkMode }">
    <ScCard>
      <template #header>
        <div class="card-header">
          <div class="header-content">
            <h3>卡片输入组件 (ScInput - Card)</h3>
            <p class="text-secondary">
              一种视觉化选择输入方式，支持图标和自定义样式
            </p>
          </div>
          <div class="theme-switch">
            <ScTooltip content="切换主题">
              <ScButton circle @click="toggleTheme">
                <IconifyIconOnline
                  :icon="isDarkMode ? 'ep:sunny' : 'ep:moon'"
                />
              </ScButton>
            </ScTooltip>
          </div>
        </div>
      </template>

      <div class="example-content">
        <!-- 左侧预览区域 -->
        <div class="preview-area">
          <h4>组件预览</h4>
          <div class="preview-container" :class="{ dark: isDarkMode }">
            <div class="preview-item">
              <ScInput
                v-model="selectedValue"
                type="card"
                :placeholder="placeholder"
                :disabled="disabled"
                :size="size"
                :options="showRemoteExample ? undefined : currentOptions"
                :url="showRemoteExample ? fetchRemoteOptions : undefined"
                @update:modelValue="handleValueChange"
                @change="handleChange"
              />
            </div>

            <div class="result-display mt-4">
              <ScAlert 
                :title="`当前选择值: ${selectedValue}`"
                type="success"
                :closable="false"
              />
            </div>
          </div>

          <!-- 布局预览 -->
          <h4 class="mt-4">不同尺寸预览</h4>
          <div class="layout-preview">
            <div class="layout-item">
              <p class="layout-title">小尺寸</p>
              <ScInput
                v-model="sizeValues.small"
                type="card"
                size="small"
                :options="sizeOptions"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">默认尺寸</p>
              <ScInput
                v-model="sizeValues.default"
                type="card"
                size="default"
                :options="sizeOptions"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">大尺寸</p>
              <ScInput
                v-model="sizeValues.large"
                type="card"
                size="large"
                :options="sizeOptions"
              />
            </div>
          </div>

          <!-- 样式变体预览 -->
          <h4 class="mt-4">选项样式预览</h4>
          <div class="layout-preview">
            <div class="layout-item">
              <p class="layout-title">纯文本选项</p>
              <ScInput
                v-model="variantValues.text"
                type="card"
                :options="textOptions"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">带图标选项</p>
              <ScInput
                v-model="variantValues.icon"
                type="card"
                :options="iconOptions"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">禁用状态</p>
              <ScInput
                v-model="variantValues.disabled"
                type="card"
                :disabled="true"
                :options="textOptions"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">远程数据</p>
              <ScInput
                v-model="variantValues.remote"
                type="card"
                :url="fetchRemoteOptions"
              />
            </div>
          </div>
        </div>

        <!-- 右侧配置面板 -->
        <div class="config-panel">
          <h4>配置选项</h4>
          <ScForm label-position="top">
            <ScFormItem label="当前选项集">
              <ScSelect 
                v-model="currentOptionSet"
                placeholder="选择选项集"
                class="w-100"
              >
                <ScOption label="设备类型" value="devices" />
                <ScOption label="交通工具" value="vehicles" />
                <ScOption label="动物" value="animals" />
                <ScOption label="远程数据" value="remote" />
              </ScSelect>
            </ScFormItem>

            <ScFormItem label="占位文本">
              <ScInput v-model="placeholder" placeholder="请输入占位文本" />
            </ScFormItem>

            <ScFormItem label="组件尺寸">
              <ScRadioGroup v-model="size">
                <ScRadio label="small">小</ScRadio>
                <ScRadio label="default">默认</ScRadio>
                <ScRadio label="large">大</ScRadio>
              </ScRadioGroup>
            </ScFormItem>

            <ScFormItem label="UI主题">
              <ScRadioGroup v-model="isDarkMode">
                <ScRadio :label="false">亮色</ScRadio>
                <ScRadio :label="true">暗色</ScRadio>
              </ScRadioGroup>
            </ScFormItem>

            <ScFormItem label="禁用状态">
              <ScSwitch v-model="disabled" />
            </ScFormItem>
          </ScForm>
        </div>
      </div>

      <!-- 代码示例 -->
      <div class="code-example mt-4">
        <CodePreview
          :tabs="[
            {
              key: 'template',
              label: '模板',
              icon: 'ri:code-s-slash-line',
              language: 'vue',
              code: codeExample,
            },
          ]"
          description="根据当前配置生成的代码示例"
        />
      </div>
    </ScCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { message } from "@repo/utils";
import ScInput from "@repo/components/ScInput/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { InputType } from "@repo/components/ScInput/types";
import CodePreview from "./CodePreview.vue";

// 主题设置
const isDarkMode = ref(false);

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
};

// 配置选项
const size = ref("default");
const disabled = ref(false);
const placeholder = ref("请选择一个选项");
const selectedValue = ref("");

// 不同尺寸的选项值
const sizeValues = ref({
  small: "",
  default: "",
  large: "",
});

// 样式变体的选项值
const variantValues = ref({
  text: "",
  icon: "",
  disabled: "",
  remote: "",
});

// 选项集合
const currentOptionSet = ref("devices");

// 显示远程数据示例
const showRemoteExample = computed(() => {
  return currentOptionSet.value === "remote";
});

// 设备类型选项
const deviceOptions = [
  { label: "手机", value: "phone", icon: "ri:smartphone-line" },
  { label: "平板", value: "tablet", icon: "ri:tablet-line" },
  { label: "笔记本", value: "laptop", icon: "ri:laptop-line" },
  { label: "台式机", value: "desktop", icon: "ri:computer-line" },
];

// 交通工具选项
const vehicleOptions = [
  { label: "小汽车", value: "car", icon: "ri:car-line" },
  { label: "自行车", value: "bike", icon: "ri:bike-line" },
  { label: "飞机", value: "plane", icon: "ri:flight-takeoff-line" },
  { label: "轮船", value: "ship", icon: "ri:ship-line" },
];

// 动物选项
const animalOptions = [
  { label: "猫", value: "cat", icon: "ri:emotion-line" },
  { label: "狗", value: "dog", icon: "ri:emotion-happy-line" },
  { label: "兔子", value: "rabbit", icon: "ri:emotion-line" },
  { label: "鸟", value: "bird", icon: "ri:emotion-line" },
];

// 获取当前选项集
const currentOptions = computed(() => {
  switch (currentOptionSet.value) {
    case "devices":
      return deviceOptions;
    case "vehicles":
      return vehicleOptions;
    case "animals":
      return animalOptions;
    case "remote":
      // 对于远程数据，我们不在此处返回具体选项，而是使用url属性
      return [];
    default:
      return deviceOptions;
  }
});

// 尺寸示例用选项
const sizeOptions = [
  { label: "选项一", value: "option1", icon: "ri:checkbox-circle-line" },
  { label: "选项二", value: "option2", icon: "ri:checkbox-circle-line" },
];

// 纯文本选项
const textOptions = [
  { label: "选项一", value: "option1" },
  { label: "选项二", value: "option2" },
  { label: "选项三", value: "option3" },
];

// 带图标选项
const iconOptions = [
  { label: "成功", value: "success", icon: "ri:checkbox-circle-line" },
  { label: "警告", value: "warning", icon: "ri:alert-line" },
  { label: "错误", value: "error", icon: "ri:close-circle-line" },
];

// 生成代码示例
const codeExample = computed(() => {
  // 默认使用普通选项的示例
  let code = `<template>
  <ScInput
    v-model="selectedValue"
    type="card"
    ${placeholder.value ? `placeholder="${placeholder.value}"` : ""}
    ${disabled.value ? "disabled" : ""}
    ${size.value !== "default" ? `size="${size.value}"` : ""}
    :options="options"
    @change="handleChange"
  />
</template>

<script setup>
import { ref } from 'vue';
import ScInput from '@repo/components/ScInput/index.vue';

const selectedValue = ref('${selectedValue.value}');

const options = ${JSON.stringify(currentOptions.value, null, 2)};

const handleChange = (value) => {
  console.log('选择的值:', value);
};
<\/script>`;

  // 如果当前是"远程"选项集，则显示远程数据加载示例
  if (showRemoteExample.value) {
    code = `<template>
  <ScInput
    v-model="selectedValue"
    type="card"
    ${placeholder.value ? `placeholder="${placeholder.value}"` : ""}
    ${disabled.value ? "disabled" : ""}
    ${size.value !== "default" ? `size="${size.value}"` : ""}
    :url="fetchOptions"
    @change="handleChange"
  />
</template>

<script setup>
import { ref } from 'vue';
import ScInput from '@repo/components/ScInput/index.vue';

const selectedValue = ref('${variantValues.value.remote}');

// 远程数据获取函数
const fetchOptions = async (params) => {
  // 这里可以是真实的API调用
  // const response = await fetchFromApi('/api/options', params);
  // return response.data;
  
  // 模拟返回数据
  return [
    { label: "远程选项1", value: "remote1", icon: "ri:cloud-line" },
    { label: "远程选项2", value: "remote2", icon: "ri:cloud-fill" },
    { label: "远程选项3", value: "remote3", icon: "ri:cloud-off-line" }
  ];
};

const handleChange = (value) => {
  console.log('选择的值:', value);
};
<\/script>`;
  }

  return code;
});

// 处理值变化
const handleValueChange = (value) => {
  selectedValue.value = value;
};

// 处理change事件
const handleChange = (value) => {
  message(`选择的值已变更为: ${value}`, { type: "success" });
};

// 远程数据获取函数
const fetchRemoteOptions = async (params) => {
  // 模拟加载延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 返回模拟数据
  return [
    { label: "远程选项1", value: "remote1", icon: "ri:cloud-line" },
    { label: "远程选项2", value: "remote2", icon: "ri:cloud-fill" },
    { label: "远程选项3", value: "remote3", icon: "ri:cloud-off-line" },
  ];
};
</script>

<style lang="scss" scoped>
.sc-card-input-example {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  h3 {
    margin: 0;
    margin-bottom: 8px;
  }

  .text-secondary {
    margin: 0;
    color: var(--el-text-color);
  }
}

.example-content {
  display: flex;
  gap: 24px;
  margin-top: 20px;
}

.preview-area {
  flex: 1;
  padding-right: 20px;
  border-right: 1px solid #ebeef5;
}

.config-panel {
  width: 360px;
}

.preview-container {
  padding: 20px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-item {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 500px;
}

.layout-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.layout-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  min-width: 200px;
  width: calc(50% - 24px);
}

.layout-title {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.code-example {
  margin-top: 16px;
}

.w-100 {
  width: 100%;
}

.mt-4 {
  margin-top: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.code-desc {
  margin-bottom: 8px;
}

/* 暗黑模式样式 */
.el-dark {
  --preview-bg: #1a1a1a;
  --preview-border: #333;
  --text-color: #eee;
  --heading-color: #fff;
  --code-bg: #2d2d2d;
  --code-color: #eee;
}

.el-dark .preview-container,
.el-dark .layout-preview {
  background-color: var(--preview-bg);
  border-color: var(--preview-border);
}

.el-dark .layout-item {
  background-color: #2a2a2a;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
}

.el-dark .layout-title {
  color: #ddd;
}

.el-dark h3,
.el-dark h4 {
  color: var(--heading-color);
}

.el-dark .text-secondary {
  color: #aaa;
}

.el-dark pre {
  background-color: var(--code-bg);
}

.el-dark code {
  color: var(--code-color);
}

@media screen and (max-width: 768px) {
  .example-content {
    flex-direction: column;
  }

  .config-panel {
    width: 100%;
  }

  .layout-item {
    width: 100%;
  }
}
</style>
