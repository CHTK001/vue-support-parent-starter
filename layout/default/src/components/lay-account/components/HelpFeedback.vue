<script setup lang="ts">
import { emitter, router } from "@repo/core";
import { message } from "@repo/utils";

defineOptions({
  name: "HelpFeedback",
});

defineProps({
  showTitle: {
    type: Boolean,
    default: true,
  },
});

const copyFeedbackAddress = async () => {
  try {
    await navigator.clipboard.writeText("support@example.local");
    message.success("反馈邮箱已复制");
  } catch {
    message.error("复制反馈邮箱失败");
  }
};

const supportActions = [
  {
    title: "查看消息中心",
    desc: "快速确认系统消息、告警提醒与业务通知。",
    icon: "ri:message-3-line",
    onClick: () => emitter.emit("messageCenterOpen"),
  },
  {
    title: "打开用户协议",
    desc: "查看当前账号的数据使用边界与安全要求。",
    icon: "ri:file-list-3-line",
    onClick: () =>
      router.push({
        name: "AccountSettings",
        query: { pane: "agreement" },
      }),
  },
  {
    title: "复制反馈入口",
    desc: "当前先保留统一反馈邮箱，后续可继续接 sys_message 或工单流程。",
    icon: "ri:customer-service-2-line",
    onClick: copyFeedbackAddress,
  },
];
</script>

<template>
  <div class="help-pane">
    <h3 v-if="showTitle" class="help-pane__title">帮助与反馈</h3>
    <div class="help-pane__hero">
      <div class="help-pane__headline">统一入口处理帮助、反馈与消息链路</div>
      <div class="help-pane__desc">
        顶部个人信息下拉、账户中心与后续消息能力共用同一套支持入口，避免页面入口分散。
      </div>
    </div>
    <div class="help-pane__grid">
      <button
        v-for="item in supportActions"
        :key="item.title"
        type="button"
        class="help-card"
        @click="item.onClick"
      >
        <div class="help-card__icon">
          <IconifyIconOnline :icon="item.icon" />
        </div>
        <div class="help-card__content">
          <div class="help-card__title">{{ item.title }}</div>
          <div class="help-card__desc">{{ item.desc }}</div>
        </div>
        <IconifyIconOnline icon="ri:arrow-right-up-line" class="help-card__arrow" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.help-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.help-pane__title {
  margin: 0;
}

.help-pane__hero {
  padding: 24px 26px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 42%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.88));
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.06),
    0 6px 16px rgba(15, 23, 42, 0.04);
}

.help-pane__headline {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.help-pane__desc {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.help-pane__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.help-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
  padding: 18px 20px;
  text-align: left;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 16px 32px rgba(15, 23, 42, 0.05),
    0 4px 10px rgba(15, 23, 42, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.help-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--el-color-primary-rgb), 0.26);
  box-shadow:
    0 22px 40px rgba(15, 23, 42, 0.08),
    0 8px 18px rgba(15, 23, 42, 0.04);
}

.help-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 14px;
  background: rgba(var(--el-color-primary-rgb), 0.12);
  color: var(--el-color-primary);
  font-size: 20px;
}

.help-card__content {
  min-width: 0;
  flex: 1;
}

.help-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.help-card__desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
}

.help-card__arrow {
  margin-top: 2px;
  font-size: 18px;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 1080px) {
  .help-pane__grid {
    grid-template-columns: 1fr;
  }
}

</style>
