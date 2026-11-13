<script setup lang="ts">
/**
 * 服务管理 —— Server 节点详情正文（请求流水线视图）。
 *
 * <p>上一版把「详情」写成 10 项两列描述表 + 一条插件行列表，抽屉模式与嵌入模式
 * 各抄了整整一份模板（约 250 行重复），任何一处改动都得同步两遍。本组件把正文
 * 收成唯一实现，外壳（ReDrawer / ReTabs 页签）只决定挂到哪里。</p>
 *
 * <p>信息结构按「请求怎么穿过插件」组织：
 *   ① 头部：状态与启停动作；
 *   ② 请求流水线：请求 → 各环 → 上游，点选某一环即就地展开该环参数；
 *   ③ 规格带：监听 / 访问 / 引擎 / 自动启用 / 备注（原来占满一张描述表）；
 *   ④ 协议配置：默认收起，展开是参数 chips；
 *   ⑤ 插件配置页：保持原入口，按分区卡片编排参数。</p>
 *
 * <p>所有接口调用与业务行为保持原样：插件热启停、参数热更新、移除插件、深度查看、
 * 复制访问地址、启动/停止/重启节点，仍由父组件发起，本组件只发意图。</p>
 */
import { computed, ref, watch } from 'vue';
import { message } from '@repo/core';
import type { FilterTypeMeta, ServerFilterDescriptor, ServerNodeView } from '../api';
import ScFilterConfigPanel from './ScFilterConfigPanel.vue';
import { hasFilterDetail } from '../utils/filterDetail';
import { copyText } from '../utils/clipboard';

const props = withDefaults(
  defineProps<{
    /** 节点数据（含运行态） */
    node: ServerNodeView | null;
    /** 加载中 */
    loading?: boolean;
    /** 节点操作进行中 */
    acting?: boolean;
    /** 插件元数据 */
    filterTypes: FilterTypeMeta[];
    /** 当前视图：详情 / 单个插件配置 */
    view: 'detail' | 'filter';
    /** 当前配置的插件下标 */
    activeIndex: number;
    /** 嵌入 ReTabs 工作区时为 true */
    embedded?: boolean;
  }>(),
  { loading: false, acting: false, embedded: false },
);

const emit = defineEmits<{
  (e: 'update:view', value: 'detail' | 'filter'): void;
  (e: 'update:activeIndex', value: number): void;
  /** 重新拉取节点状态 */
  (e: 'refresh'): void;
  /** 启动 / 停止 / 重启节点 */
  (e: 'start'): void;
  (e: 'stop'): void;
  (e: 'restart'): void;
  /** 复制访问地址 */
  (e: 'copy-url'): void;
  /** 单个过滤器热启停 */
  (e: 'toggle-filter', index: number, enabled: boolean): void;
  /** 从过滤器链移除 */
  (e: 'remove-filter', index: number): void;
  /** 热更新当前插件参数 */
  (e: 'apply', index: number, params: Record<string, string>): void;
  /** 打开插件深度查看页 */
  (e: 'open-detail-page', node: ServerNodeView, index: number): void;
}>();

/** 状态文案 */
const statusText: Record<string, string> = { RUNNING: '运行中', STOPPED: '已停止', ERROR: '异常' };

/** 是否运行中（决定插件能否热操作） */
const isLive = computed(() => props.node?.status === 'RUNNING');

/** 过滤器链 */
const filters = computed<ServerFilterDescriptor[]>(() => props.node?.filters ?? []);

/**
 * 流水线上被选中的环（与「配置页」的 activeIndex 是两个概念）。
 * 默认选中第一环；节点刷新后下标越界时回落到最后一环。
 */
const selected = ref(0);
watch(
  () => filters.value.length,
  len => {
    if (!len) selected.value = 0;
    else if (selected.value > len - 1) selected.value = len - 1;
  },
);

/** 当前选中的过滤器 */
const selectedFilter = computed<ServerFilterDescriptor | null>(() => filters.value[selected.value] ?? null);

/** 当前配置页的过滤器 */
const activeFilter = computed<ServerFilterDescriptor | null>(() => filters.value[props.activeIndex] ?? null);

/** 插件元数据查找 */
function metaOf(index: number): FilterTypeMeta | undefined {
  const f = filters.value[index];
  if (!f) return undefined;
  return props.filterTypes.find(t => t.type === (f.type || f.name));
}

