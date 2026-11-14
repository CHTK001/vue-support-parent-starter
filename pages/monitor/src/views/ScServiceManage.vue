<script setup lang="ts">
/**
 * 服务管理 —— 协议服务器节点（Server 接口 + ServerFilter 插件）
 *
 * 职责：服务节点的增删改查与启停，过滤器链 / 详情在右栏展开。
 *
 * <p>版式按发布管理（{@code pages/server} 的「主机文件」）的三列主体：</p>
 * <ul>
 *   <li><b>左栏</b>：总览计数与状态筛选（全量口径，来自 {@code /server/summary}）；</li>
 *   <li><b>中栏</b>：筛选工具条 + ReTable（服务端分页）+ 分页器；</li>
 *   <li><b>右栏</b>：选中行的详情与过滤器链（复用 {@link ScServerDetailDrawer} 的嵌入模式）。</li>
 * </ul>
 *
 * <p><b>分页</b>：表格用 ReTable 的 {@code loader}（后端分页），前端不持有全量数组，
 * 也不在本地切片。左栏计数与表单重名校验需要全量规模，所以走一份轻量摘要接口
 * —— 用当前页去算总数会在翻页后变成 20。</p>
 *
 * <p><b>按钮</b>：工具条与操作列统一 {@code ReButton layout="square"} + {@code tip}，
 * 图标即语义，悬浮给文字，避免表格里塞一排文字按钮把行高撑开。</p>
 *
 * <p>分层不变：</p>
 * <ul>
 *   <li>`service/useServiceNodes.ts` 取数与动作：摘要、自动刷新、启停、抽屉开合</li>
 *   <li>本页面只读 {@link ServiceNodesVm}，自己不算节点状态</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import { useRoute } from 'vue-router';
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus';
import ReButton from '@repo/ui/re-button';
import ReInput from '@repo/ui/re-input';
import ReSelect from '@repo/ui/re-select';
import ReDrawer from '@repo/ui/re-drawer';
import ReDialog from '@repo/ui/re-dialog';
import ReEmpty from '@repo/ui/re-empty';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { RoomView } from '@pages/room';
import ScServerFormDrawer from '../components/ScServerFormDrawer.vue';
import ScServerDetailDrawer from '../components/ScServerDetailDrawer.vue';
import ScServerOperLogPanel from '../components/ScServerOperLogPanel.vue';
import { copyText } from '../utils/clipboard';
import { deriveStatusMeta } from '../utils/nodeList';
import { listServerNodes, type ServerNodeView } from '../api';
import { useServiceNodes } from './service/useServiceNodes';

const vm = useServiceNodes();
const route = useRoute();

/* ==================== 表格 ==================== */

/** ReTable 实例：动作后重取当前页 */
const tableRef = ref<{ reload?: () => Promise<unknown> } | null>(null);

/** 右栏当前展示的节点（点行选中，空则右栏给空态） */
const selectedId = ref<number | null>(null);

/** 搜索框的生效值：输入 320ms 后才打进查询条件，避免每敲一个字打一次请求 */
const appliedKeyword = ref('');

/** 搜索防抖计时器 */
let keywordTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => vm.keyword,
  value => {
    if (keywordTimer) clearTimeout(keywordTimer);
    keywordTimer = setTimeout(() => {
      appliedKeyword.value = value.trim();
      keywordTimer = null;
    }, 320);
  },
);

/**
 * 表格查询条件。
 *
 * <p>ReTable 会监听它并自动回到第 1 页重取；{@code page / pageSize} 由组件写回，
 * 这里只放业务条件。</p>
 */
const tableParams = computed(() => ({
  keyword: appliedKeyword.value,
  protocol: vm.protocol,
  status: vm.status,
  sort: vm.sort,
}));

/**
 * 排序下拉。
 *
 * <p>排序总有一项生效，所以不需要「全部」，标签里带上「排序：」以免和协议下拉混淆。</p>
 */
const sortOptions = [
  { label: '排序：名称', value: 'name' },
  { label: '排序：端口', value: 'port' },
  { label: '排序：状态', value: 'status' },
];

/**
 * 状态下拉。
 *
 * <p>空值表示不过滤，靠 {@code placeholder} 表达「全部状态」：
 * Element Plus 在值为空串时显示占位符，塞一个 value='' 的「全部」选项反而点不出来。</p>
 */
const statusOptions = [
  { label: '运行中', value: 'RUNNING' },
  { label: '异常', value: 'ERROR' },
  { label: '已停止', value: 'STOPPED' },
];

