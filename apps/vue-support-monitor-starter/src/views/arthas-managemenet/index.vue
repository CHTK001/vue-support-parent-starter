<template>
  <div class="arthas-management">
    <!-- 顶部：选择在线节点（仅包含 REPORT_ARTHAS_CLIENT_PORT 的为 Arthas 节点） -->
    <div class="toolbar">
      <el-form :inline="true" size="small">
        <el-form-item label="在线节点">
          <el-select
            v-model="selectedNodeId"
            filterable
            placeholder="选择 Arthas 节点"
            style="min-width: 320px"
            @change="handleSelectNode"
          >
            <el-option
              v-for="node in arthasNodes"
              :key="node.nodeId"
              :label="formatNodeLabel(node)"
              :value="node.nodeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="!selectedNode"
            @click="connectNode"
            >连接</el-button
          >
          <el-button :disabled="!connected" @click="disconnectNode"
            >断开</el-button
          >
          <el-button @click="reloadNodes">刷新节点</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="content">
      <!-- 左侧功能区：连接成功后显示 -->
      <div class="left-panel" v-if="connected">
        <div class="panel-title">功能列表</div>
        <el-menu
          class="feature-menu"
          :default-active="activeFeature"
          @select="handleFeatureSelect"
        >
          <el-menu-item v-for="f in features" :key="f.key" :index="f.key">
            <IconifyIconOnline :icon="f.icon" class="mr-2" />
            <span>{{ f.title }}</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧内容区 -->
      <div class="right-panel">
        <div v-if="!connected" class="empty-state">
          <el-empty
            description="请选择包含 Arthas 客户端的在线节点并点击连接"
          />
        </div>
        <div v-else class="feature-container">
          <!-- 控制台：后端代理控制台，而不是前端直连 -->
          <div v-if="activeFeature === 'console'" class="console-wrap">
            <el-alert
              type="info"
              :closable="false"
              show-icon
              class="mb-2"
              title="提示：控制台由后端代理连接（HTTP/WS），前端仅展示"
            >
            </el-alert>
            <iframe
              v-if="consoleUrlRef"
              :src="consoleUrlRef"
              class="console-iframe"
              frameborder="0"
            />
            <div v-else class="tip">后端未提供控制台代理地址或连接尚未建立</div>
          </div>

          <!-- 其他功能占位：根据后端接口补充实际内容 -->
          <div v-else class="placeholder">
            <el-result
              icon="info"
              :title="currentFeature?.title || '功能'"
              sub-title="请根据后端接口对接具体功能内容"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchAllOnlineNodes,
  type OnlineNodeInfo,
} from "@/api/node-management";
import { connectArthasNode } from "@/api/arthas-management";

// 选择的节点
const nodeList = ref<OnlineNodeInfo[]>([]);
const selectedNodeId = ref<string>("");
const selectedNode = ref<OnlineNodeInfo | null>(null);
const connected = ref(false);
const activeFeature = ref("console");

// 功能列表（连接后左侧显示）
const features = [
  { key: "console", title: "控制台", icon: "ri:terminal-box-line" },
  { key: "thread", title: "线程", icon: "ri:stack-line" },
  { key: "jvm", title: "JVM", icon: "ri:cpu-line" },
  { key: "memory", title: "内存", icon: "ri:database-2-line" },
  { key: "class", title: "类加载", icon: "ri:code-s-slash-line" },
  { key: "logger", title: "日志", icon: "ri:file-list-3-line" },
  { key: "profiler", title: "性能分析", icon: "ri:line-chart-line" },
];

const currentFeature = computed(() =>
  features.find((f) => f.key === activeFeature.value)
);

// 仅包含 REPORT_ARTHAS_CLIENT_PORT 元数据的节点视为 Arthas 节点
const ARTHAS_META_KEY = "report.client.arthas.port";
const arthasNodes = computed(() =>
  nodeList.value.filter(
    (n) => !!n.metadata && ARTHAS_META_KEY in (n.metadata || {})
  )
);

// 控制台URL由后端返回（后端代理连接 arthas-console）
const consoleUrlRef = ref("");

function formatNodeLabel(n: OnlineNodeInfo) {
  const app = n.applicationName || "-";
  const ip = `${n.ipAddress}:${n.port}`;
  return `${app} (${ip})`;
}

function handleSelectNode() {
  selectedNode.value =
    nodeList.value.find((n) => n.nodeId === selectedNodeId.value) || null;
}

async function reloadNodes() {
  try {
    const res: any = await fetchAllOnlineNodes();
    if (res?.success) {
      nodeList.value = res.data || [];
      // 若当前选中的节点已不在列表，重置选择
      if (
        selectedNode.value &&
        !nodeList.value.some((n) => n.nodeId === selectedNode.value!.nodeId)
      ) {
        selectedNodeId.value = "";
        selectedNode.value = null;
        connected.value = false;
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
      connected.value = !!url || true; // 若后端未返回URL，也视为已连接，仅不展示控制台
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
