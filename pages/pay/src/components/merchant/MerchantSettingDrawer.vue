<template>
  <ScDrawer
    :model-value="modelValue"
    size="720px"
    :title="merchant ? `${merchant.merchantName} · 商户设置` : '商户设置'"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="merchant">
      <div class="pm-dialog-shell">
        <PmStatusStrip>
          <PmStatusCard label="当前商户" :hint="merchant.merchantNo || '商户编号'">
            <template #value>{{ merchant.merchantName }}</template>
          </PmStatusCard>
          <PmStatusCard label="已配支付方式" :hint="'建议至少保留一个可执行支付方式。'">
            <template #value>{{ merchant.channelCount || 0 }}</template>
          </PmStatusCard>
          <PmStatusCard label="状态" :hint="'订单策略和钱包限额都按当前商户维度生效。'">
            <template #value>{{ merchant.statusDesc || MerchantStatusMap[merchant.status] }}</template>
          </PmStatusCard>
        </PmStatusStrip>

        <el-tabs v-model="activeTab">
          <!-- 商户能力 -->
          <el-tab-pane label="商户能力" name="base">
            <div class="pm-dialog-shell">
              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>能力开关</h3>
                    <p>统一管理自动分表、自动分账和优惠能力。</p>
                  </div>
                </div>
                <div class="capability-switch-grid">
                  <div v-for="item in capabilities" :key="item.key" class="capability-switch-item">
                    <ScSwitch v-model="capabilityState[item.key]" layout="card" class="capability-switch">
                      <template #default>
                        <div class="capability-switch__inner">
                          <div class="capability-switch__icon" :class="`capability-switch__icon--${item.theme}`">
                            <span class="capability-switch__icon-text">{{ item.icon === 'ri:table-2' ? '表' : item.icon === 'ri:exchange-funds-line' ? '账' : '惠' }}</span>
                          </div>
                          <div class="capability-switch__info">
                            <strong class="capability-switch__title">{{ item.title }}</strong>
                            <span class="capability-switch__desc">{{ item.subtitle }}</span>
                          </div>
                          <el-tag :type="capabilityState[item.key] ? item.tagType : 'info'" effect="plain" size="small">
                            {{ capabilityState[item.key] ? '已开启' : '已关闭' }}
                          </el-tag>
                        </div>
                      </template>
                    </ScSwitch>
                    <p class="capability-switch__footnote">{{ item.description }}</p>
                  </div>
                </div>
              </section>
            </div>
          </el-tab-pane>

          <!-- 订单规则 -->
          <el-tab-pane label="订单规则" name="payment">
            <div class="pm-dialog-shell">
              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>幂等配置</h3>
                    <p>相同业务单号是否复用已存在的待支付订单，避免重复创建。</p>
                  </div>
                </div>
                <div class="setting-card-grid">
                  <div class="setting-card">
                    <div class="setting-card__body">
                      <div class="setting-card__info">
                        <strong class="setting-card__title">订单幂等复用</strong>
                        <p class="setting-card__desc">相同业务单号的待支付订单将直接复用已有订单，避免重复创建</p>
                      </div>
                      <ScSwitch v-model="paymentConfigState.orderReusable" layout="card" />
                    </div>
                  </div>
                </div>
              </section>

              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>超时配置</h3>
                    <p>超时未支付的订单自动取消，释放库存和优惠占用。</p>
                  </div>
                </div>
                <div class="setting-card-grid">
                  <div class="setting-card">
                    <div class="setting-card__body">
                      <div class="setting-card__info">
                        <strong class="setting-card__title">超时单自动取消</strong>
                        <p class="setting-card__desc">超时后系统自动将订单标记为已取消，无需人工干预</p>
                      </div>
                      <ScSwitch v-model="paymentConfigState.autoCancelTimeoutOrder" layout="card" />
                    </div>
                  </div>
                </div>
                <el-form label-width="112px" class="pm-setting-form">
                  <el-form-item label="订单超时分钟">
                    <el-input-number v-model="paymentConfigState.orderTimeoutMinutes" :min="1" :max="1440" />
                    <div class="pm-helper">订单创建后超过此分钟数未支付则自动取消，范围 1-1440 分钟（1 分钟~24 小时）</div>
                  </el-form-item>
                </el-form>
              </section>

              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>限额配置</h3>
                    <p>限制同一商户下用户的待支付订单数量，控制资金风险。</p>
                  </div>
                </div>
                <el-form label-width="112px" class="pm-setting-form">
                  <el-form-item label="待支付上限">
                    <el-input-number v-model="paymentConfigState.pendingOrderLimit" :min="0" :max="99999" />
                    <div class="pm-helper">同一用户最多可同时拥有的待支付订单数，0 表示不限制</div>
                  </el-form-item>
                </el-form>
              </section>
            </div>
          </el-tab-pane>

          <!-- 钱包限额 -->
          <el-tab-pane label="钱包限额" name="wallet">
            <div class="pm-dialog-shell">
              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>钱包出入金限额</h3>
                    <p>适用于余额钱包的充值、提现和转账上限。</p>
                  </div>
                </div>
                <div class="wallet-limit-grid">
                  <div class="wallet-limit-group">
                    <h4 class="wallet-limit-group__title">充值</h4>
                    <el-form label-width="100px" class="pm-setting-form">
                      <el-form-item label="单笔充值">
                        <el-input-number v-model="walletLimitState.singleRechargeLimit" :min="0" :precision="2" :step="10" />
                      </el-form-item>
                      <el-form-item label="单日充值">
                        <el-input-number v-model="walletLimitState.dailyRechargeLimit" :min="0" :precision="2" :step="10" />
                      </el-form-item>
                    </el-form>
                  </div>
                  <div class="wallet-limit-group">
                    <h4 class="wallet-limit-group__title">提现</h4>
                    <el-form label-width="100px" class="pm-setting-form">
                      <el-form-item label="单笔提现">
                        <el-input-number v-model="walletLimitState.singleWithdrawLimit" :min="0" :precision="2" :step="10" />
                      </el-form-item>
                      <el-form-item label="单日提现">
                        <el-input-number v-model="walletLimitState.dailyWithdrawLimit" :min="0" :precision="2" :step="10" />
                      </el-form-item>
                    </el-form>
                  </div>
                  <div class="wallet-limit-group">
                    <h4 class="wallet-limit-group__title">转账</h4>
                    <el-form label-width="100px" class="pm-setting-form">
                      <el-form-item label="单笔转账">
                        <el-input-number v-model="walletLimitState.singleTransferLimit" :min="0" :precision="2" :step="10" />
                      </el-form-item>
                      <el-form-item label="单日转账">
                        <el-input-number v-model="walletLimitState.dailyTransferLimit" :min="0" :precision="2" :step="10" />
                      </el-form-item>
                    </el-form>
                  </div>
                  <div class="wallet-limit-group wallet-limit-group--full">
                    <h4 class="wallet-limit-group__title">全局</h4>
                    <el-form label-width="100px" class="pm-setting-form">
                      <el-form-item label="余额上限">
                        <el-input-number v-model="walletLimitState.balanceLimit" :min="0" :precision="2" :step="10" />
                      </el-form-item>
                    </el-form>
                  </div>
                </div>
              </section>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="pm-dialog-footer">
        <ScButton @click="emit('update:modelValue', false)">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="handleSave">保存设置</ScButton>
      </div>
    </template>
  </ScDrawer>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { Merchant, MerchantPaymentConfig, MerchantWalletLimit } from "../../types/payment";
