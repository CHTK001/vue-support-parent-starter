<script setup lang="ts">
/**
 * 服务管理 —— 节点清单（三种密度共用一份）
 *
 * <p>三种外壳对清单的要求不同：台账要能横扫（表头 + 对齐的列）、机架要两行信息、
 * 控制台要树状紧凑。差异全在 {@code mode} 上，节点怎么算、点了做什么仍只有一份，
 * 避免三个方向各自实现导致行为分叉。</p>
 *
 * <p>行内操作只在悬停/聚焦/选中时出现：常态不占宽度，键盘 Tab 仍可达。</p>
 */
import { computed } from 'vue'
import ReIcon from '@repo/ui/re-icon'
import type { SvcShellProps } from './context'

const props = withDefaults(
  defineProps<
    SvcShellProps & {
      /** 清单形态：表格 / 双行列表 / 树状紧凑 */
      mode?: 'table' | 'list' | 'tree'
      /** 是否按协议分组（表格模式下分组头是一整行） */
      grouped?: boolean
    }
  >(),
  { mode: 'list', grouped: true },
)

/** 分组后的可见节点：未分组时塞进一个虚拟组，模板只有一条路径 */
const groups = computed(() =>
  props.grouped
    ? props.ctx.protocolGroups
    : [{ key: '__all__', protocolText: '全部', cards: props.ctx.vm.visibleCards, running: 0 }],
)
</script>

