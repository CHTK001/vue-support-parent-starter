<template>
  <view class="agreement-page">
    <view class="agreement-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="agreement-tab"
        :class="{ 'is-active': current === tab.key }"
        @tap="current = tab.key"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="agreement-body">
      <view class="agreement-note">
        <text>示例文本：占位模板，上线前请替换为公司实际协议，并交法务复核。</text>
      </view>

      <view v-for="(section, index) in sections" :key="index" class="agreement-section">
        <text class="agreement-heading">{{ section.title }}</text>
        <text class="agreement-paragraph">{{ section.body }}</text>
      </view>

      <view class="agreement-footer">
        <text>最后更新：{{ updatedAt }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
/** 协议类型（与登录页入口、query 参数保持一致） */
type AgreementType = "user" | "privacy";

interface AgreementSection {
  title: string;
  body: string;
}

const USER_SECTIONS: AgreementSection[] = [
  {
    title: "一、服务说明",
    body: "本小程序提供 AI 对话服务，账号与网页端共用同一套账号体系，会话数据在两端互通。你应妥善保管账号与密码，因保管不当造成的损失由账号持有人承担。",
  },
  {
    title: "二、使用规范",
    body: "不得利用本服务发布违法信息、侵犯他人权益，或对服务进行逆向、爬取、批量注册等行为。出现上述情形，我们有权限制或终止账号使用。",
  },
  {
    title: "三、内容与责任",
    body: "AI 生成内容仅供参考，不构成专业意见。你应自行判断内容的准确性与适用性，并对其使用后果负责。",
  },
  {
    title: "四、服务变更与终止",
    body: "我们可能因版本升级、合规要求调整服务内容。重大变更会在小程序内提示；你可以随时停止使用并申请注销账号。",
  },
];

const PRIVACY_SECTIONS: AgreementSection[] = [
  {
    title: "一、我们收集的信息",
    body: "登录所需的账号标识与访问令牌；你主动输入的对话内容；用于排查故障的设备与运行环境信息（不包含通讯录、相册等无关权限）。",
  },
  {
    title: "二、信息的使用",
    body: "仅用于身份校验、会话展示、故障定位与服务质量改进。不会将对话内容用于与本次服务无关的用途，也不会出售给第三方。",
  },
  {
    title: "三、存储与保护",
    body: "访问令牌保存在小程序本地存储，退出登录即清除；服务端数据按最小必要原则保存，并采取访问控制与传输加密措施。",
  },
  {
    title: "四、你的权利",
    body: "你可以查看、修改个人信息，删除会话记录，或要求注销账号。相关请求可通过账号管理入口或联系我们处理。",
  },
];

export default {
  data() {
    return {
      current: "user" as AgreementType,
      updatedAt: "2026-11-19",
      tabs: [
        { key: "user" as AgreementType, label: "用户协议" },
        { key: "privacy" as AgreementType, label: "隐私政策" },
      ],
    };
  },
  computed: {
    sections(): AgreementSection[] {
      return this.current === "privacy" ? PRIVACY_SECTIONS : USER_SECTIONS;
    },
  },
  onLoad(options: Record<string, string | undefined>) {
    this.current = options?.type === "privacy" ? "privacy" : "user";
    uni.setNavigationBarTitle({ title: this.current === "privacy" ? "隐私政策" : "用户协议" });
  },
};
</script>

<style scoped>
.agreement-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f6f8;
}

.agreement-tabs {
  display: flex;
  background: #ffffff;
  border-bottom: 1rpx solid #e7e9ec;
}

.agreement-tab {
  flex: 1;
  position: relative;
  padding: 26rpx 0;
  text-align: center;
  font-size: 29rpx;
  color: #6b7280;
}

.agreement-tab.is-active {
  color: #1f2329;
  font-weight: 600;
}

.agreement-tab.is-active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 56rpx;
  height: 6rpx;
  margin-left: -28rpx;
  border-radius: 3rpx;
  background: #2f6fed;
}

.agreement-body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.agreement-note {
  padding: 18rpx 20rpx;
  margin-bottom: 28rpx;
  border-radius: 12rpx;
  background: #fff7e6;
  font-size: 23rpx;
  line-height: 1.6;
  color: #b0812a;
}

.agreement-section {
  margin-bottom: 32rpx;
}

.agreement-heading {
  display: block;
  margin-bottom: 10rpx;
  font-size: 29rpx;
  font-weight: 600;
  color: #1f2329;
}

.agreement-paragraph {
  display: block;
  font-size: 27rpx;
  line-height: 1.75;
  color: #4b5563;
}

.agreement-footer {
  padding: 20rpx 0 40rpx;
  text-align: center;
  font-size: 22rpx;
  color: #9aa4b2;
}
</style>
