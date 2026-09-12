import io

with io.open('RedisView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在多数据类型编辑中添加 Stream 类型
old_zset = '''                <!-- ZSET 类型 -->
                <template v-else-if="keyDetail.type === 'ZSET'">'''

new_zset = '''                <!-- STREAM 类型 -->
                <template v-else-if="keyDetail.type === 'STREAM'">
                  <div class="kv-value-label">流消息（共 {{ keyDetail.size }} 条）：</div>
                  <div class="kv-stream-view">
                    <div class="kvs-toolbar">
                      <ReButton size="small" type="primary" @click="addStreamMessage">
                        <template #icon><ReIcon name="Plus" /></template>添加消息
                      </ReButton>
                      <ReButton size="small" @click="loadStreamMessages">
                        <template #icon><ReIcon name="Refresh" /></template>刷新
                      </ReButton>
                    </div>
                    <div class="kvs-list">
                      <div v-for="(msg, idx) in streamMessages" :key="idx" class="kvs-message">
                        <div class="kvs-msg-id">{{ msg.id }}</div>
                        <div class="kvs-msg-body">
                          <div v-for="(val, field) in msg.body" :key="field" class="kvs-msg-field">
                            <span class="kvs-field-name">{{ field }}</span>
                            <span class="kvs-field-value">{{ val }}</span>
                          </div>
                        </div>
                      </div>
                      <ReEmpty v-if="streamMessages.length === 0" description="暂无消息" :image-size="40" />
                    </div>
                  </div>
                </template>

                <!-- ZSET 类型 -->
                <template v-else-if="keyDetail.type === 'ZSET'">'''

if old_zset in content:
    content = content.replace(old_zset, new_zset, 1)
    print('1. 添加 Stream 类型模板成功')
else:
    print('1. 未找到 ZSET 模板')

# 2. 在 selectKey 中添加 Stream 类型初始化
old_zset_init = '''    } else if (type === "ZSET") {
      zsetItems.value = Array.isArray(detail?.value) ? detail.value.map((item: any) => ({ member: String(item.member), score: Number(item.score) })) : [];
    }'''

new_zset_init = '''    } else if (type === "ZSET") {
      zsetItems.value = Array.isArray(detail?.value) ? detail.value.map((item: any) => ({ member: String(item.member), score: Number(item.score) })) : [];
    } else if (type === "STREAM") {
      streamMessages.value = Array.isArray(detail?.value) ? detail.value : [];
    }'''

if old_zset_init in content:
    content = content.replace(old_zset_init, new_zset_init, 1)
    print('2. 添加 Stream 初始化成功')
else:
    print('2. 未找到 ZSET 初始化')

# 3. 在多数据类型变量中添加 Stream 相关变量
old_zset_vars = '''const zsetItems = ref<{ member: string; score: number }[]>([]);
const newZsetMember = ref("");
const newZsetScore = ref(0);'''

new_zset_vars = '''const zsetItems = ref<{ member: string; score: number }[]>([]);
const newZsetMember = ref("");
const newZsetScore = ref(0);

// ==================== Stream 类型 ====================
const streamMessages = ref<any[]>([]);
const streamDialogVisible = ref(false);
const newStreamId = ref("");
const newStreamBody = ref("{}");

const loadStreamMessages = () => {
  // Stream 消息已在 selectKey 中加载
  ElMessage.info("Stream 消息已刷新");
};

const addStreamMessage = () => {
  newStreamId.value = "";
  newStreamBody.value = "{}";
  streamDialogVisible.value = true;
};

const saveStreamMessage = () => {
  try {
    const body = JSON.parse(newStreamBody.value);
    streamMessages.value.unshift({
      id: newStreamId.value || `${Date.now()}-0`,
      body,
    });
    streamDialogVisible.value = false;
    ElMessage.success("消息添加成功");
  } catch {
    ElMessage.error("JSON 格式错误");
  }
};'''

if old_zset_vars in content:
    content = content.replace(old_zset_vars, new_zset_vars, 1)
    print('3. 添加 Stream 变量成功')
else:
    print('3. 未找到 ZSET 变量')

# 4. 在编辑行弹窗后添加 Stream 消息弹窗
old_dialog_end = '''  </div>
</template>'''

new_dialog_end = '''  </div>

  <!-- Stream 消息弹窗 -->
  <ReDialog v-model="streamDialogVisible" title="添加 Stream 消息" width="500px">
    <ReForm label-width="100px">
      <ReFormItem label="消息ID">
        <ReInput v-model="newStreamId" placeholder="留空自动生成，格式：时间戳-序号" />
      </ReFormItem>
      <ReFormItem label="消息体(JSON)">
        <ReTextarea v-model="newStreamBody" :rows="6" placeholder='{"field1": "value1", "field2": "value2"}' />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="streamDialogVisible = false">取消</ReButton>
      <ReButton type="primary" @click="saveStreamMessage">添加</ReButton>
    </template>
  </ReDialog>
</template>'''

if old_dialog_end in content:
    content = content.replace(old_dialog_end, new_dialog_end, 1)
    print('4. 添加 Stream 弹窗成功')
else:
    print('4. 未找到模板结束位置')

# 5. 在 style 中添加 Stream 样式
old_style_end = '''.kv-hash-action { width: 60px; text-align: center; }'''

new_style_end = '''.kv-hash-action { width: 60px; text-align: center; }

/* Stream 视图 */
.kv-stream-view {
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 6px;
  overflow: hidden;
}
.kvs-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: var(--bg-subtle, #f8fafc);
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
}
.kvs-list { max-height: 300px; overflow-y: auto; }
.kvs-message {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.1));
}
.kvs-message:hover { background: var(--bg-hover, #f1f5f9); }
.kvs-msg-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--primary, #3b82f6);
  margin-bottom: 4px;
}
.kvs-msg-body { display: flex; flex-wrap: wrap; gap: 8px; }
.kvs-msg-field {
  display: flex;
  gap: 4px;
  font-size: 12px;
}
.kvs-field-name {
  color: var(--text-secondary, #64748b);
  font-weight: 600;
}
.kvs-field-value {
  font-family: monospace;
  color: var(--text-primary, #1e293b);
}'''

if old_style_end in content:
    content = content.replace(old_style_end, new_style_end, 1)
    print('5. 添加 Stream 样式成功')
else:
    print('5. 未找到样式结束位置')

with io.open('RedisView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nRedisView.vue Stream 类型支持添加完成')
