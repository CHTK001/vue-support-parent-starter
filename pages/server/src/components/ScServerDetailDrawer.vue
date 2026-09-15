<script setup lang="ts">
/**
 * 服务管理 —— Server 节点详情抽屉。
 *
 * 展示运行态与过滤器链；对运行中的服务提供：
 *   - 单个过滤器热启停（/filters/{i}/toggle）
 *   - 单个过滤器参数热更新（/filters/{i}/params，进入该实现的配置页）
 *   - 插件深度查看页入口（不同实现不同页面，如 file-storage → 文件管理器）
 */
import { computed, ref, watch } from 'vue';
import { message } from '@repo/core';
import {
  getServerNode,
  startServerNode,
  stopServerNode,
  toggleServerFilter,
  updateServerFilterParams,
  type FilterTypeMeta,
  type ServerNodeView,
} from '../api';
import ScFilterConfigPanel from './ScFilterConfigPanel.vue';
import { hasFilterDetail } from '../utils/filterDetail';

const props = defineProps<{
  /** 节点 id */
  nodeId: number | null;
  /** 插件元数据 */
  filterTypes: FilterTypeMeta[];
}>();

const emit = defineEmits<{
  (e: 'changed'): void;
  (e: 'open-detail-page', row: ServerNodeView, index: number): void;
}>();

const visible = defineModel<boolean>({ default: false });

/** 视图：详情 / 单个插件配置页 */
const view = ref<'detail' | 'filter'>('detail');
/** 节点数据 */
const node = ref<ServerNodeView | null>(null);
/** 加载中 */
const loading = ref(false);
/** 操作中 */
const acting = ref(false);
/** 当前配置的过滤器下标 */
const activeIndex = ref(0);
/** 参数草稿 */
const filterParams = ref<Record<string, string>>({});

/** 状态文案 */
const statusText: Record<string, string> = { RUNNING: '运行中', STOPPED: '已停止', ERROR: '异常' };
const statusType: Record<string, 'success' | 'info' | 'danger'> = {
  RUNNING: 'success',
  STOPPED: 'info',
  ERROR: 'danger',
};

/** 是否运行中 */
const isLive = computed(() => node.value?.status === 'RUNNING');

/** 当前配置的插件类型 */
const activeFilterType = computed(() => {
  const f = node.value?.filters?.[activeIndex.value];
  return f?.type || f?.name || '';
});

/** 当前配置的插件元数据 */
const activeMeta = computed<FilterTypeMeta | null>(() =>
  props.filterTypes.find(f => f.type === activeFilterType.value) || null,
);

watch(visible, open => {
  if (!open) return;
  view.value = 'detail';
  load();
});

watch(
  () => props.nodeId,
  () => {
    if (visible.value) load();
  },
);