/** 当前配置页插件元数据 */
const activeMeta = computed<FilterTypeMeta | null>(() => metaOf(props.activeIndex) ?? null);

/** 当前配置页插件类型 */
const activeFilterType = computed(() => activeFilter.value?.type || activeFilter.value?.name || '');

/** 该插件是否提供深度查看入口 */
function hasDetail(index: number): boolean {
  return hasFilterDetail(metaOf(index));
}

/** 过滤器参数条目 */
function paramEntries(index: number): Array<{ key: string; value: string }> {
  const params = filters.value[index]?.params || {};
  return Object.entries(params).map(([key, value]) => ({ key, value: String(value) }));
}

/** 参数条数（流水线每环的角标） */
function paramCount(index: number): number {
  return Object.keys(filters.value[index]?.params || {}).length;
}

/** 协议配置条目 */
const configEntries = computed(() =>
  Object.entries(props.node?.config || {}).map(([key, value]) => ({ key, value: String(value) })),
);

/**
 * 反向代理的目标后端：`host:port`。
 *
 * <p>详情页拿到的是后端原始行（不是清单层的展示对象），所以这里按 config 的两个
 * 约定键拼一次，而不是复用 `ServiceNodeCard.backendText`——那条在清单层用。</p>
 */
const backendText = computed(() => {
  const config = props.node?.config || {};
  const host = config.backendHost ?? config.host;
  const port = config.backendPort ?? config.port;
  return host && port ? `${host}:${port}` : '';
});

// ===== 插件配置页 =====

/** 参数草稿（只在配置页内使用） */
const filterParams = ref<Record<string, string>>({});

/** 进入某个插件的配置页 */
function openConfig(index: number) {
  emit('update:activeIndex', index);
  filterParams.value = { ...(filters.value[index]?.params || {}) };
  emit('update:view', 'filter');
}

/** 回到详情视图 */
function backToDetail() {
  emit('update:view', 'detail');
}

/** 节点刷新后把草稿对齐到最新参数（例如热更新成功后） */
watch(
  () => [props.node, props.activeIndex, props.view] as const,
  () => {
    if (props.view !== 'filter') return;
    filterParams.value = { ...(activeFilter.value?.params || {}) };
  },
);

/** 提交热更新：把草稿交给父组件发请求 */
function onApply() {
  emit('apply', props.activeIndex, { ...filterParams.value });
}

/**
 * 复制文本并给一次反馈。
 *
 * @param text  要复制的文本
 * @param label 提示里怎么称呼它
 */
async function copyWithToast(text: string, label: string): Promise<void> {
  if (!text) return;
  try {
    await copyText(text);
    message.success(`${label}已复制`);
  } catch (e) {
    message.error(`复制失败：${(e as Error).message}`);
  }
}

/**
 * 在新窗口打开访问地址。
 *
 * @param url 访问地址
 */
function openUrl(url: string): void {
  if (url) window.open(url, '_blank', 'noopener');
}
</script>

