import io

with io.open('Neo4jManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在内容区域添加图可视化 Tab
old_content = '''      <div class="dsm-content">
        <div class="dsm-info-card">'''

new_content = '''      <div class="dsm-content">
        <!-- 视图切换 -->
        <div class="neo4j-view-tabs">
          <button class="nvt-btn" :class="{ active: neo4jView === 'overview' }" @click="neo4jView = 'overview'">概览</button>
          <button class="nvt-btn" :class="{ active: neo4jView === 'graph' }" @click="neo4jView = 'graph'">图可视化</button>
          <button class="nvt-btn" :class="{ active: neo4jView === 'nodes' }" @click="neo4jView = 'nodes'">节点列表</button>
          <button class="nvt-btn" :class="{ active: neo4jView === 'rels' }" @click="neo4jView = 'rels'">关系列表</button>
        </div>

        <!-- 概览视图 -->
        <div v-show="neo4jView === 'overview'">
        <div class="dsm-info-card">'''

if old_content in content:
    content = content.replace(old_content, new_content, 1)
    print('1. 添加视图切换成功')
else:
    print('1. 未找到内容区域')

# 2. 在节点列表表格后添加图可视化和关系列表
old_nodes_end = '''          <ReTable :data="nodes" :columns="nodeColumns" :loading="loading" stripe border height="300px" />
        </div>'''

new_nodes_end = '''          <ReTable :data="nodes" :columns="nodeColumns" :loading="loading" stripe border height="300px" @row-click="onNodeClick" />
        </div>
        </div>

        <!-- 图可视化视图 -->
        <div v-show="neo4jView === 'graph'" class="neo4j-graph-view">
          <div class="ngv-toolbar">
            <span>节点关系图（示意）</span>
            <ReButton size="small" @click="renderGraph">
              <template #icon><ReIcon name="Refresh" /></template>重新渲染
            </ReButton>
          </div>
          <svg class="ngv-svg" viewBox="0 0 800 500">
            <!-- 关系线 -->
            <line v-for="(rel, idx) in graphEdges" :key="'e'+idx"
              :x1="rel.x1" :y1="rel.y1" :x2="rel.x2" :y2="rel.y2"
              stroke="var(--border-default, #94a3b8)" stroke-width="1.5" stroke-dasharray="4,2" />
            <!-- 节点 -->
            <g v-for="(node, idx) in graphNodes" :key="'n'+idx" :transform="`translate(${node.x}, ${node.y})`" @click="onGraphNodeClick(node)" style="cursor:pointer">
              <circle r="30" :fill="node.color" stroke="var(--primary, #3b82f6)" stroke-width="2" />
              <text text-anchor="middle" dy="5" fill="white" font-size="11" font-weight="600">{{ node.label }}</text>
            </g>
            <!-- 关系标签 -->
            <text v-for="(rel, idx) in graphEdges" :key="'rl'+idx"
              :x="(rel.x1 + rel.x2) / 2" :y="(rel.y1 + rel.y2) / 2 - 5"
              text-anchor="middle" font-size="10" fill="var(--text-secondary, #64748b)">{{ rel.type }}</text>
          </svg>
          <div class="ngv-legend">
            <span v-for="(color, label) in nodeColors" :key="label" class="ngv-legend-item">
              <span class="ngv-legend-dot" :style="{ background: color }"></span>{{ label }}
            </span>
          </div>
        </div>

        <!-- 关系列表视图 -->
        <div v-show="neo4jView === 'rels'" class="neo4j-rels-view">
          <div class="dsm-section-title">关系类型列表</div>
          <ReTable :data="relationshipTypes" :columns="relColumns" :loading="loading" stripe border height="400px">
            <template #col-count="{ row }">
              <ReTag size="small">{{ row.count || '—' }}</ReTag>
            </template>
          </ReTable>
        </div>

        <!-- 节点详情弹窗 -->
        <ReDialog v-model="nodeDetailVisible" title="节点详情" width="500px">
          <div v-if="selectedNode" class="node-detail">
            <div class="nd-row"><span class="nd-label">标签：</span><span class="nd-value">{{ selectedNode.label }}</span></div>
            <div class="nd-row"><span class="nd-label">ID：</span><span class="nd-value">{{ selectedNode.id }}</span></div>
            <div class="nd-row"><span class="nd-label">属性：</span></div>
            <pre class="nd-props">{{ JSON.stringify(selectedNode.properties || {}, null, 2) }}</pre>
          </div>
        </ReDialog>'''

if old_nodes_end in content:
    content = content.replace(old_nodes_end, new_nodes_end, 1)
    print('2. 添加图可视化和关系列表成功')
else:
    print('2. 未找到节点列表结束位置')

# 3. 在 script 中添加图可视化相关的变量和函数
old_script = '''const cypherVisible = ref(false);'''

new_script = '''const cypherVisible = ref(false);

// ==================== 图可视化 ====================
const neo4jView = ref<'overview' | 'graph' | 'nodes' | 'rels'>('overview');
const graphNodes = ref<any[]>([]);
const graphEdges = ref<any[]>([]);
const nodeDetailVisible = ref(false);
const selectedNode = ref<any>(null);
const nodeColors: Record<string, string> = {
  'Person': '#3b82f6',
  'Movie': '#8b5cf6',
  'Company': '#10b981',
  'Product': '#f59e0b',
  'Order': '#ef4444',
  'User': '#06b6d4',
  'default': '#64748b',
};

const renderGraph = () => {
  // 基于节点标签生成示意图
  const labels = nodeLabels.value.slice(0, 6);
  const centerX = 400, centerY = 250, radius = 150;
  graphNodes.value = labels.map((label, idx) => {
    const angle = (idx / labels.length) * Math.PI * 2 - Math.PI / 2;
    return {
      label: label.substring(0, 8),
      fullLabel: label,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      color: nodeColors[label] || nodeColors['default'],
      id: idx,
      properties: { label, sample: '...' },
    };
  });
  // 生成关系边（所有节点两两连接）
  graphEdges.value = [];
  for (let i = 0; i < graphNodes.value.length; i++) {
    for (let j = i + 1; j < graphNodes.value.length; j++) {
      graphEdges.value.push({
        x1: graphNodes.value[i].x,
        y1: graphNodes.value[i].y,
        x2: graphNodes.value[j].x,
        y2: graphNodes.value[j].y,
        type: relationshipTypes.value[(i + j) % relationshipTypes.value.length]?.substring(0, 6) || 'REL',
      });
    }
  }
};

const onNodeClick = (row: any) => {
  selectedNode.value = { ...row, properties: row };
  nodeDetailVisible.value = true;
};

const onGraphNodeClick = (node: any) => {
  selectedNode.value = node;
  nodeDetailVisible.value = true;
};

// 关系列定义
const relColumns = [
  { prop: 'type', label: '关系类型', minWidth: 200 },
  { prop: 'count', label: '数量', width: 120, slot: 'count' },
];'''

if old_script in content:
    content = content.replace(old_script, new_script, 1)
    print('3. 添加图可视化函数成功')
else:
    print('3. 未找到 script 位置')

# 4. 在 style 中添加图可视化样式
old_style_end = '''.dsm-empty-icon { opacity: 0.3; }'''

new_style_end = '''.dsm-empty-icon { opacity: 0.3; }

/* Neo4j 视图切换 */
.neo4j-view-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  padding-bottom: 8px;
}
.nvt-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}
.nvt-btn:hover { background: var(--bg-hover, #f1f5f9); }
.nvt-btn.active {
  background: var(--primary, #3b82f6);
  color: white;
}

/* 图可视化 */
.neo4j-graph-view {
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 8px;
  overflow: hidden;
}
.ngv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
.ngv-svg {
  width: 100%;
  height: 450px;
  background: var(--bg-subtle, #f8fafc);
}
.ngv-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
}
.ngv-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, #64748b);
}
.ngv-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 节点详情 */
.node-detail { padding: 8px 0; }
.nd-row {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.1));
}
.nd-label { width: 80px; color: var(--text-secondary, #64748b); font-size: 13px; }
.nd-value { flex: 1; font-size: 13px; font-family: monospace; }
.nd-props {
  background: var(--bg-subtle, #f8fafc);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  margin-top: 8px;
}'''

if old_style_end in content:
    content = content.replace(old_style_end, new_style_end, 1)
    print('4. 添加图可视化样式成功')
else:
    print('4. 未找到样式结束位置')

with io.open('Neo4jManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nNeo4jManageView.vue 图可视化功能添加完成')
