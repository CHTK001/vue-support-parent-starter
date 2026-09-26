<script setup lang="ts">
/**
 * RemoteNodeView —— 远程节点：在线执行器节点看板
 *
 * 数据来自执行器注册上报（GET /v2/scheduler/nodes）：节点标识、角色、长链地址与处理器清单。
 * 这个接口只由调度中心角色（SCHEDULER）持有执行器注册表，单机/执行器角色的注册表恒为空，
 * 所以本页必须打在调度中心节点上（dev 走 vite 代理的 COLLECT_SCHEDULER_TARGET）。
 *
 * 页面结构（自上而下）：居中大标题 + 右上角刷新胶囊（带下拉：立即刷新 / 自动刷新开关）、
 * 蓝色说明条、红色失败条（带重试）、节点卡片网格或空态大卡。
 * 空态大卡给的是「怎么把执行器接进来」的下一步，而不是干巴巴一句没有数据；
 * 点「查看接入文档」把启动参数摊开，执行器照着起就能上线。
 */
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReTag from "@repo/ui/re-tag";
import { getSummary, listNodes } from "../api/jobApi";
import type { JobNode } from "../types/job";
import { errText } from "../composables/useCollectView";
import { fmtMs } from "../utils/time";

defineOptions({ name: "CollectRemoteNode" });

const router = useRouter();
const nodes = ref<JobNode[]>([]);
const loading = ref(false);
const error = ref("");
/** 本节点角色：单机/执行器角色不会有节点上报，空态文案按角色提示 */
const role = ref("");

/** 接入文档弹层显隐 */
const docVisible = ref(false);

/** 自动刷新间隔（毫秒），0 表示关闭；下拉里切换 */
const autoRefreshMs = ref(0);
let autoTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 拉取在线节点与角色。
 */
async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const [list, summary] = await Promise.all([listNodes(), getSummary()]);
    nodes.value = list ?? [];
    role.value = summary?.role ?? "";
  } catch (e) {
    error.value = errText(e);
  } finally {
    loading.value = false;
  }
}

/**
 * 重建自动刷新定时器。
 */
function resetAutoTimer(): void {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  if (autoRefreshMs.value > 0) {
    autoTimer = setInterval(() => void load(), autoRefreshMs.value);
  }
}

/**
 * 刷新胶囊下拉命令。
 *
 * @param command now 立即刷新 / 5s 开启五秒自动刷新 / off 关闭自动刷新
 */
function onRefreshCommand(command: string): void {
  if (command === "now") {
    void load();
    return;
  }
  autoRefreshMs.value = command === "5s" ? 5000 : 0;
  resetAutoTimer();
}

/**
 * 建调度作业：跳到调度作业页并带创建参数（处理器可选）。
 *
 * @param handler 目标处理器名（节点上报的执行器）
 */
function createJob(handler?: string): void {
  const query: Record<string, string> = { create: "1" };
  if (handler) {
    query.task = handler;
  }
  void router.push({ path: "/collect/job", query });
}

/** 空态描述：按本节点角色说明该由谁上报，别让人以为页面坏了 */
const emptyTip = computed<string>(() => {
  if (role.value === "SCHEDULER") {
    return "执行器以 EXECUTOR 角色启动并连上本调度中心（SyncServer）后，这里会显示它的地址与已注册处理器。";
  }
  if (role.value) {
    return `当前本节点角色是 ${role.value}，它不持有执行器注册表；切到调度中心（SCHEDULER）节点查看在线节点。`;
  }
  return "执行器以 EXECUTOR 角色启动并连上调度中心（SyncServer）后，这里会显示它的地址与已注册处理器。";
});

onMounted(load);
// keep-alive 页面离开时只是停用、不会卸载：自动刷新必须在这里停掉，
// 否则切到别的标签页仍在按秒轮询调度中心接口；回来时 onActivated 重新拉数据并续上定时器。
onActivated(() => {
  void load();
  resetAutoTimer();
});
onDeactivated(resetAutoTimer);
onBeforeUnmount(resetAutoTimer);
</script>

