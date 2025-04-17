<template>
  <div class="sc-select-example">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>卡片选择器组件 (ScSelect)</h3>
          <p class="text-secondary">一个灵活的卡片式选择器组件，支持多种布局和样式自定义</p>
        </div>
      </template>

      <div class="example-content">
        <!-- 左侧预览区域 -->
        <div class="preview-area">
          <h4>组件预览</h4>
          <div class="preview-container" :class="{ 'custom-style': useCustomStyle }">
            <ScSelect v-model="selectedValue" :options="options" :columns="columns" :gap="gap" :layout="layout" :multiple="multiple" :limit="limit" :max-collapse-tags="maxCollapseTags" :width="width" @change="handleChange" />

            <div class="result-display mt-4">
              <el-alert v-if="!multiple" :title="`当前选中值: ${selectedValue}`" type="success" :closable="false" />
              <el-alert v-else :title="`当前选中值: ${selectedMultipleDisplay}`" type="success" :closable="false" />
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
                  { value: 'card', label: '卡片' },
                  { value: 'select', label: '下拉' }
                ]"
              />
            </el-form-item>

            <el-form-item label="选择模式">
              <el-switch v-model="multiple" active-text="多选" inactive-text="单选" />
            </el-form-item>

            <el-form-item label="自定义样式">
              <el-switch v-model="useCustomStyle" active-text="启用" inactive-text="禁用" />
            </el-form-item>

            <el-form-item label="卡片宽度">
              <el-input-number v-model="widthValue" :min="80" :max="300" :step="10" @change="updateWidth" />
              <span class="ml-2">px</span>
            </el-form-item>

            <el-form-item label="卡片间距">
              <el-slider v-model="gap" :min="4" :max="24" :step="4" show-stops />
            </el-form-item>

            <el-form-item label="多选限制数量" :disabled="!multiple">
              <el-tooltip content="多选模式下最多可选择的选项数量，0表示不限制" placement="top" :disabled="!multiple">
                <div>
                  <el-slider v-model="limit" :min="0" :max="10" :step="1" show-stops :disabled="!multiple" />
                  <div class="limit-hint">{{ limit === 0 ? "不限制" : `最多选择 ${limit} 项` }}</div>
                </div>
              </el-tooltip>
            </el-form-item>

            <el-form-item label="标签显示数量" :disabled="!multiple || layout !== 'select'">
              <el-tooltip content="select布局下多选模式最多显示的标签数量" placement="top" :disabled="!multiple || layout !== 'select'">
                <div>
                  <el-slider v-model="maxCollapseTags" :min="1" :max="5" :step="1" show-stops :disabled="!multiple || layout !== 'select'" />
                  <div class="limit-hint">最多显示 {{ maxCollapseTags }} 个标签</div>
                </div>
              </el-tooltip>
            </el-form-item>

            <el-form-item label="选项集">
              <el-segmented
                v-model="optionSet"
                class="w-100"
                :options="[
                  { value: 'basic', label: '基础选项' },
                  { value: 'platform', label: '平台选项' },
                  { value: 'theme', label: '主题选项' },
                ]"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 代码示例 -->
      <div class="code-example mt-4">
        <h4>代码示例</h4>
        <el-alert type="info" :closable="false" class="mb-3">
          <div class="code-desc">根据当前配置生成的代码示例</div>
        </el-alert>
        <pre><code class="language-html">{{ codeExample }}</code></pre>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import ScSelect from "@repo/components/ScSelect/index.vue";

// 配置选项
const layout = ref("card");
const columnsType = ref("auto");
const columnsValue = ref(3);
const columns = computed(() => columnsType.value === "auto" ? "auto" : columnsValue.value);
const gap = ref(8);
const multiple = ref(false);
const useCustomStyle = ref(false);
const optionSet = ref("basic");
const limit = ref(0);
const maxCollapseTags = ref(1);
const widthValue = ref(120);
const width = ref('120px');

// 更新宽度
const updateWidth = (val) => {
  width.value = `${val}px`;
};

// 选项数据集
const basicOptions = [
  { label: "选项一", value: "option1", icon: "ep:menu" },
  { label: "选项二", value: "option2", icon: "ep:edit" },
  { label: "选项三", value: "option3", icon: "ep:setting" },
  { label: "选项四", value: "option4", icon: "ep:user" },
  { label: "选项五", value: "option5", icon: "ep:message" },
  { label: "选项六", value: "option6", icon: "ep:star" },
];

const platformOptions = [
  { label: "爱奇艺", value: "iqiyi", icon: "ri:iqiyi-fill" },
  { label: "腾讯视频", value: "tencent", icon: "ri:qq-fill" },
  { label: "优酷", value: "youku", icon: "ri:youtube-fill" },
  { label: "芒果TV", value: "mgtv", icon: "ri:netease-cloud-music-fill" },
  { label: "搜狐视频", value: "sohu", icon: "ri:tv-fill" },
  { label: "哔哩哔哩", value: "bilibili", icon: "ri:bilibili-fill" },
];