/* ==================== 展示口径 ==================== */

/** 运行占比（分母为 0 时给 0，不让 NaN 上屏） */
const runningPct = computed(() => {
  const total = vm.summary.total;
  return total ? Math.round((vm.summary.running / total) * 100) : 0;
});

/** 协议种类数（下拉项去掉「全部」） */
const protocolKinds = computed(() => vm.protocolOptions.length);

/** 左栏状态筛选项 */
const statusFilters = computed(() => [
  { value: '' as const, label: '全部服务', count: vm.statusCounts.all, tone: 'is-all' },
  { value: 'RUNNING' as const, label: '运行中', count: vm.statusCounts.running, tone: 'is-run' },
  { value: 'ERROR' as const, label: '异常', count: vm.statusCounts.error, tone: 'is-err' },
  { value: 'STOPPED' as const, label: '已停止', count: vm.statusCounts.stopped, tone: 'is-stop' },
]);

/**
 * 表格行还原成节点视图。
 *
 * <p>ReTable 的行类型是 {@code Record<string, unknown>}，插槽里拿到的是同一批对象，
 * 这里只做一次类型还原，避免模板里到处写断言。</p>
 *
 * @param row 表格行
 */
function rowOf(row: Record<string, unknown>): ServerNodeView {
  return row as unknown as ServerNodeView;
}

/**
 * 监听地址。
 *
 * @param node 节点
 */
function listenText(node: ServerNodeView): string {
  return `${node.host || '0.0.0.0'}:${node.port ?? '-'}`;
}

/**
 * 反向代理后端：{@code host:port}（没有则空串）。
 *
 * @param node 节点
 */
function backendText(node: ServerNodeView): string {
  const config = node.config || {};
  const host = config.backendHost ?? config.host;
  const port = config.backendPort ?? config.port;
  return host && port ? `${host}:${port}` : '';
}

/**
 * 「访问 / 后端」列：运行中有访问地址优先显示，否则显示代理后端。
 *
 * @param node 节点
 */
function endpointText(node: ServerNodeView): string {
  return node.serverUrl || backendText(node) || '-';
}

/**
 * 协议展示名。
 *
 * @param node 节点
 */
function protocolText(node: ServerNodeView): string {
  return node.protocolDesc || node.protocol || '-';
}

/**
 * 状态点样式（与左栏同一套色）。
 *
 * @param node 节点
 */
function statusDotClass(node: ServerNodeView): string {
  const tone = deriveStatusMeta(node).tone;
  return tone === 'success' ? 'is-run' : tone === 'danger' ? 'is-err' : 'is-stop';
}

/**
 * 状态中文文案。
 *
 * @param node 节点
 */
function statusTextOf(node: ServerNodeView): string {
  return deriveStatusMeta(node).text;
}

/** 是否为 P2P 房间协议节点（协议编码可能是 ROOM / room） */
function isRoomNode(node: ServerNodeView): boolean {
  return String(node.protocol || '').trim().toLowerCase() === 'room';
}

/** 主操作：运行中的能停，异常的给重启，其余能启 */
type PrimaryAction = 'start' | 'stop' | 'restart';

/**
 * 取主操作。
 *
 * @param node 节点
 */
function primaryActionOf(node: ServerNodeView): PrimaryAction {
  if (node.status === 'RUNNING') return 'stop';
  if (node.status === 'ERROR') return 'restart';
  return 'start';
}

/**
 * 主操作图标。
 *
 * @param node 节点
 */
function primaryIconOf(node: ServerNodeView): string {
  const action = primaryActionOf(node);
  return action === 'stop' ? 'VideoPause' : action === 'restart' ? 'RefreshRight' : 'VideoPlay';
}

/**
 * 主操作提示文案。
 *
 * @param node 节点
 */
function primaryTipOf(node: ServerNodeView): string {
  const action = primaryActionOf(node);
  return action === 'stop' ? '停止服务' : action === 'restart' ? '重启服务' : '启动服务';
}

/**
 * 执行主操作。
 *
 * @param node 节点
 */
function runPrimary(node: ServerNodeView): void {
  const action = primaryActionOf(node);
  if (action === 'stop') void vm.stop(node);
  else if (action === 'restart') void vm.restart(node);
  else void vm.start(node);
}

/** 行点击：展开右栏详情 */
function onRowClick(row: Record<string, unknown>): void {
  selectedId.value = rowOf(row).id;
}

