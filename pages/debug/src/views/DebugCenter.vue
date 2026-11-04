<script setup lang="ts">
/**
 * 调试中心（DevTools 面板）
 *
 * <p>页面级路线 {@code /debug}：</p>
 * <ul>
 *   <li>顶部栏：浏览器状态（未启动 / 已启动 / 失败）、启动 / 停止 / 新建页面 / 刷新；</li>
 *   <li>页签：Console 控制台 / Network 网络 / DOM / Screenshot 截屏 / Evaluate 求值。</li>
 * </ul>
 *
 * <p>跟后端的通道有两路：REST {@code /ms/cdp/**}（一次性操作：状态、启动、停止、截屏…）
 * 与 WebSocket {@code /ws/cdp}（实时事件 + JSON-RPC 调用）。实时通道由
 * {@code @pages/debug/api/cdpApi} 的 {@code CdpClient} 持有。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { MagicStick, Monitor, Promotion, Refresh, Search } from "@element-plus/icons-vue";
import {
  cdpCloseTarget,
  cdpContent,
  cdpCreateTarget,
  cdpEvaluate,
  cdpNavigate,
  cdpScreenshot,
  cdpStart,
  cdpStatus,
  cdpStop,
  cdpTargets,
  CDP_WS_PATH,
  createCdpClient,
} from "../api/cdpApi";
import type { CdpConsoleMessage, CdpNetworkRequest, CdpStatus, CdpTarget } from "../api/cdpApi";
import "../styles/debug.css";

/* ==================== 页面级状态 ==================== */

/** 当前选中的页签 */
type PageTab = "console" | "network" | "dom" | "screenshot" | "evaluate";
const pageTab = ref<PageTab>("console");

/** 浏览器状态 */
const status = ref<CdpStatus | null>(null);
const statusLoading = ref(false);

/** 页面（目标）列表 */
const targets = ref<CdpTarget[]>([]);

/** 选中的目标标识（浏览器级时为空） */
const selectedTarget = ref<string>("");

/** 控制台日志 */
const consoleMessages = ref<CdpConsoleMessage[]>([]);

/** 网络日志（requestWillBeSent + responseReceived 拼装） */
const networkRequests = ref<CdpNetworkRequest[]>([]);

const maxConsole = 500;
const maxNetwork = 500;

/** WS 通道 */
const wsConnected = ref(false);
const client = createCdpClient(CDP_WS_PATH);

/* ==================== 工具 ==================== */

/**
 * 刷新浏览器状态
 */
async function reloadStatus() {
  try {
    statusLoading.value = true;
    status.value = await cdpStatus();
  } catch (error) {
    status.value = null;
    console.warn("[cdp] 状态拉取失败", error);
  } finally {
    statusLoading.value = false;
  }
}

/**
 * 刷新目标列表
 */
async function reloadTargets() {
  try {
    targets.value = await cdpTargets();
  } catch (error) {
    console.warn("[cdp] 目标列表拉取失败", error);
    targets.value = [];
  }
}

/* ==================== 浏览器生命周期 ==================== */

/**
 * 启动浏览器
 */
async function startBrowser() {
  try {
    await cdpStart();
    await reloadStatus();
    await reloadTargets();
    ElMessage.success("浏览器已启动");
  } catch (error) {
    ElMessage.error("启动失败: " + (error as Error).message);
  }
}

/**
 * 停止浏览器
 */
async function stopBrowser() {
  try {
    await cdpStop();
    await reloadStatus();
    await reloadTargets();
    ElMessage.success("浏览器已停止");
  } catch (error) {
    ElMessage.error("停止失败: " + (error as Error).message);
  }
}

/**
 * 新建页面
 */
async function createPage() {
  try {
    const result = await cdpCreateTarget("/");
    await reloadStatus();
    await reloadTargets();
    const targetId = (result as { targetId?: string } | undefined)?.targetId ?? "";
    if (targetId) selectedTarget.value = targetId;
  } catch (error) {
    ElMessage.error("创建页面失败: " + (error as Error).message);
  }
}

/**
 * 关闭页面
 */
async function closePage(targetId: string) {
  try {
    await cdpCloseTarget(targetId);
    await reloadTargets();
    if (selectedTarget.value === targetId) selectedTarget.value = "";
  } catch (error) {
    ElMessage.error("关闭页面失败: " + (error as Error).message);
  }
}

/**
 * 切换目标（当前页签日志清空）
 */
function selectTarget(targetId: string) {
  selectedTarget.value = targetId;
  consoleMessages.value = [];
  networkRequests.value = [];
}

/* ==================== 实时通道 ==================== */

/**
 * 连接 WS（连接失败自动重连）
 */
function connectWs() {
  if (client.isOpen()) return;
  client.connect().then(() => {
    wsConnected.value = true;
    // 页面级事件
    client.on("Console.messageAdded", (m) => appendConsole(m));
    client.on("Network.requestWillBeSent", (m) => appendNetwork(m));
    client.on("Network.responseReceived", (m) => appendNetwork(m));
    client.on("Runtime.consoleAPI", (m) => appendConsole(m));
    client.on("Runtime.exceptionThrown", (m) => appendConsole(m));
  });
}

