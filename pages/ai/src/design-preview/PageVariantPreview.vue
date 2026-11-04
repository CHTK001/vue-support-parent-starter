<template>
  <div class="pv-shell" :class="{ 'is-bare': bare }">
    <!-- 顶栏：只在人工预览时出现；截图用 ?bare=1 隐藏 -->
    <header v-if="!bare" class="pv-bar">
      <div class="pv-bar__left">
        <span class="pv-bar__crumb">页面版式探索</span>
        <span class="pv-bar__sep">/</span>
        <strong class="pv-bar__page">{{ spec?.label || pageId }}</strong>
      </div>

      <div class="pv-bar__tabs" role="tablist">
        <button
          v-for="v in variants"
          :key="v.key"
          type="button"
          role="tab"
          class="pv-bar__tab"
          :class="{ 'is-on': v.key === variant }"
          :aria-selected="v.key === variant"
          :title="v.desc"
          @click="pick(v.key)"
        >
          <span class="pv-bar__key">{{ v.key.toUpperCase() }}</span>
          {{ v.name }}
        </button>
      </div>

      <p class="pv-bar__desc">{{ currentVariant?.desc }}</p>
    </header>

    <main class="pv-stage">
      <!-- usage 变体是独立页面组件，不接 spec props（用自己的 board） -->
      <component v-if="spec" :is="layout" v-bind="specProps" />
      <div v-else class="pv-empty">未注册的页面：{{ pageId }}</div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 页面版式探索（Phase 2）。
 *
 * <p>路由 `/preview/pages/:page?variant=a|b|c`，`?bare=1` 去掉顶栏供截图。
 * 三个变体共用同一份 mock 规格，差异全部来自版式本身。</p>
 */
import { computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPageSpec, VARIANT_META, type VariantKey } from './specs'
import ManagementA from './layouts/ManagementA.vue'
import ManagementB from './layouts/ManagementB.vue'
import ManagementC from './layouts/ManagementC.vue'
import ChatA from './layouts/ChatA.vue'
import ChatB from './layouts/ChatB.vue'
import ChatC from './layouts/ChatC.vue'
import UsageA from '../components/management/UsagePage.vue'
import UsageB from '../components/management/UsagePageB.vue'
import UsageC from '../components/management/UsagePageC.vue'
import UsageD from '../components/management/UsagePageD.vue'
import UsageE from '../components/management/UsagePageE.vue'
import UsageF from '../components/management/UsagePageF.vue'

const route = useRoute()
const router = useRouter()

// 每种版式只实现了自己那几个变体（management / conversation 只有 a~c，usage 有 a~f），
// 所以下标字典按 Partial 声明：`LAYOUTS[archetype][variant]` 可能取不到，
// 取不到就是「该版式没有这个变体」，渲染空态而不是崩掉。
const LAYOUTS: Record<string, Partial<Record<VariantKey, Component>>> = {
  management: { a: ManagementA, b: ManagementB, c: ManagementC },
  conversation: { a: ChatA, b: ChatB, c: ChatC },
  // usage 变体：独立页面组件，不接 spec，直接绑定 useUsageBoard()
  usage: { a: UsageA, b: UsageB, c: UsageC, d: UsageD, e: UsageE, f: UsageF },
}

const pageId = computed(() => String(route.params.page || 'models'))
const spec = computed(() => getPageSpec(pageId.value))
const bare = computed(() => route.query.bare === '1')

const variant = computed<VariantKey>(() => {
  const v = String(route.query.variant || 'a') as VariantKey
  return ['a', 'b', 'c', 'd', 'e', 'f'].includes(v) ? v : 'a'
})

const variants = computed(() => (spec.value ? VARIANT_META[spec.value.archetype] : []))
const currentVariant = computed(() => variants.value.find((v) => v.key === variant.value))

// usage 变体不接 spec props，其他变体按旧约传入；避免把 spec 强塞给独立页面组件
const specProps = computed(() => (spec.value?.archetype === 'usage' ? {} : { spec: spec.value }))

const layout = computed(() => {
  if (!spec.value) return null
  return LAYOUTS[spec.value.archetype]?.[variant.value] ?? null
})

function pick(key: VariantKey): void {
  router.replace({ query: { ...route.query, variant: key } })
}
</script>

<style scoped>
.pv-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg-page);
}

.pv-shell.is-bare { height: 100%; }

/* ---------- 顶栏 ---------- */
.pv-bar {
  flex: none;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 4px 20px;
  padding: 10px 20px;
  background: var(--bg-container);
  border-bottom: 1px solid var(--border-default);
}

.pv-bar__left { display: flex; align-items: baseline; gap: 7px; font-size: 12px; }

.pv-bar__crumb { color: var(--text-tertiary); }
.pv-bar__sep { color: var(--border-strong); }
.pv-bar__page { font-size: 13px; font-weight: 600; }

.pv-bar__tabs {
  justify-self: end;
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 999px;
  background: var(--bg-fill);
}

.pv-bar__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 13px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.pv-bar__tab.is-on {
  background: var(--bg-container);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.pv-bar__key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 4px;
  background: var(--brand-50);
  color: var(--brand-700);
  font-size: 9.5px;
  font-weight: 700;
}

.pv-bar__desc {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

/* ---------- 舞台 ---------- */
.pv-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pv-stage > * { flex: 1; min-height: 0; }

.pv-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 13px;
}
</style>