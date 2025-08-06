<template>
  <div class="file-tree">
    <!-- 头部工具栏 -->
    <div class="tree-header">
      <div class="tree-title">
        <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
        <span>目录结构</span>
      </div>
      <div class="tree-actions">
        <el-tooltip content="刷新目录树" placement="top">
          <el-button size="small" text @click="refreshTree">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="展开所有" placement="top">
          <el-button size="small" text @click="expandAll">
            <IconifyIconOnline icon="ri:add-box-line" />
          </el-button>
        </el-tooltip>
        <!-- <el-tooltip content="折叠所有" placement="top">
          <el-button size="small" text @click="collapseAll">
            <IconifyIconOnline icon="ri:subtract-box-line" />
          </el-button>
        </el-tooltip> -->
        <el-tooltip content="关闭" placement="top">
          <el-button size="small" text @click="$emit('close')">
            <IconifyIconOnline icon="ep:close" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 文件树 -->
    <div class="tree-content" v-loading="loading">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="treeProps"
        :load="loadNode"
        lazy
        :expand-on-click-node="false"
        :highlight-current="true"
        node-key="path"
        @node-click="handleNodeClick"
        @node-expand="handleNodeExpand"
        @node-collapse="handleNodeCollapse"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <IconifyIconOnline
              :icon="getNodeIcon(data)"
              :class="['node-icon', { 'folder-icon': data.isDirectory }]"
            />
            <span class="node-label" :title="data.name">{{ data.name }}</span>

            <!-- 加载状态指示器 -->
            <IconifyIconOnline
              v-if="loadingNodes.has(data.path)"
              icon="ri:loader-4-line"
              class="node-loading"
            />

            <div class="node-actions" v-if="data.isDirectory" @click.stop>
              <el-tooltip content="新建文件夹" placement="top">
                <el-button size="small" text @click="createFolder(data)">
                  <IconifyIconOnline icon="ri:folder-add-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="刷新" placement="top">
                <el-button
                  size="small"
                  text
                  @click="refreshNode(node, data)"
                  :loading="loadingNodes.has(data.path)"
                >
                  <IconifyIconOnline icon="ri:refresh-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 新建文件夹对话框 -->
    <el-dialog
      v-model="createFolderVisible"
      title="新建文件夹"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="createFolderForm" label-width="80px">
        <el-form-item label="文件夹名">
          <el-input
            v-model="createFolderForm.name"
            placeholder="请输入文件夹名称"
            @keyup.enter="confirmCreateFolder"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createFolderVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateFolder">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from "vue";
import { ElMessage, ElTree } from "element-plus";
import type { FileInfo } from "@/api/file-management";
import {
  getFileTree,
  getFileList,
  createDirectory,
  previewFile,
} from "@/api/file-management";

// Props
const props = defineProps<{
  serverId: number;
  currentPath?: string;
}>();

// Emits
const emit = defineEmits<{
  "node-click": [path: string, node: FileInfo];
  "folder-click": [path: string, node: FileInfo];
  "file-click": [path: string, node: FileInfo];
  refresh: [];
}>();

// 响应式数据
const loading = ref(false);
const treeRef = ref<InstanceType<typeof ElTree>>();
const treeData = ref<FileInfo[]>([]); // 懒加载模式下的树数据
const rootNodeData = ref<FileInfo[]>([]); // 存储根节点数据
const createFolderVisible = ref(false);
const createFolderForm = reactive({
  name: "",
  parentPath: "",
});

// 性能优化配置
const LAZY_LOAD_PAGE_SIZE = 50; // 每次懒加载的数量
const loadingNodes = ref(new Set<string>()); // 正在加载的节点路径

// 树形组件配置
const treeProps = {
  children: "children",
  label: "name",
  isLeaf: "leaf", // 使用后端返回的 leaf 属性
};

/**
 * 加载根节点数据（懒加载模式）
 */
