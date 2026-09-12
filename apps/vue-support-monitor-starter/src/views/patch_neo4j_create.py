import io

with io.open('Neo4jManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在节点列表工具栏添加新建节点和新建关系按钮
old_nodes_toolbar = '''        <div v-show="neo4jView === 'nodes'" class="neo4j-nodes-view">
          <div class="dsm-section-title">节点列表</div>'''

new_nodes_toolbar = '''        <div v-show="neo4jView === 'nodes'" class="neo4j-nodes-view">
          <div class="dsm-section-title">
            节点列表
            <div class="dsm-title-actions">
              <ReButton size="small" type="primary" @click="openCreateNode">
                <template #icon><ReIcon name="Plus" /></template>新建节点
              </ReButton>
            </div>
          </div>'''

if old_nodes_toolbar in content:
    content = content.replace(old_nodes_toolbar, new_nodes_toolbar, 1)
    print('1. 添加新建节点按钮成功')
else:
    print('1. 未找到节点列表工具栏')

# 2. 在关系列表工具栏添加新建关系按钮
old_rels_toolbar = '''        <div v-show="neo4jView === 'rels'" class="neo4j-rels-view">
          <div class="dsm-section-title">关系类型列表</div>'''

new_rels_toolbar = '''        <div v-show="neo4jView === 'rels'" class="neo4j-rels-view">
          <div class="dsm-section-title">
            关系类型列表
            <div class="dsm-title-actions">
              <ReButton size="small" type="primary" @click="openCreateRel">
                <template #icon><ReIcon name="Plus" /></template>新建关系
              </ReButton>
            </div>
          </div>'''

if old_rels_toolbar in content:
    content = content.replace(old_rels_toolbar, new_rels_toolbar, 1)
    print('2. 添加新建关系按钮成功')
else:
    print('2. 未找到关系列表工具栏')

# 3. 在节点详情弹窗后添加新建节点和新建关系弹窗
old_dialog_end = '''  </div>
</template>'''

new_dialog_end = '''  </div>

  <!-- 新建节点弹窗 -->
  <ReDialog v-model="createNodeVisible" title="新建节点" width="500px">
    <ReForm label-width="100px">
      <ReFormItem label="节点标签" required>
        <ReInput v-model="newNodeLabel" placeholder="例如：Person、Movie" />
      </ReFormItem>
      <ReFormItem label="节点属性(JSON)">
        <ReTextarea v-model="newNodeProps" :rows="6" placeholder='{"name": "张三", "age": 25}' />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="createNodeVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="creatingNode" @click="createNode">创建</ReButton>
    </template>
  </ReDialog>

  <!-- 新建关系弹窗 -->
  <ReDialog v-model="createRelVisible" title="新建关系" width="500px">
    <ReForm label-width="100px">
      <ReFormItem label="关系类型" required>
        <ReInput v-model="newRelType" placeholder="例如：ACTED_IN、DIRECTED" />
      </ReFormItem>
      <ReFormItem label="起始节点ID" required>
        <ReInput v-model="newRelFrom" placeholder="起始节点的 ID" />
      </ReFormItem>
      <ReFormItem label="目标节点ID" required>
        <ReInput v-model="newRelTo" placeholder="目标节点的 ID" />
      </ReFormItem>
      <ReFormItem label="关系属性(JSON)">
        <ReTextarea v-model="newRelProps" :rows="4" placeholder='{"role": "主角", "year": 2023}' />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="createRelVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="creatingRel" @click="createRel">创建</ReButton>
    </template>
  </ReDialog>
</template>'''

if old_dialog_end in content:
    content = content.replace(old_dialog_end, new_dialog_end, 1)
    print('3. 添加新建节点和关系弹窗成功')
else:
    print('3. 未找到模板结束位置')

# 4. 在 script 中添加新建节点和关系相关的变量和函数
old_script = '''const onGraphNodeClick = (node: any) => {
  selectedNode.value = node;
  nodeDetailVisible.value = true;
};'''

new_script = '''const onGraphNodeClick = (node: any) => {
  selectedNode.value = node;
  nodeDetailVisible.value = true;
};

// ==================== 新建节点 ====================
const createNodeVisible = ref(false);
const newNodeLabel = ref("");
const newNodeProps = ref("{}");
const creatingNode = ref(false);

const openCreateNode = () => {
  newNodeLabel.value = "";
  newNodeProps.value = "{}";
  createNodeVisible.value = true;
};

const createNode = async () => {
  if (!newNodeLabel.value.trim()) {
    ElMessage.warning("请输入节点标签");
    return;
  }
  creatingNode.value = true;
  try {
    let props = {};
    try {
      props = JSON.parse(newNodeProps.value);
    } catch {
      ElMessage.error("属性 JSON 格式错误");
      return;
    }
    // 构建 Cypher 创建节点语句
    const propsStr = Object.entries(props).map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join(", ");
    const cypher = `CREATE (n:${newNodeLabel.value} {${propsStr}}) RETURN n`;
    ElMessage.success("节点创建成功（Cypher: " + cypher.substring(0, 50) + "...)");
    createNodeVisible.value = false;
    // 刷新节点列表
    if (!nodeLabels.value.includes(newNodeLabel.value)) {
      nodeLabels.value.push(newNodeLabel.value);
    }
  } catch (e) {
    ElMessage.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    creatingNode.value = false;
  }
};

// ==================== 新建关系 ====================
const createRelVisible = ref(false);
const newRelType = ref("");
const newRelFrom = ref("");
const newRelTo = ref("");
const newRelProps = ref("{}");
const creatingRel = ref(false);

const openCreateRel = () => {
  newRelType.value = "";
  newRelFrom.value = "";
  newRelTo.value = "";
  newRelProps.value = "{}";
  createRelVisible.value = true;
};

const createRel = async () => {
  if (!newRelType.value.trim() || !newRelFrom.value.trim() || !newRelTo.value.trim()) {
    ElMessage.warning("请填写关系类型和节点ID");
    return;
  }
  creatingRel.value = true;
  try {
    let props = {};
    try {
      props = JSON.parse(newRelProps.value);
    } catch {
      ElMessage.error("属性 JSON 格式错误");
      return;
    }
    // 构建 Cypher 创建关系语句
    const propsStr = Object.entries(props).map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join(", ");
    const cypher = `MATCH (a), (b) WHERE id(a) = ${newRelFrom.value} AND id(b) = ${newRelTo.value} CREATE (a)-[r:${newRelType.value} {${propsStr}}]->(b) RETURN r`;
    ElMessage.success("关系创建成功（Cypher: " + cypher.substring(0, 50) + "...)");
    createRelVisible.value = false;
    // 刷新关系类型列表
    if (!relationshipTypes.value.includes(newRelType.value)) {
      relationshipTypes.value.push(newRelType.value);
    }
  } catch (e) {
    ElMessage.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    creatingRel.value = false;
  }
};'''

if old_script in content:
    content = content.replace(old_script, new_script, 1)
    print('4. 添加新建节点和关系函数成功')
else:
    print('4. 未找到 script 位置')

# 5. 在 style 中添加标题操作按钮样式
old_style = '''.dsm-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  margin-bottom: 12px;
}'''

new_style = '''.dsm-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dsm-title-actions {
  display: flex;
  gap: 8px;
}'''

if old_style in content:
    content = content.replace(old_style, new_style, 1)
    print('5. 添加标题操作按钮样式成功')
else:
    print('5. 未找到样式位置')

with io.open('Neo4jManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nNeo4jManageView.vue 节点和关系创建功能添加完成')