const themeOptions = [
  { label: "明亮模式", value: "light", icon: "ep:sunny" },
  { label: "暗黑模式", value: "dark", icon: "ep:moon" },
  { label: "蓝色主题", value: "blue", icon: "ep:cold-drink" },
  { label: "绿色主题", value: "green", icon: "ep:cherry" },
];

// 动态选项
const options = computed(() => {
  switch (optionSet.value) {
    case "platform":
      return platformOptions;
    case "theme":
      return themeOptions;
    default:
      return basicOptions;
  }
});

// 选中值
const selectedSingle = ref("option1");
const selectedMultiple = ref(["option1", "option3"]);

// 根据选择模式显示不同的选中值
const selectedValue = computed({
  get() {
    return multiple.value ? selectedMultiple.value : selectedSingle.value;
  },
  set(val) {
    if (multiple.value) {
      selectedMultiple.value = val;
    } else {
      selectedSingle.value = val;
    }
  },
});

// 多选值展示
const selectedMultipleDisplay = computed(() => {
  return selectedMultiple.value.join(", ");
});

// 监听选择模式变化，重置选中值
watch(multiple, (val) => {
  if (val) {
    // 切换到多选模式，默认选中第一个选项
    selectedMultiple.value = [selectedSingle.value];
  } else {
    // 切换到单选模式，选中多选中的第一个选项或默认选项
    selectedSingle.value = selectedMultiple.value[0] || options.value[0].value;
  }
});

// 监听选项集变化，重置选中值
watch(optionSet, () => {
  if (multiple.value) {
    selectedMultiple.value = [options.value[0].value];
  } else {
    selectedSingle.value = options.value[0].value;
  }
});

// 处理选中变化
const handleChange = (value) => {
  console.log("选中值变化:", value);
  ElMessage.success(`选中了: ${multiple.value ? value.join(", ") : value}`);
};

// 生成代码示例
const codeExample = computed(() => {
  let code = `<template>
  <div${useCustomStyle.value ? ' class="custom-style-container"' : ""}>
    <ScSelect
      v-model="${multiple.value ? "selectedValues" : "selectedValue"}"
      :options="options"
      ${layout.value !== "card" ? `:layout="${layout.value}"` : ""}
      ${gap.value !== 8 ? `:gap="${gap.value}"` : ""}
      ${widthValue.value !== 120 ? `:width="${width.value}"` : ""}
      ${limit.value !== 0 ? `:limit="${limit.value}"` : ""}
      ${multiple.value && layout.value === "select" && maxCollapseTags.value !== 1 ? `:max-collapse-tags="${maxCollapseTags.value}"` : ""}
      ${multiple.value ? "multiple" : ""}
      @change="handleChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 选中值
const ${multiple.value ? "selectedValues = ref(" + JSON.stringify(selectedMultiple.value) + ");" : 'selectedValue = ref("' + selectedSingle.value + '");'}

// 选项数据
const options = ${JSON.stringify(options.value, null, 2)};

// 处理选中变化
const handleChange = (value) => {
  console.log("选中值变化:", value);
};
<\/script>`;

  if (useCustomStyle.value) {
    code += `

<style scoped>
.custom-style-container :deep(.card-selector-item) {
  border-radius: 16px;
  background-color: #f0f9ff;
  border-color: #e0f2fe;
}

.custom-style-container :deep(.card-selector-item:hover) {
  background-color: #e0f2fe;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.custom-style-container :deep(.card-selector-item.active) {
  background-color: #0ea5e9;
  border-color: #0284c7;
  color: white;
}

.custom-style-container :deep(.card-selector-item.active .card-icon) {
  color: white;
}
</style>`;
  }

  return code;
});
</script>

<style scoped>
.sc-select-example {
  padding: 20px 0;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
}

.text-secondary {
  color: #909399;
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
  color: #303133;
}

.preview-container {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
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

.ml-2 {
  margin-left: 8px;
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
  color: #333;
}

.code-desc {
  margin-bottom: 8px;
}

/* 自定义样式示例 */
.custom-style :deep(.card-selector-item) {
  border-radius: 16px;
  background-color: #f0f9ff;
  border-color: #e0f2fe;
}

.custom-style :deep(.card-selector-item:hover) {
  background-color: #e0f2fe;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.custom-style :deep(.card-selector-item.active) {
  background-color: #0ea5e9;
  border-color: #0284c7;
  color: white;
}

.custom-style :deep(.card-selector-item.active .card-icon) {
  color: white;
}

.limit-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  text-align: center;
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