const loadRootNode = async () => {
  if (!props.serverId) {
    console.log("FileTree: No serverId provided");
    return;
  }

  try {
    loading.value = true;
    console.log("FileTree: Loading root node for serverId", props.serverId);

    // 启用懒加载模式，只加载第一层，包含文件夹和文件
    const res = await getFileTree(props.serverId, "/", 1, false, true, 100, 0);
    console.log("FileTree: API response", res);

    if (
      res.code === "00000" &&
      res.data?.success &&
      (res.data.fileTree || res.data.tree)
    ) {
      // 获取根节点数据
      const treeData = res.data.fileTree || res.data.tree;
      console.log("FileTree: Received tree data", treeData);

      // 如果根节点有子节点，使用子节点作为树的根数据
      // 否则将根节点本身作为树的根数据
      let rootData = [];
      if (treeData.children && treeData.children.length > 0) {
        rootData = treeData.children;
      } else if (treeData.name && treeData.path) {
        // 如果没有子节点但有根节点信息，将根节点作为唯一的根数据
        rootData = [treeData];
      }

      console.log("FileTree: Processed root data", rootData);
      rootNodeData.value = rootData;
    } else {
      console.error("FileTree: API error", res);
      ElMessage.error(res.data?.message || "加载文件树失败");
      rootNodeData.value = [];
    }
  } catch (error) {
    console.error("FileTree: 加载文件树失败:", error);
    ElMessage.error("加载文件树失败");
    rootNodeData.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 懒加载节点（优化版）
 */
const loadNode = async (node: any, resolve: Function) => {
  console.log("FileTree: Loading node", node);
  console.log("FileTree: Node level:", node.level);
  console.log("FileTree: Node data:", node.data);

  // 处理根节点（level 0）
  if (node.level === 0) {
    console.log("FileTree: Loading root level data via lazy loading");

    // 如果还没有加载根数据，先加载
    if (rootNodeData.value.length === 0) {
      console.log("FileTree: Loading root data for the first time");
      await loadRootNode();
    }

    console.log("FileTree: Returning root data", rootNodeData.value);
    resolve(rootNodeData.value);
    return;
  }

  const nodeData = node.data as FileInfo;
  if (!nodeData.isDirectory) {
    resolve([]);
    return;
  }

  // 防止重复加载
  if (loadingNodes.value.has(nodeData.path)) {
    console.log("FileTree: Node already loading", nodeData.path);
    resolve([]);
    return;
  }

  try {
    loadingNodes.value.add(nodeData.path);
    console.log("FileTree: Loading children for", nodeData.path);
    console.log("FileTree: Using serverId", props.serverId);

    // 使用文件列表 API 加载子节点
    const res = await getFileList(
      props.serverId,
      nodeData.path,
      false, // includeHidden
      "name", // sortBy
      "asc" // sortOrder
    );

    console.log("FileTree: getFileList response", res);

    if (res.code === "00000" && res.data?.success && res.data.files) {
      const children = res.data.files || [];

      console.log("FileTree: Raw children data", children);

      // 处理子节点数据，确保正确设置 leaf 属性
      const processedChildren = children.map((child) => {
        // 后端应该已经设置了正确的 leaf 属性
        // 但为了保险起见，我们再次确认
        if (child.leaf === undefined) {
          child.leaf = !child.isDirectory;
        }
        return child;
      });

      console.log(
        "FileTree: Children loaded with lazy loading",
        processedChildren
      );

      resolve(processedChildren);
    } else {
      console.error("FileTree: Failed to load children", res);
      resolve([]);
    }
  } catch (error) {
    console.error("FileTree: 加载子节点失败:", error);
    resolve([]);
  } finally {
    // 清理加载状态
    loadingNodes.value.delete(nodeData.path);
  }
};

/**
 * 处理节点点击
 */
const handleNodeClick = (data: FileInfo) => {
  console.log("FileTree: Node clicked", data);

  if (data.isDirectory) {
    // 点击文件夹：调用list接口显示文件夹内容
    console.log("FileTree: Directory clicked, emitting folder-click event");
    emit("folder-click", data.path, data);
  } else {
    // 点击文件：调用preview接口预览文件
    console.log("FileTree: File clicked, emitting file-click event");
    emit("file-click", data.path, data);
  }

  // 保持原有的node-click事件以兼容现有代码
  emit("node-click", data.path, data);
};

/**
 * 处理节点展开
 */
const handleNodeExpand = (data: FileInfo, node: any) => {
  console.log("FileTree: 节点展开:", data.path);
};

/**
 * 处理节点折叠
 */
const handleNodeCollapse = (data: FileInfo, node: any) => {
  console.log("FileTree: 节点折叠:", data.path);
};

/**
 * 获取节点图标
 */
const getNodeIcon = (data: FileInfo) => {
  if (data.isDirectory) {
    return "ri:folder-line";
  }

  const ext = data.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return "ri:javascript-line";
    case "vue":
      return "ri:vuejs-line";
    case "html":
      return "ri:html5-line";
    case "css":
    case "scss":
    case "sass":
      return "ri:css3-line";
    case "json":
      return "ri:file-code-line";
    case "md":
      return "ri:markdown-line";
    case "txt":
      return "ri:file-text-line";
    case "pdf":
      return "ri:file-pdf-line";
    case "zip":
    case "rar":
    case "7z":
      return "ri:file-zip-line";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
      return "ri:image-line";
    default:
      return "ri:file-line";
  }
};

/**
 * 刷新树
 */
const refreshTree = async () => {
  console.log("FileTree: Refreshing tree");

  // 清理所有数据和加载状态
  rootNodeData.value = [];
  loadingNodes.value.clear();

  // 重新设置空数组，让懒加载重新开始
  treeData.value = [];

  // 主动加载根节点数据
  if (props.serverId) {
    await loadRootNode();
    // 如果有根节点数据，更新树数据以触发显示
    if (rootNodeData.value.length > 0) {
      treeData.value = [...rootNodeData.value];
    }
  }

  emit("refresh");
};

/**
 * 展开所有节点
 */
const expandAll = () => {
  // 遍历所有节点并展开
  const expandNodes = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.isDirectory) {
        treeRef.value?.setExpanded(node.path, true);
        if (node.children) {
          expandNodes(node.children);
        }
      }
    });
  };
  expandNodes(treeData.value);
};

