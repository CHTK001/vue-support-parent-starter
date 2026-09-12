import io

with io.open('RedisView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 替换 value 编辑部分，支持多数据类型
old_value_editor = '''                <div class="kv-value-label">Value（STRING 类型可编辑）：</div>
                <ReTextarea
                  v-model="editValue"
                  :rows="10"
                  :disabled="keyDetail.type !== 'STRING'"
                  placeholder="STRING 类型的值"
                  class="kv-value-editor"
                />
                <div class="kv-actions">
                  <div class="kv-ttl">
                    <span>过期时间(秒，-1=永不过期)：</span>
                    <ReInputNumber v-model="editTtl" :min="-1" size="small" style="width: 140px" />
                    <ReButton size="small" @click="setExpire">设置 TTL</ReButton>
                  </div>
                  <ReButton type="primary" :loading="saving" @click="saveValue">保存修改</ReButton>
                </div>'''

new_value_editor = '''                <!-- STRING 类型 -->
                <template v-if="keyDetail.type === 'STRING'">
                  <div class="kv-value-label">Value：</div>
                  <ReTextarea
                    v-model="editValue"
                    :rows="8"
                    placeholder="STRING 类型的值"
                    class="kv-value-editor"
                  />
                </template>

                <!-- LIST 类型 -->
                <template v-else-if="keyDetail.type === 'LIST'">
                  <div class="kv-value-label">列表元素（共 {{ keyDetail.size }} 个）：</div>
                  <div class="kv-list-editor">
                    <div v-for="(item, idx) in listItems" :key="idx" class="kv-list-item">
                      <span class="kv-list-index">{{ idx }}</span>
                      <ReInput v-model="listItems[idx]" size="small" class="kv-list-input" />
                      <ReButton icon="Delete" size="small" text @click="removeListItem(idx)" />
                    </div>
                    <div class="kv-list-add">
                      <ReInput v-model="newListItem" size="small" placeholder="新元素值" @keyup.enter="addListItem" />
                      <ReButton icon="Plus" size="small" @click="addListItem">添加</ReButton>
                    </div>
                  </div>
                </template>

                <!-- SET 类型 -->
                <template v-else-if="keyDetail.type === 'SET'">
                  <div class="kv-value-label">集合元素（共 {{ keyDetail.size }} 个）：</div>
                  <div class="kv-list-editor">
                    <div v-for="(item, idx) in setItems" :key="idx" class="kv-list-item">
                      <ReInput v-model="setItems[idx]" size="small" class="kv-list-input" />
                      <ReButton icon="Delete" size="small" text @click="removeSetItem(idx)" />
                    </div>
                    <div class="kv-list-add">
                      <ReInput v-model="newSetItem" size="small" placeholder="新元素值" @keyup.enter="addSetItem" />
                      <ReButton icon="Plus" size="small" @click="addSetItem">添加</ReButton>
                    </div>
                  </div>
                </template>

                <!-- HASH 类型 -->
                <template v-else-if="keyDetail.type === 'HASH'">
                  <div class="kv-value-label">哈希字段（共 {{ keyDetail.size }} 个）：</div>
                  <div class="kv-hash-editor">
                    <div class="kv-hash-header">
                      <span class="kv-hash-field">字段</span>
                      <span class="kv-hash-value">值</span>
                      <span class="kv-hash-action">操作</span>
                    </div>
                    <div v-for="(item, idx) in hashItems" :key="idx" class="kv-hash-row">
                      <ReInput v-model="hashItems[idx].field" size="small" class="kv-hash-field" />
                      <ReInput v-model="hashItems[idx].value" size="small" class="kv-hash-value" />
                      <ReButton icon="Delete" size="small" text @click="removeHashItem(idx)" />
                    </div>
                    <div class="kv-hash-add">
                      <ReInput v-model="newHashField" size="small" placeholder="字段名" class="kv-hash-field" />
                      <ReInput v-model="newHashValue" size="small" placeholder="字段值" class="kv-hash-value" />
                      <ReButton icon="Plus" size="small" @click="addHashItem">添加</ReButton>
                    </div>
                  </div>
                </template>

                <!-- ZSET 类型 -->
                <template v-else-if="keyDetail.type === 'ZSET'">
                  <div class="kv-value-label">有序集合（共 {{ keyDetail.size }} 个）：</div>
                  <div class="kv-hash-editor">
                    <div class="kv-hash-header">
                      <span class="kv-hash-field">成员</span>
                      <span class="kv-hash-value">分数</span>
                      <span class="kv-hash-action">操作</span>
                    </div>
                    <div v-for="(item, idx) in zsetItems" :key="idx" class="kv-hash-row">
                      <ReInput v-model="zsetItems[idx].member" size="small" class="kv-hash-field" />
                      <ReInputNumber v-model="zsetItems[idx].score" size="small" class="kv-hash-value" style="width: 100%" />
                      <ReButton icon="Delete" size="small" text @click="removeZsetItem(idx)" />
                    </div>
                    <div class="kv-hash-add">
                      <ReInput v-model="newZsetMember" size="small" placeholder="成员" class="kv-hash-field" />
                      <ReInputNumber v-model="newZsetScore" size="small" placeholder="分数" class="kv-hash-value" style="width: 100%" />
                      <ReButton icon="Plus" size="small" @click="addZsetItem">添加</ReButton>
                    </div>
                  </div>
                </template>

                <!-- 其他类型 -->
                <template v-else>
                  <div class="kv-value-label">Value（{{ keyDetail.type }} 类型，暂不支持编辑）：</div>
                  <pre class="kv-raw-value">{{ JSON.stringify(keyDetail.value, null, 2) }}</pre>
                </template>

                <div class="kv-actions">
                  <div class="kv-ttl">
                    <span>过期时间(秒，-1=永不过期)：</span>
                    <ReInputNumber v-model="editTtl" :min="-1" size="small" style="width: 140px" />
                    <ReButton size="small" @click="setExpire">设置 TTL</ReButton>
                  </div>
                  <ReButton type="primary" :loading="saving" @click="saveValue">保存修改</ReButton>
                </div>'''

if old_value_editor in content:
    content = content.replace(old_value_editor, new_value_editor, 1)
    print('1. 替换 value 编辑器成功')
else:
    print('1. 未找到 value 编辑器')

# 2. 在 selectKey 函数中添加多数据类型的初始化
old_select_key = '''const selectKey = async (key: string) => {
  selectedKey.value = key;
  detailLoading.value = true;
  try {
    const detail = await getSystemRedisKeyDetail(key);
    keyDetail.value = detail;
    editValue.value = detail?.value ?? "";
    editTtl.value = detail?.ttl ?? -1;
  } catch (e) {
    ElMessage.error(`加载 Key 详情失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    detailLoading.value = false;
  }
};'''

new_select_key = '''const selectKey = async (key: string) => {
  selectedKey.value = key;
  detailLoading.value = true;
  try {
    const detail = await getSystemRedisKeyDetail(key);
    keyDetail.value = detail;
    editValue.value = detail?.value ?? "";
    editTtl.value = detail?.ttl ?? -1;
    // 初始化多数据类型
    const type = detail?.type;
    if (type === "LIST") {
      listItems.value = Array.isArray(detail?.value) ? [...detail.value] : [];
    } else if (type === "SET") {
      setItems.value = Array.isArray(detail?.value) ? [...detail.value] : [];
    } else if (type === "HASH") {
      const hashVal = detail?.value;
      hashItems.value = hashVal && typeof hashVal === "object"
        ? Object.entries(hashVal).map(([field, value]) => ({ field, value: String(value) }))
        : [];
    } else if (type === "ZSET") {
      zsetItems.value = Array.isArray(detail?.value) ? detail.value.map((item: any) => ({ member: String(item.member), score: Number(item.score) })) : [];
    }
  } catch (e) {
    ElMessage.error(`加载 Key 详情失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    detailLoading.value = false;
  }
};'''

if old_select_key in content:
    content = content.replace(old_select_key, new_select_key, 1)
    print('2. 修改 selectKey 成功')
else:
    print('2. 未找到 selectKey')

# 3. 在 script 中添加多数据类型的变量和函数
old_vars = '''const newKeyTtl = ref(-1);'''

new_vars = '''const newKeyTtl = ref(-1);

// ==================== 多数据类型编辑 ====================
const listItems = ref<string[]>([]);
const newListItem = ref("");
const setItems = ref<string[]>([]);
const newSetItem = ref("");
const hashItems = ref<{ field: string; value: string }[]>([]);
const newHashField = ref("");
const newHashValue = ref("");
const zsetItems = ref<{ member: string; score: number }[]>([]);
const newZsetMember = ref("");
const newZsetScore = ref(0);

const addListItem = () => {
  if (newListItem.value.trim()) {
    listItems.value.push(newListItem.value.trim());
    newListItem.value = "";
  }
};
const removeListItem = (idx: number) => listItems.value.splice(idx, 1);

const addSetItem = () => {
  if (newSetItem.value.trim()) {
    setItems.value.push(newSetItem.value.trim());
    newSetItem.value = "";
  }
};
const removeSetItem = (idx: number) => setItems.value.splice(idx, 1);

const addHashItem = () => {
  if (newHashField.value.trim()) {
    hashItems.value.push({ field: newHashField.value.trim(), value: newHashValue.value });
    newHashField.value = "";
    newHashValue.value = "";
  }
};
const removeHashItem = (idx: number) => hashItems.value.splice(idx, 1);

const addZsetItem = () => {
  if (newZsetMember.value.trim()) {
    zsetItems.value.push({ member: newZsetMember.value.trim(), score: newZsetScore.value });
    newZsetMember.value = "";
    newZsetScore.value = 0;
  }
};
const removeZsetItem = (idx: number) => zsetItems.value.splice(idx, 1);'''

if old_vars in content:
    content = content.replace(old_vars, new_vars, 1)
    print('3. 添加多数据类型变量成功')
else:
    print('3. 未找到变量位置')

# 4. 在 style 中添加多数据类型编辑器样式
old_style = '''.kv-value-editor {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
}'''

new_style = '''.kv-value-editor {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
}
.kv-raw-value {
  background: var(--bg-subtle, #f8fafc);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
.kv-list-editor, .kv-hash-editor {
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 6px;
  overflow: hidden;
}
.kv-list-item, .kv-hash-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.1));
}
.kv-list-index {
  width: 32px;
  text-align: center;
  font-family: monospace;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
.kv-list-input { flex: 1; }
.kv-list-add, .kv-hash-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-subtle, #f8fafc);
}
.kv-hash-header {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: var(--bg-subtle, #f8fafc);
  font-weight: 600;
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
}
.kv-hash-field { flex: 1; min-width: 0; }
.kv-hash-value { flex: 1; min-width: 0; }
.kv-hash-action { width: 60px; text-align: center; }'''

if old_style in content:
    content = content.replace(old_style, new_style, 1)
    print('4. 添加多数据类型样式成功')
else:
    print('4. 未找到样式位置')

with io.open('RedisView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nRedisView.vue 多数据类型支持添加完成')
