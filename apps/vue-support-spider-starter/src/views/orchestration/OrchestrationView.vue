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
 * 鑺傜偣绫诲瀷鍏冧俊鎭€? */
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
    label: "鍏ュ彛 URL",
    icon: Link,
    desc: "閲囬泦璧峰鍦板潃",
    defaults: { url: "https://gitee.com", depth: 2, maxPages: 10 },
  },
  {
    type: "parser",
    label: "HTML 瑙ｆ瀽鍣?,
    icon: Document,
    desc: "浣跨敤 Jsoup 瑙ｆ瀽 HTML",
    defaults: { selector: "body", fields: "title,url" },
  },
  {
    type: "pipeline",
    label: "Pipeline",
    icon: Promotion,
    desc: "鏁版嵁钀藉簱 / 鎺у埗鍙拌緭鍑?,
    defaults: { type: "DB" },
  },
  {
    type: "output",
    label: "杈撳嚭",
    icon: Setting,
    desc: "杈撳嚭鑷抽噰闆嗘暟鎹〃",
    defaults: {},
  },
];

const nodeTypes = {
  default: (props: any) => h(CustomNode, { node: props.node, palette }),
};

/**
 * 鐢诲竷鑺傜偣涓庤竟銆? *
 * <p>浣跨敤 shallowRef 閬垮厤 Vue Flow 鑺傜偣绫诲瀷娣卞害閫掑綊鎺ㄥ鎶ラ敊锛涜妭鐐瑰璞℃湰韬湪鎷栨嫿杩囩▼涓? * 浼氳楂橀鏇存柊锛宻hallowRef 涔熻兘閬垮厤浜х敓涓嶅繀瑕佺殑鍝嶅簲寮忓紑閿€銆?/p>
 */
