<template>
  <div class="overflow-hidden">
    <div class="w-full text-gray-500 p-2">
      面板信息
      <el-icon class="cursor-pointer" @click="handleRefreshTreeRootNode">
        <component :is="useRenderIcon('ep:refresh')" />
      </el-icon>
    </div>
    <div class="w-full">
      <el-input v-model="form.keyword" placeholder="请输入关键词">
        <template #suffix>
          <el-icon>
            <component :is="useRenderIcon('ep:search')" />
          </el-icon>
        </template>
      </el-input>
    </div>
    <div class="w-full">
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
        class="overflow-auto"
        @node-click="handleNodeClick"
        @node-contextmenu="handleContextmenu"
      >
        <template #default="{ data, node }">
          <span class="custom-tree-node relative">
            <el-icon v-if="data.nodeType != 'TREE_NODE'" size="20" class="mr-1">
              <component :is="useRenderIcon('ri:database-2-line')" v-if="data.nodeType == 'DATABASE'" />
              <component :is="useRenderIcon('ri:table-2')" v-else-if="data.nodeType == 'TABLE'" />
              <component :is="useRenderIcon('ri:node-tree')" v-else-if="data.nodeType == 'NODE'" />
              <component :is="useRenderIcon('ri:kanban-view')" v-else-if="data.nodeType == 'VIEW'" />
              <component :is="useRenderIcon('ri:layout-column-line')" v-else-if="data.nodeType == 'COLUMN'" />
            </el-icon>
            <span class="label">
              <span v-if="data.dataType" class="pr-1">
                <el-tag :color="stringToColor(data.dataType?.toUpperCase())">
                  <span class="text-[#fff]">{{ data.dataType?.toUpperCase() }}</span>
                </el-tag>
              </span>
              <span v-if="!visible.renameShow">
                {{ data.nodeName }}
              </span>
              <el-input v-else v-model="data.nodeName" />
            </span>
            <span class="code justify-end pl-4">{{ data?.nodeComment }}</span>
            <span v-if="data.nodeType == 'NODE'" class="absolute right-0">
              <el-button-group>
                <el-button size="small" :icon="useRenderIcon('ep:edit')" @click="handleEditNode($event, data, node)" />
                <el-button size="small" :icon="useRenderIcon('ep:plus')" @click="handleSaveNode($event, data, node)" />
                <el-button size="small" :icon="useRenderIcon('ep:minus')" @click="handleDeleteNode($event, data, node)" />
              </el-button-group>
            </span>
          </span>
        </template>
      </el-tree>
    </div>
    <context-menu ref="contextMenuRef" key="menu" :menus="menuItems" />
    <remark ref="remarkRef" :data="data" @success="handleRemarkSuccess" />
    <rename ref="renameRef" :data="data" @success="handleRemarkSuccess" />
  </div>
</template>
<script setup>
import { fetchGenSessionChildren, fetchGenSessionCopyTableConstruct, fetchGenSessionDropTable, fetchGenSessionKeyword } from "@/api/monitor/gen/session";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, defineProps, defineEmits, ref, computed, defineAsyncComponent, onBeforeMount, defineExpose } from "vue";
import contextMenu from "@repo/components/ScContextMenu/index.vue";
import { copyTextToClipboard } from "@pureadmin/utils";
import { message } from "@repo/utils/message";
import { stringToColor } from "@repo/utils/objects";

const emit = defineEmits(["node-click", "node-edit-click"]);
const remark = defineAsyncComponent(() => import("./remark.vue"));
const rename = defineAsyncComponent(() => import("./rename.vue"));
const treeRef = ref(null);
const remarkRef = ref(null);
const renameRef = ref(null);
const contextMenuRef = ref(null);

const form = reactive({
  keyword: ""
});

const treeConfig = reactive({
  treeKey: 0
});
/**
 * 树节点配置
 */
const nodeProps = {
  label: "nodeName",
  leaf: "nodeLeaf",
  isLeaf: "nodeLeaf"
};

const visible = {
  remarkShow: false,
  renameShow: false,
  mouseOverShow: {}
};

const menuItems = computed(() => {
  return !showMColumnMenu.value ? menuTableItems : columnItems;
});
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
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});
const treeData = reactive([]);
const showMColumnMenu = ref(false);

