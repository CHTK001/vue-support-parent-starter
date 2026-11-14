<template>
  <RePage data-page="service-tokens">
    <template #title>
      <el-button text @click="goBack" class="back-btn" title="返回服务配置">
        <el-icon><ArrowLeft24Regular /></el-icon>
      </el-button>
      <span>Key 台账</span>
    </template>
    <template #sub>
      AppKey 是服务实例与网关共用的唯一凭证：<b>{{ stats.total }}</b> 把 ·
      可用 <b>{{ stats.usable }}</b> · 待处理 <b>{{ stats.atRisk }}</b>
    </template>
    <template #actions>
      <span class="kt-note">模型范围 = 分组清单 ∩ 限定模型；额度按时间 / 次数 / 余额三选一</span>
    </template>

    <!-- .svc 提供设计层令牌（svc-refactor.css 全部挂在 .svc 作用域下）。
         弹窗里的「去创建分组」在独立页没有分组台账，回退到服务配置页即是入口 -->
    <div class="svc">
      <ServiceKeyLedger :refresh-key="refreshKey" @stats="onStats" @open-groups="goBack" />
    </div>
  </RePage>
</template>

<script setup lang="ts">
/**
 * 独立「Key 台账」页（设置 → 系统 → Key 台账）。
 *
 * <p>曾经是「按实例签发访问令牌」的独立页（{@code /service/tokens}）。服务实例改为
 * 按 appKey 鉴权之后，令牌表退役：同一把 AppKey 在任何实例端口与网关 {@code /v2/v1/*}
 * 都通用，因此这一页不再有「实例」这个维度，只保留一层页面外壳。</p>
 *
 * <p>台账本体（列表 / 新建 / 续量 / 充值 / 启停）在
 * {@link ./ServiceKeyLedger.vue}，服务配置页的「Key 台账」页签复用同一个组件 ——
 * 两处入口共用一份实现，避免同一张表两个版本各修各的。</p>
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft24Regular } from '@vicons/fluent'
import RePage from '@/components/ui/RePage.vue'
import ServiceKeyLedger from './ServiceKeyLedger.vue'

const router = useRouter()

/**
 * 外部刷新计数器：组件内部自带刷新按钮，页头不必再放一个「刷新」；
 * 这里保留计数器只为「单实例刷新后回到本页仍是最新」这类跳转场景留口子。
 */
const refreshKey = ref(0)

const stats = ref({ total: 0, usable: 0, atRisk: 0, usedTokens: 0 })

function onStats(v: { total: number; usable: number; atRisk: number; usedTokens: number }) {
  stats.value = v
}

function goBack() {
  router.push({ name: 'SystemSettings', params: { tab: 'services' } })
}
</script>

<style scoped>
.back-btn {
  padding: 4px;
}
/* 页头右侧的口径说明：一句话解释「这页管的到底是什么」，不做第二行标题 */
.kt-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
