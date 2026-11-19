<script setup lang="ts">
/**
 * FRP 内网穿透 —— 配置 + 规则 + 实时信令流面板（服务管理页 FRP 节点专属 UI）。
 *
 * <p>frp 体系没有沿用 SIP 的「单槽注册表」：所有 client 主动外连 frp server 单端口，
 * 规则由服务端统管（显式三元组：目标地址 + 目标端口 + 本地端口）。
 * 本面板是三段式运维台：</p>
 * <ul>
 *   <li><b>① 配置（左）</b>：监听地址 / 端口 / 认证令牌。节点级配置改动
 *       <b>需要重启节点生效</b>（token 是 FrpServer 构造时定死的 final 字段，
 *       host/port 来自节点定义），面板如实提示，不做假「热更」。</li>
 *   <li><b>② 规则（左）</b>：暴露 / 映射双表，新建走服务端下推（EXPOSE/MAP 信令
 *       立即热生效，client 收到后登记本地并起停桥接），撤销下推 DEL 信令。</li>
 *   <li><b>③ 信令流（右）</b>：实时事件终端。AUTH（客户端接入）/ EXPOSE / MAP /
 *       REVOKE / SAVE·STOP·START（配置与重启）逐行追加，由轮询差异 + 本面板动作驱动
 *       ——不伪造事件源，首轮快照只建基线不推事件。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import ReButton from '@repo/ui/re-button';
import ReDialog from '@repo/ui/re-dialog';
import ReForm from '@repo/ui/re-form';
import { ReFormItem } from '@repo/ui/re-kit';
import ReInput from '@repo/ui/re-input';
import ReInputNumber from '@repo/ui/re-input-number';
import ReSelect from '@repo/ui/re-select';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import {
  getServerNode,
  updateServerNode,
  startServerNode,
  stopServerNode,
  getFrpRules,
  pushFrpRule,
  revokeFrpRule,
  type FrpRuleItem,
  type FrpRuleManage,
  type ServerNodeView,
} from '../api';
import { confirmThen } from '../utils/confirmThen';

const props = defineProps<{
  /** FRP 节点 ID */
  nodeId: number | null;
  /** 节点名称（头部展示） */
  nodeName?: string;
}>();

const loading = ref(false);
const manage = ref<FrpRuleManage>({ clients: [], exposes: [], maps: [] });
const node = ref<ServerNodeView | null>(null);
const nodeLoading = ref(false);
const error = ref<string | null>(null);

/** 在线客户端下拉（新建规则时选择接收方） */
const clientOptions = computed(() =>
  manage.value.clients.map(c => ({ label: c, value: c })),
);

/* ==================== 规则检索 / 客户端联动过滤（纯前端体验层） ==================== */

/** 规则关键字（匹配 clientId / targetHost / 端口 / ruleId） */
const ruleKeyword = ref('');
/** 联动过滤：当前选中的在线客户端（空 = 全部） */
const clientFilter = ref('');

function keywordHit(r: FrpRuleItem, kw: string): boolean {
  if (!kw) return true;
  const hay = `${r.clientId} ${r.targetHost} ${r.targetPort} ${r.localPort} ${r.ruleId}`.toLowerCase();
  return hay.includes(kw);
}

/** 暴露表过滤结果（关键字 + 客户端联动） */
const filteredExposes = computed(() => {
  const kw = ruleKeyword.value.trim().toLowerCase();
  return manage.value.exposes.filter(r =>
    (!clientFilter.value || r.clientId === clientFilter.value) && keywordHit(r, kw),
  );
});

/** 映射表过滤结果（关键字 + 客户端联动） */
const filteredMaps = computed(() => {
  const kw = ruleKeyword.value.trim().toLowerCase();
  return manage.value.maps.filter(r =>
    (!clientFilter.value || r.clientId === clientFilter.value) && keywordHit(r, kw),
  );
});

/** 切换客户端 chip：再点一次取消过滤 */
function toggleClientFilter(id: string): void {
  clientFilter.value = clientFilter.value === id ? '' : id;
}

/* ==================== 信令流 ==================== */

type SignalKind =
  | 'auth'      // 客户端接入
  | 'expose'    // 暴露规则下推/上报
  | 'map'       // 映射规则下推/上报
  | 'revoke'    // 规则撤销
  | 'apply'     // 配置保存/重启
  | 'system';   // 系统提示

interface SignalLine {
  /** 事件序号（逆序排列时作为 key） */
  seq: number;
  kind: SignalKind;
  /** 主文本（左侧标签 / monospace 内容） */
  text: string;
  /** 副文本（事件标签：AUTH / EXPOSE / MAP · clientId …） */
  meta: string;
  /** 事件发生时刻（本地时间 HH:mm:ss） */
  time: string;
  /** 是否最新一条（高亮） */
  fresh?: boolean;
}

const MAX_SIGNALS = 80;
const signals = ref<SignalLine[]>([]);
const signalSeq = ref(0);
const signalBoxEl = ref<HTMLElement | null>(null);
const signalPaused = ref(false);

