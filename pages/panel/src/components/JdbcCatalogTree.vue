<template>
  <ElCard class="explorer-shell" shadow="never">
    <template v-if="collapsed">
      <div class="collapsed-shell">
        <ElButton circle plain size="small" @click="$emit('toggle-collapse')">展</ElButton>
      </div>
    </template>

    <template v-else>
      <div class="tree-search" @contextmenu.prevent="openMenu($event, 'datasource', null)">
        <ElInput
          :model-value="searchKeyword"
          clearable
          placeholder="搜索表 / 字段"
          size="small"
          @keyup.enter="$emit('search')"
          @update:model-value="$emit('update:searchKeyword', $event)"
        />
        <ElButton :icon="Search" circle size="small" type="primary" @click="$emit('search')" />
        <ElButton :icon="RefreshRight" circle size="small" @click="$emit('refresh')" />
      </div>

      <ElScrollbar class="tree-scroll">
        <ElTree
          v-if="catalogTree.length"
          :key="treeRenderKey"
          :current-node-key="activeNodeId"
          :data="catalogTree"
          :default-expanded-keys="expandedKeys"
          :expand-on-click-node="false"
          :highlight-current="true"
          node-key="nodeId"
          @node-click="handleNodeClick"
          @node-collapse="handleNodeCollapse"
          @node-expand="handleNodeExpand"
        >
          <template #default="{ data }">
            <div
              class="tree-node"
              :class="[`tree-node--${data.nodeType}`]"
              @contextmenu.prevent="openTreeNodeMenu($event, data)"
            >
              <div class="tree-node__copy">
                <strong>{{ data.nodeName }}</strong>
                <ElTooltip :content="resolveNodeSubtitle(data)" placement="top-start">
                  <small>{{ resolveNodeSubtitle(data) }}</small>
                </ElTooltip>
              </div>

              <ElTag
                v-if="data.nodeType === 'table'"
                class="tree-node__tag"
                effect="plain"
                size="small"
                type="success"
              >
                {{ (data.children || []).length }}
              </ElTag>
              <ElTag
                v-else-if="data.nodeType === 'field'"
                class="tree-node__tag"
                effect="plain"
                size="small"
                type="warning"
              >
                {{ data.attributes?.fieldType || "Field" }}
              </ElTag>
            </div>
          </template>
        </ElTree>

        <ElEmpty
          v-else
          class="empty-state"
          description="刷新连接后显示数据库对象。"
        />
      </ElScrollbar>
    </template>

    <teleport to="body">
      <div
        v-if="menu.visible"
        class="context-menu"
        :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
      >
        <button
          v-for="item in currentMenuItems"
          :key="item.key"
          type="button"
          class="menu-item"
          :class="{ danger: item.danger }"
          @click="handleMenuAction(item.key)"
        >
          {{ item.label }}
        </button>
      </div>
    </teleport>
  </ElCard>
</template>

<script setup lang="ts">
import { RefreshRight, Search } from "@element-plus/icons-vue";
import {
  ElButton,
  ElCard,
  ElEmpty,
  ElInput,
  ElScrollbar,
  ElTag,
  ElTooltip,
  ElTree,
} from "element-plus";
import { computed, onBeforeUnmount, onMounted, reactive } from "vue";
import type { JdbcCatalogNode } from "../api";

type MenuTargetType = "catalog" | "datasource" | "field" | "table";

type MenuItem = {
  key: string;
  label: string;
  danger?: boolean;
};

const props = defineProps<{
  activeNodeId: string;
  catalogTree: JdbcCatalogNode[];
  collapsed: boolean;
  expandedKeys: string[];
  searchKeyword: string;
  sourceName: string;
}>();

const emit = defineEmits<{
  (
    e: "context-action",
    payload: {
      action: string;
      node: JdbcCatalogNode | null;
      position: { x: number; y: number };
      targetType: MenuTargetType;
    },
  ): void;
  (e: "collapse-table", node: JdbcCatalogNode): void;
  (e: "expand-table", node: JdbcCatalogNode): void;
  (e: "open-table", node: JdbcCatalogNode): void;
  (e: "refresh"): void;
  (e: "search"): void;
  (e: "toggle-collapse"): void;
  (e: "update:searchKeyword", value: string): void;
}>();

const menu = reactive<{
  node: JdbcCatalogNode | null;
  targetType: MenuTargetType;
  visible: boolean;
  x: number;
  y: number;
}>({
  node: null,
  targetType: "table",
  visible: false,
  x: 0,
  y: 0,
});

