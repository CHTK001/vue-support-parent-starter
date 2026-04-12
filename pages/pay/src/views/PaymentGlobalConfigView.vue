<template>
  <section class="payment-page global-config-page">
    <template v-if="isAdmin">
      <header class="payment-surface">
        <div>
          <p class="payment-surface__eyebrow">Global Config</p>
          <h1 class="payment-surface__title">支付全局配置</h1>
          <p class="payment-surface__desc">统一维护支付回调基础地址、浏览器回跳地址和首页默认自动刷新周期。</p>
        </div>
        <div class="payment-surface__actions">
          <el-button :icon="RefreshRight" @click="loadConfig">刷新</el-button>
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
        </div>
      </header>

      <section class="payment-stat-grid">
        <article class="payment-stat">
          <span class="payment-stat__label">支付回调基础地址</span>
          <strong class="payment-stat__value">{{ form.paymentNotifyBaseUrl ? "已配置" : "未配置" }}</strong>
          <span class="payment-stat__hint">第三方异步通知默认会基于这个地址自动拼接。</span>
        </article>
        <article class="payment-stat">
          <span class="payment-stat__label">默认自动刷新</span>
          <strong class="payment-stat__value">{{ formatRefreshSeconds(form.paymentAutoRefreshSeconds) }}</strong>
          <span class="payment-stat__hint">支付首页默认读取这里，本地手工选择仍可覆盖。</span>
        </article>
        <article class="payment-stat">
          <span class="payment-stat__label">回调拼接模板</span>
          <strong class="payment-stat__value">{{ form.paymentCallbackPathTemplate || "/{orderNo}/{merchantId}" }}</strong>
          <span class="payment-stat__hint">建议保留业务号与商户号，方便三方回调快速定位订单。</span>
        </article>
      </section>

      <section class="payment-section-card">
        <div class="payment-section-card__title">
          <div>
            <h3>基础配置</h3>
            <p>支付、退款默认回调路径会基于这里统一生成，渠道或商户有单独覆盖时再按覆盖值执行。</p>
          </div>
        </div>
        <el-form label-width="132px">
          <div class="payment-form-grid">
            <el-form-item label="回调基础地址" class="payment-form-span-2">
              <el-input v-model="form.paymentNotifyBaseUrl" placeholder="例如：https://pay.example.com" />
              <div class="payment-helper">只填服务根地址，后端会自动拼接 `/api/notify/.../订单号/商户ID`。</div>
            </el-form-item>
            <el-form-item label="默认回跳地址" class="payment-form-span-2">
              <el-input v-model="form.paymentReturnUrl" placeholder="例如：https://shop.example.com/pay/result" />
              <div class="payment-helper">主要用于 H5、收银台和浏览器支付完成后的页面跳转。</div>
            </el-form-item>
            <el-form-item label="回调模板">
              <el-input v-model="form.paymentCallbackPathTemplate" placeholder="/{orderNo}/{merchantId}" />
            </el-form-item>
            <el-form-item label="首页自动刷新">
              <el-select v-model="form.paymentAutoRefreshSeconds">
                <el-option v-for="item in refreshOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注" class="payment-form-span-2">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="记录当前环境、网关域名和运维说明。" />
            </el-form-item>
          </div>
        </el-form>
      </section>

      <section class="payment-panel">
        <div class="payment-panel__head">
          <div>
            <h2 class="payment-panel__title">默认回调预览</h2>
            <p class="payment-panel__desc">以下地址由后端实时返回，便于核对当前配置是否符合真实接入规则。</p>
          </div>
        </div>
        <div class="payment-mini-grid payment-preview-grid">
          <div class="payment-note">
            <strong>支付回调示例</strong>
            <div>{{ form.paymentSamplePayNotifyUrl || "保存基础地址后可生成示例" }}</div>
          </div>
          <div class="payment-note">
            <strong>退款回调示例</strong>
            <div>{{ form.paymentSampleRefundNotifyUrl || "保存基础地址后可生成示例" }}</div>
          </div>
          <div class="payment-note">
            <strong>推荐支付路径</strong>
            <div>/api/notify/wechat/pay/{orderNo}/{merchantId}</div>
          </div>
          <div class="payment-note">
            <strong>推荐退款路径</strong>
            <div>/api/notify/wechat/refund/{refundNo}/{merchantId}</div>
          </div>
        </div>
      </section>
    </template>

    <section v-else class="payment-empty">
      当前账号不是超管或管理员，不能查看支付全局配置。
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import { getPaymentGlobalConfig, updatePaymentGlobalConfig } from "../api/payment";
import type { PaymentGlobalConfig } from "../types/payment";
import { hasAdminRole, readUserRoles } from "./support/paymentView";

const roles = readUserRoles();
const isAdmin = hasAdminRole(roles);
const saving = ref(false);

const refreshOptions = [
  { label: "15 秒", value: 15 },
  { label: "30 秒", value: 30 },
  { label: "60 秒", value: 60 },
  { label: "5 分钟", value: 300 },
];

const form = reactive<PaymentGlobalConfig>({
  configKey: "DEFAULT",
  paymentNotifyBaseUrl: "",
  paymentReturnUrl: "",
  paymentCallbackPathTemplate: "/{orderNo}/{merchantId}",
  paymentAutoRefreshSeconds: 60,
  remark: "",
  paymentSamplePayNotifyUrl: "",
  paymentSampleRefundNotifyUrl: "",
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
  }, data || {});
}

function formatRefreshSeconds(value?: number) {
  const seconds = Number(value || 0);
  if (!seconds) {
    return "60 秒";
  }
  if (seconds >= 60) {
    const minutes = seconds / 60;
    return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)} 分钟`;
  }
  return `${seconds} 秒`;
}

async function loadConfig() {
  if (!isAdmin) {
    return;
  }
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

onMounted(() => {
  void loadConfig();
});
</script>

<style scoped>
@import "./support/payment-page.css";

.global-config-page {
  background: linear-gradient(180deg, #f1f7fb 0%, #f8fbfd 220px, #fbfdfe 100%);
}

.payment-preview-grid {
  padding: 0 16px 16px;
}

.payment-preview-grid .payment-note div {
  margin-top: 8px;
  color: #344054;
  line-height: 1.7;
  word-break: break-word;
}
</style>
