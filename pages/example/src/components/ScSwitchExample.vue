<template>
  <div class="sc-switch-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <ScForm label-position="top" size="small">
          <ScFormItem label="layout 布局类型">
            <ScSelect
              v-model="config.layout"
              layout="card"
              :options="layoutOptions"
              :gap="6"
              width="70px"
            />
          </ScFormItem>

          <ScFormItem label="size 尺寸">
            <ScSelect
              v-model="config.size"
              layout="card"
              :options="sizeOptions"
              :gap="6"
              width="70px"
            />
          </ScFormItem>

          <ScFormItem 
            label="label 标签文本"
            v-if="
              config.layout === 'compact-card' ||
              config.layout === 'visual-card'
            "
          >
            <ScInput v-model="config.label" placeholder="紧凑卡片布局的标签" />
          </ScFormItem>

          <ScFormItem label="activeText 开启文本">
            <ScInput 
              v-model="config.activeText"
              placeholder="开启时显示的文本"
            />
          </ScFormItem>

          <ScFormItem label="inactiveText 关闭文本">
            <ScInput 
              v-model="config.inactiveText"
              placeholder="关闭时显示的文本"
            />
          </ScFormItem>

          <ScFormItem label="activeIcon 开启图标">
            <ScSelect
              v-model="config.activeIcon"
              layout="card"
              :options="iconOptions"
              :gap="6"
              width="60px"
            />
          </ScFormItem>

          <ScFormItem label="inactiveIcon 关闭图标">
            <ScSelect
              v-model="config.inactiveIcon"
              layout="card"
              :options="iconOptions"
              :gap="6"
              width="60px"
            />
          </ScFormItem>

          <ScFormItem label="activeColor 激活颜色">
            <ScColorPicker v-model="config.activeColor" />
          </ScFormItem>

          <ScDivider />

          <div class="switch-group">
            <div class="switch-item">
              <ScTooltip content="当前开关的值" placement="left">
                <span>value 当前值</span>
              </ScTooltip>
              <ScSwitch v-model="switchValue" />
            </div>
            <div class="switch-item">
              <ScTooltip content="禁用开关交互" placement="left">
                <span>disabled 禁用</span>
              </ScTooltip>
              <ScSwitch v-model="config.disabled" />
            </div>
            <div class="switch-item">
              <ScTooltip content="显示加载状态" placement="left">
                <span>loading 加载中</span>
              </ScTooltip>
              <ScSwitch v-model="config.loading" />
            </div>
          </div>
        </ScForm>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>

        <div class="preview-area">
          <ScSwitch
            v-model="switchValue"
            :layout="config.layout"
            :size="config.size"
            :disabled="config.disabled"
            :loading="config.loading"
            :label="config.label"
            :active-text="config.activeText"
            :inactive-text="config.inactiveText"
            :active-icon="config.activeIcon"
            :inactive-icon="config.inactiveIcon"
            :active-color="config.activeColor"
            @change="handleChange"
          />
        </div>

        <div class="result-area">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:terminal-box-line" />
            当前值
          </h4>
          <pre class="result-content">{{ switchValue }}</pre>
        </div>

        <div class="code-area">
          <h4 class="code-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" />
            示例代码
          </h4>
          <pre class="code-content"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 布局选项
const layoutOptions = [
  { label: "默认", value: "default", icon: "ri:toggle-line" },
  { label: "卡片", value: "card", icon: "ri:checkbox-blank-line" },
  { label: "滑块", value: "slider", icon: "ri:switch-line" },
  { label: "现代", value: "modern", icon: "ri:contrast-2-line" },
  { label: "视觉卡片", value: "visual-card", icon: "ri:layout-grid-line" },
  { label: "紧凑卡片", value: "compact-card", icon: "ri:apps-line" },
];

// 尺寸选项
const sizeOptions = [
  { label: "small", value: "small", icon: "ri:subtract-line" },
  { label: "default", value: "default", icon: "ri:checkbox-blank-line" },
  { label: "large", value: "large", icon: "ri:add-line" },
];

// 图标选项
const iconOptions = [
  { label: "无", value: "", icon: "ri:close-line" },
  { label: "勾", value: "ep:check", icon: "ri:check-line" },
  { label: "叉", value: "ep:close", icon: "ri:close-line" },
  { label: "开", value: "ep:open", icon: "ri:toggle-line" },
  { label: "月", value: "ep:moon", icon: "ri:moon-line" },
];

// 配置项
const config = reactive({
  layout: "default" as
    | "default"
    | "card"
    | "slider"
    | "modern"
    | "visual-card"
    | "compact-card",
  size: "default" as "small" | "default" | "large",
  disabled: false,
  loading: false,
  label: "功能开关",
  activeText: "开启",
  inactiveText: "关闭",
  activeIcon: "ep:check",
  inactiveIcon: "ep:close",
  activeColor: "#409eff",
});

// 开关值
const switchValue = ref(false);

// 处理变化
function handleChange(val: boolean) {
  console.log("开关状态变化:", val);
}

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];

  if (config.layout !== "default") {
    props.push(`layout="${config.layout}"`);
  }
  if (config.size !== "default") {
    props.push(`size="${config.size}"`);
  }
  if (config.disabled) props.push("disabled");
  if (config.loading) props.push("loading");
  if (config.activeText) props.push(`active-text="${config.activeText}"`);
  if (config.inactiveText) props.push(`inactive-text="${config.inactiveText}"`);
  if (config.activeIcon) props.push(`active-icon="${config.activeIcon}"`);
  if (config.inactiveIcon) props.push(`inactive-icon="${config.inactiveIcon}"`);
  if (config.activeColor !== "#409eff")
    props.push(`active-color="${config.activeColor}"`);

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : " ";

  return `<ScSwitch
  v-model="value"${propsStr}/>

<script setup>
import { ref } from "vue";
const value = ref(${switchValue.value});
<\/script>`;
});
</script>

<style scoped lang="scss">
.sc-switch-example {
  padding: 20px;
}

.example-container {
  display: flex;
  gap: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;

  @media (max-width: 900px) {
    width: 100%;
  }
}

.preview-panel {
  flex: 1;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.switch-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);

  span {
    cursor: help;
    border-bottom: 1px dashed var(--el-border-color);
  }
}

.preview-area {
  padding: 40px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
}

.result-area,
.code-area {
  margin-top: 20px;
}

.result-title,
.code-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.result-content {
  margin: 0;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 13px;
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  color: var(--el-text-color-regular);
}

.code-content {
  margin: 0;
  padding: 16px;
  background: #1e1e1e;
  border-radius: 6px;
  overflow-x: auto;

  code {
    font-size: 13px;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    color: #d4d4d4;
    line-height: 1.6;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
