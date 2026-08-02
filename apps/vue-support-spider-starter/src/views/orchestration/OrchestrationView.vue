<script setup lang="ts">
import { computed, h, markRaw, ref, shallowRef, watch } from "vue";
import {
  VueFlow,
  Connection,
  MarkerType,
  type Edge,
  type Node,
} from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";
import "@vue-flow/minimap/dist/style.css";
import {
  Connection as IconConnection,
  Document,
  Link,
  Promotion,
  Setting,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { pageDefinitions, saveDefinition } from "@/api/spider";
import type { SpiderDefinition } from "@/types/spider";
import CustomNode from "@/components/CustomNode.vue";

/**
 * 节点类型元信息。
 */
interface NodeMeta {
  type: "entry" | "parser" | "pipeline" | "output";
  label: string;
  icon: typeof Document;
  desc: string;
  defaults: Record<string, unknown>;
}

const palette: NodeMeta[] = [
  {
    type: "entry",
    label: "入口 URL",
    icon: Link,
    desc: "采集起始地址",
    defaults: { url: "https://gitee.com", depth: 2, maxPages: 10 },
  },
  {
    type: "parser",
    label: "HTML 解析器",
    icon: Document,
    desc: "使用 Jsoup 解析 HTML",
    defaults: { selector: "body", fields: "title,url" },
  },
  {
    type: "pipeline",
    label: "Pipeline",
    icon: Promotion,
    desc: "数据落库 / 控制台输出",
    defaults: { type: "DB" },
  },
  {
    type: "output",
    label: "输出",
    icon: Setting,
    desc: "输出至采集数据表",
    defaults: {},
  },
];

const nodeTypes = {
  default: (props: any) => h(CustomNode, { node: props.node, palette }),
};

/**
 * 画布节点与边。
 *
 * <p>使用 shallowRef 避免 Vue Flow 节点类型深度递归推导报错；节点对象本身在拖拽过程中
 * 会被高频更新，shallowRef 也能避免产生不必要的响应式开销。</p>
 */
const nodes = shallowRef<Node[]>([
  {
    id: "entry-1",
    type: "default",
    position: { x: 80, y: 80 },
    data: { label: "入口 URL", meta: palette[0] },
    class: "spider-node is-source",
  },
  {
    id: "parser-1",
    type: "default",
    position: { x: 360, y: 80 },
    data: { label: "HTML 解析器", meta: palette[1] },
    class: "spider-node is-parser",
  },
  {
    id: "pipeline-1",
    type: "default",
    position: { x: 640, y: 80 },
    data: { label: "Pipeline", meta: palette[2] },
    class: "spider-node is-pipeline",
  },
  {
    id: "output-1",
    type: "default",
    position: { x: 920, y: 80 },
    data: { label: "输出", meta: palette[3] },
    class: "spider-node is-parser",
  },
]);

const edges = shallowRef<Edge[]>([
  {
    id: "e1",
    source: "entry-1",
    target: "parser-1",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#475569", strokeWidth: 1.5 },
  },
  {
    id: "e2",
    source: "parser-1",
    target: "pipeline-1",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#475569", strokeWidth: 1.5 },
  },
  {
    id: "e3",
    source: "pipeline-1",
    target: "output-1",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#475569", strokeWidth: 1.5 },
  },
]);

/**
 * 当前选中节点。
 */
const selectedNode = ref<Node | null>(null);
const selectedNodeMeta = computed(() => {
  const n = selectedNode.value;
  if (!n) return null;
  return palette.find((m) => m.label === n.data.label) ?? null;
});

watch(
  () => nodes.value,
  () => {
    if (!selectedNode.value) return;
    const exists = nodes.value.find((n) => n.id === selectedNode.value!.id);
    if (!exists) selectedNode.value = null;
  },
  { deep: true }
);

/**
 * 从面板拖入节点。
 */
function addNode(meta: NodeMeta) {
  const id = `${meta.type}-${Date.now()}`;
  nodes.value = [
    ...nodes.value,
    {
      id,
      type: "default",
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: { label: meta.label, meta },
      class: `spider-node is-${meta.type === "entry" ? "source" : meta.type}`,
    },
  ];
}

/**
 * 删除选中节点（不允许删除 entry-1）。
 */
function removeSelected() {
  if (!selectedNode.value) return;
  if (selectedNode.value.id === "entry-1") {
    ElMessage.warning("入口节点不可删除");
    return;
  }
  const id = selectedNode.value.id;
  nodes.value = nodes.value.filter((n) => n.id !== id);
  edges.value = edges.value.filter(
    (e) => e.source !== id && e.target !== id
  );
  selectedNode.value = null;
}

/**
 * 测试运行：通过编排 -> 提取入口 URL 与参数 -> 保存为爬虫定义 -> 调用后端 saveDefinition。
 */
const saving = ref(false);
const lastResult = ref<SpiderDefinition | null>(null);
const testLogs = ref<string[]>([]);

function log(line: string) {
  const ts = new Date().toLocaleTimeString();
  testLogs.value.push(`[${ts}] ${line}`);
}

async function runTest() {
  const entry = nodes.value.find((n) =>
    (n.data?.meta?.type as string) === "entry"
  );
  if (!entry) {
    ElMessage.warning("画布上缺少「入口 URL」节点");
    return;
  }
  const url = (entry.data as any).params?.url || "https://gitee.com";
  const depth = (entry.data as any).params?.depth ?? 2;
  const maxPages = (entry.data as any).params?.maxPages ?? 10;

  const code = `ORCH-${Date.now().toString(36).toUpperCase()}`;
  const name = `编排测试-${new Date().toLocaleTimeString()}`;

  await ElMessageBox.confirm(
    `将通过编排保存一个真实爬虫定义：\n编码: ${code}\n入口: ${url}\n深度: ${depth}\n最大页数: ${maxPages}`,
    "确认测试",
    { type: "info" }
  );

  saving.value = true;
  testLogs.value = [];
  log(`开始编排测试，生成定义 code=${code}`);
  try {
    const result = await saveDefinition({
      spiderCode: code,
      spiderName: name,
      spiderEntryUrl: url,
      spiderMaxDepth: depth,
      spiderMaxPages: maxPages,
      spiderStatus: 1,
      spiderDescription: `通过前端编排生成的测试定义，时间：${new Date().toISOString()}`,
    } as any);
    lastResult.value = result;
    log(`✓ 后端保存成功，spiderId=${result.spiderId ?? "-"}`);
    log(`✓ 已生成执行链路：定义已落库，可在「执行记录」中查看后续批次`);
    ElMessage.success(`测试运行成功，定义已保存：${code}`);
  } catch (e) {
    log(`✗ 测试失败：${(e as Error).message}`);
  } finally {
    saving.value = false;
  }
}

/**
 * 加载最近一次保存的定义（用于回填右侧详情）。
 */
const recent = ref<SpiderDefinition[]>([]);
async function loadRecent() {
  const page = await pageDefinitions(1, 5);
  recent.value = page.records;
}
loadRecent();

/**
 * Connection 事件：把新连线存进 edges。
 */
function onConnect(params: Connection) {
  if (!params.source || !params.target) return;
  if (params.source === params.target) return;
  edges.value = [
    ...edges.value,
    {
      id: `e-${Date.now()}`,
      source: params.source,
      target: params.target,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#475569", strokeWidth: 1.5 },
    },
  ];
}

/**
 * 选中节点回调。
 */
function onNodeClick(event: any) {
  selectedNode.value = event.node;
}

/**
 * 删除边。
 */
function onEdgeClick(event: any) {
  edges.value = edges.value.filter((e) => e.id !== event.edge.id);
}

/**
 * 画布清空（保留入口节点）。
 */
function reset() {
  ElMessageBox.confirm("确认清空画布？入口节点会被重置", "清空", {
    type: "warning",
  }).then(() => {
    nodes.value = [
      {
        id: "entry-1",
        type: "default",
        position: { x: 80, y: 80 },
        data: { label: "入口 URL", meta: palette[0], params: { ...palette[0].defaults } },
        class: "spider-node is-source",
      },
    ];
    edges.value = [];
    selectedNode.value = null;
    lastResult.value = null;
    testLogs.value = [];
  }).catch(() => {});
}

// 初始化入口节点默认参数
nodes.value[0].data = {
  ...nodes.value[0].data,
  params: { ...palette[0].defaults },
} as any;

watch(selectedNode, (n) => {
  if (!n) return;
  // ensure params exist
  const meta = palette.find((m) => m.label === (n.data as any).label);
  if (meta && !(n.data as any).params) {
    (n.data as any).params = { ...meta.defaults };
  }
});
</script>

<template>
  <div class="orchestration-wrap">
    <!-- 左侧：节点面板 -->
    <aside class="orchestration-side">
      <div class="section-title">节点</div>
      <div
        v-for="item in palette"
        :key="item.type"
        class="node-palette-item"
        @click="addNode(item)"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <div style="flex: 1">
          <div style="font-weight: 600">{{ item.label }}</div>
          <div style="font-size: 12px; color: var(--el-text-color-secondary)">
            {{ item.desc }}
          </div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 20px">最近定义</div>
      <div
        v-for="r in recent"
        :key="r.spiderCode"
        style="
          padding: 8px 10px;
          border: 1px solid var(--el-border-color-light);
          border-radius: 6px;
          margin-bottom: 6px;
          font-size: 12.5px;
          background: var(--el-bg-color-page);
        "
      >
        <div style="font-weight: 600">{{ r.spiderName }}</div>
        <div style="color: var(--el-text-color-secondary)">
          {{ r.spiderCode }} · 深度 {{ r.spiderMaxDepth }}
        </div>
      </div>
      <div
        v-if="recent.length === 0"
        style="
          font-size: 12px;
          color: var(--el-text-color-secondary);
          padding: 8px 4px;
        "
      >
        暂无定义，请先在「爬虫定义」中创建
      </div>
    </aside>

    <!-- 中间：画布 -->
    <div class="orchestration-canvas">
      <div
        style="
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
          z-index: 10;
        "
      >
        <el-button size="small" @click="reset">清空</el-button>
        <el-button
          size="small"
          type="primary"
          :icon="markRaw(IconConnection)"
          :loading="saving"
          @click="runTest"
        >
          测试运行
        </el-button>
      </div>
<VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-edge-options="{ markerEnd: { type: MarkerType.ArrowClosed } }"
        :nodes-draggable="true"
        :nodes-connectable="true"
        :edges-updatable="true"
        :elevated-edges="true"
        :node-types="nodeTypes"
        fit-view-on-init
        @connect="onConnect"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
      >
        <Background pattern-color="#cbd5e1" :gap="16" />
        <MiniMap />
        <Controls />
      </VueFlow>
    </div>

    <!-- 右侧：节点配置 + 测试日志 -->
    <aside class="orchestration-config">
      <div class="section-title">节点配置</div>
      <div v-if="!selectedNodeMeta" style="font-size: 13px; color: var(--el-text-color-secondary)">
        点击画布上的节点进行配置
      </div>
      <div v-else>
        <div style="font-weight: 600; margin-bottom: 8px">
          {{ selectedNodeMeta.label }}
        </div>
        <div
          style="
            font-size: 12px;
            color: var(--el-text-color-secondary);
            margin-bottom: 12px;
          "
        >
          {{ selectedNodeMeta.desc }}
        </div>
        <template v-if="selectedNodeMeta.type === 'entry'">
          <el-form label-width="80px" size="small">
            <el-form-item label="URL">
              <el-input
                :model-value="(selectedNode!.data as any).params?.url"
                @update:model-value="(v: string) => ((selectedNode!.data as any).params.url = v)"
              />
            </el-form-item>
            <el-form-item label="深度">
              <el-input-number
                :model-value="(selectedNode!.data as any).params?.depth"
                :min="0"
                :max="10"
                @update:model-value="(v: number) => ((selectedNode!.data as any).params.depth = v)"
              />
            </el-form-item>
            <el-form-item label="最大页数">
              <el-input-number
                :model-value="(selectedNode!.data as any).params?.maxPages"
                :min="1"
                :max="1000"
                @update:model-value="(v: number) => ((selectedNode!.data as any).params.maxPages = v)"
              />
            </el-form-item>
          </el-form>
        </template>
        <template v-else-if="selectedNodeMeta.type === 'parser'">
          <el-form label-width="80px" size="small">
            <el-form-item label="选择器">
              <el-input
                :model-value="(selectedNode!.data as any).params?.selector"
                @update:model-value="(v: string) => ((selectedNode!.data as any).params.selector = v)"
              />
            </el-form-item>
            <el-form-item label="提取字段">
              <el-input
                :model-value="(selectedNode!.data as any).params?.fields"
                @update:model-value="(v: string) => ((selectedNode!.data as any).params.fields = v)"
              />
            </el-form-item>
          </el-form>
        </template>
        <template v-else-if="selectedNodeMeta.type === 'pipeline'">
          <el-form label-width="80px" size="small">
            <el-form-item label="类型">
              <el-select
                :model-value="(selectedNode!.data as any).params?.type"
                @update:model-value="(v: string) => ((selectedNode!.data as any).params.type = v)"
              >
                <el-option label="DB（数据库落库）" value="DB" />
                <el-option label="CONSOLE（控制台）" value="CONSOLE" />
              </el-select>
            </el-form-item>
          </el-form>
        </template>

        <el-button
          size="small"
          type="danger"
          plain
          style="margin-top: 8px"
          @click="removeSelected"
        >
          删除该节点
        </el-button>
      </div>

      <div class="section-title" style="margin-top: 20px">测试日志</div>
      <div
        style="
          background: #0f172a;
          color: #cbd5e1;
          border-radius: 6px;
          padding: 10px;
          font-size: 12px;
          max-height: 200px;
          overflow: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        "
      >
        <div v-if="testLogs.length === 0" style="color: #64748b">
          等待测试运行…
        </div>
        <div v-for="(line, idx) in testLogs" :key="idx">{{ line }}</div>
      </div>

      <template v-if="lastResult">
        <div class="section-title" style="margin-top: 20px">最近保存</div>
        <div style="font-size: 13px">
          <div class="detail-row">
            <span class="label">编码</span>
            <span class="value">{{ lastResult.spiderCode }}</span>
          </div>
          <div class="detail-row">
            <span class="label">入口</span>
            <span class="value">{{ lastResult.spiderEntryUrl }}</span>
          </div>
          <div class="detail-row">
            <span class="label">深度</span>
            <span class="value">{{ lastResult.spiderMaxDepth }}</span>
          </div>
          <div class="detail-row">
            <span class="label">页数</span>
            <span class="value">{{ lastResult.spiderMaxPages }}</span>
          </div>
        </div>
      </template>
    </aside>
  </div>
</template>