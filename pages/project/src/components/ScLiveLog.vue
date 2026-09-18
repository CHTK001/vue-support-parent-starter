<script setup lang="ts">
/**
 * 实时日志面板
 *
 * 传输策略：socket 推送优先，REST 轮询降级。
 *
 *  - 推送：调用 /ms/project/{id}/log/subscribe 让后端按 projectId+hostId 建立一条「共享采集流」，
 *    后端定时增量 tail 远程日志文件，再经 socket 事件 project/project-log 广播。
 *    一个采集流服务 N 个观察者，远程开销从 O(观察者数) 降到 O(被观察项目数)；
 *    多个窗口看同一个项目时，远程只被读一次。
 *  - 续订：订阅带生命周期，必须按心跳周期（idleMillis/2，默认 30s）重复调用 subscribe 续订。
 *    超时未续订的观察者会被后端剪枝剔除，剔除后无观察者的流自动停止采集
 *    —— 兜住「浏览器被强杀 / 断网来不及退订」导致的 SSH 通道泄漏。
 *  - 降级：socket 不可用、订阅接口失败、或 8s 内未收到任何帧（老后端无该接口 / socket 已断连）
 *    → 回退 1.5s REST 轮询（tailProjectLog），功能不缺失。
 *  - 游标：推送模式下 cursor 由后端持有，前端只做展示、不回传，避免多观察者互相把对方的增量吃掉。
 *
 * 安全：日志内容来自被部署主机，属不可信输入，必须用文本插值而非 v-html
 * （远端进程写入 <img src=x onerror=...> 即可在管理员浏览器执行任意脚本）。
 * 组件约定：全量使用 Re 组件体系。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useSocketService } from '@repo/core';
import { subscribeProjectLog, tailProjectLog, unsubscribeProjectLog } from '../api';

const props = defineProps<{
  visible: boolean;
  projectId: number;
  projectName: string;
  hostOptions: Array<{ label: string; value: number }>;
}>();
const emit = defineEmits<{ 'update:visible': [v: boolean] }>();

/** 展示内容上限（字符），防止长时间挂着的窗口吃满内存 */
const MAX_CONTENT_CHARS = 500000;
/** 轮询降级间隔（毫秒） */
const POLL_INTERVAL_MILLIS = 1500;
/**
 * 推送模式首帧等待上限：超时判定推送不可用并降级，不能让用户一直空等。
 * 取 8s 是给「首次连该主机需要完整 SSH 握手 + 执行 tail」留余量；连接池命中时通常 1s 内出首帧。
 */
const PUSH_FIRST_FRAME_TIMEOUT_MILLIS = 8000;
/** 心跳周期兜底值（毫秒）；正常取后端下发的 idleMillis / 2 */
const DEFAULT_HEARTBEAT_MILLIS = 30000;
/** 推送事件名，需与后端 ProjectConstants.PUSH_EVENT_PROJECT_LOG 一致 */
const PUSH_EVENT = 'project-log';
/** 推送模块名，需与后端 ProjectConstants.PUSH_MODULE 一致 */
const PUSH_MODULE = 'project';

/**
 * ReDrawer 的 v-model 契约是 `modelValue`（内部 `defineModel<boolean>()`），不是 `visible`。
 * `v-model="props.visible"` 会导致关闭无法回写父组件 → 父组件 visible 恒为 true，
 * 于是「关闭后再点实时日志」不产生 prop 变化，订阅/轮询不会重启、抽屉打不开。
 * 用 computed 代理双向桥接。
 */
const drawerVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

/** setup 顶层取一次：socket 未装配时为 null，此时直接走轮询 */
const socket = useSocketService();

const selectedHost = ref<number | null>(null);
const content = ref('');
const cursor = ref<number | null>(null);
const loading = ref(false);
const autoScroll = ref(true);
const paused = ref(false);
const logRef = ref<HTMLDivElement | null>(null);
/** 最近一次失败原因（日志文件尚未生成属正常态，不弹窗，但要在面板上给出可读提示） */
const lastError = ref('');
/** 当前传输方式：socket 推送 / REST 轮询降级 */
const transport = ref<'socket' | 'poll'>('socket');
/**
 * 降级原因。与 lastError 分开：降级后日志其实在正常刷新，若混进「异常」会让用户误判故障。
 * 它只用于解释「为什么状态栏写着轮询」。
 */
const degradeReason = ref('');
/** 暂停期间到达的推送内容先缓冲，继续时一次性追加，避免暂停期间丢日志 */
const pausedBuffer = ref('');

