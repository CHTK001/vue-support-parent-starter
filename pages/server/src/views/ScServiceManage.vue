<script setup lang="ts">
/**
 * 服务管理 —— 协议服务器节点（Server 接口 + ServerFilter 插件）
 *
 * 主页面职责：
 *   1. Server 节点增删改查，协议下拉取自后端 /protocols（内置四类 + Server SPI 动态发现）
 *   2. 启停、热更新（过滤器链就地替换，不中断服务）
 *   3. 打开编辑抽屉做过滤器编排（左 SPI → 右已选，可重复添加）
 *   4. 打开详情抽屉查看运行态与过滤器链，并支持单过滤器热启停 / 热改参
 *
 * 视觉（对齐「代理管理」「账号管理」页）：顶部 ReSectionHead 已删除——页面标题由
 * 外壳面包屑承担，其中的「新增服务 / 刷新」合并到筛选行右侧、统一改成图标 + tip；
 * 统计卡改用 ReStatCard 的 icon 属性（原先用 #icon 插槽塞裸图标，绕过了组件自带的
 * 渐变图标圆）；数据表格吃满剩余高度、表体内部滚动。
 *
 * ⚠ 统计卡的 icon 必须是脚本作用域里的**组件**（ReStatCard 内部走
 * {@code <component :is="icon" />}），所以图标必须显式 import —— 全局注册的组件
 * 在模板表达式里取不到标识符，写成 {@code :icon="Monitor"} 会静默渲染成 undefined。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CircleCheckFilled, CircleCloseFilled, Connection, Monitor, VideoPause } from '@element-plus/icons-vue';
import { message } from '@repo/core';
import { useRouter } from 'vue-router';
import {
  listServerNodes,
  startServerNode,
  stopServerNode,
  restartServerNode,
  deleteServerNode,
  listProtocols,
  listFilterTypes,
  type ProtocolMeta,
  type FilterTypeMeta,
  type ServerNodeView,
} from '../api';
import ScServerFormDrawer from '../components/ScServerFormDrawer.vue';
import ScServerDetailDrawer from '../components/ScServerDetailDrawer.vue';
import { resolveFilterDetail } from '../utils/filterDetail';
import { confirmThen } from '../utils/confirmThen';
import { createAutoRefresh, DEFAULT_AUTO_REFRESH } from '../utils/autoRefresh';
import { describeMetaLoad, type MetaLoadNotice } from '../utils/metaLoad';
import {
  buildProtocolOptions,
  deriveStatusMeta,
  filterNodes,
  formatListenText,
  isProxyProtocol,
  summarizeNodes,
} from '../utils/nodeList';

const router = useRouter();

/** 节点列表 */
const nodes = ref<ServerNodeView[]>([]);
/** 协议元数据（下拉用） */
const protocols = ref<ProtocolMeta[]>([]);
/** 插件元数据（编辑抽屉用） */
const filterTypes = ref<FilterTypeMeta[]>([]);
/** 加载态 */
const loading = ref(false);
/** 操作中的节点 id（按钮 loading） */
const actingId = ref<number | null>(null);

/** 编辑抽屉 */
const formVisible = ref(false);
const editingNode = ref<ServerNodeView | null>(null);

/** 详情抽屉 */
const detailVisible = ref(false);
const detailNodeId = ref<number | null>(null);

/** 关键字过滤 */
const keyword = ref('');
/** 协议过滤 */
const filterProtocol = ref<string>('');
/** 首屏/刷新的加载提示（协议或插件元数据失败时必须出声，不能静默变空） */
const loadNotice = ref<MetaLoadNotice>({ show: false, tone: 'warning', text: '' });

/** 统计 */
const stats = computed(() => summarizeNodes(nodes.value));

/** 过滤后的列表 */
const visibleNodes = computed(() =>
  filterNodes(nodes.value, { keyword: keyword.value, protocol: filterProtocol.value }),
);

/** 协议下拉选项（内置 + SPI 动态，SPI 项加后缀标识） */
const protocolOptions = computed(() => buildProtocolOptions(protocols.value));

/** 传给抽屉的名称列表（编辑时排除自身，克隆时排除克隆源） */
const existingNamesForDrawer = computed(() => {
  return nodes.value
    .filter(n => n.id !== editingNode.value?.id)
    .map(n => n.name);
});

/**
 * 把任意异常压成一句可展示的短文本。
 *
 * 后端失败时抛出的是 `{code,msg}` 形态的对象而不是 Error，直接
 * `(e as Error).message` 会渲染出 `[object Object]`。
 */
