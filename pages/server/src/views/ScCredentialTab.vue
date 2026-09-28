<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { message } from '@repo/core';
import { getKeys, saveKey, delKey, getIdentities, saveIdentity, delIdentity, generateKeyPair, listMailbox, getMailboxMessage, createTempEmail, registerMailbox, unregisterMailbox } from '../api';

/** SSH 密钥（脱敏返回：无私钥/口令字段） */
interface KeyRow {
  id: number;
  msServerKeyName: string;
  msServerKeyType?: string;
  msServerKeyPublicKey?: string;
}

/** 登录身份（脱敏返回） */
interface IdentityRow {
  id: number;
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityKeyId?: number | null;
  msServerIdentityEmailSource?: string | null;
  msServerIdentityProvider?: string | null;
  msServerIdentityImapHost?: string | null;
  msServerIdentityImapPort?: number | null;
}

/** 密钥与身份数据 */
const keys = ref<KeyRow[]>([]);
const identities = ref<IdentityRow[]>([]);

/** 密钥表单对话框 */
const keyFormVisible = ref(false);
const editingKeyId = ref<number | null>(null);
const keyForm = ref({ msServerKeyName: '', msServerKeyType: 'RSA', msServerKeyPublicKey: '', msServerKeyPrivateKey: '', msServerKeyPassword: '' });

/** 身份表单对话框 */
const identityFormVisible = ref(false);
const editingIdentityId = ref<number | null>(null);
const identityForm = ref({
  msServerIdentityName: '',
  msServerIdentityAuthType: 'PASSWORD',
  msServerIdentityUsername: 'root',
  msServerIdentityPassword: '',
  msServerIdentityKeyId: null as number | null,
  msServerIdentityEmailSource: 'IMAP',
  msServerIdentityProvider: '',
  msServerIdentityImapHost: '',
  msServerIdentityImapPort: null as number | null,
});

/** 生成密钥对话框 */
const genFormVisible = ref(false);
const genForm = ref({ name: '', type: 'RSA', password: '', remark: '' });
const genResult = ref<{ publicKey: string; privateKey: string } | null>(null);
const genLoading = ref(false);

/** 密钥类型选项 */
const keyTypeOptions = [
  { value: 'RSA', label: 'RSA' },
  { value: 'ED25519', label: 'ED25519' },
  { value: 'ECDSA', label: 'ECDSA' },
];

const keyGenTypeOptions = [
  { value: 'RSA', label: 'RSA (4096位)' },
  { value: 'ED25519', label: 'ED25519' },
  { value: 'ECDSA', label: 'ECDSA (256位)' },
];

/** 账号认证类型选项（分组）；主机登录方式 + 通用账号类型，支持下拉选择与手动输入 */
const authTypeOptions = [
  { value: 'PASSWORD', label: '密码登录', group: '主机' },
  { value: 'PUBLIC_KEY', label: '公钥登录', group: '主机' },
  { value: 'MAILBOX', label: '邮箱账号', group: '通用' },
  { value: 'TOKEN', label: 'Token', group: '通用' },
  { value: 'API_KEY', label: 'API Key', group: '通用' },
  { value: 'OAUTH2', label: 'OAuth 2.0', group: '通用' },
  { value: 'COOKIE', label: 'Cookie', group: '通用' },
  { value: 'ACCOUNT', label: '账号密码', group: '通用' },
];

/** 认证类型展示名（未知类型显示原值） */
function authTypeLabel(v: string): string {
  if (!v) return '-';
  const hit = authTypeOptions.find(o => o.value === v);
  return hit ? hit.label : v;
}
function authTypeTagType(v: string): 'success' | 'info' | 'warning' | 'primary' {
  if (v === 'PUBLIC_KEY') return 'warning';
  if (v === 'PASSWORD') return 'info';
  if (v === 'MAILBOX') return 'success';
  return 'primary';
}

