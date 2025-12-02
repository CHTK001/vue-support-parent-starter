<template>
  <div class="sc-select-example" :class="{ 'el-dark': isDarkMode }">
    <div class="example-content">
      <!-- 左侧预览区域 -->
      <div class="preview-area">
        <h4>组件预览{{ layout }}</h4>
        <div
          class="preview-container"
          :class="{ 'custom-style': useCustomStyle, dark: isDarkMode }"
        >
          <ScSelect
            v-model="selectedValue"
            :options="options"
            :url="mockTableUrl"
            :gap="gap"
            :is-remote="isRemote"
            :layout="layout"
            :multiple="showFilterDemo ? true : multiple"
            :limit="limit"
            :max-collapse-tags="maxCollapseTags"
            :width="width"
            :icon-position="iconPosition"
            :filter-output-format="
              showFilterDemo ? filterOutputFormat : undefined
            "
            @change="handleChange"
          />

          <div class="result-display mt-4">
            <el-alert
              v-if="showFilterDemo"
              :title="`过滤器选中值: ${filterSelectedValue.join(', ')}`"
              type="success"
              :closable="false"
            />
            <el-alert
              v-else-if="!multiple"
              :title="`当前选中值: ${selectedValue}`"
              type="success"
              :closable="false"
            />
            <el-alert
              v-else
              :title="`当前选中值: ${selectedMultipleDisplay}`"
              type="success"
              :closable="false"
            />
          </div>

          <!-- 输出格式展示 -->
          <div
            v-if="showFilterDemo && outputFormatDisplay"
            class="output-format-display mt-4"
          >
            <h5>{{ filterOutputFormat.toUpperCase() }}格式输出:</h5>
            <pre
              class="output-code"
            ><code>{{ outputFormatDisplay }}</code></pre>
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
                { value: 'select', label: '默认' },
                { value: 'card', label: '卡片' },
                { value: 'pill', label: '长条' },
                { value: 'dropdown', label: '下拉' },
                { value: 'tree', label: '树形' },
                { value: 'table', label: '表格下拉' },
              ]"
            />
          </el-form-item>

          <el-form-item label="选择模式">
            <el-switch
              v-model="multiple"
              active-text="多选"
              inactive-text="单选"
            />
          </el-form-item>

          <el-form-item v-if="layout === 'card'" label="图标位置">
            <el-radio-group v-model="iconPosition">
              <el-radio label="center">居中</el-radio>
              <el-radio label="top">顶部突出</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="UI主题">
            <el-radio-group v-model="isDarkMode">
              <el-radio :label="false">亮色</el-radio>
              <el-radio :label="true">暗色</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="自定义样式">
            <el-switch
              v-model="useCustomStyle"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>

          <el-form-item label="卡片宽度">
            <el-input-number
              v-model="widthValue"
              :min="80"
              :max="300"
              :step="10"
              @change="updateWidth"
            />
            <span class="ml-2">px</span>
          </el-form-item>

          <el-form-item label="卡片间距">
            <el-slider v-model="gap" :min="4" :max="24" :step="4" show-stops />
          </el-form-item>

          <el-form-item label="多选限制数量" :disabled="!multiple">
            <el-tooltip
              content="多选模式下最多可选择的选项数量，0表示不限制"
              placement="top"
              :disabled="!multiple"
            >
              <div>
                <el-slider
                  v-model="limit"
                  :min="0"
                  :max="10"
                  :step="1"
                  show-stops
                  :disabled="!multiple"
                />
                <div class="limit-hint">
                  {{ limit === 0 ? "不限制" : `最多选择 ${limit} 项` }}
                </div>
              </div>
            </el-tooltip>
          </el-form-item>

          <el-form-item
            label="标签显示数量"
            :disabled="!multiple || layout !== 'select'"
          >
            <el-tooltip
              content="select布局下多选模式最多显示的标签数量"
              placement="top"
              :disabled="!multiple || layout !== 'select'"
            >
              <div>
                <el-slider
                  v-model="maxCollapseTags"
                  :min="1"
                  :max="5"
                  :step="1"
                  show-stops
                  :disabled="!multiple || layout !== 'select'"
                />
                <div class="limit-hint">
                  最多显示 {{ maxCollapseTags }} 个标签
                </div>
              </div>
            </el-tooltip>
          </el-form-item>

          <el-form-item label="演示模式">
            <el-switch
              v-model="showFilterDemo"
              active-text="过滤器模式"
              inactive-text="普通选择器"
              class="w-100"
            />
          </el-form-item>

          <el-form-item v-if="!showFilterDemo" label="选项集合">
            <el-segmented
              v-model="optionSet"
              class="w-100"
              :options="[
                { value: 'basic', label: '基础选项' },
                { value: 'platform', label: '平台选项' },
                { value: 'theme', label: '主题选项' },
                { value: 'social', label: '社交媒体' },
                { value: 'httpIcon', label: 'HTTP图标' },
                { value: 'tableData', label: '表格数据' },
                { value: 'remote', label: '远程数据' },
              ]"
            />
          </el-form-item>

          <el-form-item v-if="showFilterDemo" label="输出格式">
            <el-select v-model="filterOutputFormat" class="w-100">
              <el-option label="Default格式" value="default" />
              <el-option label="Array格式" value="array" />
              <el-option label="SQL格式" value="sql" />
              <el-option label="Lucene格式" value="lucene" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 代码示例 -->
    <div class="code-example mt-4">
      <CodeDisplay
        :code="codeExample"
        language="html"
        title="代码示例"
        description="根据当前配置生成的代码示例"
      />
    </div>
  </div>
