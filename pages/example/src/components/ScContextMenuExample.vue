<template>
  <div class="example-container">
    <h2 class="example-title">ScContextMenu 右键菜单示例</h2>
    <p class="example-desc">
      自定义右键菜单组件，支持多级菜单、图标、分割线等功能
    </p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="context-area" @contextmenu.prevent.stop="open($event)">
        <IconifyIconOnline icon="ri:mouse-line" class="area-icon" />
        <span>在此区域点击右键打开菜单</span>
      </div>

      <ScContextMenu ref="menuRef" :menus="menus" />

      <el-divider content-position="left">菜单配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="显示图标">
              <el-switch v-model="config.showIcon" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>

    <el-divider content-position="left">菜单项配置</el-divider>

    <el-table :data="menuItemProps" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import ScContextMenu from "@repo/components/ScContextMenu/index.vue";
import CodePreview from "./CodePreview.vue";
import { ElMessage } from "element-plus";

const menuRef = ref();

const config = reactive({
  showIcon: true,
});

const menus = computed(() => [
  {
    name: "查看",
    icon: config.showIcon ? "ep:view" : "",
    handle: () => ElMessage.info("点击了查看"),
  },
  {
    name: "编辑",
    icon: config.showIcon ? "ep:edit" : "",
    handle: () => ElMessage.info("点击了编辑"),
  },
  { type: "LINE" },
  {
    name: "更多",
    icon: config.showIcon ? "ep:more-filled" : "",
    children: [
      {
        name: "导出",
        icon: config.showIcon ? "ep:download" : "",
        handle: () => ElMessage.info("点击了导出"),
      },
      {
        name: "删除",
        icon: config.showIcon ? "ep:delete" : "",
        handle: () => ElMessage.warning("点击了删除"),
      },
    ],
  },
]);

// 属性说明
const propsData = [
  {
    name: "menus",
    type: "MenuItem[]",
    default: "[]",
    description: "菜单项数组",
  },
  { name: "zIndex", type: "number", default: "1000", description: "菜单层级" },
];

// 菜单项配置
const menuItemProps = [
  { name: "name", type: "string", description: "菜单项名称" },
  { name: "icon", type: "string", description: "菜单项图标" },
  { name: "handle", type: "function", description: "点击回调函数" },
  { name: "type", type: "'LINE'", description: "设置为 LINE 表示分割线" },
  { name: "children", type: "MenuItem[]", description: "子菜单项" },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<div @contextmenu.prevent.stop="openMenu($event)">
  右键区域
</div>
<ScContextMenu ref="menuRef" :menus="menus" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScContextMenu from "@repo/components/ScContextMenu/index.vue";

const menuRef = ref();

const menus = [
  { name: "查看", icon: "ep:view", handle: () => console.log("查看") },
  { name: "编辑", icon: "ep:edit", handle: () => console.log("编辑") },
  { type: "LINE" },
  {
    name: "更多",
    icon: "ep:more-filled",
    children: [
      { name: "导出", icon: "ep:download", handle: () => console.log("导出") }
    ]
  }
];

function openMenu(e: MouseEvent) {
  menuRef.value?.open(e, {}, {});
}`,
  },
]);

function open(e) {
  menuRef.value?.open(e, {}, {});
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.context-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  cursor: context-menu;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .area-icon {
    font-size: 32px;
    color: var(--el-text-color-secondary);
  }
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>
