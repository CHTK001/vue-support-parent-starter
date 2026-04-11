<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  fetchBindTotp,
  fetchGetTotpUri,
  fetchTotpStatus,
  fetchUnbindTotp,
  fetchVerifyTotp,
} from "@repo/core";
import { deviceDetection } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import { message } from "@repo/utils";
import QrcodeVue from "qrcode.vue";
import { ScButton } from "@repo/components/ScButton";

defineOptions({
  name: "TotpSettings",
});

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();

const widthValue = 176;
const loading = ref(false);
const verifying = ref(false);
const enabled = ref(false);
const verifiedAt = ref("");
const totpUri = ref("");
const totpCode = ref("");

const username = computed(() => String(props.userInfo?.sysUserUsername || ""));
const shellClass = computed(() =>
  deviceDetection() ? "totp-shell totp-shell--mobile" : "totp-shell",
);
const statusLabel = computed(() => (enabled.value ? "已开启" : "未开启"));
const statusClass = computed(() =>
  enabled.value ? "status-badge is-enabled" : "status-badge is-disabled",
);

const syncTotpCode = (value: string) => {
  totpCode.value = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6);
};

const handleGetTotpUri = async () => {
  if (!enabled.value) {
    totpUri.value = "";
    return;
  }

  try {
    const { data } = await fetchGetTotpUri();
    totpUri.value = String(data || "");
  } catch {
    totpUri.value = "";
    message("获取 OTP 二维码失败", { type: "error" });
  }
};

const refreshStatus = async (loadUri = false) => {
  try {
    const response = await fetchTotpStatus();
    enabled.value = response?.data === true;
    if (!enabled.value) {
      totpUri.value = "";
      verifiedAt.value = "";
      return;
    }

    if (loadUri) {
      await handleGetTotpUri();
    }
  } catch {
    enabled.value = false;
    totpUri.value = "";
    verifiedAt.value = "";
  }
};

const handleEnableTotp = async () => {
  if (!username.value) {
    message("当前账号信息缺失，无法开启 OTP", { type: "error" });
    return;
  }

  loading.value = true;
  try {
    const response = await fetchBindTotp();
    if (response?.code === "00000" || response?.data === true) {
      enabled.value = true;
      message(t("message.updateSuccess"), { type: "success" });
      await handleGetTotpUri();
      return;
    }
    message(response?.msg || "启用 OTP 失败", { type: "error" });
  } catch {
    message("启用 OTP 失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleVerify = async () => {
  if (!enabled.value) {
    message("请先开启 OTP", { type: "warning" });
    return;
  }

  if (totpCode.value.length !== 6) {
    message("请输入 6 位动态验证码", { type: "warning" });
    return;
  }

  if (!username.value) {
    message("当前账号信息缺失，无法校验 OTP", { type: "error" });
    return;
  }

  verifying.value = true;
  try {
    const response = await fetchVerifyTotp({
      code: totpCode.value,
      username: username.value,
    });
    if (response?.data === true || response?.code === "00000") {
      verifiedAt.value = new Date().toLocaleString();
      message("OTP 校验成功", { type: "success" });
      return;
    }
    message(response?.msg || "OTP 校验失败", { type: "error" });
  } catch {
    message("OTP 校验失败", { type: "error" });
  } finally {
    verifying.value = false;
  }
};

const handleDisableTotp = async () => {
  if (!enabled.value) {
    return;
  }

  loading.value = true;
  try {
    const response = await fetchUnbindTotp();
    if (response?.code === "00000" || response?.data === true) {
      enabled.value = false;
      totpUri.value = "";
      totpCode.value = "";
      verifiedAt.value = "";
      message(t("message.updateSuccess"), { type: "success" });
      return;
    }
    message(response?.msg || "关闭 OTP 失败", { type: "error" });
  } catch {
    message("关闭 OTP 失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void refreshStatus(true);
});
</script>

<template>
  <div :class="shellClass">
    <section class="totp-panel">
      <div class="panel-head">
        <div>
          <p class="panel-eyebrow">{{ $t("buttons.totp") }}</p>
          <h3>动态验证码保护</h3>
          <p class="panel-desc">
            绑定后登录将校验 OTP，个人中心也支持即时验证当前验证码是否生效。
          </p>
        </div>
        <span :class="statusClass">{{ statusLabel }}</span>
      </div>

      <div class="action-row">
        <ScButton
          type="primary"
          :loading="loading"
          @click="enabled ? handleGetTotpUri() : handleEnableTotp()"
        >
          {{ enabled ? "刷新二维码" : "开启 OTP" }}
        </ScButton>
        <ScButton v-if="enabled" :loading="verifying" @click="handleVerify">
          校验 OTP
        </ScButton>
        <ScButton v-if="enabled" text @click="handleDisableTotp">
          关闭 OTP
        </ScButton>
      </div>

      <div class="panel-grid">
        <div class="qr-card">
          <template v-if="totpUri">
            <QrcodeVue :value="totpUri" :size="widthValue" />
            <p class="qr-tip">
              使用认证器扫描二维码后，输入 6 位动态验证码完成校验。
            </p>
          </template>
          <template v-else>
            <div class="placeholder-icon">
              <IconifyIconOnline icon="ri:qr-code-line" />
            </div>
            <p class="placeholder-title">尚未生成二维码</p>
            <p class="placeholder-desc">
              开启 OTP 后，这里会展示当前账号对应的认证二维码。
            </p>
          </template>
        </div>

        <div class="verify-card">
          <div class="verify-head">
            <span>验证码校验</span>
            <small v-if="verifiedAt">最近通过：{{ verifiedAt }}</small>
          </div>
          <ScInput
            :model-value="totpCode"
            maxlength="6"
            placeholder="输入 6 位动态验证码"
            @update:model-value="syncTotpCode"
            @keyup.enter="handleVerify"
          />
          <div class="verify-tips">
            <p>1. OTP 每 30 秒刷新一次。</p>
            <p>2. 登录页开启 OTP 后，将复用当前绑定结果进行校验。</p>
            <p>3. 关闭 OTP 会立即移除当前绑定状态。</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.totp-shell {
  width: min(920px, 100%);
}

.totp-shell--mobile {
  width: 100%;
}

.totp-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(
    180deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-extra-light) 100%
  );
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
}

.panel-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;

  h3 {
    margin: 6px 0 8px;
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.panel-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--el-color-primary);
  text-transform: uppercase;
}

.panel-desc {
  margin: 0;
  max-width: 560px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.is-enabled {
  color: var(--el-color-success-dark-2);
  background: var(--el-color-success-light-9);
}

.status-badge.is-disabled {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.action-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
}

.qr-card,
.verify-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
}

.qr-card {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.qr-tip,
.placeholder-desc,
.verify-tips p {
  margin: 0;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.placeholder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  font-size: 28px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 18px;
}

.placeholder-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.verify-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: var(--el-text-color-primary);

  small {
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }
}

.verify-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: var(--el-fill-color-extra-light);
  border-radius: 14px;
}

@media (max-width: 900px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }

  .panel-head {
    flex-direction: column;
  }
}
</style>
