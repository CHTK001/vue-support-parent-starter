<template>
  <div class="designer-page">
    <el-card shadow="never" class="header-bar">
      <div class="flex items-center gap-3">
        <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
        <div class="title">{{ definition?.spiderName || code }}</div>
        <el-tag v-if="definition" type="info">{{ definition.spiderCode }}</el-tag>
        <div class="flex-1" />
        <el-button :icon="Plus" @click="addSeedNode">新增种子节点</el-button>
        <el-button :icon="MagicStick" @click="autoLayout">自动布局</el-button>
        <el-button :icon="VideoPlay" type="primary" :loading="starting" @click="run">启动执行</el-button>
      </div>
    </el-card>

    <div class="designer-body">
      <!-- 左侧节点面板 -->
      <aside class="left-panel">
        <div class="panel-title">节点类型</div>
        <draggable :list="palette" item-key="id" :group="{ name: 'spider-node', pull: 'clone', put: false }" :sort="false" :clone="cloneNode">
          <template #item="{ element }">
            <div class="palette-item">
              <el-icon class="mr-2"><component :is="element.icon" /></el-icon>
              {{ element.name }}
            </div>
          </template>
        </draggable>

        <div class="panel-title mt-4">属性</div>
        <div v-if="selectedNode" class="prop-form">
          <el-form label-width="80" size="small">
            <el-form-item label="名称">
              <el-input v-model="selectedNode.text" />
            </el-form-item>
            <el-form-item label="URL">
              <el-input :model-value="selectedNode.data?.url" @update:model-value="(v: any) => (selectedNode.data.url = v)" />
            </el-form-item>
            <el-form-item label="深度">
              <el-input-number :model-value="selectedNode.data?.depth" :min="0" :max="10" @update:model-value="(v: any) => (selectedNode.data.depth = v)" />
            </el-form-item>
            <el-form-item label="动作">
              <el-select :model-value="selectedNode.data?.action" style="width: 100%" @update:model-value="(v: any) => (selectedNode.data.action = v)">
                <el-option label="抓取页面" value="fetch" />
                <el-option label="解析详情" value="parse" />
                <el-option label="提取列表" value="list" />
                <el-option label="提取链接" value="link" />
              </el-select>
            </el-form-item>
            <el-button type="danger" size="small" @click="removeSelected">删除节点</el-button>
          </el-form>
        </div>
        <div v-else class="prop-empty">点击画布上的节点查看属性</div>
      </aside>

      <!-- 中间画布：RelationGraph -->
      <main class="canvas">
        <RelationGraph
          ref="graphRef"
          :data="graphData"
          :options="graphOptions"
          @node-click="onNodeClick"
          @line-click="onLineClick"
        />
      </main>

      <!-- 右侧执行面板 -->
      <aside class="right-panel">
        <div class="panel-title">最近执行</div>
        <div v-if="executions.length === 0" class="prop-empty">暂无执行记录</div>
        <div v-else class="execution-list">
          <div v-for="r in executions" :key="r.spiderExecutionNo" class="execution-card" @click="openExecution(r.spiderExecutionNo)">
            <div class="flex items-center justify-between">
              <span class="exec-no">{{ r.spiderExecutionNo.slice(0, 8) }}</span>
              <el-tag size="small" :type="statusType(r.spiderExecutionStatus)">{{ statusLabel(r.spiderExecutionStatus) }}</el-tag>
            </div>
            <div class="text-xs text-el-text-secondary mt-1">
              已采集 {{ r.spiderCollectedCount ?? 0 }} · 完成 {{ r.spiderUrlCompleted ?? 0 }}
            </div>
          </div>
        </div>

        <div class="panel-title mt-4">实时进度</div>
        <div v-if="currentStatus" class="prop-form">
          <el-progress :percentage="progressPct" :status="progressStatus" />
          <div class="mt-2 text-xs text-el-text-secondary">
            {{ currentStatus.completedCount }} / {{ currentStatus.totalCount || '?' }} 完成 ·
            采集 {{ currentStatus.collectedCount }} ·
            深度 {{ currentStatus.maxDepthReached }}
          </div>
        </div>
        <div v-else class="prop-empty">未启动执行</div>
      </aside>
    </div>

    <el-dialog v-model="runningDialog" :title="`执行进度 ${runningExecutionNo}`" width="560" :show-close="false">
      <el-progress :percentage="progressPct" :status="progressStatus" />
      <div class="mt-2 text-sm">{{ currentStatus?.completedCount || 0 }} 完成 / 采集 {{ currentStatus?.collectedCount || 0 }} 条</div>
      <template #footer>
        <el-button @click="runningDialog = false">隐藏</el-button>
        <el-button type="danger" :loading="stopping" @click="stopRunning">停止</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, MagicStick, Plus, VideoPlay, Document, Link, List, Search } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';
