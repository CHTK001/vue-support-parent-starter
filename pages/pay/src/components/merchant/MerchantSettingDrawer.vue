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
          <PmStatusCard label="当前商户" :hint="merchant.defaultNotifyUrl || '未配置统一结果回调'">
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
          <el-tab-pane label="商户能力" name="base">
            <div class="pm-dialog-shell">
              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>能力开关</h3>
                    <p>统一处理钱包、自动关单、自动分表、自动分账和优惠能力。</p>
                  </div>
                </div>
                <div class="capability-card-grid">
                  <button
                    v-for="item in buildMerchantCapabilityCards(form)"
                    :key="item.key"
                    type="button"
                    class="capability-card-hit"
                    @click="toggleMerchantCapability(form, item.key)"
                  >
                    <ScCard
                      layout="compact"
                      hoverable
                      :active="item.active"
                      :title="item.title"
                      :subtitle="item.subtitle"
                      :icon="item.icon"
                      :theme="item.theme"
                      class="capability-card"
                    >
                      <div class="capability-card__meta">
                        <span>{{ item.description }}</span>
                        <el-tag :type="item.tagType" effect="plain">{{ item.active ? "已开启" : "已关闭" }}</el-tag>
                      </div>
                    </ScCard>
                  </button>
                </div>
              </section>

              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>统一地址</h3>
                    <p>商户级默认配置，渠道未单独覆盖时会使用这里的地址。</p>
                  </div>
                </div>
                <el-form label-width="112px">
                  <div class="pm-form-grid">
                    <el-form-item label="自动关单分钟">
                      <el-input-number v-model="form.paymentAutoCloseMinutes" :min="1" :max="1440" :disabled="!form.paymentAutoCloseEnabled" />
                    </el-form-item>
                    <el-form-item label="状态说明">
                      <div class="pm-soft-panel pm-subtle">自动关单更多依赖任务调度能力，与订单超时策略共同生效。</div>
                    </el-form-item>
                    <el-form-item label="统一结果回调" class="pm-form-span-2">
                      <el-input v-model="form.defaultNotifyUrl" />
                    </el-form-item>
                    <el-form-item label="支付完成回跳" class="pm-form-span-2">
                      <el-input v-model="form.defaultReturnUrl" />
                    </el-form-item>
                  </div>
                </el-form>
              </section>
            </div>
          </el-tab-pane>

          <el-tab-pane label="订单规则" name="payment">
            <div class="pm-dialog-shell">
              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>订单行为</h3>
                    <p>幂等、超时和待支付上限都在这里统一配置。</p>
                  </div>
                </div>
                <div class="setting-switch-grid">
                  <ScSwitch v-model="paymentConfigState.orderReusable" layout="card" active-text="订单幂等复用开启" inactive-text="订单幂等复用关闭" />
                  <ScSwitch v-model="paymentConfigState.autoCancelTimeoutOrder" layout="card" active-text="超时单自动取消" inactive-text="超时单不自动取消" />
                </div>
                <el-form label-width="112px">
                  <div class="pm-form-grid">
                    <el-form-item label="订单超时分钟">
                      <el-input-number v-model="paymentConfigState.orderTimeoutMinutes" :min="1" :max="1440" />
                    </el-form-item>
                    <el-form-item label="待支付上限">
                      <el-input-number v-model="paymentConfigState.pendingOrderLimit" :min="0" :max="99999" />
                    </el-form-item>
                  </div>
                </el-form>
              </section>
            </div>
          </el-tab-pane>

          <el-tab-pane label="钱包限额" name="wallet">
            <div class="pm-dialog-shell">
              <section class="pm-section">
                <div class="pm-section__head">
                  <div>
                    <h3>钱包出入金限额</h3>
                    <p>适用于余额钱包的充值、提现和转账上限。</p>
                  </div>
                </div>
                <el-form label-width="112px">
                  <div class="pm-form-grid">
                    <el-form-item label="单笔充值"><el-input-number v-model="walletLimitState.singleRechargeLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                    <el-form-item label="单日充值"><el-input-number v-model="walletLimitState.dailyRechargeLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                    <el-form-item label="单笔提现"><el-input-number v-model="walletLimitState.singleWithdrawLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                    <el-form-item label="单日提现"><el-input-number v-model="walletLimitState.dailyWithdrawLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                    <el-form-item label="单笔转账"><el-input-number v-model="walletLimitState.singleTransferLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                    <el-form-item label="单日转账"><el-input-number v-model="walletLimitState.dailyTransferLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                    <el-form-item label="余额上限"><el-input-number v-model="walletLimitState.balanceLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                  </div>
                </el-form>
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
import { buildMerchantCapabilityCards, createMerchantForm, toggleMerchantCapability } from "./merchant";
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

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const m = props.merchant;
    if (m && m.id) {
      Object.assign(form, createMerchantForm(), m);
      Object.assign(paymentConfigState, { merchantId: m.id, orderReusable: false, orderTimeoutMinutes: 30, pendingOrderLimit: 0, autoCancelTimeoutOrder: false }, props.paymentConfig || {});
      Object.assign(walletLimitState, { merchantId: m.id }, props.walletLimit || {});
    }
    activeTab.value = "base";
  }
);

function handleSave() {
  emit("saved", { ...form }, { ...paymentConfigState }, { ...walletLimitState });
}
</script>

<style scoped>
.capability-card-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.capability-card-hit {
  position: relative;
  cursor: pointer;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
}

.capability-card {
  min-height: 148px;
}

.capability-card :deep(.sc-card-compact__body) {
  padding-top: 0;
}

.capability-card__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #667085;
  line-height: 1.7;
}

.setting-switch-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pm-soft-panel {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.03);
  font-size: 13px;
  line-height: 1.6;
  color: #667085;
}

@media (max-width: 980px) {
  .capability-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