<template>
  <div class="node-page">
     <div class="node-banner node-banner--info">
      <span class="node-banner__icon"><el-icon><Bottom /></el-icon></span>
      <span class="node-banner__text">
        执行器注册上报的在线节点（{{ nodes.length }} 个），断开即消失；点处理器标签可就地为它建一条调度作业
      </span>
    </div>

    <div v-if="error" class="node-banner node-banner--error">
      <span class="node-banner__icon"><el-icon><WarningFilled /></el-icon></span>
      <span class="node-banner__text">{{ error }}</span>
      <el-button class="node-banner__action" @click="load">重试</el-button>
    </div>

    <div v-if="nodes.length" class="node-grid">
      <div v-for="node in nodes" :key="node.clientId" class="node-card">
        <div class="node-card__head">
          <span class="node-card__title" :title="node.nodeId || node.clientId">
            {{ node.nodeId || node.clientId }}
          </span>
          <ReTag size="small" type="success" effect="plain">在线</ReTag>
          <ReTag size="small" type="info" effect="plain">{{ node.role || "EXECUTOR" }}</ReTag>
        </div>

        <dl class="node-card__meta">
          <dt>长链地址</dt>
          <dd class="node-card__mono">{{ node.serverUrl || "—" }}</dd>
          <dt>客户端</dt>
          <dd class="node-card__mono" :title="node.clientId">{{ node.clientId }}</dd>
          <dt>上线时间</dt>
          <dd class="node-card__mono">{{ fmtMs(node.registeredAt) }}</dd>
        </dl>

        <div class="node-card__handlers">
          <ReTag
            v-for="handler in node.handlers"
            :key="handler"
            class="node-handler"
            size="small"
            effect="plain"
            title="点击创建调度作业"
            @click="createJob(handler)"
          >
            {{ handler }}
          </ReTag>
          <span v-if="!node.handlers.length" class="node-card__none">该节点未上报处理器</span>
        </div>

        <div class="node-card__foot">
          <ReButton
            type="primary"
            icon="Plus"
            :disabled="!node.handlers.length"
            @click="createJob(node.handlers[0])"
          >
            创建调度作业
          </ReButton>
        </div>
      </div>
    </div>

    <section v-else class="node-empty">
      <span class="node-empty__badge">
        <svg class="node-empty__icon" viewBox="0 0 48 48" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">
            <rect x="7" y="5" width="34" height="11" rx="2.6" />
            <rect x="7" y="18.5" width="34" height="11" rx="2.6" />
            <rect x="7" y="32" width="34" height="11" rx="2.6" />
          </g>
          <g fill="currentColor">
            <circle cx="13.5" cy="10.5" r="1.6" />
            <circle cx="13.5" cy="24" r="1.6" />
            <circle cx="13.5" cy="37.5" r="1.6" />
          </g>
        </svg>
      </span>
      <h2 class="node-empty__title">暂无在线执行器节点</h2>
      <p class="node-empty__desc">{{ emptyTip }}</p>
      <el-button class="node-empty__action" @click="docVisible = true">查看接入文档</el-button>
    </section>

    <ReDialog v-model="docVisible" title="执行器接入（job-starter）" width="860px" top="6vh" footer-hidden>
      <div class="node-doc">
        <div class="node-doc__block node-doc__block--dep">
          <h4 class="node-doc__h">依赖</h4>
          <p class="node-doc__lead">
            本页数据来自 <code>spring-support-job-starter</code> 的长链注册表
            （<code>com.chua.starter.job.support.sync.RemoteHandlerRegistry</code>），执行器注册上报由
            <code>ExecutorSyncBinder</code> 写、<code>SchedulerSyncBinder</code> 读。
            应用必须引入该 starter 并打开治理出口，否则 <code>/v2/scheduler/nodes</code> 根本不装配。
            该注册表只存在于调度中心进程内存，单机（SINGLE）与执行器（EXECUTOR）角色下恒为空。
          </p>
        </div>

        <h4 class="node-doc__h">调度中心（role=SCHEDULER）</h4>
        <pre class="node-doc__code"><code>plugin.job.role=SCHEDULER