let pollTimer: number | undefined;
let heartbeatTimer: number | undefined;
let firstFrameTimer: number | undefined;
/** socket 取消订阅函数 */
let unsubPush: (() => void) | undefined;
/** 订阅会话号：切换主机 / 关闭抽屉后到达的迟到帧与在途回调按它丢弃 */
let sessionId = 0;
/** 当前生效的订阅标识（心跳与退订都用它） */
let subscriberId = '';
/** 当前已订阅的主机。不能用 selectedHost：切换主机时它已变成新值，退订会退错对象 */
let subscribedHostId: number | null = null;
/** 正在服务的 projectId:hostId，用于让 start() 幂等（watch 可能重复触发） */
let runningKey = '';

watch(() => props.visible, v => {
  if (v) {
    openSession();
  } else {
    stop();
  }
});

/**
 * 切换主机必须重新订阅：订阅粒度是 projectId+hostId，旧流读的是旧主机的文件。
 * start() 内部按 runningKey 去重，因此与 openSession() 重复触发不会多建一次订阅。
 */
watch(selectedHost, () => {
  if (!props.visible) return;
  // openSession() 里给 selectedHost 赋初值也会走到这里；此时传输已由 start() 起好，
  // 再 reset 一次会把刚到位的首帧内容擦掉，所以这里要跳过。
  if (keyOf() === runningKey && isRunning()) return;
  reset();
  start();
});

onMounted(() => { if (props.visible) openSession(); });
onBeforeUnmount(stop);

/**
 * 开启一次观测会话（初始化主机 + 起传输）。
 *
 * ⚠️ 必须在 onMounted 里也走一遍，不能只靠 `watch(() => props.visible)`：
 * 父组件（`ScProjectList.openLiveLog`）是在**同一个 tick** 里同时置 `logProject`（触发 `v-if` 挂载）
 * 和 `logVisible = true`，所以组件**挂载时 `props.visible` 已经是 true**，watch 不产生变化、永不触发。
 * 若此时不补初始化，`selectedHost` 保持 null → `start()` 的 `!key` 分支直接 return →
 * 表现为「**第一次打开抽屉什么都不做**（无订阅、无轮询、面板空着），关掉再开才正常」。
 * 这个缺陷在改造前的轮询版里同样存在，且不会被「开→关→再开」这类验收发现（它只看抽屉有没有打开）。
 */
function openSession() {
  if (selectedHost.value == null) {
    selectedHost.value = props.hostOptions[0]?.value ?? null;
  }
  reset();
  start();
}

/** 状态栏文案：把「传输方式 / 暂停 / 异常」三件事压在一行里，避免用户误判「没有日志」 */
const statusText = computed(() => {
  if (lastError.value) return `异常：${lastError.value}`;
  if (paused.value) return pausedBuffer.value ? `已暂停（缓冲 ${pausedBuffer.value.length} 字符）` : '已暂停';
  if (loading.value) return '读取中...';
  if (transport.value === 'socket') return '实时推送';
  return degradeReason.value ? `轮询降级：${degradeReason.value}` : `每 ${POLL_INTERVAL_MILLIS / 1000}s 轮询（降级）`;
});

function reset() {
  content.value = '';
  cursor.value = null;
  paused.value = false;
  pausedBuffer.value = '';
  lastError.value = '';
  degradeReason.value = '';
}

function keyOf(): string {
  return selectedHost.value == null ? '' : `${props.projectId}:${selectedHost.value}`;
}

function start() {
  const key = keyOf();
  if (!props.visible || !key) return;
  if (key === runningKey && isRunning()) return;
  stop();
  runningKey = key;
  if (socket) {
    startPush();
  } else {
    startPoll();
  }
}

function isRunning(): boolean {
  return pollTimer != null || heartbeatTimer != null || firstFrameTimer != null || unsubPush != null;
}

/* ================== 推送通道 ================== */