/* ==================== 表格列 ==================== */

/**
 * 列定义。
 *
 * <p>三列主体下中栏还要让出「左栏 214 + 右栏 360」，所以列宽压得比较紧：
 * 名称与「访问 / 后端」用 minWidth 吃剩余宽度，其余固定 —— 固定列宽在翻页时不会跳动，
 * 也不会因为某页名字长而把操作列挤出去。</p>
 */
const columns = computed<ReTableColumn[]>(() => [
  { prop: 'status', label: '状态', width: 76, slot: 'status' },
  { prop: 'name', label: '服务', minWidth: 168, slot: 'name', showOverflowTooltip: true },
  { prop: 'port', label: '监听', width: 126, slot: 'listen' },
  {
    prop: 'protocol',
    label: '协议',
    width: 92,
    formatter: row => protocolText(row as unknown as ServerNodeView),
  },
  { prop: 'filters', label: '过滤器', width: 58, slot: 'filters', align: 'center' },
  {
    prop: 'serverUrl',
    label: '访问 / 后端',
    minWidth: 132,
    slot: 'endpoint',
    showOverflowTooltip: true,
  },
  { prop: 'actions', label: '操作', width: 104, slot: 'actions', align: 'right', fixed: 'right' },
]);

/* ==================== 操作日志 ==================== */

/** 操作日志弹框是否可见 */
const operLogVisible = ref(false);
/** 当前查看日志的节点（关闭弹框后仍保留，避免关闭动画期间标题闪空） */
const operLogNode = ref<{ id: number; name: string } | null>(null);

/**
 * 复制文本，成功与否都在页面这一层给 toast。
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
 * @param node 节点
 */
function openOperLog(node: ServerNodeView): void {
  if (!node.id) {
    message.warning('该服务还未保存，暂无可查询的操作日志');
    return;
  }
  operLogNode.value = { id: node.id, name: node.name };
  operLogVisible.value = true;
}

/**
 * 行内「更多」命令分发。
 *
 * @param cmd  命令标识
 * @param node 目标节点
 */