<template>
  <div class="sdb" :class="{ 'is-embedded': embedded }">
    <ReSkeleton :loading="loading" :rows="6" :count="1" animated>
      <template v-if="node">
        <!-- ============ 详情：请求流水线 ============ -->
        <template v-if="view === 'detail'">
          <!-- 头部：状态 + 启停动作 -->
          <header class="sdb-head">
            <div class="sdb-who">
              <span
                class="sdb-dot"
                :class="node.status === 'RUNNING' ? 'is-up' : node.status === 'ERROR' ? 'is-err' : 'is-down'"
                aria-hidden="true"
              />
              <div class="sdb-who-text">
                <div class="sdb-name">
                  {{ node.name }}
                  <span class="sdb-id">#{{ node.id }}</span>
                </div>
                <div class="sdb-sub">
                  <span :class="{ 'is-err-text': node.status === 'ERROR' }">{{ statusText[node.status] || node.status }}</span>
                  <i aria-hidden="true">·</i>
                  <span>{{ node.protocolDesc || node.protocol }}</span>
                  <i aria-hidden="true">·</i>
                  <span>{{ node.engine || '-' }}</span>
                  <i aria-hidden="true">·</i>
                  <span>{{ filters.length }} 个插件</span>
                </div>
              </div>
            </div>
            <div class="sdb-head-ops">
              <ReButton show-text icon="Refresh" @click="emit('refresh')">刷新</ReButton>
              <ReButton
                v-if="node.status === 'ERROR'"
                show-text
                icon="Refresh"
                type="warning"
                :loading="acting"
                @click="emit('restart')"
              >重启服务</ReButton>
              <ReButton
                v-else-if="node.status === 'RUNNING'"
                show-text
                icon="VideoPause"
                type="warning"
                :loading="acting"
                @click="emit('stop')"
              >停止服务</ReButton>
              <ReButton
                v-else
                show-text
                icon="VideoPlay"
                type="success"
                :loading="acting"
                @click="emit('start')"
              >启动服务</ReButton>
            </div>
          </header>

          <!-- 请求流水线 -->
          <section class="sdb-card sdb-pipe">
            <div class="sdb-sec">
              <span class="sdb-sec-title">请求流水线</span>
              <span class="sdb-hint">请求自左向右穿过插件；停用的直接旁路</span>
            </div>

            <div v-if="!filters.length" class="sdb-empty">
              未挂载任何 ServerFilter 插件，点击「编辑」进入编排
            </div>

            <template v-else>
              <div class="sdb-flow">
                <div class="sdb-node is-io">请求</div>
                <template v-for="(f, i) in filters" :key="f.name">
                  <span class="sdb-arrow" aria-hidden="true">›</span>
                  <div
                    class="sdb-node is-stage"
                    :class="{ 'is-sel': selected === i, 'is-off': f.enabled === false }"
                    role="button"
                    tabindex="0"
                    :aria-pressed="selected === i"
                    @click="selected = i"
                    @keydown.enter.prevent="selected = i"
                    @keydown.space.prevent="selected = i"
                  >
                    <div class="sdb-node-top">
                      <span class="sdb-node-idx">{{ String(i + 1).padStart(2, '0') }}</span>
                      <ReSwitch
                        :model-value="f.enabled !== false"
                        :disabled="!isLive"
                        @click.stop
                        @change="(v: any) => emit('toggle-filter', i, !!v)"
                      />
                    </div>
                    <div class="sdb-node-name" :title="f.name">{{ f.name }}</div>
                    <div class="sdb-node-type" :title="f.type || f.name">{{ f.type || f.name }}</div>
                    <div class="sdb-node-foot">{{ paramCount(i) }} 参</div>
                  </div>
                </template>
                <span class="sdb-arrow" aria-hidden="true">›</span>
                <div class="sdb-node is-io">上游</div>
              </div>

              <!-- 选中环的参数：就地展开，不再跳页 -->
              <div v-if="selectedFilter" class="sdb-stage">
                <div class="sdb-stage-head">
                  <span class="sdb-hint">第 {{ selected + 1 }} 环</span>
                  <span class="sdb-stage-name">{{ selectedFilter.name }}</span>
                  <ReTag v-if="selectedFilter.type && selectedFilter.type !== selectedFilter.name" type="info">
                    {{ selectedFilter.type }}
                  </ReTag>
                  <ReTag v-if="metaOf(selected)?.spi" type="success">SPI</ReTag>
                  <ReTag v-if="metaOf(selected)?.group">{{ metaOf(selected)?.group }}</ReTag>
                  <span class="sdb-stage-ops">
                    <ReButton text type="primary" @click="openConfig(selected)">配置参数</ReButton>
                    <ReButton
                      v-if="hasDetail(selected)"
                      icon="TopRight"
                      layout="square"
                      type="success"
                      :tip="metaOf(selected)?.detailLabel || '查看详情'"
                      @click="node && emit('open-detail-page', node, selected)"
                    />
                    <ReButton
                      icon="Delete"
                      layout="square"
                      type="danger"
                      tip="从链上移除"
                      @click="emit('remove-filter', selected)"
                    />
                  </span>
                </div>
                <div class="sdb-stage-desc">
                  {{ metaOf(selected)?.desc || '未找到该插件的元数据' }}
                </div>
                <div v-if="metaOf(selected)?.require" class="sdb-stage-require">
                  前提：{{ metaOf(selected)?.require }}
                </div>
                <div v-if="paramEntries(selected).length" class="sdb-params">
                  <div v-for="p in paramEntries(selected)" :key="p.key" class="sdb-param">
                    <span class="sdb-param-k">{{ p.key }}</span>
                    <span class="sdb-param-v" :title="p.value">{{ p.value }}</span>
                  </div>
                </div>
                <div v-else class="sdb-hint">该环未配置参数，进入「配置参数」补齐</div>
              </div>
            </template>
          </section>

          <!-- 规格带：原来占满整张描述表的字段 -->
          <div class="sdb-spec">
            <div class="sdb-spec-item">
              <span>监听</span>
              <b class="sdb-mono">{{ node.host || '0.0.0.0' }}:{{ node.port ?? '-' }}</b>
            </div>
            <div class="sdb-spec-item">
              <span>访问</span>
              <b
                v-if="node.serverUrl"
                class="sdb-mono sdb-url"
                :title="`${node.serverUrl}（点击打开）`"
                role="link"
                tabindex="0"
                @click="openUrl(node.serverUrl)"
                @keydown.enter.prevent="openUrl(node.serverUrl)"
              >{{ node.serverUrl }}</b>
              <b v-else class="sdb-dim">{{ node.status === 'ERROR' ? '启动失败，修复后可用' : '未运行' }}</b>
              <ReButton
                v-if="node.serverUrl"
                icon="Copy"
                layout="square"
                tip="复制地址"
                @click="copyWithToast(node.serverUrl, '访问地址')"
              />
            </div>
            <div v-if="backendText" class="sdb-spec-item">
              <span>目标后端</span>
              <b class="sdb-mono sv-ellipsis" :title="backendText">{{ backendText }}</b>
              <ReButton
                icon="Copy"
                layout="square"
                tip="复制后端地址"
                @click="copyWithToast(backendText, '后端地址')"
              />
            </div>
            <div class="sdb-spec-item">
              <span>协议 / 引擎</span>
              <b>{{ node.protocolDesc || node.protocol }} · {{ node.engine || '-' }}</b>
            </div>
            <div class="sdb-spec-item">
              <span>自动启用</span>
              <b>{{ node.enabled === 1 ? '是' : '否' }}</b>
            </div>
            <div class="sdb-spec-item is-wide">
              <span>备注</span>
              <b class="sdb-dim">{{ node.remark || '-' }}</b>
            </div>
            <div v-if="node.error" class="sdb-spec-item is-wide">
              <span>最近错误</span>
              <b class="sdb-error-text" :title="node.error">{{ node.error }}</b>
            </div>
          </div>

          <!-- 协议配置：默认收起 -->
          <details class="sdb-card sdb-proto">
            <summary>
              协议配置
              <span class="sdb-count">{{ configEntries.length }}</span>
            </summary>
            <div v-if="configEntries.length" class="sdb-chips">
              <span v-for="c in configEntries" :key="c.key" class="sdb-chip">
                {{ c.key }}<b>{{ c.value }}</b>
              </span>
            </div>
            <div v-else class="sdb-hint">未配置协议专属参数</div>
          </details>

          <div class="sdb-foot">
            <span class="sdb-hint">插件启停与参数调整均热生效，服务不中断</span>
          </div>
        </template>

        <!-- ============ 单个插件配置页 ============ -->
        <template v-else>
          <div class="sdb-filter-bar">
            <ReButton show-text icon="ArrowLeft" @click="backToDetail">返回详情</ReButton>
            <span class="sdb-hint">第 {{ activeIndex + 1 }} 环 · {{ activeFilter?.name }}</span>
          </div>
          <ScFilterConfigPanel
            v-model="filterParams"
            :meta="activeMeta"
            :filter-type="activeFilterType"
            :live="isLive"
            :applying="acting"
            @apply="onApply"
            @open-detail-page="node && emit('open-detail-page', node, activeIndex)"
          />
        </template>
      </template>
    </ReSkeleton>
  </div>
