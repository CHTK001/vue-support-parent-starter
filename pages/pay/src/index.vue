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
import { defineAsyncComponent, defineExpose, watch } from "vue";

const MerchantIndex = defineAsyncComponent(
  () => import("./merchant/index.vue")
);

// defineExpose 和 watch 必须放在最后（遵循项目规则）

defineExpose({});

watch(
  () => null,
  () => {},
  { deep: true }
);
</script>

<style scoped lang="scss">
.pay-page {
  padding: 24px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  min-height: 100%;
  border-radius: 12px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-overlay) 100%
  );
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .iconify {
    color: var(--el-color-primary);
    font-size: 24px;
  }
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
</style>
