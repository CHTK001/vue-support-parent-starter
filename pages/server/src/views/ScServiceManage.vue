<script setup lang="ts">
/**
 * 服务管理 —— 协议服务器节点（Server 接口 + ServerFilter 插件）
 *
 * 主页面职责：
 *   1. Server 节点增删改查，协议下拉取自后端 /protocols（内置四类 + Server SPI 动态发现）
 *   2. 启停、热更新（过滤器链就地替换，不中断服务）
 *   3. 打开编辑抽屉做过滤器编排（左 SPI → 右已选，可重复添加）
 *   4. 打开详情抽屉查看运行态与过滤器链，并支持单过滤器热启停 / 热改参
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { message } from '@repo/core';
import { useRouter } from 'vue-router';
import {
  listServerNodes,
  startServerNode,
  stopServerNode,
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
    <ReSectionHead class="page-head" title="服务管理" description="基于 Server 接口的协议服务器节点编排，支持 ServerFilter 插件挂载与热更新">
      <template #actions>
        <ReButton show-text icon="Plus" type="primary" @click="openCreate">新增服务</ReButton>
        <ReButton show-text icon="Refresh" @click="refresh">刷新</ReButton>
      </template>
    </ReSectionHead>

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

    <!-- 运行概览 -->
    <div class="stats-grid">
      <ReStatCard size="compact" title="服务总数" :value="stats.total" icon-color="var(--metric-cpu)">
        <template #icon><Monitor /></template>
        <template #value><ReCountup :value="stats.total" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="运行中" :value="stats.running" icon-color="var(--status-success)">
        <template #icon><CircleCheckFilled /></template>
        <template #value><ReCountup :value="stats.running" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="已停止" :value="stats.stopped" icon-color="var(--text-tertiary)">
        <template #icon><VideoPause /></template>
        <template #value><ReCountup :value="stats.stopped" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="异常" :value="stats.error" icon-color="var(--status-error)">
        <template #icon><CircleCloseFilled /></template>
        <template #value><ReCountup :value="stats.error" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="已挂插件" :value="stats.plugins" icon-color="var(--metric-jvm)">
        <template #icon><Connection /></template>
        <template #value><ReCountup :value="stats.plugins" :duration="600" /></template>
      </ReStatCard>
    </div>

    <!-- 筛选工具条 -->
    <div class="page-toolbar">
      <ReInput v-model="keyword" placeholder="搜索名称 / 协议 / 监听地址" clearable prefix-icon="Search" style="width: 260px" />
      <ReSelect v-model="filterProtocol" placeholder="全部协议" clearable :data="protocolOptions" style="width: 240px" />
      <span class="dim">共 {{ visibleNodes.length }} / {{ stats.total }} 个服务</span>
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
      <ReTableColumn label="操作" width="330" fixed="right">
        <template #default="{ row }">
          <span @click.stop>
            <ReButton
              v-if="row.status !== 'RUNNING'"
              show-text
              icon="VideoPlay"
              type="success"

              :loading="actingId === row.id"
              @click="onStart(row)"
            >启动</ReButton>
            <ReButton
              v-else
              show-text
              icon="VideoPause"
              type="warning"

              :loading="actingId === row.id"
              @click="onStop(row)"
            >停止</ReButton>
            <ReButton show-text icon="View" type="primary" @click="openDetail(row)">详情</ReButton>
            <ReButton show-text icon="Edit" @click="openEdit(row)">编辑</ReButton>
            <ReButton show-text icon="Delete" type="danger" :loading="actingId === row.id" @click="onDelete(row)">删除</ReButton>
          </span>
        </template>
      </ReTableColumn>
    </ReTable>

    <ScServerFormDrawer
      v-model="formVisible"
      :node="editingNode"
      :protocols="protocols"
      :filter-types="filterTypes"
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
  color: var(--status-error);
  font-size: 12px;
  line-height: 1.4;
  /* 单行截断：原因常有上百字（端口重试耗时、堆栈片段），
     不截断会把整行撑到十几行高，表格没法看 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.load-notice {
  margin: 0;
}
</style>