function reasonText(e: unknown): string {
  if (e instanceof Error && e.message) {
    return e.message;
  }
  if (e && typeof e === 'object' && 'msg' in e) {
    const msg = (e as { msg?: unknown }).msg;
    if (typeof msg === 'string' && msg) {
      return msg;
    }
  }
  return typeof e === 'string' && e ? e : '未知错误';
}

onMounted(() => {
  void refresh();
  // 自动刷新：节点可能因为端口被占/进程被杀而变成 ERROR，
  // 只在 mounted 拉一次的话页面会一直显示过期的好消息
  autoRefresh.start();
  // 切回标签页立刻补一次，否则用户看到的是几分钟前的状态
  document.addEventListener('visibilitychange', onVisibilityChange);
});

onUnmounted(() => {
  autoRefresh.stop();
  document.removeEventListener('visibilitychange', onVisibilityChange);
});

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    void refresh(true);
  }
}

/**
 * 拉取列表与元数据。
 *
 * @param silent 静默模式：自动刷新用。不弹 toast —— 每 10 秒一次的话
 *   后端故障期间会把界面糊满错误提示，反而看不见真正的问题。
 *   失败信息由 `loadNotice` 承载。
 */
async function refresh(silent = false) {
  loading.value = true;
  try {
    // 三个请求独立成败：任一失败都不能让另外两个的结果被一起丢掉，
    // 因此逐个 settle 而不是整体 await。
    const [nodesResult, protocolsResult, filtersResult] = await Promise.allSettled([
      listServerNodes(),
      listProtocols(),
      listFilterTypes(),
    ]);

    if (nodesResult.status === 'fulfilled') {
      nodes.value = nodesResult.value ?? [];
    }
    if (protocolsResult.status === 'fulfilled') {
      protocols.value = protocolsResult.value ?? [];
    }
    if (filtersResult.status === 'fulfilled') {
      filterTypes.value = filtersResult.value ?? [];
    }

    loadNotice.value = describeMetaLoad({
      nodesOk: nodesResult.status === 'fulfilled',
      protocolsOk: protocolsResult.status === 'fulfilled',
      filtersOk: filtersResult.status === 'fulfilled',
      nodesError: nodesResult.status === 'rejected' ? reasonText(nodesResult.reason) : undefined,
      protocolsError:
        protocolsResult.status === 'rejected' ? reasonText(protocolsResult.reason) : undefined,
      filtersError:
        filtersResult.status === 'rejected' ? reasonText(filtersResult.reason) : undefined,
    });

    // 自动刷新时把错误交给 autoRefresh 记一次失败以触发退避，
    // 但不弹提示；手动刷新才提示
    if (!silent && nodesResult.status === 'rejected') {
      message.error(reasonText(nodesResult.reason));
    }
    if (nodesResult.status === 'rejected') {
      throw nodesResult.reason;
    }
  } catch (e) {
    if (!silent) {
      message.error(reasonText(e));
    }
  } finally {
    loading.value = false;
  }
}

/** 自动刷新句柄 */
const autoRefresh = createAutoRefresh(() => refresh(true), DEFAULT_AUTO_REFRESH);

/** 协议展示：SPI 协议取描述，内置取中文描述 */
function protocolLabel(row: ServerNodeView) {
  return row.protocolDesc || row.protocol;
}

function openCreate() {
  editingNode.value = null;
  formVisible.value = true;
}

function openEdit(row: ServerNodeView) {
  editingNode.value = row;
  formVisible.value = true;
}

function openDetail(row: ServerNodeView) {
  detailNodeId.value = row.id;
  detailVisible.value = true;
}

/** 克隆节点：复制全部字段，名称自动加 -clone 后缀，列表校验时排除自身 */
function openClone(row: ServerNodeView) {
  editingNode.value = {
    ...row,
    id: 0,
    name: `${row.name}-clone`,
    status: 'STOPPED',
    error: undefined,
    serverUrl: undefined,
    enabled: row.enabled ?? 0,
  };
  formVisible.value = true;
}

async function onStart(row: ServerNodeView) {
  actingId.value = row.id;
  try {
    await startServerNode(row.id);
    message.success(`服务「${row.name}」已启动`);
    await refresh();
  } catch (e) {
    message.error(reasonText(e));
  } finally {
    actingId.value = null;
  }
}

async function onStop(row: ServerNodeView) {
  actingId.value = row.id;
  try {
    await stopServerNode(row.id);
    message.success(`服务「${row.name}」已停止`);
    await refresh();
  } catch (e) {
    message.error(reasonText(e));
  } finally {
    actingId.value = null;
  }
}

