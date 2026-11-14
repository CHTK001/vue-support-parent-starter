<script setup lang="ts">
/**
 * 服务管理 —— 协议服务器节点（Server 接口 + ServerFilter 插件）
 *
 * 职责：服务节点的增删改查与启停，过滤器链 / 详情从卡片进入。
 *
 * <p>版式按主机资产页的语言重做：统计带 / 筛选带 / 卡片网格三段，段与段、卡与卡
 * 之间统一 2px 缝隙（底色是 `--bg-page`，白卡之间的缝就是那 2px 灰线）。因此这里
 * 不使用圆角与投影 —— 圆角 + 投影会在 2px 的缝里挤出灰边，视觉缝宽就不再是 2px。
 * 页面没有标题头：统计带就是首屏第一段。</p>
 *
 * <p>分层不变：</p>
 * <ul>
 *   <li>`service/serviceView.ts`     纯函数：后端行 → 展示对象</li>
 *   <li>`service/useServiceNodes.ts` 取数与动作：状态、自动刷新、启停、抽屉开合</li>
 *   <li>本页面只读 {@link ServiceNodesVm}，自己不算节点状态</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import { useRoute } from 'vue-router';
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus';
import ReButton from '@repo/ui/re-button';
import ReInput from '@repo/ui/re-input';
import ReSelect from '@repo/ui/re-select';
import ReDrawer from '@repo/ui/re-drawer';
import ReDialog from '@repo/ui/re-dialog';
import ReEmpty from '@repo/ui/re-empty';
import { RoomView } from '@pages/room';
import ScServerFormDrawer from '../components/ScServerFormDrawer.vue';
import ScServerDetailDrawer from '../components/ScServerDetailDrawer.vue';
import ScServerOperLogPanel from '../components/ScServerOperLogPanel.vue';
import { copyText } from '../utils/clipboard';
import { useServiceNodes } from './service/useServiceNodes';
import { primaryActionOf, stateClassOf, type ServiceNodeCard } from './service/serviceView';
import type { ServerNodeView } from '../api';

const vm = useServiceNodes();
const route = useRoute();

/* ==================== 统计带 ==================== */

/** 已出现过的协议种类数（统计带副文案用） */
const protocolKinds = computed(
  () => new Set(vm.cards.map(card => card.protocolCode).filter(Boolean)).size,
);

/** 运行占比（分母为 0 时给 0，不让 NaN 上屏） */
const runningPct = computed(() => {
  const total = vm.stats.total;
  return total ? Math.round((vm.stats.running / total) * 100) : 0;
});

/* ==================== 筛选与排序 ==================== */

/** 排序口径 */
const sortBy = ref<'name' | 'port' | 'status'>('name');

/** 排序下拉 */
const sortOptions = [
  { label: '排序：名称', value: 'name' },
  { label: '排序：端口', value: 'port' },
  { label: '排序：状态', value: 'status' },
];

/** 协议下拉：首项「全部」，其余来自后端内置 + SPI 元数据 */
const protocolOptions = computed(() => [
  { label: '协议：全部', value: '' },
  ...vm.protocolOptions,
]);

/** 状态下拉 */
const statusOptions = [
  { label: '状态：全部', value: '' },
  { label: '运行中', value: 'RUNNING' },
  { label: '异常', value: 'ERROR' },
  { label: '已停止', value: 'STOPPED' },
];

/** 状态排序权重：异常最先，其次运行中，最后已停止 */
const STATUS_ORDER: Record<string, number> = { ERROR: 0, RUNNING: 1, STOPPED: 2 };

/**
 * 排序后的可见卡片。
 *
 * <p>名称与端口走 `localeCompare(..., 'zh-CN', { numeric: true })`，让 `node-2`
 * 排在 `node-10` 前面；状态排序把异常排最前，排障时先看到出问题的服务。</p>
 */
