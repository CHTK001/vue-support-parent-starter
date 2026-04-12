<template>
  <div class="shell">
    <aside class="shell__aside">
      <div class="brand">
        <p class="brand__eyebrow">Payment Console</p>
        <h1 class="brand__title">支付运营台</h1>
        <p class="brand__desc">
          统一管理商户、支付方式、订单、回调和交易流水。
        </p>
      </div>

      <el-menu :default-active="activeMenu" router class="nav">
        <el-menu-item index="/home">
          <el-icon><House /></el-icon>
          <span>总览首页</span>
        </el-menu-item>
        <el-menu-item index="/merchants">
          <el-icon><Shop /></el-icon>
          <span>商户与支付方式</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Tickets /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/transactions">
          <el-icon><CreditCard /></el-icon>
          <span>交易流水</span>
        </el-menu-item>
        <el-menu-item index="/global-config">
          <el-icon><Setting /></el-icon>
          <span>支付全局配置</span>
        </el-menu-item>
        <el-menu-item index="/order-config">
          <el-icon><Tools /></el-icon>
          <span>订单配置</span>
        </el-menu-item>
      </el-menu>

      <div class="aside-card">
        <p class="aside-card__label">能力范围</p>
        <ul class="aside-card__list">
          <li>微信支付 / 支付宝 / 易支付 / 钱包</li>
          <li>商户能力、支付方式、订单与退款</li>
          <li>支付全局配置与订单分表策略</li>
          <li>回调诊断、异常重试与调度任务</li>
        </ul>
      </div>
    </aside>

    <div class="shell__main">
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { CreditCard, House, Setting, Shop, Tickets, Tools } from "@element-plus/icons-vue";

const route = useRoute();

const activeMenu = computed(() => route.path);
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  background:
    radial-gradient(circle at top left, rgba(214, 142, 56, 0.22), transparent 28%),
    radial-gradient(circle at bottom right, rgba(176, 65, 48, 0.18), transparent 30%),
    linear-gradient(135deg, #171410 0%, #241d17 42%, #f4efe7 42%, #f7f3ec 100%);
  color: #1f1a16;
}

.shell__aside {
  padding: 28px 24px;
  background: linear-gradient(180deg, rgba(22, 18, 15, 0.96) 0%, rgba(39, 30, 24, 0.96) 100%);
  color: #f7efe4;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.brand__eyebrow,
.aside-card__label {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #d7a86b;
}

.brand__title,
.brand__title {
  margin: 0;
  font-family: "STZhongsong", "Noto Serif SC", Georgia, serif;
  font-weight: 600;
}

.brand__title {
  font-size: 34px;
  line-height: 1.15;
}

.brand__desc {
  margin: 12px 0 0;
  line-height: 1.8;
  color: rgba(247, 239, 228, 0.78);
}

.nav {
  border: none;
  background: transparent;
}

.nav :deep(.el-menu-item) {
  height: 50px;
  margin-bottom: 8px;
  border-radius: 14px;
  color: rgba(247, 239, 228, 0.82);
}

.nav :deep(.el-menu-item.is-active) {
  color: #20160f;
  background: linear-gradient(90deg, #d9a25f 0%, #f2d0a0 100%);
}

.nav :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
}

.aside-card {
  margin-top: auto;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.aside-card__list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.8;
  color: rgba(247, 239, 228, 0.8);
}

.shell__main {
  min-width: 0;
  padding: 22px;
}

.content {
  min-height: 100%;
}

@media (max-width: 1100px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .shell__aside {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}

@media (max-width: 720px) {
  .shell__main {
    padding: 16px;
  }

  .shell__aside {
    padding: 20px 16px;
  }

  .brand__title {
    font-size: 28px;
  }
}
</style>
