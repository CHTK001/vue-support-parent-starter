<template>
  <div class="pipeline-graph-page">
    <!-- 顶部工具栏 -->
    <div class="graph-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" size="small" @click="handleCreate">
          <el-icon><Plus /></el-icon> 创建 Pipeline
        </el-button>
        <el-input
          v-model="searchText"
          placeholder="搜索 Pipeline..."
          clearable
          style="width: 200px"
          size="small"
        />
      </div>
      <div class="toolbar-right">
        <el-tag type="info" effect="dark" class="mr-2">
          总计 <b>{{ filteredList.length }}</b> 个 Pipeline
        </el-tag>
        <el-button size="small" :icon="Refresh" @click="loadData" circle />
      </div>
    </div>

    <!-- 主体：左侧列表 + 右侧图谱 -->
    <div class="graph-layout">
      <!-- 左侧 Pipeline 列表 -->
      <div class="pipeline-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">流水线列表</span>
          <div class="stats-dots">
            <span class="dot running" title="运行中" />
            <span class="dot paused" title="已暂停" />
            <span class="dot stopped" title="已停止" />
          </div>
        </div>
        <div class="sidebar-list">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="pipeline-item"
            :class="{ active: selectedId === item.id }"
            @click="selectPipeline(item)"
          >
            <div class="item-indicator" :class="getLifecycle(item.id).toLowerCase()" />
            <div class="item-info">
              <div class="item-name">{{ item.name || item.id }}</div>
              <div class="item-meta">
                <span>{{ item.nodes?.length || 0 }} 节点</span>
                <span class="dot-sep">·</span>
                <span :class="'status-' + getLifecycle(item.id).toLowerCase()">
                  {{ lifecycleText(item.id) }}
                </span>
              </div>
            </div>
            <div class="item-actions" @click.stop>
              <el-button
                v-if="getLifecycle(item.id) !== 'RUNNING'"
                size="small"
                type="success"
                :icon="VideoPlay"
                circle
                @click="handleLifecycle(item.id, 'start')"
              />
              <el-button
                v-if="getLifecycle(item.id) === 'RUNNING'"
                size="small"
                type="warning"
                :icon="VideoPause"
                circle
                @click="handleLifecycle(item.id, 'pause')"
              />
              <el-button
                v-if="getLifecycle(item.id) === 'RUNNING' || getLifecycle(item.id) === 'PAUSED'"
                size="small"
                :icon="SwitchButton"
                circle
                @click="handleLifecycle(item.id, 'stop')"
              />
              <el-popconfirm title="确定删除?" @confirm="handleDelete(item.id)">
                <template #reference>
                  <el-button size="small" type="danger" :icon="Delete" circle />
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div v-if="!filteredList.length" class="sidebar-empty">
            <el-empty description="暂无 Pipeline" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 右侧图谱区域 -->
      <div class="graph-main">
        <!-- 未选中时 -->
        <div v-if="!selectedPipeline" class="graph-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3">
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="5" cy="19" r="2.5" />
            <circle cx="19" cy="19" r="2.5" />
            <line x1="12" y1="7.5" x2="5" y2="16.5" />
            <line x1="12" y1="7.5" x2="19" y2="16.5" />
            <line x1="7.5" y1="19" x2="16.5" y2="19" />
          </svg>
          <p>请从左侧选择 Pipeline 查看节点流向图</p>
        </div>

        <!-- 选中时显示 ScGraph -->
        <div v-else class="graph-container">
          <!-- 选中 Pipeline 信息头 -->
          <div class="graph-info-bar">
            <div class="info-left">
              <span class="info-name">{{ selectedPipeline.name || selectedPipeline.id }}</span>
              <el-tag size="small" effect="dark" type="info">v{{ selectedPipeline.version }}</el-tag>
              <el-tag
                size="small"
                effect="dark"
                :type="getLifecycle(selectedPipeline.id) === 'RUNNING' ? 'success' : 'info'"
              >
                {{ lifecycleText(selectedPipeline.id) }}
              </el-tag>
            </div>
            <div class="info-right">
              <span class="info-desc">{{ selectedPipeline.description || '暂无描述' }}</span>
            </div>
          </div>

          <!-- ScGraph 图谱 -->
          <div class="graph-wrapper" ref="graphWrapperRef">
            <ScGraph
              :nodes="graphNodes"
              :edges="graphEdges"
              :show-toolbar="true"
              height="100%"
              :default-limit="200"
              @node-click="handleNodeClick"
              @canvas-click="handleCanvasClick"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <SaveDialog ref="saveRef" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import {
  Search, Plus, Refresh, VideoPlay, VideoPause,
  SwitchButton, Delete,
} from "@element-plus/icons-vue";
import ScGraph from "@repo/components/ScGraph";
import {
  fetchPipelineList,
  fetchDeletePipeline,
  fetchStartPipeline,
  fetchStopPipeline,
  fetchPausePipeline,
  fetchResumePipeline,
  fetchPipelineStatus,
} from "../../api/pipeline";
import type { ScGraph as ScGraphType, PipelineLifecycle } from "../../types";
import SaveDialog from "./save.vue";

