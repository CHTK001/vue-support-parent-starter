import io

with io.open('RedisView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在 key 列表项上添加右键菜单事件
old_key_item = '''                @click="selectKey(key)"
              >
                <span class="kv-key-name" :title="key">{{ key }}</span>'''

new_key_item = '''                @click="selectKey(key)"
                @contextmenu.prevent="onKeyContextMenu($event, key)"
              >
                <span class="kv-key-name" :title="key">{{ key }}</span>'''

if old_key_item in content:
    content = content.replace(old_key_item, new_key_item, 1)
    print('1. 添加右键菜单事件成功')
else:
    print('1. 未找到 key 列表项')

# 2. 在新增 Key 弹窗后面添加右键菜单 HTML
old_dialog_end = '''    </ReDialog>
  </div>
</template>'''

new_dialog_end = '''    </ReDialog>

    <!-- Key 右键菜单 -->
    <div
      v-if="keyContextMenu.visible"
      class="redis-context-menu"
      :style="{ left: keyContextMenu.x + 'px', top: keyContextMenu.y + 'px' }"
      @click="keyContextMenu.visible = false"
    >
      <div class="rcm-item" @click="selectKey(keyContextMenu.key)">
        <ReIcon name="View" size="14" />查看详情
      </div>
      <div class="rcm-item" @click="copyKeyName(keyContextMenu.key)">
        <ReIcon name="Copy" size="14" />复制 Key 名
      </div>
      <div class="rcm-item" @click="onRenameKey(keyContextMenu.key)">
        <ReIcon name="Edit" size="14" />重命名 Key
      </div>
      <div class="rcm-item" @click="onSetTtl(keyContextMenu.key)">
        <ReIcon name="Clock" size="14" />设置 TTL
      </div>
      <div class="rcm-item" @click="onExportKey(keyContextMenu.key)">
        <ReIcon name="Download" size="14" />导出 Key
      </div>
      <div class="rcm-divider"></div>
      <div class="rcm-item rcm-danger" @click="deleteKey(keyContextMenu.key)">
        <ReIcon name="Delete" size="14" />删除 Key
      </div>
      <div class="rcm-item" @click="loadKeys">
        <ReIcon name="Refresh" size="14" />刷新列表
      </div>
    </div>
  </div>
</template>'''

if old_dialog_end in content:
    content = content.replace(old_dialog_end, new_dialog_end, 1)
    print('2. 添加右键菜单 HTML 成功')
else:
    print('2. 未找到弹窗结束位置')

# 3. 在 script 中添加右键菜单相关的变量和函数
old_script_end = '''/** 设置过期时间 */
const setExpire = async () => {'''

new_script_end = '''// ==================== 右键菜单 ====================
const keyContextMenu = ref({ visible: false, x: 0, y: 0, key: "" });

const onKeyContextMenu = (e: MouseEvent, key: string) => {
  keyContextMenu.value = { visible: true, x: e.clientX, y: e.clientY, key };
};

// 点击页面其他地方关闭右键菜单
if (typeof window !== "undefined") {
  window.addEventListener("click", () => {
    keyContextMenu.value.visible = false;
  });
}

const copyKeyName = (key: string) => {
  navigator.clipboard.writeText(key).then(() => {
    ElMessage.success("已复制 Key 名");
  }).catch(() => {
    ElMessage.error("复制失败");
  });
};

const onRenameKey = async (oldKey: string) => {
  const newKey = prompt(`请输入新的 Key 名（原 Key: ${oldKey}）:`, oldKey);
  if (!newKey || newKey === oldKey) return;
  try {
    // 先获取原值，再设置新 key，最后删除旧 key
    const detail = await getSystemRedisKeyDetail(oldKey);
    await setSystemRedisKey(newKey, detail?.value ?? "", detail?.ttl ?? -1);
    await deleteSystemRedisKeys([oldKey]);
    ElMessage.success("重命名成功");
    await loadKeys();
    await selectKey(newKey);
  } catch (e) {
    ElMessage.error(`重命名失败: ${String((e as Error)?.message ?? e)}`);
  }
};

const onSetTtl = async (key: string) => {
  const ttlStr = prompt(`请输入过期时间（秒，-1=永不过期）:`, "-1");
  if (ttlStr === null) return;
  const ttl = parseInt(ttlStr, 10);
  if (isNaN(ttl)) {
    ElMessage.warning("请输入有效的数字");
    return;
  }
  try {
    await expireSystemRedisKey(key, ttl);
    ElMessage.success("TTL 设置成功");
    if (selectedKey.value === key) await selectKey(key);
  } catch (e) {
    ElMessage.error(`设置失败: ${String((e as Error)?.message ?? e)}`);
  }
};

const onExportKey = async (key: string) => {
  try {
    const detail = await getSystemRedisKeyDetail(key);
    const exportData = {
      key,
      type: detail?.type,
      ttl: detail?.ttl,
      value: detail?.value,
      exportTime: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `redis-${key.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error(`导出失败: ${String((e as Error)?.message ?? e)}`);
  }
};

/** 设置过期时间 */
const setExpire = async () => {'''

if old_script_end in content:
    content = content.replace(old_script_end, new_script_end, 1)
    print('3. 添加右键菜单函数成功')
else:
    print('3. 未找到 script 结束位置')

# 4. 在 style 中添加右键菜单样式
old_style_end = '''.kv-count {
  margin-top: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
  border-top: 1px solid var(--border-subtle);
}'''

new_style_end = '''.kv-count {
  margin-top: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
  border-top: 1px solid var(--border-subtle);
}

/* 右键菜单 */
.redis-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-default, rgba(148, 163, 184, 0.3));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  padding: 4px;
}
.rcm-item {
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
.rcm-item:hover {
  background: var(--bg-hover, #f1f5f9);
}
.rcm-item.rcm-danger {
  color: #ef4444;
}
.rcm-item.rcm-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}
.rcm-divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--border-subtle, rgba(148, 163, 184, 0.2));
}'''

if old_style_end in content:
    content = content.replace(old_style_end, new_style_end, 1)
    print('4. 添加右键菜单样式成功')
else:
    print('4. 未找到 style 结束位置')

with io.open('RedisView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nRedisView.vue 修改完成')