<template>
  <div class="snl" :class="`is-${props.mode}`">
    <!-- 表格模式：列头。列宽与行一致，靠同一套 grid 模板保证对齐 -->
    <div v-if="props.mode === 'table' && props.ctx.vm.visibleCards.length" class="snl-head" role="row">
      <span />
      <span>服务</span>
      <span>协议</span>
      <span>监听</span>
      <span class="snl-num">插件</span>
      <span class="snl-backend">后端</span>
      <span>状态</span>
      <span class="snl-ops-col" />
    </div>

    <template v-for="group in groups" :key="group.key">
      <!-- 分组头：表格模式是一整行，其余模式是小标题 -->
      <button
        v-if="props.grouped"
        type="button"
        class="snl-group"
        :aria-expanded="!props.ctx.collapsedGroups.has(group.key)"
        @click="props.ctx.toggleGroup(group.key)"
      >
        <ReIcon
          name="ArrowDown"
          :size="12"
          class="snl-group__caret"
          :class="{ 'is-folded': props.ctx.collapsedGroups.has(group.key) }"
        />
        <span class="snl-group__name sv-ellipsis">{{ group.protocolText }}</span>
        <span v-if="group.running" class="snl-group__run">
          <i class="sv-dot is-run" />{{ group.running }}
        </span>
        <span class="snl-group__n sv-mono">{{ group.cards.length }}</span>
      </button>

      <div v-show="!props.grouped || !props.ctx.collapsedGroups.has(group.key)" class="snl-rows">
        <div
          v-for="card in group.cards"
          :key="card.id"
          class="snl-row"
          :class="{
            'is-active': props.ctx.activeNodeId === card.id,
            'is-selected': props.ctx.selectedNodeId === card.id && props.ctx.activeNodeId !== card.id,
            'is-error': card.status === 'ERROR',
          }"
          :title="card.listenText"
          role="row"
          tabindex="0"
          @click="props.ctx.onRowClick(card)"
          @dblclick="props.ctx.onRowDblClick(card)"
          @keydown.enter.prevent="props.ctx.onRowDblClick(card)"
          @contextmenu="props.ctx.openCtxMenuFromButton($event, card)"
        >
          <i class="sv-dot snl-dot" :class="props.ctx.stateClassOf(card)" aria-hidden="true" />

          <span class="snl-name sv-ellipsis">
            {{ card.name }}
            <em v-if="props.mode === 'list'" class="snl-name-port sv-mono">{{ card.portText }}</em>
          </span>

          <span v-if="props.mode === 'table'" class="snl-proto sv-ellipsis">
            <b>{{ card.protocolText }}</b>
            <i v-if="card.engine">· {{ card.engine }}</i>
          </span>

          <span v-if="props.mode === 'table'" class="snl-listen sv-mono sv-ellipsis">{{ card.listenText }}</span>
          <span v-if="props.mode === 'table'" class="snl-num sv-mono" :title="`${card.filterCount} 个插件，${card.activeFilterCount} 个生效`">
            <b>{{ card.filterCount }}</b><i>/{{ card.activeFilterCount }}</i>
          </span>
          <span v-if="props.mode === 'table'" class="snl-backend sv-ellipsis" :title="card.backendText || '—'">
            <template v-if="card.backendText">{{ card.backendText }}</template>
            <template v-else>—</template>
          </span>
          <span v-if="props.mode === 'table'" class="snl-status">
            <span :class="{ 'is-err-text': card.status === 'ERROR' }">{{ card.statusText }}</span>
            <span v-if="card.reason" class="snl-reason sv-ellipsis" :title="card.reason">{{ card.reason }}</span>
          </span>

          <!-- 树状：右端只留端口，名字才有宽度 -->
          <span v-if="props.mode === 'tree'" class="snl-tree-port sv-mono">{{ card.portText }}</span>
          <!-- 双行：第二行只放协议 + 端口 + 插件数；引擎与后端在详情里看 -->
          <span v-else-if="props.mode === 'list'" class="snl-meta sv-ellipsis">
            <span class="snl-meta-proto sv-ellipsis">{{ card.protocolText }}</span>
            <i>{{ card.portText }}</i>
            <i v-if="card.filterCount">· {{ card.filterCount }} 插件</i>
          </span>

          <span v-if="props.mode !== 'table'" class="snl-state">
            <span v-if="card.status === 'ERROR'" class="snl-state-text is-err-text">异常</span>
          </span>

          <span class="snl-ops">
            <button
              v-if="props.ctx.isRoomCard(card)"
              type="button"
              title="打开房间工作台"
              @click.stop="props.ctx.openRoomFromCard(card)"
            >
              <ReIcon name="Connection" :size="13" />
            </button>
            <button
              type="button"
              :title="props.ctx.primaryLabel(card)"
              :disabled="props.ctx.vm.actingId === card.id"
              @click.stop="props.ctx.runPrimary(card)"
            >
              <ReIcon :name="props.ctx.primaryIcon(card)" :size="13" />
            </button>
            <button type="button" title="查看详情" @click.stop="props.ctx.openTab(card, 'detail')">
              <ReIcon name="View" :size="13" />
            </button>
            <button type="button" title="过滤器链" @click.stop="props.ctx.openTab(card, 'filter')">
              <ReIcon name="Filter" :size="13" />
            </button>
            <button type="button" title="更多操作" @click.stop="props.ctx.openCtxMenuFromButton($event, card)">
              <ReIcon name="MoreFilled" :size="13" />
            </button>
          </span>
        </div>
      </div>
    </template>

    <div v-if="!props.ctx.vm.visibleCards.length" class="snl-empty">
      <ReIcon name="Files" :size="22" />
      <span>{{ props.ctx.vm.filtered ? '没有匹配的服务' : '还没有服务节点' }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 颜色只用 Element 语义令牌：暗色模式跟着翻，不留私有亮色 */
.snl {
  --snl-cols: 12px minmax(120px, 1.4fr) minmax(96px, 1fr) minmax(112px, 1.1fr) 52px minmax(130px, 1.2fr) 76px 116px;
  min-width: 0;
  overflow-x: auto;
}

.snl-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: var(--snl-cols);
  gap: 10px;
  align-items: center;
  padding: 0 10px 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.snl-head span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 分组头：三档模式共用，表格模式下压成一条细行 */
.snl-group {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 7px 10px;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  text-align: left;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
}

.snl-group:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-lighter, #fafafa);
}

.snl-group__caret {
  flex: none;
  transition: transform 0.16s ease;
}

.snl-group__caret.is-folded {
  transform: rotate(-90deg);
}

