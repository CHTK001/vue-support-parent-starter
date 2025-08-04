<template>
  <div class="panel-container">
    <!-- 面板标题区域 -->
    <div class="panel-header">
      <div class="panel-header__title">
        <IconifyIconOnline icon="ri:dashboard-line" class="mr-1" />
        <span>面板信息</span>
      </div>
      <el-button type="primary" text circle class="panel-header__refresh" :title="'刷新'" @click="handleRefreshTreeRootNode">
        <IconifyIconOnline icon="ep:refresh" />
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="panel-search">
      <el-input v-model="form.keyword" placeholder="请输入关键词搜索" clearable @input="handleKeywordChange">
        <template #prefix>
          <IconifyIconOnline icon="ep:search" />
        </template>
      </el-input>
    </div>

    <!-- 树形结构区域 -->
    <div class="panel-tree">
      <el-tree
        ref="treeRef"
        :key="treeKey"
        :data="treeData"
        :highlight-current="true"
        :filter-node-method="filterNode"
        :expand-on-click-node="false"
        :load="loadNode"
        :props="nodeProps"
        lazy
        node-key="nodeId"
        @node-click="handleNodeClick"
        @node-contextmenu="handleContextmenu"
      >
        <template #default="{ data, node }">
          <div class="panel-tree-node">
            <!-- 节点图标 -->
            <div v-if="data.nodeType != 'TREE_NODE'" class="panel-tree-node__icon">
              <IconifyIconOnline v-if="data.nodeType == 'DATABASE'" icon="ri:database-2-line" class="panel-tree-node__database" />
              <IconifyIconOnline v-else-if="data.nodeType == 'TABLE'" icon="ri:table-2" class="panel-tree-node__table" />
              <IconifyIconOnline v-else-if="data.nodeType == 'NODE'" icon="ri:node-tree" class="panel-tree-node__node" />
              <IconifyIconOnline v-else-if="data.nodeType == 'VIEW'" icon="ri:kanban-view" class="panel-tree-node__view" />
              <IconifyIconOnline v-else-if="data.nodeType == 'COLUMN'" icon="ri:layout-column-line" class="panel-tree-node__column" />
            </div>

            <!-- 节点内容 -->
            <div class="panel-tree-node__content">
              <!-- 数据类型标签 -->
              <el-tag v-if="data.dataType" size="small" class="panel-tree-node__tag" :style="{ backgroundColor: stringToColor(data.dataType?.toUpperCase()) }">
                {{ data.dataType?.toUpperCase() }}
              </el-tag>

              <!-- 节点名称 -->
              <span v-if="!visible.renameShow" class="panel-tree-node__name">
                {{ data.nodeName }}
              </span>
              <el-input v-else v-model="data.nodeName" size="small" class="panel-tree-node__input" />

              <!-- 节点注释 -->
              <span v-if="data?.nodeComment" class="panel-tree-node__comment">
                {{ data?.nodeComment }}
              </span>
            </div>

            <!-- 节点操作按钮 -->
            <div v-if="data.nodeType == 'NODE'" class="panel-tree-node__actions">
              <el-button-group>
                <el-button size="small" type="primary" text title="编辑节点" @click="handleEditNode($event, data, node)">
                  <IconifyIconOnline icon="ep:edit" />
                </el-button>
                <el-button size="small" type="success" text title="添加节点" @click="handleSaveNode($event, data, node)">
                  <IconifyIconOnline icon="ep:plus" />
                </el-button>
                <el-button size="small" type="danger" text title="删除节点" @click="handleDeleteNode($event, data, node)">
                  <IconifyIconOnline icon="ep:minus" />
                </el-button>
              </el-button-group>
            </div>
          </div>
        </template>
      </el-tree>

      <!-- 空状态 -->
      <el-empty v-if="treeDataEmpty" description="暂无数据" class="panel-tree__empty" />
    </div>

    <!-- 上下文菜单 -->
    <context-menu ref="contextMenuRef" key="menu" :menus="menuItems" />

    <!-- 注释和重命名组件 -->
    <remark ref="remarkRef" :data="data" @success="handleRemarkSuccess" />
    <rename ref="renameRef" :data="data" @success="handleRemarkSuccess" />
  </div>
</template>

<script setup>
// import { fetchGenSessionChildren, fetchGenSessionCopyTableConstruct, fetchGenSessionDropTable, fetchGenSessionKeyword } from "@/api/monitor/gen/session";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, defineProps, defineEmits, ref, computed, defineAsyncComponent, onBeforeMount, defineExpose, watch } from "vue";
import contextMenu from "@repo/components/ScContextMenu/index.vue";
import { copyTextToClipboard } from "@pureadmin/utils";
import { message } from "@repo/utils";
import { stringToColor } from "@repo/config";

// 定义组件事件
const emit = defineEmits(["node-click", "node-edit-click", "node-save-click", "node-delete-click"]);

// 异步加载子组件
const remark = defineAsyncComponent(() => import("./remark.vue"));
const rename = defineAsyncComponent(() => import("./rename.vue"));