const sortedCards = computed<ServiceNodeCard[]>(() => {
  const list = [...vm.visibleCards];
  if (sortBy.value === 'port') {
    return list.sort((a, b) => (a.port ?? 0) - (b.port ?? 0));
  }
  if (sortBy.value === 'status') {
    return list.sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
        a.name.localeCompare(b.name, 'zh-CN', { numeric: true }),
    );
  }
  return list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }));
});

/* ==================== 卡片口径 ==================== */

/**
 * 过滤器生效比例（环图用）。
 *
 * <p>没有挂载过滤器时给 0：环画成空环，比画成满环更符合「链上一个都没挂」。</p>
 *
 * @param card 展示数据
 */
function filterPct(card: ServiceNodeCard): number {
  if (!card.filterCount) return 0;
  return Math.round((card.activeFilterCount / card.filterCount) * 100);
}

/** 是否为 P2P 房间协议节点（协议编码可能是 ROOM / room） */
function isRoomCard(card: ServiceNodeCard): boolean {
  return String(card.protocolCode || '').trim().toLowerCase() === 'room';
}

/** 按卡片取后端行（动作接口要的是后端行） */
function nodeOf(card: ServiceNodeCard): ServerNodeView | undefined {
  return vm.nodes.find(node => node.id === card.id);
}

/* ==================== 行内动作 ==================== */

/**
 * 主操作：运行中的能停，异常的给重启，其余能启。
 *
 * @param card 展示数据
 */
function runPrimary(card: ServiceNodeCard): void {
  const node = nodeOf(card);
  if (!node) return;
  const action = primaryActionOf(card);
  if (action === 'stop') void vm.stop(node);
  else if (action === 'restart') void vm.restart(node);
  else void vm.start(node);
}

/** 主操作文案 */
function primaryLabel(card: ServiceNodeCard): string {
  const action = primaryActionOf(card);
  return action === 'stop' ? '停止' : action === 'restart' ? '重启' : '启动';
}

/** 编辑：走表单抽屉（新增 / 编辑 / 克隆共用） */
function editCard(card: ServiceNodeCard): void {
  const node = nodeOf(card);
  if (node) vm.openEdit(node);
}

/** 删除：vm.remove 内部有二次确认，运行中的实例先停再删 */
function removeCard(card: ServiceNodeCard): void {
  const node = nodeOf(card);
  if (node) void vm.remove(node);
}

/* ==================== 详情抽屉 ==================== */

/** 详情抽屉开关 */
const detailVisible = ref(false);
/** 详情抽屉指向的节点 */
const detailNodeId = ref<number | null>(null);

/**
 * 打开服务详情（详情与过滤器链在抽屉内分页签切换）。
 *
 * @param card 展示数据
 */
function openDetail(card: ServiceNodeCard): void {
  detailNodeId.value = card.id;
  detailVisible.value = true;
}

/* ==================== 卡片「更多」 ==================== */

/** 操作日志弹框是否可见 */
const operLogVisible = ref(false);
/** 当前查看日志的节点（关闭弹框后仍保留，避免关闭动画期间标题闪空） */
const operLogNode = ref<{ id: number; name: string } | null>(null);

/**
 * 复制卡片文本，成功与否都在页面这一层给 toast。
 *
 * @param text 文本
 * @param ok   成功提示
 */
async function copyCardText(text: string, ok: string): Promise<void> {
  const copied = await copyText(text);
  if (copied) message.success(ok);
  else message.warning('复制失败，请手动复制');
}

/**
 * 打开节点操作日志。
 *
 * <p>只对已持久化的节点开放：{@code node_id} 是非空列，新建但没保存的卡片还没有
 * 可查询的主键。</p>
 *
 * @param card 目标节点卡片
 */
function openOperLog(card: ServiceNodeCard): void {
  if (!card.id) {
    message.warning('该服务还未保存，暂无可查询的操作日志');
    return;
  }
  operLogNode.value = { id: card.id, name: card.name };
  operLogVisible.value = true;
}

