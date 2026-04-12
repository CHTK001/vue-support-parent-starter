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
          :accordion="!multipleExpand"
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

    <PanelContextMenu
      :items="currentMenuItems"
      :visible="menu.visible"
      :x="menu.x"
      :y="menu.y"
      @close="closeMenu"
      @select="handleMenuAction"
    />
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
import { computed, reactive } from "vue";
import type { JdbcCatalogNode } from "../api";
import PanelContextMenu, { type PanelContextMenuItem } from "./PanelContextMenu.vue";

type MenuTargetType = "catalog" | "datasource" | "field" | "table";

type MenuItem = PanelContextMenuItem;

const props = defineProps<{
  activeNodeId: string;
  catalogTree: JdbcCatalogNode[];
  collapsed: boolean;
  expandedKeys: string[];
  multipleExpand: boolean;
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
  (e: "collapse-node", node: JdbcCatalogNode): void;
  (e: "expand-node", node: JdbcCatalogNode): void;
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
    { key: "divider-datasource-danger", label: "", divider: true },
    { key: "close-connection", label: "关闭连接", danger: true },
  ],
  catalog: [
    { key: "refresh", label: "刷新数据库" },
    { key: "new-sql", label: "新建 SQL" },
    { key: "account-manage", label: "账号管理" },
    { key: "open-database-document", label: "打开文档" },
    { key: "divider-catalog-note", label: "", divider: true },
    { key: "edit-note", label: "编辑备注" },
    { key: "copy-name", label: "复制数据库名" },
  ],
  table: [
    { key: "design-table", label: "设计表" },
    { key: "new-sql", label: "新建查询" },
    { key: "edit-table", label: "编辑表" },
    { key: "open-data", label: "打开表" },
    { key: "divider-table-doc", label: "", divider: true },
    { key: "edit-note", label: "编辑备注" },
    { key: "copy-name", label: "复制表名" },
    { key: "divider-table-sql", label: "", divider: true },
    {
      key: "sql-actions",
      label: "SQL 操作",
      children: [
        { key: "sql-select", label: "生成 SELECT" },
        { key: "sql-count", label: "生成 COUNT" },
        { key: "sql-backup", label: "备份表" },
        { key: "sql-clear", label: "清空表", danger: true },
        { key: "sql-truncate", label: "截断表", danger: true },
        { key: "sql-drop", label: "删除表", danger: true },
      ],
    }
  ],
  field: [
    { key: "edit-field-note", label: "编辑备注" },
    { key: "divider-field-copy", label: "", divider: true },
    { key: "copy-name", label: "复制字段名" },
  ],
};

const IMPLEMENTED_MENU_ACTIONS = new Set([
  "refresh",
  "toggle-collapse",
  "close-connection",
  "new-sql",
  "account-manage",
  "open-database-document",
  "edit-note",
  "copy-name",
  "design-table",
  "edit-table",
  "open-data",
  "sql-select",
  "sql-count",
  "sql-clear",
  "sql-backup",
  "sql-truncate",
  "sql-drop",
  "edit-field-note",
]);

const normalizeMenuItems = (items: MenuItem[]): MenuItem[] =>
  items.map(item => {
    if (item.divider) {
      return item;
    }

    if (item.children?.length) {
      const children = normalizeMenuItems(item.children);
      return {
        ...item,
        children,
        disabled: item.disabled || children.every(child => child.disabled),
      };
    }

    return {
      ...item,
      disabled: item.disabled || !IMPLEMENTED_MENU_ACTIONS.has(item.key),
    };
  });

const currentMenuItems = computed(() =>
  normalizeMenuItems(menuItemsMap[menu.targetType] || []),
);

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

const handleMenuAction = (action: string, submenu = false) => {
  const flatItems = currentMenuItems.value.flatMap(item =>
    item.children?.length ? [item, ...item.children] : [item],
  );
  if (submenu || flatItems.find(item => item.key === action)?.disabled) {
    return;
  }
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
  emit("expand-node", node);
  if (node.nodeType === "table") {
    emit("expand-table", node);
  }
};

const handleNodeCollapse = (node: JdbcCatalogNode) => {
  emit("collapse-node", node);
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

</script>

<style scoped lang="scss">
.explorer-shell {
  overflow: hidden;
  min-height: 0;
  height: 100%;
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
  height: 100%;
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