/** 临时邮箱服务商选项 */
const tempProviderOptions = [
  { value: 'fce', label: 'FreeCustom.Email (FCE)' },
  { value: 'mailtm', label: 'Mail.tm' },
  { value: 'luckmail', label: 'LuckMail' },
  { value: 'mailnest', label: 'MailNest' },
];

/** 创建临时邮箱加载状态 */
const tempEmailLoading = ref(false);

/** 认证类型变化时重置邮箱来源 */
function onAuthTypeChange(): void {
  if (identityForm.value.msServerIdentityAuthType === 'MAILBOX') {
    if (!identityForm.value.msServerIdentityEmailSource) {
      identityForm.value.msServerIdentityEmailSource = 'IMAP';
    }
  } else {
    identityForm.value.msServerIdentityEmailSource = 'IMAP';
    identityForm.value.msServerIdentityProvider = '';
    identityForm.value.msServerIdentityImapHost = '';
    identityForm.value.msServerIdentityImapPort = null;
  }
}

/**
 * 创建临时邮箱地址(调后端 API → 服务商生成)
 */
async function handleCreateTempEmail(): Promise<void> {
  const provider = identityForm.value.msServerIdentityProvider;
  if (!provider) {
    message.warning('请先选择临时邮箱服务商');
    return;
  }
  tempEmailLoading.value = true;
  try {
    const result = await createTempEmail(provider);
    identityForm.value.msServerIdentityUsername = result.email || '';
    message.success('临时邮箱创建成功: ' + (result.email || ''));
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    tempEmailLoading.value = false;
  }
}


/** 可引用密钥选项 */
const keyRefOptions = ref<Array<{ label: string; value: number }>>([]);

async function openGenForm() {
  genForm.value = { name: '', type: 'RSA', password: '', remark: '' };
  genResult.value = null;
  genFormVisible.value = true;
}

async function doGenerate() {
  if (!genForm.value.name.trim()) {
    message.warning('密钥名称不能为空');
    return;
  }
  genLoading.value = true;
  try {
    genResult.value = await generateKeyPair(genForm.value.name, genForm.value.type, genForm.value.password || undefined, genForm.value.remark || undefined);
    message.success('密钥已生成并保存');
    refresh();
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    genLoading.value = false;
  }
}

onMounted(refresh);

/**
 * 刷新密钥与身份列表
 */
async function refresh(): Promise<void> {
  try {
    const [keyList, identityList] = await Promise.all([getKeys(), getIdentities()]);
    keys.value = keyList ?? [];
    identities.value = identityList ?? [];
    keyRefOptions.value = (keyList ?? []).map(k => ({ label: k.msServerKeyName, value: k.id }));
  } catch (e) {
    message.error((e as Error).message);
  }
}

/**
 * 打开密钥表单
 *
 * @param row 编辑中的密钥，null 表示新增
 */
function openKeyForm(row?: KeyRow): void {
  editingKeyId.value = row?.id ?? null;
  keyForm.value = {
    msServerKeyName: row?.msServerKeyName ?? '',
    msServerKeyType: row?.msServerKeyType ?? 'RSA',
    msServerKeyPublicKey: row?.msServerKeyPublicKey ?? '',
    // 编辑时私钥/口令留空表示"保持不变"
    msServerKeyPrivateKey: '',
    msServerKeyPassword: '',
  };
  keyFormVisible.value = true;
}

/**
 * 提交密钥表单
 */
async function submitKey(): Promise<void> {
  if (!keyForm.value.msServerKeyName.trim()) {
    message.warning('名称不能为空');
    return;
  }
  try {
    await saveKey(editingKeyId.value, { ...keyForm.value });
    message.success('已保存');
    keyFormVisible.value = false;
    refresh();
  } catch (e) {
    message.error((e as Error).message);
  }
}

/**
 * 删除密钥
 *
 * @param row 密钥
 */
async function deleteKey(row: KeyRow): Promise<void> {
  await message.confirm(`确认删除密钥 ${row.msServerKeyName}?`, '删除');
  await delKey(row.id);
  message.success('已删除');
  refresh();
}

/**
 * 打开身份表单
 *
 * @param row 编辑中的身份，null 表示新增
 */