const nodes = shallowRef<Node[]>([
  {
    id: "entry-1",
    type: "default",
    position: { x: 80, y: 80 },
    data: { label: "鍏ュ彛 URL", meta: palette[0] },
    class: "spider-node is-source",
  },
  {
    id: "parser-1",
    type: "default",
    position: { x: 360, y: 80 },
    data: { label: "HTML 瑙ｆ瀽鍣?, meta: palette[1] },
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
    data: { label: "杈撳嚭", meta: palette[3] },
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
 * 褰撳墠閫変腑鑺傜偣銆? */
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
 * 浠庨潰鏉挎嫋鍏ヨ妭鐐广€? */
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
 * 鍒犻櫎閫変腑鑺傜偣锛堜笉鍏佽鍒犻櫎 entry-1锛夈€? */
function removeSelected() {
  if (!selectedNode.value) return;
  if (selectedNode.value.id === "entry-1") {
    ElMessage.warning("鍏ュ彛鑺傜偣涓嶅彲鍒犻櫎");
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
 * 娴嬭瘯杩愯锛氶€氳繃缂栨帓 -> 鎻愬彇鍏ュ彛 URL 涓庡弬鏁?-> 淇濆瓨涓虹埇铏畾涔?-> 璋冪敤鍚庣 saveDefinition銆? */
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
    ElMessage.warning("鐢诲竷涓婄己灏戙€屽叆鍙?URL銆嶈妭鐐?);
    return;
  }
  const url = (entry.data as any).params?.url || "https://gitee.com";
  const depth = (entry.data as any).params?.depth ?? 2;
  const maxPages = (entry.data as any).params?.maxPages ?? 10;

  const code = `ORCH-${Date.now().toString(36).toUpperCase()}`;
  const name = `缂栨帓娴嬭瘯-${new Date().toLocaleTimeString()}`;

  await ElMessageBox.confirm(
    `灏嗛€氳繃缂栨帓淇濆瓨涓€涓湡瀹炵埇铏畾涔夛細\n缂栫爜: ${code}\n鍏ュ彛: ${url}\n娣卞害: ${depth}\n鏈€澶ч〉鏁? ${maxPages}`,
    "纭娴嬭瘯",
    { type: "info" }
  );

  saving.value = true;
  testLogs.value = [];
  log(`寮€濮嬬紪鎺掓祴璇曪紝鐢熸垚瀹氫箟 code=${code}`);
  try {
    const result = await saveDefinition({
      spiderCode: code,
      spiderName: name,
      spiderEntryUrl: url,
      spiderMaxDepth: depth,
      spiderMaxPages: maxPages,
      spiderStatus: 1,
      spiderDescription: `閫氳繃鍓嶇缂栨帓鐢熸垚鐨勬祴璇曞畾涔夛紝鏃堕棿锛?{new Date().toISOString()}`,
    } as any);
    lastResult.value = result;
    log(`鉁?鍚庣淇濆瓨鎴愬姛锛宻piderId=${result.spiderId ?? "-"}`);
    log(`鉁?宸茬敓鎴愭墽琛岄摼璺細瀹氫箟宸茶惤搴擄紝鍙湪銆屾墽琛岃褰曘€嶄腑鏌ョ湅鍚庣画鎵规`);
    ElMessage.success(`娴嬭瘯杩愯鎴愬姛锛屽畾涔夊凡淇濆瓨锛?{code}`);
  } catch (e) {
    log(`鉁?娴嬭瘯澶辫触锛?{(e as Error).message}`);
  } finally {
    saving.value = false;
  }
}

/**
 * 鍔犺浇鏈€杩戜竴娆′繚瀛樼殑瀹氫箟锛堢敤浜庡洖濉彸渚ц鎯咃級銆? */
const recent = ref<SpiderDefinition[]>([]);
async function loadRecent() {
  const page = await pageDefinitions(1, 5);
  recent.value = page.records;
}
loadRecent();

/**
 * Connection 浜嬩欢锛氭妸鏂拌繛绾垮瓨杩?edges銆? */
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
 * 閫変腑鑺傜偣鍥炶皟銆? */
function onNodeClick(event: any) {
  selectedNode.value = event.node;
}

/**
 * 鍒犻櫎杈广€? */
function onEdgeClick(event: any) {
  edges.value = edges.value.filter((e) => e.id !== event.edge.id);
}

/**
 * 鐢诲竷娓呯┖锛堜繚鐣欏叆鍙ｈ妭鐐癸級銆? */
function reset() {
  ElMessageBox.confirm("纭娓呯┖鐢诲竷锛熷叆鍙ｈ妭鐐逛細琚噸缃?, "娓呯┖", {
    type: "warning",
  }).then(() => {
    nodes.value = [
      {
        id: "entry-1",
        type: "default",
        position: { x: 80, y: 80 },
        data: { label: "鍏ュ彛 URL", meta: palette[0], params: { ...palette[0].defaults } },
        class: "spider-node is-source",
      },
    ];
    edges.value = [];
    selectedNode.value = null;
    lastResult.value = null;
    testLogs.value = [];
  }).catch(() => {});
}

// 鍒濆鍖栧叆鍙ｈ妭鐐归粯璁ゅ弬鏁?nodes.value[0].data = {
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
    <!-- 宸︿晶锛氳妭鐐归潰鏉?-->
    <aside class="orchestration-side">
      <div class="section-title">鑺傜偣</div>
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

      <div class="section-title" style="margin-top: 20px">鏈€杩戝畾涔?/div>
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
          {{ r.spiderCode }} 路 娣卞害 {{ r.spiderMaxDepth }}
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
        鏆傛棤瀹氫箟锛岃鍏堝湪銆岀埇铏畾涔夈€嶄腑鍒涘缓
      </div>
    </aside>

    <!-- 涓棿锛氱敾甯?-->
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
        <el-button size="small" @click="reset">娓呯┖</el-button>
        <el-button
          size="small"
          type="primary"
          :icon="markRaw(IconConnection)"
          :loading="saving"
          @click="runTest"
        >
          娴嬭瘯杩愯
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

    <!-- 鍙充晶锛氳妭鐐归厤缃?+ 娴嬭瘯鏃ュ織 -->
    <aside class="orchestration-config">
      <div class="section-title">鑺傜偣閰嶇疆</div>
      <div v-if="!selectedNodeMeta" style="font-size: 13px; color: var(--el-text-color-secondary)">
        鐐瑰嚮鐢诲竷涓婄殑鑺傜偣杩涜閰嶇疆
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
            <el-form-item label="娣卞害">
              <el-input-number
                :model-value="(selectedNode!.data as any).params?.depth"
                :min="0"
                :max="10"
                @update:model-value="(v: number) => ((selectedNode!.data as any).params.depth = v)"
              />
            </el-form-item>
            <el-form-item label="鏈€澶ч〉鏁?>
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
            <el-form-item label="閫夋嫨鍣?>
              <el-input
                :model-value="(selectedNode!.data as any).params?.selector"
                @update:model-value="(v: string) => ((selectedNode!.data as any).params.selector = v)"
              />
            </el-form-item>
            <el-form-item label="鎻愬彇瀛楁">
              <el-input
                :model-value="(selectedNode!.data as any).params?.fields"
                @update:model-value="(v: string) => ((selectedNode!.data as any).params.fields = v)"
              />
            </el-form-item>
          </el-form>
        </template>
        <template v-else-if="selectedNodeMeta.type === 'pipeline'">
          <el-form label-width="80px" size="small">
            <el-form-item label="绫诲瀷">
              <el-select
                :model-value="(selectedNode!.data as any).params?.type"
                @update:model-value="(v: string) => ((selectedNode!.data as any).params.type = v)"
              >
                <el-option label="DB锛堟暟鎹簱钀藉簱锛? value="DB" />
                <el-option label="CONSOLE锛堟帶鍒跺彴锛? value="CONSOLE" />
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
          鍒犻櫎璇ヨ妭鐐?        </el-button>
      </div>

      <div class="section-title" style="margin-top: 20px">娴嬭瘯鏃ュ織</div>
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
          绛夊緟娴嬭瘯杩愯鈥?        </div>
        <div v-for="(line, idx) in testLogs" :key="idx">{{ line }}</div>
      </div>

      <template v-if="lastResult">
        <div class="section-title" style="margin-top: 20px">鏈€杩戜繚瀛?/div>
        <div style="font-size: 13px">
          <div class="detail-row">
            <span class="label">缂栫爜</span>
            <span class="value">{{ lastResult.spiderCode }}</span>
          </div>
          <div class="detail-row">
            <span class="label">鍏ュ彛</span>
            <span class="value">{{ lastResult.spiderEntryUrl }}</span>
          </div>
          <div class="detail-row">
            <span class="label">娣卞害</span>
            <span class="value">{{ lastResult.spiderMaxDepth }}</span>
          </div>
          <div class="detail-row">
            <span class="label">椤垫暟</span>
            <span class="value">{{ lastResult.spiderMaxPages }}</span>
          </div>
        </div>
      </template>
    </aside>
  </div>
</template>