import { MerchantStatusMap } from "../../types/payment";
import { buildMerchantCapabilityCards, createMerchantForm } from "./merchant";
import PmStatusStrip from "../layout/PmStatusStrip.vue";
import PmStatusCard from "../layout/PmStatusCard.vue";
import { ScDrawer } from "@repo/components/ScDrawer";
import { ScCard } from "@repo/components/ScCard";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { ScButton } from "@repo/components/ScButton";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    merchant?: Merchant | null;
    paymentConfig?: MerchantPaymentConfig | null;
    walletLimit?: MerchantWalletLimit | null;
    saving?: boolean;
  }>(),
  { merchant: null, paymentConfig: null, walletLimit: null, saving: false }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "saved", formData: Record<string, unknown>, paymentConfig: MerchantPaymentConfig, walletLimit: MerchantWalletLimit): void;
}>();

const activeTab = ref("base");
const form = reactive(createMerchantForm());

const paymentConfigState = reactive<MerchantPaymentConfig>({
  merchantId: 0,
  orderReusable: false,
  orderTimeoutMinutes: 30,
  pendingOrderLimit: 0,
  autoCancelTimeoutOrder: false,
});

const walletLimitState = reactive<MerchantWalletLimit>({
  merchantId: 0,
});

const capabilityState = reactive({
  paymentSplitTableEnabled: false,
  paymentProfitSharingEnabled: false,
  paymentCouponEnabled: false,
});

