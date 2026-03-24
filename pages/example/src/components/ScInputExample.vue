<template>
  <div class="sc-input-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <ScForm label-position="top" size="small">
          <ScFormItem label="type 输入类型">
            <ScSelect
              v-model="config.type"
              layout="card"
              :options="typeOptions"
              :gap="4"
              width="80px"
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

          <ScFormItem label="placeholder 占位文本">
            <ScInput v-model="config.placeholder" placeholder="请输入占位文本" />
          </ScFormItem>

          <!-- TOTP特定配置 -->
          <template v-if="config.type === 'totp'">
            <ScFormItem label="totpValueType 值类型">
              <ScSelect
                v-model="config.totpValueType"
                layout="card"
                :options="totpTypeOptions"
                :gap="6"
                width="70px"
              />
            </ScFormItem>

            <ScFormItem label="length 长度">
              <ScSlider v-model="config.totpLength" :min="4" :max="8" :show-stops="true" />
            </ScFormItem>
          </template>

          <!-- Select特定配置 -->
          <template v-if="config.type === 'select'">
            <ScFormItem label="options 选项">
              <ScTag type="info" size="small">已配置 {{ mockOptions.length }} 个选项</ScTag>
            </ScFormItem>
          </template>

          <ScDivider />

          <div class="switch-group">
            <div class="switch-item">
              <ScTooltip content="禁用输入" placement="left">
                <span>disabled 禁用</span>
              </ScTooltip>
              <ScSwitch v-model="config.disabled" />
            </div>
            <div class="switch-item">
              <ScTooltip content="可清空输入" placement="left">
                <span>clearable 可清空</span>
              </ScTooltip>
              <ScSwitch v-model="config.clearable" />
            </div>
            <div class="switch-item">
              <ScTooltip content="显示前缀图标" placement="left">
                <span>showPrefix 前缀图标</span>
              </ScTooltip>
              <ScSwitch v-model="config.showPrefix" />
            </div>
            <div class="switch-item" v-if="config.type === 'totp'">
              <ScTooltip content="显示已输入数量" placement="left">
                <span>count 显示数量</span>
              </ScTooltip>
              <ScSwitch v-model="config.showCount" />
            </div>
            <div class="switch-item" v-if="config.type === 'select'">
              <ScTooltip content="多选模式" placement="left">
                <span>multiple 多选</span>
              </ScTooltip>
              <ScSwitch v-model="config.multiple" />
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
          <ScInput
            v-model="inputValue"
            :type="config.type"
            :size="config.size"
            :placeholder="config.placeholder"
            :disabled="config.disabled"
            :clearable="config.clearable"
            :show-prefix="config.showPrefix"
            :totp-value-type="config.totpValueType"
            :length="config.totpLength"
            :count="config.showCount"
            :options="config.type === 'select' ? mockOptions : undefined"
            :multiple="config.multiple"
            @change="handleChange"
          />
        </div>

        <div class="result-area">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:terminal-box-line" />
            当前值
          </h4>
          <pre class="result-content">{{ JSON.stringify(inputValue, null, 2) }}</pre>
        </div>

        <div class="code-area">
          <h4 class="code-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" />
            示例代码
          </h4>
          <pre class="code-content"><code>{{ generatedCode }}</code></pre>
        </div>

        <!-- 类型展示区域 -->
        <div class="types-section">
          <h4 class="section-title">
            <IconifyIconOnline icon="ri:apps-line" />
            所有输入类型
          </h4>
          <div class="types-grid">
            <div v-for="item in typeExamples" :key="item.type" class="type-card">
              <div class="type-label">{{ item.label }}</div>
              <ScInput
                v-model="item.value"
                :type="item.type"
                :placeholder="item.placeholder"
                :options="item.options"
                :totp-value-type="item.totpValueType"
                :count="item.count"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { ScSlider } from "@repo/components";

// 类型选项
const typeOptions = [
  { label: "文本", value: "text", icon: "ri:text" },
  { label: "文本域", value: "textarea", icon: "ri:file-text-line" },
  { label: "数字", value: "number", icon: "ri:hashtag" },
  { label: "密码", value: "password", icon: "ri:lock-line" },
  { label: "搜索", value: "search", icon: "ri:search-line" },
  { label: "邮箱", value: "email", icon: "ri:mail-line" },
  { label: "颜色", value: "color", icon: "ri:palette-line" },
  { label: "布尔", value: "boolean", icon: "ri:toggle-line" },
  { label: "IP", value: "ip", icon: "ri:global-line" },
  { label: "TOTP", value: "totp", icon: "ri:key-2-line" },
  { label: "选择", value: "select", icon: "ri:arrow-down-s-line" },
  { label: "日期", value: "date", icon: "ri:calendar-line" },
  { label: "时间", value: "time", icon: "ri:time-line" },
  { label: "日期时间", value: "datetime", icon: "ri:calendar-check-line" },
  { label: "年份", value: "year", icon: "ri:calendar-2-line" },
  { label: "月份", value: "month", icon: "ri:calendar-event-line" }
];