function openIdentityForm(row?: IdentityRow): void {
  editingIdentityId.value = row?.id ?? null;
  identityForm.value = {
    msServerIdentityName: row?.msServerIdentityName ?? '',
    msServerIdentityAuthType: row?.msServerIdentityAuthType ?? 'PASSWORD',
    msServerIdentityUsername: row?.msServerIdentityUsername ?? 'root',
    msServerIdentityPassword: '',
    msServerIdentityKeyId: row?.msServerIdentityKeyId ?? null,
    msServerIdentityEmailSource: row?.msServerIdentityEmailSource ?? 'IMAP',
    msServerIdentityProvider: row?.msServerIdentityProvider ?? '',
    msServerIdentityImapHost: row?.msServerIdentityImapHost ?? '',
    msServerIdentityImapPort: row?.msServerIdentityImapPort ?? null,
  };
  identityFormVisible.value = true;
}

/**
 * 提交身份表单
 */
async function submitIdentity(): Promise<void> {
  if (!identityForm.value.msServerIdentityName.trim()) {
    message.warning('名称不能为空');
    return;
  }
  try {
    await saveIdentity(editingIdentityId.value, { ...identityForm.value });
    message.success('已保存');
    identityFormVisible.value = false;
    refresh();
  } catch (e) {
    message.error((e as Error).message);
  }
}

/**
 * 删除身份
 *
 * @param row 身份
 */
async function deleteIdentity(row: IdentityRow): Promise<void> {
  await message.confirm(`确认删除身份 ${row.msServerIdentityName}?`, '删除');
  await delIdentity(row.id);
  message.success('已删除');
  refresh();
}

// ===== 邮箱账号信箱 (MAILBOX 身份, IMAP) =====
/** 邮件箱对话框可见性 */
const mailboxDialogVisible = ref(false);
/** 当前查看的邮箱身份 ID */
const mailboxIdentityId = ref<number | null>(null);
/** 邮件箱加载状态 */
const mailboxLoading = ref(false);
/** 邮件列表 */
const mailboxEmails = ref<any[]>([]);
/** 当前文件夹 */
const mailboxFolder = ref('INBOX');
/** 每页条数 */
const mailboxLimit = ref(20);
/** 当前查看的邮件详情 */
const selectedEmail = ref<any>(null);
/** 邮件详情加载状态 */
const mailboxDetailLoading = ref(false);
/** SSE 连接 clientId */
const mailboxClientId = ref<string>('');
/** SSE EventSource 实例 */
const mailboxEventSource = ref<EventSource | null>(null);
/** SSE 连接状态(connecting/connected/closed) */
const mailboxSseStatus = ref<string>('closed');
/** SSE 推送的新邮件计数(未读红点) */
const mailboxNewEmailCount = ref(0);

/**
 * 打开邮件箱对话框(建立 SSE 实时推送连接)
 *
 * @param row 邮箱身份行
 */
async function openMailbox(row: IdentityRow): Promise<void> {
  mailboxIdentityId.value = row.id;
  mailboxFolder.value = 'INBOX';
  mailboxLimit.value = 20;
  selectedEmail.value = null;
  mailboxNewEmailCount.value = 0;
  mailboxDialogVisible.value = true;
  await loadMailboxList();
  connectMailboxSse(row.id);
}

/**
 * 建立邮箱 SSE 连接(实时推送新邮件)
 *
 * @param identityId 邮箱身份 ID
 */
function connectMailboxSse(identityId: number): void {
  disconnectMailboxSse();
  const clientId = 'mailbox-' + identityId + '-' + Date.now();
  mailboxClientId.value = clientId;
  mailboxSseStatus.value = 'connecting';
  const es = new EventSource('/sse/connect?clientId=' + encodeURIComponent(clientId));
  mailboxEventSource.value = es;
  es.addEventListener('connected', () => {
    mailboxSseStatus.value = 'connected';
    registerMailbox(identityId, clientId).catch(() => {});
  });
  es.addEventListener('mailbox', (evt: MessageEvent) => {
    try {
      const emails = JSON.parse(evt.data || '[]');
      if (Array.isArray(emails) && emails.length > 0) {
        const list = mailboxEmails.value;
        mailboxEmails.value = [...emails, ...list].slice(0, 100);
        mailboxNewEmailCount.value += emails.length;
        message.info('收到 ' + emails.length + ' 封新邮件');
      }
    } catch { /* 忽略解析异常 */ }
  });
  es.onerror = () => {
    mailboxSseStatus.value = 'closed';
  };
}

