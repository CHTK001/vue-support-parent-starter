<template>
  <div class="shell">
    <aside class="shell__aside">
      <div class="brand">
        <p class="brand__eyebrow">Payment Control Deck</p>
        <h1 class="brand__title">支付运营台</h1>
        <p class="brand__desc">
          统一管理商户、支付方式、订单状态机和交易流水。
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
      </el-menu>

      <div class="aside-card">
        <p class="aside-card__label">能力范围</p>
        <ul class="aside-card__list">
          <li>微信支付 / 支付宝 / 综合支付 / 钱包</li>
          <li>开通指引与配置掩码</li>
          <li>订单状态机与退款流</li>
        </ul>
      </div>
    </aside>

    <div class="shell__main">
      <header class="topbar">
        <div>
          <p class="topbar__eyebrow">Starter Console</p>
          <h2 class="topbar__title">{{ pageTitle }}</h2>
        </div>
        <div class="topbar__meta">
          <span>统一接口：`/api/merchant` / `/api/channel` / `/api/order` / `/api/transaction`</span>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { CreditCard, House, Shop, Tickets } from "@element-plus/icons-vue";

const route = useRoute();

const activeMenu = computed(() => route.path);

const pageTitle = computed(() => {
  if (route.path.startsWith("/home")) {
    return "支付中台总览";
  }
  if (route.path.startsWith("/orders")) {
    return "订单状态与退款执行台";
  }
  if (route.path.startsWith("/transactions")) {
    return "交易流水追踪台";
  }
  return "商户与支付方式配置台";
});
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
.topbar__eyebrow,
.aside-card__label {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #d7a86b;
}

.brand__title,
.topbar__title {
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

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 26px 30px;
  border-radius: 28px;
  background: rgba(255, 249, 241, 0.86);
  border: 1px solid rgba(90, 60, 34, 0.09);
  box-shadow: 0 24px 80px rgba(56, 37, 22, 0.1);
}

.topbar__title {
  font-size: 30px;
  color: #241710;
}

.topbar__meta {
  max-width: 520px;
  align-self: flex-end;
  color: #6e5843;
  line-height: 1.7;
}

.content {
  margin-top: 22px;
}

@media (max-width: 1100px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .shell__aside {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .topbar {
    flex-direction: column;
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

  .topbar {
    padding: 22px 18px;
    border-radius: 22px;
  }

  .topbar__title {
    font-size: 24px;
  }
}
</style>