defineOptions({ name: "DatalakePipelinePage" });

const loading = ref(false);
const searchText = ref("");
const list = ref<ScGraphType[]>([]);
const lifecycles = ref<Record<string, PipelineLifecycle>>({});
const selectedId = ref<string>("");
const selectedPipeline = ref<ScGraphType | null>(null);
const saveRef = ref();
let pollTimer: ReturnType<typeof setInterval> | null = null;

const filteredList = computed(() => {
  if (!searchText.value) return list.value;
  const q = searchText.value.toLowerCase();
  return list.value.filter(
    (g) => g.id.toLowerCase().includes(q) || g.name?.toLowerCase().includes(q)
  );
});

const getLifecycle = (id: string) => lifecycles.value[id] || "STOPPED";
const lifecycleText = (id: string) => {
  const map: Record<string, string> = { RUNNING: "运行中", PAUSED: "已暂停", STOPPED: "已停止", ERROR: "异常", RELOADING: "重载中" };
  return map[getLifecycle(id)] || "未知";
};

/** 将 Pipeline 节点转换为 ScGraph 的 nodes/edges */
const graphNodes = computed(() => {
  const p = selectedPipeline.value;
  if (!p?.nodes?.length) return [];
  return p.nodes.map((node, idx) => ({
    id: `${p.id}-${idx}`,
    label: node.spi || node.type,
    group: node.type,
    weight: 1,
    // 额外数据：原始节点引用
    _raw: { index: idx, ...node },
  }));
});

const graphEdges = computed(() => {
  const p = selectedPipeline.value;
  if (!p?.nodes?.length) return [];
  const edges: { from: string; to: string; label: string; weight: number }[] = [];

  p.nodes.forEach((node, idx) => {
    // 顺序连接：当前节点指向下一个节点
    if (idx < p.nodes.length - 1) {
      edges.push({
        from: `${p.id}-${idx}`,
        to: `${p.id}-${idx + 1}`,
        label: "next",
        weight: 1,
      });
    }
    // 条件分支：conditions 指向的目标
    if (node.conditions?.length) {
      node.conditions.forEach((cond) => {
        const targetIdx = p.nodes.findIndex((_, i) => `${p.id}-${i}` === cond.target || _.type === cond.target);
        if (targetIdx >= 0 && targetIdx !== idx) {
          edges.push({
            from: `${p.id}-${idx}`,
            to: `${p.id}-${targetIdx}`,
            label: cond.when,
            weight: 0.8,
          });
        }
      });
    }
  });

  return edges;
});

const NODE_COLORS: Record<string, string> = {
  source: "#5b8ff9",
  filter: "#5ad8a6",
  transform: "#f6bd16",
  enrich: "#9270ca",
  router: "#e8684a",
  aggregate: "#1e9493",
  sink: "#5f87d4",
  default: "#b0b8c4",
};

