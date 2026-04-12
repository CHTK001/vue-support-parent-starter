<script setup lang="ts">
import { useUserStoreHook } from "@repo/core";
import { message } from "@repo/utils";
import { computed, onMounted, ref } from "vue";
import {
  acceptUserAgreement,
  fetchUserAgreement,
  type UserAgreementPayload,
} from "../api";

defineOptions({
  name: "UserAgreement",
});

defineProps({
  showTitle: {
    type: Boolean,
    default: true,
  },
});

const fallbackAgreement: UserAgreementPayload = {
  title: "用户协议",
  label: "System Console Agreement",
  headline: "平台访问与数据使用说明",
  description:
    "顶部个人信息下拉与账户中心共用同一份协议入口，由系统统一下发平台访问与数据使用说明。",
  version: "2026.04",
  updatedAt: "2026-04-09",
  sections: [
    {
      title: "使用范围",
      content:
        "本系统仅面向已授权账号使用，账号、消息、日志、菜单与配置数据均纳入平台审计范围。",
    },
    {
      title: "账号责任",
      content:
        "用户应妥善保管账号、密码与 OTP 动态口令，不得共享账号或绕过权限边界访问未授权数据。",
    },
    {
      title: "数据合规",
      content:
        "涉及个人信息、部门信息、登录日志与系统消息时，应在业务授权范围内查看、导出和处理。",
    },
    {
      title: "异常反馈",
      content:
        "发现异常登录、越权访问、消息异常或配置错误时，应立即停止高风险操作并通过帮助与反馈入口上报。",
    },
  ],
};

const agreement = ref<UserAgreementPayload>(fallbackAgreement);
const confirming = ref(false);
const userStore = useUserStoreHook();

const normalizeValue = (value: unknown) => String(value || "").trim();

const currentAgreementVersion = computed(
  () => normalizeValue(userStore.agreementVersion || agreement.value.version),
);
const acceptedAgreementVersion = computed(() =>
  normalizeValue(userStore.agreementAcceptedVersion),
);
const needsConfirm = computed(() => {
  const version = currentAgreementVersion.value;
  if (!version) {
    return false;
  }
  return !!userStore.agreementNeedConfirm || acceptedAgreementVersion.value !== version;
});
const acceptedAtLabel = computed(() =>
  normalizeValue(userStore.agreementAcceptedAt),
);

const loadAgreement = async () => {
  try {
    const response = await fetchUserAgreement();
    const data = response?.data;
    if (data?.sections?.length) {
      agreement.value = data;
    }
  } catch {
    agreement.value = fallbackAgreement;
  }
};

const handleAcceptAgreement = async () => {
  const version = normalizeValue(agreement.value.version);
  if (!version || confirming.value) {
    return;
  }

  confirming.value = true;
  try {
    const accepted = await acceptUserAgreement(version);
    userStore.SET_AGREEMENT_STATUS({
      agreementVersion: version,
      agreementUpdatedAt: agreement.value.updatedAt,
      agreementAcceptedVersion: accepted.agreementAcceptedVersion,
      agreementAcceptedAt: accepted.agreementAcceptedAt,
      agreementNeedConfirm: false,
    });
    message.success("已确认最新用户协议");
  } catch {
    message.error("用户协议确认失败");
  } finally {
    confirming.value = false;
  }
};

onMounted(() => {
  void loadAgreement();
});
</script>

<template>
  <div class="agreement-pane">
    <h3 v-if="showTitle" class="agreement-pane__title">{{ agreement.title }}</h3>
    <div class="agreement-hero">
      <div class="agreement-hero__label">{{ agreement.label }}</div>
      <div class="agreement-hero__headline">{{ agreement.headline }}</div>
      <div class="agreement-hero__desc">
        {{ agreement.description }}
      </div>
      <div class="agreement-hero__actions">
        <div class="agreement-hero__meta">
          版本 {{ agreement.version }} · 更新于 {{ agreement.updatedAt }}
          <template v-if="acceptedAtLabel && !needsConfirm">
            · 已确认 {{ acceptedAtLabel }}
          </template>
        </div>
        <div class="agreement-hero__toolbar">
          <div
            class="agreement-hero__status"
            :class="{ 'is-pending': needsConfirm }"
          >
            {{ needsConfirm ? "待确认" : "已确认" }}
          </div>
          <ScButton
            v-if="needsConfirm"
            type="primary"
            size="default"
            :loading="confirming"
            @click="handleAcceptAgreement"
          >
            确认最新协议
          </ScButton>
        </div>
      </div>
    </div>
    <div class="agreement-list">
      <article
        v-for="section in agreement.sections"
        :key="section.title"
        class="agreement-card"
      >
        <div class="agreement-card__title">{{ section.title }}</div>
        <div class="agreement-card__content">{{ section.content }}</div>
      </article>
    </div>
  </div>
</template>

<style scoped lang="scss">
.agreement-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.agreement-pane__title {
  margin: 0;
}

.agreement-hero {
  padding: 24px 26px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(var(--el-color-primary-rgb), 0.1), transparent 44%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.88));
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.06),
    0 6px 16px rgba(15, 23, 42, 0.04);
}

.agreement-hero__label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--el-color-primary);
}

.agreement-hero__headline {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.agreement-hero__desc {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.agreement-hero__meta {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--el-text-color-secondary) 82%, transparent);
}

.agreement-hero__actions {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.agreement-hero__toolbar {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.agreement-hero__status {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
  font-size: 12px;
  font-weight: 700;
}

.agreement-hero__status.is-pending {
  background: rgba(var(--el-color-primary-rgb), 0.12);
  color: var(--el-color-primary);
}

.agreement-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.agreement-card {
  padding: 20px 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 16px 32px rgba(15, 23, 42, 0.05),
    0 4px 10px rgba(15, 23, 42, 0.03);
}

.agreement-card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.agreement-card__content {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--el-text-color-secondary);
}

@media (max-width: 960px) {
  .agreement-list {
    grid-template-columns: 1fr;
  }

  .agreement-hero__toolbar {
    width: 100%;
    justify-content: space-between;
  }
}

html.dark {
  .agreement-hero {
    background:
      radial-gradient(circle at top left, rgba(var(--el-color-primary-rgb), 0.16), transparent 46%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92));
    border-color: rgba(148, 163, 184, 0.16);
    box-shadow:
      0 18px 40px rgba(2, 8, 23, 0.28),
      0 6px 16px rgba(2, 8, 23, 0.18);
  }

  .agreement-hero__headline,
  .agreement-card__title {
    color: #f8fafc;
  }

  .agreement-hero__desc,
  .agreement-hero__meta,
  .agreement-card__content {
    color: #94a3b8;
  }

  .agreement-card {
    background: rgba(15, 23, 42, 0.84);
    border-color: rgba(148, 163, 184, 0.14);
    box-shadow:
      0 16px 32px rgba(2, 8, 23, 0.2),
      0 4px 10px rgba(2, 8, 23, 0.12);
  }

  .agreement-hero__status {
    background: rgba(34, 197, 94, 0.18);
    color: #86efac;
  }

  .agreement-hero__status.is-pending {
    background: rgba(var(--el-color-primary-rgb), 0.18);
    color: #bfdbfe;
  }
}
</style>