const handleNodeClick = (data, node) => {
  if ((data.nodeType == "TABLE" || data.nodeType == "NODE" || data.nodeType == "TREE_NODE") && data.nodeName != "表" && data.nodeName != "视图") {
    emit("node-click", data, node);
  }
};
const handleRemark = async (data, node) => {
  remarkRef.value.setData(data).setNode(node).open();
};
const handleRenameTale = async (data, node) => {
  // visible.renameShow = true;
  renameRef.value.setRoot(props.data);
  renameRef.value.setData(data);
  renameRef.value.setNode(node);
  renameRef.value.open();
};
const handleCopyTableConstruct = async (data, node) => {
  fetchGenSessionCopyTableConstruct({
    genId: props.data.genId,
    tableName: data.nodeName
  }).then(res => {
    if (res.code == "00000") {
      handleRefreshTreeNode(node?.parent);
      message("复制成功", { type: "success" });
    } else {
      message(res.msg, { type: "error" });
    }
  });
};
const handleDeleteTale = async (data, node) => {
  fetchGenSessionDropTable({
    genId: props.data.genId,
    tableName: data.nodeName
  }).then(res => {
    if (res.code == "00000") {
      handleRefreshTreeNode(node?.parent);
      message("删除成功", { type: "success" });
    } else {
      message(res.msg, { type: "error" });
    }
  });
};
const handleRemarkSuccess = async node => {
  handleRefreshTreeNode(node.parent);
};
const handleContextmenu = (event, data, node) => {
  event.preventDefault();
  if (data.nodeType === "COLUMN") {
    showMColumnMenu.value = true;
  } else {
    showMColumnMenu.value = false;
  }
  contextMenuRef.value.open(event, data, node);
};

const handleEditNode = (event, data, node) => {
  event.preventDefault();
  event.stopPropagation();
  emit("node-edit-click", data, node);
};
const handleDeleteNode = (event, data, node) => {
  event.preventDefault();
  event.stopPropagation();
  emit("node-delete-click", data, node);
};
const handleSaveNode = (event, data, node) => {
  event.preventDefault();
  event.stopPropagation();
  emit("node-save-click", data, node);
};

const handleRefreshTreeRootNode = async () => {
  treeConfig.treeKey++;
  treeRef.value.root.store.root.loaded = false;
  treeRef.value.root.store.root.expand();
};
/**
 * 刷新树节点
 */
const handleRefreshTreeNode = async node => {
  if (node) {
    node.loaded = false;
    node.expand(); // 主动调用展开节点方法，重新查询该节点下的所有子节点
  }
};
/**
 * 刷新树节点
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
 */
const loadNode = async (node, resolve) => {
  if (node.level == 0) {
    fetchGenSessionKeyword({
      genId: props.data.genId
    }).then(res => {
      resolve(res.data);
    });
    return;
  }
  if (node.level == 1) {
    fetchGenSessionChildren({
      genId: props.data.genId,
      nodeId: node.data.nodeId,
      keyword: form.keyword,
      nodeType: node.data.nodeType,
      nodeName: node.data.nodeName == "表" || node.data.nodeName == "视图" ? null : node.data.nodeName
    }).then(res => {
      resolve(res.data);
    });
    return;
  }

  if (node.data.nodeType == "NODE") {
    fetchGenSessionChildren({
      genId: props.data.genId,
      nodeId: node.data.nodeId,
      keyword: form.keyword,
      nodeType: "NODE",
      nodeName: node.data.nodeName
    }).then(res => {
      resolve(res.data);
    });
    return;
  }
  if (node.level == 2) {
    fetchGenSessionChildren({
      genId: props.data.genId,
      nodeId: node.data.nodeId,
      nodeType: "COLUMN",
      keyword: form.keyword,
      nodeName: node.data.nodeName
    }).then(res => {
      resolve(res.data);
    });
    return;
  }
};

/**
 * 过滤树节点
 */
const filterNode = (value, data) => {
  if (!value) return true;
  return data.label.includes(value);
};

onBeforeMount(async () => {
  setTimeout(() => {
    visible.remarkShow = true;
  }, 100);
});

defineExpose({
  handleRefreshTreeNode,
  handleRefreshTreeParentNode
});
</script>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.menu:deep(.el-tree-node__label) {
  display: flex;
  flex: 1;
  height: 100%;
}
.custom-tree-node {
  display: flex;
  flex: 1;
  align-items: center;
  font-size: 14px;
  height: 100%;
}
.custom-tree-node .code {
  font-size: 12px;
  color: #999;
}
.custom-tree-node .do {
  display: none;
}
</style>