/**
 * 卡片「更多」命令分发。
 *
 * @param cmd  命令标识
 * @param card 目标节点卡片
 */
function onCardCommand(cmd: string, card: ServiceNodeCard): void {
  switch (cmd) {
    case 'detail':
      openDetail(card);
      break;
    case 'clone': {
      const node = nodeOf(card);
      if (node) vm.openClone(node);
      break;
    }
    case 'oper-log':
      openOperLog(card);
      break;
    case 'room':
      openRoom(card);
      break;
    case 'copy-name':
      void copyCardText(card.name, '服务名称已复制');
      break;
    case 'copy-listen':
      void copyCardText(card.listenText, '监听地址已复制');
      break;
    case 'copy-url':
      if (!card.url) {
        message.info('该服务没有访问地址');
        break;
      }
      void copyCardText(card.url, '访问地址已复制');
      break;
    case 'delete':
      removeCard(card);
      break;
    default:
      break;
  }
}

/* ==================== P2P 房间 ==================== */

/** 房间抽屉开关 */
const roomVisible = ref(false);
/** 要加入的房间号（空则由工作台里创建） */
const roomId = ref('');
/** 房间信令地址 */
const roomServerUrl = ref('');

/** 找一个运行中、且有可连接地址的 ROOM 节点 */
function findRunningRoom(): ServiceNodeCard | undefined {
  return vm.cards.filter(isRoomCard).find(card => card.status === 'RUNNING' && !!card.url);
}

/**
 * 从卡片打开房间工作台。
 *
 * <p>只有运行中的节点才开：没监听就没有信令面，连上去必然失败。</p>
 *
 * @param card 房间节点卡片
 */
function openRoom(card: ServiceNodeCard): void {
  if (card.status !== 'RUNNING') {
    message.warning(`房间节点「${card.name}」未运行，请先启动`);
    return;
  }
  if (!card.url) {
    message.warning('房间节点没有可用地址（检查监听地址与端口）');
    return;
  }
  roomId.value = '';
  roomServerUrl.value = card.url;
  roomVisible.value = true;
}

/** 深链 `?roomId=` 是否已处理过（只开一次，之后交给用户） */
let deepLinkHandled = false;

/**
 * 用 `?roomId=` 直接打开房间工作台。
 *
 * <p>必须等节点列表落地：房间信令跑在 ROOM 节点自己的端口上，节点还没取回来时
 * 地址是空的，连过去只会永远「连接中」。</p>
 */
function openDeepLinkRoom(): void {
  const id = String(route.query.roomId ?? '');
  if (!id || deepLinkHandled) return;
  if (vm.loading && !vm.cards.length) return;
  deepLinkHandled = true;
  const running = findRunningRoom();
  if (!running) {
    message.warning(
      vm.cards.some(isRoomCard)
        ? '房间节点未运行：先启动 ROOM 节点'
        : '还没有 ROOM 房间节点：先新建一个协议为 room 的服务',
    );
    return;
  }
  roomId.value = id;
  roomServerUrl.value = running.url;
  roomVisible.value = true;
}

onMounted(openDeepLinkRoom);

/** 首轮节点列表落地后再处理深链 */
watch(() => vm.cards.length, () => openDeepLinkRoom());
</script>

