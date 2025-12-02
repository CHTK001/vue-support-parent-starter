<template>
  <div class="template-showcase">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:layout-line" class="title-icon" />
            模板组件库
          </h1>
          <p class="page-subtitle">精选的模板组件，快速构建现代化界面</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ templateCount }}</span>
            <span class="stat-label">模板数量</span>
          </div>
        </div>
      </div>
    </div>

    <div class="template-grid">
      <router-link
        v-for="template in templates"
        :key="template.name"
        :to="template.path"
        class="template-card"
      >
        <div class="template-card__icon">
          <IconifyIconOnline :icon="template.icon" />
        </div>
        <h3 class="template-card__title">{{ template.name }}</h3>
        <p class="template-card__desc">{{ template.description }}</p>
        <div class="template-card__arrow">
          <IconifyIconOnline icon="ri:arrow-right-line" />
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const templates = [
  {
    name: "DashboardCard",
    icon: "ri:dashboard-line",
    description: "仪表盘卡片，展示关键指标和趋势",
    path: "/example",
  },
  {
    name: "StatisticCard",
    icon: "ri:bar-chart-line",
    description: "统计卡片，美观的数据展示",
    path: "/example",
  },
  {
    name: "FeatureCard",
    icon: "ri:star-line",
    description: "功能卡片，突出产品特性",
    path: "/example",
  },
  {
    name: "TimelineCard",
    icon: "ri:timeline-view",
    description: "时间线卡片，展示事件流程",
    path: "/example",
  },
  {
    name: "PricingCard",
    icon: "ri:price-tag-3-line",
    description: "价格卡片，清晰的定价展示",
    path: "/example",
  },
  {
    name: "ProfileCard",
    icon: "ri:user-line",
    description: "个人资料卡片，展示用户信息",
    path: "/example",
  },
  {
    name: "ActionCard",
    icon: "ri:flashlight-line",
    description: "操作卡片，快速执行操作",
    path: "/example",
  },
  {
    name: "InfoCard",
    icon: "ri:information-line",
    description: "信息卡片，展示提示信息",
    path: "/example",
  },
];

const templateCount = computed(() => templates.length);
</script>

<style lang="scss" scoped>
.template-showcase {
  padding: 0;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;

  .title-icon {
    font-size: 36px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 16px;
  margin: 0;
}

.header-stats {
  .stat-item {
    text-align: center;
    padding: 16px 24px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .stat-value {
      display: block;
      font-size: 32px;
      font-weight: 700;
      color: var(--el-color-primary);
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.template-card {
  display: block;
  padding: 28px;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--el-color-primary);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    border-color: var(--el-color-primary);

    &::before {
      transform: scaleX(1);
    }

    .template-card__icon {
      transform: scale(1.1) rotate(5deg);
    }

    .template-card__arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }

  &__icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9),
      var(--el-color-primary-light-8)
    );
    border-radius: 14px;
    font-size: 32px;
    color: var(--el-color-primary);
    margin-bottom: 20px;
    transition: all 0.3s ease;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 12px 0;
  }

  &__desc {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
    margin: 0 0 16px 0;
  }

  &__arrow {
    font-size: 20px;
    color: var(--el-color-primary);
    opacity: 0;
    transition: all 0.3s ease;
  }
}
</style>