function startPush() {
  transport.value = 'socket';
  degradeReason.value = '';
  // 首帧到达前视为「读取中」：否则空面板 + 「暂无日志输出」会让用户误以为项目没打日志
  loading.value = true;
  const mySession = ++sessionId;
  const hostId = selectedHost.value as number;
  subscribedHostId = hostId;
  subscriberId = newSubscriberId(hostId);

  // 先挂监听再发订阅请求：否则「订阅成功 → 后端立刻推首帧」可能抢在监听注册之前，白丢首屏。
  try {
    unsubPush = socket!.subscribe(PUSH_MODULE, PUSH_EVENT, (msg: any) => onPush(mySession, msg));
  } catch {
    unsubPush = undefined;
    fallbackToPoll('日志推送不可用');
    return;
  }

  // 首帧超时兜底：后端没有该订阅接口（老版本）或 socket 已断连时，不能一直空等。
  firstFrameTimer = window.setTimeout(() => {
    firstFrameTimer = undefined;
    if (mySession === sessionId && transport.value === 'socket') {
      fallbackToPoll('未收到日志推送');
    }
  }, PUSH_FIRST_FRAME_TIMEOUT_MILLIS);

  doSubscribe(mySession, hostId, true);
}

/** 订阅 / 续订（心跳）。心跳只是「重复调用」，后端按 subscriberId 幂等续期 */
async function doSubscribe(mySession: number, hostId: number, first: boolean) {
  try {
    const data = await subscribeProjectLog(props.projectId, hostId, subscriberId);
    if (mySession !== sessionId) return;
    if (first) {
      const idle = Number(data?.idleMillis) || 0;
      const period = idle > 0 ? Math.max(5000, Math.floor(idle / 2)) : DEFAULT_HEARTBEAT_MILLIS;
      heartbeatTimer = window.setInterval(() => {
        if (mySession === sessionId) doSubscribe(mySession, hostId, false);
      }, period);
    }
  } catch (e) {
    if (mySession !== sessionId) return;
    // 订阅不上（后端未启用该接口 / 网关拦截 / 网络异常）→ 直接降级，不浪费那 6s 等待
    fallbackToPoll((e as Error).message || '订阅日志推送失败');
  }
}

function onPush(mySession: number, msg: any) {
  if (mySession !== sessionId) return;
  // 三重降级取值：兼容 socket 适配器是否包了一层 data
  const payload = msg?.data?.data ?? msg?.data ?? msg;
  if (!payload) return;
  if (Number(payload.projectId) !== props.projectId) return;
  // 广播是项目级的，同一项目的其它主机也会推到本连接，必须按主机过滤
  if (subscribedHostId != null && payload.hostId != null && Number(payload.hostId) !== subscribedHostId) return;

  // 收到帧即证明推送通道可用，撤掉降级兜底
  if (firstFrameTimer != null) {
    window.clearTimeout(firstFrameTimer);
    firstFrameTimer = undefined;
  }
  loading.value = false;

  const err = payload.error ? String(payload.error) : '';
  lastError.value = err;
  if (payload.cursor != null) cursor.value = Number(payload.cursor);
  const chunk = typeof payload.content === 'string' ? payload.content : '';
  if (chunk) append(chunk);
}

/* ================== 轮询降级通道 ================== */

function startPoll() {
  transport.value = 'poll';
  pollTimer = window.setInterval(poll, POLL_INTERVAL_MILLIS);
  poll();
}

/** 推送不可用 → 清理推送侧资源（含退订），改用 REST 轮询 */
function fallbackToPoll(reason: string) {
  if (transport.value === 'poll') return;
  stopPushOnly();
  transport.value = 'poll';
  degradeReason.value = reason;
  loading.value = false;
  if (props.visible && selectedHost.value != null) startPoll();
}

async function poll() {
  if (paused.value || !selectedHost.value) return;
  try {
    loading.value = true;
    const data = await tailProjectLog(props.projectId, selectedHost.value, cursor.value ?? undefined);
    lastError.value = '';
    if (data.content) {
      append(data.content);
      cursor.value = data.cursor;
    }
  } catch (e) {
    // 日志文件尚未生成属正常态：不弹窗刷屏，但把原因留在面板上，避免用户误以为「没有日志」
    lastError.value = (e as Error).message || '读取日志失败';
  } finally {
    loading.value = false;
  }
}

/* ================== 公共 ================== */

function append(chunk: string) {
  if (paused.value) {
    pausedBuffer.value += chunk;
    if (pausedBuffer.value.length > MAX_CONTENT_CHARS) {
      pausedBuffer.value = pausedBuffer.value.slice(-MAX_CONTENT_CHARS);
    }
    return;
  }
  content.value += chunk;
  if (content.value.length > MAX_CONTENT_CHARS) {
    content.value = content.value.slice(-MAX_CONTENT_CHARS);
  }
  if (autoScroll.value) scrollToBottom();
}

function stop() {
  stopPushOnly();
  if (pollTimer != null) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }
  // 关闭时若仍停在「等待首帧」状态，loading 会残留为 true，重开时状态栏会一直显示「读取中」
  loading.value = false;
  runningKey = '';
}

