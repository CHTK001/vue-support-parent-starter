<template>
  <ScDrawer
    :model-value="modelValue"
    size="920px"
    :title="merchant ? `${merchant.merchantName} · 支付方式` : '支付方式'"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="merchant">
      <div class="pm-dialog-shell">
        <PmStatusStrip>
          <PmStatusCard label="统一结果回调" :hint="'支付、转账、退款默认共用。'">
            <template #value>{{ merchant.defaultNotifyUrl || '未配置' }}</template>
          </PmStatusCard>
          <PmStatusCard label="浏览器回跳" :hint="'浏览器支付成功后前端跳转使用。'">
            <template #value>{{ merchant.defaultReturnUrl || '未配置' }}</template>
          </PmStatusCard>
          <PmStatusCard label="支付方式数量" :hint="'支持按支付方式单独覆盖结果回调与浏览器回跳。'">
            <template #value>{{ channels.length }}</template>
          </PmStatusCard>
        </PmStatusStrip>

        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>支付方式列表</h3>
              <p>按业务支付方式展示启停状态、回调覆盖、凭证完成度和适用场景。</p>
            </div>
            <div class="channel-drawer-actions">
              <el-input v-model="keyword" clearable placeholder="搜索支付方式名称 / 渠道类型" style="width: 220px" />
              <el-tooltip content="新增支付方式">
                <ScButton circle type="primary" :icon="Plus" @click="emit('addChannel')" />
              </el-tooltip>
            </div>
          </div>

          <ScTable
            table-name="payment-merchant-channel-card"
            layout="card"
            card-layout="default"
            :search="false"
            :hide-do="true"
            :hide-refresh="true"
            :hide-setting="true"
            :hide-pagination="true"
            :data="cardData"
          >
            <template #default="{ row }">
              <article
                class="channel-card"
                :class="[
                  `channel-card--${resolveChannelTone(row.channelType)}`,
                  { 'channel-card--inactive': !isChannelEnabled(row), 'channel-card--deleted': isChannelDeleted(row) },
                ]"
              >
                <header class="channel-card__top">
                  <div class="channel-card__identity">
                    <div class="channel-card__type-chip">
                      {{ formatChannelType(row.channelType) }}
                    </div>
                    <div class="channel-card__title-block">
                      <strong>{{ resolveChannelDisplayName(row) }}</strong>
                      <p>
                        {{ formatChannelSubType(row.channelType, row.channelSubType) }}
                        <template v-if="showChannelAlias(row)"> · 别名 {{ row.channelName }}</template>
                      </p>
                    </div>
                  </div>
                  <div class="channel-card__status">
                    <el-tag :type="channelStatusTag(row)" effect="dark">{{ formatChannelStatus(row) }}</el-tag>
                    <span>{{ row.channelTypeDesc || formatChannelType(row.channelType) }}</span>
                  </div>
                </header>

                <section class="channel-card__metrics">
                  <div class="channel-card__metric">
                    <span>运行模式</span>
                    <strong>{{ resolveChannelMode(row) }}</strong>
                  </div>
                  <div class="channel-card__metric">
                    <span>回调策略</span>
                    <strong>{{ resolveCallbackMode(row) }}</strong>
                  </div>
                  <div class="channel-card__metric">
                    <span>凭证完整度</span>
                    <strong>{{ resolveCredentialSummary(row) }}</strong>
                  </div>
                  <div class="channel-card__metric">
                    <span>支付场景</span>
                    <strong>{{ formatChannelSubType(row.channelType, row.channelSubType) }}</strong>
                  </div>
                </section>

                <section class="channel-card__details">
                  <div class="channel-card__detail">
                    <span>商户号</span>
                    <strong>{{ row.merchantNo || '未录入' }}</strong>
                  </div>
                  <div class="channel-card__detail">
                    <span>支付结果回调</span>
                    <strong>{{ row.effectiveNotifyUrl || row.notifyUrl || '沿用商户默认结果回调' }}</strong>
                  </div>
                  <div class="channel-card__detail">
                    <span>浏览器回跳</span>
                    <strong>{{ row.effectiveReturnUrl || row.returnUrl || '沿用商户默认回跳' }}</strong>
                  </div>
                  <div class="channel-card__detail">
                    <span>更新时间</span>
                    <strong>{{ row.updatedAt || row.createdAt || '-' }}</strong>
                  </div>
                </section>

                <div class="channel-card__credential-row">
                  <span class="channel-card__credential-label">凭证状态</span>
                  <div class="channel-card__credential-tags">
                    <span class="channel-credential" :class="{ 'is-ready': row.apiKeyConfigured }">API Key</span>
                    <span class="channel-credential" :class="{ 'is-ready': row.privateKeyConfigured }">私钥</span>
                    <span class="channel-credential" :class="{ 'is-ready': row.publicKeyConfigured }">公钥</span>
                    <span class="channel-credential" :class="{ 'is-ready': row.certConfigured }">证书</span>
                  </div>
                </div>

                <section v-if="buildChannelSummary(row).length" class="channel-card__summary">
                  <div v-for="item in buildChannelSummary(row)" :key="`${row.id}-${item.label}`" class="channel-card__summary-item">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </div>
                </section>

                <footer class="channel-card__footer">
                  <div class="channel-card__caption">
                    {{ describeChannelPurpose(row) }}
                  </div>
                  <div class="channel-card__actions">
                    <el-tooltip content="编辑支付方式">
                      <ScButton circle :icon="Edit" @click="emit('editChannel', row)" />
                    </el-tooltip>
                    <el-tooltip :content="isChannelEnabled(row) ? '禁用支付方式' : '启用支付方式'">
                      <ScButton
                        circle
                        :type="isChannelEnabled(row) ? 'warning' : 'success'"
                        :icon="isChannelEnabled(row) ? SwitchButton : CircleCheck"
                        :disabled="isChannelDeleted(row)"
                        @click="emit('toggleChannel', row)"
                      />
                    </el-tooltip>
                    <el-tooltip content="删除支付方式">
                      <ScButton circle type="danger" :icon="Delete" :disabled="isChannelDeleted(row)" @click="emit('deleteChannel', row)" />
                    </el-tooltip>
                  </div>
                </footer>
              </article>
            </template>
          </ScTable>
        </section>
      </div>
    </template>
  </ScDrawer>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Plus, Edit, Delete, SwitchButton, CircleCheck } from "@element-plus/icons-vue";
