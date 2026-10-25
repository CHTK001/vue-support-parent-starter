<script setup lang="ts">
/**
 * 服务管理 —— 协议服务器节点（Server 接口 + ServerFilter 插件）
 *
 * 职责：Server 节点增删改查、启停与热更新、过滤器链编排（编辑抽屉）、
 * 运行态与链路查看（详情抽屉）。
 *
 * 界面形态（「机架」）：一条服务占一行槽位，端口号是每行最左边的固定列，
 * 状态灯打在最前面，左侧竖轨按状态分组计数。理由很直白：服务节点的本质是
 * 「一个端口在听」，而这一页最常见的动作是「一眼扫过所有端口、看哪盏灯不对」，
 * 所以一屏的密度优先，链路上的插件压成一行胶囊，参数与顺序留给详情抽屉。
 *
 * 分层：
 *   - `service/serviceView.ts`     纯函数：后端行 → 展示对象（端口文本、链路、后端地址）
 *   - `service/useServiceNodes.ts` 取数与动作：状态、自动刷新、启停、抽屉开合
 *   - `service/service-kit.css`    与页面无关的原子样式（状态灯、胶囊、空态）
 *
 * 本文件只保留「机架」这一种布局。降级提示与两个抽屉放在这一层而不是视图中：
 * 元数据拉不到时必须出声，而「编辑 / 详情」是唯一入口，它们不能随布局变化。
 */
import { computed } from 'vue';
import ScServerFormDrawer from '../components/ScServerFormDrawer.vue';
import ScServerDetailDrawer from '../components/ScServerDetailDrawer.vue';
import { useServiceNodes } from './service/useServiceNodes';
import {
  primaryActionOf,
  stateClassOf,
  type ServiceChip,
  type ServiceNodeCard,
} from './service/serviceView';
import type { ServerNodeView } from '../api';
import './service/service-kit.css';

const vm = useServiceNodes();

/** 分布条的悬停说明：分布图没有刻度，悬停要能读到准确数字 */
const distTitle = computed(
  () => `运行 ${vm.statusCounts.running} · 异常 ${vm.statusCounts.error} · 已停止 ${vm.statusCounts.stopped}`,
);

/** 左轨的状态分组 */
const statusTabs = computed<
  Array<{ label: string; value: '' | 'RUNNING' | 'ERROR' | 'STOPPED'; count: number; dot: string }>
>(() => [
  { label: '全部', value: '', count: vm.statusCounts.all, dot: '' },
  { label: '运行中', value: 'RUNNING', count: vm.statusCounts.running, dot: 'is-run' },
  { label: '异常', value: 'ERROR', count: vm.statusCounts.error, dot: 'is-err' },
  { label: '已停止', value: 'STOPPED', count: vm.statusCounts.stopped, dot: 'is-stop' },
]);

/**
 * 由卡片找回后端行。
 *
 * 卡片是展示数据，动作接口要的是后端行；列表刚刷新时该行可能已经不在了，
 * 所以调用方必须允许 undefined。
 *
 * @param card 展示数据
 */
function nodeOf(card: ServiceNodeCard): ServerNodeView | undefined {
  return vm.nodes.find(node => node.id === card.id);
}

/**
 * 主操作：运行中→停止，异常→重启，其余→启动。
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

/**
 * 主操作的文案
 *
 * @param card 展示数据
 */
function primaryLabel(card: ServiceNodeCard): string {
  const action = primaryActionOf(card);
  return action === 'stop' ? '停止' : action === 'restart' ? '重启' : '启动';
}

/**
 * 主操作的图标
 *
 * @param card 展示数据
 */
function primaryIcon(card: ServiceNodeCard): string {
  const action = primaryActionOf(card);
  if (action === 'stop') return 'VideoPause';
  if (action === 'restart') return 'Refresh';
  return 'VideoPlay';
}

/**
 * 主操作的色调
 *
 * @param card 展示数据
 */
function primaryTone(card: ServiceNodeCard): 'success' | 'warning' {
  return primaryActionOf(card) === 'start' ? 'success' : 'warning';
}