async function load() {
  if (props.nodeId == null) return;
  loading.value = true;
  try {
    node.value = await getServerNode(props.nodeId);
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/** 插件元数据 */
function metaOf(index: number): FilterTypeMeta | undefined {
  const f = node.value?.filters?.[index];
  if (!f) return undefined;
  return props.filterTypes.find(t => t.type === (f.type || f.name));
}

/** 该插件是否提供深度查看入口（node 型 / route 型都算） */
function hasDetail(index: number): boolean {
  return hasFilterDetail(metaOf(index));
}

/** 过滤器参数条目 */
function paramEntries(index: number): Array<{ key: string; value: string }> {
  const params = node.value?.filters?.[index]?.params || {};
  return Object.entries(params).map(([key, value]) => ({ key, value: String(value) }));
}

async function onStart() {
  if (!node.value) return;
  acting.value = true;
  try {
    await startServerNode(node.value.id);
    message.success('服务已启动');
    await load();
    emit('changed');
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    acting.value = false;
  }
}

async function onStop() {
  if (!node.value) return;
  acting.value = true;
  try {
    await stopServerNode(node.value.id);
    message.success('服务已停止');
    await load();
    emit('changed');
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    acting.value = false;
  }
}

/** 热切换单个过滤器启停 */
async function onToggleFilter(index: number, enabled: boolean) {
  if (!node.value) return;
  try {
    await toggleServerFilter(node.value.id, index, enabled);
    message.success(`插件已${enabled ? '启用' : '停用'}（热生效，服务未中断）`);
    await load();
    emit('changed');
  } catch (e) {
    message.error((e as Error).message);
  }
}

/** 进入插件配置页 */
function openConfig(index: number) {
  activeIndex.value = index;
  filterParams.value = { ...(node.value?.filters?.[index]?.params || {}) };
  view.value = 'filter';
}

/** 热更新当前插件参数 */
async function applyParams() {
  if (!node.value) return;
  acting.value = true;
  try {
    await updateServerFilterParams(node.value.id, activeIndex.value, filterParams.value);
    message.success('插件参数已热更新，服务未中断');
    await load();
    emit('changed');
    view.value = 'detail';
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    acting.value = false;
  }
}
</script>

<template>
  <ReDrawer
    v-model="visible"
    :title="view === 'detail' ? `服务详情 - ${node?.name || ''}` : `插件配置 - ${node?.filters?.[activeIndex]?.name || ''}`"
    :size="view === 'detail' ? 820 : 760"
    direction="rtl"
    close-only
    :footer-hidden="true"
  >
    <template #content>
      <!-- ============ 详情视图 ============ -->
      <div v-if="view === 'detail'" class="server-detail">
        <ReSkeleton :loading="loading" :rows="6" :count="1" animated>
          <template v-if="node">
            <ReDescriptions :column="2" border size="small">
              <ReDescriptionsItem label="服务名称">{{ node.name }}</ReDescriptionsItem>
              <ReDescriptionsItem label="运行状态">
                <span class="status-cell">
                  <ReStatusIndicator
                    :type="node.status === 'RUNNING' ? 'success' : node.status === 'ERROR' ? 'danger' : 'info'"
                    :pulse="node.status === 'RUNNING'"
                  />
                  {{ statusText[node.status] || node.status }}
                </span>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="协议类型">
                <ReTag size="small">{{ node.protocolDesc || node.protocol }}</ReTag>
                <ReText size="small" type="info" style="margin-left: 6px">{{ node.protocol }}</ReText>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="传输引擎">{{ node.engine || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="监听地址">
                <span class="mono">{{ node.host || '0.0.0.0' }}:{{ node.port ?? '-' }}</span>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="访问地址">
                <ReText v-if="node.serverUrl" size="small" type="primary">{{ node.serverUrl }}</ReText>
                <span v-else class="dim">未运行</span>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="自动启用">
                <ReTag size="small" :type="node.enabled === 1 ? 'success' : 'info'">{{ node.enabled === 1 ? '是' : '否' }}</ReTag>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="已挂插件">
                <ReTag size="small" type="success">{{ node.filters?.length ?? 0 }} 个</ReTag>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="备注" :span="2">{{ node.remark || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem v-if="node.error" label="最近错误" :span="2">
                <ReTag size="small" type="danger">{{ node.error }}</ReTag>
              </ReDescriptionsItem>
            </ReDescriptions>

            <!-- 协议配置 -->
            <ReDivider content-position="left">协议配置</ReDivider>
            <ReDescriptions v-if="Object.keys(node.config || {}).length" :column="2" border size="small">
              <ReDescriptionsItem v-for="(v, k) in node.config" :key="k" :label="String(k)">
                <span class="mono">{{ v }}</span>
              </ReDescriptionsItem>
            </ReDescriptions>
            <div v-else class="detail-empty">未配置协议专属参数</div>

            <!-- 过滤器链 -->
            <ReDivider content-position="left">
              过滤器链
              <span class="dim" style="margin-left: 8px; font-size: 11px">按 order 升序执行</span>
            </ReDivider>
            <div v-if="!node.filters?.length" class="detail-empty">
              未挂载任何 ServerFilter 插件，点击「编辑」进入编排
            </div>
            <div v-else class="filter-list">
              <div
                v-for="(f, index) in node.filters"
                :key="f.name"
                class="filter-row"
                :class="{ 'is-off': f.enabled === false }"
              >
                <div class="fr-order">{{ index + 1 }}</div>
                <div class="fr-main">
                  <div class="fr-name">
                    {{ f.name }}
                    <ReTag v-if="f.type && f.type !== f.name" size="small" type="info">{{ f.type }}</ReTag>
                    <ReTag v-if="metaOf(index)?.spi" size="small" type="success">SPI</ReTag>
                    <ReTag v-if="metaOf(index)?.group" size="small">{{ metaOf(index)?.group }}</ReTag>
                  </div>
                  <div class="fr-desc">{{ metaOf(index)?.desc || '未找到插件元数据' }}</div>
                  <div v-if="paramEntries(index).length" class="fr-params">
                    <ReTag v-for="p in paramEntries(index)" :key="p.key" size="small" type="info" style="margin-right: 4px; margin-bottom: 4px">
                      {{ p.key }}={{ p.value }}
                    </ReTag>
                  </div>
                  <div v-else class="dim" style="font-size: 11px">未配置参数</div>
                </div>
                <div class="fr-ops">
                  <ReSwitch
                    :model-value="f.enabled !== false"
                    size="small"
                    :disabled="!isLive"
                    @change="(v: any) => onToggleFilter(index, !!v)"
                  />
                  <ReButton link size="small" type="primary" @click="openConfig(index)">配置</ReButton>
                  <ReButton
                    v-if="hasDetail(index)"
                    link
                    size="small"
                    type="success"
                    @click="emit('open-detail-page', node, index)"
                  >{{ metaOf(index)?.detailLabel || '查看详情' }}</ReButton>
                </div>
              </div>
            </div>

            <div class="detail-actions">
              <ReButton
                v-if="node.status !== 'RUNNING'"
                show-text
                icon="VideoPlay"
                type="success"
                :loading="acting"
                @click="onStart"
              >启动服务</ReButton>
              <ReButton v-else show-text icon="VideoPause" type="warning" :loading="acting" @click="onStop">停止服务</ReButton>
              <ReButton show-text icon="Refresh" @click="load">刷新状态</ReButton>
              <span class="dim">插件启停与参数调整均热生效，服务不中断</span>
            </div>
          </template>
        </ReSkeleton>
      </div>

      <!-- ============ 插件配置页 ============ -->
      <div v-else class="filter-page">
        <div class="filter-page-bar">
          <ReButton show-text icon="ArrowLeft" size="small" @click="view = 'detail'">返回详情</ReButton>
          <span class="dim">第 {{ activeIndex + 1 }} 个插件 · {{ node?.filters?.[activeIndex]?.name }}</span>
        </div>
        <ScFilterConfigPanel
          v-model="filterParams"
          :meta="activeMeta"
          :filter-type="activeFilterType"
          :live="isLive"
          :applying="acting"
          @apply="applyParams"
          @open-detail-page="node && emit('open-detail-page', node, activeIndex)"
        />
      </div>
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
.server-detail,
.filter-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-empty {
  padding: 18px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-fill);
  border-radius: 8px;
}
.filter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-container-card);
  transition: var(--transition-base);
}
.filter-row:hover {
  border-color: var(--brand-300);
  box-shadow: var(--shadow-card);
}
.filter-row.is-off {
  opacity: 0.62;
}
.fr-order {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--brand-50);
  color: var(--brand-600);
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.fr-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fr-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: var(--text-primary);
}
.fr-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.6;
}
.fr-params {
  display: flex;
  flex-wrap: wrap;
  margin-top: 2px;
}
.fr-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.detail-actions,
.filter-page-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
</style>