/** 信令类型筛选（ALL=全部） */
const signalFilter = ref<'ALL' | SignalKind>('ALL');
const signalFilters: Array<{ label: string; value: 'ALL' | SignalKind }> = [
  { label: '全部', value: 'ALL' },
  { label: 'AUTH', value: 'auth' },
  { label: 'EXPOSE', value: 'expose' },
  { label: 'MAP', value: 'map' },
  { label: 'REVOKE', value: 'revoke' },
  { label: '配置/重启', value: 'apply' },
  { label: '系统', value: 'system' },
];

/** 按类型筛选后的信令（模板渲染用） */
const filteredSignals = computed(() =>
  signalFilter.value === 'ALL' ? signals.value : signals.value.filter(s => s.kind === signalFilter.value),
);

/** 恢复滚动时清零未读计数 */
watch(signalPaused, paused => {
  if (!paused) pausedNewCount.value = 0;
});

/** 清空信令流（仅清面板缓冲，不影响节点） */
function clearSignals(): void {
  signals.value = [];
  pausedNewCount.value = 0;
  signalFilter.value = 'ALL';
}

/** 复制当前信令流为纯文本（按时间正序，便于贴到工单排查） */
async function copySignals(): Promise<void> {
  if (!signals.value.length) {
    message.warning('信令流为空，无需复制');
    return;
  }
  const text = signals.value
    .slice()
    .reverse()
    .map(s => `[${s.time}] ${s.meta ? s.meta + ' ' : ''}${s.text}`)
    .join('\n');
  try {
    await navigator.clipboard.writeText(text);
    message.success(`已复制 ${signals.value.length} 条信令`);
  } catch {
    message.error('复制失败，请手动选择复制');
  }
}

/** 之前一次轮询的客户端/规则快照，用于差异推导事件 */
let lastClients = new Set<string>();
let lastExposeKeys = new Set<string>();
let lastMapKeys = new Set<string>();

/** 暂停期间累计的未读新事件数（恢复时清零） */
const pausedNewCount = ref(0);