<template>
  <div class="svc">
    <!-- 降级提示：协议或插件元数据失败时必须出声，否则用户只看到空下拉 -->
    <el-alert
      v-if="vm.notice.show"
      :type="vm.notice.tone"
      :title="vm.notice.text"
      show-icon
      :closable="false"
      class="svc-notice"
    />

    <!-- 统计带：一整张卡，四格用竖线分隔，不在 2px 缝里再叠四张卡 -->
    <section class="band svc-stats">
      <div class="stat" style="--accent: var(--brand-500)">
        <b>服务总数</b>
        <i>{{ vm.stats.total }}</i>
        <s>{{ protocolKinds }} 种协议 · {{ vm.stats.plugins }} 个过滤器</s>
      </div>
      <div class="stat" style="--accent: var(--status-success)">
        <b>运行中</b>
        <i>{{ vm.stats.running }}</i>
        <s class="up">{{ runningPct }}% 在线</s>
      </div>
      <div class="stat" style="--accent: var(--pulse-alarm)">
        <b>异常</b>
        <i>{{ vm.stats.error }}</i>
        <s :class="{ dn: vm.stats.error > 0 }">
          {{ vm.stats.unknown ? `另有 ${vm.stats.unknown} 个状态未知` : '端口占用 / 启动失败' }}
        </s>
      </div>
      <div class="stat" style="--accent: var(--pulse-offline)">
        <b>已停止</b>
        <i>{{ vm.stats.stopped }}</i>
        <s>手动启动 · 不随进程拉起</s>
      </div>
    </section>

    <!-- 筛选带：搜索 / 协议 / 状态 / 排序 + 新建与刷新 -->
    <section class="band svc-tools">
      <!-- ReInput 根节点是 display:contents 壳，宽度必须包一层 div 才生效 -->
      <div class="svc-search">
        <ReInput
          v-model="vm.keyword"
          placeholder="搜索服务名称 / 监听端口 / 后端 / 报错"
          clearable
        />
      </div>
      <ReSelect v-model="vm.protocol" class="svc-pick" :data="protocolOptions" />
      <ReSelect v-model="vm.status" class="svc-pick" :data="statusOptions" />
      <ReSelect v-model="sortBy" class="svc-pick" :data="sortOptions" />
      <ReButton v-if="vm.filtered" text @click="vm.resetFilters()">重置</ReButton>
      <span class="svc-gap" />
      <ReButton type="primary" icon="Plus" @click="vm.openCreate()">新建服务</ReButton>
      <ReButton icon="Refresh" :loading="vm.loading" @click="vm.refresh()">刷新</ReButton>
    </section>

    <!-- 卡片网格：两个方向都是 2px，缝里露的是页面底色 -->
    <section v-if="sortedCards.length" class="svc-grid">
      <article
        v-for="card in sortedCards"
        :key="card.id"
        class="svc-card"
        :class="stateClassOf(card)"
        @dblclick="openDetail(card)"
      >
        <div class="svc-card__head">
          <i class="svc-dot" :class="stateClassOf(card)" aria-hidden="true" />
          <b class="svc-card__name" :title="card.name">{{ card.name }}</b>
          <span class="svc-card__listen">{{ card.listenText }}</span>
        </div>

        <div class="svc-card__body">
          <div class="svc-ring" :style="{ '--pct': filterPct(card) + '%' }">
            <em>{{ card.activeFilterCount }}/{{ card.filterCount }}</em>
          </div>
          <div class="svc-card__meta">
            <b>过滤器生效</b>
            <span>{{ card.filterCount ? `${card.filterCount} 个已挂载` : '链上还没有过滤器' }}</span>
          </div>
          <div class="svc-card__state">
            <span>{{ card.statusText }}</span>
            <span class="svc-card__state-sub">{{ card.enabledText }}</span>
          </div>
        </div>

        <div class="svc-card__tags">
          <span class="svc-chip">{{ card.protocolText }}</span>
          <span class="svc-chip">{{ card.engine }}</span>
          <span
            v-for="chip in card.chips.slice(0, 4)"
            :key="chip.key"
            class="svc-tag"
            :class="{ 'is-off': !chip.enabled }"
            :title="`${chip.text} · 第 ${chip.order} 步`"
          >{{ chip.text }}</span>
          <span v-if="card.chips.length > 4" class="svc-tag">+{{ card.chips.length - 4 }}</span>
        </div>

        <div class="svc-card__foot">
          <span class="svc-mono">{{ card.backendText || '直连 · 无后端' }}</span>
          <button
            v-if="isRoomCard(card) && card.status === 'RUNNING'"
            type="button"
            class="svc-room"
            @click.stop="openRoom(card)"
          >打开房间</button>
          <span v-else-if="card.reason" class="svc-card__reason" :title="card.reason">
            {{ card.reason }}
          </span>
          <ElDropdown
            trigger="click"
            placement="bottom-end"
            @command="(cmd: string) => onCardCommand(cmd, card)"
          >
            <button type="button" class="svc-more" @click.stop>更多</button>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="detail">查看详情</ElDropdownItem>
                <ElDropdownItem command="clone">克隆服务</ElDropdownItem>
                <ElDropdownItem command="oper-log">操作日志</ElDropdownItem>
                <ElDropdownItem v-if="isRoomCard(card)" command="room">打开房间工作台</ElDropdownItem>
                <ElDropdownItem command="copy-name" divided>复制名称</ElDropdownItem>
                <ElDropdownItem command="copy-listen">复制监听地址</ElDropdownItem>
                <ElDropdownItem command="copy-url" :disabled="!card.url">复制访问地址</ElDropdownItem>
                <ElDropdownItem command="delete" divided>删除服务</ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>

        <div class="svc-card__actions" @dblclick.stop>
          <ReButton
            class="svc-act"
            size="small"
            :loading="vm.actingId === card.id"
            @click="runPrimary(card)"
          >{{ primaryLabel(card) }}</ReButton>
          <ReButton class="svc-act" size="small" @click="editCard(card)">编辑</ReButton>
          <ReButton class="svc-act" size="small" @click="openDetail(card)">详情</ReButton>
          <ReButton class="svc-act" size="small" type="danger" @click="removeCard(card)">删除</ReButton>
        </div>
      </article>
    </section>

    <div v-else class="svc-empty">
      <ReEmpty :description="vm.filtered ? '没有命中条件的服务，换个关键字或清空筛选' : '还没有服务，先新建一个监听服务'" />
    </div>

    <!-- 新增 / 编辑 / 克隆：表单抽屉（字段、校验都在里面） -->
    <ScServerFormDrawer
      v-model="vm.formVisible"
      :node="vm.editingNode?.id === 0 ? null : vm.editingNode"
      :protocols="vm.protocols"
      :filter-types="vm.filterTypes"
      :existing-names="vm.existingNames"
      :clone-source="vm.editingNode?.id === 0 ? vm.editingNode : null"
      @saved="vm.refresh()"
    />

    <!-- 详情 / 过滤器链：同一个抽屉内切换 -->
    <ScServerDetailDrawer
      v-model="detailVisible"
      :node-id="detailNodeId"
      :filter-types="vm.filterTypes"
      @changed="vm.refresh()"
      @open-detail-page="vm.openDetailPage"
    />

    <!-- P2P 房间：关闭抽屉即卸载，RoomView 自己 leave 并断开 WebSocket -->
    <ReDrawer v-model="roomVisible" title="P2P 房间" :size="'88%'" :footer-hidden="true" close-only>
      <RoomView :room-id="roomId" :server-url="roomServerUrl" @leave="roomVisible = false" />
    </ReDrawer>

    <!-- 节点操作日志：卡片「更多」进入，只读分页 -->
    <ReDialog
      v-model="operLogVisible"
      width="960px"
      :title="operLogNode ? `操作日志 · ${operLogNode.name}` : '操作日志'"
      :footer-hidden="true"
      destroy-on-close
    >
      <div class="svc-operlog">
        <ScServerOperLogPanel
          :node-id="operLogNode?.id ?? null"
          :node-name="operLogNode?.name"
        />
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* 页面底色就是卡片之间的「缝」：所有块间距 2px，不叠圆角与投影 */
.svc {
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: var(--bg-page);
}