import RelationGraph, { type RGJsonData, type RGOptions, type RGUserEvent } from '@relation-graph/vue3';
import '@relation-graph/vue3/style.css';
import { useRoute, useRouter } from 'vue-router';
import { spiderApi } from '../api/spiderApi';
import type { SpiderDefinition, ExecutionRecord, ExecutionStatus } from '../api/types';

const route = useRoute();
const router = useRouter();
const code = computed(() => String(route.params.code ?? ''));

const definition = ref<SpiderDefinition | null>(null);
const executions = ref<ExecutionRecord[]>([]);
const currentStatus = ref<ExecutionStatus | null>(null);
const runningDialog = ref(false);
const runningExecutionNo = ref('');
const starting = ref(false);
const stopping = ref(false);
const graphRef = shallowRef<any>(null);
const selectedNode = ref<any>(null);

/** 节点类型面板 */
const palette = ref([
  { id: 'seed', name: '种子页', icon: Document, action: 'fetch', url: '', depth: 0 },
  { id: 'list', name: '列表页', icon: List, action: 'list', url: '', depth: 1 },
  { id: 'detail', name: '详情页', icon: Document, action: 'parse', url: '', depth: 2 },
  { id: 'link', name: '链接提取', icon: Link, action: 'link', url: '', depth: 1 },
]);

const cloneNode = (item: any) => ({
  id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  text: item.name,
  color: '#5B8FF9',
  data: { action: item.action, url: item.url, depth: item.depth },
});

/** 画布初始数据 */
const graphData = ref<RGJsonData>({ rootId: 'n0', nodes: [], lines: [] });

const graphOptions = ref<RGOptions>({
  defaultNodeShape: 0,
  defaultLineShape: 1,
  layout: { layoutName: 'force' },
  defaultNodeWidth: 120,
  defaultNodeHeight: 60,
});

const goBack = () => {
  router.push('/spider/definitions');
};