function disconnectWs() {
  client.disconnect();
  wsConnected.value = false;
}

/* ==================== Console ==================== */

function appendConsole(m: Record<string, unknown> = {}) {
  const params = (m.params ?? {}) as Record<string, unknown>;
  const type = params.type ? String(params.type) : "log";
  const args = (Array.isArray(params.args) ? params.args : []).map((a) =>
    (a ?? {}) as Record<string, unknown>,
  );
  const record: CdpConsoleMessage = {
    method: String(m.method ?? type),
    type,
    args,
    targetId: String(m.targetId ?? selectedTarget.value ?? ""),
    timestamp: Number(m.timestamp || 0) || Date.now(),
  };
  consoleMessages.value.push(record);
  if (consoleMessages.value.length > maxConsole) {
    consoleMessages.value = consoleMessages.value.slice(-maxConsole);
  }
}

/* ==================== Network ==================== */

function appendNetwork(m: Record<string, unknown> = {}) {
  const method = String(m.method ?? "");
  const params = (m.params ?? {}) as Record<string, unknown>;
  if (!params) return;
  const entry: CdpNetworkRequest = {
    method: String(params.method ?? method),
    url: String(params.url ?? ""),
    frameId: String(params.frameId ?? ""),
    requestId: String(params.requestId ?? ""),
    targetId: String(m.targetId ?? selectedTarget.value ?? ""),
    timestamp: Number(params.timestamp ?? Date.now()),
  };
  if (method === "Network.responseReceived") {
    const existing = networkRequests.value.find((it) => it.requestId === entry.requestId);
    if (existing) {
      existing.method = `${entry.method} (${String(params.statusCode ?? "")})`;
      entry.timestamp = existing.timestamp;
      return;
    }
  }
  networkRequests.value.push(entry);
  if (networkRequests.value.length > maxNetwork) {
    networkRequests.value = networkRequests.value.slice(-maxNetwork);
  }
}

/* ==================== DOM ==================== */

const domRaw = ref("");
const domLoading = ref(false);

/** 当前页签的地址栏（DOM 页签里的跳转输入） */
const navigateUrl = ref("");

/**
 * 拉取当前页面内容
 */
async function fetchContent() {
  if (!selectedTarget.value) {
    return;
  }
  domLoading.value = true;
  try {
    domRaw.value = await cdpContent(selectedTarget.value);
  } catch (error) {
    ElMessage.error("获取内容失败: " + (error as Error).message);
  } finally {
    domLoading.value = false;
  }
}

/**
 * 页面导航（ES 变更标题）
 */
async function doNavigate(url: string) {
  if (!selectedTarget.value) {
    return;
  }
  try {
    await cdpNavigate(selectedTarget.value, url);
  } catch (error) {
    ElMessage.error("导航失败: " + (error as Error).message);
  }
}

/* ==================== Screenshot ==================== */

const screenshotUrl = ref("");
const screenshotLoading = ref(false);

/**
 * 截屏（base64 png）
 */
async function doScreenshot(fullPage = false) {
  if (!selectedTarget.value) {
    ElMessage.warning("请先选择或创建一个页面");
    return;
  }
  screenshotLoading.value = true;
  try {
    const base64 = await cdpScreenshot(selectedTarget.value, fullPage);
    screenshotUrl.value = `data:image/png;base64,${base64}`;
  } catch (error) {
    ElMessage.error("截屏失败: " + (error as Error).message);
  } finally {
    screenshotLoading.value = false;
  }
}

/* ==================== Evaluate ==================== */

const evaluateExpression = ref("document.title");
const evaluateResult = ref("");
const evaluateLoading = ref(false);

/**
 * 执行 JS
 */
async function doEvaluate() {
  if (!selectedTarget.value) {
    ElMessage.warning("请先选择或创建一个页面");
    return;
  }
  evaluateLoading.value = true;
  try {
    const result = await cdpEvaluate(selectedTarget.value, evaluateExpression.value);
    evaluateResult.value = result ? JSON.stringify(result, null, 2) : "<undefined>";
  } catch (error) {
    evaluateResult.value = "求值失败: " + (error as Error).message;
  } finally {
    evaluateLoading.value = false;
  }
}

/* ==================== 生命周期 ==================== */

onMounted(() => {
  reloadStatus();
  reloadTargets();
  connectWs();
});

onBeforeUnmount(() => {
  disconnectWs();
});
</script>

