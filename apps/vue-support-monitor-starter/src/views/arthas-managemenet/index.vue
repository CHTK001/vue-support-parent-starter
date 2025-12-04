<template>
  <div class="arthas-management">
    <div class="main-content">
      <!-- 工具�?-->
      <div class="modern-toolbar">
        <div class="toolbar-left">
          <NodeSelector
            :nodes="arthasNodes"
            label="在线节点"
            placeholder="选择 Arthas 节点"
            v-model="selectedNodeId"
            @change="handleSelectNode"
          />
        </div>
        <div class="toolbar-right">
          <el-button @click="reloadNodes" class="toolbar-btn">
            <IconifyIconOnline icon="ri:refresh-line" class="btn-icon" />
            刷新
          </el-button>
          <el-button
            type="success"
            :disabled="!selectedNode || connected"
            @click="connectNode"
            class="toolbar-btn connect-btn"
          >
            <IconifyIconOnline icon="ri:link" class="btn-icon" />
            连接
          </el-button>
          <el-button
            type="danger"
            :disabled="!connected"
            @click="disconnectNode"
            class="toolbar-btn"
          >
            <IconifyIconOnline icon="ri:link-unlink" class="btn-icon" />
            断开
          </el-button>
          <el-button
            :disabled="!selectedNode"
            @click="configVisible = true"
            class="toolbar-btn"
          >
            <IconifyIconOnline icon="ri:settings-3-line" class="btn-icon" />
            配置
          </el-button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <div v-if="connected" class="left-panel">
          <div class="panel-header">
            <IconifyIconOnline icon="ri:apps-line" class="panel-icon" />
            <span>功能列表</span>
          </div>
          <FeatureMenu
            v-model="activeFeature"
            :features="features"
            @select="handleFeatureSelect"
          />
        </div>

        <div class="right-panel">
          <div v-if="!connected" class="empty-state">
            <div class="empty-icon">
              <IconifyIconOnline icon="ri:plug-line" />
            </div>
            <div class="empty-title">尚未连接</div>
            <div class="empty-desc">
              请选择包含 Arthas 客户端的在线节点并点击连�?
            </div>
            <el-button
              v-if="selectedNode"
              type="primary"
              @click="connectNode"
              class="empty-action"
            >
              <IconifyIconOnline icon="ri:link" class="btn-icon" />
              立即连接
            </el-button>
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
              <div class="feature-tip">
                <IconifyIconOnline
                  icon="ri:information-line"
                  class="tip-icon"
                />
                <span
                  >当前功能（{{ currentFeature?.title || "功能" }}）由 Arthas
                  控制台提供，请在下方控制台内操作</span
                >
              </div>
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
} from "@/api/server/node-management";
import { connectArthasNode } from "@/api/arthas/arthas-management";

const nodeList = ref<OnlineNodeInfo[]>([]);
const selectedNodeId = ref<string>("");
const selectedNode = ref<OnlineNodeInfo | null>(null);
const connected = ref(false);
const configVisible = ref(false);
const activeFeature = ref("console");

const features = [
  { key: "console", title: "控制�?, icon: "ri:terminal-box-line" },
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
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.98) 0%,
    rgba(241, 245, 249, 0.95) 100%
  );
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

/* 工具�?*/
.modern-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
}

.toolbar-left {
  flex: 1;
  max-width: 400px;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.toolbar-btn {
  border-radius: 10px;
  font-weight: 500;
  padding: 10px 18px;
  transition: all 0.3s ease;
}

.toolbar-btn:hover {
  transform: translateY(-2px);
}

.btn-icon {
  margin-right: 6px;
  font-size: 16px;
}

.connect-btn {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.connect-btn:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* 内容区域 */
.content-area {
  display: flex;
  gap: 20px;
  flex: 1;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
  min-height: 500px;
}

.left-panel {
  width: 260px;
  border-right: 1px solid rgba(226, 232, 240, 0.8);
  padding-right: 24px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
  color: #334155;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid rgba(16, 185, 129, 0.2);
}

.panel-icon {
  font-size: 20px;
  color: #10b981;
}

.right-panel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.feature-container {
  flex: 1;
  overflow: hidden;
}

/* 空状�?*/
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(148, 163, 184, 0.1) 0%,
    rgba(203, 213, 225, 0.08) 100%
  );
  font-size: 40px;
  color: #94a3b8;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #475569;
}

.empty-desc {
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
}

.empty-action {
  margin-top: 12px;
  border-radius: 10px;
  padding: 12px 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
}

/* 控制台包�?*/
.console-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(99, 102, 241, 0.08) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  font-size: 14px;
  color: #3b82f6;
}

.tip-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* 响应�?*/

@media (max-width: 768px) {
  .arthas-management {
    padding: 16px;
  }

  .modern-toolbar {
    flex-direction: column;
    gap: 16px;
  }

  .toolbar-left {
    width: 100%;
    max-width: none;
  }

  .toolbar-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .toolbar-btn {
    flex: 1;
    min-width: 80px;
  }

  .content-area {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    padding-right: 0;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
}
</style>
