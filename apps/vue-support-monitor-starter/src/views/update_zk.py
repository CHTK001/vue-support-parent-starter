import io

with io.open('ZookeeperManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修改导入部分
old_import = 'import { computed, onMounted, reactive, ref } from "vue";'
new_import = '''import { computed, onMounted, reactive, ref } from "vue";
import {
  fetchZkTree,
  fetchZkNodeDetail,
  fetchZkChildren,
  createZkNode,
  updateZkNode,
  deleteZkNode,
} from "../monitorApi";'''
content = content.replace(old_import, new_import, 1)

# 2. 替换 mock 数据和 onMounted
old_mount = '''onMounted(() => {
  // 模拟加载节点树
});'''
new_mount = '''onMounted(() => {
  loadTree();
});

async function loadTree() {
  try {
    const data = await fetchZkTree(undefined, "/");
    treeNodes.value = (data || []).filter((n: any) => n.path !== "/");
  } catch (e) {
    console.error("加载节点树失败", e);
  }
}'''
content = content.replace(old_mount, new_mount, 1)

# 3. 修改 selectNode 函数，加载节点详情和子节点
old_selectNode = '''function selectNode(path: string) {
  activePath.value = path;
  nodeDetail.path = path;
  if (path === "/services") {
    nodeDetail.data = '{\\"service\\":\\"monitor-service\\",\\"port\\":8080}';
    children.value = [
      { name: "monitor-service", ephemeral: false, data: '{\\"host\\":\\"192.168.1.10\\",\\"port\\":8080}' },
      { name: "gateway-service", ephemeral: true, data: '{\\"host\\":\\"192.168.1.11\\",\\"port\\":8081}' },
    ];
  } else if (path === "/config") {
    nodeDetail.data = "{\\"env\\":\\"prod\\"}";
    children.value = [
      { name: "app-config", ephemeral: false, data: "key=value" },
    ];
  } else {
    nodeDetail.data = "(空)";
    children.value = [];
  }
}'''
new_selectNode = '''async function selectNode(path: string) {
  activePath.value = path;
  try {
    const detail = await fetchZkNodeDetail(path);
    if (detail) {
      nodeDetail.path = detail.path || path;
      nodeDetail.ephemeral = detail.ephemeral || false;
      nodeDetail.createdAt = detail.createdAt || "-";
      nodeDetail.updatedAt = detail.updatedAt || "-";
      nodeDetail.version = detail.version || 0;
      nodeDetail.numChildren = detail.numChildren || 0;
      nodeDetail.data = detail.data || "(空)";
    }
  } catch (e) {
    console.error("加载节点详情失败", e);
  }
  try {
    const childData = await fetchZkChildren(path);
    children.value = childData || [];
  } catch (e) {
    console.error("加载子节点失败", e);
    children.value = [];
  }
}'''
content = content.replace(old_selectNode, new_selectNode, 1)

# 4. 修改 refreshNode 函数
old_refreshNode = '''function refreshNode() {
  if (activePath.value) selectNode(activePath.value);
}'''
new_refreshNode = '''function refreshNode() {
  loadTree();
  if (activePath.value) selectNode(activePath.value);
}'''
content = content.replace(old_refreshNode, new_refreshNode, 1)

# 5. 修改 editNode 函数
old_editNode = '''function editNode() {
  editing.value = true;
  nodeForm.path = activePath.value || "";
  nodeForm.data = nodeDetail.data || "";
  nodeForm.ephemeral = nodeDetail.ephemeral || false;
  nodeDialogVisible.value = true;
}'''
new_editNode = '''function editNode() {
  editing.value = true;
  nodeForm.path = activePath.value || "";
  nodeForm.data = nodeDetail.data || "";
  nodeForm.ephemeral = nodeDetail.ephemeral || false;
  nodeDialogVisible.value = true;
}'''
# 这个不需要改，保持原样

# 6. 修改 deleteNode 函数，调用后端接口
old_deleteNode = '''function deleteNode() {
  if (!activePath.value) return;
  if (confirm(`确定删除节点 ${activePath.value} 吗？`)) {
    activePath.value = "";
    nodeDetail.data = "(空)";
    children.value = [];
  }
}'''
new_deleteNode = '''async function deleteNode() {
  if (!activePath.value) return;
  if (confirm(`确定删除节点 ${activePath.value} 吗？`)) {
    try {
      await deleteZkNode(activePath.value);
      activePath.value = "";
      nodeDetail.data = "(空)";
      children.value = [];
      loadTree();
    } catch (e) {
      console.error("删除节点失败", e);
    }
  }
}'''
content = content.replace(old_deleteNode, new_deleteNode, 1)

# 7. 修改 saveNode 函数，调用后端接口
old_saveNode = '''function saveNode() {
  if (!nodeForm.path) {
    alert("节点路径不能为空");
    return;
  }
  if (editing.value) {
    nodeDetail.data = nodeForm.data;
  } else {
    // 模拟新建
  }
  nodeDialogVisible.value = false;
}'''
new_saveNode = '''async function saveNode() {
  if (!nodeForm.path) {
    alert("节点路径不能为空");
    return;
  }
  try {
    if (editing.value) {
      await updateZkNode({ path: nodeForm.path, data: nodeForm.data });
      if (activePath.value === nodeForm.path) {
        nodeDetail.data = nodeForm.data;
      }
    } else {
      await createZkNode({ path: nodeForm.path, data: nodeForm.data, ephemeral: nodeForm.ephemeral });
      loadTree();
    }
    nodeDialogVisible.value = false;
  } catch (e) {
    console.error("保存节点失败", e);
    alert("保存节点失败: " + (e as Error).message);
  }
}'''
content = content.replace(old_saveNode, new_saveNode, 1)

with io.open('ZookeeperManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('ZookeeperManageView.vue 已更新为调用真实后端接口')