/**
 * 折叠所有节点
 */
const collapseAll = () => {
  // 遍历所有节点并折叠
  const collapseNodes = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.isDirectory) {
        treeRef.value?.setExpanded(node.path, false);
        if (node.children) {
          collapseNodes(node.children);
        }
      }
    });
  };
  collapseNodes(treeData.value);
};

/**
 * 创建文件夹
 */
const createFolder = (parentNode: FileInfo) => {
  createFolderForm.name = "";
  createFolderForm.parentPath = parentNode.path;
  createFolderVisible.value = true;
};

/**
 * 确认创建文件夹
 */
const confirmCreateFolder = async () => {
  if (!createFolderForm.name.trim()) {
    ElMessage.warning("请输入文件夹名称");
    return;
  }

  try {
    const folderPath = `${createFolderForm.parentPath}/${createFolderForm.name}`;
    const res = await createDirectory(props.serverId, folderPath, false);

    if (res.code === "00000" && res.data?.success) {
      ElMessage.success("文件夹创建成功");
      createFolderVisible.value = false;
      refreshTree();
    } else {
      ElMessage.error(res.data?.message || "创建文件夹失败");
    }
  } catch (error) {
    console.error("FileTree: 创建文件夹失败:", error);
    ElMessage.error("创建文件夹失败");
  }
};

/**
 * 刷新节点
 */
const refreshNode = async (node: any, data: FileInfo) => {
  // 重新加载节点的子节点
  node.loaded = false;
  node.expand();
};

/**
 * 设置当前选中的路径
 */
const setCurrentPath = async (path: string) => {
  await nextTick();
  if (treeRef.value) {
    treeRef.value.setCurrentKey(path);
    console.log("FileTree: Current path set to:", path);
  }
};

/**
 * 展开到指定路径并高亮
 */
