<template>
  <div class="template-example">
    <div class="example-section">
      <h2 class="section-title">
        <IconifyIconOnline icon="ri:layout-line" />
        模板组件示例
      </h2>
      <p class="section-desc">展示各种预制模板组件，快速构建现代化界面</p>
    </div>

    <!-- DashboardCard 示例 -->
    <div class="example-section">
      <h3 class="subsection-title">仪表盘卡片 (DashboardCard)</h3>
      <div class="card-grid">
        <DashboardCard
          type="primary"
          icon="ri:user-line"
          label="总用户数"
          :value="1234"
          trend="+12.5%"
          trend-type="up"
        >
          <template #footer>
            <ScButton text type="primary" size="small">查看详情</ScButton>
          </template>
        </DashboardCard>

        <DashboardCard
          type="success"
          icon="ri:money-dollar-circle-line"
          icon-bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          label="总收入"
          value="¥89,432"
          trend="+8.2%"
          trend-type="up"
        />

        <DashboardCard
          type="warning"
          icon="ri:shopping-cart-line"
          label="待处理订单"
          :value="45"
          trend="-3.1%"
          trend-type="down"
        />

        <DashboardCard
          type="danger"
          icon="ri:error-warning-line"
          label="异常告警"
          :value="8"
        />
      </div>
    </div>

    <!-- StatisticCard 示例 -->
    <div class="example-section">
      <h3 class="subsection-title">统计卡片 (StatisticCard)</h3>
      <div class="card-grid">
        <StatisticCard
          theme="primary"
          icon="ri:eye-line"
          label="页面浏览量"
          :value="45678"
          trend="+15.3%"
          trend-type="up"
        />

        <StatisticCard
          theme="success"
          icon="ri:user-add-line"
          label="新增用户"
          :value="892"
          trend="+23.8%"
          trend-type="up"
        />

        <StatisticCard
          theme="warning"
          icon="ri:time-line"
          label="平均响应时间"
          value="125"
          suffix="ms"
          trend="-5.2%"
          trend-type="down"
        />

        <StatisticCard
          theme="info"
          icon="ri:download-line"
          label="下载次数"
          :value="3456"
          trend="+8.9%"
          trend-type="up"
        />
      </div>
    </div>

    <!-- FeatureCard 示例 -->
    <div class="example-section">
      <h3 class="subsection-title">功能卡片 (FeatureCard)</h3>
      <div class="card-grid card-grid--3">
        <FeatureCard
          icon="ri:rocket-line"
          icon-color="#6366f1"
          title="快速部署"
          description="一键部署到云端，支持多种部署方式，简化运维流程"
        />

        <FeatureCard
          icon="ri:shield-check-line"
          icon-color="#10b981"
          title="安全可靠"
          description="企业级安全防护，数据加密传输，保障系统稳定运行"
          :active="true"
        />

        <FeatureCard
          icon="ri:speed-line"
          icon-color="#f59e0b"
          title="高性能"
          description="优化的架构设计，毫秒级响应速度，支持高并发访问"
        />
      </div>
    </div>

    <!-- TimelineCard 示例 -->
    <div class="example-section">
      <h3 class="subsection-title">时间线卡片 (TimelineCard)</h3>
      <TimelineCard :items="timelineItems" :active-index="1" />
    </div>

    <!-- PricingCard 示例 -->
    <div class="example-section">
      <h3 class="subsection-title">价格卡片 (PricingCard)</h3>
      <div class="card-grid card-grid--3">
        <PricingCard
          icon="ri:star-line"
          title="基础版"
          subtitle="适合个人用户"
          price="0"
          period="永久"
          :features="[
            '基础功能',
            '5GB 存储空间',
            '邮件支持',
            { label: '高级功能', included: false },
            { label: '优先支持', included: false },
          ]"
          action-text="免费使用"
        />

        <PricingCard
          icon="ri:vip-crown-line"
          title="专业版"
          subtitle="适合团队使用"
          price="99"
          period="月"
          :popular="true"
          :featured="true"
          :features="[
            '所有基础功能',
            '100GB 存储空间',
            '优先邮件支持',
            '高级功能',
            '数据分析',
          ]"
          action-text="立即购买"
        />

        <PricingCard
          icon="ri:building-line"
          title="企业版"
          subtitle="适合大型企业"
          price="299"
          period="月"
          :features="[
            '所有专业版功能',
            '无限存储空间',
            '24/7 专属支持',
            '定制化服务',
            'SLA 保障',
            '私有部署',
          ]"
          action-text="联系销售"
        />
      </div>
    </div>

    <!-- ProfileCard 示例 -->
    <div class="example-section">
      <h3 class="subsection-title">个人资料卡片 (ProfileCard)</h3>
      <div class="card-grid card-grid--3">
        <ProfileCard
          avatar="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
          name="张三"
          role="前端开发工程师"
          bio="热爱编程，专注于前端技术研究"
          cover-color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          :online="true"
          :followers="1234"
          :following="567"
          :posts="89"
        />

        <ProfileCard
          avatar="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
          name="李四"
          role="UI/UX 设计师"
          bio="追求极致的用户体验"
          cover-color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          :online="false"
          :followers="2345"
          :following="123"
          :posts="156"
        />

        <ProfileCard
          avatar="https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png"
          name="王五"
          role="全栈开发工程师"
          bio="代码改变世界"
          cover-color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          :online="true"
          :followers="3456"
          :following="890"
          :posts="234"
        />
      </div>
    </div>

    <!-- 代码示例 -->
    <div class="example-section">
      <h3 class="subsection-title">代码示例</h3>
      <CodePreview :tabs="codeTabs" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  DashboardCard,
  StatisticCard,
  FeatureCard,
  TimelineCard,
  PricingCard,
  ProfileCard,
} from "@repo/template";
import CodePreview from "./CodePreview.vue";