/**
 * 行内动作统一在这里转发；找不到行时静默跳过（列表已刷新，用户点了旧行）
 *
 * @param card 展示数据
 * @param what 动作
 */
function runRow(card: ServiceNodeCard, what: 'edit' | 'clone' | 'detail' | 'remove'): void {
  const node = nodeOf(card);
  if (!node) return;
  if (what === 'edit') vm.openEdit(node);
  else if (what === 'clone') vm.openClone(node);
  else if (what === 'detail') vm.openDetail(node);
  else void vm.remove(node);
}

/**
 * 插件胶囊的悬停说明：顺序、启用态、参数条数都在这里交代
 *
 * @param chip 插件
 */
function chipTitle(chip: ServiceChip): string {
  return `#${chip.order} ${chip.type} · ${chip.enabled ? '启用' : '已停用'} · 参数 ${chip.paramCount} 项`;
}

/**
 * 新窗口打开访问地址
 *
 * @param url 地址
 */
function openUrl(url: string): void {
  window.open(url, '_blank', 'noopener');
}
</script>

<template>
  <div class="service-manage sc-page">
    <!-- 降级提示：协议或插件元数据失败时必须出声，否则用户只看到「协议下拉是空的」，
         无从判断是故障还是没权限 -->
    <el-alert
      v-if="vm.notice.show"
      :type="vm.notice.tone"
      :title="vm.notice.text"
      show-icon
      :closable="false"
      class="load-notice"
    />

    <!-- ============ 控制条：一行装下计数、分布、搜索、新增 ============ -->
    <div class="rack__bar">
      <div class="rack__counts">
        <span class="rack__big sv-mono">{{ vm.statusCounts.running }}</span>
        <span class="rack__of sv-mono">/ {{ vm.stats.total }}</span>
        <span class="rack__cap">运行中</span>
      </div>

      <!-- 三段分布：宽度就是占比，比再多画两个数字更快读懂「健康度」。
           为 0 的一段不要渲染：它带着 min-width，会留下一条 2px 的红/灰细线，
           看着像「有一台异常」 -->
      <div class="rack__dist" :title="distTitle">
        <span v-if="vm.statusCounts.running" class="rack__seg is-run" :style="{ flex: vm.statusCounts.running }" />
        <span v-if="vm.statusCounts.error" class="rack__seg is-err" :style="{ flex: vm.statusCounts.error }" />
        <span v-if="vm.statusCounts.stopped" class="rack__seg is-stop" :style="{ flex: vm.statusCounts.stopped }" />
        <span v-if="!vm.stats.total" class="rack__seg is-none" />
      </div>

      <!-- 宽度写在包一层的 div 上：ReInput / ReSelect 的根节点自己带着 width:100%，
           把宽度类挂在组件上会被它自己的样式盖掉，输入框就会吃掉整条工具条 -->
      <div class="rack__search">
        <ReInput
          v-model="vm.keyword"
          aria-label="搜索服务"
          placeholder="名称 / 端口 / 报错关键字"
          clearable
          prefix-icon="Search"
        />
      </div>
      <div class="rack__proto">
        <ReSelect
          v-model="vm.protocol"
          aria-label="按协议筛选"
          :data="vm.protocolOptions"
          placeholder="全部协议"
          clearable
        />
      </div>
      <ReButton icon="Plus" layout="square" type="primary" tip="新增服务" @click="vm.openCreate()" />
      <ReButton icon="Refresh" layout="square" tip="刷新" :loading="vm.loading" @click="vm.refresh()" />
    </div>

    <div class="rack__body">
      <!-- ============ 左轨：按状态分组，点击即筛 ============ -->
      <aside class="rack__rail">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          type="button"
          class="rail__item"
          :class="{ 'is-active': vm.status === tab.value }"
          :aria-pressed="vm.status === tab.value"
          @click="vm.status = tab.value"
        >
          <i class="sv-dot" :class="tab.dot" />
          <span class="rail__label">{{ tab.label }}</span>
          <span class="rail__n sv-mono">{{ tab.count }}</span>
        </button>

        <div class="rail__foot">
          <span class="sv-faint">已挂插件</span>
          <span class="sv-mono">{{ vm.stats.plugins }}</span>
        </div>
      </aside>

      <!-- ============ 槽位列表 ============ -->
      <div class="rack__slots">
        <article
          v-for="card in vm.visibleCards"
          :key="card.id"
          class="slot"
          :class="`is-${stateClassOf(card)}`"
        >
          <span class="slot__led" :class="stateClassOf(card)" aria-hidden="true" />

          <div class="slot__port">
            <span class="sv-mono slot__portnum">{{ card.portText }}</span>
            <span class="sv-proto" :class="{ 'is-proxy': card.isProxy }">{{ card.protocolCode }}</span>
          </div>

          <div class="slot__main">
            <div class="slot__name">
              <span class="sv-ellipsis slot__nametext">{{ card.name }}</span>
              <span v-if="card.remark" class="sv-faint slot__remark sv-ellipsis">{{ card.remark }}</span>
            </div>
            <div class="slot__meta sv-mono">
              <span class="sv-dim">{{ card.listenText }}</span>
              <span class="sv-faint">·</span>
              <span class="sv-dim">{{ card.engine }}</span>
              <!-- 后端目标排在「随进程启动」前面：窄屏时这一行会从右边被截掉，
                   被截掉的应该是「怎么起」而不是「转发到哪」 -->
              <template v-if="card.backendText">
                <span class="sv-faint">·</span>
                <span class="sv-dim">{{ card.backendText }}</span>
              </template>
              <span class="sv-faint">·</span>
              <span class="sv-dim">{{ card.enabledText }}</span>
            </div>
            <div v-if="card.reason" class="slot__err" :title="card.reason">{{ card.reason }}</div>
          </div>

          <div class="slot__chain sv-chain">
            <template v-if="card.chips.length">
              <template v-for="(chip, i) in card.chips" :key="chip.key">
                <span class="sv-arrow" v-if="i">›</span>
                <span class="sv-chip" :class="{ 'is-off': !chip.enabled }" :title="chipTitle(chip)"
                  ><span>{{ chip.text }}</span></span
                >
              </template>
            </template>
            <span v-else class="sv-faint slot__direct">直通</span>
          </div>

          <button
            v-if="card.url"
            type="button"
            class="sv-url slot__url"
            :title="`在新窗口打开 ${card.url}`"
            @click="openUrl(card.url)"
          >
            <span>{{ card.url }}</span>
          </button>
          <span v-else class="sv-faint slot__url">无访问地址</span>

          <span class="sv-state slot__state" :class="stateClassOf(card)">
            <i class="sv-dot" :class="stateClassOf(card)" />
            {{ card.statusText }}
          </span>

          <div class="sv-ops slot__ops">
            <ReButton
              :icon="primaryIcon(card)"
              layout="square"
              :type="primaryTone(card)"
              :tip="primaryLabel(card)"
              :loading="vm.actingId === card.id"
              @click="runPrimary(card)"
            />
            <ReButton icon="View" layout="square" type="primary" tip="详情" @click="runRow(card, 'detail')" />
            <ReButton icon="Edit" layout="square" tip="编辑" @click="runRow(card, 'edit')" />
            <ReButton icon="Copy" layout="square" tip="克隆" @click="runRow(card, 'clone')" />
            <ReButton icon="Delete" layout="square" type="danger" tip="删除" @click="runRow(card, 'remove')" />
          </div>
        </article>

        <div v-if="!vm.visibleCards.length" class="sv-empty">
          <span class="sv-empty__title">{{ vm.filtered ? '没有匹配的服务' : '还没有服务节点' }}</span>
          <span class="sv-empty__desc">
            {{
              vm.filtered
                ? '当前搜索 / 协议 / 状态条件下一个都没命中。清掉条件，或确认该协议是否真的没建过节点。'
                : '服务节点就是「在某个端口上听某个协议」。建第一个之前，先想清楚要暴露哪个协议与端口。'
            }}
          </span>
          <ReButton v-if="vm.filtered" show-text icon="Refresh" @click="vm.resetFilters()">清空条件</ReButton>
          <ReButton v-else show-text icon="Plus" type="primary" @click="vm.openCreate()">新增服务</ReButton>
        </div>
      </div>
    </div>

    <ScServerFormDrawer
      v-model="vm.formVisible"
      :node="vm.editingNode"
      :protocols="vm.protocols"
      :filter-types="vm.filterTypes"
      :existing-names="vm.existingNames"
      :clone-source="vm.editingNode?.id === 0 ? vm.editingNode : null"
      @saved="vm.refresh()"
    />

    <ScServerDetailDrawer
      v-model="vm.detailVisible"
      :node-id="vm.detailNodeId"
      :filter-types="vm.filterTypes"
      @changed="vm.refresh()"
      @open-detail-page="vm.openDetailPage"
    />
  </div>