plugin.job.manage.enable=true
plugin.job.sync.scheduler.listen-host=0.0.0.0
plugin.job.sync.scheduler.listen-port=18081
plugin.job.sync.scheduler.protocol=tcp</code></pre>

        <h4 class="node-doc__h">执行器（role=EXECUTOR）</h4>
        <pre class="node-doc__code"><code>plugin.job.role=EXECUTOR
plugin.job.sync.executor.server-url=tcp://调度中心地址:18081</code></pre>

        <h4 class="node-doc__h">plugin.job 配置项（JobProperties）</h4>
        <div class="node-doc__table-wrap">
          <table class="node-doc__table">
            <thead>
              <tr><th>配置项</th><th>默认值</th><th>说明</th></tr>
            </thead>
            <tbody>
              <tr><td><code>enable</code></td><td><code>true</code></td><td>模块总开关，关掉不装配任何调度 bean</td></tr>
              <tr><td><code>role</code></td><td><code>SINGLE</code></td><td>进程角色：SCHEDULER / EXECUTOR / SINGLE</td></tr>
              <tr><td><code>node-id</code></td><td><code>空</code></td><td>节点标识，留空按 主机名-pid 推导</td></tr>
              <tr><td><code>cluster.group</code></td><td><code>default</code></td><td>选主命名空间，同组内 Leader 唯一</td></tr>
              <tr><td><code>cluster.scan-interval-ms</code></td><td><code>1000</code></td><td>Leader 扫描间隔</td></tr>
              <tr><td><code>cluster.pre-read-ms</code></td><td><code>5000</code></td><td>预读时间窗</td></tr>
              <tr><td><code>cluster.lease-seconds</code></td><td><code>15</code></td><td>Leader 租约时长</td></tr>
              <tr><td><code>sync.in-memory</code></td><td><code>false</code></td><td>置 true 直接拒绝启动，不提供内存伪实现</td></tr>
              <tr class="is-key"><td><code>sync.scheduler.listen-host</code></td><td><code>0.0.0.0</code></td><td>调度中心长链监听地址</td></tr>
              <tr class="is-key"><td><code>sync.scheduler.listen-port</code></td><td><code>8081</code></td><td>调度中心长链监听端口</td></tr>
              <tr class="is-key"><td><code>sync.scheduler.protocol</code></td><td><code>tcp</code></td><td>长链协议，须与执行器 server-url 的 scheme 一致</td></tr>
              <tr class="is-key"><td><code>sync.executor.server-url</code></td><td><code>空</code></td><td>调度中心长链 URL，如 tcp://10.0.0.11:18081</td></tr>
              <tr><td><code>sync.executor.reconnect-base-ms</code></td><td><code>500</code></td><td>保留字段，当前实现未读取（重连为固定 5s 轮询）</td></tr>
              <tr><td><code>sync.executor.reconnect-max-ms</code></td><td><code>30000</code></td><td>保留字段，当前实现未读取</td></tr>
              <tr><td><code>pool.virtual</code></td><td><code>true</code></td><td>虚拟线程执行器；关掉回退平台线程池</td></tr>
              <tr><td><code>pool.core-size</code></td><td><code>16</code></td><td>平台线程池核心数（virtual=false 时生效）</td></tr>
              <tr><td><code>pool.max-size</code></td><td><code>64</code></td><td>平台线程池最大数</td></tr>
              <tr><td><code>pool.queue-size</code></td><td><code>128</code></td><td>平台线程池队列容量</td></tr>
              <tr><td><code>log.enabled</code></td><td><code>false</code></td><td>作业日志文件落盘开关</td></tr>
              <tr><td><code>log.base-path</code></td><td><code>./logs/job</code></td><td>日志根目录</td></tr>
              <tr><td><code>log.async</code></td><td><code>true</code></td><td>异步写入</td></tr>
              <tr><td><code>log.queue-size</code></td><td><code>4096</code></td><td>异步队列容量</td></tr>
              <tr><td><code>log.cleanup-enabled</code></td><td><code>false</code></td><td>日志自动清理开关</td></tr>
              <tr><td><code>log.cleanup-retention-days</code></td><td><code>30</code></td><td>日志保留天数</td></tr>
              <tr><td><code>log.cleanup-cron</code></td><td><code>0 0 0 * * ?</code></td><td>清理定时 cron</td></tr>
              <tr class="is-key"><td><code>manage.enable</code></td><td><code>false</code></td><td>装配 /v2/job/** 与 /v2/scheduler/** 治理出口</td></tr>
            </tbody>
          </table>
        </div>

        <ul class="node-doc__notes">
          <li>高亮的四行是让本页有数据的最小集合：调度中心开监听 + 治理出口，执行器指对地址。</li>
          <li>协议两端必须一致：<code>sync.scheduler.protocol</code> 与 <code>server-url</code> 的 scheme 不一致时，
            执行器连得上却注册不上，本页恒为空。</li>
          <li>执行器启动后 5 秒内上报一次，之后每 30 秒重连并续报，断开即从本页消失。</li>
          <li>本页数据只在调度中心进程内存，调度中心重启后由执行器重连自动补齐。</li>
        </ul>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
/* 页面底：系统页面底色 + 主色极淡光晕，亮暗都跟着令牌走 */
.node-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-height: 100%;
  padding: 20px 24px 32px;
  box-sizing: border-box;
  background:
    radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--el-color-primary) 7%, transparent), transparent 70%),
    var(--el-bg-color-page);
}

