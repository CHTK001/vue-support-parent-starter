<template>
  <PmPageShell page-class="global-config-page">
    <template #default>
      <PmSurface
        eyebrow="全局配置"
        title="支付全局配置"
        description="统一维护支付回调基础地址，其他参数仅作展示参考。"
      >
        <template #actions>
          <ScButton :icon="RefreshRight" @click="loadConfig">刷新</ScButton>
        </template>
      </PmSurface>

      <PmStatGrid>
        <PmStatCard label="支付回调基础地址" :hint="'第三方异步通知默认会基于这个地址自动拼接。'">
          <template #value>{{ form.paymentNotifyBaseUrl ? "已配置" : "未配置" }}</template>
        </PmStatCard>
        <PmStatCard label="默认自动刷新" :hint="'支付首页默认读取这里，本地手工选择仍可覆盖。'">
          <template #value>{{ formatRefreshSeconds(form.paymentAutoRefreshSeconds) }}</template>
        </PmStatCard>
        <PmStatCard label="回调拼接模板" :hint="'建议保留业务号与商户号，方便三方回调快速定位订单。'">
          <template #value>{{ form.paymentCallbackPathTemplate || "/{orderNo}/{merchantId}" }}</template>
        </PmStatCard>
      </PmStatGrid>

      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>基础配置</h3>
            <p>修改回调基础地址后点击保存即可生效，其他参数由系统自动管理。</p>
          </div>
        </div>
        <el-form label-width="132px">
          <div class="pm-form-grid">
            <el-form-item label="回调基础地址" class="pm-form-span-2">
              <div class="pm-inline-save">
                <el-input v-model="form.paymentNotifyBaseUrl" placeholder="例如：https://pay.example.com" />
                <ScButton type="primary" :loading="saving" @click="saveConfig">保存</ScButton>
              </div>
              <div class="pm-helper">只填服务根地址，后端会自动拼接 `/api/notify/.../订单号/商户ID`。</div>
            </el-form-item>
          </div>
        </el-form>
        <div class="pm-readonly-grid">
          <div class="pm-readonly-item">
            <span class="pm-readonly-item__label">回调拼接模板</span>
            <strong class="pm-readonly-item__value">{{ form.paymentCallbackPathTemplate || "/{orderNo}/{merchantId}" }}</strong>
          </div>
          <div class="pm-readonly-item">
            <span class="pm-readonly-item__label">首页自动刷新</span>
            <strong class="pm-readonly-item__value">{{ formatRefreshSeconds(form.paymentAutoRefreshSeconds) }}</strong>
          </div>
          <div class="pm-readonly-item">
            <span class="pm-readonly-item__label">备注</span>
            <strong class="pm-readonly-item__value">{{ form.remark || "-" }}</strong>
          </div>
        </div>
      </section>

      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>渠道回调前缀</h3>
            <p>各支付渠道的异步通知路径前缀，需和支付通道对接时注册的地址保持一致。</p>
          </div>
        </div>
        <div class="channel-prefix-grid">
          <div class="channel-prefix-card channel-prefix-card--wechat">
            <div class="channel-prefix-card__icon">微</div>
            <div class="channel-prefix-card__body">
              <strong>微信支付</strong>
              <code>/api/notify/wechat/{orderNo}/{merchantId}</code>
              <span>微信异步通知默认路径</span>
            </div>
          </div>
          <div class="channel-prefix-card channel-prefix-card--alipay">
            <div class="channel-prefix-card__icon">支</div>
            <div class="channel-prefix-card__body">
              <strong>支付宝</strong>
              <code>/api/notify/alipay/{orderNo}/{merchantId}</code>
              <span>支付宝异步通知默认路径</span>
            </div>
          </div>
          <div class="channel-prefix-card channel-prefix-card--wallet">
            <div class="channel-prefix-card__icon">钱</div>
            <div class="channel-prefix-card__body">
              <strong>钱包</strong>
              <code>/api/notify/wallet/{orderType}/{orderNo}</code>
              <span>钱包充值/转账/提现异步通知</span>
            </div>
          </div>
          <div class="channel-prefix-card channel-prefix-card--epay">
            <div class="channel-prefix-card__icon">易</div>
            <div class="channel-prefix-card__body">
              <strong>易支付</strong>
              <code>/api/notify/epay/{orderNo}/{merchantId}</code>
              <span>易支付异步通知默认路径</span>
            </div>
          </div>
        </div>
      </section>

      <PmPanel title="默认回调预览" description="以下地址由后端实时返回，便于核对当前配置是否符合真实接入规则。">
        <div class="pm-mini-grid pm-preview-grid">
          <div class="pm-note">
            <strong>支付回调示例</strong>
            <div>{{ form.paymentSamplePayNotifyUrl || "保存基础地址后可生成示例" }}</div>
          </div>
          <div class="pm-note">
            <strong>退款回调示例</strong>
            <div>{{ form.paymentSampleRefundNotifyUrl || "保存基础地址后可生成示例" }}</div>
          </div>
          <div class="pm-note">
            <strong>钱包充值回调示例</strong>
            <div>{{ form.paymentSampleWalletRechargeNotifyUrl || "保存基础地址后可生成示例" }}</div>
          </div>
          <div class="pm-note">
            <strong>钱包转账回调示例</strong>
            <div>{{ form.paymentSampleWalletTransferNotifyUrl || "保存基础地址后可生成示例" }}</div>
          </div>
          <div class="pm-note">
            <strong>钱包提现回调示例</strong>
            <div>{{ form.paymentSampleWalletWithdrawNotifyUrl || "保存基础地址后可生成示例" }}</div>
          </div>
          <div class="pm-note">
            <strong>推荐支付路径</strong>
            <div>/api/notify/wechat/pay/{orderNo}/{merchantId}</div>
          </div>
          <div class="pm-note">
            <strong>推荐退款路径</strong>
            <div>/api/notify/wechat/refund/{refundNo}/{merchantId}</div>
          </div>
          <div class="pm-note">
            <strong>推荐钱包路径</strong>
            <div>/api/notify/wallet/{orderType}/{orderNo}</div>
          </div>
        </div>
      </PmPanel>
    </template>

  </PmPageShell>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import { getPaymentGlobalConfig, updatePaymentGlobalConfig } from "../api/payment";
