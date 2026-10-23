<script setup lang="ts">
/**
 * 知识库重构验证台（Phase 3 临时页，验证完即删）。
 *
 * <p><b>为什么需要它</b>：真实 {@code KnowledgeBasePage} 依赖 (a) 路由守卫持有令牌、
 * (b) {@code /v2/rag/status} 可用、(c) 知识库列表接口。前两项在本机无后端时不可满足，
 * 且走路由会被 vue-router 的守卫链路干扰。本台直接挂载<b>真实的</b>
 * {@code KnowledgeBasePage} 组件，只把 store 与网络换成 mock，用来验证重构后的
 * 三栏骨架、命令条、流水线与各视图确实能渲染。</p>
 *
 * <p>与 Phase 2 的 {@code kb-variants} 不同：那边是「重新画的探索稿」，
 * 这边是「重构后的真实组件 + 假数据」，验证的是落地结果。</p>
 */
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import KnowledgeBasePage from '@/components/knowledge-base/KnowledgeBasePage.vue'
import { useKnowledgeBaseStore } from '@/stores/knowledgeBase'
import type { KnowledgeBase } from '@/stores/knowledgeBase'

const store = useKnowledgeBaseStore()
const route = useRoute()
const ready = ref(false)
/** 组件实例引用：用来在 mounted 之后主动切入详情视图 */
const kbPageRef = ref<InstanceType<typeof KnowledgeBasePage> | null>(null)

const KB: KnowledgeBase = {
  id: 'kb-1',
  name: '三国演义 · 教研库',
  description: '课文、考点与人物关系抽取，用于整本书阅读教学',
  userId: 'u1',
  chunkMaxSize: 800,
  chunkOverlapSize: 80,
  chunkMinSize: 200,
  isActive: true,
  isPublic: true,
  sourceUrl: '',
  sourceMaxPages: 0,
  sourceMode: '',
  metadataConfig: null,
  createdAt: '2026-09-12 10:20',
  updatedAt: '2026-10-21 16:04',
}

const KB2: KnowledgeBase = { ...KB, id: 'kb-2', name: '小学古诗 112 首', isPublic: false }
const KB3: KnowledgeBase = { ...KB, id: 'kb-3', name: '教务通知归档', isActive: false }

onMounted(() => {
  // 直接灌入知识库列表：绕过 fetchKnowledgeBases，避免无后端时列表为空
  store.knowledgeBases = [KB, KB2, KB3]
  store.activeKnowledgeBaseId = KB.id
  ready.value = true

  // 组件内部 handleSelectKB 会 router.replace 到受保护的 /knowledge-base/:id。
  // 无后端环境下这会被登录守卫踢回 /login，详情视图永远渲染不出来。
  // 打一个全局标记，让 main.js 的守卫在本次会话内放行知识库路由。
  ;(window as unknown as { __KB_HARNESS__?: boolean }).__KB_HARNESS__ = true
  nextTick(() => {
    const page = kbPageRef.value as unknown as {
      $?: { exposed?: { openDetail?: (kb: KnowledgeBase) => void } }
    }
    page?.$?.exposed?.openDetail?.(KB)
  })
})

onUnmounted(() => {
  ;(window as unknown as { __KB_HARNESS__?: boolean }).__KB_HARNESS__ = false
})
</script>

<template>
  <div class="kbv">
    <div class="kbv__hint">
      验证台 · 真实 <code>KnowledgeBasePage</code> 组件 + mock store（无后端、无路由守卫）
    </div>
    <div class="kbv__stage">
      <KnowledgeBasePage v-if="ready" ref="kbPageRef" />
    </div>
  </div>
</template>

<style scoped>
.kbv {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  background: var(--bg-page, #fbfbfd);
}

.kbv__hint {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 11.5px;
  color: var(--text-tertiary, #8b8f9c);
  border-bottom: 1px solid var(--border-default, #e6e8ee);
  background: var(--bg-container, #fff);
}

.kbv__hint code {
  font-family: Consolas, monospace;
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--bg-fill, #f1f3f8);
}

.kbv__stage {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
