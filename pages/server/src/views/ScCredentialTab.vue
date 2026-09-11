<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { message } from '@repo/core';
import { getKeys, saveKey, delKey, getIdentities, saveIdentity, delIdentity, generateKeyPair, listMailbox, getMailboxMessage } from '../api';

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
  return 'primary';
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
</script>

<template>
  <div class="credential-tab sc-page">
    <ReRow :gutter="16">
      <!-- SSH 密钥库 -->
      <ReCol :span="12">
        <div class="panel">
          <ReSectionHead title="SSH 密钥库">
            <template #actions>
              <ReButton show-text icon="Key" size="small" @click="openGenForm()">生成密钥</ReButton>
              <ReButton show-text icon="Plus" type="primary" size="small" @click="openKeyForm()">新增密钥</ReButton>
            </template>
          </ReSectionHead>
          <ReTable :data="keys" size="small" border :pagination="false" :toolbar="false" empty-text="暂无密钥，点击右上角「新增密钥」或「生成密钥」">
            <ReTableColumn prop="msServerKeyName" label="名称" min-width="120" />
            <ReTableColumn prop="msServerKeyType" label="类型" width="90">
              <template #default="{ row }">
                <ReTag size="small" type="info">{{ row.msServerKeyType || '-' }}</ReTag>
              </template>
            </ReTableColumn>
            <ReTableColumn label="操作" width="130">
              <template #default="{ row }">
                <ReButton link size="small" @click="openKeyForm(row)">编辑</ReButton>
                <ReButton link type="danger" size="small" @click="deleteKey(row)">删除</ReButton>
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
              <ReButton show-text icon="Plus" type="primary" size="small" @click="openIdentityForm()">新增身份</ReButton>
            </template>
          </ReSectionHead>
          <ReTable :data="identities" size="small" border :pagination="false" :toolbar="false" empty-text="暂无身份，点击右上角「新增身份」创建">
            <ReTableColumn prop="msServerIdentityName" label="名称" min-width="110" />
            <ReTableColumn prop="msServerIdentityUsername" label="用户名" width="100" />
            <ReTableColumn prop="msServerIdentityAuthType" label="认证" width="120">
              <template #default="{ row }">
                <ReTag size="small" :type="authTypeTagType(row.msServerIdentityAuthType)">
                  {{ authTypeLabel(row.msServerIdentityAuthType) }}
                </ReTag>
                <span v-if="row.msServerIdentityAuthType && !authTypeOptions.some(o => o.value === row.msServerIdentityAuthType)" class="type-raw">{{ row.msServerIdentityAuthType }}</span>
              </template>
            </ReTableColumn>
            <ReTableColumn label="操作" width="130">
              <template #default="{ row }">
                <ReButton link size="small" @click="openIdentityForm(row)">编辑</ReButton>
                <ReButton link type="danger" size="small" @click="deleteIdentity(row)">删除</ReButton>
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
          <ReSelect v-model="identityForm.msServerIdentityAuthType" style="width:100%" filterable allow-create default-first-option placeholder="选择或输入类型" :options="authTypeOptions" />
        </ReFormItem>
        <ReFormItem label="用户名">
          <ReInput v-model="identityForm.msServerIdentityUsername" />
        </ReFormItem>
        <ReFormItem v-if="identityForm.msServerIdentityAuthType === 'PASSWORD'" label="密码">
          <ReInput
            v-model="identityForm.msServerIdentityPassword"
            type="password"
            show-password
            :placeholder="editingIdentityId ? '留空保持不变' : '登录密码'"
          />
        </ReFormItem>
        <ReFormItem v-else label="引用密钥">
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
  color: var(--text-tertiary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
</style>