</template>

<style scoped lang="scss">
/* 本组件统一走 Element Plus 语义令牌，亮暗色自动跟随。
   不再引用 pages/server/src/styles/tokens.css 的私有令牌（那份只有 :root、无暗色变体）。 */
.sdb {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sdb.is-embedded {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 14px 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* ---------- 头部 ---------- */
.sdb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 11px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.sdb-who {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.sdb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sdb-dot.is-up {
  background: var(--el-color-success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 18%, transparent);
}
.sdb-dot.is-down {
  background: var(--el-text-color-placeholder);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-text-color-placeholder) 16%, transparent);
}
.sdb-dot.is-err {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-danger) 18%, transparent);
}
.sdb-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.sdb-id {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.sdb-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  i {
    font-style: normal;
    color: var(--el-text-color-placeholder);
  }
}
.sdb-head-ops {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ---------- 通用卡片 ---------- */
.sdb-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 12px 14px;
}
.sdb-sec {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.sdb-sec-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.sdb-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.sdb-dim {
  color: var(--el-text-color-secondary);
  font-weight: 400;
}
.sdb-mono {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
}
.sdb-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

/* ---------- 流水线 ---------- */
/* 环多时横向滚动，不把每一环压成读不出名字的细条：环宽有下限，宽度不够就滚 */
.sdb-flow {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding-bottom: 6px;
  overflow-x: auto;
}
.sdb-node {
  flex: 1 1 132px;
  min-width: 118px;
  max-width: 300px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  padding: 8px 9px;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.sdb-node.is-io {
  flex: 0 0 46px;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-style: dashed;
  cursor: default;
}
.sdb-node.is-stage {
  cursor: pointer;
  text-align: left;
}
.sdb-node.is-stage:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color-lighter));
}
.sdb-node.is-stage:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--el-color-primary) 55%, transparent);
  outline-offset: 1px;
}
.sdb-node.is-sel {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.sdb-node.is-off {
  background: var(--el-fill-color-lighter);
  border-style: dashed;
  opacity: 0.8;
}
.sdb-node.is-off .sdb-node-name,
.sdb-node.is-off .sdb-node-type {
  color: var(--el-text-color-placeholder);
}
.sdb-node-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.sdb-node-idx {
  font-size: 10px;
  line-height: 1;
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
  letter-spacing: 0.04em;
}
.sdb-node-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sdb-node-type {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sdb-node-foot {
  margin-top: 3px;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  text-align: right;
}
.sdb-arrow {
  flex: 0 0 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-border-color);
  font-size: 12px;
  user-select: none;
}

/* 选中环参数面板 */
.sdb-stage {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-blank);
}
.sdb-stage-head {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.sdb-stage-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.sdb-stage-ops {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.sdb-stage-desc {
  margin-top: 3px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.sdb-stage-require {
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-color-warning-dark-2);
}
.sdb-params {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 4px 16px;
  margin-top: 8px;
}
.sdb-param {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  padding: 2px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.sdb-param-k {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, monospace;
  flex-shrink: 0;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sdb-param-v {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 规格带 ---------- */
/* 用 1px 缝拼成一张小规格表：字段再多也只是换行，不会把每格挤成两行字 */
.sdb-spec {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1px;
  overflow: hidden;
  background: var(--el-border-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.sdb-spec-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 8px 12px;
  font-size: 12px;
  background: var(--el-bg-color);
  > span {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
  > b {
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.sdb-spec-item.is-wide {
  grid-column: 1 / -1;
  align-items: flex-start;
  > b {
    white-space: normal;
  }
}
.sdb-url {
  color: var(--el-color-primary) !important;
  cursor: pointer;
}

.sdb-url:hover {
  text-decoration: underline;
}
.sdb-error-text {
  color: var(--el-color-danger) !important;
  font-size: 12px;
  font-weight: 400 !important;
}

/* ---------- 协议配置 ---------- */
.sdb-proto summary {
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
  gap: 6px;
  list-style: none;
}
.sdb-proto summary::-webkit-details-marker {
  display: none;
}
.sdb-proto[open] summary {
  font-weight: 600;
  margin-bottom: 8px;
}
.sdb-count {
  font-size: 11px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
.sdb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.sdb-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, monospace;
  b {
    margin-left: 4px;
    color: var(--el-text-color-primary);
  }
}
.sdb-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 2px 2px 0;
}

/* ---------- 插件配置页 ---------- */
.sdb-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 窄屏：流水线横向滚动，规格带改两列 */
@media (max-width: 720px) {
  .sdb-flow {
    overflow-x: auto;
    padding-bottom: 6px;
  }
  .sdb-node {
    flex: 0 0 104px;
  }
  .sdb-node.is-io {
    flex: 0 0 46px;
  }
  .sdb-spec-item {
    flex: 1 1 45%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sdb-node {
    transition: none;
  }
}
</style>
