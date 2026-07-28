<template>
  <PmPageShell page-class="global-config-page">
    <PmSurface
      eyebrow="全局配置"
      title="支付全局配置"
      description="设置支付回调基础地址，系统会自动拼接各渠道的异步通知路径。"
    />

    <section class="config-hero">
      <div class="config-hero__card">
        <div class="config-hero__header">
          <div class="config-hero__header-icon">
            <el-icon><Link /></el-icon>
          </div>
          <div class="config-hero__header-text">
            <h3>回调基础地址</h3>
            <p>填写你的服务部署地址，仅需域名或 IP + 端口，无需完整路径。</p>
          </div>
        </div>
        <div class="config-hero__input-row">
          <el-input
            v-model="form.paymentNotifyBaseUrl"
            placeholder="例如：https://pay.example.com 或 http://192.168.1.100:8090"
            size="large"
            clearable
          />
          <ScButton type="primary" size="large" :loading="saving" @click="saveConfig">保存</ScButton>
        </div>
        <p class="config-hero__hint">
          保存后自动生成微信 <code>/api/notify/wechat/{orderNo}/{merchantId}</code>
          ／ 支付宝 <code>/api/notify/alipay/{orderNo}/{merchantId}</code>
          ／ 钱包 <code>/api/notify/wallet/{orderType}/{orderNo}</code>
        </p>
      </div>
    </section>

    <section class="config-status">
      <div class="config-status__item">
        <span class="config-status__label">当前状态</span>
        <strong class="config-status__value" :class="form.paymentNotifyBaseUrl ? 'is-configured' : 'is-empty'">
          {{ form.paymentNotifyBaseUrl ? '已配置' : '未配置' }}
        </strong>
      </div>
      <div class="config-status__item">
        <span class="config-status__label">自动刷新</span>
        <strong class="config-status__value">{{ formatRefreshSeconds(form.paymentAutoRefreshSeconds) }}</strong>
      </div>
      <div class="config-status__item">
        <span class="config-status__label">拼接模板</span>
        <strong class="config-status__value">{{ form.paymentCallbackPathTemplate || "/{orderNo}/{merchantId}" }}</strong>
      </div>
    </section>
  </PmPageShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Link } from "@element-plus/icons-vue";
import { getPaymentGlobalConfig, updatePaymentGlobalConfig } from "../api/payment";
import type { PaymentGlobalConfig } from "../types/payment";
import { formatRefreshSeconds } from "../utils/format";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";

const saving = ref(false);

const form = reactive<PaymentGlobalConfig>({
  configKey: "DEFAULT",
  paymentNotifyBaseUrl: "",
  paymentReturnUrl: "",
  paymentCallbackPathTemplate: "/{orderNo}/{merchantId}",
  paymentAutoRefreshSeconds: 60,
  remark: "",
  paymentSamplePayNotifyUrl: "",
  paymentSampleRefundNotifyUrl: "",
  paymentSampleWalletRechargeNotifyUrl: "",
  paymentSampleWalletTransferNotifyUrl: "",
  paymentSampleWalletWithdrawNotifyUrl: "",
});

function applyConfig(data?: PaymentGlobalConfig | null) {
  Object.assign(form, {
    configKey: "DEFAULT",
    paymentNotifyBaseUrl: "",
    paymentReturnUrl: "",
    paymentCallbackPathTemplate: "/{orderNo}/{merchantId}",
    paymentAutoRefreshSeconds: 60,
    remark: "",
    paymentSamplePayNotifyUrl: "",
    paymentSampleRefundNotifyUrl: "",
    paymentSampleWalletRechargeNotifyUrl: "",
    paymentSampleWalletTransferNotifyUrl: "",
    paymentSampleWalletWithdrawNotifyUrl: "",
  }, data || {});
}

async function loadConfig() {
  const res = await getPaymentGlobalConfig();
  applyConfig(res.data);
}

async function saveConfig() {
  saving.value = true;
  try {
    const res = await updatePaymentGlobalConfig({
      configKey: "DEFAULT",
      paymentNotifyBaseUrl: form.paymentNotifyBaseUrl?.trim(),
      paymentReturnUrl: form.paymentReturnUrl?.trim(),
      paymentCallbackPathTemplate: form.paymentCallbackPathTemplate?.trim() || "/{orderNo}/{merchantId}",
      paymentAutoRefreshSeconds: Number(form.paymentAutoRefreshSeconds || 60),
      remark: form.remark?.trim(),
    });
    applyConfig(res.data);
    ElMessage.success("支付全局配置已保存");
  } finally {
    saving.value = false;
  }
}

onMounted(() => void loadConfig());
</script>

<style scoped>
/* ── Hero card ── */
.config-hero {
  margin-bottom: 20px;
}

.config-hero__card {
  background: var(--pm-surface-card, rgba(255,255,255,0.85));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--pm-border-color-light, rgba(233,238,246,0.6));
  border-radius: 20px;
  padding: 28px 32px;
}

.config-hero__header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.config-hero__header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--pm-color-brand-gradient, linear-gradient(135deg, #4f46e5, #6366f1));
  color: #fff;
  font-size: 20px;
  flex-shrink: 0;
}

.config-hero__header-text h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--pm-text-primary, #070b15);
  margin: 0 0 4px;
}

.config-hero__header-text p {
  font-size: 13px;
  color: var(--pm-text-muted, #8b97a9);
  margin: 0;
}

.config-hero__input-row {
  display: flex;
  gap: 10px;
}

.config-hero__input-row .el-input {
  flex: 1;
}

.config-hero__hint {
  margin: 14px 0 0;
  font-size: 12.5px;
  color: var(--pm-text-muted, #8b97a9);
  line-height: 1.7;
}

.config-hero__hint code {
  background: var(--pm-color-brand-light, #eef2ff);
  color: var(--pm-color-brand, #4f46e5);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 12px;
}

/* ── Status bar ── */
.config-status {
  display: flex;
  gap: 16px;
}

.config-status__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  background: var(--pm-surface-card, rgba(255,255,255,0.85));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--pm-border-color-light, rgba(233,238,246,0.6));
  border-radius: 16px;
}

.config-status__label {
  font-size: 12px;
  color: var(--pm-text-muted, #8b97a9);
}

.config-status__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--pm-text-primary, #070b15);
  word-break: break-all;
}

.config-status__value.is-configured {
  color: #059669;
}

.config-status__value.is-empty {
  color: #dc2626;
}
</style>
