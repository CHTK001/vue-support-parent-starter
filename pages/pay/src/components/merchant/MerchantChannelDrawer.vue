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
        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>支付方式列表</h3>
              <p>{{ channels.length }} 个支付方式，按类型和子类型区分不同的支付场景。</p>
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
                <header class="channel-card__banner">
                  <div class="channel-card__banner-brand">
                    <span class="channel-card__banner-icon">{{ row.channelType?.charAt(0).toUpperCase() }}</span>
                    <div class="channel-card__banner-info">
                      <strong class="channel-card__banner-name">{{ resolveChannelDisplayName(row) }}</strong>
                      <span class="channel-card__banner-sub">
                        {{ formatChannelSubType(row.channelType, row.channelSubType) }}
                        <template v-if="showChannelAlias(row)"> · 别名 {{ row.channelName }}</template>
                      </span>
                    </div>
                  </div>
                  <div class="channel-card__banner-meta">
                    <el-tag :type="channelStatusTag(row)" effect="dark" size="small">{{ formatChannelStatus(row) }}</el-tag>
                    <span class="channel-card__banner-mode">{{ resolveChannelMode(row) }}</span>
                  </div>
                </header>

                <div class="channel-card__body">
                  <div class="channel-card__metrics">
                    <div class="channel-card__metric">
                      <span class="channel-card__metric-label">凭证完整度</span>
                      <strong class="channel-card__metric-value">{{ resolveCredentialSummary(row) }}</strong>
                    </div>
                    <div class="channel-card__metric">
                      <span class="channel-card__metric-label">支付场景</span>
                      <strong class="channel-card__metric-value">{{ formatChannelSubType(row.channelType, row.channelSubType) }}</strong>
                    </div>
                    <div class="channel-card__metric">
                      <span class="channel-card__metric-label">更新时间</span>
                      <strong class="channel-card__metric-value">{{ row.updatedAt || row.createdAt || '-' }}</strong>
                    </div>
                  </div>

                  <div class="channel-card__creds">
                    <span class="channel-card__creds-label">凭证状态</span>
                    <div class="channel-card__creds-badges">
                      <span class="channel-creds-badge" :class="{ 'is-set': row.apiKeyConfigured }">API Key</span>
                      <span class="channel-creds-badge" :class="{ 'is-set': row.privateKeyConfigured }">私钥</span>
                      <span class="channel-creds-badge" :class="{ 'is-set': row.publicKeyConfigured }">公钥</span>
                      <span class="channel-creds-badge" :class="{ 'is-set': row.certConfigured }">证书</span>
                    </div>
                  </div>

                  <section v-if="buildChannelSummary(row).length" class="channel-card__extras">
                    <div v-for="item in buildChannelSummary(row)" :key="`${row.id}-${item.label}`" class="channel-card__extra">
                      <span class="channel-card__extra-label">{{ item.label }}</span>
                      <span class="channel-card__extra-value">{{ item.value }}</span>
                    </div>
                  </section>
                </div>

                <footer class="channel-card__footer">
                  <p class="channel-card__caption">{{ describeChannelPurpose(row) }}</p>
                  <div class="channel-card__actions">
                    <el-tooltip content="编辑">
                      <ScButton link circle :icon="Edit" @click="emit('editChannel', row)" />
                    </el-tooltip>
                    <el-tooltip :content="isChannelEnabled(row) ? '禁用' : '启用'">
                      <ScButton
                        link circle
                        :type="isChannelEnabled(row) ? 'warning' : 'success'"
                        :icon="isChannelEnabled(row) ? SwitchButton : CircleCheck"
                        :disabled="isChannelDeleted(row)"
                        @click="emit('toggleChannel', row)"
                      />
                    </el-tooltip>
                    <el-tooltip content="删除">
                      <ScButton link circle type="danger" :icon="Delete" :disabled="isChannelDeleted(row)" @click="emit('deleteChannel', row)" />
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
import ScDrawer from "@repo/components/ScDrawer";
import { computed, ref } from "vue";
import { Plus, Edit, Delete, SwitchButton, CircleCheck } from "@element-plus/icons-vue";
import type { Merchant, MerchantChannel } from "../../types/payment";
import {
  buildChannelSummary,
  channelStatusTag,
  describeChannelPurpose,
  formatChannelStatus,
  formatChannelSubType,
  isChannelDeleted,
  isChannelEnabled,
  resolveChannelDisplayName,
  resolveChannelMode,
  resolveChannelTone,
  resolveCredentialSummary,
  showChannelAlias,
  wrapCardData,
} from "./merchant";

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