const timelineItems = ref([
  {
    title: "项目启动",
    description: "项目正式启动，完成需求分析和技术选型",
    time: "2024-01-01",
    icon: "ri:rocket-line",
    color: "var(--el-color-primary)",
    tags: ["里程碑", "重要"],
  },
  {
    title: "开发阶段",
    description: "完成核心功能开发，进行代码审查和测试",
    time: "2024-02-15",
    icon: "ri:code-box-line",
    color: "var(--el-color-success)",
    tags: [{ label: "进行中", type: "success" }],
  },
  {
    title: "测试阶段",
    description: "进行全面测试，修复发现的问题",
    time: "2024-03-20",
    icon: "ri:bug-line",
    color: "var(--el-color-warning)",
    tags: ["测试"],
  },
  {
    title: "上线发布",
    description: "项目正式上线，开始运营",
    time: "2024-04-01",
    icon: "ri:check-line",
    color: "var(--el-color-info)",
    tags: [{ label: "已完成", type: "info" }],
  },
]);

const codeTabs = [
  {
    key: "dashboard",
    label: "DashboardCard",
    icon: "ri:dashboard-line",
    language: "vue",
    code: `<DashboardCard
  type="primary"
  icon="ri:user-line"
  label="总用户数"
  :value="1234"
  trend="+12.5%"
  trend-type="up"
>
  <template #footer>
    <ScButton text type="primary">查看详情</ScButton>
  </template>
</DashboardCard>`,
  },
  {
    key: "statistic",
    label: "StatisticCard",
    icon: "ri:bar-chart-line",
    language: "vue",
    code: `<StatisticCard
  theme="primary"
  icon="ri:eye-line"
  label="页面浏览量"
  :value="45678"
  trend="+15.3%"
  trend-type="up"
/>`,
  },
  {
    key: "feature",
    label: "FeatureCard",
    icon: "ri:star-line",
    language: "vue",
    code: `<FeatureCard
  icon="ri:rocket-line"
  icon-color="#6366f1"
  title="快速部署"
  description="一键部署到云端，支持多种部署方式"
/>`,
  },
  {
    key: "timeline",
    label: "TimelineCard",
    icon: "ri:timeline-view",
    language: "vue",
    code: `<TimelineCard
  :items="[
    {
      title: '项目启动',
      description: '项目正式启动',
      time: '2024-01-01',
      icon: 'ri:rocket-line',
      color: 'var(--el-color-primary)'
    }
  ]"
  :active-index="0"
/>`,
  },
  {
    key: "pricing",
    label: "PricingCard",
    icon: "ri:price-tag-3-line",
    language: "vue",
    code: `<PricingCard
  icon="ri:vip-crown-line"
  title="专业版"
  subtitle="适合团队使用"
  price="99"
  period="月"
  :popular="true"
  :featured="true"
  :features="['所有基础功能', '100GB 存储空间']"
/>`,
  },
  {
    key: "profile",
    label: "ProfileCard",
    icon: "ri:user-line",
    language: "vue",
    code: `<ProfileCard
  avatar="https://example.com/avatar.png"
  name="张三"
  role="前端开发工程师"
  bio="热爱编程，专注于前端技术研究"
  :online="true"
  :followers="1234"
  :following="567"
  :posts="89"
/>`,
  },
];
</script>

<style lang="scss" scoped>
.template-example {
  padding: 24px;
}

.example-section {
  margin-bottom: 48px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;

  svg {
    font-size: 32px;
    color: var(--el-color-primary);
  }
}

.section-desc {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.subsection-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--el-border-color-lighter);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background: var(--el-color-primary);
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;

  &--3 {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
