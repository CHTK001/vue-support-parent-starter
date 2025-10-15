<template>
  <div class="pay-page">
    <div class="header">
      <iconifyIconOnline icon="mdi:credit-card-outline" width="20" />
      <span class="title">支付管理 / 商户管理</span>
    </div>
    <MerchantIndex />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, defineExpose, watch } from 'vue'

const MerchantIndex = defineAsyncComponent(() => import('./merchant/index.vue'))

// defineExpose 和 watch 必须放在最后（遵循项目规则）

defineExpose({})

watch(() => null, () => {}, { deep: true })
</script>

<style scoped>
.pay-page {
  padding: 16px;
  background: var(--app-bg);
  color: var(--app-text);
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}
</style>