/** 本地时间 HH:mm:ss（信令流时间戳，面板内展示用本地时区即可） */
function nowLabel(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function pushSignal(kind: SignalKind, text: string, meta = ''): void {
  signalSeq.value += 1;
  signals.value = [
    { seq: signalSeq.value, kind, text, meta, time: nowLabel(), fresh: true },
    ...signals.value.map(s => ({ ...s, fresh: false })),
  ].slice(0, MAX_SIGNALS);
  // 暂停 = 冻结视口：新事件仍入列，但不自动滚顶，方便比对历史；未读计数 +1
  if (signalPaused.value) {
    pausedNewCount.value += 1;
  } else {
    void scrollSignalTop();
  }
}

function scrollSignalTop(): void {
  void nextTick(() => {
    const el = signalBoxEl.value;
    if (el) el.scrollTop = 0;
  });
}

/** 客户端/规则快照 key（规则用 ruleId 判增减，不依赖端口） */
function snapshotKeys(items: FrpRuleItem[]): Set<string> {
  return new Set(items.map(r => r.ruleId));
}

/** 是否已完成首轮基线。首轮快照只建基线不推事件——把「现状」伪装成「事件」就是造假信令 */
let baselineReady = false;

function deriveModel(): void {
  const c = manage.value;
  const clients = new Set(c.clients);
  const exposes = snapshotKeys(c.exposes);
  const maps = snapshotKeys(c.maps);

  if (!baselineReady) {
    // 第一轮只落下快照，什么都不报；此后轮询差异才是真实事件。
    // （面板刚打开时在线客户端/已有规则是历史状态，不是刚发生的 AUTH/EXPOSE。）
    baselineReady = true;
  } else {
    for (const id of clients) {
      if (!lastClients.has(id)) pushSignal('auth', `客户端接入  ${id}`, 'AUTH');
    }
    for (const id of lastClients) {
      if (!clients.has(id)) pushSignal('system', `客户端离线  ${id}`, '断开');
    }
    for (const r of c.exposes) {
      if (!lastExposeKeys.has(r.ruleId)) {
        pushSignal('expose', `${r.targetHost}:${r.targetPort} → local:${r.localPort}`, `EXPOSE · ${r.clientId}`);
      }
    }
    for (const r of c.maps) {
      if (!lastMapKeys.has(r.ruleId)) {
        pushSignal('map', `local:${r.localPort} → ${r.targetHost}:${r.targetPort}`, `MAP · ${r.clientId}`);
      }
    }
  }
  // 规则消失（撤销）已在 revoke 操作里显式补 REVOKE 行；轮询差异只报新增/接入，
  // 避免把「客户端心跳抖动导致的瞬时不在线」误当成撤销事件。

  lastClients = clients;
  lastExposeKeys = exposes;
  lastMapKeys = maps;
}

/** 显式操作补信令（新建/撤销/配置），动作本身即事件，不依赖轮询差异 */
function signalForAction(kind: SignalKind, text: string, meta = ''): void {
  pushSignal(kind, text, meta);
}

/* ==================== 数据加载 ==================== */

async function loadNode(): Promise<void> {
  if (!props.nodeId) {
    node.value = null;
    return;
  }
  nodeLoading.value = true;
  try {
    node.value = await getServerNode(props.nodeId);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    nodeLoading.value = false;
  }
}

async function reload(): Promise<void> {
  if (!props.nodeId) {
    manage.value = { clients: [], exposes: [], maps: [] };
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const fresh = await getFrpRules(props.nodeId);
    manage.value = fresh;
    deriveModel();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

/** 重建轮询基线：清空差异锚点，下一次 reload 只落快照不推事件。
 *  用于「节点重启/保存配置会强制所有客户端断开重连」之后——那是我们自己的动作，
 *  不该把随之而来的断线报成真实离线事件。 */
function resetBaseline(): void {
  lastClients = new Set();
  lastExposeKeys = new Set();
  lastMapKeys = new Set();
  baselineReady = false;
}

watch(() => props.nodeId, () => {
  void loadNode();
  void reload();
  resetBaseline();
});
onMounted(() => {
  void loadNode();
  void reload();
  pollTimer = window.setInterval(() => void reload(), 8_000);
});
onUnmounted(() => {
  if (pollTimer) window.clearInterval(pollTimer);
});
let pollTimer: number | undefined;

/** 父级（页面 Tab / 抽屉）在动作后调用：静默重取 */
defineExpose({ reload });

/* ==================== 配置保存（重启生效） ==================== */

const cfgForm = ref({
  host: '0.0.0.0',
  port: 19470,
  token: '',
});
const savingCfg = ref(false);
const restarting = ref(false);

/** 随机生成 32 位十六进制令牌（体验层辅助；真实校验以后端为准） */
function genToken(): void {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  cfgForm.value.token = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
  message.success('已生成随机令牌，记得保存');
}

/** 复制令牌到剪贴板 */
async function copyToken(): Promise<void> {
  if (!cfgForm.value.token) {
    message.warning('令牌为空，无法复制');
    return;
  }
  try {
    await navigator.clipboard.writeText(cfgForm.value.token);
    message.success('令牌已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动选择复制');
  }
}

function fillCfg(n: ServerNodeView | null): void {
  if (!n) return;
  cfgForm.value = {
    host: n.host || '0.0.0.0',
    port: n.port ?? 19470,
    token: typeof n.config?.token === 'string' ? n.config.token : '',
  };
}
watch(() => node.value, fillCfg, { immediate: true });

const hasCfgChange = computed(
  () =>
    !!node.value &&
    (cfgForm.value.host !== (node.value.host || '0.0.0.0') ||
      cfgForm.value.port !== (node.value.port ?? 19470) ||
      cfgForm.value.token !== (typeof node.value.config?.token === 'string' ? node.value.config.token : '')),
);

async function saveCfg(): Promise<void> {
  if (!props.nodeId || !node.value) return;
  if (!cfgForm.value.host.trim()) {
    message.warning('监听地址不能为空');
    return;
  }
  if (!Number.isInteger(cfgForm.value.port) || cfgForm.value.port < 1 || cfgForm.value.port > 65535) {
    message.warning('监听端口需为 1-65535');
    return;
  }
  const ok = await confirmThen(
    message.confirm,
    '保存将重启节点使配置生效，期间所有客户端会短暂断开并自动重连。确认保存？',
    '保存配置',
    '保存',
    '取消',
    'warning',
  );
  if (!ok) return;
  savingCfg.value = true;
  try {
    // 保存即重启：客户端会全体断开重连。必须在动作前重建基线——stop→start 的空窗期里
    // 8s 轮询会观察到 clients 消失，若此时旧基线仍在，就会把这次重启误报成「离线」假事件。
    resetBaseline();
    // 关键：update 是整体覆盖语义（先 stop → applyRequest 全量 → startIfEnabled）。
    // 必须把节点现状字段全量回传，否则 filters / enabled 会被清空；同时保存本身
    // 就会重启节点，因此不需要单独的「重启」动作参与 —— 语义即「保存并重启生效」。
    const cur = node.value;
    await updateServerNode(props.nodeId, {
      name: cur.name,
      protocol: cur.protocol,
      engine: cur.engine,
      host: cfgForm.value.host.trim(),
      port: cfgForm.value.port,
      enabled: cur.enabled,
      remark: cur.remark,
      config: { ...(cur.config ?? {}), token: cfgForm.value.token.trim() },
      filters: cur.filters,
    });
    // update 的先 stop → startIfEnabled 语义：enabled=1 保存即重启生效；enabled=0 只保存定义。
    // 文案如实区分，不夸大「已重启」。
    signalForAction('apply',
      cur.enabled === 1 ? '配置已保存，节点重启生效' : '配置已保存（节点未启用，仅保存定义）', 'SAVE');
    message.success(cur.enabled === 1 ? '配置已保存，节点已重启生效' : '配置已保存，节点未启用不拉起');
    await loadNode();
    await reload();
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e));
  } finally {
    savingCfg.value = false;
  }
}

/** 手动重启节点（stop → start）：让已保存的节点级配置（端口/令牌）生效，或强制全部客户端重连 */
async function restartNode(): Promise<void> {
  if (!props.nodeId) return;
  const ok = await confirmThen(
    message.confirm,
    '确认重启该 FRP 节点？重启期间客户端会短暂断开并自动重连。',
    '重启节点',
    '重启',
    '取消',
    'warning',
  );
  if (!ok) return;
  restarting.value = true;
  try {
    // 和 saveCfg 同理：重启会让客户端全体断开重连。若等 stop 完成后再重建基线，
    // 空窗期的 8s 轮询会把这次重启误报成「客户端离线」假事件——必须先重建基线再动作。
    resetBaseline();
    await stopServerNode(props.nodeId);
    signalForAction('apply', '节点已停止，正在重启…', 'STOP');
    await startServerNode(props.nodeId);
    signalForAction('apply', '节点已启动，客户端重新接入', 'START');
    message.success('节点已重启');
    await loadNode();
    await reload();
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e));
  } finally {
    restarting.value = false;
  }
}