// 尺寸选项
const sizeOptions = [
  { label: "small", value: "small", icon: "ri:subtract-line" },
  { label: "default", value: "default", icon: "ri:checkbox-blank-line" },
  { label: "large", value: "large", icon: "ri:add-line" }
];

// TOTP类型选项
const totpTypeOptions = [
  { label: "数字", value: "number", icon: "ri:hashtag" },
  { label: "字母", value: "letter", icon: "ri:font-size" },
  { label: "任意", value: "any", icon: "ri:text" }
];

// 模拟选项数据
const mockOptions = [
  { label: "选项一", value: "1", icon: "ep:goods" },
  { label: "选项二", value: "2", icon: "ep:shopping-cart" },
  { label: "选项三", value: "3", icon: "ep:present" },
  { label: "选项四", value: "4", icon: "ep:sell" },
  { label: "选项五", value: "5", icon: "ep:money" }
];

// 配置项
const config = reactive({
  type: "text" as string,
  size: "default" as "small" | "default" | "large",
  placeholder: "请输入内容",
  disabled: false,
  clearable: true,
  showPrefix: true,
  totpValueType: "number" as "number" | "letter" | "any",
  totpLength: 6,
  showCount: true,
  multiple: false
});

// 输入值
const inputValue = ref<any>("");

// 类型示例
const typeExamples = reactive([
  { type: "text", label: "文本输入", value: "", placeholder: "请输入文本" },
  { type: "textarea", label: "文本域", value: "", placeholder: "请输入多行文本" },
  { type: "number", label: "数字输入", value: 0, placeholder: "请输入数字" },
  { type: "password", label: "密码输入", value: "", placeholder: "请输入密码" },
  { type: "search", label: "搜索输入", value: "", placeholder: "请搜索" },
  { type: "email", label: "邮箱输入", value: "", placeholder: "请输入邮箱" },
  { type: "color", label: "颜色选择", value: "#409EFF", placeholder: "" },
  { type: "boolean", label: "布尔选择", value: true, placeholder: "" },
  { type: "ip", label: "IP地址", value: "192.168.1.1", placeholder: "0.0.0.0" },
  { type: "totp", label: "TOTP验证码", value: "", totpValueType: "number", count: true, placeholder: "" },
  { type: "select", label: "选择器", value: "", options: mockOptions, placeholder: "请选择" },
  { type: "date", label: "日期选择", value: "", placeholder: "选择日期" },
  { type: "time", label: "时间选择", value: "", placeholder: "选择时间" },
  { type: "datetime", label: "日期时间", value: "", placeholder: "选择日期时间" },
  { type: "year", label: "年份选择", value: "", placeholder: "选择年份" },
  { type: "month", label: "月份选择", value: "", placeholder: "选择月份" }
]);

// 处理变化
function handleChange(val: any) {
  console.log("输入值变化:", val);
}

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];

  props.push(`type="${config.type}"`);
  if (config.size !== "default") props.push(`size="${config.size}"`);
  if (config.placeholder) props.push(`placeholder="${config.placeholder}"`);
  if (config.disabled) props.push("disabled");
  if (!config.clearable) props.push(':clearable="false"');
  if (!config.showPrefix) props.push(':show-prefix="false"');

  if (config.type === "totp") {
    props.push(`totp-value-type="${config.totpValueType}"`);
    if (config.totpLength !== 6) props.push(`:length="${config.totpLength}"`);
    if (!config.showCount) props.push(':count="false"');
  }

  if (config.type === "select") {
    props.push(":options=\"options\"");
    if (config.multiple) props.push(':multiple="true"');
  }

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : " ";

  return `<ScInput
  v-model="value"${propsStr}/>

<script setup>
import { ref } from "vue";
const value = ref(${JSON.stringify(inputValue.value)});
<\/script>`;
});
</script>

<style scoped lang="scss">
.sc-input-example {
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
.code-title,
.section-title {
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

.types-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.type-card {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);

  .type-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    margin-bottom: 10px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
