<template>
  <div class="home-page overflow-x-hidden">
    <KoiCard>
      <div
        class="home-welcome"
      >
        <!-- :src="
          authStore.loginUser?.avatar ||
          'https://pic4.zhimg.com/v2-702a23ebb518199355099df77a3cfe07_b.webp'
        " -->
        <img
          class="home-welcome__avatar"

           src="https://pic4.zhimg.com/v2-702a23ebb518199355099df77a3cfe07_b.webp"
          alt="avatar"
        />
        <div class="home-welcome__content">
          <div class="home-welcome__greeting">{{ greetingText }}</div>
          <div class="home-welcome__subtitle">
            一款有「鲤」的后台框架——简约而不简单，欢迎回来
            <span class="home-welcome__name">{{ authStore.loginUser?.userName || "管理员" }}</span>
          </div>
        </div>
      </div>
    </KoiCard>

    <el-row :gutter="12" class="home-row">
      <HomeStatCards />
    </el-row>

    <el-row :gutter="12" class="home-row">
      <el-col :xs="24" :lg="10">
        <KoiCard class="home-panel-card">
          <div class="home-panel-head">
            <div>
              <div class="home-panel-head__title">用户概述</div>
              <div class="home-panel-head__trend is-up">比上周 +23%</div>
            </div>
          </div>
          <p class="home-panel-desc">
            我们为您构建了一个数据驱动的用户洞察面板，帮助您更清晰地了解用户增长与活跃情况。
          </p>
          <HomeUserBarChart />
          <div class="home-user-metrics">
            <div v-for="item in userMetrics" :key="item.label" class="home-user-metrics__item">
              <div class="home-user-metrics__value">{{ item.value }}</div>
              <div class="home-user-metrics__label">{{ item.label }}</div>
            </div>
          </div>
        </KoiCard>
      </el-col>
      <el-col :xs="24" :lg="14">
        <KoiCard class="home-panel-card">
          <div class="home-panel-head">
            <div>
              <div class="home-panel-head__title">访问量</div>
              <div class="home-panel-head__trend is-up">今年增长 +15%</div>
            </div>
          </div>
          <HomeVisitLineChart />
        </KoiCard>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="home-row">
      <el-col :xs="24" :lg="10">
        <KoiCard class="home-panel-card home-panel-card--compact">
          <div class="home-panel-head">
            <div>
              <div class="home-panel-head__title">访问来源</div>
              <div class="home-panel-head__trend is-up">本月 +6%</div>
            </div>
          </div>
          <HomeModulePieChart />
        </KoiCard>
      </el-col>
      <el-col :xs="24" :lg="14">
        <KoiCard class="home-panel-card">
          <div class="home-panel-head">
            <div>
              <div class="home-panel-head__title">交易趋势对比</div>
              <div class="home-panel-head__trend is-up">较上月 +8%</div>
            </div>
          </div>
          <HomeTradeLineChart />
        </KoiCard>
      </el-col>
    </el-row>

    <HomeProjectAbout />
  </div>
</template>

<script setup lang="ts" name="homePage">
import { computed } from "vue";
import { getDayText } from "../../utils/random.ts";
import HomeStatCards from "./components/HomeStatCards.vue";
import HomeUserBarChart from "./components/HomeUserBarChart.vue";
import HomeVisitLineChart from "./components/HomeVisitLineChart.vue";
import HomeModulePieChart from "./components/HomeModulePieChart.vue";
import HomeTradeLineChart from "./components/HomeTradeLineChart.vue";
import HomeProjectAbout from "./components/HomeProjectAbout.vue";
import useAuthStore from "../../stores/modules/auth.ts";

const authStore = useAuthStore();

const greetingText = computed(() => {
  return getDayText() || "您好，愿您天天开心，事事如意！";
});

const userMetrics = [
  { value: "32k", label: "总用户量" },
  { value: "128k", label: "总访问量" },
  { value: "1.2k", label: "日访问量" },
  { value: "+5%", label: "周同比" }
];
</script>

<style lang="scss" scoped>
.home-page {
  padding-bottom: 4px;
}

.home-row {
  margin-top: 4px;
}

.home-welcome {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 72px;
}

.home-welcome__avatar {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-radius: 50%;
  user-select: none;
}

.home-welcome__greeting {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.home-welcome__subtitle {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.home-welcome__name {
  margin-left: 4px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.home-panel-card {
  min-height: 420px;
}

.home-panel-card--compact {
  min-height: 420px;
}

.home-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
}

.home-panel-head__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.home-panel-head__trend {
  margin-top: 6px;
  font-size: 12px;

  &.is-up {
    color: var(--el-color-success);
  }

  &.is-down {
    color: var(--el-color-danger);
  }
}

.home-panel-desc {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
}

.home-user-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding-top: 14px;
  margin-top: 6px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.home-user-metrics__value {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.home-user-metrics__label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (width <= 992px) {
  .home-user-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