<template>
  <div class="debug-page">
    <!-- 顶部栏 -->
    <div class="debug-header">
      <div class="debug-header-left">
        <h2 class="debug-header-title">调试中心</h2>
        <el-tag :type="status?.state === 'STARTED' ? 'success' : 'info'" size="default">
          {{ status?.state ?? "未连接" }}
        </el-tag>
        <el-tag v-if="wsConnected" type="success" size="default">WS 已连接</el-tag>
        <el-tag v-else type="warning" size="default">WS 断开</el-tag>
      </div>
      <div class="debug-header-right">
        <el-button :icon="Search" plain size="small" :loading="statusLoading" @click="reloadStatus" class="debug-hdr-btn-refresh">刷新</el-button>
        <el-button :icon="MagicStick" plain size="small" @click="createPage" class="debug-hdr-btn-create">新建页面</el-button>
        <el-button :icon="Promotion" plain size="small" @click="startBrowser" class="debug-hdr-btn-start">启动</el-button>
        <el-button :icon="Refresh" plain size="small" @click="stopBrowser" class="debug-hdr-btn-stop">停止</el-button>
      </div>
    </div>

    <!-- 页签 -->
    <el-tabs v-model="pageTab" class="debug-tabs">
      <!-- Console -->
      <el-tab-pane name="console">
        <template #label>Console ({{ consoleMessages.length }})</template>
        <div class="debug-empty" v-if="!consoleMessages.length">暂无控制台日志（页面上的 Console 事件会实时到这儿）</div>
        <div v-else class="debug-console-list">
          <div v-for="m in consoleMessages" :key="`${m.timestamp}-${m.type}-${consoleMessages.indexOf(m)}`" class="debug-log-item">
            <span :class="['debug-log-type', `debug-log-type--${m.type}`]">{{ m.type }}</span>
            <span class="debug-log-time">{{ new Date(m.timestamp || 0).toLocaleTimeString() }}</span>
            <pre class="debug-log-content">{{ m.args?.[0] ?? "" }}</pre>
          </div>
        </div>
      </el-tab-pane>

      <!-- Network -->
      <el-tab-pane name="network">
        <template #label>Network ({{ networkRequests.length }})</template>
        <div class="debug-empty" v-if="!networkRequests.length">暂无网络日志（页面的 HTTP 请求会实时到这儿）</div>
        <div v-else class="debug-network-table">
          <div v-for="n in networkRequests" :key="n.requestId" class="debug-network-row">
            <div class="debug-network-method">{{ n.method }}</div>
            <div class="debug-network-url" :title="n.url">{{ n.url }}</div>
            <div class="debug-network-time">{{ new Date(n.timestamp || 0).toLocaleTimeString() }}</div>
          </div>
        </div>
      </el-tab-pane>

      <!-- DOM -->
      <el-tab-pane name="dom">
        <template #label>DOM</template>
        <div class="debug-dom">
          <div class="debug-dom-bar">
            <span class="debug-dom-label">目标:</span>
            <el-select
              v-model="selectedTarget"
              @change="selectTarget"
              filterable
              placeholder="选择页面"
              size="default"
              class="debug-dom-select"
            >
              <el-option
                v-for="t in targets"
                :key="t.id"
                :label="`${t.type} ${t.title ?? ''}`"
                :value="t.id"
              />
            </el-select>
            <el-input
              v-model="navigateUrl"
              placeholder="跳转 URL（如 https://example.com）"
              size="default"
              style="flex: 1; min-width: 200px"
              @keyup.enter="doNavigate(navigateUrl)"
            />
            <el-button :loading="domLoading" plain size="small" @click="fetchContent" class="debug-dom-btn-fetch">获取内容</el-button>
            <el-button plain size="small" @click="doScreenshot">截屏</el-button>
          </div>
          <pre class="debug-dom-content">{{ domLoading ? "加载中…" : domRaw }}</pre>
        </div>
      </el-tab-pane>

      <!-- Screenshot -->
      <el-tab-pane name="screenshot">
        <template #label>Screenshot</template>
        <div class="debug-screenshot">
          <div class="debug-screenshot-bar">
            <span>{{ selectedTarget ? `当前页面: ${selectedTarget}` : "请先选择或创建页面" }}</span>
            <el-button plain size="small" @click="doScreenshot" :loading="screenshotLoading">截屏</el-button>
            <el-button plain size="small" @click="doScreenshot(true)">长页截屏</el-button>
          </div>
          <div class="debug-screenshot-content" v-if="screenshotUrl">
            <img :src="screenshotUrl" alt="截图" />
          </div>
          <div class="debug-empty" v-else>暂无截屏</div>
        </div>
      </el-tab-pane>

      <!-- Evaluate -->
      <el-tab-pane name="evaluate">
        <template #label>Evaluate</template>
        <div class="debug-evaluate">
          <div class="debug-evaluate-bar">
            <el-input
              v-model="evaluateExpression"
              placeholder="JS 表达式（如 document.title）"
              size="default"
              @keyup.enter="doEvaluate"
              style="flex: 1; min-width: 200px"
            />
            <el-button :loading="evaluateLoading" plain size="small" @click="doEvaluate">求值</el-button>
          </div>
          <pre class="debug-evaluate-result">{{ evaluateLoading ? "计算中…" : evaluateResult }}</pre>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
