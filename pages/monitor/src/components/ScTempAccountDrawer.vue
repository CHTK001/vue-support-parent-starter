<script setup lang="ts">
/**
 * 临时账号 —— 详情抽屉。
 *
 * 打开时拉取账号全量数据（号码、邮箱、既有短信 / 邮件），随后订阅 SSE 消息流，
 * 按账号 id 过滤增量：新短信 / 新邮件实时追加到对应 Tab 顶部。
 * 关闭抽屉自动取消订阅，避免泄漏。
 */
import { computed, ref, watch } from 'vue';
import { message } from '@repo/core';
import type { SseClient } from '@repo/utils';
import {
  getTempAccount,
  subscribeTempAccountStream,
  type TempAccountDetail,
  type TempSmsMessage,
  type TempEmailMessage,
} from '../api/tempAccount';
import { copyText } from '../utils/clipboard';

const props = defineProps<{
  /** 账号 id */
  accountId: string | null;
}>();

const emit = defineEmits<{
  /** 数据变化（如收到新消息），父列表刷新计数 */
  (e: 'changed'): void;
}>();

const visible = defineModel<boolean>({ default: false });

/** 账号详情 */
const detail = ref<TempAccountDetail | null>(null);
/** 加载中 */
const loading = ref(false);
/** 激活 Tab */
const activeTab = ref<'sms' | 'email'>('sms');
/** SSE 释放函数 */
let closeSse: SseClient | null = null;

/** 展示用号码文案 */
const phoneText = computed(() => detail.value?.phone?.phone || '-');
/** 展示用邮箱文案 */
const emailText = computed(() => detail.value?.email || '-');

/** 是否有短信 / 邮件通道 */
const hasSms = computed(() => !!detail.value?.phone);
const hasEmail = computed(() => !!detail.value?.email);

/** ReTab 档位 */
const tabs = computed(() => [
  { name: 'sms', label: `短信 (${detail.value?.smsMessages?.length ?? detail.value?.smsCount ?? 0})`, icon: 'Message' },
  { name: 'email', label: `邮件 (${detail.value?.emails?.length ?? detail.value?.emailCount ?? 0})`, icon: 'MessageFilled' },
]);

/** 加载账号全量数据（打开抽屉时拉一次） */
async function load() {
  if (!props.accountId) return;
  loading.value = true;
  try {
    detail.value = await getTempAccount(props.accountId);
  } catch (e) {
    message.error(reasonText(e));
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

/** 订阅 SSE：仅处理本账号的增量新消息 */
function initSse() {
  closeSse = subscribeTempAccountStream({
    onMessage: ({ id, sms, emails }) => {
      if (id !== props.accountId) return;
      let changed = false;
      if (sms?.length && detail.value) {
        detail.value.smsMessages = [...sms, ...(detail.value.smsMessages ?? [])];
        detail.value.smsCount = (detail.value.smsCount ?? 0) + sms.length;
        changed = true;
      }
      if (emails?.length && detail.value) {
        detail.value.emails = [...emails, ...(detail.value.emails ?? [])];
        detail.value.emailCount = (detail.value.emailCount ?? 0) + emails.length;
        changed = true;
      }
      if (changed) {
        emit('changed');
        const hint = sms?.length ? `新短信 ${sms.length} 条` : '';
        const ehint = emails?.length ? `新邮件 ${emails.length} 封` : '';
        message.success([hint, ehint].filter(Boolean).join('、'));
      }
    },
    onError: () => {
      // 自动重连，静默
    },
  });
}

function reasonText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object' && 'msg' in e) {
    const msg = (e as { msg?: unknown }).msg;
    if (typeof msg === 'string' && msg) return msg;
  }
  return typeof e === 'string' && e ? e : '未知错误';
}

/** 格式时间 */
function fmtCreated(ts?: string) {
  if (!ts) return '-';
  return ts;
}

/** 展示短信内容（去换行） */
function smsText(s: TempSmsMessage) {
  return (s.content || '').replace(/\n+/g, ' ');
}

/** 复制文本，带提示 */
async function copyValue(text: string | null | undefined, label: string) {
  const ok = await copyText(text);
  if (ok) message.success(`${label}已复制`);
  else message.error('复制失败');
}

watch(visible, open => {
  if (open) {
    activeTab.value = 'sms';
    void load();
    initSse();
  } else {
    closeSse?.close();
    closeSse = null;
  }
});

watch(
  () => props.accountId,
  () => {
    if (visible.value) void load();
  },
);
</script>