const starting = ref(false);
const stopping = ref(false);

/** 启动节点（已停止/异常 → RUNNING）。启动不改动任何配置。 */
async function startNode(): Promise<void> {
  if (!props.nodeId || node.value?.status === 'RUNNING') return;
  starting.value = true;
  try {
    resetBaseline();
    await startServerNode(props.nodeId);
    signalForAction('apply', '节点已启动，客户端重新接入', 'START');
    message.success('节点已启动');
    await loadNode();
    await reload();
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e));
  } finally {
    starting.value = false;
  }
}

/** 停止节点（RUNNING → 停止）。会断开所有客户端，需确认。 */
async function stopNode(): Promise<void> {
  if (!props.nodeId || node.value?.status !== 'RUNNING') return;
  const ok = await confirmThen(
    message.confirm,
    '确认停止该 FRP 节点？所有客户端将断开连接。',
    '停止节点',
    '停止',
    '取消',
    'warning',
  );
  if (!ok) return;
  stopping.value = true;
  try {
    resetBaseline();
    await stopServerNode(props.nodeId);
    signalForAction('apply', '节点已停止', 'STOP');
    message.success('节点已停止');
    await loadNode();
    await reload();
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e));
  } finally {
    stopping.value = false;
  }
}

/* ==================== 新建规则 ==================== */

const createVisible = ref(false);
const createType = ref<'expose' | 'map'>('expose');
const createForm = ref({
  clientId: '',
  targetHost: '',
  targetPort: 8080,
  localPort: 8080,
});
const saving = ref(false);

function openCreate(type: 'expose' | 'map'): void {
  createType.value = type;
  createForm.value = {
    clientId: manage.value.clients[0] ?? '',
    targetHost: '',
    targetPort: 8080,
    localPort: 8080,
  };
  createVisible.value = true;
}

async function submitCreate(): Promise<void> {
  const f = createForm.value;
  if (!f.clientId) {
    message.warning('请选择接收规则的客户端');
    return;
  }
  if (!f.targetHost?.trim()) {
    message.warning('目标地址不能为空');
    return;
  }
  if (!Number.isInteger(f.targetPort) || f.targetPort < 1 || f.targetPort > 65535) {
    message.warning('目标端口需为 1-65535');
    return;
  }
  if (!Number.isInteger(f.localPort) || f.localPort < 1 || f.localPort > 65535) {
    message.warning('本地端口需为 1-65535');
    return;
  }
  // 体验层预检：同一客户端 + 同一类型下 localPort 重复大概率冲突。
  // 仅作交互提示，最终判重与冲突拒绝仍以后端为准（前端不实现业务规则）。
  const samePool = createType.value === 'expose' ? manage.value.exposes : manage.value.maps;
  if (samePool.some(r => r.clientId === f.clientId && r.localPort === f.localPort)) {
    const go = await confirmThen(
      message.confirm,
      `客户端 ${f.clientId} 已有使用本地端口 ${f.localPort} 的同类规则，继续下推可能冲突。仍要下推？`,
      '端口重复提醒',
      '仍要下推',
      '取消',
      'warning',
    );
    if (!go) return;
  }
  saving.value = true;
  try {
    await pushFrpRule(props.nodeId!, {
      clientId: f.clientId,
      type: createType.value,
      targetHost: f.targetHost.trim(),
      targetPort: f.targetPort,
      localPort: f.localPort,
    });
    message.success(createType.value === 'expose' ? '暴露规则已下推' : '映射规则已下推');
    signalForAction(createType.value === 'expose' ? 'expose' : 'map',
      createType.value === 'expose'
        ? `${f.targetHost.trim()}:${f.targetPort} → local:${f.localPort}`
        : `local:${f.localPort} → ${f.targetHost.trim()}:${f.targetPort}`,
      `${createType.value === 'expose' ? 'EXPOSE' : 'MAP'} · ${f.clientId}`);
    createVisible.value = false;
    void reload();
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e));
  } finally {
    saving.value = false;
  }
}

/* ==================== 撤销规则 ==================== */

async function revoke(type: 'expose' | 'map', rule: FrpRuleItem): Promise<void> {
  const kind = type === 'expose' ? '暴露规则' : '映射规则';
  const ok = await confirmThen(
    message.confirm,
    `确认撤销该${kind}？`,
    '撤销规则',
    '撤销',
    '取消',
    'warning',
  );
  if (!ok || !props.nodeId) return;
  try {
    await revokeFrpRule(props.nodeId, type, rule.ruleId);
    message.success('规则已撤销');
    signalForAction('revoke', `${rule.targetHost}:${rule.targetPort}（${rule.ruleId.slice(0, 8)}）`, `REVOKE · ${rule.clientId}`);
    void reload();
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e));
  }
}

