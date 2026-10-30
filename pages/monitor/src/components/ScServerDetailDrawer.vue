<script setup lang="ts">
/**
 * 服务管理 —— Server 节点详情抽屉。
 *
 * 展示运行态与过滤器链；对运行中的服务提供：
 *   - 单个过滤器热启停（/filters/{i}/toggle）
 *   - 单个过滤器参数热更新（/filters/{i}/params，进入该实现的配置页）
 *   - 插件深度查看页入口（不同实现不同页面，如 file-storage → 文件管理器）
 */
import { computed, onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import {
  getServerNode,
  startServerNode,
  stopServerNode,
  restartServerNode,
  hotUpdateServerNode,
  toggleServerFilter,
  updateServerFilterParams,
  type FilterTypeMeta,
  type ServerNodeView,
} from '../api';
import ScFilterConfigPanel from './ScFilterConfigPanel.vue';
import { hasFilterDetail } from '../utils/filterDetail';

const props = withDefaults(
  defineProps<{
    /** 节点 id */
    nodeId: number | null;
    /** 插件元数据 */
    filterTypes: FilterTypeMeta[];
    /** 嵌入 ReTabs 工作区时去掉抽屉外壳，直接渲染详情 / 配置视图 */
    embedded?: boolean;
    /** 嵌入模式初始视图：'filter' 用于「过滤器链」页签，直接进入插件配置页 */
    initialView?: 'detail' | 'filter';
  }>(),
  { embedded: false, initialView: 'detail' },
);

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

/** 访问地址一键复制 */
async function copyServerUrl() {
  const url = node.value?.serverUrl;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    message.success('已复制到剪贴板');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    message.success('已复制到剪贴板');
  }
}

/** 重启（先停再启，用于 ERROR 节点排障） */
async function onRestart() {
  if (!node.value) return;
  acting.value = true;
  try {
    await restartServerNode(node.value.id);
    message.success('服务已重启');
    await load();
    emit('changed');
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    acting.value = false;
  }
}

/**
 * 从过滤器链上移除指定下标的过滤器（热更新实现，详情抽屉内直接操作）。
 */
async function removeFilter(index: number) {
  if (!node.value) return;
  const target = node.value.filters?.[index];
  if (!target) return;
  const remaining = (node.value.filters || []).filter((_, i) => i !== index);
  acting.value = true;
  try {
    await hotUpdateServerNode(node.value.id, {
      name: node.value.name,
      protocol: node.value.protocol,
      engine: node.value.engine,
      host: node.value.host,
      port: node.value.port,
      enabled: node.value.enabled,
      remark: node.value.remark,
      config: node.value.config || {},
      filters: remaining.map((f, i) => ({
        name: f.name,
        type: f.type,
        order: 100 + i * 10,
        enabled: f.enabled,
        params: f.params || {},
      })),
    });
    message.success(`已移除插件「${target.name}」`);
    await load();
    emit('changed');
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    acting.value = false;
  }
}

/** 当前配置的插件类型 */
const activeFilterType = computed(() => {
  const f = node.value?.filters?.[activeIndex.value];
  return f?.type || f?.name || '';
});

/** 当前配置的插件元数据 */
const activeMeta = computed<FilterTypeMeta | null>(() =>
  props.filterTypes.find(f => f.type === activeFilterType.value) || null,
);

/** 嵌入模式已加载的节点 id：同一实例不重复拉取，避免页签常驻挂载造成重复请求 */
const embeddedLoaded = ref<number | null>(null);

watch(visible, open => {
  if (props.embedded || !open) return;
  view.value = 'detail';
  load();
});

