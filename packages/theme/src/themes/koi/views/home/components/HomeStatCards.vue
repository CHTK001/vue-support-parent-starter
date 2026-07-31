<template>
  <el-card
    v-for="(item, index) in cardList"
    :key="index"
    class="home-card home-stat-card"
    shadow="never"
    :body-style="cardBodyStyle"
  >
      <div class="home-stat-card__inner">
        <div class="home-stat-card__info">
          <div class="home-stat-card__label">{{ item.title }}</div>
          <div class="home-stat-card__value">
            <CountTo :startVal="0" :endVal="item.value" :duration="2000" />
          </div>
          <div
            class="home-stat-card__trend"
            :class="item.trend >= 0 ? 'is-up' : 'is-down'"
          >
            较上周 {{ item.trend >= 0 ? "+" : "" }}{{ item.trend }}%
          </div>
        </div>
        <div class="home-stat-card__icon" :style="{ background: item.iconBg }">
          <el-icon :size="22" :style="{ color: item.iconColor }">
            <component :is="item.icon" />
          </el-icon>
        </div>
      </div>
  </el-card>
</template>

<script setup lang="ts">
// @ts-ignore
import { CountTo } from "vue3-count-to";
import { markRaw, reactive } from "vue";
import { View, User, Pointer, UserFilled } from "@element-plus/icons-vue";

const cardBodyStyle = { padding: "16px 20px" };

const cardList = reactive([
  {
    title: "总访问次数",
    value: 9120,
    trend: 20,
    icon: markRaw(View),
    iconColor: "#5b8ff9",
    iconBg: "rgba(91, 143, 249, 0.12)"
  },
  {
    title: "在线访客数",
    value: 182,
    trend: 10,
    icon: markRaw(User),
    iconColor: "#5ad8a6",
    iconBg: "rgba(90, 216, 166, 0.14)"
  },
  {
    title: "点击量",
    value: 9520,
    trend: -12,
    icon: markRaw(Pointer),
    iconColor: "#9270ca",
    iconBg: "rgba(146, 112, 202, 0.12)"
  },
  {
    title: "新用户",
    value: 156,
    trend: 30,
    icon: markRaw(UserFilled),
    iconColor: "#f6bd16",
    iconBg: "rgba(246, 189, 22, 0.14)"
  }
]);
</script>

<style lang="scss" scoped>
.home-card {
  border-radius: 8px;
}

.home-stat-card {
  height: 100%;
}

.home-stat-card__inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 88px;
}

.home-stat-card__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.home-stat-card__value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--el-text-color-primary);
  letter-spacing: -0.02em;
}

.home-stat-card__trend {
  margin-top: 10px;
  font-size: 12px;

  &.is-up {
    color: var(--el-color-success);
  }

  &.is-down {
    color: var(--el-color-danger);
  }
}

.home-stat-card__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
}
</style>
