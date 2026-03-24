<script setup lang="ts">
/**
 * 阿里云权益中心布局组件使用示例
 * @author CH
 * @since 2024-12-05
 */
import AliyunBenefitLayout from "./index.vue";
import type { BenefitSection, TabItem } from "./index";

// Tab配置
const tabs: TabItem[] = [
  { key: "cloud", label: "云产品权益", icon: "ri:cloud-line" },
  { key: "ai", label: "AI 产品权益", icon: "ri:robot-line" }
];

// 区块数据
const sections: BenefitSection[] = [
  {
    id: "hot",
    title: "新人限时抢购",
    subtitle: "首购专享，限时特惠",
    icon: "ri:fire-line",
    columns: 4,
    cards: [
      {
        id: 1,
        title: "云服务器 ECS",
        subtitle: "企业级高性能云服务器",
        description: "2核4G，40G高效云盘，1M带宽",
        price: "38",
        originalPrice: "600",
        unit: "/年",
        tag: "爆款",
        tagType: "hot",
        icon: "ri:server-line",
        features: ["99.95%可用性保障", "弹性扩容"],
        buttonText: "立即抢购"
      },
      {
        id: 2,
        title: "轻量应用服务器",
        subtitle: "开箱即用，轻松建站",
        description: "2核2G，60G SSD云盘，5M带宽",
        price: "48",
        originalPrice: "468",
        unit: "/年",
        tag: "新品",
        tagType: "new",
        icon: "ri:smartphone-line",
        features: ["预装应用镜像", "简化运维"],
        buttonText: "立即抢购"
      },
      {
        id: 3,
        title: "云数据库 RDS",
        subtitle: "稳定可靠的关系型数据库",
        description: "MySQL 2核4G，50G存储",
        price: "99",
        originalPrice: "1200",
        unit: "/年",
        tag: "限时",
        tagType: "limit",
        icon: "ri:database-2-line",
        features: ["自动备份", "读写分离"],
        buttonText: "立即抢购"
      },
      {
        id: 4,
        title: "对象存储 OSS",
        subtitle: "海量数据安全存储",
        description: "500GB存储，100GB流量",
        price: "0",
        unit: "",
        tag: "免费",
        tagType: "free",
        icon: "ri:folder-cloud-line",
        features: ["99.99%数据可靠", "全球加速"],
        buttonText: "免费试用"
      }
    ]
  },
  {
    id: "solution",
    title: "场景化解决方案",
    subtitle: "一键购买，覆盖90%业务场景",
    icon: "ri:apps-line",
    columns: 3,
    cards: [
      {
        id: 5,
        title: "企业建站套餐",
        description: "域名+服务器+SSL证书，一站式解决方案",
        price: "299",
        originalPrice: "1500",
        unit: "/年",
        tag: "3折",
        tagType: "discount",
        icon: "ri:global-line",
        buttonText: "查看详情"
      },
      {
        id: 6,
        title: "电商解决方案",
        description: "高并发、高可用的电商架构",
        price: "599",
        originalPrice: "3000",
        unit: "/年",
        tag: "热门",
        tagType: "hot",
        icon: "ri:shopping-cart-line",
        buttonText: "查看详情"
      },
      {
        id: 7,
        title: "游戏解决方案",
        description: "低延迟、高性能的游戏服务器",
        price: "899",
        originalPrice: "5000",
        unit: "/年",
        tag: "推荐",
        tagType: "new",
        icon: "ri:gamepad-line",
        buttonText: "查看详情"
      }
    ]
  },
  {
    id: "free",
    title: "免费试用",
    subtitle: "140+款产品免费体验",
    icon: "ri:gift-line",
    columns: 5,
    cards: [
      {
        id: 8,
        title: "函数计算 FC",
        price: "0",
        tag: "免费",
        tagType: "free",
        icon: "ri:terminal-box-line",
        buttonText: "免费试用"
      },
      {
        id: 9,
        title: "容器服务 ACK",
        price: "0",
        tag: "免费",
        tagType: "free",
        icon: "ri:ship-line",
        buttonText: "免费试用"
      },
      {
        id: 10,
        title: "日志服务 SLS",
        price: "0",
        tag: "免费",
        tagType: "free",
        icon: "ri:file-list-3-line",
        buttonText: "免费试用"
      },
      {
        id: 11,
        title: "API 网关",
        price: "0",
        tag: "免费",
        tagType: "free",
        icon: "ri:router-line",
        buttonText: "免费试用"
      },
      {
        id: 12,
        title: "消息队列 MQ",
        price: "0",
        tag: "免费",
        tagType: "free",
        icon: "ri:mail-send-line",
        buttonText: "免费试用"
      }
    ]
  }
];

// 事件处理
function handleTabChange(key: string) {
  console.log("Tab changed:", key);
}

function handleCardClick(card: any) {
  console.log("Card clicked:", card);
}

function handleButtonClick(card: any) {
  console.log("Button clicked:", card);
}
</script>

<template>
  <AliyunBenefitLayout
    title="权益中心"
    subtitle="专属优惠，助力企业快速上云"
    background-gradient="linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
    :tabs="tabs"
    :sections="sections"
    @tab-change="handleTabChange"
    @card-click="handleCardClick"
    @button-click="handleButtonClick"
  >
    <!-- 可以在top插槽添加自定义内容 -->
    <template #top>
      <div class="custom-banner">
        <el-alert title="双12特惠活动进行中，限时抢购低至1折！" type="warning" :closable="false" show-icon style="margin-bottom: 24px; border-radius: 12px" />
      </div>
    </template>
  </AliyunBenefitLayout>
</template>

<style lang="scss" scoped>
.custom-banner {
  margin-bottom: 8px;
}
</style>