</template>

<style scoped lang="scss">
.service-manage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.load-notice {
  flex: none;
  margin: 0;
}

/* ============ 控制条 ============ */
.rack__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.rack__counts {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex: none;
}

.rack__big {
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.rack__of {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.rack__cap {
  margin-left: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rack__dist {
  display: flex;
  gap: 2px;
  flex: 1 1 120px;
  max-width: 260px;
  min-width: 80px;
  height: 6px;
}

.rack__seg {
  min-width: 2px;
  border-radius: 3px;
  transition: flex 240ms ease-out;
}

.rack__seg.is-run {
  background: var(--status-success, var(--el-color-success));
}

.rack__seg.is-err {
  background: var(--status-error, var(--el-color-danger));
}

.rack__seg.is-stop {
  background: var(--el-border-color);
}

.rack__seg.is-none {
  flex: 1;
  background: var(--el-fill-color);
}

.rack__search {
  flex: none;
  width: 240px;
  margin-left: auto;
}

.rack__proto {
  flex: none;
  width: 190px;
}

/* ============ 主体 ============ */
.rack__body {
  display: flex;
  flex: 1 1 0;
  gap: 10px;
  min-height: 0;
}

.rack__rail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: none;
  width: 150px;
  padding: 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.rail__item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  text-align: left;
}

.rail__item:hover {
  background: var(--el-fill-color-light);
}

.rail__item.is-active {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 9%, transparent);
}

.rail__item:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -1px;
}