.snl-group__name {
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.snl-group__run {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.snl-group__n {
  margin-left: auto;
  font-size: 11px;
}

/* ==================== 行 ==================== */

.snl-row {
  position: relative;
  display: grid;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background 0.12s ease;
}

.snl-row:last-child {
  border-bottom: 0;
}

.snl-row:hover {
  background: var(--el-fill-color-light);
}

.snl-row.is-selected {
  background: var(--el-color-primary-light-9);
}

/* 活动行：左侧一条 2px 主色，不用整片高饱和底 */
.snl-row.is-active {
  background: var(--el-color-primary-light-9);
  box-shadow: inset 2px 0 0 var(--el-color-primary);
}

.snl-row:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.snl-dot {
  justify-self: center;
}

.snl-name {
  display: flex;
  gap: 8px;
  align-items: baseline;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.snl-name-port {
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.snl-proto {
  display: flex;
  gap: 5px;
  align-items: baseline;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.snl-proto b {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snl-proto i {
  flex: none;
  font-size: 11px;
  font-style: normal;
  color: var(--el-text-color-secondary);
}

.snl-listen {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.snl-num {
  font-size: 12px;
  text-align: right;
  color: var(--el-text-color-regular);
}

.snl-num b {
  font-weight: 600;
}

.snl-num i {
  font-style: normal;
  color: var(--el-text-color-placeholder);
}

.snl-backend {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.snl-status {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
}

.snl-reason {
  font-size: 10.5px;
  color: var(--el-color-danger);
}

.snl-meta {
  display: flex;
  gap: 6px;
  align-items: baseline;
  min-width: 0;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.snl-meta i {
  flex: none;
  font-style: normal;
}

.snl-meta-proto {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snl-tree-port {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.snl-state {
  font-size: 11px;
}

.snl-state-text {
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--el-color-danger-light-9);
}

/* 行内操作：悬停/聚焦/选中浮出，常态不占位 */
.snl-ops {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.snl-row:hover .snl-ops,
.snl-row:focus-within .snl-ops,
.snl-row.is-active .snl-ops,
.snl-row.is-selected .snl-ops {
  opacity: 1;
}

.snl-ops button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.snl-ops button:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.snl-ops button:disabled {
  cursor: progress;
  opacity: 0.45;
}

.snl-empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 34px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ==================== 表格模式 ==================== */

.snl.is-table .snl-row {
  grid-template-columns: var(--snl-cols);
  min-height: 40px;
}

/* ==================== 双行列表 ==================== */

.snl.is-list .snl-row {
  grid-template-columns: 12px minmax(0, 1fr) auto;
  grid-template-areas:
    'dot name name'
    'dot meta state';
  row-gap: 2px;
  min-height: 44px;
  padding: 7px 10px;
}

.snl.is-list .snl-dot {
  grid-area: dot;
  align-self: start;
  margin-top: 6px;
}

.snl.is-list .snl-name {
  grid-area: name;
  padding-right: 84px;
}

.snl.is-list .snl-meta {
  grid-area: meta;
}

.snl.is-list .snl-state {
  grid-area: state;
}

/* 行内操作压在名称行右端：不占栅格宽度，否则 268px 的栏宽会把名字截成半截 */
.snl.is-list .snl-ops {
  position: absolute;
  top: 5px;
  right: 6px;
  padding-left: 18px;
  background: linear-gradient(90deg, transparent, var(--el-bg-color) 26%);
}

.snl.is-list .snl-row:hover .snl-ops,
.snl.is-list .snl-row.is-selected .snl-ops {
  background: linear-gradient(90deg, transparent, var(--el-fill-color-light) 26%);
}

.snl.is-list .snl-row.is-active .snl-ops {
  background: linear-gradient(90deg, transparent, var(--el-color-primary-light-9) 26%);
}

/* ==================== 树状紧凑 ==================== */

.snl.is-tree .snl-row {
  grid-template-columns: 12px minmax(0, 1fr) auto;
  grid-template-areas: 'dot name meta';
  min-height: 32px;
}

.snl.is-tree .snl-dot {
  grid-area: dot;
}

.snl.is-tree .snl-name {
  grid-area: name;
  font-size: 12.5px;
}

.snl.is-tree .snl-tree-port {
  grid-area: meta;
}

.snl.is-tree .snl-ops {
  position: absolute;
  right: 6px;
  padding-left: 18px;
  background: linear-gradient(90deg, transparent, var(--el-bg-color) 22%);
}

.snl.is-tree .snl-row:hover .snl-ops,
.snl.is-tree .snl-row.is-active .snl-ops {
  background: linear-gradient(90deg, transparent, var(--el-fill-color-light) 22%);
}

.snl.is-tree .snl-group {
  padding: 5px 10px;
}

/* 窄屏：表格退化成双行，省掉后端与插件两列（信息仍在悬停提示里） */
@media (width <= 1180px) {
  .snl.is-table .snl-head span:nth-child(5),
  .snl.is-table .snl-head span:nth-child(6),
  .snl.is-table .snl-row .snl-num,
  .snl.is-table .snl-row .snl-backend {
    display: none;
  }

  .snl.is-table .snl-row {
    grid-template-columns: 12px minmax(120px, 1.4fr) minmax(96px, 1fr) minmax(112px, 1.1fr) 76px 116px;
  }

  .snl.is-table .snl-head {
    grid-template-columns: 12px minmax(120px, 1.4fr) minmax(96px, 1fr) minmax(112px, 1.1fr) 76px 116px;
  }
}
</style>