/**
 * 邮件箱对话框关闭回调(断开 SSE)
 */
function onMailboxDialogClosed(): void {
  selectedEmail.value = null;
  mailboxNewEmailCount.value = 0;
  disconnectMailboxSse();
}

/**
 * 断开邮箱 SSE 连接
 */
function disconnectMailboxSse(): void {
  if (mailboxEventSource.value) {
    mailboxEventSource.value.close();
    mailboxEventSource.value = null;
  }
  if (mailboxClientId.value) {
    unregisterMailbox(mailboxClientId.value).catch(() => {});
  }
  mailboxClientId.value = '';
  mailboxSseStatus.value = 'closed';
}

/**
 * 加载收件箱列表
 */
async function loadMailboxList(): Promise<void> {
  if (mailboxIdentityId.value == null) {
    return;
  }
  mailboxLoading.value = true;
  try {
    const list = await listMailbox(mailboxIdentityId.value, mailboxFolder.value, mailboxLimit.value);
    mailboxEmails.value = (list ?? []) as any[];
    selectedEmail.value = null;
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    mailboxLoading.value = false;
  }
}

/**
 * 查看单封邮件正文
 *
 * @param email 列表中的邮件
 */
async function viewMessage(email: any): Promise<void> {
  if (mailboxIdentityId.value == null) {
    return;
  }
  mailboxDetailLoading.value = true;
  try {
    const detail = await getMailboxMessage(mailboxIdentityId.value, mailboxFolder.value, email.subject);
    selectedEmail.value = detail ?? email;
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    mailboxDetailLoading.value = false;
  }
}
</script>