.rail__label {
  flex: 1 1 auto;
}

.rail__n {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.rail__item.is-active .rail__n {
  color: var(--el-color-primary);
}

.rail__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 8px 8px 2px;
  font-size: 11px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ============ 槽位 ============ */
.rack__slots {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 0;
  min-width: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.slot {
  display: grid;
  grid-template-columns: 3px 92px minmax(200px, 1.5fr) minmax(110px, 0.9fr) minmax(120px, 0.9fr) 84px auto;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition: border-color 160ms ease-out;
}

.slot:hover {
  border-color: var(--el-border-color);
}

/* 左侧那道灯条：状态的三档在扫视时最先被看到，比文字更快 */
.slot__led {
  width: 3px;
  height: 30px;
  border-radius: 2px;
  background: var(--el-border-color);
}

.slot__led.is-run {
  background: var(--status-success, var(--el-color-success));
}

.slot__led.is-err {
  background: var(--status-error, var(--el-color-danger));
}

.slot__port {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-start;
}

.slot__portnum {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.slot__main {
  min-width: 0;
}

.slot__name {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.slot__nametext {
  flex: 0 1 auto;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.slot__remark {
  flex: 1 1 auto;
  max-width: 45%;
  font-size: 11px;
  font-weight: 400;
}

.slot__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
  font-size: 11px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.slot__err {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--status-error, var(--el-color-danger));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot__direct {
  font-size: 11px;
}

.slot__url {
  font-size: 11px;
}

.slot__ops {
  justify-self: end;
}

/* ============ 窄屏 ============ */
@media (max-width: 1180px) {
  .slot {
    grid-template-columns: 3px 84px minmax(0, 1fr) 80px auto;
  }

  .slot__chain,
  .slot__url {
    display: none;
  }
}

@media (max-width: 860px) {
  .rack__dist {
    display: none;
  }

  .rack__body {
    flex-direction: column;
  }

  .rack__rail {
    flex-direction: row;
    width: auto;
    overflow-x: auto;
  }

  .rail__foot {
    display: none;
  }
}
</style>