const expandToPath = async (targetPath: string) => {
  console.log("FileTree: Expanding to path", targetPath);

  if (!targetPath || targetPath === "/") {
    return;
  }

  try {
    // 分解路径
    const pathParts = targetPath.split("/").filter(Boolean);
    let currentPath = "";

    // 逐级展开路径
    for (const part of pathParts) {
      currentPath += "/" + part;

      // 展开当前路径的父节点
      const parentPath =
        currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
      if (parentPath !== "/") {
        await nextTick();
        // 使用 el-tree 的正确方法来展开节点
        const node = treeRef.value?.getNode(parentPath);
        if (node && !node.expanded) {
          node.expand();
        }
      }
    }

    // 最后设置当前选中的节点
    await nextTick();
    treeRef.value?.setCurrentKey(targetPath);

    console.log("FileTree: Expanded to path successfully", targetPath);
  } catch (error) {
    console.error("FileTree: Failed to expand to path", targetPath, error);
  }
};

/**
 * 监听serverId变化，清理数据
 */
watch(
  () => props.serverId,
  (newServerId) => {
    if (newServerId) {
      console.log("FileTree: serverId changed to", newServerId);
      // 清理之前的数据
      rootNodeData.value = [];
      loadingNodes.value.clear();
      // 重新设置空数组，让懒加载重新开始
      treeData.value = [];
    }
  },
  { immediate: false }
);

/**
 * 组件挂载时的初始化
 */
onMounted(async () => {
  console.log("FileTree: Component mounted, serverId:", props.serverId);
  if (props.serverId) {
    console.log("FileTree: Initial serverId available, loading root data");
    // 主动加载根节点数据
    await loadRootNode();
    // 如果有根节点数据，更新树数据以触发显示
    if (rootNodeData.value.length > 0) {
      treeData.value = [...rootNodeData.value];
    }
  }
});

// 暴露方法
defineExpose({
  refreshTree,
  setCurrentPath,
  expandToPath,
});
</script>

<style scoped>
.file-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff; /* 设置文件树背景为白色 */
  border-right: 1px solid var(--el-border-color-light);
}

.tree-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff; /* 设置树头部背景为白色 */
}

.tree-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.tree-actions {
  display: flex;
  gap: 4px;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  min-height: 0; /* 确保flex子元素可以收缩 */
  max-height: 100%; /* 确保不会超出父容器 */
}

.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 2px 0;
}

.node-icon {
  margin-right: 6px;
  font-size: 16px;
  color: var(--el-color-primary);
}

.folder-icon {
  color: var(--el-color-warning);
}

.node-label {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-actions {
  display: none;
  gap: 2px;
}

.tree-node:hover .node-actions {
  display: flex;
}

/* 自定义树形组件样式 */
:deep(.el-tree-node__content) {
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

:deep(.el-tree-node__content:hover) {
  background-color: var(--el-fill-color-light);
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.el-tree-node__expand-icon) {
  color: var(--el-text-color-secondary);
}

:deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent;
}

/* 加载状态样式 */
.node-loading {
  margin-left: 8px;
  color: var(--el-color-primary);
  font-size: 14px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 性能优化：减少重绘 */
.tree-node {
  will-change: transform;
}

.node-actions {
  will-change: opacity;
}

/* 自定义滚动条样式 */
.tree-content::-webkit-scrollbar {
  width: 6px;
}

.tree-content::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

.tree-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 3px;
  transition: background 0.3s;
}

.tree-content::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-primary-light-5);
}

/* 确保树形结构在小高度下也能正常滚动 */
:deep(.el-tree) {
  min-height: fit-content;
}

:deep(.el-tree-node) {
  min-height: 32px;
}

/* 响应式设计 - 移动端滚动条 */
@media (max-width: 768px) {
  .tree-content::-webkit-scrollbar {
    width: 4px;
  }
}

/* 暗色主题适配 - 强制保持白色背景 */
@media (prefers-color-scheme: dark) {
  .file-tree {
    background: #ffffff !important; /* 强制保持白色背景 */
  }

  .tree-header {
    background: #ffffff !important; /* 强制保持白色背景 */
  }
}
</style>
