<template>
  <div class="arthas-management">
    <div class="toolbar">
      <NodeSelector :nodes="arthasNodes" label="在线节点" placeholder="选择 Arthas 节点" v-model="selectedNodeId" @change="handleSelectNode" @refresh="reloadNodes" />
      <div class="ops">
        <el-button type="primary" :disabled="!selectedNode" @click="connectNode">连接</el-button>
        <el-button :disabled="!connected" @click="disconnectNode">断开</el-button>
      </div>
    </div>

    <div class="content">
      <div class="left-panel" v-if="connected">
        <div class="panel-title">功能列表</div>
        <FeatureMenu :features="features" v-model="activeFeature" @select="handleFeatureSelect" />
      </div>

      <div class="right-panel">
        <div v-if="!connected" class="empty-state">
          <el-empty description="请选择包含 Arthas 客户端的在线节点并点击连接" />
        </div>
        <div v-else class="feature-container">
          <ConsoleViewer v-if="activeFeature === 'console'" :url="consoleUrlRef" />

          <div v-else class="placeholder">
            <el-result icon="info" :title="currentFeature?.title || '功能'" sub-title="请根据后端接口对接具体功能内容" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import NodeSelector from "@/views/arthas-managemenet/components/NodeSelector.vue";
import FeatureMenu from "@/views/arthas-managemenet/components/FeatureMenu.vue";
import ConsoleViewer from "@/views/arthas-managemenet/components/ConsoleViewer.vue";
import { fetchArthasNodes, connectArthasNode } from "@/api/arthas-management";
import type { OnlineNodeInfo } from "@/api/arthas-management";

const nodeList = ref<OnlineNodeInfo[]>([]);
const selectedNodeId = ref<string>("");
const selectedNode = ref<OnlineNodeInfo | null>(null);
const connected = ref(false);
const activeFeature = ref("console");

const features = [
  { key: "console", title: "控制台", icon: "ri:terminal-box-line" },
  { key: "thread", title: "线程", icon: "ri:stack-line" },
  { key: "jvm", title: "JVM", icon: "ri:cpu-line" },
  { key: "memory", title: "内存", icon: "ri:database-2-line" },
  { key: "class", title: "类加载", icon: "ri:code-s-slash-line" },
  { key: "logger", title: "日志", icon: "ri:file-list-3-line" },
  { key: "profiler", title: "性能分析", icon: "ri:line-chart-line" }
];

const currentFeature = computed(() => features.find(f => f.key === activeFeature.value));

const ARTHAS_META_KEY = "report.client.arthas.port";
const arthasNodes = computed(() => nodeList.value.filter(n => !!n.metadata && ARTHAS_META_KEY in (n.metadata || {})));

const consoleUrlRef = ref("");

function handleSelectNode() {
  selectedNode.value = nodeList.value.find(n => n.nodeId === selectedNodeId.value) || null;
}

async function reloadNodes() {
  try {
    const res: any = await fetchArthasNodes();
    if (res?.success) {
      nodeList.value = res.data || [];
      if (selectedNode.value && !nodeList.value.some(n => n.nodeId === selectedNode.value!.nodeId)) {
        selectedNodeId.value = "";
        selectedNode.value = null;
        connected.value = false;
        consoleUrlRef.value = "";
      }
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "加载在线节点失败");
  }
}

async function connectNode() {
  if (!selectedNode.value) return;
  try {
    const res: any = await connectArthasNode(selectedNode.value.nodeId);
    if (res?.success) {
      const data = res.data;
      let url = "";
      if (data) {
        if (typeof data === "string") url = data;
        else url = data.consoleUrl || data.url || data.href || "";
      }
      consoleUrlRef.value = url;
      connected.value = !!url || true;
      ElMessage.success("连接成功");
    } else {
      consoleUrlRef.value = "";
      connected.value = false;
      ElMessage.error(res?.msg || "连接失败");
    }
  } catch (e: any) {
    connected.value = false;
    ElMessage.error(e?.message || "连接异常");
  }
}

function disconnectNode() {
  connected.value = false;
  consoleUrlRef.value = "";
}

function handleFeatureSelect(key: string) {
  activeFeature.value = key;
}

onMounted(() => {
  reloadNodes();
});
</script>

<style scoped>
.arthas-management {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.content {
  display: flex;
  height: calc(100% - 56px);
}
.left-panel {
  width: 240px;
  border-right: 1px solid var(--el-border-color);
  padding-right: 8px;
}
.panel-title {
  font-weight: 600;
  margin: 6px 0 8px 12px;
  color: var(--el-text-color-primary);
}
.feature-menu {
  border-right: none;
}
.right-panel {
  flex: 1;
  padding-left: 12px;
  overflow: hidden;
}
.console-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.console-iframe {
  flex: 1;
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder {
  padding: 24px;
}
.mb-2 {
  margin-bottom: 8px;
}
.mr-2 {
  margin-right: 6px;
}
</style>
