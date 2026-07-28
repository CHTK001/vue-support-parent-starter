<template>
  <div class="feature-menu">
    <el-tooltip content="功能菜单" placement="bottom">
      <ScButton circle :icon="Grid" @click="visible = true" />
    </el-tooltip>

    <ScDrawer v-model="visible" title="功能导航" size="480px" layout="simple">
      <div class="feature-grid">
        <router-link
          v-for="item in features"
          :key="item.path"
          :to="prefixedPath(item.path)"
          class="feature-card"
          @click="visible = false"
        >
          <span class="feature-card__icon" :style="{ background: item.color }">
            <el-icon><component :is="item.icon" /></el-icon>
          </span>
          <span class="feature-card__label">{{ item.label }}</span>
        </router-link>
      </div>
    </ScDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, type Component } from "vue";
import { Grid } from "@element-plus/icons-vue";
import {
  Grid as GridIcon,
  Setting,
  Wallet,
  ShoppingCart,
  List,
  RefreshLeft,
  Tickets,
  TrendCharts,
  SetUp,
  Tools,
  Files,
  CreditCard,
} from "@element-plus/icons-vue";
import { ScDrawer } from "@repo/components/ScDrawer";
import { withPrefix } from "../config";

const visible = ref(false);

interface FeatureItem {
  label: string;
  path: string;
  icon: Component;
  color: string;
}

const features: FeatureItem[] = [
  { label: "控制台", path: "/", icon: GridIcon, color: "#4f46e5" },
  { label: "交易流水", path: "/transactions", icon: List, color: "#0891b2" },
  { label: "订单管理", path: "/orders", icon: ShoppingCart, color: "#059669" },
  { label: "退款管理", path: "/refunds", icon: RefreshLeft, color: "#dc2626" },
  { label: "商户管理", path: "/merchants", icon: CreditCard, color: "#7c3aed" },
  { label: "优惠券管理", path: "/coupons", icon: Tickets, color: "#d97706" },
  { label: "钱包控制台", path: "/wallet-console", icon: Wallet, color: "#8b5cf6" },
  { label: "钱包订单", path: "/wallet-orders", icon: Files, color: "#6366f1" },
  { label: "提现审批", path: "/withdraw-approval", icon: TrendCharts, color: "#2563eb" },
  { label: "运营中心", path: "/operations", icon: SetUp, color: "#ea580c" },
  { label: "订单配置", path: "/order-config", icon: Tools, color: "#0d9488" },
  { label: "支付配置", path: "/global-config", icon: Setting, color: "#6b7280" },
];

function prefixedPath(path: string) {
  return withPrefix(path);
}
</script>

<style scoped>
.feature-menu {
  display: inline-flex;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 8px 0;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 16px;
  background: var(--pm-surface-card, rgba(255,255,255,0.85));
  border: 1px solid var(--pm-border-color-light, rgba(233,238,246,0.6));
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
  border-color: var(--pm-color-brand-light, #eef2ff);
}

.feature-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 20px;
  color: #fff;
}

.feature-card__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--pm-text-primary, #070b15);
  text-align: center;
}
</style>