const capabilities = buildMerchantCapabilityCards(capabilityState);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const m = props.merchant;
    if (m && m.id) {
      Object.assign(form, createMerchantForm(), m);
      Object.assign(paymentConfigState, { merchantId: m.id, orderReusable: false, orderTimeoutMinutes: 30, pendingOrderLimit: 0, autoCancelTimeoutOrder: false }, props.paymentConfig || {});
      Object.assign(walletLimitState, { merchantId: m.id }, props.walletLimit || {});
      capabilityState.paymentSplitTableEnabled = !!m.paymentSplitTableEnabled;
      capabilityState.paymentProfitSharingEnabled = !!m.paymentProfitSharingEnabled;
      capabilityState.paymentCouponEnabled = !!m.paymentCouponEnabled;
    }
    activeTab.value = "base";
  }
);

function handleSave() {
  emit("saved",
    { ...form, ...capabilityState },
    { ...paymentConfigState },
    { ...walletLimitState }
  );
}
</script>

<style scoped>
/* ── Capability Switches ── */

.capability-switch-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.capability-switch-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.capability-switch {
  width: 100%;
}

.capability-switch :deep(.sc-switch-card) {
  padding: 16px;
}

.capability-switch__inner {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.capability-switch__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 20px;
  flex-shrink: 0;
}

.capability-switch__icon--primary {
  background: #eef2ff;
  color: #6366f1;
}

.capability-switch__icon--success {
  background: #ecfdf5;
  color: #10b981;
}

.capability-switch__icon--warning {
  background: #fffbeb;
  color: #f59e0b;
}

.capability-switch__info {
  flex: 1;
  min-width: 0;
}

.capability-switch__title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.capability-switch__desc {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.capability-switch__footnote {
  margin: 0 0 0 54px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

/* ── Setting Cards ── */

.setting-card-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-card {
  border-radius: 12px;
  border: 1px solid #eef2f6;
  background: #fafbfc;
  overflow: hidden;
}

.setting-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
}

.setting-card__info {
  flex: 1;
  min-width: 0;
}

.setting-card__title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.setting-card__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.setting-card__body :deep(.sc-switch-card) {
  min-width: 48px;
}

/* ── Form ── */

.pm-setting-form {
  margin-top: 12px;
}

.pm-setting-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.pm-setting-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.pm-helper {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
  margin-top: 4px;
}

/* ── Wallet Limits ── */

.wallet-limit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.wallet-limit-group {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #eef2f6;
  background: #fafbfc;
}

.wallet-limit-group--full {
  grid-column: 1 / -1;
}

.wallet-limit-group__title {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 980px) {
  .wallet-limit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
