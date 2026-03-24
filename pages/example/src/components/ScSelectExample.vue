<template>
  <div class="sc-select-example">
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
              :gap="4"
              width="70px"
            />
          </ScFormItem>

          <ScFormItem label="options 选项集合">
            <ScSelect
              v-model="config.optionSet"
              layout="card"
              :options="optionSetOptions"
              :gap="4"
              width="70px"
            />
          </ScFormItem>

          <ScFormItem label="gap 卡片间距">
            <ScSlider v-model="config.gap" :min="4" :max="24" :step="4" show-stops />
          </ScFormItem>

          <ScFormItem label="width 卡片宽度">
            <ScInputNumber v-model="config.widthValue" :min="60" :max="200" :step="10" />
          </ScFormItem>

          <ScFormItem v-if="config.layout === 'card'" label="iconPosition 图标位置">
            <ScSelect
              v-model="config.iconPosition"
              layout="card"
              :options="iconPositionOptions"
              :gap="6"
              width="80px"
            />
          </ScFormItem>

          <ScDivider />

          <div class="switch-group">
            <div class="switch-item">
              <ScTooltip content="多选模式" placement="left">
                <span>multiple 多选</span>
              </ScTooltip>
              <ScSwitch v-model="config.multiple" />
            </div>
            <div class="switch-item" v-if="config.multiple">
              <ScTooltip content="多选限制数量" placement="left">
                <span>limit 限制 ({{ config.limit || '不限' }})</span>
              </ScTooltip>
              <ScSlider v-model="config.limit" :min="0" :max="10" :step="1" style="width: 100px" />
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
          <ScSelect
            v-model="selectedValue"
            :options="currentOptions"
            :layout="config.layout"
            :gap="config.gap"
            :width="config.widthValue + 'px'"
            :multiple="config.multiple"
            :limit="config.limit"
            :icon-position="config.iconPosition"
            @change="handleChange"
          />
        </div>

        <div class="result-area">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:terminal-box-line" />
            当前值
          </h4>
          <pre class="result-content">{{ JSON.stringify(selectedValue, null, 2) }}</pre>
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
import { reactive, ref, computed, watch } from "vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import { ScSlider } from "@repo/components";

// 布局选项
const layoutOptions = [
  { label: "默认", value: "select", icon: "ri:arrow-down-s-line" },
  { label: "卡片", value: "card", icon: "ri:checkbox-blank-line" },
  { label: "长条", value: "pill", icon: "ri:capsule-fill" },
  { label: "下拉", value: "dropdown", icon: "ri:arrow-down-s-fill" },
  { label: "树形", value: "tree", icon: "ri:node-tree" }
];

// 选项集合选项
const optionSetOptions = [
  { label: "基础", value: "basic", icon: "ri:list-check" },
  { label: "平台", value: "platform", icon: "ri:tv-line" },
  { label: "主题", value: "theme", icon: "ri:palette-line" },
  { label: "社交", value: "social", icon: "ri:wechat-line" }
];

// 图标位置选项
const iconPositionOptions = [
  { label: "居中", value: "center", icon: "ri:align-center" },
  { label: "顶部", value: "top", icon: "ri:align-top" }
];

// 配置项
const config = reactive({
  layout: "card" as string,
  optionSet: "basic" as string,
  gap: 8,
  widthValue: 100,
  iconPosition: "center" as string,
  multiple: false,
  limit: 0
});

// 选项数据集
const basicOptions = [
  { label: "选项一", value: "option1", icon: "ep:menu" },
  { label: "选项二", value: "option2", icon: "ep:edit" },
  { label: "选项三", value: "option3", icon: "ep:setting" },
  { label: "选项四", value: "option4", icon: "ep:user" },
  { label: "选项五", value: "option5", icon: "ep:message" },
  { label: "选项六", value: "option6", icon: "ep:star" }
];

const platformOptions = [
  { label: "爱奇艺", value: "iqiyi", icon: "ri:iqiyi-fill" },
  { label: "腾讯视频", value: "tencent", icon: "ri:qq-fill" },
  { label: "优酷", value: "youku", icon: "ri:youtube-fill" },
  { label: "芒果TV", value: "mgtv", icon: "ri:netease-cloud-music-fill" },
  { label: "哔哩哔哩", value: "bilibili", icon: "ri:bilibili-fill" }
];

const themeOptions = [
  { label: "明亮模式", value: "light", icon: "ep:sunny" },
  { label: "暗黑模式", value: "dark", icon: "ep:moon" },
  { label: "蓝色主题", value: "blue", icon: "ep:cold-drink" },
  { label: "绿色主题", value: "green", icon: "ep:cherry" }
];

const socialOptions = [
  { label: "微信", value: "wechat", icon: "ri:wechat-fill" },
  { label: "微博", value: "weibo", icon: "ri:weibo-fill" },
  { label: "QQ", value: "qq", icon: "ri:qq-fill" },
  { label: "抖音", value: "tiktok", icon: "ri:tiktok-fill" },
  { label: "知乎", value: "zhihu", icon: "ri:zhihu-fill" }
];

// 当前选项
const currentOptions = computed(() => {
  switch (config.optionSet) {
    case "platform": return platformOptions;
    case "theme": return themeOptions;
    case "social": return socialOptions;
    default: return basicOptions;
  }
});

// 选中值
const selectedValue = ref<any>("option1");

// 监听多选模式变化
watch(() => config.multiple, (val) => {
  selectedValue.value = val ? [currentOptions.value[0]?.value] : currentOptions.value[0]?.value;
});

// 监听选项集变化
watch(() => config.optionSet, () => {
  selectedValue.value = config.multiple ? [currentOptions.value[0]?.value] : currentOptions.value[0]?.value;
});

// 处理选中变化
function handleChange(value: any) {
  console.log("选中值变化:", value);
  message.success(`选中了: ${config.multiple ? value.join(", ") : value}`);
}

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];

  if (config.layout !== "select") props.push(`layout="${config.layout}"`);
  props.push(":options=\"options\"");
  if (config.gap !== 8) props.push(`:gap="${config.gap}"`);
  if (config.widthValue !== 100) props.push(`width="${config.widthValue}px"`);
  if (config.layout === "card" && config.iconPosition !== "center") {
    props.push(`icon-position="${config.iconPosition}"`);
  }
  if (config.multiple) props.push("multiple");
  if (config.multiple && config.limit > 0) props.push(`:limit="${config.limit}"`);

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : " ";

  return `<ScSelect
  v-model="value"${propsStr}/>

<script setup>
import { ref } from "vue";
const value = ref(${JSON.stringify(selectedValue.value)});
const options = ${JSON.stringify(currentOptions.value.slice(0, 3), null, 2)};
<\/script>`;
});

</script>

<style scoped lang="scss">
.sc-select-example {
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
  flex-wrap: wrap;
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
