<!--
  RePageStage —— 一个管理页的「舞台」

  它是这次重构的落点：七个同构页面（会话审计 / 批量作业 / 片段管理 / 维护计划 /
  ACME 证书 / 抓包分析 / PCAP 分析）从此共用一个页面壳，而不是各自手搓四种壳
  —— 重构前存在手写卡片+统计+分段+筛选四件套、带投影的 .ex-card、
  混用 el-input 的自定义 .filter-bar，以及只有一处用到的 ReSectionHead。

  一个关键的职责划分：**筛选是页面级的，方向只改画布。**
  页头 + 控制栏由舞台渲染一次，五个方向共用。这样从「仪表」点柱子设下的条件，
  切到「工单台」后仍然生效、仍然能清 —— 条件若归画布所有，切一次就丢一次，
  用户会以为筛选自己坏了。

  画布通过名为方向 id 的插槽提供（console / instrument / rhythm / dossier / wall），
  当前方向由 `variant` 决定，舞台只渲染对应那一个。

  页头只留标题与一句说明。**操作按钮不放页头**：页头右侧一旦挂上分段 + 若干按钮，
  下面再跟一条筛选卡，就会变成两行竞相争夺视线 —— 第一行右侧是按钮、第二行右侧
  又是计数与刷新。按钮应当与控制栏同处一张卡：

  - `bar-lead`   —— 控制栏最左（内容分段，如「证书 / 账户」），后面自动补分隔线
  - `bar-actions` —— 控制栏最右（计数之后、刷新之前），一组动作按钮

  两个插槽都不传时，控制栏与旧版完全一致。

  若页面连标题也不想要（比如上级菜单 / 面包屑已经说清「这里是哪一页」），
  传 `no-head` 把整段页头关掉，页面的第一行就是控制栏。
-->
<template>
  <div class="pk-page">
    <div v-if="!noHead" class="pk-head">
      <div class="pk-head__titles">
        <h2 class="pk-head__title">{{ title }}</h2>
        <p v-if="desc" class="pk-head__desc">{{ desc }}</p>
      </div>
      <div v-if="$slots['head-actions']" class="pk-head__actions">
        <slot name="head-actions" />
      </div>
    </div>

    <div v-if="showBar" class="pk-bar">
      <div v-if="$slots['bar-lead']" class="pk-bar__lead">
        <slot name="bar-lead" />
      </div>
      <span
        v-if="$slots['bar-lead'] && ((tabs && tabs.length) || (filters && filters.length))"
        class="pk-bar__sep"
      />

      <div v-if="tabs && tabs.length" class="pk-seg" role="group" :aria-label="tabLabel">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="pk-seg__btn"
          :class="{ 'is-active': tab.value === tabValue }"
          :aria-pressed="tab.value === tabValue"
          @click="emit('update:tabValue', tab.value)"
        >
          {{ tab.label }}<span v-if="tab.count !== undefined" class="pk-seg__count">{{ tab.count }}</span>
        </button>
      </div>

      <span v-if="tabs && tabs.length && filters && filters.length" class="pk-bar__sep" />

      <template v-for="field in filters" :key="field.key">
        <ReSelect
          v-if="field.kind === 'select'"
          :model-value="filterModel[field.key] ?? ''"
          :options="field.options ?? []"
          :placeholder="field.placeholder"
          :style="{ width: `${field.width ?? 104}px` }"
          @update:model-value="onField(field.key, $event)"
        />
        <ReInput
          v-else
          :model-value="filterModel[field.key] ?? ''"
          :placeholder="field.placeholder"
          :prefix-icon="field.kind === 'search' ? 'Search' : undefined"
          clearable
          :style="{ width: `${field.width ?? (field.kind === 'search' ? 190 : 130)}px` }"
          @update:model-value="onField(field.key, $event)"
        />
      </template>

      <span class="pk-bar__spacer" />
      <span v-if="countText" class="pk-bar__count">{{ countText }}</span>
      <div v-if="$slots['bar-actions']" class="pk-bar__actions">
        <slot name="bar-actions" />
      </div>
      <ReButton
        icon="Refresh"
        layout="square"
        :tip="refreshTip"
        :loading="loading"
        @click="emit('refresh')"
      />
    </div>

    <slot name="alerts" />

    <slot :name="variant" />

    <RePageVariantDock
      v-if="dockVisible"
      :items="variantItems"
      :model-value="variant"
      :page-label="title"
      @update:model-value="emit('update:variant', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import ReButton from '../../ReButton/index'
import ReInput from '../../ReInput/index'
import ReSelect from '../../ReSelect/index'
import RePageVariantDock from '../RePageVariantDock.vue'
import type { PageVariantId, PageVariantMeta } from '../variant'
import type { FilterField, TabItem } from './types'

withDefaults(
  defineProps<{
    /** 页面标题 */
    title: string
    /** 一句话说明这一页干什么 */
    desc?: string
    /** 当前方向 */
    variant: PageVariantId
    /** 该页开放的方向（已过滤） */
    variantItems: PageVariantMeta[]
    /** 是否显示方向坞 */
    dockVisible?: boolean
    /** 状态分段；不传则不显示 */
    tabs?: TabItem[]
    /** 当前分段值 */
    tabValue?: string
    /** 筛选项定义；不传则不显示筛选项 */
    filters?: FilterField[]
    /** 筛选模型（键与 FilterField.key 对应） */
    filterModel?: Record<string, string>
    /** 右侧计数口径文案 */
    countText?: string
    /** 加载态 */
    loading?: boolean
    /** 是否显示控制栏；档案柜等以栏内搜索为主的页面可关掉 */
    showBar?: boolean
    /** 连页头（标题 + 说明）一起关掉，页面的第一行就是控制栏 */
    noHead?: boolean
    /** 分段控件的无障碍分组名 */
    tabLabel?: string
    /** 刷新按钮提示 */
    refreshTip?: string
  }>(),
  {
    desc: '',
    dockVisible: false,
    tabs: () => [],
    tabValue: '',
    filters: () => [],
    filterModel: () => ({}),
    countText: '',
    loading: false,
    showBar: true,
    noHead: false,
    tabLabel: '按状态筛选',
    refreshTip: '刷新',
  },
)

const emit = defineEmits<{
  (e: 'update:variant', value: PageVariantId): void
  (e: 'update:tabValue', value: string): void
  /** 某个筛选项变了；页面据此更新筛选模型并重新过滤 */
  (e: 'filter', key: string, value: string): void
  (e: 'refresh'): void
}>()

/**
 * 筛选项变化
 *
 * <p>入参放宽到 unknown 是必要的：ReSelect 的 `update:model-value` 在多选配置下
 * 会给出数组，ReInput 在清空时给出 null。控制栏这里只关心「当前值」这一个字符串，
 * 因此在边界处统一收敛，而不是逼每个页面各自处理这几种形状。</p>
 *
 * @param key   字段
 * @param value 值
 */
function onField(key: string, value: unknown): void {
  emit('filter', key, value === null || value === undefined ? '' : String(value))
}
</script>