const loadDefinition = async () => {
  if (!code.value) return;
  try {
    definition.value = await spiderApi.getDefinition(code.value);
    initGraphFromDefinition();
  } catch (e) {
    ElMessage.error('加载爬虫定义失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const loadExecutions = async () => {
  if (!code.value) return;
  try {
    const res = await spiderApi.pageExecutions(code.value, 1, 10);
    executions.value = (res?.records ?? []) as ExecutionRecord[];
  } catch {
    // 静默
  }
};

const initGraphFromDefinition = () => {
  if (!definition.value) return;
  const seed: any = {
    id: 'n-seed',
    text: definition.value.spiderName || '种子',
    color: '#5B8FF9',
    data: { action: 'fetch', url: definition.value.spiderEntryUrl, depth: 0 },
  };
  graphData.value = {
    rootId: 'n-seed',
    nodes: [seed],
    lines: [],
  };
};

const addSeedNode = () => {
  const id = `n-${Date.now()}`;
  graphData.value.nodes.push({
    id,
    text: '新节点',
    color: '#5B8FF9',
    data: { action: 'fetch', url: '', depth: 0 },
  } as any);
};

const autoLayout = async () => {
  const ins: any = graphRef.value?.getInstance?.();
  if (ins && typeof ins.refresh === 'function') {
    await ins.refresh();
  }
  if (ins?.layout?.force) {
    await ins.layout.force(2000);
  }
  ElMessage.success('已重新布局');
};

const onNodeClick = (node: any, _ev: RGUserEvent) => {
  selectedNode.value = node;
};

const onLineClick = (_line: any, _link: any, _ev: RGUserEvent) => {
  // 编辑连线等高级能力可在后续迭代扩展
};

const removeSelected = () => {
  if (!selectedNode.value) return;
  const id = selectedNode.value.id;
  graphData.value.nodes = graphData.value.nodes.filter((n) => n.id !== id);
  graphData.value.lines = graphData.value.lines.filter((l) => l.from !== id && l.to !== id);
  selectedNode.value = null;
};

const run = async () => {
  if (!code.value) return;
  starting.value = true;
  try {
    const executionNo = await spiderApi.start(code.value);
    runningExecutionNo.value = executionNo;
    runningDialog.value = true;
    pollStatus(executionNo);
    loadExecutions();
  } catch (e) {
    ElMessage.error('启动失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    starting.value = false;
  }
};

const pollStatus = async (executionNo: string) => {
  const tick = async () => {
    try {
      const s = await spiderApi.status(executionNo);
      currentStatus.value = s;
      const st = s?.status;
      if (st === 'SUCCESS' || st === 'FAILED' || st === 'STOPPED') {
        runningDialog.value = false;
        loadExecutions();
        return;
      }
    } catch {
      // 静默
    }
    setTimeout(tick, 1500);
  };
  tick();
};

const stopRunning = async () => {
  if (!runningExecutionNo.value) return;
  stopping.value = true;
  try {
    await spiderApi.stop(runningExecutionNo.value);
    ElMessage.success('已发送停止指令');
  } catch (e) {
    ElMessage.error('停止失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    stopping.value = false;
  }
};

const openExecution = (executionNo: string) => {
  runningExecutionNo.value = executionNo;
  pollStatus(executionNo);
  runningDialog.value = true;
};

const statusType = (s?: string) => {
  if (s === 'SUCCESS') return 'success';
  if (s === 'FAILED') return 'danger';
  if (s === 'RUNNING') return 'warning';
  if (s === 'STOPPED') return 'info';
  return 'info';
};
const statusLabel = (s?: string) =>
  ({ SUCCESS: '成功', FAILED: '失败', RUNNING: '运行中', STOPPED: '已停止' } as Record<string, string>)[s ?? ''] || s || '-';

const progressPct = computed(() => {
  const s = currentStatus.value;
  if (!s) return 0;
  const total = s.totalCount || 0;
  if (total <= 0) return s.completedCount > 0 ? 99 : 0;
  return Math.min(100, Math.round((s.completedCount / total) * 100));
});

const progressStatus = computed<'success' | 'exception' | 'warning' | undefined>(() => {
  const s = currentStatus.value?.status;
  if (s === 'SUCCESS') return 'success';
  if (s === 'FAILED') return 'exception';
  if (s === 'STOPPED') return 'warning';
  return undefined;
});

onMounted(() => {
  loadDefinition();
  loadExecutions();
});
onBeforeUnmount(() => {
  // 关闭可能未完成的轮询
  currentStatus.value = null;
});
</script>

<style scoped>
.designer-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.header-bar {
  margin-bottom: 8px;
}
.header-bar :deep(.el-card__body) {
  padding: 8px 16px;
}
.title {
  font-weight: 600;
  font-size: 16px;
}
.designer-body {
  flex: 1;
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  gap: 8px;
  padding: 0 16px 16px;
  overflow: hidden;
}
.left-panel,
.right-panel {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 12px;
  overflow-y: auto;
}
.panel-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}
.palette-item {
  padding: 8px 10px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: grab;
  display: flex;
  align-items: center;
}
.palette-item:hover {
  background: var(--el-color-primary-light-9);
}
.canvas {
  background: var(--el-bg-color);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  min-height: 520px;
}
.prop-empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  padding: 12px;
  background: var(--el-fill-color-blank);
  border-radius: 6px;
  text-align: center;
}
.execution-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.execution-card {
  padding: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
}
.execution-card:hover {
  background: var(--el-fill-color-light);
}
.exec-no {
  font-family: monospace;
  font-weight: 600;
}
</style>