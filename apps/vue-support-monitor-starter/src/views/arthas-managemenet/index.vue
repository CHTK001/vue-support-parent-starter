<template>
  <div class="arthas-management page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:terminal-box-line" class="title-icon" />
            Arthas 诊断管理
          </h1>
          <p class="page-subtitle">在线 Java 应用诊断和性能分析工具</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ arthasNodes.length }}</div>
            <div class="stat-label">在线节点</div>
          </div>
          <div class="stat-card" :class="{ 'stat-success': connected }">
            <div class="stat-number">{{ connected ? "✓" : "×" }}</div>
            <div class="stat-label">连接状态</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden flex flex-col">
      <!-- 工具栏 -->
      <div class="modern-toolbar">
        <NodeSelector
          :nodes="arthasNodes"
          label="在线节点"
          placeholder="选择 Arthas 节点"
          v-model="selectedNodeId"
          @change="handleSelectNode"
        />
        <div class="ops">
          <el-button
            type="primary"
            :disabled="!selectedNode"
            @click="reloadNodes"
            >刷新</el-button
          >
          <el-button
            type="primary"
            :disabled="!selectedNode || connected"
            @click="connectNode"
            >连接</el-button
          >
          <el-button :disabled="!connected" @click="disconnectNode"
            >断开</el-button
          >
          <el-button :disabled="!selectedNode" @click="configVisible = true"
            >配置</el-button
          >
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content flex-1 overflow-hidden">
        <div v-if="connected" class="left-panel">
          <div class="panel-title">功能列表</div>
          <FeatureMenu
            v-model="activeFeature"
            :features="features"
            @select="handleFeatureSelect"
          />
        </div>

        <div class="right-panel">
          <div v-if="!connected" class="empty-state">
            <el-empty
              description="请选择包含 Arthas 客户端的在线节点并点击连接"
            />
          </div>
          <div v-else class="feature-container">
            <TerminalConsole
              v-if="activeFeature === 'console'"
              :node-id="selectedNodeId"
            />
            <ThreadViewer
              v-else-if="activeFeature === 'thread'"
              :node-id="selectedNodeId"
            />
            <TraceViewer
              v-else-if="activeFeature === 'trace'"
              :node-id="selectedNodeId"
            />
            <SmViewer
              v-else-if="activeFeature === 'class'"
              :node-id="selectedNodeId"
            />
            <MemoryViewer
              v-else-if="activeFeature === 'memory'"
              :node-id="selectedNodeId"
            />
            <div v-else class="console-wrap">
              <el-alert
                type="info"
                :closable="false"
                show-icon
                class="mb-2"
                :title="`当前功能（${currentFeature?.title || '功能'}）由 Arthas 控制台提供，请在下方控制台内操作`"
              />
              <TerminalConsole :node-id="selectedNodeId" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <ArthasConfigDialog
      v-model="configVisible"
      :server-id="selectedNodeId"
      @saved="reloadNodes"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import NodeSelector from "@/views/arthas-managemenet/components/NodeSelector.vue";
import FeatureMenu from "@/views/arthas-managemenet/components/FeatureMenu.vue";
import TerminalConsole from "@/views/arthas-managemenet/components/TerminalConsole.vue";
import ThreadViewer from "@/views/arthas-managemenet/components/ThreadViewer.vue";
import TraceViewer from "@/views/arthas-managemenet/components/TraceViewer.vue";
import SmViewer from "@/views/arthas-managemenet/components/SmViewer.vue";
import MemoryViewer from "@/views/arthas-managemenet/components/MemoryViewer.vue";
import ArthasConfigDialog from "@/views/arthas-managemenet/components/ArthasConfigDialog.vue";
import {
  fetchAllOnlineNodes,
  type OnlineNodeInfo,
} from "@/api/node-management";
import { connectArthasNode } from "@/api/arthas-management";

const nodeList = ref<OnlineNodeInfo[]>([]);
const selectedNodeId = ref<string>("");
const selectedNode = ref<OnlineNodeInfo | null>(null);
const connected = ref(false);
const configVisible = ref(false);
const activeFeature = ref("console");

const features = [
  { key: "console", title: "控制台", icon: "ri:terminal-box-line" },
  { key: "thread", title: "线程", icon: "ri:stack-line" },
  { key: "trace", title: "链路追踪", icon: "ri:route-line" },
  { key: "jvm", title: "JVM", icon: "ri:cpu-line" },
  { key: "memory", title: "内存", icon: "ri:database-2-line" },
  { key: "class", title: "堆栈", icon: "ri:code-s-slash-line" },
];

const currentFeature = computed(() =>
  features.find((f) => f.key === activeFeature.value)
);

const ARTHAS_META_KEY = "report.client.arthas.port";
const arthasNodes = computed(() =>
  nodeList.value.filter(
    (n) => !!n.metadata && ARTHAS_META_KEY in (n.metadata || {})
  )
);

const consoleUrlRef = ref("");

function handleSelectNode() {
  selectedNode.value =
    nodeList.value.find((n) => n.nodeId === selectedNodeId.value) || null;
}

async function reloadNodes() {
  try {
    const res: any = await fetchAllOnlineNodes();
    if (res?.success) {
      nodeList.value = res.data || [];
      if (
        selectedNode.value &&
        !nodeList.value.some((n) => n.nodeId === selectedNode.value!.nodeId)
      ) {
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
      activeFeature.value = "console";
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
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.stats-section {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &.stat-success {
    .stat-number {
      color: var(--el-color-success);
    }
  }

  .stat-number {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.modern-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .ops {
    display: flex;
    gap: 8px;
  }
}

.content {
  display: flex;
  gap: 16px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.left-panel {
  width: 240px;
  border-right: 1px solid var(--el-border-color-lighter);
  padding-right: 16px;
}

.panel-title {
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "";
    width: 3px;
    height: 16px;
    background: var(--el-color-primary);
    border-radius: 2px;
  }
}

.right-panel {
  flex: 1;
  overflow: hidden;
}

.console-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>
