<template>
  <div class="sc-select-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础用法</h3>
        <p class="example-desc">基础的卡片选择器，支持图标和标签的展示</p>

        <div class="example-block">
          <ScSelect v-model="selectedValue" :options="options" :columns="3" @change="handleChange" />
          <div class="mt-4">
            <p>
              当前选中值: <strong>{{ selectedValue }}</strong>
            </p>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScSelect
  v-model="selectedValue"
  :options="options"
  :columns="3"
  @change="handleChange"
/&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const selectedValue = ref('option1');

const options = [
  { label: '选项一', value: 'option1', icon: 'ep:menu' },
  { label: '选项二', value: 'option2', icon: 'ep:edit' },
  { label: '选项三', value: 'option3', icon: 'ep:setting' },
  { label: '选项四', value: 'option4', icon: 'ep:user' },
  { label: '选项五', value: 'option5', icon: 'ep:message' },
  { label: '选项六', value: 'option6', icon: 'ep:star' },
];

const handleChange = (value) => {
  console.log('选中值变化:', value);
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="布局设置">
        <h3>布局设置</h3>
        <p class="example-desc">可以自定义每行显示的卡片数量和卡片间距</p>

        <div class="example-block">
          <div class="control-panel mb-4">
            <div class="control-item">
              <span>每行列数：</span>
              <el-slider v-model="columns" :min="1" :max="6" :step="1" show-stops />
            </div>

            <div class="control-item">
              <span>卡片间距：</span>
              <el-slider v-model="gap" :min="4" :max="24" :step="4" show-stops />
            </div>
          </div>

          <ScSelect v-model="selectedLayout" :options="options" :columns="columns" :gap="gap" />
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScSelect
  v-model="selectedLayout"
  :options="options"
  :columns="columns"
  :gap="gap"
/&gt;

&lt;script setup&gt;
const columns = ref(4);
const gap = ref(12);
const selectedLayout = ref('option1');
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义样式">
        <h3>自定义样式</h3>
        <p class="example-desc">通过CSS变量自定义卡片选择器的样式</p>

        <div class="example-block">
          <div class="custom-style-select">
            <ScSelect v-model="selectedCustom" :options="customOptions" :columns="3" />
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;div class="custom-style-select"&gt;
  &lt;ScSelect
    v-model="selectedCustom"
    :options="customOptions"
    :columns="3"
  /&gt;
&lt;/div&gt;

&lt;style scoped&gt;
.custom-style-select :deep(.card-selector-item) {
  border-radius: 16px;
  height: 110px;
  background-color: #f0f9ff;
  border-color: #e0f2fe;
}

.custom-style-select :deep(.card-selector-item:hover) {
  background-color: #e0f2fe;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.custom-style-select :deep(.card-selector-item.active) {
  background-color: #0ea5e9;
  border-color: #0284c7;
  color: white;
}

.custom-style-select :deep(.card-selector-item.active .card-icon) {
  color: white;
}
&lt;/style&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="主题场景">
        <h3>主题场景</h3>
        <p class="example-desc">不同主题场景下的卡片选择器</p>

        <div class="example-block">
          <h4>主题选择</h4>
          <div class="theme-select">
            <ScSelect v-model="selectedTheme" :options="themeOptions" :columns="4" />
          </div>

          <h4 class="mt-4">功能选择</h4>
          <div class="feature-select">
            <ScSelect v-model="selectedFeature" :options="featureOptions" :columns="3" />
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;h4&gt;主题选择&lt;/h4&gt;
&lt;div class="theme-select"&gt;
  &lt;ScSelect
    v-model="selectedTheme"
    :options="themeOptions"
    :columns="4"
  /&gt;
&lt;/div&gt;

&lt;h4 class="mt-4"&gt;功能选择&lt;/h4&gt;
&lt;div class="feature-select"&gt;
  &lt;ScSelect
    v-model="selectedFeature"
    :options="featureOptions"
    :columns="3"
  /&gt;
&lt;/div&gt;

&lt;script setup&gt;
const selectedTheme = ref('light');
const selectedFeature = ref('dashboard');

const themeOptions = [
  { label: '明亮模式', value: 'light', icon: 'ep:sunny' },
  { label: '暗黑模式', value: 'dark', icon: 'ep:moon' },
  { label: '蓝色主题', value: 'blue', icon: 'ep:cold-drink' },
  { label: '绿色主题', value: 'green', icon: 'ep:cherry' },
];

const featureOptions = [
  { label: '仪表盘', value: 'dashboard', icon: 'ep:odometer' },
  { label: '数据分析', value: 'analysis', icon: 'ep:data-line' },
  { label: '用户管理', value: 'users', icon: 'ep:user' },
];
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="多选模式">
        <h3>多选模式</h3>
        <p class="example-desc">通过设置 multiple 属性启用多选模式，此时 v-model 绑定值为数组类型</p>

        <div class="example-block">
          <ScSelect v-model="selectedMultiple" :options="options" :columns="3" multiple @change="handleMultipleChange" />
          <div class="mt-4">
            <p>
              当前选中值: <strong>{{ selectedMultiple.join(", ") }}</strong>
            </p>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScSelect
  v-model="selectedMultiple"
  :options="options"
  :columns="3"
  multiple
  @change="handleMultipleChange"
/&gt;

&lt;script setup&gt;
import { ref } from 'vue';

// 初始化为空数组或预设选中值
const selectedMultiple = ref(['option1', 'option3']);

const options = [
  { label: '选项一', value: 'option1', icon: 'ep:menu' },
  { label: '选项二', value: 'option2', icon: 'ep:edit' },
  { label: '选项三', value: 'option3', icon: 'ep:setting' },
  { label: '选项四', value: 'option4', icon: 'ep:user' },
  { label: '选项五', value: 'option5', icon: 'ep:message' },
  { label: '选项六', value: 'option6', icon: 'ep:star' },
];

const handleMultipleChange = (values) => {
  console.log('多选值变化:', values);
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="布局类型">
        <h3>布局类型</h3>
        <p class="example-desc">ScSelect组件支持多种布局类型，通过layout属性进行设置</p>

        <div class="example-block">
          <div class="control-panel mb-4">
            <span>选择布局类型：</span>
            <el-radio-group v-model="currentLayout">
              <el-radio-button label="card">卡片布局</el-radio-button>
              <el-radio-button label="list">列表布局</el-radio-button>
              <el-radio-button label="compact">紧凑布局</el-radio-button>
              <el-radio-button label="grid">网格布局</el-radio-button>
            </el-radio-group>
          </div>

          <ScSelect v-model="selectedLayoutType" :options="layoutOptions" :columns="layoutColumns" :layout="currentLayout" />
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScSelect
  v-model="selectedValue"
  :options="options"
  :columns="3"
  layout="card"
/&gt;

&lt;!-- 列表布局 --&gt;
&lt;ScSelect
  v-model="selectedValue"
  :options="options"
  layout="list"
/&gt;

&lt;!-- 紧凑布局 --&gt;
&lt;ScSelect
  v-model="selectedValue"
  :options="options"
  :columns="4"
  layout="compact"
/&gt;

&lt;!-- 网格布局 --&gt;
&lt;ScSelect
  v-model="selectedValue"
  :options="options"
  :columns="3"
  layout="grid"
/&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="多选模式">
        <h3>多选模式</h3>
        <p class="example-desc">通过设置 multiple 属性启用多选模式，此时 v-model 绑定值为数组类型</p>

        <div class="example-block">
          <ScSelect v-model="selectedMultiple" :options="options" :columns="3" multiple @change="handleMultipleChange" />
          <div class="mt-4">
            <p>
              当前选中值: <strong>{{ selectedMultiple.join(", ") }}</strong>
            </p>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScSelect
  v-model="selectedMultiple"
  :options="options"
  :columns="3"
  multiple
  @change="handleMultipleChange"
/&gt;

&lt;script setup&gt;
import { ref } from 'vue';

// 初始化为空数组或预设选中值
const selectedMultiple = ref(['option1', 'option3']);

const options = [
  { label: '选项一', value: 'option1', icon: 'ep:menu' },
  { label: '选项二', value: 'option2', icon: 'ep:edit' },
  { label: '选项三', value: 'option3', icon: 'ep:setting' },
  { label: '选项四', value: 'option4', icon: 'ep:user' },
  { label: '选项五', value: 'option5', icon: 'ep:message' },
  { label: '选项六', value: 'option6', icon: 'ep:star' },
];

const handleMultipleChange = (values) => {
  console.log('多选值变化:', values);
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScSelect 组件 API</h3>
        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="modelValue / v-model">绑定值，类型：String / Number / Array，默认：''，多选模式下为数组</el-descriptions-item>
          <el-descriptions-item label="options">选项数组，类型：Array，必填，每个选项包含 label、value 和 icon 属性</el-descriptions-item>
          <el-descriptions-item label="columns">每行显示的卡片数量，类型：Number，默认：3</el-descriptions-item>
          <el-descriptions-item label="gap">卡片间距，类型：Number，默认：12</el-descriptions-item>
          <el-descriptions-item label="layout">布局类型，类型：String，可选值：card/list/compact/grid，默认：card</el-descriptions-item>
          <el-descriptions-item label="multiple">是否启用多选模式，类型：Boolean，默认：false</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="update:modelValue">绑定值变化时触发，参数：新的值</el-descriptions-item>
          <el-descriptions-item label="change">选中值变化时触发，参数：新的值</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">选项对象格式</h4>
        <pre><code class="language-javascript">
{
  label: '选项标签',  // 显示的文本
  value: 'option1',   // 选项的值
  icon: 'ep:menu'     // 图标名称（使用Iconify图标）
}
        </code></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import ScSelect from "@repo/components/ScSelect/index.vue";

// 基础用法
const selectedValue = ref("option1");

// 多选模式
const selectedMultiple = ref(["option1", "option3"]);

const options = [
  { label: "选项一", value: "option1", icon: "ep:menu" },
  { label: "选项二", value: "option2", icon: "ep:edit" },
  { label: "选项三", value: "option3", icon: "ep:setting" },
  { label: "选项四", value: "option4", icon: "ep:user" },
  { label: "选项五", value: "option5", icon: "ep:message" },
  { label: "选项六", value: "option6", icon: "ep:star" },
];

const handleChange = (value) => {
  console.log("选中值变化:", value);
  ElMessage.success(`选中了: ${value}`);
};

// 多选模式变化处理
const handleMultipleChange = (values) => {
  console.log("多选值变化:", values);
  ElMessage.success(`多选值: ${values.join(", ")}`);
};

// 布局设置
const columns = ref(4);
const gap = ref(12);
const selectedLayout = ref("option1");

// 自定义样式
const selectedCustom = ref("design");

const customOptions = [
  { label: "设计", value: "design", icon: "ep:brush" },
  { label: "开发", value: "develop", icon: "ep:cpu" },
  { label: "测试", value: "test", icon: "ep:aim" },
  { label: "部署", value: "deploy", icon: "ep:upload" },
  { label: "监控", value: "monitor", icon: "ep:monitor" },
  { label: "维护", value: "maintain", icon: "ep:tools" },
];

// 布局类型示例
const currentLayout = ref("card");
const selectedLayoutType = ref("option1");
const layoutColumns = ref(3);

const layoutOptions = [
  { label: "选项一", value: "option1", icon: "ep:menu" },
  { label: "选项二", value: "option2", icon: "ep:edit" },
  { label: "选项三", value: "option3", icon: "ep:setting" },
  { label: "选项四", value: "option4", icon: "ep:user" },
  { label: "选项五", value: "option5", icon: "ep:message" },
  { label: "选项六", value: "option6", icon: "ep:star" },
];

// 主题场景
const selectedTheme = ref("light");
const selectedFeature = ref("dashboard");

const themeOptions = [
  { label: "明亮模式", value: "light", icon: "ep:sunny" },
  { label: "暗黑模式", value: "dark", icon: "ep:moon" },
  { label: "蓝色主题", value: "blue", icon: "ep:cold-drink" },
  { label: "绿色主题", value: "green", icon: "ep:cherry" },
];

const featureOptions = [
  { label: "仪表盘", value: "dashboard", icon: "ep:odometer" },
  { label: "数据分析", value: "analysis", icon: "ep:data-line" },
  { label: "用户管理", value: "users", icon: "ep:user" },
];
</script>

<style scoped>
.sc-select-example {
  padding: 20px 0;
}

.example-desc {
  color: #666;
  margin-bottom: 20px;
}

.example-block {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  font-family: Consolas, Monaco, "Andale Mono", monospace;
  font-size: 14px;
  color: #333;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 300px;
}

/* 自定义样式示例 */
.custom-style-select :deep(.card-selector-item) {
  border-radius: 16px;
  height: 110px;
  background-color: #f0f9ff;
  border-color: #e0f2fe;
}

.custom-style-select :deep(.card-selector-item:hover) {
  background-color: #e0f2fe;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.custom-style-select :deep(.card-selector-item.active) {
  background-color: #0ea5e9;
  border-color: #0284c7;
  color: white;
}

.custom-style-select :deep(.card-selector-item.active .card-icon) {
  color: white;
}

/* 主题选择样式 */
.theme-select :deep(.card-selector-item) {
  border-radius: 8px;
}

.theme-select :deep(.card-icon) {
  font-size: 32px;
}

/* 功能选择样式 */
.feature-select :deep(.card-selector-item) {
  border-radius: 12px;
  border-width: 2px;
}

.feature-select :deep(.card-selector-item.active) {
  background-color: rgba(var(--el-color-primary-rgb), 0.1);
  box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.2);
}
</style>