function onRowCommand(cmd: string, node: ServerNodeView): void {
  switch (cmd) {
    case 'clone':
      vm.openClone(node);
      break;
    case 'oper-log':
      openOperLog(node);
      break;
    case 'room':
      openRoom(node);
      break;
    case 'copy-name':
      void copyCardText(node.name, '服务名称已复制');
      break;
    case 'copy-listen':
      void copyCardText(listenText(node), '监听地址已复制');
      break;
    case 'copy-url':
      if (!node.serverUrl) {
        message.info('该服务没有访问地址');
        break;
      }
      void copyCardText(node.serverUrl, '访问地址已复制');
      break;
    case 'delete':
      if (selectedId.value === node.id) selectedId.value = null;
      void vm.remove(node);
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

/**
 * 从行打开房间工作台。
 *
 * <p>只有运行中的节点才开：没监听就没有信令面，连上去必然失败。</p>
 *
 * @param node 房间节点
 */
function openRoom(node: ServerNodeView): void {
  if (node.status !== 'RUNNING') {
    message.warning(`房间节点「${node.name}」未运行，请先启动`);
    return;
  }
  if (!node.serverUrl) {
    message.warning('房间节点没有可用地址（检查监听地址与端口）');
    return;
  }
  roomId.value = '';
  roomServerUrl.value = node.serverUrl;
  roomVisible.value = true;
}

/** 深链 `?roomId=` 是否已处理过（只开一次，之后交给用户） */
let deepLinkHandled = false;

/**
 * 用 `?roomId=` 直接打开房间工作台。
 *
 * <p>这里单独拉一次全量列表：分页表格只有当前页，而房间节点可能在任意一页，
 * 拿当前页去找会时灵时不灵。只在带深链参数时发生一次，不影响日常翻页。</p>
 */
async function openDeepLinkRoom(): Promise<void> {
  const id = String(route.query.roomId ?? '');
  if (!id || deepLinkHandled) return;
  deepLinkHandled = true;
  try {
    const nodes = await listServerNodes();
    const rooms = nodes.filter(isRoomNode);
    const running = rooms.find(node => node.status === 'RUNNING' && !!node.serverUrl);
    if (!running?.serverUrl) {
      message.warning(
        rooms.length
          ? '房间节点未运行：先启动 ROOM 节点'
          : '还没有 ROOM 房间节点：先新建一个协议为 room 的服务',
      );
      return;
    }
    roomId.value = id;
    roomServerUrl.value = running.serverUrl;
    roomVisible.value = true;
  } catch (e) {
    message.error(e instanceof Error ? e.message : '读取 ROOM 节点失败，无法直接进房间');
  }
}

/* ==================== 生命周期 ==================== */

onMounted(() => {
  // 启停 / 删除 / 改配置后由 vm 重取摘要时顺带重取当前页
  vm.setRowRefresher(() => {
    void tableRef.value?.reload?.();
  });
  void openDeepLinkRoom();
});

onUnmounted(() => {
  vm.setRowRefresher(null);
  if (keywordTimer) clearTimeout(keywordTimer);
});

/** 手动刷新：摘要 + 当前页一起 */
function reloadAll(): void {
  void vm.refresh();
}
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

    <!-- ============ 第一行：四张独立统计卡（全量口径，来自 /server/summary） ============ -->
    <section class="svc-stats">
      <article class="svc-stat">
        <i class="svc-stat__accent is-all" aria-hidden="true" />
        <header>
          <span>服务总数</span>
          <b class="svc-stat__value">{{ vm.summary.total }}</b>
        </header>
        <p>{{ protocolKinds }} 种协议</p>
      </article>
      <article class="svc-stat">
        <i class="svc-stat__accent is-run" aria-hidden="true" />
        <header>
          <span>运行中</span>
          <b class="svc-stat__value">{{ vm.summary.running }}</b>
        </header>
        <p>运行占比 {{ runningPct }}%</p>
      </article>
      <article class="svc-stat">
        <i class="svc-stat__accent is-err" aria-hidden="true" />
        <header>
          <span>异常</span>
          <b class="svc-stat__value">{{ vm.summary.error }}</b>
        </header>
        <p>{{ vm.summary.error ? '需要重启排障' : '当前无异常' }}</p>
      </article>
      <article class="svc-stat">
        <i class="svc-stat__accent is-stop" aria-hidden="true" />
        <header>
          <span>已停止</span>
          <b class="svc-stat__value">{{ vm.summary.stopped }}</b>
        </header>
        <p>{{ vm.summary.plugins }} 个过滤器可用</p>
      </article>
    </section>

    <div class="svc-body">
      <!-- ============ 左栏：筛选与规模 ============ -->
      <aside class="svc-rail">
        <section class="svc-card">
          <header class="svc-card__head">按状态筛选</header>
          <button
            v-for="item in statusFilters"
            :key="item.value || 'all'"
            type="button"
            class="svc-filter"
            :class="{ on: vm.status === item.value }"
            @click="vm.status = item.value"
          >
            <i class="svc-kpi__dot" :class="item.tone" aria-hidden="true" />
            <span>{{ item.label }}</span>
            <b>{{ item.count }}</b>
          </button>
        </section>

        <section class="svc-card">
          <header class="svc-card__head">列表说明</header>
          <ul class="svc-tips">
            <li>列表走服务端分页，改筛选条件会回到第 1 页。</li>
            <li>每 10 秒自动同步一次状态，失败会逐轮退避。</li>
            <li>点选任一行，右侧展开详情与过滤器链。</li>
          </ul>
          <p v-if="vm.summary.unknown" class="svc-card__warn">
            另有 {{ vm.summary.unknown }} 个服务状态未知（历史数据，不是枚举值）
          </p>
        </section>
      </aside>

      <!-- ============ 中栏：筛选 + 表格 ============ -->
      <section class="svc-main">
        <div class="svc-toolbar">
          <!-- ReInput 根节点是 display:contents 壳，宽度必须包一层 div 才生效 -->
          <div class="svc-search">
            <ReInput
              v-model="vm.keyword"
              placeholder="搜索名称 / 端口 / 后端 / 报错"
              clearable
            />
          </div>
          <ReSelect
            v-model="vm.protocol"
            class="svc-pick"
            placeholder="全部协议"
            :data="vm.protocolOptions"
            clearable
          />
          <ReSelect
            v-model="vm.status"
            class="svc-pick"
            placeholder="全部状态"
            :data="statusOptions"
            clearable
          />
          <ReSelect v-model="vm.sort" class="svc-pick" :data="sortOptions" />
          <ReButton v-if="vm.filtered" layout="square" icon="RefreshLeft" tip="清空筛选" @click="vm.resetFilters()" />
          <span class="svc-gap" />
          <ReButton layout="square" type="primary" icon="Plus" tip="新建服务" @click="vm.openCreate()" />
          <ReButton layout="square" icon="Refresh" tip="刷新" :loading="vm.loading" @click="reloadAll" />
        </div>

        <div class="svc-table">
          <ReTable
            ref="tableRef"
            :loader="vm.loadPage"
            :params="tableParams"
            :columns="columns"
            :settings="{ highlightCurrentRow: true }"
            :config="{ toolbar: { enable: false }, search: false }"
            row-key="id"
            empty-text="没有命中条件的服务"
            height="100%"
            stripe
            @row-click="onRowClick"
          >
            <template #col-status="{ row }">
              <span class="svc-state" :class="deriveStatusMeta(rowOf(row)).tone">
                <i class="svc-kpi__dot" :class="statusDotClass(rowOf(row))" aria-hidden="true" />
                {{ statusTextOf(rowOf(row)) }}
              </span>
            </template>

            <template #col-name="{ row }">
              <div class="svc-name">
                <b :title="rowOf(row).name">{{ rowOf(row).name }}</b>
                <span class="svc-name__sub">#{{ rowOf(row).id }} · {{ rowOf(row).engine || '默认引擎' }}</span>
              </div>
            </template>

            <template #col-listen="{ row }">
              <span class="svc-mono">{{ listenText(rowOf(row)) }}</span>
            </template>

            <template #col-filters="{ row }">
              <span class="svc-filters" :class="{ 'is-none': !rowOf(row).filters?.length }">
                {{ rowOf(row).filters?.length ?? 0 }}
              </span>
            </template>

            <template #col-endpoint="{ row }">
              <span class="svc-mono">{{ endpointText(rowOf(row)) }}</span>
            </template>

            <template #col-actions="{ row }">
              <div class="svc-ops" @click.stop>
                <ReButton
                  layout="square"
                  size="mini"
                  :icon="primaryIconOf(rowOf(row))"
                  :tip="primaryTipOf(rowOf(row))"
                  :loading="vm.actingId === rowOf(row).id"
                  @click="runPrimary(rowOf(row))"
                />
                <ReButton
                  layout="square"
                  size="mini"
                  icon="EditPen"
                  tip="编辑服务"
                  @click="vm.openEdit(rowOf(row))"
                />
                <ElDropdown trigger="click" placement="bottom-end" @command="(cmd: string) => onRowCommand(cmd, rowOf(row))">
                  <ReButton layout="square" size="mini" icon="MoreFilled" tip="更多操作" />
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem command="clone">克隆服务</ElDropdownItem>
                      <ElDropdownItem command="oper-log">操作日志</ElDropdownItem>
                      <ElDropdownItem v-if="isRoomNode(rowOf(row))" command="room">打开房间工作台</ElDropdownItem>
                      <ElDropdownItem command="copy-name" divided>复制名称</ElDropdownItem>
                      <ElDropdownItem command="copy-listen">复制监听地址</ElDropdownItem>
                      <ElDropdownItem command="copy-url" :disabled="!rowOf(row).serverUrl">复制访问地址</ElDropdownItem>
                      <ElDropdownItem command="delete" divided>删除服务</ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </div>
            </template>
          </ReTable>
        </div>
      </section>

      <!-- ============ 右栏：详情 ============ -->
      <aside class="svc-detail">
        <div class="svc-detail__head">
          <span>服务详情</span>
          <ReButton
            v-if="selectedId"
            layout="square"
            size="mini"
            icon="Close"
            tip="关闭详情"
            @click="selectedId = null"
          />
        </div>
        <div v-if="selectedId" class="svc-detail__body">
          <ScServerDetailDrawer
            embedded
            :node-id="selectedId"
            :filter-types="vm.filterTypes"
            @changed="vm.refresh()"
            @open-detail-page="vm.openDetailPage"
          />
        </div>
        <div v-else class="svc-detail__empty">
          <ReEmpty description="点选左侧任一服务，查看详情与过滤器链" :image-size="72" />
        </div>
      </aside>
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

    <!-- P2P 房间：关闭抽屉即卸载，RoomView 自己 leave 并断开 WebSocket -->
    <ReDrawer v-model="roomVisible" title="P2P 房间" :size="'88%'" :footer-hidden="true" close-only>
      <RoomView :room-id="roomId" :server-url="roomServerUrl" @leave="roomVisible = false" />
    </ReDrawer>

    <!-- 节点操作日志：行内「更多」进入，只读分页 -->
    <ReDialog
      v-model="operLogVisible"
      width="960px"
      :title="operLogNode ? `操作日志 · ${operLogNode.name}` : '操作日志'"
      :footer-hidden="true"
      destroy-on-close
    >
      <div class="svc-operlog">
        <ScServerOperLogPanel :node-id="operLogNode?.id ?? null" :node-name="operLogNode?.name" />
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* 三列主体：左栏 214px / 中栏表格 / 右栏详情 360px
   页边距交给宿主（App 的 .main 已有 20/24），这里不再叠一层 padding；段间 10px 与设备资产同档 */
.svc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: var(--bg-page);
}

.svc-notice {
  margin: 0;
}

/* ===== 第一行：四张独立统计卡 ===== */
.svc-stats {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.svc-stat {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 12px 9px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.18s var(--ease-out, ease);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 11.5px;
    color: var(--text-secondary);
  }

  p {
    margin: 0;
    font-size: 11px;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 顶部 3px 色条：卡片 overflow:hidden 已经裁掉圆角外的部分 */
.svc-stat__accent {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: var(--pulse-offline);

  &.is-all {
    background: var(--brand-500);
  }

  &.is-run {
    background: var(--pulse-online);
  }

  &.is-err {
    background: var(--pulse-alarm);
  }
}

.svc-stat__value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.svc-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 10px;
}

/* ===== 左栏 ===== */
.svc-rail {
  flex: none;
  width: 214px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  padding-right: 2px;
}

.svc-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 10px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.svc-card__head {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.svc-card__warn {
  margin: 0;
  font-size: 11.5px;
  color: var(--status-warning, var(--pulse-alarm));
}

.svc-tips {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-tertiary);

  li {
    position: relative;
    padding-left: 10px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.62em;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--border-strong, var(--text-tertiary));
    }
  }
}

