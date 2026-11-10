<script setup lang="ts">
/**
 * 服务管理 —— Server 节点详情抽屉（外壳 + 数据/动作层）。
 *
 * <p>上一版这个文件里有<b>两套一模一样的模板</b>：抽屉模式一套、嵌入 ReTabs 页签一套，
 * 各约 250 行，任何字段、任何按钮改动都要改两遍，改漏一处就变成「抽屉里有、页签里没有」。
 * 现在渲染只剩一份 —— {@link ScServerDetailBody}；本文件只保留<b>它必须独占的东西</b>：</p>
 *
 * <p>   ① 外壳差异：ReDrawer 包裹 vs 直接铺进 ReTabs 面板；
 *   ② 数据获取：nodeId 变化 / 抽屉打开 / 嵌入首次挂载时拉取节点；
 *   ③ 动作执行：启停重启、插件热启停、参数热更新、移除插件、复制地址 —— 都是要发请求的，
 *      留给本层统一处理成功/失败提示与刷新，正文组件只负责「表达意图」。</p>
 *
 * <p>这样正文可以专心按「请求流水线」组织信息（状态 → 流水线 → 选中环参数 → 规格带 → 协议配置），
 * 也不再需要知道 embedded 与否 —— 只有内边距与滚动由外层壳决定。</p>
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
import ScServerDetailBody from './ScServerDetailBody.vue';

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
/** 当前配置的过滤器下标 */
const activeIndex = ref(0);
/** 节点数据 */
const node = ref<ServerNodeView | null>(null);
/** 加载中 */
const loading = ref(false);
/** 操作中 */
const acting = ref(false);

/** 是否运行中（插件能否热操作） */
const isLive = computed(() => node.value?.status === 'RUNNING');

/** 抽屉标题：详情显示节点名，配置页显示插件名 */
const drawerTitle = computed(() =>
  view.value === 'detail'
    ? `服务详情 - ${node.value?.name || ''}`
    : `插件配置 - ${node.value?.filters?.[activeIndex.value]?.name || ''}`,
);

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

/** 拉取节点状态 */
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

/** 统一包一层动作执行：置 acting、报错、刷新、通知父级列表 */
async function run(action: () => Promise<unknown>, okText: string) {
  acting.value = true;
  try {
    await action();
    message.success(okText);
    await load();
    emit('changed');
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    acting.value = false;
  }
}

/** 启动 */
function onStart() {
  if (!node.value) return;
  const id = node.value.id;
  run(() => startServerNode(id), '服务已启动');
}

/** 停止 */
function onStop() {
  if (!node.value) return;
  const id = node.value.id;
  run(() => stopServerNode(id), '服务已停止');
}

/** 重启（先停再启，用于 ERROR 节点排障） */
function onRestart() {
  if (!node.value) return;
  const id = node.value.id;
  run(() => restartServerNode(id), '服务已重启');
}

/** 热切换单个过滤器启停 */
function onToggleFilter(index: number, enabled: boolean) {
  if (!node.value) return;
  const id = node.value.id;
  run(() => toggleServerFilter(id, index, enabled), `插件已${enabled ? '启用' : '停用'}（热生效，服务未中断）`);
}

/**
 * 从过滤器链上移除指定下标的插件（走全量热更新，不中断服务）。
 *
 * <p>剩余插件的 order 重新按 100/110/120… 编号，与表单页保持同一口径。</p>
 */
function onRemoveFilter(index: number) {
  if (!node.value) return;
  const current = node.value;
  const target = current.filters?.[index];
  if (!target) return;
  const remaining = (current.filters || []).filter((_, i) => i !== index);
  run(
    () =>
      hotUpdateServerNode(current.id, {
        name: current.name,
        protocol: current.protocol,
        engine: current.engine,
        host: current.host,
        port: current.port,
        enabled: current.enabled,
        remark: current.remark,
        config: current.config || {},
        filters: remaining.map((f, i) => ({
          name: f.name,
          type: f.type,
          order: 100 + i * 10,
          enabled: f.enabled,
          params: f.params || {},
        })),
      }),
    `已移除插件「${target.name}」`,
  );
}

/** 热更新当前插件参数：成功后回到详情视图看结果 */
async function onApplyParams(index: number, params: Record<string, string>) {
  if (!node.value) return;
  const id = node.value.id;
  acting.value = true;
  try {
    await updateServerFilterParams(id, index, params);
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
  <!-- ============ 非嵌入：抽屉外壳 ============ -->
  <ReDrawer
    v-if="!props.embedded"
    v-model="visible"
    :title="drawerTitle"
    :size="view === 'detail' ? 820 : 760"
    direction="rtl"
    close-only
    :footer-hidden="true"
  >
    <template #content>
      <div class="server-detail">
        <ScServerDetailBody
          :node="node"
          :loading="loading"
          :acting="acting"
          :filter-types="filterTypes"
          :view="view"
          :active-index="activeIndex"
          @update:view="v => (view = v)"
          @update:active-index="v => (activeIndex = v)"
          @refresh="load"
          @start="onStart"
          @stop="onStop"
          @restart="onRestart"
          @copy-url="copyServerUrl"
          @toggle-filter="onToggleFilter"
          @remove-filter="onRemoveFilter"
          @apply="onApplyParams"
          @open-detail-page="(row: ServerNodeView, i: number) => emit('open-detail-page', row, i)"
        />
      </div>
    </template>
  </ReDrawer>

  <!-- ============ 嵌入：ReTabs 工作区页签内容，去掉抽屉外壳直接铺进面板 ============ -->
  <ScServerDetailBody
    v-else
    embedded
    :node="node"
    :loading="loading"
    :acting="acting"
    :filter-types="filterTypes"
    :view="view"
    :active-index="activeIndex"
    @update:view="v => (view = v)"
    @update:active-index="v => (activeIndex = v)"
    @refresh="load"
    @start="onStart"
    @stop="onStop"
    @restart="onRestart"
    @copy-url="copyServerUrl"
    @toggle-filter="onToggleFilter"
    @remove-filter="onRemoveFilter"
    @apply="onApplyParams"
    @open-detail-page="(row: ServerNodeView, i: number) => emit('open-detail-page', row, i)"
  />
</template>

<style scoped lang="scss">
/* 抽屉模式：内容区自己排布，不再有第二份模板 */
.server-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