async function onRestart(row: ServerNodeView) {
  actingId.value = row.id;
  try {
    await restartServerNode(row.id);
    message.success(`服务「${row.name}」已重启`);
    await refresh();
  } catch (e) {
    message.error(reasonText(e));
  } finally {
    actingId.value = null;
  }
}

/**
 * 删除节点。
 *
 * 用 `confirmThen` 而不是直接 `await message.confirm`：后者在「取消」时是
 * **reject(false)**，直接 await 会让取消动作变成一个未捕获的 Promise
 * rejection —— 每取消一次刷一条红字，若全局挂了 unhandledrejection 上报，
 * 用户刚点「取消」还会收到一个「系统繁忙」提示。
 *
 * 这里的 if 是必要的：布尔语义下不判断返回值就等于把「取消」当「确认」。
 */
async function onDelete(row: ServerNodeView) {
  const confirmed = await confirmThen(
    message.confirm,
    `确认删除服务「${row.name}」？运行中的实例会先被停止。`,
    '删除服务',
  );
  if (!confirmed) {
    return;
  }
  actingId.value = row.id;
  try {
    await deleteServerNode(row.id);
    message.success('已删除');
    await refresh();
  } catch (e) {
    message.error(reasonText(e));
  } finally {
    actingId.value = null;
  }
}

/**
 * 打开插件深度查看页（不同实现不同页面）。
 *
 * node 型（如 file-storage）的深度页面由插件自身的 HTTP 服务托管，新窗口直开节点地址；
 * route 型（如 service-discovery）由宿主应用托管，先校验路由存在再跳，避免死链。
 */
function openDetailPage(row: ServerNodeView, index: number) {
  const filter = row.filters?.[index];
  if (!filter) return;
  const meta = filterTypes.value.find(f => f.type === (filter.type || filter.name));
  const target = resolveFilterDetail(meta, filter, row);
  if (!target) {
    message.info('该插件未提供深度查看页');
    return;
  }
  if (target.kind === 'unavailable') {
    message.info(target.reason);
    return;
  }
  if (target.kind === 'node') {
    window.open(target.url, '_blank', 'noopener');
    return;
  }
  // 宿主应用可能未挂载目标页面（如 filesystem 页未接入），先校验路由再跳，避免死链
  if (!router.resolve(target.path).matched.length) {
    message.info(`当前应用未接入该插件的深度查看页（${target.path}）`);
    return;
  }
  router.push(target.path);
}
</script>