watch(
  () => props.nodeId,
  () => {
    if (props.embedded) {
      embeddedLoaded.value = null;
      loadEmbedded();
    } else if (visible.value) {
      load();
    }
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

/**
 * 嵌入模式：页签常驻挂载，不再受抽屉打开态驱动。
 *
 * <p>重新挂载 / 节点 id 变化时先回初始视图再拉一次；同 id 不重复请求，
 * 页签刷新会用新的 key 重建组件，天然触发重新加载。</p>
 */
async function loadEmbedded() {
  if (props.nodeId == null || embeddedLoaded.value === props.nodeId) return;
  embeddedLoaded.value = props.nodeId;
  view.value = props.initialView || 'detail';
  await load();
}

onMounted(() => {
  if (props.embedded) loadEmbedded();
});

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
  <!-- ============ 非嵌入：原抽屉外壳（行为不变） ============ -->
  <ReDrawer
    v-if="!props.embedded"
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
            <ReDescriptions :column="2" border >
              <ReDescriptionsItem label="服务名称">
                {{ node.name }}
                <ReText v-if="node.id" type="secondary" style="margin-left: 8px; font-size: 11px">#{{ node.id }}</ReText>
              </ReDescriptionsItem>
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
                <ReTag >{{ node.protocolDesc || node.protocol }}</ReTag>
                <ReText type="info" style="margin-left: 6px">{{ node.protocol }}</ReText>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="传输引擎">{{ node.engine || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="监听地址">
                <span class="sv-mono">{{ node.host || '0.0.0.0' }}:{{ node.port ?? '-' }}</span>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="访问地址">
                <div v-if="node.serverUrl" class="url-cell">
                  <ReText type="primary">{{ node.serverUrl }}</ReText>
                  <ReButton icon="Copy" layout="square" tip="复制地址" @click="copyServerUrl" />
                </div>
                <span v-else class="dim">{{ node.status === 'ERROR' ? '服务启动失败，修复后可用' : '未运行' }}</span>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="自动启用">
                <ReTag :type="node.enabled === 1 ? 'success' : 'info'">{{ node.enabled === 1 ? '是' : '否' }}</ReTag>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="已挂插件">
                <ReTag type="success">{{ node.filters?.length ?? 0 }} 个</ReTag>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="备注" :span="2">{{ node.remark || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem v-if="node.error" label="最近错误" :span="2">
                <span class="error-text" :title="node.error">{{ node.error }}</span>
              </ReDescriptionsItem>
            </ReDescriptions>

            <!-- 协议配置 -->
            <ReDivider content-position="left">协议配置</ReDivider>
            <ReDescriptions v-if="Object.keys(node.config || {}).length" :column="2" border >
              <ReDescriptionsItem v-for="(v, k) in node.config" :key="k" :label="String(k)">
                <span class="sv-mono">{{ v }}</span>
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
                    <ReTag v-if="f.type && f.type !== f.name" type="info">{{ f.type }}</ReTag>
                    <ReTag v-if="metaOf(index)?.spi" type="success">SPI</ReTag>
                    <ReTag v-if="metaOf(index)?.group" >{{ metaOf(index)?.group }}</ReTag>
                  </div>
                  <div class="fr-desc">{{ metaOf(index)?.desc || '未找到插件元数据' }}</div>
                  <div v-if="paramEntries(index).length" class="fr-params">
                    <ReTag v-for="p in paramEntries(index)" :key="p.key" type="info" style="margin-right: 4px; margin-bottom: 4px">
                      {{ p.key }}={{ p.value }}
                    </ReTag>
                  </div>
                  <div v-else class="dim" style="font-size: 11px">未配置参数</div>
                </div>
                <div class="fr-ops">
                  <ReSwitch
                    :model-value="f.enabled !== false"
                    :disabled="!isLive"
                    @change="(v: any) => onToggleFilter(index, !!v)"
                  />
                  <ReButton link type="primary" @click="openConfig(index)">配置</ReButton>
                  <ReButton
                    v-if="hasDetail(index)"
                    icon="TopRight"
                    layout="square"
                    type="success"
                    :tip="metaOf(index)?.detailLabel || '查看详情'"
                    @click="node && emit('open-detail-page', node, index)"
                  />
                  <ReButton icon="Delete" layout="square" type="danger" tip="从链上移除" @click="removeFilter(index)" />
                </div>
              </div>
            </div>

            <div class="detail-actions">
              <template v-if="node.status === 'ERROR'">
                <ReButton show-text icon="Refresh" type="warning" :loading="acting" @click="onRestart">重启服务</ReButton>
                <span class="dim">服务异常，点击重启尝试恢复</span>
              </template>
              <template v-else-if="node.status === 'RUNNING'">
                <ReButton show-text icon="VideoPause" type="warning" :loading="acting" @click="onStop">停止服务</ReButton>
                <ReButton show-text icon="Refresh" @click="load">刷新状态</ReButton>
                <span class="dim">插件启停与参数调整均热生效，服务不中断</span>
              </template>
              <template v-else>
                <ReButton show-text icon="VideoPlay" type="success" :loading="acting" @click="onStart">启动服务</ReButton>
                <ReButton show-text icon="Refresh" @click="load">刷新状态</ReButton>
                <span class="dim">插件启停与参数调整均热生效，服务不中断</span>
              </template>
            </div>
          </template>
        </ReSkeleton>
      </div>

      <!-- ============ 插件配置页 ============ -->
      <div v-else class="filter-page">
        <div class="filter-page-bar">
          <ReButton show-text icon="ArrowLeft" @click="view = 'detail'">返回详情</ReButton>
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

  <!-- ============ 嵌入：ReTabs 工作区页签内容，去掉抽屉外壳直接铺进面板 ============ -->
  <div v-else class="server-detail-embed">
    <!-- ============ 详情视图 ============ -->
    <div v-if="view === 'detail'" class="server-detail">
      <ReSkeleton :loading="loading" :rows="6" :count="1" animated>
        <template v-if="node">
          <ReDescriptions :column="2" border >
            <ReDescriptionsItem label="服务名称">
              {{ node.name }}
              <ReText v-if="node.id" type="secondary" style="margin-left: 8px; font-size: 11px">#{{ node.id }}</ReText>
            </ReDescriptionsItem>
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
              <ReTag >{{ node.protocolDesc || node.protocol }}</ReTag>
              <ReText type="info" style="margin-left: 6px">{{ node.protocol }}</ReText>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="传输引擎">{{ node.engine || '-' }}</ReDescriptionsItem>
            <ReDescriptionsItem label="监听地址">
              <span class="sv-mono">{{ node.host || '0.0.0.0' }}:{{ node.port ?? '-' }}</span>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="访问地址">
              <div v-if="node.serverUrl" class="url-cell">
                <ReText type="primary">{{ node.serverUrl }}</ReText>
                <ReButton icon="Copy" layout="square" tip="复制地址" @click="copyServerUrl" />
              </div>
              <span v-else class="dim">{{ node.status === 'ERROR' ? '服务启动失败，修复后可用' : '未运行' }}</span>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="自动启用">
              <ReTag :type="node.enabled === 1 ? 'success' : 'info'">{{ node.enabled === 1 ? '是' : '否' }}</ReTag>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="已挂插件">
              <ReTag type="success">{{ node.filters?.length ?? 0 }} 个</ReTag>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="备注" :span="2">{{ node.remark || '-' }}</ReDescriptionsItem>
            <ReDescriptionsItem v-if="node.error" label="最近错误" :span="2">
              <span class="error-text" :title="node.error">{{ node.error }}</span>
            </ReDescriptionsItem>
          </ReDescriptions>

          <!-- 协议配置 -->
          <ReDivider content-position="left">协议配置</ReDivider>
          <ReDescriptions v-if="Object.keys(node.config || {}).length" :column="2" border >
            <ReDescriptionsItem v-for="(v, k) in node.config" :key="k" :label="String(k)">
              <span class="sv-mono">{{ v }}</span>
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
                  <ReTag v-if="f.type && f.type !== f.name" type="info">{{ f.type }}</ReTag>
                  <ReTag v-if="metaOf(index)?.spi" type="success">SPI</ReTag>
                  <ReTag v-if="metaOf(index)?.group" >{{ metaOf(index)?.group }}</ReTag>
                </div>
                <div class="fr-desc">{{ metaOf(index)?.desc || '未找到插件元数据' }}</div>
                <div v-if="paramEntries(index).length" class="fr-params">
                  <ReTag v-for="p in paramEntries(index)" :key="p.key" type="info" style="margin-right: 4px; margin-bottom: 4px">
                    {{ p.key }}={{ p.value }}
                  </ReTag>
                </div>
                <div v-else class="dim" style="font-size: 11px">未配置参数</div>
              </div>
              <div class="fr-ops">
                <ReSwitch
                  :model-value="f.enabled !== false"
                  :disabled="!isLive"
                  @change="(v: any) => onToggleFilter(index, !!v)"
                />
                <ReButton link type="primary" @click="openConfig(index)">配置</ReButton>
                <ReButton
                  v-if="hasDetail(index)"
                  icon="TopRight"
                  layout="square"
                  type="success"
                  :tip="metaOf(index)?.detailLabel || '查看详情'"
                  @click="node && emit('open-detail-page', node, index)"
                />
                <ReButton icon="Delete" layout="square" type="danger" tip="从链上移除" @click="removeFilter(index)" />
              </div>
            </div>
          </div>

          <div class="detail-actions">
            <template v-if="node.status === 'ERROR'">
              <ReButton show-text icon="Refresh" type="warning" :loading="acting" @click="onRestart">重启服务</ReButton>
              <span class="dim">服务异常，点击重启尝试恢复</span>
            </template>
            <template v-else-if="node.status === 'RUNNING'">
              <ReButton show-text icon="VideoPause" type="warning" :loading="acting" @click="onStop">停止服务</ReButton>
              <ReButton show-text icon="Refresh" @click="load">刷新状态</ReButton>
              <span class="dim">插件启停与参数调整均热生效，服务不中断</span>
            </template>
            <template v-else>
              <ReButton show-text icon="VideoPlay" type="success" :loading="acting" @click="onStart">启动服务</ReButton>
              <ReButton show-text icon="Refresh" @click="load">刷新状态</ReButton>
              <span class="dim">插件启停与参数调整均热生效，服务不中断</span>
            </template>
          </div>
        </template>
      </ReSkeleton>
    </div>

    <!-- ============ 插件配置页 ============ -->
    <div v-else class="filter-page">
      <div class="filter-page-bar">
        <ReButton show-text icon="ArrowLeft" @click="view = 'detail'">返回详情</ReButton>
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
  </div>
</template>

<style scoped lang="scss">
.server-detail,
.filter-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* 本文件原先整套用 pages/server/src/styles/tokens.css 的私有令牌
   （--text-tertiary / --bg-fill / --border-subtle / --bg-container-card / --brand-*），
   而那份 tokens.css 只有 :root、没有暗色变体，暗色模式下这些值全部停留在亮色。
   统一改走 EP 语义令牌，亮暗色自动跟随。 */
.detail-empty {
  padding: 18px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}
.filter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
/* 详情抽屉过滤器行科技感：毛玻璃 + 霓虹序号圆 */
.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}
.filter-row:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color-lighter));
  box-shadow: 0 0 16px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 3%, var(--el-bg-color));
}
.filter-row.is-off {
  opacity: 0.62;
}
.fr-order {
  width: 22px;
  height: 22px;
  border-radius: var(--el-radius-full, 9999px);
  /* 霓虹光晕序号圆 */
  background: radial-gradient(circle at 30% 30%,
    color-mix(in srgb, var(--el-color-primary) 30%, transparent) 0%,
    color-mix(in srgb, var(--el-color-primary) 8%, transparent) 100%);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
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
  color: var(--el-text-color-primary);
}
.fr-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
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
  position: relative;
  /* 顶部科技感渐变光带 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--el-color-primary-light-5) 30%,
      var(--el-color-primary) 50%,
      var(--el-color-primary-light-5) 70%,
      transparent 100%);
    opacity: 0.55;
  }
}

.url-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.error-text {
  display: inline-block;
  max-width: 100%;
  font-size: 12px;
  color: var(--el-color-danger);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  cursor: default;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .filter-row {
    transition: none;
  }
}

/* 嵌入 ReTabs 面板：父级是 flex column + overflow hidden，内容由这里自己滚 */
.server-detail-embed {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  gap: 12px;
  padding: 12px 2px 12px 1px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
