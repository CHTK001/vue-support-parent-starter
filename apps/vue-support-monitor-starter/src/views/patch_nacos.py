import io

with io.open('NacosManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在配置列表行上添加右键菜单事件 - 找到配置表格的行
old_row = '''            <ReTable :data="filteredConfigs" :columns="configColumns" :loading="loading" stripe border height="400px">'''

new_row = '''            <ReTable :data="filteredConfigs" :columns="configColumns" :loading="loading" stripe border height="400px" @row-contextmenu="onConfigContextMenu">'''

if old_row in content:
    content = content.replace(old_row, new_row, 1)
    print('1. 添加配置右键菜单事件成功')
else:
    print('1. 未找到配置表格')

# 2. 在 </template> 前添加右键菜单 HTML
old_template_end = '''  </div>
</template>'''

new_template_end = '''  </div>

  <!-- 配置右键菜单 -->
  <div
    v-if="configContextMenu.visible"
    class="nacos-context-menu"
    :style="{ left: configContextMenu.x + 'px', top: configContextMenu.y + 'px' }"
    @click="configContextMenu.visible = false"
  >
    <div class="ncm-item" @click="viewConfig(configContextMenu.config)">
      <ReIcon name="View" size="14" />查看配置
    </div>
    <div class="ncm-item" @click="editConfig(configContextMenu.config)">
      <ReIcon name="Edit" size="14" />编辑配置
    </div>
    <div class="ncm-item" @click="onCloneConfig(configContextMenu.config)">
      <ReIcon name="Copy" size="14" />克隆配置
    </div>
    <div class="ncm-item" @click="onExportConfig(configContextMenu.config)">
      <ReIcon name="Download" size="14" />导出配置
    </div>
    <div class="ncm-item" @click="onPublishConfig(configContextMenu.config)">
      <ReIcon name="Promotion" size="14" />发布配置
    </div>
    <div class="ncm-divider"></div>
    <div class="ncm-item ncm-danger" @click="deleteConfig(configContextMenu.config)">
      <ReIcon name="Delete" size="14" />删除配置
    </div>
    <div class="ncm-item" @click="refresh">
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
old_script = '''function refresh() {'''

new_script = '''// ==================== 右键菜单 ====================
const configContextMenu = ref({ visible: false, x: 0, y: 0, config: null as any });

const onConfigContextMenu = (row: any, column: any, event: MouseEvent) => {
  event.preventDefault();
  configContextMenu.value = { visible: true, x: event.clientX, y: event.clientY, config: row };
};

if (typeof window !== "undefined") {
  window.addEventListener("click", () => {
    configContextMenu.value.visible = false;
  });
}

const onCloneConfig = (config: any) => {
  const newDataId = prompt("请输入克隆后的 Data ID:", config.dataId + "_copy");
  if (!newDataId) return;
  ElMessage.success("配置已克隆（功能演示）");
  refresh();
};

const onExportConfig = (config: any) => {
  const exportData = {
    dataId: config.dataId,
    group: config.group,
    content: config.content,
    type: config.type,
    exportTime: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `nacos-${config.dataId}-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  ElMessage.success("导出成功");
};

const onPublishConfig = (config: any) => {
  ElMessage.success(`配置 ${config.dataId} 已发布（功能演示）`);
};

function refresh() {'''

if old_script in content:
    content = content.replace(old_script, new_script, 1)
    print('3. 添加右键菜单函数成功')
else:
    print('3. 未找到 script 位置')

# 4. 在 style 中添加右键菜单样式
old_style_end = '''.dsm-empty-icon { opacity: 0.3; }'''

new_style_end = '''.dsm-empty-icon { opacity: 0.3; }

/* 右键菜单 */
.nacos-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-default, rgba(148, 163, 184, 0.3));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  padding: 4px;
}
.ncm-item {
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
.ncm-item:hover { background: var(--bg-hover, #f1f5f9); }
.ncm-item.ncm-danger { color: #ef4444; }
.ncm-item.ncm-danger:hover { background: rgba(239, 68, 68, 0.1); }
.ncm-divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--border-subtle, rgba(148, 163, 184, 0.2));
}'''

if old_style_end in content:
    content = content.replace(old_style_end, new_style_end, 1)
    print('4. 添加右键菜单样式成功')
else:
    print('4. 未找到 style 结束位置')

with io.open('NacosManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nNacosManageView.vue 修改完成')