/* ===== 顶部：大标题居中 + 右侧刷新胶囊 ===== */
.node-page__head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 0 4px;
}

.node-page__title {
  flex: 1;
  margin: 0;
  text-align: center;
  color: var(--el-text-color-primary);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1.2;
}

/* 刷新：左半边直接刷新，右半边箭头下拉（自动刷新开关） */
.node-refresh :deep(.el-button) {
  height: 44px;
  padding: 0 20px;
  border-radius: var(--el-radius-full);
  border-color: var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-regular);
  font-size: 15px;
  font-family: var(--cc-font-num);
  box-shadow: none;
  transition:
    border-color var(--rm-transition, 150ms cubic-bezier(0.4, 0, 0.2, 1)),
    color var(--rm-transition, 150ms cubic-bezier(0.4, 0, 0.2, 1));
}

.node-refresh :deep(.el-button__inner) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.node-refresh :deep(.el-button:hover) {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-bg-color-overlay);
  color: var(--el-color-primary);
}

.node-refresh :deep(.el-button:focus-visible) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* ===== 提示条 / 失败条 ===== */
.node-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  box-sizing: border-box;
  border-radius: var(--el-radius-lg);
  border: 1px solid transparent;
}

.node-banner__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border-radius: var(--el-radius-full);
  color: var(--el-color-white);
  font-size: 18px;
}

.node-banner__text {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.node-banner--info {
  border-color: color-mix(in srgb, var(--el-color-primary) 34%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color-overlay));
  color: var(--el-text-color-primary);
}

.node-banner--info .node-banner__icon {
  background: var(--el-color-primary);
}

.node-banner--error {
  border-color: color-mix(in srgb, var(--el-color-danger) 34%, transparent);
  background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color-overlay));
  color: var(--el-color-danger);
  font-weight: 600;
}

.node-banner--error .node-banner__icon {
  background: var(--el-color-danger);
}

.node-banner__action {
  flex: 0 0 auto;
  border-radius: var(--el-radius-full);
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.node-banner__action:hover {
  border-color: var(--el-color-danger-light-5);
  color: var(--el-color-danger);
}

/* ===== 节点卡片 ===== */
.node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}

.node-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg);
  background: var(--el-bg-color-overlay);
  transition: border-color var(--rm-transition, 150ms cubic-bezier(0.4, 0, 0.2, 1));
}