.svc-notice {
  margin: 0;
}

.band {
  flex: none;
  background: var(--bg-container);
}

/* ===== 统计带 ===== */
.svc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.stat {
  position: relative;
  padding: 13px 16px 12px;
  border-left: 1px solid var(--border-subtle);

  &:first-child {
    border-left: 0;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent);
  }

  b {
    display: block;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
    margin-bottom: 7px;
  }

  i {
    display: block;
    font-size: 25px;
    font-weight: 700;
    font-style: normal;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    color: var(--text-primary);
  }

  s {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    text-decoration: none;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.up {
      color: var(--status-success);
      font-weight: 500;
    }

    &.dn {
      color: var(--status-error);
      font-weight: 500;
    }
  }
}

/* ===== 筛选带 ===== */
.svc-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 9px 12px;
}

.svc-search {
  width: 290px;
}

.svc-pick {
  width: 150px;
}

.svc-gap {
  flex: 1;
}

/* ===== 卡片网格 ===== */
.svc-grid {
  flex: 1;
  min-height: 0;
  align-content: start;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2px;
  background: var(--bg-page);
}

.svc-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 13px 15px;
  background: var(--bg-container);
  border-left: 3px solid var(--pulse-offline);
  cursor: default;
  transition: background 0.15s var(--ease-out, ease);

  &:hover {
    background: var(--bg-elevated);
  }

  &.is-run {
    border-left-color: var(--pulse-online);
  }

  &.is-err {
    border-left-color: var(--pulse-alarm);
  }

  &.is-stop {
    border-left-color: var(--pulse-offline);
  }
}