/** 复制规则到新建弹窗（仅预填参数，不改动原规则） */
function copyRule(type: 'expose' | 'map', rule: FrpRuleItem): void {
  createType.value = type;
  createForm.value = {
    clientId: rule.clientId,
    targetHost: rule.targetHost,
    targetPort: rule.targetPort,
    localPort: rule.localPort,
  };
  createVisible.value = true;
  message.info('已带入原规则参数，确认后下推为新规则');
}

/* ==================== 展示口径 ==================== */

const exposeColumns: ReTableColumn[] = [
  { prop: 'targetHost', label: '目标地址', minWidth: 120, showOverflowTooltip: true, sortable: true },
  { prop: 'targetPort', label: '目标端口', width: 96, align: 'right', sortable: true },
  { prop: 'localPort', label: '本地端口', width: 96, align: 'right', sortable: true },
  { prop: 'clientId', label: '提供方客户端', minWidth: 140, showOverflowTooltip: true, sortable: true },
  { prop: 'ruleId', label: '操作', slot: 'ruleId', width: 84, align: 'center' },
];

const mapColumns: ReTableColumn[] = [
  { prop: 'targetHost', label: '目标地址', minWidth: 120, showOverflowTooltip: true, sortable: true },
  { prop: 'targetPort', label: '目标端口', width: 96, align: 'right', sortable: true },
  { prop: 'localPort', label: '本地端口', width: 96, align: 'right', sortable: true },
  { prop: 'clientId', label: '访问方客户端', minWidth: 140, showOverflowTooltip: true, sortable: true },
  { prop: 'ruleId', label: '操作', slot: 'ruleId', width: 84, align: 'center' },
];
</script>