.node-card:hover {
  border-color: var(--el-color-primary-light-7);
}

.node-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.node-card__title {
  flex: 1;
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card__meta {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 8px 12px;
  margin: 0;
  font-size: 13px;
}

.node-card__meta dt {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.node-card__meta dd {
  min-width: 0;
  margin: 0;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card__mono {
  font-family: var(--cc-font-num);
  font-variant-numeric: tabular-nums;
}

.node-card__handlers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 92px;
  overflow: auto;
  padding: 2px 0;
}

.node-handler {
  cursor: pointer;
}

.node-handler:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.node-card__none {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.node-card__foot {
  display: flex;
  justify-content: flex-end;
}

/* ===== 空态大卡 ===== */
.node-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 56px 32px 60px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl);
  background: var(--el-bg-color-overlay);
  text-align: center;
}

.node-empty__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  border-radius: var(--el-radius-full);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
}

.node-empty__icon {
  width: 76px;
  height: 76px;
}

.node-empty__title {
  margin: 6px 0 0;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
}

.node-empty__desc {
  max-width: 680px;
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 15px;
  line-height: 1.8;
}

.node-empty__action {
  margin-top: 10px;
  padding: 0 26px;
  border-radius: var(--el-radius-full);
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-size: 15px;
}

.node-empty__action:hover {
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  background: var(--el-bg-color-overlay);
}

/* ===== 接入文档 ===== */
/* 弹层 body 的左右内边距由 koi ReDialog 统一给（8px 20px），这里不再自己加 */
.node-doc {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 72vh;
  overflow: auto;
}

.node-doc__h {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

/* 依赖说明：主色左边条，和详情卡片一个识别特征 */
.node-doc__block--dep {
  padding: 12px 14px 12px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid var(--el-color-primary);
  border-radius: var(--el-radius-md);
  background: var(--el-fill-color-lighter);
}

.node-doc__block--dep .node-doc__h {
  margin-bottom: 6px;
}

.node-doc__lead {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 13.5px;
  line-height: 1.8;
}

/* 命令行片段：整块等宽，不用逐行 code chip */
.node-doc__code {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--el-radius-md);
  background: var(--el-text-color-primary);
  color: var(--el-bg-color);
  font-family: var(--cc-font-num);
  font-size: 12.5px;
  line-height: 1.9;
  overflow-x: auto;
  white-space: pre;
}

/* 配置项速查表 */
.node-doc__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
}

.node-doc__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.node-doc__table th,
.node-doc__table td {
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.node-doc__table th {
  position: sticky;
  top: 0;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.node-doc__table td {
  color: var(--el-text-color-regular);
}

.node-doc__table th:nth-child(1),
.node-doc__table td:nth-child(1) {
  width: 1%;
}

.node-doc__table th:nth-child(2),
.node-doc__table td:nth-child(2) {
  width: 1%;
}

.node-doc__table td:nth-child(3) {
  white-space: normal;
  min-width: 240px;
}

/* 最小必需集：这几行配错本页就是空的 */
.node-doc__table tr.is-key td {
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

.node-doc__table tr:last-child td {
  border-bottom: 0;
}

.node-doc__table code {
  padding: 1px 6px;
  border-radius: var(--el-radius-sm);
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
  font-family: var(--cc-font-num);
  font-size: 12.5px;
}

.node-doc__notes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 20px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.node-doc__notes code {
  padding: 1px 5px;
  border-radius: var(--el-radius-sm);
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
  font-family: var(--cc-font-num);
  font-size: 12px;
}

@media (max-width: 760px) {
  .node-page {
    padding: 12px 14px 24px;
  }

  .node-page__title {
    font-size: 24px;
    letter-spacing: 0;
  }

  .node-banner {
    align-items: flex-start;
  }

  .node-empty {
    padding: 36px 20px 40px;
  }

  .node-empty__badge {
    width: 112px;
    height: 112px;
  }

  .node-empty__icon {
    width: 56px;
    height: 56px;
  }

  .node-empty__title {
    font-size: 20px;
  }
}
</style>