.svc-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.svc-card__name {
  flex: 1;
  min-width: 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.svc-card__listen {
  flex: none;
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: ui-monospace, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

/* 状态点：运行中呼吸，异常闪烁，其余静止（与 koi 的 pdot 口径一致） */
.svc-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pulse-offline);

  &.is-run {
    background: var(--pulse-online);
    animation: svc-breathe 1.6s ease-in-out infinite;
  }

  &.is-err {
    background: var(--pulse-alarm);
    animation: svc-blink 0.8s step-start infinite;
  }
}

@keyframes svc-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(47, 191, 113, 0.35);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(47, 191, 113, 0.12);
  }
}

@keyframes svc-blink {
  50% {
    opacity: 0.35;
  }
}

.svc-card__body {
  display: flex;
  align-items: center;
  gap: 9px;
}

/* 环图：百分比走 --pct，颜色走 --ring-color（与主机资产的 mini-ring 同构） */
.svc-ring {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: conic-gradient(var(--brand-500) var(--pct), var(--bg-fill) 0);
  display: flex;
  align-items: center;
  justify-content: center;

  em {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--bg-container);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-style: normal;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }
}

.svc-card__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;

  b {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  span {
    font-size: 10px;
    color: var(--text-tertiary);
  }
}

.svc-card__state {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.svc-card__state-sub {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.svc-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.svc-chip {
  font-size: 10.5px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  color: var(--brand-600);
}

.svc-tag {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);

  &.is-off {
    color: var(--text-tertiary);
    text-decoration: line-through;
  }
}

.svc-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  font-size: 11.5px;
  color: var(--text-secondary);
  min-height: 20px;
}

.svc-mono {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.svc-card__reason {
  max-width: 55%;
  color: var(--status-error);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.svc-room {
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 11.5px;
  color: var(--brand-500);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.svc-more {
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 11.5px;
  color: var(--text-tertiary);
  cursor: pointer;

  &:hover {
    color: var(--brand-500);
  }
}

/* 操作日志弹框：面板内部按 100% 高铺开，ReTable 的高度才有参照 */
.svc-operlog {
  display: flex;
  flex-direction: column;
  height: 520px;
  min-height: 0;
}

.svc-card__actions {
  display: flex;
  gap: 6px;

  .svc-act {
    flex: 1;
    min-width: 0;
  }
}

.svc-empty {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 60px 0;
  background: var(--bg-container);
}

/* ===== 窄屏 ===== */
@media (max-width: 1180px) {
  .svc-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat:nth-child(3) {
    border-left: 0;
  }

  .svc-search {
    width: 100%;
  }

  .svc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