<template>
  <ReDrawer
    v-model="visible"
    :title="`临时账号信息 - ${phoneText}`"
    :size="860"
    direction="rtl"
    close-only
    :footer-hidden="true"
  >
    <template #content>
      <ReSkeleton v-if="loading" :rows="6" :count="1" animated />
      <div v-else-if="detail" class="account-detail">
        <!-- 账号主体 -->
        <ReDescriptions :column="2" border>
          <ReDescriptionsItem label="虚拟号码">
            <span class="cell-copy">
              <span class="mono">{{ phoneText }}</span>
              <ReTag v-if="detail.phone?.countryName" type="info" class="ml-6">
                {{ detail.phone.countryName }}
              </ReTag>
              <ReButton
                class="copy-btn"
                icon="CopyDocument"
                layout="square"
                size="small"
                tip="复制号码"
                @click="copyValue(detail.phone?.phone, '号码')"
              />
            </span>
          </ReDescriptionsItem>
          <ReDescriptionsItem label="临时邮箱">
            <span class="cell-copy">
              <span class="mono" :title="emailText">{{ emailText }}</span>
              <ReButton
                class="copy-btn"
                icon="CopyDocument"
                layout="square"
                size="small"
                tip="复制邮箱"
                @click="copyValue(detail.email, '邮箱')"
              />
            </span>
          </ReDescriptionsItem>
          <ReDescriptionsItem label="短信源">{{ detail.smsProvider || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="邮件源">{{ detail.emailProvider || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="号码短信地址" :span="2">
            <span v-if="detail.phone?.smsUrl" class="cell-copy">
              <ReText type="primary" class="mono url-ellipsis" :title="detail.phone.smsUrl">
                {{ detail.phone.smsUrl }}
              </ReText>
              <ReButton
                class="copy-btn"
                icon="CopyDocument"
                layout="square"
                size="small"
                tip="复制短信地址"
                @click="copyValue(detail.phone?.smsUrl, '短信地址')"
              />
            </span>
            <span v-else class="dim">-</span>
          </ReDescriptionsItem>
        </ReDescriptions>

        <!-- 短信 / 邮件 实时信息 -->
        <ReTab v-model="activeTab" :tabs="tabs" stretch class="msg-tabs">
          <!-- 短信 -->
          <template #sms>
            <div v-if="!hasSms" class="tab-empty">该账号无虚拟号码通道</div>
            <div v-else-if="!detail.smsMessages?.length" class="tab-empty">
              暂无短信 —— 注册第三方服务后，验证码短信会实时出现在这里
            </div>
            <div v-else class="msg-list">
              <div v-for="(s, i) in detail.smsMessages" :key="i" class="msg-item">
                <div class="msg-head">
                  <ReTag type="primary" size="small">{{ s.from || '未知' }}</ReTag>
                  <span class="dim msg-time">{{ s.time || '-' }}</span>
                </div>
                <div class="msg-body" :title="s.content">{{ smsText(s) }}</div>
                <div class="msg-actions">
                  <ReButton icon="CopyDocument" layout="square" size="small" tip="复制短信内容" @click.stop="copyValue(s.content, '短信内容')" />
                </div>
                <div v-if="s.verifyCode" class="msg-code">
                  验证码: <ReText type="danger" class="code">{{ s.verifyCode }}</ReText>
                  <ReButton
                    class="copy-btn"
                    icon="CopyDocument"
                    layout="square"
                    size="small"
                    tip="复制验证码"
                    @click.stop="copyValue(s.verifyCode, '验证码')"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- 邮件 -->
          <template #email>
            <div v-if="!hasEmail" class="tab-empty">该账号无临时邮箱通道</div>
            <div v-else-if="!detail.emails?.length" class="tab-empty">
              暂无邮件 —— 注册第三方服务后，验证码邮件会实时出现在这里
            </div>
            <div v-else class="msg-list">
              <div v-for="(e, i) in detail.emails" :key="i" class="msg-item">
                <div class="msg-head">
                  <ReTag type="warning" size="small">{{ e.from || '未知' }}</ReTag>
                  <span class="dim msg-time">{{ fmtCreated(e.createdAt) }}</span>
                </div>
                <div class="msg-subject">{{ e.subject || '(无主题)' }}</div>
                <div class="msg-body" :title="e.body">{{ (e.body || '').replace(/\n+/g, ' ') }}</div>
                <div class="msg-actions">
                  <ReButton icon="CopyDocument" layout="square" size="small" tip="复制邮件内容" @click.stop="copyValue([e.subject || '', e.body || ''].filter(Boolean).join('\n'), '邮件内容')" />
                </div>
              </div>
            </div>
          </template>
        </ReTab>
      </div>
      <div v-else class="tab-empty">账号不存在或已删除</div>
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
.account-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.ml-6 { margin-left: 6px; }
.mono { font-family: ui-monospace, monospace; }
.url-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 复制按钮组 */
.cell-copy { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; min-width: 0; }
.cell-copy .mono { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.cell-copy .url-ellipsis { flex: 0 1 auto; }
.copy-btn { flex-shrink: 0; }
.msg-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}
.msg-actions .el-button { padding: 4px; height: 24px; }

.msg-tabs {
  flex: 1 1 0;
  min-height: 0;
}

.tab-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 4px 2px;
  max-height: 100%;
}

.msg-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 8px);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--el-bg-color-page) 40%, var(--el-bg-color));
  transition: border-color 0.2s ease;
  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 35%, var(--el-border-color));
  }
}

.msg-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.msg-time { font-size: 12px; margin-left: auto; white-space: nowrap; }

.msg-subject {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  font-size: 13px;
}

.msg-body {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  word-break: break-all;
}

.msg-code {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.msg-code .code {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  font-family: ui-monospace, monospace;
}
</style>