<template>
  <div class="service-manage sc-page">
    <!-- 首屏/刷新降级提示：协议或插件元数据失败时必须出声，
         否则用户只会看到「协议下拉是空的」，无从判断是故障还是无权限 -->
    <el-alert
      v-if="loadNotice.show"
      :type="loadNotice.tone"
      :title="loadNotice.text"
      show-icon
      :closable="false"
      class="load-notice"
    />

    <!-- 运行概览：ReStatCard 紧凑档，icon 走属性（用组件自带的渐变图标圆）。
         原 hero 的说明文案改以 title 悬浮保留，不丢信息也不再独占一块纵向空间。 -->
    <div class="stats-grid" title="基于 Server 接口的协议服务器节点编排，支持 ServerFilter 插件挂载与热更新">
      <ReStatCard size="compact" title="服务总数" :value="stats.total" desc="Server 节点" :icon="Monitor" icon-color="var(--metric-cpu)">
        <template #value><ReCountup :value="stats.total" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard
        size="compact"
        title="运行中"
        :value="stats.running"
        :desc="stats.total ? `占比 ${Math.round((stats.running / stats.total) * 100)}%` : '暂无服务'"
        :icon="CircleCheckFilled"
        icon-color="var(--status-success)"
      >
        <template #value><ReCountup :value="stats.running" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="已停止" :value="stats.stopped" desc="可手动或自动启动" :icon="VideoPause" icon-color="var(--text-tertiary)">
        <template #value><ReCountup :value="stats.stopped" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard
        size="compact"
        title="异常"
        :value="stats.error"
        :desc="stats.unknown ? `另有 ${stats.unknown} 个状态未知` : '需查看失败原因'"
        :icon="CircleCloseFilled"
        icon-color="var(--status-error, var(--el-color-danger, #ff4c4c))"
      >
        <template #value><ReCountup :value="stats.error" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="已挂插件" :value="stats.plugins" desc="ServerFilter 链" :icon="Connection" icon-color="var(--metric-jvm)">
        <template #value><ReCountup :value="stats.plugins" :duration="600" /></template>
      </ReStatCard>
    </div>

    <!-- 筛选工具条整行进 card：搜索框、协议下拉、计数与操作按钮同属「一组工具」。
         此前只把两个输入框圈起来，计数文字和操作按钮留在卡外，看上去像
         「卡片 + 飘着的按钮」两件事；整行一张卡后与上方统计卡、下方表格
         形成 卡片-卡片-卡片-表格 的稳定节奏。 -->
    <div class="page-toolbar">
      <ReInput
        v-model="keyword"
        aria-label="搜索服务"
        placeholder="搜索名称 / 协议 / 监听地址"
        clearable
        prefix-icon="Search"
        class="tb-search"
      />
      <ReSelect
        v-model="filterProtocol"
        aria-label="按协议筛选"
        placeholder="全部协议"
        clearable
        :data="protocolOptions"
        class="tb-proto"
      />
      <span class="dim tb-meta">共 {{ visibleNodes.length }} / {{ stats.total }} 个服务</span>
      <div class="tb-ops">
        <ReButton icon="Plus" layout="square" type="primary" tip="新增服务" @click="openCreate" />
        <ReButton icon="Refresh" layout="square" tip="刷新" :loading="loading" @click="refresh" />
      </div>
    </div>

    <!-- 空状态引导：绝对覆盖在表格上方，表格始终渲染 -->
    <div style="position: relative; min-height: 0; flex: 1 1 0;">
      <div v-if="!loading && !visibleNodes.length && !keyword && !filterProtocol" class="empty-guide">
        <div class="eg-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="var(--el-color-primary-light-9)" />
            <path d="M24 14v20M14 24h20" stroke="var(--el-color-primary)" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </div>
        <div class="eg-title">暂无服务</div>
        <div class="eg-desc">点击下方按钮创建第一个 Server 节点</div>
        <ReButton show-text icon="Plus" type="primary" @click="openCreate">新增服务</ReButton>
      </div>

    <ReTable
      :data="visibleNodes"
      :loading="loading"
      border
      stripe
      size="default"
      :pagination="false"
      :toolbar="false"
      empty-text="暂无服务，点击右上角「新增服务」创建"
      @row-click="openDetail"
    >
      <!-- 状态列：失败原因直接展示。
         后端 ServerNodeView.error 一直在返回，但列表从不渲染它 ——
         运维只看到一排红点，得逐个点开详情才知道为什么坏，排障入口白白浪费。 -->
      <ReTableColumn label="状态" min-width="220">
        <template #default="{ row }">
          <div class="status-cell">
            <span class="status-line">
              <ReStatusIndicator
                :type="deriveStatusMeta(row).tone"
                :pulse="deriveStatusMeta(row).pulse"
              />
              {{ deriveStatusMeta(row).text }}
            </span>
            <span
              v-if="deriveStatusMeta(row).reason"
              class="status-reason"
              :title="deriveStatusMeta(row).reason"
            >{{ deriveStatusMeta(row).reason }}</span>
          </div>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="name" label="服务名称" min-width="140" show-overflow-tooltip />
      <ReTableColumn label="协议" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <ReTag :type="isProxyProtocol(row.protocol) ? 'warning' : 'primary'">
            {{ protocolLabel(row) }}
          </ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="引擎" width="80">
        <template #default="{ row }">
          <ReText type="info">{{ row.engine || '-' }}</ReText>
        </template>
      </ReTableColumn>
      <ReTableColumn label="监听地址" min-width="150">
        <template #default="{ row }"><span class="mono">{{ formatListenText(row) }}</span></template>
      </ReTableColumn>
      <ReTableColumn label="插件" width="90">
        <template #default="{ row }">
          <ReTag :type="(row.filters?.length ?? 0) > 0 ? 'success' : 'info'">
            {{ row.filters?.length ?? 0 }}
          </ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="访问地址" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <ReText v-if="row.serverUrl" type="primary">{{ row.serverUrl }}</ReText>
          <span v-else class="dim">-</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="自动启用" width="90">
        <template #default="{ row }">
          <ReTag :type="row.enabled === 1 ? 'success' : 'info'">{{ row.enabled === 1 ? '是' : '否' }}</ReTag>
        </template>
      </ReTableColumn>
      <!-- 操作列：ERROR 重启 + 启停 + 详情 + 编辑 + 克隆 + 删除 -->
      <ReTableColumn label="操作" width="280" fixed="right" align="right">
        <template #default="{ row }">
          <span class="ops" @click.stop>
            <!-- ERROR 节点：重启优先 -->
            <ReButton
              v-if="row.status === 'ERROR'"
              icon="Refresh"
              layout="square"
              type="warning"
              tip="重启"
              :loading="actingId === row.id"
              @click="onRestart(row)"
            />
            <ReButton
              v-else-if="row.status !== 'RUNNING'"
              icon="VideoPlay"
              layout="square"
              type="success"
              tip="启动"
              :loading="actingId === row.id"
              @click="onStart(row)"
            />
            <ReButton
              v-else
              icon="VideoPause"
              layout="square"
              type="warning"
              tip="停止"
              :loading="actingId === row.id"
              @click="onStop(row)"
            />
            <ReButton icon="View" layout="square" type="primary" tip="详情" @click.stop="openDetail(row)" />
            <ReButton icon="Edit" layout="square" tip="编辑" @click="openEdit(row)" />
            <ReButton icon="Copy" layout="square" tip="克隆" @click="openClone(row)" />
            <ReButton
              icon="Delete"
              layout="square"
              type="danger"
              tip="删除"
              :loading="actingId === row.id"
              @click="onDelete(row)"
            />
          </span>
        </template>
      </ReTableColumn>
    </ReTable>
    </div>

    <ScServerFormDrawer
      v-model="formVisible"
      :node="editingNode"
      :protocols="protocols"
      :filter-types="filterTypes"
      :existing-names="existingNamesForDrawer"
      :clone-source="editingNode?.id === 0 ? editingNode : null"
      @saved="refresh"
    />

    <ScServerDetailDrawer
      v-model="detailVisible"
      :node-id="detailNodeId"
      :filter-types="filterTypes"
      @changed="refresh"
      @open-detail-page="openDetailPage"
    />
  </div>
