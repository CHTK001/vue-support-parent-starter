<template>
  <div class="overflow-hidden">
    <div class="w-full text-gray-500">面板信息</div>
    <div class="w-full">
      <el-input v-model="filterText" placeholder="请输入关键词">
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
        <template #default="{ data }">
          <span class="custom-tree-node">
            <el-icon size="20" class="mr-1">
              <component :is="useRenderIcon('ri:database-2-line')" v-if="data.nodeType == 'DATABASE'" />
              <component :is="useRenderIcon('ri:table-2')" v-else-if="data.nodeType == 'TABLE'" />
              <component :is="useRenderIcon('ri:kanban-view')" v-else-if="data.nodeType == 'VIEW'" />
              <component :is="useRenderIcon('ri:layout-column-line')" v-else-if="data.nodeType == 'COLUMN'" />
            </el-icon>
            <span class="label">{{ data.nodeName }}</span>
            <span class="code justify-end pl-4">{{ data?.nodeComment }}</span>
          </span>
        </template>
      </el-tree>
    </div>
    <context-menu ref="contextMenuRef" key="menu" :menus="menuItems" />
    <remark v-if="visible.remarkShow" ref="remarkRef" :data="data" @success="handleRemarkSuccess" />
  </div>
</template>
<script setup>
import { fetchGenSessionChildren, fetchGenSessionKeyword } from "@/api/monitor/gen/session";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { reactive, defineProps, defineEmits, ref, computed, defineAsyncComponent, onBeforeMount } from "vue";
import contextMenu from "../components/contextMenu.vue";

const emit = defineEmits(["node-click"]);
const remark = defineAsyncComponent(() => import("./remark.vue"));
const treeRef = ref(null);
const remarkRef = ref(null);
const contextMenuRef = ref(null);
/**
 * 树节点配置
 */
const nodeProps = {
  label: "nodeName",
  leaf: "nodeLeaf",
  isLeaf: "nodeLeaf"
};

const visible = {
  remarkShow: false
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
  }
]);
const columnItems = reactive([
  {
    name: "注释",
    icon: "ri:add-line",
    handle: (data, node) => {
      handleRemark(data, node);
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
  if (data.nodeType == "TABLE" && data.nodeName != "表" && data.nodeName != "视图") {
    emit("node-click", data, node);
  }
};
const handleRemark = async (data, node) => {
  remarkRef.value.setData(data).setNode(node).open();
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
      nodeType: node.data.nodeType,
      nodeName: node.data.nodeName == "表" || node.data.nodeName == "视图" ? null : node.data.nodeName
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
