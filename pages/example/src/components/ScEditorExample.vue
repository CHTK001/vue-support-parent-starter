<template>
  <div class="editor-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础富文本编辑器</h3>
        <p class="example-desc">基础的富文本编辑器，支持文本格式化、插入图片等功能</p>

        <div class="example-row">
          <div class="editor-container">
            <ScEditor v-model="basicContent" height="300px" />
          </div>

          <div class="preview-container">
            <h4>编辑器内容预览：</h4>
            <div class="content-preview" v-html="basicContent"></div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScEditor v-model="basicContent" height="300px" /&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const basicContent = ref('&lt;h2&gt;欢迎使用 ScEditor 富文本编辑器&lt;/h2&gt;&lt;p&gt;这是一个功能强大的编辑器，您可以：&lt;/p&gt;&lt;ul&gt;&lt;li&gt;编辑文本格式&lt;/li&gt;&lt;li&gt;插入图片&lt;/li&gt;&lt;li&gt;创建列表&lt;/li&gt;&lt;li&gt;添加链接&lt;/li&gt;&lt;/ul&gt;');
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义工具栏">
        <h3>自定义工具栏</h3>
        <p class="example-desc">可以自定义编辑器工具栏，只显示需要的功能按钮</p>

        <div class="example-row">
          <div class="toolbar-options">
            <h4>选择工具栏选项：</h4>
            <div class="options-container">
              <el-checkbox v-model="toolbarOptions.text">文本格式</el-checkbox>
              <el-checkbox v-model="toolbarOptions.paragraph">段落格式</el-checkbox>
              <el-checkbox v-model="toolbarOptions.align">对齐方式</el-checkbox>
              <el-checkbox v-model="toolbarOptions.list">列表</el-checkbox>
              <el-checkbox v-model="toolbarOptions.link">链接</el-checkbox>
              <el-checkbox v-model="toolbarOptions.image">图片</el-checkbox>
              <el-checkbox v-model="toolbarOptions.table">表格</el-checkbox>
              <el-checkbox v-model="toolbarOptions.code">代码块</el-checkbox>
            </div>
          </div>

          <div class="editor-container mt-4">
            <ScEditor v-model="customContent" height="300px" :toolbar="customToolbar" />
          </div>

          <div class="preview-container">
            <h4>编辑器内容预览：</h4>
            <div class="content-preview" v-html="customContent"></div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScEditor 
  v-model="content" 
  height="300px" 
  :toolbar="customToolbar" 
/&gt;

&lt;script setup&gt;
import { ref, computed } from 'vue';

const content = ref('&lt;p&gt;自定义工具栏的编辑器内容&lt;/p&gt;');

// 工具栏选项
const toolbarOptions = reactive({
  text: true,
  paragraph: true,
  align: true,
  list: true,
  link: true,
  image: false,
  table: false,
  code: false
});

// 根据选项生成自定义工具栏
const customToolbar = computed(() => {
  const toolbar = [];
  
  if (toolbarOptions.text) {
    toolbar.push(['bold', 'italic', 'underline', 'strike']);
  }
  
  if (toolbarOptions.paragraph) {
    toolbar.push([{ 'header': [1, 2, 3, 4, 5, 6, false] }]);
  }
  
  if (toolbarOptions.align) {
    toolbar.push([{ 'align': [] }]);
  }
  
  if (toolbarOptions.list) {
    toolbar.push([{ 'list': 'ordered'}, { 'list': 'bullet' }]);
  }
  
  if (toolbarOptions.link) {
    toolbar.push(['link']);
  }
  
  if (toolbarOptions.image) {
    toolbar.push(['image']);
  }
  
  if (toolbarOptions.table) {
    toolbar.push([{ 'table': [] }]);
  }
  
  if (toolbarOptions.code) {
    toolbar.push(['code-block']);
  }
  
  return toolbar;
});
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScEditor 组件 API</h3>
        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="v-model / modelValue">编辑器内容，类型: String</el-descriptions-item>
          <el-descriptions-item label="height">编辑器高度，类型: String，默认: 400px</el-descriptions-item>
          <el-descriptions-item label="placeholder">占位文本，类型: String，默认: 请输入内容...</el-descriptions-item>
          <el-descriptions-item label="toolbar">自定义工具栏配置，类型: Array，默认: 标准工具栏</el-descriptions-item>
          <el-descriptions-item label="readonly">是否只读，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="theme">编辑器主题，类型: String，默认: snow</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="update:modelValue">内容更新时触发</el-descriptions-item>
          <el-descriptions-item label="blur">编辑器失去焦点时触发</el-descriptions-item>
          <el-descriptions-item label="focus">编辑器获得焦点时触发</el-descriptions-item>
          <el-descriptions-item label="ready">编辑器初始化完成时触发</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">方法</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="focus()">使编辑器获得焦点</el-descriptions-item>
          <el-descriptions-item label="blur()">使编辑器失去焦点</el-descriptions-item>
          <el-descriptions-item label="getEditor()">获取编辑器实例</el-descriptions-item>
          <el-descriptions-item label="getLength()">获取内容长度</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import ScEditor from "@repo/components/ScEditor/index.vue";
// 基础编辑器内容
const basicContent = ref("<h2>欢迎使用 ScEditor 富文本编辑器</h2><p>这是一个功能强大的编辑器，您可以：</p><ul><li>编辑文本格式</li><li>插入图片</li><li>创建列表</li><li>添加链接</li></ul>");

// 自定义工具栏编辑器内容
const customContent = ref("<p>自定义工具栏的编辑器内容</p><p>可以根据需要显示或隐藏特定的工具栏选项</p>");

// 工具栏选项
const toolbarOptions = reactive({
  text: true,
  paragraph: true,
  align: true,
  list: true,
  link: true,
  image: false,
  table: false,
  code: false,
});

// 根据选项生成自定义工具栏
const customToolbar = computed(() => {
  const toolbar = [];

  if (toolbarOptions.text) {
    toolbar.push(["bold", "italic", "underline", "strike"]);
  }

  if (toolbarOptions.paragraph) {
    toolbar.push([{ header: [1, 2, 3, 4, 5, 6, false] }]);
  }

  if (toolbarOptions.align) {
    toolbar.push([{ align: [] }]);
  }

  if (toolbarOptions.list) {
    toolbar.push([{ list: "ordered" }, { list: "bullet" }]);
  }

  if (toolbarOptions.link) {
    toolbar.push(["link"]);
  }

  if (toolbarOptions.image) {
    toolbar.push(["image"]);
  }

  if (toolbarOptions.table) {
    toolbar.push([{ table: [] }]);
  }

  if (toolbarOptions.code) {
    toolbar.push(["code-block"]);
  }

  return toolbar;
});
</script>

<style lang="scss" scoped>
.editor-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .example-row {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
  }

  .editor-container {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
  }

  .preview-container {
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 4px;

    h4 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 500;
    }

    .content-preview {
      padding: 12px;
      background-color: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      min-height: 100px;
    }
  }

  .toolbar-options {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 12px;
    }

    .options-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  pre {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #333;
    }
  }

  .mt-4 {
    margin-top: 16px;
  }
}
</style>