</template>

<style scoped lang="scss">
.service-manage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* 外层 sc-page 全仓没有任何样式定义、不提供高度，所以必须自己撑满：
     height:100% 让高度由外壳内容区给出，min-height:0 允许 flex 子项收缩，
     少了它长列表会把页面顶高、外层出滚动条（实测未加时本页只有内容高 235px） */
  height: 100%;
  min-height: 0;
}

/* 统计卡与工具条固定高，只有表格吃满剩余高度。
   注意 .stats-grid / .page-toolbar 原先全仓没有任何样式定义，
   统计卡是 5 个块级 div 直接纵向堆叠 —— 这里补上栅格与工具条布局。 */
.stats-grid,
.page-toolbar,
.load-notice {
  flex: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

/* 表格伸展：basis 0 让 flex 纯按剩余空间分配，min-height:0 必须置 */
.service-manage > :deep(.re-table) {
  flex: 1 1 0;
  min-height: 0;
}

/* 筛选工具条：整行一张卡（搜索框 + 协议下拉 + 计数 + 操作按钮）。
   样式走 EP 语义令牌而非 styles/page.css 的 .panel —— 那份 tokens.css
   只有 :root、无暗色变体，暗色模式下会停在亮色值。 */
.page-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 8px 12px;
}
.tb-search { width: 260px; }
.tb-proto { width: 240px; }
/* 计数推到右侧，把「筛选条件」和「结果概览 + 操作」在卡内也分出左右两区 */
.tb-meta { margin-left: auto; white-space: nowrap; }
/* 与筛选之间用竖线分隔，视觉上区分「筛选」与「操作」 */
.tb-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--border-subtle);
}
/* 操作列图标组：统一间距 + 明确可点手势，避免纯图标看起来像静态徽标 */
.ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ops :deep(.re-button) { cursor: pointer; }
@media (max-width: 900px) {
  .page-toolbar { flex-wrap: wrap; }
  .tb-search,
  .tb-proto { width: 100%; }
  .tb-meta { margin-left: 0; }
  .tb-ops { padding-left: 0; border-left: none; }
}

/* 状态列改成上下两行：状态灯一行，失败原因一行。
   原因单行截断 + title 悬浮全文，避免长堆栈把整张表撑变形。 */
.status-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.status-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-reason {
  /* 主 token 缺失时退到 Element Plus 危险色，再退到硬编码，保证错误原因永远标红可见 */
  color: var(--status-error, var(--el-color-danger, #ff4c4c));
  font-size: 12px;
  line-height: 1.4;
  /* 单行截断：原因常有上百字（端口重试耗时、堆栈片段），
     不截断会把整行撑到十几行高，表格没法看 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-guide {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  text-align: center;
  pointer-events: none;
}
.empty-guide > * { pointer-events: auto; }
.eg-icon svg { width: 56px; height: 56px; }
.eg-title { font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); }
.eg-desc { font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 4px; }

.load-notice {
  margin: 0;
}
</style>