/* ── Card Root ── */

.channel-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 16px;
  border: 1px solid #e6edf2;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.channel-card:hover {
  border-color: #d0d9e0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

/* ── Channel Tone ── */

.channel-card--wechat { --channel-accent: #07c160; --channel-bg-from: #e6f7ee; --channel-bg-to: #f0faf4; }
.channel-card--alipay { --channel-accent: #1677ff; --channel-bg-from: #e6f0ff; --channel-bg-to: #f0f5ff; }
.channel-card--epay { --channel-accent: #7c3aed; --channel-bg-from: #f0eaff; --channel-bg-to: #f7f4ff; }
.channel-card--wallet { --channel-accent: #c2410c; --channel-bg-from: #fef2e8; --channel-bg-to: #fff8f2; }
.channel-card--default { --channel-accent: #64748b; --channel-bg-from: #f1f5f9; --channel-bg-to: #f8fafc; }

.channel-card--inactive {
  opacity: 0.82;
}

.channel-card--deleted {
  border-color: #fecaca;
  background: #fef2f2;
}

/* ── Banner ── */

.channel-card__banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, var(--channel-bg-from), var(--channel-bg-to));
  border-bottom: 1px solid #eef2f6;
}

.channel-card__banner-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.channel-card__banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--channel-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.channel-card__banner-info {
  min-width: 0;
}

.channel-card__banner-name {
  display: block;
  font-size: 14px;
  color: #0f172a;
  line-height: 1.3;
}

.channel-card__banner-sub {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.4;
}

.channel-card__banner-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.channel-card__banner-mode {
  font-size: 11.5px;
  color: #94a3b8;
}

/* ── Body ── */

.channel-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px 8px;
}

/* Metrics */

.channel-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.channel-card__metric {
  padding: 6px 8px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #eef2f6;
}

.channel-card__metric-label {
  display: block;
  margin-bottom: 2px;
  font-size: 10px;
  color: #94a3b8;
}

.channel-card__metric-value {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

/* Credentials */

.channel-card__creds {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #fafbfc;
  border: 1px dashed #dde3e9;
}

.channel-card__creds-label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #344054;
}

.channel-card__creds-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.channel-creds-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f1f4f7;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 600;
  transition: all 0.15s;
}

.channel-creds-badge.is-set {
  background: #dcfce7;
  color: #067647;
}

/* Extras */

.channel-card__extras {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.channel-card__extra {
  padding: 6px 8px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #eef2f6;
}

.channel-card__extra-label {
  display: block;
  margin-bottom: 3px;
  font-size: 10px;
  color: #94a3b8;
}

.channel-card__extra-value {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  word-break: break-all;
}

/* ── Footer ── */

.channel-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 14px;
  border-top: 1px solid #eef2f6;
  background: #fafbfc;
  margin-top: auto;
}

.channel-card__caption {
  margin: 0;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.5;
}

.channel-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.channel-card__actions .el-button {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.channel-card:hover .channel-card__actions .el-button {
  opacity: 1;
}

/* ── Responsive ── */

@media (max-width: 980px) {
  .channel-card__banner {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .channel-card__banner-brand {
    justify-content: center;
  }

  .channel-card__banner-meta {
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  .channel-card__footer {
    flex-direction: column;
    text-align: center;
  }

  .channel-card__metrics,
  .channel-card__extras {
    grid-template-columns: 1fr;
  }

  .channel-card__creds {
    flex-direction: column;
    align-items: stretch;
  }

  .channel-card__creds-badges {
    justify-content: center;
  }
}
</style>
