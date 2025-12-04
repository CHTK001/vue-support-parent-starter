<template>
  <div class="trace-viewer">
    <div class="toolbar">
      <el-input v-model="classPattern" placeholder="类匹配（必填，如 com.example.service.UserService�? style="min-width: 300px" clearable>
        <template #suffix>
          <el-tooltip placement="top">
            <template #content>
              <div style="max-width: 300px">
                <p><strong>输入要追踪的类名�?/strong></p>
                <p>�?使用具体的实现类，避免接口或抽象�?/p>
                <p>�?示例：com.example.service.UserService</p>
                <p>�?支持通配符：com.example.service.*</p>
                <p>�?如果提示匹配类过多，请使用更具体的类�?/p>
              </div>
            </template>
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
      </el-input>
      <el-input v-model="methodPattern" placeholder="方法匹配（可选，默认 *�? style="min-width: 200px" clearable />
      <el-input v-model="condition" placeholder="条件表达式（可选，�?#cost>10�? style="min-width: 220px" clearable />
      <el-checkbox v-model="useRegex">正则(-E)</el-checkbox>
      <el-input-number v-model="count" :min="1" :max="1000" :step="1" controls-position="right" style="width: 120px" />
      <span class="label">-n</span>
      <el-input-number v-model="expand" :min="0" :max="10" :step="1" controls-position="right" style="width: 100px" />
      <span class="label">-x</span>
      <el-checkbox v-model="autoRefresh">自动刷新</el-checkbox>
      <el-select v-model="refreshInterval" style="width: 120px" placeholder="拉取间隔" title="设置结果拉取间隔（同时用于自动刷新间隔）">
        <el-option :value="5" label="5�? />
        <el-option :value="10" label="10�? />
        <el-option :value="30" label="30�? />
        <el-option :value="60" label="60�? />
      </el-select>
      <el-button @click="clearData">清空</el-button>
      <el-button type="primary" :disabled="!nodeId || !classPatternTrim || isRunning" :loading="loading" @click="run">
        {{ autoRefresh && countdown > 0 ? `执行(${countdown}s)` : "执行" }}
      </el-button>
      <el-button @click="sendStop" :disabled="!isRunning" :type="isRunning ? 'danger' : 'default'">
        {{ isRunning ? "停止追踪" : "停止" }}
      </el-button>
      <div v-if="isRunning" class="status-indicator">
        <el-tag type="success" effect="dark">
          <el-icon class="rotating"><Loading /></el-icon>
          正在追踪...
        </el-tag>
      </div>
    </div>

    <div class="content">
      <div v-if="error" class="error-message">
        <el-alert type="error" :title="error" show-icon />
      </div>

      <div v-else-if="traces.length === 0 && !loading" class="empty-state">
        <el-empty>
          <template #description>
            <div class="empty-description">
              <p>暂无链路追踪数据</p>
              <p class="empty-tips">
                请设置具体的类匹配模式并点击执行<br />
                <strong>建议�?/strong>使用具体的实现类名，避免接口或抽象类<br />
                <strong>示例�?/strong>com.example.service.UserService
              </p>
            </div>
          </template>
        </el-empty>
      </div>

      <div v-else class="trace-content">
        <!-- 统计信息 -->
        <div v-if="traceStats" class="trace-stats">
          <el-card shadow="never" class="stats-card">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">总调用次�?/span>
                <span class="stat-value">{{ traceStats.totalCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功次数</span>
                <span class="stat-value success">{{ traceStats.successCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">失败次数</span>
                <span class="stat-value error">{{ traceStats.failCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均耗时</span>
                <span class="stat-value">{{ traceStats.avgCost }}ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大耗时</span>
                <span class="stat-value">{{ traceStats.maxCost }}ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最小耗时</span>
                <span class="stat-value">{{ traceStats.minCost }}ms</span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 链路追踪列表 -->
        <div class="trace-list">
          <el-card v-for="(trace, index) in traces" :key="index" shadow="hover" class="trace-card" @click="expandTrace(trace)">
            <div class="trace-header">
              <div class="trace-info">
                <span class="trace-method">{{ trace.className }}.{{ trace.methodName }}</span>
                <el-tag :type="trace.success ? 'success' : 'danger'" size="small" class="trace-status">
                  {{ trace.success ? "成功" : "失败" }}
                </el-tag>
              </div>
              <div class="trace-metrics">
                <span class="trace-cost">{{ trace.cost }}ms</span>
                <span class="trace-time">{{ formatTime(trace.timestamp) }}</span>
              </div>
            </div>

            <div v-if="trace.expanded" class="trace-details">
              <div class="trace-tree">
                <div v-for="(node, nodeIndex) in trace.tree" :key="nodeIndex" class="tree-node" :style="{ paddingLeft: node.depth * 20 + 'px' }">
                  <div class="node-content">
                    <span class="node-method">{{ node.className }}.{{ node.methodName }}</span>
                    <span class="node-cost">{{ node.cost }}ms</span>
                    <span v-if="node.exception" class="node-exception">
                      <el-tag type="danger" size="small">异常</el-tag>
                    </span>
                  </div>
                  <div v-if="node.exception" class="exception-detail">
                    {{ node.exception }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import { QuestionFilled, Loading } from "@element-plus/icons-vue";
import { getOrCreateSession, execArthasCommandAsync, pullArthasResults, interruptArthasJob, closeArthasSession } from "@/api/arthas/arthas-http";

const props = defineProps<{ nodeId: string }>();

// 响应式数�?
const loading = ref(false);
const error = ref("");
const connected = ref(false);

// 异步执行相关状�?
const sessionId = ref("");
const consumerId = ref("");
const jobId = ref<number | null>(null);
const isRunning = ref(false);
let pullTimer: NodeJS.Timeout | null = null;

// 表单数据
const classPattern = ref("com.chua.starter.monitor.arthas.ArthasCommandController");
const methodPattern = ref("exec");
const condition = ref("");
const useRegex = ref(false);
const count = ref(10);
const expand = ref(0);

// 自动刷新相关
const autoRefresh = ref(false);
const refreshInterval = ref(10);
const countdown = ref(0);
let refreshTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;

// 链路追踪数据
const traces = ref<TraceInfo[]>([]);
const traceStats = ref<TraceStats | null>(null);

// 接口定义
interface TraceNode {
  className: string;
  methodName: string;
  cost: number;
  depth: number;
  exception?: string;
}

interface TraceInfo {
  className: string;
  methodName: string;
  cost: number;
  success: boolean;
  timestamp: number;
  tree: TraceNode[];
  expanded?: boolean;
}

interface TraceStats {
  totalCount: number;
  successCount: number;
  failCount: number;
  avgCost: number;
  maxCost: number;
  minCost: number;
}

const classPatternTrim = computed(() => classPattern.value.trim());

// 清空数据
function clearData() {
  traces.value = [];
  traceStats.value = null;
  error.value = "";
}

// 构建命令
function buildCmd(): string {
  const parts: string[] = ["trace"];
  if (useRegex.value) {
    parts.push("-E");
    console.log("添加正则表达式参�?-E");
  } else {
    console.log("未勾选正则表达式，不添加 -E 参数");
  }
  parts.push(classPatternTrim.value);
  parts.push((methodPattern.value || "*").trim() || "*");
  const cond = (condition.value || "").trim();
  if (cond) parts.push(`'${cond}'`);
  if (count.value && count.value > 0) parts.push("-n", String(count.value));
  if (expand.value && expand.value > 0) parts.push("-x", String(expand.value));

  const cmd = parts.join(" ");
  console.log("构建的完整命�?", cmd);
  console.log("useRegex.value:", useRegex.value);
  return cmd;
}

// 解析链路追踪数据
function parseTraceData(output: any): TraceInfo[] {
  try {
    if (!output?.body?.results) {
      console.log("没有找到results数据");
      return [];
    }

    const results = output.body.results;
    const traces: TraceInfo[] = [];

    // 查找trace类型的结�?
    for (const result of results) {
      if (result.type === "trace") {
        // 检查是否有root数据（新格式）或tree数据（旧格式�?
        const traceRoot = result.root || result.tree;
        if (traceRoot) {
          // 解析trace树结�?
          const trace: TraceInfo = {
            className: extractClassName(traceRoot),
            methodName: extractMethodName(traceRoot),
            cost: result.cost || traceRoot.cost || 0,
            success: !result.exception,
            timestamp: Date.now(),
            tree: parseTraceTree(traceRoot, 0),
            expanded: false,
          };
          traces.push(trace);
          console.log("成功解析trace数据:", trace.className, trace.methodName);
        } else if (result.className && result.methodName) {
          // 可能是其他格式的trace数据，尝试直接解�?
          const trace: TraceInfo = {
            className: result.className,
            methodName: result.methodName,
            cost: result.cost || 0,
            success: !result.exception,
            timestamp: Date.now(),
            tree: [],
            expanded: false,
          };
          traces.push(trace);
          console.log("解析简单trace数据:", trace.className, trace.methodName);
        } else {
          console.log("trace数据格式不识�?", result);
        }
      }
    }

    console.log("解析完成，trace数量:", traces.length);
    return traces;
  } catch (e) {
    console.error("解析链路追踪数据失败:", e);
    return [];
  }
}

// 解析trace树结�?
function parseTraceTree(tree: any, depth: number): TraceNode[] {
  if (!tree) return [];

  const nodes: TraceNode[] = [];

  if (Array.isArray(tree)) {
    // 如果是数组，递归处理每个元素
    for (const node of tree) {
      nodes.push(...parseTraceTree(node, depth));
    }
  } else if (typeof tree === "object") {
    // 如果是对象，解析节点信息
    const node: TraceNode = {
      className: tree.className || "",
      methodName: tree.methodName || "",
      cost: tree.cost || 0,
      depth: depth,
      exception: tree.exception,
    };
    nodes.push(node);

    // 递归处理子节�?
    if (tree.children && Array.isArray(tree.children)) {
      for (const child of tree.children) {
        nodes.push(...parseTraceTree(child, depth + 1));
      }
    }
  }

  return nodes;
}

// 从trace树中提取类名
function extractClassName(tree: any): string {
  if (!tree) return "";

  // 如果当前节点有className，直接返�?
  if (tree.className) return tree.className;

  // 如果是thread类型的根节点，查找children中的第一个method
  if (tree.type === "thread" && tree.children && tree.children.length > 0) {
    return extractClassName(tree.children[0]);
  }

  // 如果是数组，取第一个元�?
  if (Array.isArray(tree) && tree.length > 0) {
    return extractClassName(tree[0]);
  }

  return "";
}

// 从trace树中提取方法�?
function extractMethodName(tree: any): string {
  if (!tree) return "";

  // 如果当前节点有methodName，直接返�?
  if (tree.methodName) return tree.methodName;

  // 如果是thread类型的根节点，查找children中的第一个method
  if (tree.type === "thread" && tree.children && tree.children.length > 0) {
    return extractMethodName(tree.children[0]);
  }

  // 如果是数组，取第一个元�?
  if (Array.isArray(tree) && tree.length > 0) {
    return extractMethodName(tree[0]);
  }

  return "";
}

// 计算统计信息
function calculateStats(traces: TraceInfo[]): TraceStats | null {
  if (traces.length === 0) return null;

  const costs = traces.map((t) => t.cost);
  const successCount = traces.filter((t) => t.success).length;

  return {
    totalCount: traces.length,
    successCount,
    failCount: traces.length - successCount,
    avgCost: Math.round(costs.reduce((a, b) => a + b, 0) / costs.length),
    maxCost: Math.max(...costs),
    minCost: Math.min(...costs),
  };
}

// 格式化时�?
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

// 展开/收起链路详情
function expandTrace(trace: TraceInfo) {
  trace.expanded = !trace.expanded;
}

// 执行链路追踪（异步方式）
async function run() {
  if (!props.nodeId || !classPatternTrim.value) return;

  // 如果已经在运行，先停�?
  if (isRunning.value) {
    await stopTrace();
  }

  loading.value = true;
  error.value = "";

  try {
    const cmd = buildCmd();
    console.log("开始执行trace流程，命�?", cmd);

    // 1. 先获取或创建会话（不执行命令�?
    console.log("步骤1: 获取或创建会�?);
    const sessionRes = await getOrCreateSession(props.nodeId, cmd);

    if (sessionRes?.success && sessionRes.data) {
      sessionId.value = sessionRes.data.sessionId;
      consumerId.value = sessionRes.data.consumerId;
      connected.value = true;
      console.log("会话获取成功:", sessionId.value);

      // 2. 异步执行trace命令
      console.log("步骤2: 异步执行trace命令");
      const execRes = await execArthasCommandAsync(props.nodeId, cmd);
      if (execRes?.success && execRes.data) {
        // 更新jobId（可能会有新的jobId�?
        sessionId.value = execRes.data.sessionId;
        consumerId.value = execRes.data.consumerId;
        jobId.value = execRes.data.jobId;
        isRunning.value = true;
        console.log("命令执行成功，jobId:", jobId.value);

        // 3. 开始定期拉取结�?
        console.log("步骤3: 开始定期拉取结�?);
        startPullingResults();
        loading.value = false; // 命令执行成功，停止loading
      } else {
        error.value = execRes?.msg || "执行trace命令失败";
        loading.value = false;
        console.error("命令执行失败:", execRes?.msg);
      }
    } else {
      error.value = sessionRes?.msg || "获取会话失败";
      loading.value = false;
      console.error("会话获取失败:", sessionRes?.msg);
    }
  } catch (e: any) {
    error.value = e?.message || "启动trace命令异常";
    loading.value = false;
    console.error("trace启动异常:", e);
  }
}

// 开始定期拉取结�?
function startPullingResults() {
  if (!sessionId.value || !consumerId.value) return;

  // 清除之前的定时器
  if (pullTimer) {
    clearInterval(pullTimer);
  }

  // 立即拉取一�?
  pullResults();

  // 使用页面配置的刷新间隔拉取结�?
  const intervalMs = refreshInterval.value * 1000;
  console.log(`开始定时拉取，间隔: ${refreshInterval.value}秒`);
  pullTimer = setInterval(() => {
    pullResults();
  }, intervalMs);
}

// 拉取结果
async function pullResults() {
  if (!sessionId.value || !consumerId.value || !isRunning.value) return;

  try {
    const pullRes = await pullArthasResults(sessionId.value, consumerId.value);

    if (pullRes?.success && pullRes.data) {
      // 检查是否重新创建了会话
      const data = pullRes.data as any;
      if (data.recreated) {
        // 会话被重新创建，更新本地信息
        sessionId.value = data.sessionId;
        consumerId.value = data.consumerId;
        jobId.value = data.jobId;
        console.log("会话已重新创�?", data.message);
        return; // 本次不处理数据，等待下次拉取
      }

      // 修复数据结构解析
      const responseBody = (pullRes.data.body as any)?.body || pullRes.data.body;

      const output = {
        body: responseBody,
        sessionId: pullRes.data.sessionId,
        state: "SUCCEEDED",
      };

      // 解析trace数据
      const parsedTraces = parseTraceData(output);

      // 如果有新的trace数据，添加到现有数据�?
      if (parsedTraces.length > 0) {
        traces.value = [...traces.value, ...parsedTraces];
        traceStats.value = calculateStats(traces.value);
        console.log("成功添加trace数据，当前总数:", traces.value.length);
      }

      // 检查是否有enhancer错误或status错误
      const results = responseBody?.results || [];
      const enhancerResult = results.find((r: any) => r.type === "enhancer");
      const statusResult = results.find((r: any) => r.type === "status");

      // 检查status错误（如命令参数错误�?
      if (statusResult && statusResult.statusCode !== 0) {
        error.value = `Trace命令执行失败: ${statusResult.message}

可能的原因：
1. 命令参数格式不正�?
2. 类名或方法名不存�?
3. 权限不足

建议�?
1. 检查类名和方法名是否正�?
2. 确保目标类已被加�?
3. 检查命令参数格式`;
        await stopTrace();
        return;
      }

      if (enhancerResult && !enhancerResult.success) {
        if (enhancerResult.effect?.overLimitMsg) {
          error.value = `${enhancerResult.effect.overLimitMsg}

建议解决方案�?
1. 使用更具体的类名，如：com.example.service.UserService
2. 避免使用接口名或抽象类名
3. 可以使用 -m 参数增加匹配类的限制数量
4. 确保类名拼写正确且该类确实存在`;
        } else {
          error.value = "增强器执行失败，请检查类匹配模式是否正确";
        }
        // enhancer失败时停止拉�?
        await stopTrace();
        return;
      }

      // 检查job状�?
      const jobStatus = responseBody?.jobStatus || pullRes.data.body?.jobStatus;
      if (jobStatus === "TERMINATED") {
        // job已结束，停止拉取
        await stopTrace();

        if (traces.value.length === 0 && !error.value) {
          error.value = `未获取到链路追踪数据

可能的原因：
1. 类匹配模式不正确或类不存�?
2. 方法没有被调�?
3. 方法匹配模式不正�?

建议�?
1. 确认类名和方法名是否正确
2. 确保在追踪期间有实际的方法调�?
3. 检查方法匹配模式（默认�?* 匹配所有方法）`;
        }
      }
    }
  } catch (e: any) {
    console.error("拉取trace结果失败:", e);
    // 拉取失败不立即停止，继续尝试
  }
}

// 停止追踪
async function stopTrace() {
  isRunning.value = false;
  connected.value = false;
  loading.value = false;

  // 清除拉取定时�?
  if (pullTimer) {
    clearInterval(pullTimer);
    pullTimer = null;
  }

  // 如果有sessionId，尝试中断job
  if (sessionId.value) {
    try {
      await interruptArthasJob(sessionId.value);
    } catch (e) {
      console.error("中断trace job失败:", e);
    }
  }

  // 清空session信息
  sessionId.value = "";
  consumerId.value = "";
  jobId.value = null;
}

// 停止追踪（用户点击停止按钮）
async function sendStop() {
  await stopTrace();

  // 关闭会话
  if (sessionId.value) {
    try {
      await closeArthasSession(sessionId.value);
      console.log("会话已关�?", sessionId.value);
    } catch (e) {
      console.error("关闭会话失败:", e);
    }
  }
}

// 启动自动刷新
function startAutoRefresh() {
  if (!autoRefresh.value || !props.nodeId || !classPatternTrim.value) return;

  stopAutoRefresh(); // 先停止之前的定时�?

  // 启动倒计�?
  countdown.value = refreshInterval.value;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      run(); // 执行追踪
      countdown.value = refreshInterval.value; // 重置倒计�?
    }
  }, 1000);
}

// 停止自动刷新
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdown.value = 0;
}

// 监听自动刷新状态变�?
watch(autoRefresh, (newVal) => {
  if (newVal && props.nodeId && classPatternTrim.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

// 监听刷新间隔变化
watch(refreshInterval, () => {
  if (autoRefresh.value && props.nodeId && classPatternTrim.value) {
    startAutoRefresh(); // 重新启动定时�?
  }

  // 如果正在拉取结果，也重新启动拉取定时�?
  if (isRunning.value && pullTimer) {
    console.log(`刷新间隔变更�?{refreshInterval.value}秒，重新启动拉取定时器`);
    startPullingResults();
  }
});

// 监听节点变化
watch(
  () => props.nodeId,
  (n, o) => {
    if (n && n !== o) {
      clearData();
      stopAutoRefresh(); // 停止自动刷新
      if (n && autoRefresh.value && classPatternTrim.value) {
        startAutoRefresh(); // 如果开启了自动刷新，重新启�?
      }
    }
  }
);

// 组件挂载时自动执�?
onMounted(() => {
  // 不自动执行，需要用户设置类匹配后手动执�?
});

// 监控useRegex值的变化
watch(useRegex, (newVal, oldVal) => {
  console.log("useRegex值变�?", oldVal, "->", newVal);
  console.log("新命�?", buildCmd());
});

// 组件挂载时的调试信息
onMounted(() => {
  console.log("TraceViewer组件已挂�?);
  console.log("useRegex初始�?", useRegex.value);
  console.log("初始命令:", buildCmd());
});

// 组件卸载时清理定时器和会�?
onBeforeUnmount(async () => {
  stopAutoRefresh();
  await stopTrace();

  // 关闭会话
  if (sessionId.value) {
    try {
      await closeArthasSession(sessionId.value);
      console.log("页面卸载，会话已关闭:", sessionId.value);
    } catch (e) {
      console.error("页面卸载时关闭会话失�?", e);
    }
  }
});
</script>

<style scoped>
.trace-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
}

.label {
  color: var(--el-text-color-secondary);
  margin: 0 4px 0 0;
  font-size: 12px;
  white-space: nowrap;
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.error-message {
  margin-bottom: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-description {
  text-align: center;
}

.empty-description p {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.empty-tips {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.trace-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 统计信息样式 */
.trace-stats {
  flex-shrink: 0;
}

.stats-card {
  border: 1px solid var(--el-border-color-light);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stat-value.success {
  color: var(--el-color-success);
}

.stat-value.error {
  color: var(--el-color-danger);
}

/* 链路追踪列表样式 */
.trace-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trace-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-light);
}

.trace-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trace-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.trace-method {
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-color-primary);
}

.trace-status {
  flex-shrink: 0;
}

.trace-metrics {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.trace-cost {
  font-weight: 600;
  color: var(--el-color-warning);
}

.trace-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 链路详情样式 */
.trace-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.trace-tree {
  background: var(--el-bg-color-page);
  border-radius: 4px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.tree-node {
  margin-bottom: 8px;
  padding: 6px 0;
  border-left: 2px solid var(--el-border-color-light);
  position: relative;
}

.tree-node::before {
  content: "";
  position: absolute;
  left: -6px;
  top: 50%;
  width: 8px;
  height: 8px;
  background: var(--el-color-primary);
  border-radius: 50%;
  transform: translateY(-50%);
}

.node-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
}

.node-method {
  color: var(--el-text-color-primary);
  flex: 1;
}

.node-cost {
  color: var(--el-color-warning);
  font-weight: 600;
}

.node-exception {
  flex-shrink: 0;
}

.exception-detail {
  margin-top: 6px;
  padding: 8px;
  background: var(--el-color-danger-light-9);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  word-break: break-all;
}

/* 状态指示器样式 */
.status-indicator {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.rotating {
  animation: rotate 2s linear infinite;
  margin-right: 4px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设�?*/
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .toolbar > * {
    width: 100%;
  }

  .toolbar .el-checkbox,
  .toolbar .el-button,
  .toolbar .label {
    width: auto;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .trace-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .trace-metrics {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
