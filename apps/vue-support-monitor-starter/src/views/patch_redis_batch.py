import io

with io.open('RedisView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在 key 列表工具栏添加全选和批量删除按钮
old_toolbar = '''            <div class="kv-toolbar">
              <ReInput
                v-model="searchPattern"
                placeholder="搜索 pattern（如 *、user:*）"
                size="small"
                clearable
                @keyup.enter="loadKeys"
              />
              <ReButton icon="Search" size="small" @click="loadKeys">搜索</ReButton>
              <ReButton icon="Plus" type="primary" size="small" @click="newKeyDialog = true">新增</ReButton>
            </div>'''

new_toolbar = '''            <div class="kv-toolbar">
              <ReInput
                v-model="searchPattern"
                placeholder="搜索 pattern（如 *、user:*）"
                size="small"
                clearable
                @keyup.enter="loadKeys"
              />
              <ReButton icon="Search" size="small" @click="loadKeys">搜索</ReButton>
              <ReButton icon="Plus" type="primary" size="small" @click="newKeyDialog = true">新增</ReButton>
              <ReButton v-if="selectedKeys.size > 0" icon="Delete" type="danger" size="small" @click="batchDeleteKeys">
                批量删除({{ selectedKeys.size }})
              </ReButton>
            </div>'''

if old_toolbar in content:
    content = content.replace(old_toolbar, new_toolbar, 1)
    print('1. 添加批量删除按钮成功')
else:
    print('1. 未找到工具栏')

# 2. 在 key 列表项添加复选框
old_key_item = '''              <div
                v-for="key in keys"
                :key="key"
                class="kv-key-item"
                :class="{ active: selectedKey === key }"
                @click="selectKey(key)"
                @contextmenu.prevent="onKeyContextMenu($event, key)"
              >
                <span class="kv-key-name" :title="key">{{ key }}</span>'''

new_key_item = '''              <div
                v-for="key in keys"
                :key="key"
                class="kv-key-item"
                :class="{ active: selectedKey === key, selected: selectedKeys.has(key) }"
                @click="selectKey(key)"
                @contextmenu.prevent="onKeyContextMenu($event, key)"
              >
                <input type="checkbox" :checked="selectedKeys.has(key)" @click.stop="toggleKeySelection(key)" class="kv-key-checkbox" />
                <span class="kv-key-name" :title="key">{{ key }}</span>'''

if old_key_item in content:
    content = content.replace(old_key_item, new_key_item, 1)
    print('2. 添加复选框成功')
else:
    print('2. 未找到 key 列表项')

# 3. 在 script 中添加批量选择相关的变量和函数
old_vars = '''const newKeyTtl = ref(-1);'''

new_vars = '''const newKeyTtl = ref(-1);

// ==================== 批量操作 ====================
const selectedKeys = ref<Set<string>>(new Set());

const toggleKeySelection = (key: string) => {
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key);
  } else {
    selectedKeys.value.add(key);
  }
};

const selectAllKeys = () => {
  if (selectedKeys.value.size === keys.value.length) {
    selectedKeys.value.clear();
  } else {
    selectedKeys.value = new Set(keys.value);
  }
};

const batchDeleteKeys = async () => {
  if (selectedKeys.value.size === 0) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedKeys.value.size} 个 Key 吗？`, "批量删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteSystemRedisKeys(Array.from(selectedKeys.value));
    ElMessage.success(`成功删除 ${selectedKeys.value.size} 个 Key`);
    selectedKeys.value.clear();
    await loadKeys();
  } catch (e) {
    ElMessage.error(`批量删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};'''

if old_vars in content:
    content = content.replace(old_vars, new_vars, 1)
    print('3. 添加批量操作函数成功')
else:
    print('3. 未找到变量位置')

# 4. 在 style 中添加复选框样式
old_style = '''.kv-key-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 12px;
}'''

new_style = '''.kv-key-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 12px;
}
.kv-key-checkbox {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  cursor: pointer;
  accent-color: var(--primary, #3b82f6);
}
.kv-key-item.selected {
  background: var(--primary-light, rgba(59, 130, 246, 0.08));
}'''

if old_style in content:
    content = content.replace(old_style, new_style, 1)
    print('4. 添加复选框样式成功')
else:
    print('4. 未找到样式位置')

with io.open('RedisView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nRedisView.vue 批量操作功能添加完成')