import type { PaymentGlobalConfig } from "../types/payment";
import { formatRefreshSeconds } from "../utils/format";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import { ScButton } from "@repo/components/ScButton";

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
.pm-preview-grid {
  padding: 0 var(--pm-space-lg, 16px) var(--pm-space-lg, 16px);
}
.pm-preview-grid .pm-note div {
  margin-top: 8px;
  color: #344054;
  line-height: 1.7;
  word-break: break-word;
}

/* ── 渠道前缀卡片 ── */
.channel-prefix-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.channel-prefix-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #eef2f6;
  background: #fafbfc;
  transition: all 0.25s ease;
}
.channel-prefix-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  transform: translateY(-1px);
}
.channel-prefix-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.channel-prefix-card--wechat .channel-prefix-card__icon { background: #07c160; }
.channel-prefix-card--alipay .channel-prefix-card__icon { background: #1677ff; }
.channel-prefix-card--wallet .channel-prefix-card__icon { background: #8b5cf6; }
.channel-prefix-card--epay   .channel-prefix-card__icon { background: #f59e0b; }
.channel-prefix-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.channel-prefix-card__body strong {
  font-size: 13px;
  color: #0f172a;
}
.channel-prefix-card__body code {
  font-size: 12px;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  word-break: break-all;
  font-family: "SF Mono", "Fira Code", monospace;
}
.channel-prefix-card__body span {
  font-size: 12px;
  color: #94a3b8;
}

/* ── 行内保存 ── */
.pm-inline-save {
  display: flex;
  gap: 8px;
  width: 100%;
}
.pm-inline-save .el-input {
  flex: 1;
}
</style>