// 组件引用
const treeRef = ref(null);
const remarkRef = ref(null);
const renameRef = ref(null);
const contextMenuRef = ref(null);

// 表单数据
const form = reactive({
  keyword: ""
});

// 树配置
const treeConfig = reactive({
  treeKey: 0
});

// 计算树的key，用于强制刷新树
const treeKey = computed(() => treeConfig.treeKey);

/**
 * 树节点配置
 */
const nodeProps = {
  label: "nodeName",
  leaf: "nodeLeaf",
  isLeaf: "nodeLeaf"
};

// 可见性控制
const visible = reactive({
  remarkShow: false,
  renameShow: false,
  mouseOverShow: {}
});

// 树数据
const treeData = reactive([]);
const treeDataEmpty = ref(false);

// 是否显示列菜单
const showMColumnMenu = ref(false);

// 组件属性
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

/**
 * 计算菜单项
 * 根据节点类型显示不同的上下文菜单
 */
const menuItems = computed(() => {
  return !showMColumnMenu.value ? menuTableItems : columnItems;
});

// 表格菜单项
const menuTableItems = reactive([
  {
    name: "刷新",
    icon: "ri:refresh-line",
    handle: (data, node) => {
      handleRefreshTreeNode(node);
    }
  },
  {
    name: "复制名称",
    icon: "ri:file-copy-2-line",
    handle: (data, node) => {
      copyTextToClipboard(data.nodeName);
      message("复制成功", { type: "success" });
    }
  },
  {
    name: "删除表",
    show: data => {
      return props.data.genType === "JDBC" && data.nodeType === "TABLE" && data.nodeName != "表";
    },
    icon: "ri:delete-bin-2-line",
    handle: (data, node) => {
      handleDeleteTale(data, node);
    }
  },
  {
    name: "重命名",
    show: data => {
      return props.data.genType === "JDBC" && data.nodeType === "TABLE" && data.nodeName != "表";
    },
    icon: "ri:edit-2-line",
    handle: (data, node) => {
      handleRenameTale(data, node);
    }
  },
  {
    name: "复制表",
    show: data => {
      return props.data.genType === "JDBC" && data.nodeType === "TABLE" && data.nodeName != "表";
    },
    icon: "ri:file-copy-2-line",
    children: [
      {
        name: "仅结构",
        icon: "ri:file-copy-2-line",
        handle: (data, node) => {
          handleCopyTableConstruct(data, node);
        }
      }
    ]
  }
]);

// 列菜单项
const columnItems = reactive([
  {
    name: "注释",
    icon: "ri:add-line",
    handle: (data, node) => {
      handleRemark(data, node);
    }
  },
  {
    name: "复制",
    icon: "ri:file-copy-2-line",
    handle: (data, node) => {
      copyTextToClipboard(data.nodeName);
      message("复制成功", { type: "success" });
    }
  }
]);

/**
 * 监听关键词变化，触发树过滤
 */
watch(
  () => form.keyword,
  val => {
    treeRef.value?.filter(val);
  }
);

/**
 * 处理关键词变化
 */
const handleKeywordChange = () => {
  if (form.keyword === "") {
    handleRefreshTreeRootNode();
  }
};

/**
 * 处理节点点击事件
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleNodeClick = (data, node) => {
  if ((data.nodeType == "TABLE" || data.nodeType == "NODE" || data.nodeType == "TREE_NODE") && data.nodeName != "表" && data.nodeName != "视图") {
    emit("node-click", data, node);
  }
};

/**
 * 处理注释事件
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleRemark = async (data, node) => {
  remarkRef.value.setData(data).setNode(node).open();
};

/**
 * 处理表重命名事件
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleRenameTale = async (data, node) => {
  renameRef.value.setRoot(props.data);
  renameRef.value.setData(data);
  renameRef.value.setNode(node);
  renameRef.value.open();
};

/**
 * 复制表结构
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleCopyTableConstruct = async (data, node) => {
  try {
    const res = await fetchGenSessionCopyTableConstruct({
      genId: props.data.genId,
      tableName: data.nodeName
    });

    if (res.code == "00000") {
      handleRefreshTreeNode(node?.parent);
      message("复制成功", { type: "success" });
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    message("操作失败", { type: "error" });
  }
};

/**
 * 删除表
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleDeleteTale = async (data, node) => {
  try {
    const res = await fetchGenSessionDropTable({
      genId: props.data.genId,
      tableName: data.nodeName
    });

    if (res.code == "00000") {
      handleRefreshTreeNode(node?.parent);
      message("删除成功", { type: "success" });
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    message("操作失败", { type: "error" });
  }
};

/**
 * 处理注释成功事件
 * @param {Object} node - 节点对象
 */
const handleRemarkSuccess = async node => {
  handleRefreshTreeNode(node.parent);
};

