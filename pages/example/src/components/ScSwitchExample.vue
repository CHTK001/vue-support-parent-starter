<template>
  <div class="sc-switch-example" :class="{ 'el-dark': isDarkMode }">
    <div class="example-content">
      <!-- 左侧预览区域 -->
      <div class="preview-area">
        <h4>组件预览</h4>
        <div class="preview-container" :class="{ dark: isDarkMode }">
          <div class="preview-item">
            <ScSwitch
              v-model="switchValue"
              :layout="layout"
              :size="size"
              :disabled="disabled"
              :loading="loading"
              :active-text="activeText"
              :inactive-text="inactiveText"
              :active-color="activeColor"
              :inactive-color="inactiveColor"
              :active-icon="activeIcon"
              :inactive-icon="inactiveIcon"
              @change="handleChange"
            />
          </div>

          <div class="result-display mt-4">
            <el-alert
              :title="`当前状态: ${switchValue}`"
              type="success"
              :closable="false"
            />
          </div>
        </div>

        <!-- 布局预览 -->
        <h4 class="mt-4">布局类型预览</h4>
        <div class="layout-preview">
          <div class="layout-item">
            <p class="layout-title">默认布局</p>
            <ScSwitch
              v-model="switchValueDefault"
              layout="default"
              active-text="开启"
              inactive-text="关闭"
            />
          </div>
          <div class="layout-item">
            <p class="layout-title">卡片布局</p>
            <ScSwitch
              v-model="switchValueCard"
              layout="card"
              active-icon="ep:check"
              inactive-icon="ep:close"
              active-text="开启"
              inactive-text="关闭"
            />
          </div>
          <div class="layout-item">
            <p class="layout-title">滑块布局</p>
            <ScSwitch
              v-model="switchValueSlider"
              layout="slider"
              active-text="开启"
              inactive-text="关闭"
              active-icon="ep:check"
            />
          </div>
          <div class="layout-item">
            <p class="layout-title">现代布局</p>
            <ScSwitch
              v-model="switchValueModern"
              layout="modern"
              active-text="ON"
              inactive-text="OFF"
              active-icon="ep:check"
              inactive-icon="ep:close"
            />
          </div>
        </div>
      </div>

      <!-- 右侧配置面板 -->
      <div class="config-panel">
        <h4>配置选项</h4>
        <el-form label-position="top" size="default">
          <el-form-item label="布局类型">
            <el-segmented
              v-model="layout"
              class="w-100"
              :options="[
                { value: 'default', label: '默认' },
                { value: 'card', label: '卡片' },
                { value: 'slider', label: '滑块' },
                { value: 'modern', label: '现代' },
              ]"
            />
          </el-form-item>

          <el-form-item label="组件尺寸">
            <el-radio-group v-model="size">
              <el-radio label="small">小</el-radio>
              <el-radio label="default">默认</el-radio>
              <el-radio label="large">大</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="UI主题">
            <el-radio-group v-model="isDarkMode">
              <el-radio :label="false">亮色</el-radio>
              <el-radio :label="true">暗色</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="开关状态">
            <el-switch v-model="switchValue" />
          </el-form-item>

          <el-form-item label="禁用状态">
            <el-switch v-model="disabled" />
          </el-form-item>

          <el-form-item label="加载状态">
            <el-switch v-model="loading" />
          </el-form-item>

          <el-form-item label="开启文本">
            <el-input v-model="activeText" placeholder="开启时显示的文本" />
          </el-form-item>

          <el-form-item label="关闭文本">
            <el-input v-model="inactiveText" placeholder="关闭时显示的文本" />
          </el-form-item>

          <el-form-item label="开启图标">
            <el-select
              v-model="activeIcon"
              placeholder="选择图标"
              class="w-100"
            >
              <el-option label="无图标" value="" />
              <el-option label="对勾" value="ep:check" />
              <el-option label="打开" value="ep:open" />
              <el-option label="灯泡" value="ep:light" />
              <el-option label="电源" value="ep:turn-off" />
            </el-select>
          </el-form-item>

          <el-form-item label="关闭图标">
            <el-select
              v-model="inactiveIcon"
              placeholder="选择图标"
              class="w-100"
            >
              <el-option label="无图标" value="" />
              <el-option label="关闭" value="ep:close" />
              <el-option label="关机" value="ep:turn-off" />
              <el-option label="禁止" value="ep:remove" />
              <el-option label="月亮" value="ep:moon" />
            </el-select>
          </el-form-item>

          <el-form-item label="激活颜色">
            <el-color-picker v-model="activeColor" />
          </el-form-item>

          <el-form-item label="未激活颜色">
            <el-color-picker v-model="inactiveColor" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 代码示例 -->
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
      class="mt-4"
    />
  </div>