import type { Merchant, MerchantChannel } from "../../types/payment";
import {
  buildChannelSummary,
  channelStatusTag,
  describeChannelPurpose,
  formatChannelStatus,
  formatChannelSubType,
  formatChannelType,
  isChannelDeleted,
  isChannelEnabled,
  resolveCallbackMode,
  resolveChannelDisplayName,
  resolveChannelMode,
  resolveChannelTone,
  resolveCredentialSummary,
  showChannelAlias,
  wrapCardData,
} from "./merchant";
import PmStatusStrip from "../layout/PmStatusStrip.vue";
import PmStatusCard from "../layout/PmStatusCard.vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    merchant?: Merchant | null;
    channels?: MerchantChannel[];
    saving?: boolean;
  }>(),
  { merchant: null, channels: () => [], saving: false }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "addChannel"): void;
  (e: "editChannel", row: MerchantChannel): void;
  (e: "deleteChannel", row: MerchantChannel): void;
  (e: "toggleChannel", row: MerchantChannel): void;
}>();

const keyword = ref("");

const filteredChannels = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return props.channels;
  return props.channels.filter(
    (ch) =>
      ch.channelName?.toLowerCase().includes(kw) ||
      ch.channelType?.toLowerCase().includes(kw) ||
      ch.channelSubType?.toLowerCase().includes(kw)
  );
});

const cardData = computed(() => wrapCardData(filteredChannels.value));
</script>

<style scoped>
.channel-drawer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(205, 216, 222, 0.96);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0) 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 249, 251, 0.98) 100%);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.channel-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: var(--channel-tone, #7c8b9d);
}

.channel-card--wechat {
  --channel-tone: #07c160;
}

.channel-card--alipay {
  --channel-tone: #1677ff;
}

.channel-card--epay {
  --channel-tone: #7c3aed;
}

.channel-card--wallet {
  --channel-tone: #c2410c;
}

.channel-card--default {
  --channel-tone: #64748b;
}

.channel-card--inactive {
  background:
    radial-gradient(circle at top right, rgba(245, 247, 250, 0.86) 0%, rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(250, 251, 252, 0.98) 0%, rgba(245, 247, 249, 0.98) 100%);
}

.channel-card--deleted {
  border-color: rgba(248, 113, 113, 0.24);
  background:
    radial-gradient(circle at top right, rgba(254, 226, 226, 0.8) 0%, rgba(255, 255, 255, 0) 26%),
    linear-gradient(180deg, rgba(255, 250, 250, 0.98) 0%, rgba(254, 242, 242, 0.98) 100%);
}

.channel-card--deleted::before {
  background: #ef4444;
}

.channel-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.channel-card__identity {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.channel-card__type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  padding: 8px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--channel-tone), white 86%);
  color: color-mix(in srgb, var(--channel-tone), black 18%);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.channel-card__title-block {
  min-width: 0;
}

.channel-card__title-block strong {
  display: block;
  font-size: 18px;
  color: #0f172a;
}

.channel-card__title-block p {
  margin: 8px 0 0;
  color: #667085;
  line-height: 1.7;
}

.channel-card__status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  color: #667085;
  font-size: 12px;
  text-align: right;
}

.channel-card__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.channel-card__metric {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(245, 247, 250, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.96);
}

.channel-card__metric span,
.channel-card__detail span,
.channel-card__summary-item span {
  display: block;
  margin-bottom: 8px;
  color: #667085;
  font-size: 12px;
}

.channel-card__metric strong,
.channel-card__detail strong,
.channel-card__summary-item strong {
  display: block;
  color: #101828;
  line-height: 1.7;
  word-break: break-word;
}

.channel-card__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.channel-card__detail,
.channel-card__summary-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.96);
}

.channel-card__credential-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px dashed rgba(203, 213, 225, 0.96);
}

.channel-card__credential-label {
  color: #344054;
  font-size: 13px;
  font-weight: 600;
}

.channel-card__credential-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.channel-credential {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f2f4f7;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}

.channel-credential.is-ready {
  background: rgba(220, 252, 231, 0.9);
  color: #067647;
}

.channel-card__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.channel-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  padding-top: 4px;
}

.channel-card__caption {
  color: #667085;
  line-height: 1.7;
}

.channel-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 980px) {
  .channel-card__top,
  .channel-card__footer,
  .channel-card__credential-row {
    flex-direction: column;
    align-items: stretch;
  }

  .channel-card__status {
    align-items: flex-start;
    text-align: left;
  }

  .channel-card__metrics,
  .channel-card__details,
  .channel-card__summary {
    grid-template-columns: 1fr;
  }

  .channel-card__credential-tags {
    justify-content: flex-start;
  }
}
</style>