const menuItemsMap: Record<MenuTargetType, MenuItem[]> = {
  datasource: [
    { key: "refresh", label: "刷新连接" },
    { key: "toggle-collapse", label: "收起对象树" },
    { key: "close-connection", label: "关闭连接", danger: true },
  ],
  catalog: [
    { key: "refresh", label: "刷新数据库" },
    { key: "new-sql", label: "新建 SQL" },
    { key: "edit-note", label: "编辑备注" },
    { key: "copy-name", label: "复制数据库名" },
  ],
  table: [
    { key: "design-table", label: "设计表" },
    { key: "new-sql", label: "新建查询" },
    { key: "edit-table", label: "编辑表" },
    { key: "open-data", label: "打开数据" },
    { key: "edit-note", label: "编辑备注" },
    { key: "generate-doc", label: "查看文档" },
    { key: "export-word", label: "导出 Word" },
    { key: "export-pdf", label: "导出 PDF" },
    { key: "sql-select", label: "生成 SELECT" },
    { key: "sql-count", label: "生成 COUNT" },
    { key: "sql-clear", label: "生成清空表", danger: true },
    { key: "sql-backup", label: "生成备份表" },
    { key: "sql-truncate", label: "生成 TRUNCATE", danger: true },
    { key: "sql-drop", label: "生成 DROP", danger: true },
    { key: "copy-name", label: "复制表名" },
  ],
  field: [
    { key: "edit-field-note", label: "编辑备注" },
    { key: "copy-name", label: "复制字段名" },
  ],
};

const currentMenuItems = computed(() => menuItemsMap[menu.targetType] || []);

const treeRenderKey = computed(() =>
  [props.activeNodeId, props.expandedKeys.join("|"), props.catalogTree.length].join("::"),
);

const closeMenu = () => {
  menu.visible = false;
};

const openMenu = (
  event: MouseEvent,
  targetType: MenuTargetType,
  node: JdbcCatalogNode | null,
) => {
  menu.visible = true;
  menu.targetType = targetType;
  menu.node = node;
  menu.x = event.clientX;
  menu.y = event.clientY;
};

const openTreeNodeMenu = (event: MouseEvent, node: JdbcCatalogNode) => {
  const targetType = node.nodeType === "field"
    ? "field"
    : node.nodeType === "catalog"
      ? "catalog"
      : "table";
  openMenu(event, targetType, node);
};

const handleMenuAction = (action: string) => {
  emit("context-action", {
    action,
    node: menu.node,
    position: { x: menu.x, y: menu.y },
    targetType: menu.targetType,
  });
  closeMenu();
};

const handleNodeClick = (node: JdbcCatalogNode) => {
  if (node.nodeType === "table") {
    emit("open-table", node);
  }
};

const handleNodeExpand = (node: JdbcCatalogNode) => {
  if (node.nodeType === "table") {
    emit("expand-table", node);
  }
};

const handleNodeCollapse = (node: JdbcCatalogNode) => {
  if (node.nodeType === "table") {
    emit("collapse-table", node);
  }
};

const resolveNodeSubtitle = (node: JdbcCatalogNode) => {
  if (node.nodeType === "field") {
    return node.description || node.attributes?.fieldType || "字段";
  }

  if (node.nodeType === "table") {
    return node.description || "表";
  }

  return node.description || "数据库";
};

onMounted(() => {
  document.addEventListener("click", closeMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenu);
});
</script>

<style scoped lang="scss">
.explorer-shell {
  overflow: hidden;
  min-height: 100%;
  border: 1px solid rgba(135, 151, 163, 0.18);
  border-radius: 16px;
  background: linear-gradient(180deg, #f9fbfd, #f2f6f9);
}

.explorer-shell :deep(.el-card__body) {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 8px;
}

.collapsed-shell {
  display: grid;
  justify-items: center;
  align-content: start;
  min-height: 100%;
  padding-top: 6px;
}

.tree-search,
.tree-node {
  display: flex;
  gap: 6px;
}

.tree-search :deep(.el-input) {
  flex: 1;
}

.tree-scroll {
  min-height: 0;
}

.tree-node {
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 8px;
}

.tree-node__copy {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.tree-node__copy strong {
  color: #102431;
  font-size: 12px;
  font-weight: 600;
}

.tree-node__copy small {
  color: #6b7f8e;
  font-size: 11px;
  line-height: 1.3;
}

.tree-node__tag {
  flex-shrink: 0;
}

.tree-node--catalog {
  background: rgba(37, 99, 235, 0.05);
}

.tree-node--table {
  background: rgba(16, 185, 129, 0.06);
}

.tree-node--field {
  background: rgba(245, 158, 11, 0.08);
}

.empty-state {
  padding-top: 24px;
}

.context-menu {
  position: fixed;
  z-index: 40;
  display: grid;
  gap: 1px;
  min-width: 140px;
  padding: 4px;
  border: 1px solid rgba(112, 136, 151, 0.18);
  border-radius: 8px;
  background: rgba(250, 252, 255, 0.98);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
}

.menu-item {
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #173246;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover {
  background: rgba(37, 99, 235, 0.08);
}

.menu-item.danger {
  color: #b53838;
}

.explorer-shell :deep(.el-button),
.explorer-shell :deep(.el-tag) {
  border-radius: 8px;
}

.explorer-shell :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(118, 137, 150, 0.14) inset;
}

.explorer-shell :deep(.el-tree) {
  background: transparent;
}

.explorer-shell :deep(.el-tree-node__content) {
  height: auto;
  padding: 1px 0;
  border-radius: 8px;
}

.explorer-shell :deep(.el-tree-node:focus > .el-tree-node__content),
.explorer-shell :deep(.el-tree-node__content:hover) {
  background: rgba(37, 99, 235, 0.06);
}

.explorer-shell :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background: rgba(37, 99, 235, 0.1);
}
</style>