<template>
  <div class="credential-tab sc-page">
    <ReRow :gutter="16">
      <!-- SSH 密钥库 -->
      <ReCol :span="12">
        <div class="panel">
          <ReSectionHead title="SSH 密钥库">
            <template #actions>
              <ReButton show-text icon="Key" @click="openGenForm()">生成密钥</ReButton>
              <ReButton show-text icon="Plus" type="primary" @click="openKeyForm()">新增密钥</ReButton>
            </template>
          </ReSectionHead>
          <ReTable :data="keys" border :pagination="false" :toolbar="false" empty-text="暂无密钥，点击右上角「新增密钥」或「生成密钥」">
            <ReTableColumn prop="msServerKeyName" label="名称" min-width="120" />
            <ReTableColumn prop="msServerKeyType" label="类型" width="90">
              <template #default="{ row }">
                <ReTag type="info">{{ row.msServerKeyType || '-' }}</ReTag>
              </template>
            </ReTableColumn>
            <ReTableColumn label="操作" width="130">
              <template #default="{ row }">
                <ReButton link @click="openKeyForm(row)">编辑</ReButton>
                <ReButton link type="danger" @click="deleteKey(row)">删除</ReButton>
              </template>
            </ReTableColumn>
          </ReTable>
        </div>
      </ReCol>

      <!-- 登录身份 -->
      <ReCol :span="12">
        <div class="panel">
          <ReSectionHead title="登录身份">
            <template #actions>
              <ReButton show-text icon="Plus" type="primary" @click="openIdentityForm()">新增身份</ReButton>
            </template>
          </ReSectionHead>
          <ReTable :data="identities" border :pagination="false" :toolbar="false" empty-text="暂无身份，点击右上角「新增身份」创建">
            <ReTableColumn prop="msServerIdentityName" label="名称" min-width="110" />
            <ReTableColumn prop="msServerIdentityUsername" label="用户名" width="100" />
            <ReTableColumn prop="msServerIdentityAuthType" label="认证" width="120">
              <template #default="{ row }">
                <ReTag :type="authTypeTagType(row.msServerIdentityAuthType)">
                  {{ authTypeLabel(row.msServerIdentityAuthType) }}
                </ReTag>
                <span v-if="row.msServerIdentityAuthType && !authTypeOptions.some(o => o.value === row.msServerIdentityAuthType)" class="type-raw">{{ row.msServerIdentityAuthType }}</span>
              </template>
            </ReTableColumn>
            <ReTableColumn label="操作" width="190">
              <template #default="{ row }">
                <ReButton v-if="row.msServerIdentityAuthType === 'MAILBOX'" link type="primary" @click="openMailbox(row)">打开邮件箱</ReButton>
                <ReButton link @click="openIdentityForm(row)">编辑</ReButton>
                <ReButton link type="danger" @click="deleteIdentity(row)">删除</ReButton>
              </template>
            </ReTableColumn>
          </ReTable>
        </div>
      </ReCol>
    </ReRow>

    <!-- 密钥表单 -->
    <ReDialog v-model="keyFormVisible" :title="editingKeyId ? '编辑密钥' : '新增密钥'" width="560" :height="420" confirm-text="保存" cancel-text="取消" @confirm="submitKey" @cancel="keyFormVisible = false">
      <ReForm label-width="80px" label-position="right">
        <ReFormItem label="名称" required>
          <ReInput v-model="keyForm.msServerKeyName" placeholder="如 ubuntu-prod-key" />
        </ReFormItem>
        <ReFormItem label="类型">
          <ReSelect v-model="keyForm.msServerKeyType" :data="keyTypeOptions" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="公钥">
          <ReInput v-model="keyForm.msServerKeyPublicKey" type="textarea" :rows="3" placeholder="ssh-rsa AAAA..." />
        </ReFormItem>
        <ReFormItem label="私钥">
          <ReInput
            v-model="keyForm.msServerKeyPrivateKey"
            type="textarea"
            :rows="5"
            :placeholder="editingKeyId ? '留空保持不变；粘贴 PEM 私钥内容以更新' : '-----BEGIN OPENSSH PRIVATE KEY-----'"
          />
        </ReFormItem>
        <ReFormItem label="口令">
          <ReInput v-model="keyForm.msServerKeyPassword" type="password" show-password placeholder="私钥口令，可空" />
        </ReFormItem>
      </ReForm>
    </ReDialog>

    <!-- 身份表单 -->
    <ReDialog v-model="identityFormVisible" :title="editingIdentityId ? '编辑身份' : '新增身份'" width="520" :height="380" confirm-text="保存" cancel-text="取消" @confirm="submitIdentity" @cancel="identityFormVisible = false">
      <ReForm label-width="80px" label-position="right">
        <ReFormItem label="名称" required>
          <ReInput v-model="identityForm.msServerIdentityName" placeholder="如 root@prod" />
        </ReFormItem>
        <ReFormItem label="认证类型">
          <ReSelect v-model="identityForm.msServerIdentityAuthType" style="width:100%" filterable allow-create default-first-option placeholder="选择或输入类型" :options="authTypeOptions" @change="onAuthTypeChange()" />
        </ReFormItem>
        <ReFormItem v-if="identityForm.msServerIdentityAuthType === 'MAILBOX'" label="邮箱来源">
          <ReRadioGroup v-model="identityForm.msServerIdentityEmailSource" button capsule>
            <ReRadioButton value="IMAP">真实邮箱(IMAP)</ReRadioButton>
            <ReRadioButton value="TEMP">临时邮箱(API)</ReRadioButton>
          </ReRadioGroup>
        </ReFormItem>
        <ReFormItem label="用户名">
          <div v-if="identityForm.msServerIdentityAuthType === 'MAILBOX' && identityForm.msServerIdentityEmailSource === 'TEMP'" class="temp-email-row">
            <ReInput v-model="identityForm.msServerIdentityUsername" placeholder="点击右侧按钮创建临时邮箱地址" />
            <ReButton type="primary" :loading="tempEmailLoading" @click="handleCreateTempEmail()">创建临时邮箱</ReButton>
          </div>
          <ReInput v-else v-model="identityForm.msServerIdentityUsername" />
        </ReFormItem>
        <ReFormItem v-if="identityForm.msServerIdentityAuthType === 'MAILBOX' && identityForm.msServerIdentityEmailSource === 'TEMP'" label="服务商">
          <ReSelect v-model="identityForm.msServerIdentityProvider" :data="tempProviderOptions" style="width:100%" placeholder="临时邮箱服务商" />
        </ReFormItem>
        <ReFormItem v-if="identityForm.msServerIdentityAuthType === 'PASSWORD'" label="密码">
          <ReInput
            v-model="identityForm.msServerIdentityPassword"
            type="password"
            show-password
            :placeholder="editingIdentityId ? '留空保持不变' : '登录密码'"
          />
        </ReFormItem>
        <ReFormItem v-if="identityForm.msServerIdentityAuthType === 'MAILBOX' && identityForm.msServerIdentityEmailSource !== 'TEMP'" label="授权码">
          <ReInput
            v-model="identityForm.msServerIdentityPassword"
            type="password"
            show-password
            placeholder="邮箱 IMAP 授权码（非登录密码）"
          />
        </ReFormItem>
        <ReFormItem v-if="identityForm.msServerIdentityAuthType === 'MAILBOX' && identityForm.msServerIdentityEmailSource !== 'TEMP'" label="IMAP 服务器">
          <ReInput v-model="identityForm.msServerIdentityImapHost" placeholder="留空则按邮箱域名自动推断（如 imap.qq.com）" />
        </ReFormItem>
        <ReFormItem v-if="identityForm.msServerIdentityAuthType === 'MAILBOX' && identityForm.msServerIdentityEmailSource !== 'TEMP'" label="IMAP 端口">
          <ReInput v-model.number="identityForm.msServerIdentityImapPort" placeholder="默认 993" />
        </ReFormItem>
        <ReFormItem v-if="identityForm.msServerIdentityAuthType !== 'MAILBOX' && identityForm.msServerIdentityAuthType !== 'PASSWORD'" label="引用密钥">
          <ReSelect v-model="identityForm.msServerIdentityKeyId" :data="keyRefOptions" style="width: 100%" placeholder="选择密钥库条目" clearable />
        </ReFormItem>
      </ReForm>
    </ReDialog>

    <!-- 生成密钥对话框 -->
    <ReDialog v-model="genFormVisible" title="生成SSH密钥对" width="680" :height="520" :footer-hidden="true">
      <template v-if="!genResult">
        <ReForm label-width="80px" label-position="right">
          <ReFormItem label="名称" required>
            <ReInput v-model="genForm.name" placeholder="如 prod-key-2026" />
          </ReFormItem>
          <ReFormItem label="类型">
            <ReSelect v-model="genForm.type" :data="keyGenTypeOptions" style="width: 100%" />
          </ReFormItem>
          <ReFormItem label="口令">
            <ReInput v-model="genForm.password" type="password" show-password placeholder="私钥加密口令，可空" />
          </ReFormItem>
          <ReFormItem label="备注">
            <ReInput v-model="genForm.remark" type="textarea" :rows="2" placeholder="可选备注" />
          </ReFormItem>
        </ReForm>
      </template>
      <template v-else>
        <ReAlert title="密钥已生成并保存到密钥库" type="success" :closable="false" show-icon style="margin-bottom: 12px" />
        <ReForm label-width="80px" label-position="right">
          <ReFormItem label="公钥">
            <ReInput :model-value="genResult.publicKey" type="textarea" :rows="4" readonly />
          </ReFormItem>
          <ReFormItem label="私钥">
            <ReInput :model-value="genResult.privateKey" type="textarea" :rows="8" readonly />
          </ReFormItem>
        </ReForm>
      </template>
      <div style="text-align: right; margin-top: 8px">
        <ReButton v-if="!genResult" @click="genFormVisible = false">取消</ReButton>
        <ReButton v-if="!genResult" type="primary" @click="doGenerate" :loading="genLoading">生成</ReButton>
        <ReButton v-else @click="genFormVisible = false">关闭</ReButton>
      </div>
    </ReDialog>
  </div>

    <!-- 邮箱账号邮件箱对话框(SSE 实时推送) -->
    <ReDialog v-model="mailboxDialogVisible" title="邮箱收件箱" width="800" :height="560" :close-on-click-modal="false" :footer-hidden="true" @closed="onMailboxDialogClosed()">
      <div class="mailbox">
        <div class="mailbox-toolbar">
          <ReSelect v-model="mailboxFolder" :data="[{label:'收件箱',value:'INBOX'},{label:'已发送',value:'Sent'},{label:'草稿',value:'Drafts'}]" style="width:150px" @change="loadMailboxList()" />
          <ReInputNumber v-model="mailboxLimit" :min="5" :max="100" style="width:100px" />
          <ReButton :loading="mailboxLoading" @click="loadMailboxList()">刷新</ReButton>
          <span v-if="mailboxSseStatus === 'connected'" class="sse-status sse-connected">● SSE 实时推送中</span>
          <span v-else-if="mailboxSseStatus === 'connecting'" class="sse-status sse-connecting">● 连接中...</span>
          <span v-else class="sse-status sse-offline">● 离线</span>
          <span v-if="mailboxNewEmailCount > 0" class="sse-badge">{{ mailboxNewEmailCount }} 封新邮件</span>
        </div>
        <div v-if="selectedEmail" class="mailbox-detail">
          <div class="mailbox-detail-head">
            <strong>{{ selectedEmail.subject || '(无主题)' }}</strong>
            <span class="mailbox-detail-meta">发件人：{{ selectedEmail.from }} ｜ 日期：{{ selectedEmail.date }} ｜ 大小：{{ selectedEmail.size }} bytes</span>
            <ReButton link @click="selectedEmail = null; mailboxNewEmailCount = 0">返回列表</ReButton>
          </div>
          <ReLoading :loading="mailboxDetailLoading">
            <pre class="mailbox-content">{{ selectedEmail.content }}</pre>
          </ReLoading>
        </div>
        <ReLoading v-else :loading="mailboxLoading">
          <ReTable :data="mailboxEmails" border :pagination="false" empty-text="暂无邮件" @row-click="viewMessage">
            <ReTableColumn prop="subject" label="主题" min-width="200" />
            <ReTableColumn prop="from" label="发件人" min-width="160" />
            <ReTableColumn prop="date" label="日期" min-width="150" />
            <ReTableColumn prop="size" label="大小" width="80" />
          </ReTable>
        </ReLoading>
      </div>
    </ReDialog>
</template>

 <style scoped lang="scss">
.credential-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* 未知账号类型原值显示 */
.type-raw {
  margin-left: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.mailbox { display: flex; flex-direction: column; gap: 10px; }
.mailbox-toolbar { display: flex; align-items: center; gap: 8px; }
.mailbox-detail-head { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.mailbox-detail-meta { font-size: 12px; color: var(--el-text-color-secondary); }
.mailbox-content {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  max-height: 420px;
  overflow: auto;
  margin: 0;
}
.sse-status { font-size: 12px; margin-left: auto; }
.sse-connected { color: var(--el-color-success); }
.sse-connecting { color: var(--el-color-warning); }
.sse-offline { color: var(--el-text-color-secondary); }
.sse-badge { font-size: 12px; color: var(--el-color-white); background: var(--el-color-danger); /* 原为 10px，10px 距 8/12 等距，取 12px(lg) */ border-radius: var(--el-radius-lg, 12px); padding: 1px 8px; }
.temp-email-row { display: flex; gap: 8px; align-items: center; }
.temp-email-row > .re-input { flex: 1; }
</style>