/**
 * 处理右键菜单事件
 * @param {Event} event - 事件对象
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleContextmenu = (event, data, node) => {
  event.preventDefault();
  if (data.nodeType === "COLUMN") {
    showMColumnMenu.value = true;
  } else {
    showMColumnMenu.value = false;
  }
  contextMenuRef.value.open(event, data, node);
};

/**
 * 处理编辑节点事件
 * @param {Event} event - 事件对象
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleEditNode = (event, data, node) => {
  event.preventDefault();
  event.stopPropagation();
  emit("node-edit-click", data, node);
};

/**
 * 处理删除节点事件
 * @param {Event} event - 事件对象
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleDeleteNode = (event, data, node) => {
  event.preventDefault();
  event.stopPropagation();
  emit("node-delete-click", data, node);
};

/**
 * 处理保存节点事件
 * @param {Event} event - 事件对象
 * @param {Object} data - 节点数据
 * @param {Object} node - 节点对象
 */
const handleSaveNode = (event, data, node) => {
  event.preventDefault();
  event.stopPropagation();
  emit("node-save-click", data, node);
};

/**
 * 刷新树根节点
 */
const handleRefreshTreeRootNode = async () => {
  treeConfig.treeKey++;
  treeRef.value.root.store.root.loaded = false;
  treeRef.value.root.store.root.expand();
};

/**
 * 刷新树节点
 * @param {Object} node - 节点对象
 */
const handleRefreshTreeNode = async node => {
  if (node) {
    node.loaded = false;
    node.expand(); // 主动调用展开节点方法，重新查询该节点下的所有子节点
  }
};

/**
 * 刷新树父节点
 * @param {Object} node - 节点对象
 */
const handleRefreshTreeParentNode = async node => {
  const parent = node.parent;
  if (parent && parent.level != 0) {
    parent.loaded = false;
    parent.expand(); // 主动调用展开节点方法，重新查询该节点下的所有子节点
  } else {
    handleRefreshTreeRootNode();
  }
};

/**
 * 加载树节点
 * @param {Object} node - 节点对象
 * @param {Function} resolve - 解析函数
 */
const loadNode = async (node, resolve) => {
  try {
    // 根节点
    if (node.level == 0) {
      const res = await fetchGenSessionKeyword({
        genId: props.data.genId
      });
      resolve(res.data || []);
      return;
    }

    // 一级节点
    if (node.level == 1) {
      const res = await fetchGenSessionChildren({
        genId: props.data.genId,
        nodeId: node.data.nodeId,
        keyword: form.keyword,
        nodeType: node.data.nodeType,
        nodeName: node.data.nodeName == "表" || node.data.nodeName == "视图" ? null : node.data.nodeName
      });
      resolve(res.data || []);
      return;
    }

    // NODE类型节点
    if (node.data.nodeType == "NODE") {
      const res = await fetchGenSessionChildren({
        genId: props.data.genId,
        nodeId: node.data.nodeId,
        keyword: form.keyword,
        nodeType: "NODE",
        nodeName: node.data.nodeName
      });
      resolve(res.data || []);
      return;
    }

    // 二级节点
    if (node.level == 2) {
      const res = await fetchGenSessionChildren({
        genId: props.data.genId,
        nodeId: node.data.nodeId,
        nodeType: "COLUMN",
        keyword: form.keyword,
        nodeName: node.data.nodeName
      });
      resolve(res.data || []);
      return;
    }

    resolve([]);
  } catch (error) {
    console.error("加载节点失败:", error);
    resolve([]);
  }
};

/**
 * 过滤树节点
 * @param {string} value - 过滤值
 * @param {Object} data - 节点数据
 * @returns {boolean} 是否显示节点
 */
const filterNode = (value, data) => {
  if (!value) return true;
  return data.nodeName.toLowerCase().includes(value.toLowerCase());
};

// 组件挂载前
onBeforeMount(async () => {
  setTimeout(() => {
    visible.remarkShow = true;
  }, 100);
});

// 导出组件方法
defineExpose({
  handleRefreshTreeNode,
  handleRefreshTreeParentNode
});
</script>

<style scoped lang="scss">
.panel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);

  &__title {
    display: flex;
    align-items: center;
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__refresh {
    transition: transform 0.3s;

    &:hover {
      transform: rotate(90deg);
    }
  }
}

.panel-search {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.panel-tree {
  flex: 1;
  overflow: auto;
  padding: 8px;

  &__empty {
    margin-top: 40px;
  }

  :deep(.el-tree) {
    background-color: transparent;
  }
}

.panel-tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-right: 8px;
    flex-shrink: 0;
  }

  &__database {
    color: var(--el-color-primary);
  }

  &__table {
    color: var(--el-color-success);
  }

  &__view {
    color: var(--el-color-warning);
  }

  &__column {
    color: var(--el-color-info);
  }

  &__node {
    color: var(--el-color-danger);
  }

  &__content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  &__tag {
    margin-right: 6px;
    color: #fff;
    font-size: 11px;
    padding: 0 4px;
    height: 20px;
    line-height: 20px;
    flex-shrink: 0;
  }

  &__name {
    font-size: 14px;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__comment {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__input {
    width: 150px;
  }

  &__actions {
    display: none;
    position: absolute;
    right: 0;
    background-color: var(--el-bg-color);
    padding-left: 8px;
  }

  &:hover &__actions {
    display: flex;
  }
}
</style>