</template>

<script setup>
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { ElMessage } from "element-plus";
import { computed, ref } from "vue";
import CodePreview from "./CodePreview.vue";

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
};

// 配置选项
const layout = ref("default");
const size = ref("default");
const disabled = ref(false);
const loading = ref(false);
const activeText = ref("开启");
const inactiveText = ref("关闭");
const activeIcon = ref("ep:check");
const inactiveIcon = ref("ep:close");
const activeColor = ref("#409eff");
const inactiveColor = ref("#dcdfe6");

// 开关状态
const switchValue = ref(false);
const switchValueDefault = ref(true);
const switchValueCard = ref(true);
const switchValueSlider = ref(true);
const switchValueModern = ref(true);

// 处理状态变化
const handleChange = (value) => {
  console.log("开关状态变化:", value);
  ElMessage.success(`开关状态变为: ${value}`);
};

// 生成代码示例
const codeExample = computed(() => {
  let code = `<template>
  <ScSwitch
    v-model="value"
    ${layout.value !== "default" ? `layout="${layout.value}"` : ""}
    ${size.value !== "default" ? `size="${size.value}"` : ""}
    ${disabled.value ? "disabled" : ""}
    ${loading.value ? "loading" : ""}
    ${activeText.value ? `active-text="${activeText.value}"` : ""}
    ${inactiveText.value ? `inactive-text="${inactiveText.value}"` : ""}
    ${activeIcon.value ? `active-icon="${activeIcon.value}"` : ""}
    ${inactiveIcon.value ? `inactive-icon="${inactiveIcon.value}"` : ""}
    ${activeColor.value !== "#409eff" ? `active-color="${activeColor.value}"` : ""}
    ${inactiveColor.value !== "#dcdfe6" ? `inactive-color="${inactiveColor.value}"` : ""}
    @change="handleChange"
  />
</template>

<script setup>
import { ref } from 'vue';
import ScSwitch from "@repo/components/ScSwitch/index.vue";

const value = ref(${switchValue.value});

const handleChange = (value) => {
  console.log("开关状态变化:", value);
};
<\/script>`;

  return code;
});
</script>

<style scoped>
.sc-switch-example {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
}

.text-secondary {
  color: var(--el-text-color-primary);
  margin: 0;
}

.example-content {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.preview-area {
  flex: 1;
  min-width: 0;
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
}

h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.preview-container {
  margin: 20px 0;
  padding: 20px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-item {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-fill-color-lighter);
}

.layout-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-lighter);
  min-width: 120px;
}

.layout-title {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
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
  background-color: var(--el-fill-color-light);
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

/* 暗黑模式样式 - 使用 html.dark 选择器 */
html.dark {
  .layout-preview {
    background-color: var(--el-fill-color-dark);
    border-color: var(--el-border-color);
  }

  .layout-item {
    background-color: var(--el-bg-color-overlay);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  }

  .layout-title {
    color: var(--el-text-color-secondary);
  }

  pre {
    background-color: var(--el-fill-color-darker);
  }
}

@media screen and (max-width: 768px) {
  .example-content {
    flex-direction: column;
  }

  .config-panel {
    width: 100%;
  }
}
</style>
