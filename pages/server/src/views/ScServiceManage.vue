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
import { computed, onMounted, ref } from 'vue';
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

/** 统计 */
const stats = computed(() => {
  let running = 0;
  let stopped = 0;
  let error = 0;
  let plugins = 0;
  nodes.value.forEach(n => {
    if (n.status === 'RUNNING') running += 1;
    else if (n.status === 'ERROR') error += 1;
    else stopped += 1;
    plugins += n.filters?.length ?? 0;
  });
  return { running, stopped, error, plugins, total: nodes.value.length };
});

/** 过滤后的列表 */
const visibleNodes = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return nodes.value.filter(n => {
    if (filterProtocol.value && n.protocol !== filterProtocol.value) return false;
    if (!kw) return true;
    return `${n.name} ${n.protocol} ${n.protocolDesc ?? ''} ${n.host ?? ''} ${n.port ?? ''}`
      .toLowerCase()
      .includes(kw);
  });
});

/** 协议下拉选项（内置 + SPI 动态，SPI 项加后缀标识） */
const protocolOptions = computed(() =>
  protocols.value.map(p => ({
    label: `${p.alias}${p.spi ? '（SPI）' : ''} - ${p.desc}`,
    value: p.alias,
  })),
);

onMounted(refresh);

async function refresh() {
  loading.value = true;
  try {
    const [nodeList, protocolList, filterList] = await Promise.all([
      listServerNodes(),
      listProtocols().catch(() => []),
      listFilterTypes().catch(() => []),
    ]);
    nodes.value = nodeList ?? [];
    protocols.value = protocolList ?? [];
    filterTypes.value = filterList ?? [];
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/** 状态展示映射 */
const statusText: Record<string, string> = { RUNNING: '运行中', STOPPED: '已停止', ERROR: '异常' };
const statusType: Record<string, 'success' | 'info' | 'danger'> = {
  RUNNING: 'success',
  STOPPED: 'info',
  ERROR: 'danger',
};

/** 协议展示：SPI 协议取描述，内置取中文描述 */
function protocolLabel(row: ServerNodeView) {
  return row.protocolDesc || row.protocol;
}

/** 监听地址展示 */
function listenText(row: ServerNodeView) {
  return `${row.host || '0.0.0.0'}:${row.port ?? '-'}`;
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
    message.error((e as Error).message);
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
    message.error((e as Error).message);
  } finally {
    actingId.value = null;
  }
}

async function onDelete(row: ServerNodeView) {
  await message.confirm(`确认删除服务「${row.name}」？运行中的实例会先被停止。`, '删除服务');
  actingId.value = row.id;
  try {
    await deleteServerNode(row.id);
    message.success('已删除');
    await refresh();
  } catch (e) {
    message.error((e as Error).message);
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

    <!-- 运行概览 -->
    <div class="stats-grid">
      <ReStatCard title="服务总数" :value="stats.total" icon-color="var(--metric-cpu)">
        <template #icon><Monitor /></template>
        <template #value><ReCountup :value="stats.total" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard title="运行中" :value="stats.running" icon-color="var(--status-success)">
        <template #icon><CircleCheckFilled /></template>
        <template #value><ReCountup :value="stats.running" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard title="已停止" :value="stats.stopped" icon-color="var(--text-tertiary)">
        <template #icon><VideoPause /></template>
        <template #value><ReCountup :value="stats.stopped" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard title="异常" :value="stats.error" icon-color="var(--status-error)">
        <template #icon><CircleCloseFilled /></template>
        <template #value><ReCountup :value="stats.error" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard title="已挂插件" :value="stats.plugins" icon-color="var(--metric-jvm)">
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
      <ReTableColumn label="状态" width="96">
        <template #default="{ row }">
          <span class="status-cell">
            <ReStatusIndicator
              :type="row.status === 'RUNNING' ? 'success' : row.status === 'ERROR' ? 'danger' : 'info'"
              :pulse="row.status === 'RUNNING'"
            />
            {{ statusText[row.status] || row.status }}
          </span>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="name" label="服务名称" min-width="140" show-overflow-tooltip />
      <ReTableColumn label="协议" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <ReTag :type="row.protocol && String(row.protocol).indexOf('proxy') >= 0 ? 'warning' : 'primary'">
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
        <template #default="{ row }"><span class="mono">{{ listenText(row) }}</span></template>
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
</style>