</template>

<script setup>
import ScSelect from "@repo/components/ScSelect/index.vue";
import { message } from "@repo/utils";
import { computed, ref, watch } from "vue";
import CodeDisplay from "./CodeDisplay.vue";
// 主题设置
const isDarkMode = ref(false);
const isRemote = computed(() => {
  return optionSet.value === "remote";
});
// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
};

// 配置选项
const layout = ref("card");
const columnsType = ref("auto");
const columnsValue = ref(3);
const columns = computed(() =>
  columnsType.value === "auto" ? "auto" : columnsValue.value
);
const gap = ref(8);
const multiple = ref(false);
const useCustomStyle = ref(false);
const optionSet = ref("basic");
const limit = ref(0);
const maxCollapseTags = ref(1);
const widthValue = ref(120);
const width = ref("120px");
const iconPosition = ref("center");
const filterOutputFormat = ref("default");
const showFilterDemo = ref(false);

// 模拟表格数据API
const mockTableUrl = async (params) => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 模拟数据
  const allData = [
    {
      id: 1,
      label: "张三",
      value: "user1",
      department: "技术部",
      position: "前端工程师",
      experience: "3年",
      status: "在职",
    },
    {
      id: 2,
      label: "李四",
      value: "user2",
      department: "产品部",
      position: "产品经理",
      experience: "5年",
      status: "在职",
    },
    {
      id: 3,
      label: "王五",
      value: "user3",
      department: "设计部",
      position: "UI设计师",
      experience: "2年",
      status: "在职",
    },
    {
      id: 4,
      label: "赵六",
      value: "user4",
      department: "技术部",
      position: "后端工程师",
      experience: "4年",
      status: "离职",
    },
    {
      id: 5,
      label: "钱七",
      value: "user5",
      department: "运营部",
      position: "运营专员",
      experience: "1年",
      status: "在职",
    },
    {
      id: 6,
      label: "孙八",
      value: "user6",
      department: "技术部",
      position: "全栈工程师",
      experience: "6年",
      status: "在职",
    },
    {
      id: 7,
      label: "周九",
      value: "user7",
      department: "测试部",
      position: "测试工程师",
      experience: "3年",
      status: "在职",
    },
    {
      id: 8,
      label: "吴十",
      value: "user8",
      department: "技术部",
      position: "架构师",
      experience: "8年",
      status: "在职",
    },
  ];

  // 模拟搜索过滤
  let filteredData = allData;
  if (params?.keywords) {
    filteredData = allData.filter(
      (item) =>
        item.label.includes(params.keywords) ||
        item.department.includes(params.keywords) ||
        item.position.includes(params.keywords)
    );
  }

  if (params?.page) {
    // 模拟分页
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    const pageData = filteredData.slice(start, end);

    return {
      data: pageData,
      total: filteredData.length,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
  return {
    data: filteredData,
    total: filteredData.length,
  };
};

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

const socialOptions = [
  { label: "微信", value: "wechat", icon: "ri:wechat-fill" },
  { label: "微博", value: "weibo", icon: "ri:weibo-fill" },
  { label: "QQ", value: "qq", icon: "ri:qq-fill" },
  { label: "钉钉", value: "dingtalk", icon: "ri:dingding-fill" },
  { label: "抖音", value: "tiktok", icon: "ri:tiktok-fill" },
  { label: "知乎", value: "zhihu", icon: "ri:zhihu-fill" },
  { label: "小红书", value: "xiaohongshu", icon: "ri:book-2-fill" },
  { label: "飞书", value: "feishu", icon: "ri:message-3-fill" },
  { label: "推特", value: "twitter", icon: "ri:twitter-fill" },
  { label: "脸书", value: "facebook", icon: "ri:facebook-fill" },
  { label: "领英", value: "linkedin", icon: "ri:linkedin-box-fill" },
  { label: "油管", value: "youtube", icon: "ri:youtube-fill" },
];

const httpIconOptions = [
  { label: "GitHub", value: "github", icon: "https://github.com/favicon.ico" },
  {
    label: "Google",
    value: "google",
    icon: "https://www.google.com/favicon.ico",
  },
  { label: "百度", value: "baidu", icon: "https://www.baidu.com/favicon.ico" },
  { label: "默认图标", value: "default" }, // 测试默认图标
  { label: "Remix图标", value: "remix", icon: "ri:github-fill" }, // 测试ri:格式
];

// 表格数据选项
const tableDataOptions = [
  {
    label: "张三",
    value: "user1",
    department: "技术部",
    position: "前端工程师",
    experience: "3年",
    status: "在职",
  },
  {
    label: "李四",
    value: "user2",
    department: "产品部",
    position: "产品经理",
    experience: "5年",
    status: "在职",
  },
  {
    label: "王五",
    value: "user3",
    department: "设计部",
    position: "UI设计师",
    experience: "2年",
    status: "在职",
  },
  {
    label: "赵六",
    value: "user4",
    department: "技术部",
    position: "后端工程师",
    experience: "4年",
    status: "离职",
  },
  {
    label: "钱七",
    value: "user5",
    department: "运营部",
    position: "运营专员",
    experience: "1年",
    status: "在职",
  },
  {
    label: "孙八",
    value: "user6",
    department: "技术部",
    position: "全栈工程师",
    experience: "6年",
    status: "在职",
  },
];

// 表格列配置
const tableColumns = [
  { prop: "label", label: "姓名", width: 100, show: true },
  { prop: "department", label: "部门", width: 100, show: true },
  { prop: "position", label: "职位", width: 120, show: true },
  { prop: "experience", label: "经验", width: 80, show: true },
  { prop: "status", label: "状态", width: 80, show: true },
];

// 过滤器演示选项
const filterOptions = [
  { label: "前端开发", value: "frontend", field: "category", operator: "eq" },
  { label: "后端开发", value: "backend", field: "category", operator: "eq" },
  { label: "移动开发", value: "mobile", field: "category", operator: "eq" },
  { label: "数据分析", value: "data", field: "category", operator: "eq" },
  { label: "人工智能", value: "ai", field: "category", operator: "eq" },
  { label: "云计算", value: "cloud", field: "category", operator: "eq" },
];

// 动态选项
const options = computed(() => {
  if (showFilterDemo.value) {
    return filterOptions;
  }
  switch (optionSet.value) {
    case "platform":
      return platformOptions;
    case "theme":
      return themeOptions;
    case "social":
      return socialOptions;
    case "httpIcon":
      return httpIconOptions;
    case "tableData":
      return tableDataOptions;
    case "remote":
      return [];
    default:
      return basicOptions;
  }
});

// 选中值
const selectedSingle = ref("option1");
const selectedMultiple = ref(["option1", "option3"]);
const filterSelectedValue = ref(["frontend", "backend"]);

// 输出格式展示
const outputFormatDisplay = computed(() => {
  if (!showFilterDemo.value) return null;

  const value = filterSelectedValue.value;
  const selectedOptions = filterOptions.filter((opt) =>
    value.includes(opt.value)
  );

  switch (filterOutputFormat.value) {
    case "array":
      return JSON.stringify(value, null, 2);
    case "sql":
      if (selectedOptions.length === 0) return "";
      const sqlConditions = selectedOptions.map(
        (opt) => `${opt.field} ${opt.operator} '${opt.value}'`
      );
      return sqlConditions.join(" OR ");
    case "lucene":
      if (selectedOptions.length === 0) return "";
      const luceneConditions = selectedOptions.map(
        (opt) => `${opt.field}:${opt.value}`
      );
      return luceneConditions.join(" OR ");
    default: // default
      return JSON.stringify(
        selectedOptions.map((opt) => ({
          label: opt.label,
          value: opt.value,
          field: opt.field,
          operator: opt.operator,
        })),
        null,
        2
      );
  }
});

// 根据选择模式显示不同的选中值
const selectedValue = computed({
  get() {
    if (showFilterDemo.value) {
      return filterSelectedValue.value;
    }
    return multiple.value ? selectedMultiple.value : selectedSingle.value;
  },
  set(val) {
    if (showFilterDemo.value) {
      filterSelectedValue.value = val;
    } else if (multiple.value) {
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
    if (options.value.length > 0) {
      selectedSingle.value = options.value[0].value;
    }
  }
});

// 监听布局变化
watch(layout, (newLayout) => {
  // 药丸布局更适合显示社交媒体图标
  if (newLayout === "pill" && optionSet.value !== "social") {
    optionSet.value = "social";
  }
  // 表格布局更适合显示表格数据
  if (newLayout === "select-table" && optionSet.value !== "tableData") {
    optionSet.value = "tableData";
  }
});

// 处理选中变化
const handleChange = (value) => {
  console.log("选中值变化:", value);
  message.success(`选中了: ${multiple.value ? value.join(", ") : value}`);
};

// 生成代码示例
const codeExample = computed(() => {
  const isMultiple = showFilterDemo.value ? true : multiple.value;
  const modelName = showFilterDemo.value
    ? "filterValue"
    : isMultiple
      ? "selectedValues"
      : "selectedValue";

  let code = `<template>
  <div${useCustomStyle.value ? ' class="custom-style-container"' : ""}>
    <ScSelect
      v-model="${modelName}"
      :options="options"
      ${layout.value === "select-table" ? ':columns="columns"' : ""}
      ${layout.value !== "card" ? `:layout="${layout.value}"` : ""}
      ${gap.value !== 8 ? `:gap="${gap.value}"` : ""}
      ${widthValue.value !== 120 ? `:width="${width.value}"` : ""}
      ${layout.value === "card" && iconPosition.value !== "center" ? `:icon-position="${iconPosition.value}"` : ""}
      ${limit.value !== 0 ? `:limit="${limit.value}"` : ""}
      ${isMultiple && layout.value === "select" && maxCollapseTags.value !== 1 ? `:max-collapse-tags="${maxCollapseTags.value}"` : ""}
      ${isMultiple ? "multiple" : ""}
      ${showFilterDemo.value ? `:filter-output-format="${filterOutputFormat.value}"` : ""}
      ${layout.value === "select-table" ? `:table-columns="tableColumns"` : ""}
      ${layout.value === "select-table" ? `:table-url="mockTableUrl"` : ""}
      ${layout.value === "select-table" ? `:table-params="tableParams"` : ""}
      ${layout.value === "select-table" ? `:table-keywords="'keywords'"` : ""}
      ${layout.value === "select-table" ? `:table-placeholder="'请选择用户'"` : ""}
      ${layout.value === "select-table" ? `:table-loading="false"` : ""}
      ${layout.value === "select-table" ? `@selection-change="handleTableSelectionChange"` : ""}
      ${layout.value === "select-table" ? `@search="handleTableSearch"` : ""}
      ${layout.value === "select-table" ? `@page-change="handleTablePageChange"` : ""}
      @change="handleChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 选中值
const ${showFilterDemo.value ? "filterValue = ref(" + JSON.stringify(filterSelectedValue.value) + ");" : isMultiple ? "selectedValues = ref(" + JSON.stringify(selectedMultiple.value) + ");" : 'selectedValue = ref("' + selectedSingle.value + '");'}

// 选项数据
const options = ${JSON.stringify(options.value, null, 2)};

${
  layout.value === "select-table"
    ? `// 表格列配置
const tableColumns = ${JSON.stringify(tableColumns, null, 2)};

// 表格查询参数
const tableParams = ref({
  page: 1,
  pageSize: 10
});

// 模拟表格数据API
const mockTableUrl = async (params) => {
  // 模拟API调用
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return response.json();
};`
    : ""
}

// 处理选中变化
const handleChange = (value) => {
  console.log("选中值变化:", value);
  ${showFilterDemo.value ? `console.log("输出格式: ${filterOutputFormat.value}", value);` : ""}
};

${
  layout.value === "select-table"
    ? `// 表格选择器事件处理
const handleTableSelectionChange = (selection) => {
  console.log("表格选择变化:", selection);
};

const handleTableSearch = (keywords) => {
  console.log("表格搜索:", keywords);
};

const handleTablePageChange = (page) => {
  console.log("表格分页变化:", page);
  tableParams.value.page = page;
};`
    : ""
}
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
  color: var(--el-text-color-primary);
}

.custom-style-container :deep(.card-selector-item.active .card-icon) {
  color: var(--el-text-color-primary);
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
  width: 700px;
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
  transition: all 0.3s ease;
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

/* 自定义样式示例 */
.custom-style :deep(.card-selector-item) {
  border-radius: 16px;
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.custom-style :deep(.card-selector-item:hover) {
  background-color: var(--el-color-primary-light-8);
  transform: translateY(-4px);
  box-shadow: var(--el-box-shadow);
}

.custom-style :deep(.card-selector-item.active) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary-dark-2);
  color: #fff;
}

.custom-style :deep(.card-selector-item.active .card-icon) {
  color: #fff;
}

.limit-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  text-align: center;
}

.output-format-display {
  margin-top: 16px;
}

.output-format-display h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.output-code {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 12px;
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
}

.output-code code {
  color: var(--el-text-color-primary);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

/* 暗黑模式样式 - 使用 html.dark 选择器 */
html.dark {
  .preview-container {
    background-color: var(--el-fill-color-dark);
    border-color: var(--el-border-color);
  }

  pre {
    background-color: var(--el-fill-color-darker);
  }

  .output-code {
    background-color: var(--el-fill-color-darker);
    border-color: var(--el-border-color);
  }
}

/* 自定义样式示例 - 药丸样式 */
.custom-style :deep(.pill-selector-item) {
  border-radius: 24px;
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.custom-style :deep(.pill-selector-item:hover) {
  background-color: var(--el-color-primary-light-8);
  transform: translateY(-4px);
  box-shadow: var(--el-box-shadow);
}

.custom-style :deep(.pill-selector-item.active) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary-dark-2);
  color: #fff;
}

.custom-style :deep(.pill-selector-item.active .pill-icon) {
  background-color: var(--el-bg-color-overlay);
  color: var(--el-color-primary);
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