const selectPipeline = (item: ScGraphType) => {
  selectedId.value = item.id;
  selectedPipeline.value = item;
};

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await fetchPipelineList();
    list.value = data?.data || [];
    // 并行加载状态
    const statuses = await Promise.allSettled(
      list.value.map((g) => fetchPipelineStatus(g.id))
    );
    statuses.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value?.data?.data?.lifecycle) {
        lifecycles.value[list.value[i].id] = result.value.data.data.lifecycle as PipelineLifecycle;
      }
    });
    // 如果当前选中的 pipeline 还在列表中，保持选中
    if (selectedId.value && !list.value.find((g) => g.id === selectedId.value)) {
      selectedId.value = "";
      selectedPipeline.value = null;
    } else if (selectedId.value) {
      const updated = list.value.find((g) => g.id === selectedId.value);
      if (updated) selectedPipeline.value = updated;
    }
  } catch {} finally {
    loading.value = false;
  }
};

const handleCreate = () => saveRef.value?.open();
const handleEdit = (row: ScGraphType) => saveRef.value?.open(row);

const handleDelete = async (id: string) => {
  try {
    await fetchDeletePipeline(id);
    ElMessage.success("删除成功");
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "删除失败");
  }
};

const handleLifecycle = async (id: string, action: string) => {
  try {
    const fn = { start: fetchStartPipeline, stop: fetchStopPipeline, pause: fetchPausePipeline, resume: fetchResumePipeline }[action];
    if (fn) {
      await fn(id);
      ElMessage.success(action === "start" ? "启动成功" : action === "stop" ? "已停止" : action === "pause" ? "已暂停" : "已恢复");
      loadData();
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || "操作失败");
  }
};

const handleNodeClick = (nodeId: string) => {
  // 可扩展：显示节点详情
};

const handleCanvasClick = () => {
  // 点击空白区域
};

onMounted(() => {
  loadData();
  // 每 15 秒刷新状态
  pollTimer = setInterval(loadData, 15000);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped lang="scss">
.pipeline-graph-page {
  height: calc(100vh - 300px);
  min-height: 500px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.graph-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  backdrop-filter: blur(8px);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.graph-layout {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
}

/* ── 左侧边栏 ── */
.pipeline-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  backdrop-filter: blur(8px);

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;

    .stats-dots {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      &.running { background: #67c23a; box-shadow: 0 0 6px #67c23a66; }
      &.paused { background: #e6a23c; box-shadow: 0 0 6px #e6a23c66; }
      &.stopped { background: #909399; box-shadow: 0 0 6px #90939966; }
    }
  }

  .sidebar-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  }
}

.pipeline-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  &.active {
    background: rgba(0, 255, 255, 0.08);
    border: 1px solid rgba(0, 255, 255, 0.15);
  }

  .item-indicator {
    width: 4px;
    height: 32px;
    border-radius: 2px;
    flex-shrink: 0;

    &.running { background: #67c23a; box-shadow: 0 0 8px #67c23a66; }
    &.paused { background: #e6a23c; }
    &.stopped { background: #909399; }
    &.error { background: #f56c6c; }
    &.reloading { background: #409eff; }
  }

  .item-info {
    flex: 1;
    min-width: 0;

    .item-name {
      font-size: 13px;
      font-weight: 500;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-meta {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 4px;

      .dot-sep { opacity: 0.3; }
      .status-running { color: #67c23a; }
      .status-paused { color: #e6a23c; }
      .status-stopped { color: #909399; }
      .status-error { color: #f56c6c; }
    }
  }

  .item-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .item-actions {
    opacity: 1;
  }
}

.sidebar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

/* ── 右侧主区域 ── */
.graph-main {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.graph-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: rgba(255, 255, 255, 0.3);

  p {
    font-size: 14px;
    margin: 0;
  }
}

.graph-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.graph-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  .info-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-name {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
    }
  }
  .info-right {
    .info-desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.graph-wrapper {
  flex: 1;
  min-height: 0;
}
</style>
