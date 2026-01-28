<template>
  <div class="arthas-management system-container modern-bg">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:terminal-box-line" class="title-icon" />
          <div>
            <h2>Arthas 管理</h2>
            <p>Java 应用诊断和性能分析工具</p>
          </div>
        </div>
      </div>
      <div class="toolbar-right">
        <NodeSelector
          :nodes="arthasNodes"
          label="在线节点"
          placeholder="选择 Arthas 节点"
          v-model="selectedNodeId"
          @change="handleSelectNode"
          class="node-selector"
        />
        <div class="ops">
          <el-tooltip content="刷新节点列表" placement="bottom" :show-after="500">
            <el-button type="primary" :disabled="!selectedNode" @click="reloadNodes" size="small">
              <IconifyIconOnline icon="ep:refresh" class="mr-1" />
              刷新
            </el-button>
          </el-tooltip>
          <el-tooltip content="连接到选中的节点" placement="bottom" :show-after="500">
            <el-button
              type="primary"
              :disabled="!selectedNode || connected"
              @click="connectNode"
              size="small"
            >
              <IconifyIconOnline icon="ep:connection" class="mr-1" />
              连接
            </el-button>
          </el-tooltip>
          <el-tooltip content="断开连接" placement="bottom" :show-after="500">
            <el-button :disabled="!connected" @click="disconnectNode" size="small">
              <IconifyIconOnline icon="ep:close" class="mr-1" />
              断开
            </el-button>
          </el-tooltip>
          <el-tooltip content="配置 Arthas" placement="bottom" :show-after="500">
            <el-button :disabled="!selectedNode" @click="configVisible = true" size="small">
              <IconifyIconOnline icon="ep:setting" class="mr-1" />
              配置
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <!-- 左侧功能菜单 -->
      <div v-if="connected" class="left-panel">
        <div class="panel-header">
          <IconifyIconOnline icon="ri:menu-line" class="panel-icon" />
          <span class="panel-title">功能列表</span>
        </div>
        <FeatureMenu
          v-model="activeFeature"
          :features="features"
          @select="handleFeatureSelect"
          class="feature-menu"
        />
      </div>

      <!-- 右侧内容区 -->
      <div class="right-panel">
        <div v-if="!connected" class="empty-state">
          <div class="empty-card">
            <IconifyIconOnline icon="ri:terminal-box-line" class="empty-icon" />
            <el-empty description="请选择包含 Arthas 客户端的在线节点并点击连接" />
          </div>
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
              class="alert-tip"
              :title="`当前功能（${currentFeature?.title || '功能'}）由 Arthas 控制台提供，请在下方控制台内操作`"
            />
            <TerminalConsole :node-id="selectedNodeId" />
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
import { message } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components/ReIcon";
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
    message(e?.message || "加载在线节点失败", { type: "error" });
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
      message("连接成功", { type: "success" });
    } else {
      consoleUrlRef.value = "";
      connected.value = false;
      message(res?.msg || "连接失败", { type: "error" });
    }
  } catch (e: any) {
    connected.value = false;
    message(e?.message || "连接异常", { type: "error" });
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

<style lang="scss" scoped>
@import "@/styles/mixins.scss";

.arthas-management {
  @include flex-column;
  height: 100%;
  padding: $spacing-lg;
  gap: $spacing-lg;
}

.toolbar {
  @include toolbar-style;
  flex-wrap: wrap;
  gap: $spacing-md;
  
  .toolbar-left {
    @include flex-align-center;
    flex: 1;
    min-width: 200px;
  }
  
  .toolbar-right {
    @include flex-align-center;
    gap: $spacing-md;
    flex-wrap: wrap;
  }
  
  .page-title {
    @include flex-align-center;
    gap: $spacing-md;
    
    .title-icon {
      font-size: 32px;
      color: $primary-color;
      @include gradient-text;
    }
    
    h2 {
      margin: 0 0 $spacing-xs 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      @include gradient-text;
    }
    
    p {
      margin: 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
      line-height: 1.5;
    }
  }
  
  .node-selector {
    min-width: 200px;
  }
  
  .ops {
    @include flex-align-center;
    gap: $spacing-sm;
  }
  
  .mr-1 {
    margin-right: $spacing-xs;
  }
}

.content {
  @include flex-align-center;
  flex: 1;
  gap: $spacing-lg;
  overflow: hidden;
}

.left-panel {
  width: 260px;
  min-width: 200px;
  @include glass-card;
  padding: $spacing-md;
  @include flex-column;
  gap: $spacing-md;
  
  .panel-header {
    @include flex-align-center;
    gap: $spacing-sm;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $border-light;
    
    .panel-icon {
      font-size: 20px;
      color: $primary-color;
    }
    
    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  
  .feature-menu {
    flex: 1;
    overflow-y: auto;
  }
}

.right-panel {
  flex: 1;
  @include flex-column;
  overflow: hidden;
  min-width: 0;
}

.empty-state {
  @include flex-center;
  height: 100%;
  padding: $spacing-xl;
  
  .empty-card {
    @include glass-card;
    @include flex-center;
    @include flex-column;
    gap: $spacing-lg;
    padding: $spacing-4xl;
    min-width: 400px;
    max-width: 600px;
    
    .empty-icon {
      font-size: 80px;
      color: $primary-color;
      opacity: 0.6;
      animation: pulse 2s ease-in-out infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.feature-container {
  flex: 1;
  overflow: hidden;
  @include glass-card;
  padding: $spacing-md;
}

.console-wrap {
  @include flex-column;
  height: 100%;
  gap: $spacing-md;
  
  .alert-tip {
    margin-bottom: $spacing-md;
  }
}

// 响应式设计
@include respond-to(md) {
  .content {
    flex-direction: column;
  }
  
  .left-panel {
    width: 100%;
    max-height: 200px;
    
    .feature-menu {
      display: flex;
      flex-direction: row;
      overflow-x: auto;
      overflow-y: hidden;
    }
  }
}

@include respond-to(sm) {
  .arthas-management {
    padding: $spacing-md;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    
    .toolbar-left,
    .toolbar-right {
      width: 100%;
    }
    
    .page-title {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-sm;
      
      .title-icon {
        font-size: 24px;
      }
      
      h2 {
        font-size: 20px;
      }
    }
    
    .ops {
      flex-wrap: wrap;
      width: 100%;
      
      .el-button {
        flex: 1;
        min-width: 80px;
      }
    }
  }
  
  .empty-state {
    .empty-card {
      min-width: auto;
      width: 100%;
    }
  }
}
</style>