<template>
  <div class="sc-frp">
    <!-- 头部：节点名 + 状态 + 计数 + 动作 -->
    <div class="sc-frp__bar">
      <div class="sc-frp__bar-left">
        <i class="sc-frp__dot" :class="node?.status === 'RUNNING' ? 'is-run' : node?.status === 'ERROR' ? 'is-err' : 'is-stop'" />
        <b class="sc-frp__node">{{ nodeName ?? 'FRP 服务器' }}</b>
        <span class="sc-frp__count">{{ node?.status === 'RUNNING' ? '运行中' : node?.status === 'ERROR' ? '异常' : '已停止' }}</span>
        <span class="sc-frp__sep">·</span>
        <span class="sc-frp__count mono">{{ node?.host || '0.0.0.0' }}:{{ node?.port ?? 19470 }}</span>
        <span class="sc-frp__sep">·</span>
        <span class="sc-frp__count">在线 {{ manage.clients.length }} 客户端</span>
      </div>
      <div class="sc-frp__bar-right">
        <ReButton layout="square" icon="Refresh" :loading="loading" tip="刷新" @click="reload" />
      </div>
    </div>

    <!-- 在线客户端 chips + 规则检索（联动过滤双表，纯前端） -->
    <div class="sc-frp__clients">
      <div class="sc-frp__chips">
        <span class="sc-frp__chips-label">在线客户端</span>
        <template v-if="manage.clients.length">
          <button
            v-for="c in manage.clients"
            :key="c"
            type="button"
            class="sc-frp__chip"
            :class="{ on: clientFilter === c }"
            :title="clientFilter === c ? '取消按该客户端过滤' : '只看该客户端的规则'"
            @click="toggleClientFilter(c)"
          >{{ c }}</button>
        </template>
        <span v-else class="sc-frp__chips-empty">暂无在线客户端</span>
        <span v-if="clientFilter" class="sc-frp__chips-clear" role="button" @click="clientFilter = ''">清除过滤</span>
      </div>
      <ReInput
        v-model="ruleKeyword"
        class="sc-frp__search"
        placeholder="搜索规则：客户端 / 地址 / 端口"
        clearable
      />
    </div>

    <p v-if="error" class="sc-frp__error">{{ error }}</p>

    <!-- ============ 主区：左（配置 + 规则）/ 右（信令流） ============ -->
    <div class="sc-frp__main">
      <!-- 左列 -->
      <div class="sc-frp__left">
        <!-- 配置卡 -->
        <section class="sc-frp__card">
          <header class="sc-frp__card-head">
            <div>
              <b>节点配置</b>
              <span class="sc-frp__hint">监听地址 / 端口 / 认证令牌</span>
            </div>
            <span v-if="hasCfgChange" class="sc-frp__dirty">● 有未保存改动</span>
          </header>
          <div class="sc-frp__cfg" v-loading="nodeLoading">
            <div class="sc-frp__frow">
              <label>监听地址</label>
              <ReInput v-model="cfgForm.host" placeholder="0.0.0.0" class="sc-frp__fval" />
            </div>
            <div class="sc-frp__frow">
              <label>监听端口</label>
              <ReInputNumber v-model="cfgForm.port" :min="1" :max="65535" class="sc-frp__fval" />
            </div>
            <div class="sc-frp__frow">
              <label>认证令牌</label>
              <div class="sc-frp__fval sc-frp__token">
                <ReInput v-model="cfgForm.token" type="password" show-password placeholder="chua-frp-default-token" class="sc-frp__token-input" />
                <ReButton layout="square" icon="Key" tip="随机生成令牌" @click="genToken" />
                <ReButton layout="square" icon="CopyDocument" tip="复制令牌" @click="copyToken" />
              </div>
            </div>
            <p class="sc-frp__note">节点级参数（端口 / 令牌）在 FrpServer 构造时定死，保存后<b>需重启节点</b>才生效；规则下推不在此列。</p>
            <div class="sc-frp__cfg-actions">
              <ReButton :loading="savingCfg" icon="Check" :show-text="true" :disabled="!hasCfgChange || !node" @click="saveCfg">保存配置</ReButton>
              <ReButton :loading="restarting" icon="RefreshRight" :show-text="true" :disabled="node?.status !== 'RUNNING'" @click="restartNode">重启节点</ReButton>
              <ReButton v-if="node?.status === 'RUNNING'" :loading="stopping" icon="SwitchButton" :show-text="true" @click="stopNode">停止节点</ReButton>
              <ReButton v-else :loading="starting" icon="CaretRight" :show-text="true" :disabled="!node" @click="startNode">启动节点</ReButton>
            </div>
          </div>
        </section>

        <!-- 规则卡 -->
        <section class="sc-frp__card sc-frp__card--rules">
          <header class="sc-frp__card-head">
            <div>
              <b>暴露规则</b>
              <span class="sc-frp__hint">提供方 · localPort 上的服务以 target 对外提供</span>
            </div>
            <ReButton layout="square" type="primary" icon="Plus"
              :tip="manage.clients.length ? '新建暴露规则' : '暂无在线客户端，无法下推规则'"
              :disabled="!manage.clients.length" @click="openCreate('expose')" />
          </header>
          <div class="sc-frp__table">
            <ReTable
              v-loading="loading"
              :data="filteredExposes"
              :columns="exposeColumns"
              :pagination="false"
              :border="false"
              stripe
              height="100%"
              :empty-text="manage.exposes.length ? '没有匹配的规则' : '还没有暴露规则'"
              table-id="frp-exposes"
            >
              <!-- 空态：面板自带纯文本空态。ReTable 默认空态走 ReEmpty plot 布局，
                   描述文字由 hairline 图绘制、不进 DOM，关键字筛选结果不可见，故这里接管 #empty。 -->
              <template #empty="{ description }">
                <div class="sc-frp__empty">{{ description }}</div>
              </template>
              <template #col-ruleId="{ row }">
                <ReButton link icon="Delete" tip="撤销这条规则" @click="revoke('expose', row as FrpRuleItem)" />
                <ReButton link icon="CopyDocument" tip="复制参数到新建" @click="copyRule('expose', row as FrpRuleItem)" />
              </template>
            </ReTable>
          </div>
        </section>

        <!-- 映射规则卡 -->
        <section class="sc-frp__card sc-frp__card--rules">
          <header class="sc-frp__card-head">
            <div>
              <b>映射规则</b>
              <span class="sc-frp__hint">访问方 · 本机监听 localPort 即达远端 target</span>
            </div>
            <ReButton layout="square" type="primary" icon="Plus"
              :tip="manage.clients.length ? '新建映射规则' : '暂无在线客户端，无法下推规则'"
              :disabled="!manage.clients.length" @click="openCreate('map')" />
          </header>
          <div class="sc-frp__table">
            <ReTable
              v-loading="loading"
              :data="filteredMaps"
              :columns="mapColumns"
              :pagination="false"
              :border="false"
              stripe
              height="100%"
              :empty-text="manage.maps.length ? '没有匹配的规则' : '还没有映射规则'"
              table-id="frp-maps"
            >
              <!-- 空态：同暴露规则表，接管 #empty 保证筛选空态文案真实可见 -->
              <template #empty="{ description }">
                <div class="sc-frp__empty">{{ description }}</div>
              </template>
              <template #col-ruleId="{ row }">
                <ReButton link icon="Delete" tip="撤销这条规则" @click="revoke('map', row as FrpRuleItem)" />
                <ReButton link icon="CopyDocument" tip="复制参数到新建" @click="copyRule('map', row as FrpRuleItem)" />
              </template>
            </ReTable>
          </div>
        </section>
      </div>

      <!-- 右列：信令流 -->
      <section class="sc-frp__card sc-frp__stream">
        <header class="sc-frp__card-head">
          <div>
            <b>实时信令流</b>
            <span class="sc-frp__hint">AUTH 接入 / EXPOSE / MAP / REVOKE · 每 8s 静默对齐一次，无事件不打扰</span>
          </div>
          <div class="sc-frp__stream-tools">
            <div class="sc-frp__sig-filters">
              <button
                v-for="f in signalFilters"
                :key="f.value"
                type="button"
                class="sc-frp__sig-filter"
                :class="{ on: signalFilter === f.value }"
                @click="signalFilter = f.value"
              >{{ f.label }}</button>
            </div>
            <ReButton layout="square" icon="CopyDocument" tip="复制信令文本" @click="copySignals" />
            <ReButton layout="square" icon="Delete" tip="清空信令流" @click="clearSignals" />
            <ReButton
              layout="square"
              :icon="signalPaused ? 'VideoPlay' : 'VideoPause'"
              :tip="signalPaused ? '恢复滚动' : '暂停滚动'"
              @click="signalPaused = !signalPaused"
            />
          </div>
        </header>
        <div class="sc-frp__stream-body">
          <div class="sc-frp__stream-pad" />
          <ul ref="signalBoxEl" class="sc-frp__lines">
            <li v-for="s in filteredSignals" :key="s.seq" class="sc-frp__line" :class="[`is-${s.kind}`, { fresh: s.fresh }]">
              <span class="sc-frp__line-time mono">{{ s.time }}</span>
              <span class="sc-frp__line-kind">{{ s.meta }}</span>
              <span class="sc-frp__line-text">{{ s.text }}</span>
            </li>
          </ul>
          <p v-if="!filteredSignals.length" class="sc-frp__stream-empty">
            {{ signals.length ? '当前筛选条件下暂无信令' : '还没有信令 —— 客户端接入、规则下推/撤销时会出现在这里' }}
          </p>
          <div v-if="signalPaused && pausedNewCount > 0" class="sc-frp__stream-unread">暂停中 · 新信令 +{{ pausedNewCount }}</div>
        </div>
      </section>
    </div>

    <!-- 新建规则弹窗 -->
    <ReDialog
      v-model="createVisible"
      :title="createType === 'expose' ? '新建暴露规则' : '新建映射规则'"
      width="480px"
      :close-on-click-modal="false"
    >
      <ReForm label-width="88px">
        <ReFormItem label="规则类型">
          <div class="sc-frp__type">
            <button type="button" class="sc-frp__type-btn" :class="{ on: createType === 'expose' }"
              @click="createType = 'expose'">暴露（提供方）</button>
            <button type="button" class="sc-frp__type-btn" :class="{ on: createType === 'map' }"
              @click="createType = 'map'">映射（访问方）</button>
          </div>
        </ReFormItem>
        <ReFormItem label="接收客户端">
          <ReSelect v-model="createForm.clientId" style="width: 100%" :data="clientOptions" filterable />
        </ReFormItem>
        <ReFormItem label="目标地址">
          <ReInput v-model="createForm.targetHost" placeholder="远端要访问的服务地址，如 192.168.1.50" />
        </ReFormItem>
        <ReFormItem label="目标端口">
          <ReInputNumber v-model="createForm.targetPort" :min="1" :max="65535" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="本地端口">
          <ReInputNumber v-model="createForm.localPort" :min="1" :max="65535" style="width: 100%" />
          <div class="sc-frp__quick-ports">
            <button
              v-for="p in [80, 443, 3306, 6379, 8080]"
              :key="p"
              type="button"
              class="sc-frp__quick-port"
              @click="createForm.localPort = p"
            >{{ p }}</button>
          </div>
        </ReFormItem>
        <p class="sc-frp__tip">
          {{ createType === 'expose'
            ? '客户端本机 localPort 上的服务，将以「目标地址:目标端口」为逻辑标识对外提供。'
            : '客户端本机监听 localPort，访问它即访问远端「目标地址:目标端口」的服务。' }}
        </p>
      </ReForm>
      <template #footer>
        <ReButton @click="createVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Check" :show-text="true" :loading="saving" @click="submitCreate">下推规则</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.sc-frp {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 0;
  color: var(--text-primary, #1f2329);
  font-size: 13px;
}

.sc-frp__bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sc-frp__bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.sc-frp__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-strong, #d0d3d6);
  &.is-run { background: var(--success-500, #00b42a); }
  &.is-err { background: var(--danger-600, #d83931); }
}

.sc-frp__node {
  font-size: 15px;
  font-weight: 600;
}

.sc-frp__count {
  font-size: 12px;
  color: var(--text-secondary, #646a73);
}

.sc-frp__sep {
  color: var(--border-strong, #d0d3d6);
}

.mono {
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, 'Courier New', monospace);
}

.sc-frp__error {
  margin: 0;
  color: var(--danger-600, #d83931);
  font-size: 12px;
}

/* ============ 主区 ============ */
.sc-frp__main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 10px;
}

@media (max-width: 900px) {
  .sc-frp__main { grid-template-columns: 1fr; }
}

.sc-frp__left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
}

.sc-frp__card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #e8eaec);
  border-radius: var(--radius-lg, 8px);
  overflow: hidden;
  &.sc-frp__card--rules { flex: 1; }
}

.sc-frp__card-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, #e8eaec);

  b { font-size: 13px; font-weight: 600; }

  .sc-frp__hint {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    font-weight: 400;
    color: var(--text-tertiary, #8a9099);
  }
}

.sc-frp__dirty {
  font-size: 11px;
  color: var(--warning-600, #ff7d00);
}

/* ============ 配置 ============ */
.sc-frp__cfg {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sc-frp__frow {
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    flex: none;
    width: 64px;
    font-size: 12px;
    color: var(--text-secondary, #646a73);
  }
}

.sc-frp__fval {
  flex: 1;
  min-width: 0;
}

.sc-frp__note {
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-tertiary, #8a9099);
}

.sc-frp__cfg-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ============ 规则表 ============ */
.sc-frp__table {
  flex: 1;
  min-height: 0;
}

/* ============ 信令流 ============ */
.sc-frp__stream {
  flex: 1;
  min-height: 0;
}

.sc-frp__stream-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.sc-frp__stream-pad {
  flex: 1;
  min-height: 24px;
}

.sc-frp__lines {
  flex: none;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  max-height: 100%;
  scroll-behavior: smooth;
}

.sc-frp__line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 3px 12px;
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, 'Courier New', monospace);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, #646a73);
  border-left: 2px solid transparent;
  &.fresh { background: color-mix(in srgb, var(--el-color-primary, #3370ff) 10%, var(--bg-container, #fff)); }

  &.is-auth { border-left-color: var(--success-500, #00b42a); }
  &.is-expose, &.is-map { border-left-color: var(--el-color-primary, #3370ff); }
  &.is-revoke { border-left-color: var(--danger-600, #d83931); }
  &.is-apply { border-left-color: var(--warning-600, #ff7d00); }
  &.is-system { border-left-color: var(--border-strong, #d0d3d6); }
}

.sc-frp__line-time {
  flex: none;
  font-size: 11px;
  color: var(--text-tertiary, #8a9099);
  width: 64px;
}

.sc-frp__line-text {
  min-width: 0;
  color: var(--text-primary, #1f2329);
}

.sc-frp__stream-empty {
  position: absolute;
  left: 12px;
  bottom: 12px;
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary, #8a9099);
}

/* ============ 新建弹窗 ============ */
.sc-frp__type {
  display: flex;
  gap: 8px;
}

.sc-frp__type-btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-secondary, #646a73);
  background: var(--bg-page, #f7f8fa);
  border: 1px solid var(--border-subtle, #e8eaec);
  border-radius: var(--radius, 6px);
  cursor: pointer;
  transition: all 0.15s;

  &.on {
    color: var(--brand-600, #3370ff);
    background: var(--brand-50, #eaf1ff);
    border-color: var(--brand-300, #9db9ff);
  }
}

.sc-frp__tip {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary, #8a9099);
  line-height: 1.6;
}

/* ============ 在线客户端 chips / 规则检索 ============ */
.sc-frp__clients {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sc-frp__chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.sc-frp__chips-label {
  font-size: 12px;
  color: var(--text-tertiary, #8a9099);
}

.sc-frp__chip {
  max-width: 220px;
  padding: 2px 10px;
  font-size: 12px;
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, 'Courier New', monospace);
  color: var(--text-secondary, #646a73);
  background: var(--bg-page, #f7f8fa);
  border: 1px solid var(--border-subtle, #e8eaec);
  border-radius: 999px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.15s;

  &:hover { border-color: var(--brand-300, #9db9ff); }

  &.on {
    color: var(--brand-600, #3370ff);
    background: var(--brand-50, #eaf1ff);
    border-color: var(--brand-300, #9db9ff);
  }
}

.sc-frp__chips-empty {
  font-size: 12px;
  color: var(--text-tertiary, #8a9099);
}

/* 规则表空态（#empty 插槽接管）：在 vxe 空块内居中显示一行说明文字 */
.sc-frp__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 96px;
  padding: 18px 12px;
  box-sizing: border-box;
  font-size: 13px;
  color: var(--text-tertiary, #8a9099);
  user-select: none;
}

.sc-frp__chips-clear {
  font-size: 12px;
  color: var(--brand-600, #3370ff);
  cursor: pointer;

  &:hover { text-decoration: underline; }
}

.sc-frp__search {
  flex: none;
  width: 220px;
  margin-left: auto;
}

/* ============ 令牌行（脱敏 / 生成 / 复制） ============ */
.sc-frp__token {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sc-frp__token-input {
  flex: 1;
  min-width: 0;
}

/* ============ 信令流工具 ============ */
.sc-frp__stream-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sc-frp__sig-filters {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.sc-frp__sig-filter {
  padding: 2px 8px;
  font-size: 11px;
  color: var(--text-secondary, #646a73);
  background: transparent;
  border: 1px solid var(--border-subtle, #e8eaec);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: var(--brand-300, #9db9ff); }

  &.on {
    color: var(--brand-600, #3370ff);
    background: var(--brand-50, #eaf1ff);
    border-color: var(--brand-300, #9db9ff);
  }
}

.sc-frp__line-kind {
  flex: none;
  min-width: 56px;
  font-size: 11px;
  color: var(--text-tertiary, #8a9099);
}

.sc-frp__stream-unread {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 2px 10px;
  font-size: 12px;
  color: var(--warning-600, #ff7d00);
  background: var(--bg-container, #fff);
  border: 1px solid var(--warning-600, #ff7d00);
  border-radius: 999px;
  opacity: 0.92;
}

/* ============ 快捷端口 ============ */
.sc-frp__quick-ports {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.sc-frp__quick-port {
  padding: 1px 8px;
  font-size: 11px;
  color: var(--text-secondary, #646a73);
  background: var(--bg-page, #f7f8fa);
  border: 1px solid var(--border-subtle, #e8eaec);
  border-radius: var(--radius, 6px);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--brand-600, #3370ff);
    border-color: var(--brand-300, #9db9ff);
  }
}
</style>