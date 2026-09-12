import io

with io.open('ZookeeperManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在节点树节点上添加右键菜单事件
old_node = '''                @click="selectNode(node.path)"
              >'''

new_node = '''                @click="selectNode(node.path)"
                @contextmenu.prevent="onNodeContextMenu($event, node.path)"
              >'''

if old_node in content:
    content = content.replace(old_node, new_node, 1)
    print('1. 添加节点右键菜单事件成功')
else:
    print('1. 未找到节点')

# 2. 在 </template> 前添加右键菜单 HTML
old_template_end = '''  </div>
</template>'''

new_template_end = '''  </div>

  <!-- 节点右键菜单 -->
  <div
    v-if="nodeContextMenu.visible"
    class="zk-context-menu"
    :style="{ left: nodeContextMenu.x + 'px', top: nodeContextMenu.y + 'px' }"
    @click="nodeContextMenu.visible = false"
  >
    <div class="zkm-item" @click="selectNode(nodeContextMenu.path)">
      <ReIcon name="View" size="14" />查看详情
    </div>
    <div class="zkm-item" @click="onCopyPath(nodeContextMenu.path)">
      <ReIcon name="Copy" size="14" />复制路径
    </div>
    <div class="zkm-item" @click="onEditNodeData(nodeContextMenu.path)">
      <ReIcon name="Edit" size="14" />编辑数据
    </div>
    <div class="zkm-item" @click="onAddChildNode(nodeContextMenu.path)">
      <ReIcon name="Plus" size="14" />新建子节点
    </div>
    <div class="zkm-item" @click="onExportNode(nodeContextMenu.path)">
      <ReIcon name="Download" size="14" />导出节点
    </div>
    <div class="zkm-divider"></div>
    <div class="zkm-item zkm-danger" @click="onDeleteNode(nodeContextMenu.path)">
      <ReIcon name="Delete" size="14" />删除节点
    </div>
    <div class="zkm-item zkm-warning" @click="onDeleteRecursive(nodeContextMenu.path)">
      <ReIcon name="Delete" size="14" />递归删除（含子节点）
    </div>
    <div class="zkm-item" @click="refresh">
      <ReIcon name="Refresh" size="14" />刷新
    </div>
  </div>
</template>'''

if old_template_end in content:
    content = content.replace(old_template_end, new_template_end, 1)
    print('2. 添加右键菜单 HTML 成功')
else:
    print('2. 未找到模板结束位置')

# 3. 在 script 中添加右键菜单相关的变量和函数
old_script = '''function toggleNode(path: string) {'''

new_script = '''// ==================== 右键菜单 ====================
const nodeContextMenu = ref({ visible: false, x: 0, y: 0, path: "" });

const onNodeContextMenu = (e: MouseEvent, path: string) => {
  nodeContextMenu.value = { visible: true, x: e.clientX, y: e.clientY, path };
};

if (typeof window !== "undefined") {
  window.addEventListener("click", () => {
    nodeContextMenu.value.visible = false;
  });
}

const onCopyPath = (path: string) => {
  navigator.clipboard.writeText(path).then(() => {
    ElMessage.success("已复制路径");
  }).catch(() => {
    ElMessage.error("复制失败");
  });
};

const onEditNodeData = (path: string) => {
  selectNode(path);
  editNode();
};

const onAddChildNode = (parentPath: string) => {
  editing.value = false;
  nodeForm.value = { path: parentPath === "/" ? "/new-node" : parentPath + "/new-node", data: "" };
  nodeDialogVisible.value = true;
};

const onExportNode = async (path: string) => {
  try {
    const detail = await fetchZkNodeDetail(path);
    const children = await fetchZkChildren(path);
    const exportData = {
      path,
      data: detail?.data,
      stat: detail?.stat,
      children: children.map((c: any) => c.path || c.name),
      exportTime: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `zk-${path.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error(`导出失败: ${String((e as Error)?.message ?? e)}`);
  }
};

const onDeleteNode = (path: string) => {
  selectNode(path);
  deleteNode();
};

const onDeleteRecursive = async (path: string) => {
  try {
    await ElMessageBox.confirm(`确定递归删除节点 "${path}" 及其所有子节点吗？此操作不可恢复！`, "递归删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    // 递归删除：先获取所有子节点，然后从叶子节点开始删除
    const deleteRecursive = async (p: string): Promise<void> => {
      const children = await fetchZkChildren(p);
      for (const child of children) {
        const childPath = p === "/" ? "/" + (child.path || child.name) : p + "/" + (child.path || child.name);
        await deleteRecursive(childPath);
      }
      await deleteZkNode(p);
    };
    await deleteRecursive(path);
    ElMessage.success("递归删除成功");
    refresh();
    if (activePath.value === path) {
      activePath.value = null;
      nodeDetail.value = null;
    }
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

function toggleNode(path: string) {'''

if old_script in content:
    content = content.replace(old_script, new_script, 1)
    print('3. 添加右键菜单函数成功')
else:
    print('3. 未找到 script 位置')

# 4. 在 style 中添加右键菜单样式
old_style_end = '''.dsm-empty-icon { opacity: 0.3; }'''

new_style_end = '''.dsm-empty-icon { opacity: 0.3; }

/* 右键菜单 */
.zk-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-default, rgba(148, 163, 184, 0.3));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  padding: 4px;
}
.zkm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary, #1e293b);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.zkm-item:hover { background: var(--bg-hover, #f1f5f9); }
.zkm-item.zkm-danger { color: #ef4444; }
.zkm-item.zkm-danger:hover { background: rgba(239, 68, 68, 0.1); }
.zkm-item.zkm-warning { color: #f59e0b; }
.zkm-item.zkm-warning:hover { background: rgba(245, 158, 11, 0.1); }
.zkm-divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--border-subtle, rgba(148, 163, 184, 0.2));
}'''

if old_style_end in content:
    content = content.replace(old_style_end, new_style_end, 1)
    print('4. 添加右键菜单样式成功')
else:
    print('4. 未找到 style 结束位置')

with io.open('ZookeeperManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nZookeeperManageView.vue 修改完成')
