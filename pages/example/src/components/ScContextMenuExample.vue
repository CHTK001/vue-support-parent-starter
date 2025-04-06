<template>
  <div class="context-menu-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础上下文菜单</h3>
        <p class="example-desc">右键点击下方区域，显示自定义上下文菜单</p>

        <div class="example-row">
          <div class="context-area" @contextmenu.prevent="showBasicMenu">右键点击此区域</div>

          <ScContextMenu ref="basicMenuRef" :items="basicMenuItems" @select="handleBasicMenuSelect" />
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;div @contextmenu.prevent="showBasicMenu"&gt;
  右键点击此区域
&lt;/div&gt;

&lt;ScContextMenu 
  ref="basicMenuRef" 
  :items="basicMenuItems" 
  @select="handleBasicMenuSelect"
/&gt;

&lt;script setup&gt;
const basicMenuRef = ref(null);

const basicMenuItems = [
  { label: '查看', icon: 'ri:eye-line', key: 'view' },
  { label: '编辑', icon: 'ri:edit-line', key: 'edit' },
  { label: '删除', icon: 'ri:delete-bin-line', key: 'delete' },
];

const showBasicMenu = (e) => {
  basicMenuRef.value.show(e);
};

const handleBasicMenuSelect = (item) => {
  message(`选择了: ${item.label}`, { type: 'success' });
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="高级用法">
        <h3>分组与嵌套菜单</h3>
        <p class="example-desc">支持菜单分组和嵌套子菜单</p>

        <div class="example-row">
          <div class="context-area advanced" @contextmenu.prevent="showAdvancedMenu">右键点击此区域（高级菜单）</div>

          <ScContextMenu ref="advancedMenuRef" :items="advancedMenuItems" @select="handleAdvancedMenuSelect" />
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;div @contextmenu.prevent="showAdvancedMenu"&gt;
  右键点击此区域
&lt;/div&gt;

&lt;ScContextMenu 
  ref="advancedMenuRef" 
  :items="advancedMenuItems" 
  @select="handleAdvancedMenuSelect"
/&gt;

&lt;script setup&gt;
const advancedMenuRef = ref(null);

const advancedMenuItems = [
  { label: '文件操作', type: 'group', children: [
    { label: '打开', icon: 'ri:folder-open-line', key: 'open' },
    { label: '保存', icon: 'ri:save-line', key: 'save' },
    { label: '另存为', icon: 'ri:save-3-line', key: 'saveAs' },
  ]},
  { label: '编辑操作', type: 'group', children: [
    { label: '剪切', icon: 'ri:scissors-cut-line', key: 'cut' },
    { label: '复制', icon: 'ri:file-copy-line', key: 'copy' },
    { label: '粘贴', icon: 'ri:clipboard-line', key: 'paste' },
  ]},
  { type: 'divider' },
  { label: '更多操作', icon: 'ri:more-line', children: [
    { label: '设置', icon: 'ri:settings-line', key: 'settings' },
    { label: '帮助', icon: 'ri:question-line', key: 'help' },
  ]}
];

const showAdvancedMenu = (e) => {
  advancedMenuRef.value.show(e);
};

const handleAdvancedMenuSelect = (item) => {
  message(`选择了: ${item.label}`, { type: 'success' });
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义样式">
        <h3>自定义菜单样式</h3>
        <p class="example-desc">可以自定义菜单的样式和主题</p>

        <div class="example-row">
          <div class="context-area custom" @contextmenu.prevent="showCustomMenu">右键点击此区域（自定义样式）</div>

          <ScContextMenu ref="customMenuRef" :items="customMenuItems" class="custom-context-menu" @select="handleCustomMenuSelect" />
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;div @contextmenu.prevent="showCustomMenu"&gt;
  右键点击此区域
&lt;/div&gt;

&lt;ScContextMenu 
  ref="customMenuRef" 
  :items="customMenuItems" 
  class="custom-context-menu"
  @select="handleCustomMenuSelect"
/&gt;

&lt;style&gt;
.custom-context-menu {
  --menu-bg: #2c3e50;
  --menu-text: #ecf0f1;
  --menu-hover-bg: #34495e;
  --menu-border: #1a2530;
}
&lt;/style&gt;
        </code></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { message } from "@repo/utils";

// 基础菜单
const basicMenuRef = ref(null);

const basicMenuItems = [
  { label: "查看", icon: "ri:eye-line", key: "view" },
  { label: "编辑", icon: "ri:edit-line", key: "edit" },
  { label: "删除", icon: "ri:delete-bin-line", key: "delete" },
];

const showBasicMenu = (e) => {
  basicMenuRef.value.show(e);
};

const handleBasicMenuSelect = (item) => {
  message(`选择了: ${item.label}`, { type: "success" });
};

// 高级菜单
const advancedMenuRef = ref(null);

const advancedMenuItems = [
  {
    label: "文件操作",
    type: "group",
    children: [
      { label: "打开", icon: "ri:folder-open-line", key: "open" },
      { label: "保存", icon: "ri:save-line", key: "save" },
      { label: "另存为", icon: "ri:save-3-line", key: "saveAs" },
    ],
  },
  {
    label: "编辑操作",
    type: "group",
    children: [
      { label: "剪切", icon: "ri:scissors-cut-line", key: "cut" },
      { label: "复制", icon: "ri:file-copy-line", key: "copy" },
      { label: "粘贴", icon: "ri:clipboard-line", key: "paste" },
    ],
  },
  { type: "divider" },
  {
    label: "更多操作",
    icon: "ri:more-line",
    children: [
      { label: "设置", icon: "ri:settings-line", key: "settings" },
      { label: "帮助", icon: "ri:question-line", key: "help" },
    ],
  },
];

const showAdvancedMenu = (e) => {
  advancedMenuRef.value.show(e);
};

const handleAdvancedMenuSelect = (item) => {
  message(`选择了: ${item.label}`, { type: "success" });
};

// 自定义样式菜单
const customMenuRef = ref(null);

const customMenuItems = [{ label: "新建", icon: "ri:add-line", key: "new" }, { label: "刷新", icon: "ri:refresh-line", key: "refresh" }, { type: "divider" }, { label: "属性", icon: "ri:information-line", key: "properties" }];

const showCustomMenu = (e) => {
  customMenuRef.value.show(e);
};

const handleCustomMenuSelect = (item) => {
  message(`选择了: ${item.label}`, { type: "success" });
};
</script>

<style lang="scss" scoped>
.context-menu-example {
  padding: 20px;

  .example-desc {
    color: #666;
    margin-bottom: 20px;
  }

  .example-row {
    margin-bottom: 20px;
  }

  .context-area {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
    border-radius: 8px;
    cursor: context-menu;
    font-size: 16px;
    color: #606266;
    transition: all 0.3s;
    border: 1px dashed #dcdfe6;

    &:hover {
      background-color: #ecf5ff;
      color: #409eff;
    }

    &.advanced {
      background-color: #f0f9eb;
      &:hover {
        background-color: #e1f3d8;
        color: #67c23a;
      }
    }

    &.custom {
      background-color: #fdf6ec;
      &:hover {
        background-color: #faecd8;
        color: #e6a23c;
      }
    }
  }

  pre {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }
}

:deep(.custom-context-menu) {
  --menu-bg: #2c3e50;
  --menu-text: #ecf0f1;
  --menu-hover-bg: #34495e;
  --menu-border: #1a2530;
}
</style>
