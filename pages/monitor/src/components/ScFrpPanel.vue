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
  /** 副文本（右侧时间 / 状态） */
  meta: string;
  /** 是否最新一条（高亮） */
  fresh?: boolean;
}

const MAX_SIGNALS = 80;
const signals = ref<SignalLine[]>([]);
const signalSeq = ref(0);
const signalBoxEl = ref<HTMLElement | null>(null);
const signalPaused = ref(false);

/** 之前一次轮询的客户端/规则快照，用于差异推导事件 */
let lastClients = new Set<string>();
let lastExposeKeys = new Set<string>();
let lastMapKeys = new Set<string>();

function pushSignal(kind: SignalKind, text: string, meta = ''): void {
  signalSeq.value += 1;
  signals.value = [
    { seq: signalSeq.value, kind, text, meta, fresh: true },
    ...signals.value.map(s => ({ ...s, fresh: false })),
  ].slice(0, MAX_SIGNALS);
  // 暂停 = 冻结视口：新事件仍入列，但不自动滚顶，方便比对历史
  if (!signalPaused.value) void scrollSignalTop();
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

/* ==================== 展示口径 ==================== */

const exposeColumns: ReTableColumn[] = [
  { prop: 'targetHost', label: '目标地址', minWidth: 120, showOverflowTooltip: true },
  { prop: 'targetPort', label: '目标端口', width: 88, align: 'right' },
  { prop: 'localPort', label: '本地端口', width: 88, align: 'right' },
  { prop: 'clientId', label: '提供方客户端', minWidth: 140, showOverflowTooltip: true },
  { prop: 'ruleId', label: '操作', slot: 'ruleId', width: 52, align: 'center' },
];

const mapColumns: ReTableColumn[] = [
  { prop: 'targetHost', label: '目标地址', minWidth: 120, showOverflowTooltip: true },
  { prop: 'targetPort', label: '目标端口', width: 88, align: 'right' },
  { prop: 'localPort', label: '本地端口', width: 88, align: 'right' },
  { prop: 'clientId', label: '访问方客户端', minWidth: 140, showOverflowTooltip: true },
  { prop: 'ruleId', label: '操作', slot: 'ruleId', width: 52, align: 'center' },
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
              <ReInput v-model="cfgForm.token" placeholder="chua-frp-default-token" class="sc-frp__fval" />
            </div>
            <p class="sc-frp__note">节点级参数（端口 / 令牌）在 FrpServer 构造时定死，保存后<b>需重启节点</b>才生效；规则下推不在此列。</p>
            <div class="sc-frp__cfg-actions">
              <ReButton :loading="savingCfg" icon="Check" :show-text="true" :disabled="!hasCfgChange || !node" @click="saveCfg">保存配置</ReButton>
              <ReButton :loading="restarting" icon="RefreshRight" :show-text="true" :disabled="node?.status !== 'RUNNING'" @click="restartNode">重启节点</ReButton>
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
            <ReButton layout="square" type="primary" icon="Plus" tip="新建暴露规则"
              :disabled="!manage.clients.length" @click="openCreate('expose')" />
          </header>
          <div class="sc-frp__table">
            <ReTable
              v-loading="loading"
              :data="manage.exposes"
              :columns="exposeColumns"
              :pagination="false"
              :border="false"
              stripe
              height="100%"
              empty-text="还没有暴露规则"
            >
              <template #col-ruleId="{ row }">
                <ReButton link icon="Delete" tip="撤销这条规则" @click="revoke('expose', row as FrpRuleItem)" />
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
            <ReButton layout="square" type="primary" icon="Plus" tip="新建映射规则"
              :disabled="!manage.clients.length" @click="openCreate('map')" />
          </header>
          <div class="sc-frp__table">
            <ReTable
              v-loading="loading"
              :data="manage.maps"
              :columns="mapColumns"
              :pagination="false"
              :border="false"
              stripe
              height="100%"
              empty-text="还没有映射规则"
            >
              <template #col-ruleId="{ row }">
                <ReButton link icon="Delete" tip="撤销这条规则" @click="revoke('map', row as FrpRuleItem)" />
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
          <ReButton
            layout="square"
            :icon="signalPaused ? 'VideoPlay' : 'VideoPause'"
            :tip="signalPaused ? '恢复滚动' : '暂停滚动'"
            @click="signalPaused = !signalPaused"
          />
        </header>
        <div class="sc-frp__stream-body">
          <div class="sc-frp__stream-pad" />
          <ul ref="signalBoxEl" class="sc-frp__lines">
            <li v-for="s in signals" :key="s.seq" class="sc-frp__line" :class="[`is-${s.kind}`, { fresh: s.fresh }]">
              <span class="sc-frp__line-time mono">{{ s.meta }}</span>
              <span class="sc-frp__line-text">{{ s.text }}</span>
            </li>
          </ul>
          <p v-if="!signals.length" class="sc-frp__stream-empty">还没有信令 —— 客户端接入、规则下推/撤销时会出现在这里</p>
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
  &.fresh { background: color-mix(in srgb, var(--el-color-primary, #3370ff) 6%, #fff); }

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
</style>