/** 只清理推送侧（监听 / 心跳 / 首帧兜底 / 后端订阅），保留轮询定时器 */
function stopPushOnly() {
  // 会话号自增：让所有在途回调与迟到帧立即失效
  sessionId++;
  if (firstFrameTimer != null) {
    window.clearTimeout(firstFrameTimer);
    firstFrameTimer = undefined;
  }
  if (heartbeatTimer != null) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  }
  if (unsubPush) {
    try { unsubPush(); } catch { /* socket 已断开时忽略 */ }
    unsubPush = undefined;
  }
  const hostId = subscribedHostId;
  const sid = subscriberId;
  subscribedHostId = null;
  subscriberId = '';
  if (hostId != null && sid) {
    // 退订失败不影响本地清理：后端还有空闲剪枝兜底回收该观察者
    unsubscribeProjectLog(props.projectId, hostId, sid).catch(() => undefined);
  }
}

function newSubscriberId(hostId: number): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `log-${props.projectId}-${hostId}-${Date.now().toString(36)}-${rand}`;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    if (logRef.value) {
      logRef.value.scrollTop = logRef.value.scrollHeight;
    }
  });
}

function clearLog() {
  content.value = '';
  pausedBuffer.value = '';
  // 轮询模式下游标由前端持有，复位后下一轮重新读最近若干行；
  // 推送模式下游标在后端，前端复位无意义（也不会影响采集），仅清屏。
  if (transport.value === 'poll') cursor.value = null;
}

/** 刷新：轮询模式立即拉一次；推送模式重读最近若干行做回显（不动后端采集游标，避免与推送重复） */
async function manualRefresh() {
  if (transport.value === 'poll' || !selectedHost.value) {
    await poll();
    return;
  }
  try {
    loading.value = true;
    const data = await tailProjectLog(props.projectId, selectedHost.value, undefined);
    content.value = data.content || '';
    lastError.value = '';
    if (autoScroll.value) scrollToBottom();
  } catch (e) {
    lastError.value = (e as Error).message || '读取日志失败';
  } finally {
    loading.value = false;
  }
}

function togglePause() {
  paused.value = !paused.value;
  if (!paused.value && pausedBuffer.value) {
    const buffered = pausedBuffer.value;
    pausedBuffer.value = '';
    append(buffered);
  }
}
</script>

<template>
  <ReDrawer
    v-model="drawerVisible"
    :title="`${props.projectName} - 实时日志`"
    :size="760"
  >
    <div class="live-log">
      <div class="log-toolbar">
        <ReSelect
          v-model="selectedHost"
          placeholder="选择主机"
          :data="hostOptions"
          style="width:220px"
        />
        <ReButton layout="square" size="small" icon="Refresh" @click="manualRefresh">刷新</ReButton>
        <ReButton layout="square" size="small" :icon="paused ? 'VideoPlay' : 'VideoPause'" @click="togglePause">
          {{ paused ? '继续' : '暂停' }}
        </ReButton>
        <ReButton layout="square" size="small" icon="Delete" @click="clearLog">清空</ReButton>
        <ReSwitch v-model="autoScroll" />
        <span class="dim" style="font-size:12px">自动滚动</span>
        <div class="spacer" />
        <span class="dim" :class="{ 'log-status-error': !!lastError }" style="font-size:12px">{{ statusText }}</span>
      </div>

      <!--
        安全：日志内容来自被部署主机的日志文件，属不可信输入。
        绝不能使用 v-html —— 远端进程写入 <img src=x onerror=...> 即可在管理员浏览器执行任意脚本。
        这里用文本插值，换行由 .log-view 的 white-space: pre-wrap 保留。
      -->
      <div ref="logRef" class="log-view">
        <span v-if="!content" class="log-placeholder">
          {{ lastError ? `读取日志失败：${lastError}` : '暂无日志输出，确认日志目录配置后等待应用写入...' }}
        </span>
        <template v-else>{{ content }}</template>
      </div>
    </div>
  </ReDrawer>
</template>

<style scoped>
.live-log {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 120px);
}
.log-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.log-view {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  line-height: 1.65;
  color: var(--text-primary);
  background: color-mix(in srgb, var(--bg-page) 70%, #000 12%);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  white-space: pre-wrap;
  word-break: break-all;
}
.log-placeholder { color: var(--text-tertiary); }
.log-status-error { color: var(--danger-color, #d4380d); }
</style>