/* 状态点：运行中呼吸，异常闪烁，其余静止（与 koi 的 pdot 口径一致） */
.svc-kpi__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pulse-offline);

  &.is-all {
    background: var(--brand-500);
  }

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

.svc-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  font: inherit;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;

  b {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }

  &:hover {
    background: var(--bg-fill);
  }

  &.on {
    background: var(--brand-50);
    border-color: var(--brand-100);
    color: var(--brand-600);
    font-weight: 600;
  }
}

/* ===== 中栏 ===== */
.svc-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* 筛选带固定一行：空间不够先压搜索框，再压下拉，右侧按钮不换行也不被压缩 */
.svc-toolbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: nowrap;
}

.svc-search {
  flex: 1 1 180px;
  min-width: 0;
  max-width: 300px;
}

.svc-pick {
  flex: 0 1 128px;
  min-width: 100px;
}

.svc-gap {
  flex: 1;
}

.svc-table {
  flex: 1;
  min-height: 0;
  padding: 0 4px 4px;
}

/* 单元格 */
.svc-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);

  &.danger {
    color: var(--status-error);
  }

  &.success {
    color: var(--status-success);
  }

  &.info {
    color: var(--text-secondary);
  }
}

.svc-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;

  b {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.svc-name__sub {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.svc-mono {
  font-family: ui-monospace, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.svc-filters {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  padding: 0 6px;
  border-radius: var(--radius-sm);
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  color: var(--brand-600);
  font-size: 11px;
  font-variant-numeric: tabular-nums;

  &.is-none {
    background: var(--bg-fill);
    border-color: var(--border-subtle);
    color: var(--text-tertiary);
  }
}

.svc-ops {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* ===== 右栏 ===== */
.svc-detail {
  flex: none;
  width: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.svc-detail__head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 10px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);

  span {
    flex: 1;
  }
}

.svc-detail__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  /* 嵌入正文自己带 14px 内边距与滚动条，这里只给高度参照，避免双重留白 */
  overflow: hidden;
}

.svc-detail__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* 操作日志弹框：面板内部按 100% 高铺开，ReTable 的高度才有参照 */
.svc-operlog {
  display: flex;
  flex-direction: column;
  height: 520px;
  min-height: 0;
}

/* ===== 窄屏：先收左栏，再收右栏，中栏始终保住 ===== */
@media (max-width: 900px) {
  .svc-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1320px) {
  .svc-detail {
    width: 320px;
  }
}

@media (max-width: 1180px) {
  .svc-rail {
    display: none;
  }
}

@media (max-width: 980px) {
  .svc-detail {
    display: none;
  }
}
</style>
