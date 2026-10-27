<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { message } from '@repo/core';
import { detectHost, refreshHostPublicIp } from '../api';

/**
 * 主机编辑表单对话框
 * 新增与编辑共用；编辑模式下地址/端口可改，agentKey 只读展示。
 * 连接凭据支持三种类型：无 / 账号密码 / PEM 私钥，保存时后端自动创建身份并绑定。
 * 硬件规格、网络地址为后台探测结果（只读展示），由"硬件探测/刷新公网IP"按钮驱动。
 */

/** 对话框可见性（v-model） */
const visible = defineModel<boolean>({ required: true });

/** 表单提交事件：携带表单数据 */
const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void;
}>();

const props = defineProps<{
  /** 编辑中的主机（null 表示新增） */
  host: Record<string, any> | null;
}>();

/** 系统类型选项 */
const osTypeOptions = [
  { value: 'LINUX', label: 'Linux', icon: 'Monitor' },
  { value: 'WINDOWS', label: 'Windows', icon: 'Monitor' },
  { value: 'MACOS', label: 'macOS', icon: 'Monitor' },
];

/** 各系统默认端口 */
const PORT_BY_OS: Record<string, number> = {
  LINUX: 22,
  WINDOWS: 3389,
  MACOS: 22,
};

/** 认证类型选项 */
const authTypeOptions = [
  { value: 'password', label: '账号密码' },
  { value: 'key', label: 'PEM 私钥' },
  { value: 'none', label: '免密登录' },
];

/** 表单数据 */
const form = reactive({
  id: null as number | null,
  serverHostName: '',
  serverHostCode: '',
  serverHostAddress: '',
  serverHostPort: 22,
  serverHostOsType: 'LINUX',
  msServerGroupId: null as number | null,
  tags: [] as string[],
  tagsInput: '',
  serverHostDescription: '',
  authType: 'password' as 'password' | 'key' | 'none',
  serverHostAccount: '',
  serverHostPassword: '',
  serverHostPrivateKey: '',
  serverHostAgentKey: '',
  // 硬件规格 / 网络地址（后台探测结果，只读展示）
  serverHostCpuCores: null as number | null,
  serverHostMemoryMb: null as number | null,
  serverHostDiskGb: null as number | null,
  serverHostOsVersion: '',
  serverHostOsArch: '',
  serverHostPublicIp: '',
  serverHostPrivateIp: '',
});

/** 是否编辑模式 */
const isEdit = computed(() => props.host != null);

/** 探测 / 刷新加载态 */
const detecting = ref(false);
const refreshingIp = ref(false);

/** PEM 文件上传 loading */
const pemLoading = ref(false);

/** 标签建议 */
const tagSuggestions = ['生产', '测试', '核心', '边缘', 'Linux', 'Windows'];

// 打开时同步外部数据到表单
watch(
  () => [visible.value, props.host] as const,
  ([show]) => {
    if (!show) return;
    const src = props.host ?? {};
    form.id = src.id ?? null;
    form.serverHostName = src.serverHostName ?? '';
    form.serverHostCode = src.serverHostCode ?? '';
    form.serverHostAddress = src.serverHostAddress ?? '';
    form.serverHostPort = src.serverHostPort ?? 22;
    form.serverHostOsType = src.serverHostOsType ?? 'LINUX';
    form.msServerGroupId = src.msServerGroupId ?? null;
    form.tags = parseTags(src.serverHostTags);
    form.tagsInput = '';
    form.serverHostDescription = src.serverHostDescription ?? '';
    form.authType = 'password';
    form.serverHostAccount = '';
    form.serverHostPassword = '';
    form.serverHostPrivateKey = '';
    form.serverHostAgentKey = src.serverHostAgentKey ?? '';
    // 探测结果（只读展示）
    form.serverHostCpuCores = src.serverHostCpuCores ?? null;
    form.serverHostMemoryMb = src.serverHostMemoryMb ?? null;
    form.serverHostDiskGb = src.serverHostDiskGb ?? null;
    form.serverHostOsVersion = src.serverHostOsVersion ?? '';
    form.serverHostOsArch = src.serverHostOsArch ?? '';
    form.serverHostPublicIp = src.serverHostPublicIp ?? '';
    form.serverHostPrivateIp = src.serverHostPrivateIp ?? '';
  },
  { immediate: true },
);

/**
 * 系统类型变更时联动端口（仅未手动修改过端口时）
 */
function onOsTypeChange(type: string): void {
  const defPort = PORT_BY_OS[type] ?? 22;
  if (form.serverHostPort === 22 || form.serverHostPort === 3389 || form.serverHostPort === 5900) {
    form.serverHostPort = defPort;
  }
}

/**
 * 解析标签 JSON 字符串为数组
 */
function parseTags(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * 硬件探测：调用后端 SSH 采集并回填只读展示区
 */
async function onDetect(): Promise<void> {
  if (!form.id) {
    message.warning('请先保存主机后再探测');
    return;
  }
  detecting.value = true;
  try {
    const updated = await detectHost(form.id);
    form.serverHostCpuCores = updated?.serverHostCpuCores ?? form.serverHostCpuCores;
    form.serverHostMemoryMb = updated?.serverHostMemoryMb ?? form.serverHostMemoryMb;
    form.serverHostDiskGb = updated?.serverHostDiskGb ?? form.serverHostDiskGb;
    form.serverHostOsVersion = updated?.serverHostOsVersion ?? form.serverHostOsVersion;
    form.serverHostOsType = updated?.serverHostOsType ?? form.serverHostOsType;
    form.serverHostOsArch = updated?.serverHostOsArch ?? form.serverHostOsArch;
    form.serverHostPrivateIp = updated?.serverHostPrivateIp ?? form.serverHostPrivateIp;
    form.serverHostPublicIp = updated?.serverHostPublicIp ?? form.serverHostPublicIp;
    message.success('硬件探测成功，已回填');
  } catch (e) {
    message.error((e as Error).message || '硬件探测失败');
  } finally {
    detecting.value = false;
  }
}

/**
 * 公网 IP 刷新：调用后端探测出口 IP 并回填
 */
async function onRefreshPublicIp(): Promise<void> {
  if (!form.id) {
    message.warning('请先保存主机后再刷新公网 IP');
    return;
  }
  refreshingIp.value = true;
  try {
    const ip = await refreshHostPublicIp(form.id);
    form.serverHostPublicIp = ip;
    message.success(`公网 IP 已刷新：${ip}`);
  } catch (e) {
    message.error((e as Error).message || '公网 IP 刷新失败');
  } finally {
    refreshingIp.value = false;
  }
}

/**
 * 读取 PEM 私钥文件内容并回填
 */
async function onPemFileChange(file: any): Promise<void> {
  const raw = file?.raw ?? file;
  if (!raw) return;
  const ext = raw.name.split('.').pop()?.toLowerCase();
  if (!['pem', 'key', 'priv'].includes(ext ?? '')) {
    message.warning('仅支持 .pem / .key / .priv 格式');
    return;
  }
  pemLoading.value = true;
  try {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(raw);
    });
    form.serverHostPrivateKey = text.trim();
    message.success('私钥已导入');
  } catch (e) {
    message.error((e as Error).message || '私钥文件读取失败');
  } finally {
    pemLoading.value = false;
  }
}

/**
 * 提交表单（基础校验后向父组件抛出）
 */
function onSubmit(): void {
  if (!form.serverHostName.trim() || !form.serverHostAddress.trim()) {
    message.warning('主机名称与地址不能为空');
    return;
  }
  const hasAccount = form.serverHostAccount.trim();
  const hasPassword = !!form.serverHostPassword;
  const hasKey = form.serverHostPrivateKey.trim();
  // 密码非必填：选「账号密码」时只填账号、不填密码也允许保存。
  // 后端 autoCreateIdentity 仅在账号+密码齐全时自动建身份，密码缺失则回落默认凭据；
  // 「key」方式保留私钥必填（有私钥必须能关联账号）；
  // 「none」免密登录仅需账号，不填密码/私钥，后端创建免密（NONE）身份。
  if (form.authType === 'key' && !hasAccount && hasKey) {
    message.warning('请填写登录账号');
    return;
  }
  if (form.authType === 'none' && !form.serverHostAccount.trim()) {
    message.warning('免密登录也需填写登录账号');
    return;
  }
  const submit = {
    ...(props.host ?? {}),
    id: form.id,
    serverHostName: form.serverHostName.trim(),
    serverHostCode: form.serverHostCode.trim(),
    serverHostAddress: form.serverHostAddress.trim(),
    serverHostPort: Number(form.serverHostPort) || 22,
    serverHostOsType: form.serverHostOsType,
    msServerGroupId: form.msServerGroupId,
    serverHostTags: JSON.stringify(form.tags),
    serverHostDescription: form.serverHostDescription.trim(),
  } as Record<string, any>;
  if (form.authType === 'password' && hasAccount) {
    // 账号必带；密码可空（非必填），空则不传，后端按默认凭据处理
    submit.serverHostAccount = form.serverHostAccount.trim();
    submit.serverHostPassword = hasPassword ? form.serverHostPassword : null;
  } else if (form.authType === 'key' && hasAccount && hasKey) {
    submit.serverHostAccount = form.serverHostAccount.trim();
    submit.serverHostPrivateKey = form.serverHostPrivateKey.trim();
  } else if (form.authType === 'none' && form.serverHostAccount.trim()) {
    // 免密登录：只提交账号 + 免密类型标记，后端创建免密（NONE）身份
    submit.serverHostAccount = form.serverHostAccount.trim();
    submit.serverHostAuthType = 'none';
  }
  emit('submit', submit);
}
</script>

<template>
  <ReDialog
    v-model="visible"
    class="re-host-form-dialog"
    layout="modern"
    compact
    :title="isEdit ? '编辑主机' : '新增主机'"
    width="680"
    confirm-text="保存"
    cancel-text="取消"
    :footer-hidden="false" @confirm="onSubmit"
    @cancel="visible = false"
  >
    <ReForm label-position="top" class="host-form" @submit.prevent="onSubmit">
      <!-- 系统类型卡片 -->
      <div class="form-section">
        <ReSectionHead title="系统类型" />
        <div class="os-type-cards">
          <div
            v-for="opt in osTypeOptions"
            :key="opt.value"
            class="os-type-card"
            :class="{ active: form.serverHostOsType === opt.value }"
            role="button"
            tabindex="0"
            @click="form.serverHostOsType = opt.value; onOsTypeChange(opt.value)"
            @keyup.enter="form.serverHostOsType = opt.value; onOsTypeChange(opt.value)"
          >
            <ReIcon name="Monitor" :size="20" />
            <span>{{ opt.label }}</span>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-section">
        <ReSectionHead title="基本信息" />
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">主机名称<span class="required">*</span></label>
            <ReInput v-model="form.serverHostName" placeholder="如：应用服务器-01" />
          </div>
          <div class="form-field">
            <label class="field-label">主机编码</label>
            <ReInput v-model="form.serverHostCode" placeholder="可选，唯一标识" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field field-wide">
            <label class="field-label">主机地址<span class="required">*</span></label>
            <ReInput v-model="form.serverHostAddress" placeholder="IP 或域名" />
          </div>
          <div class="form-field field-narrow">
            <label class="field-label">端口</label>
            <ReInputNumber v-model="form.serverHostPort" :min="1" :max="65535" style="width: 100%" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">标签</label>
            <ReSelect
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              placeholder="输入后回车添加"
              :data="tagSuggestions.map(t => ({ label: t, value: t }))"
              style="width: 100%"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">描述</label>
            <ReInput v-model="form.serverHostDescription" type="textarea" :rows="2" placeholder="备注信息" />
          </div>
        </div>
      </div>

      <!-- 连接凭据 -->
      <div class="form-section">
        <ReSectionHead title="连接凭据" :description="isEdit ? '留空不修改' : ''" />
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">认证类型</label>
            <ReRadioGroup v-model="form.authType" button capsule>
              <ReRadioButton v-for="opt in authTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </ReRadioButton>
            </ReRadioGroup>
          </div>
        </div>
        <template v-if="form.authType === 'password'">
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">登录账号</label>
              <ReInput v-model="form.serverHostAccount" placeholder="如 root" />
            </div>
            <div class="form-field">
              <label class="field-label">登录密码</label>
              <ReInput v-model="form.serverHostPassword" type="password" show-password placeholder="密码（可选）" />
            </div>
          </div>
        </template>
        <template v-else-if="form.authType === 'key'">
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">登录账号</label>
              <ReInput v-model="form.serverHostAccount" placeholder="如 ubuntu" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field field-wide">
              <label class="field-label">PEM 私钥</label>
              <div class="pem-upload-wrap">
                <label class="pem-pick">
                  <ReButton :loading="pemLoading" plain tag="span">
                    <ReIcon name="Upload" :size="14" style="margin-right: 4px" />选择文件
                  </ReButton>
                  <input type="file" accept=".pem,.key,.priv" hidden :disabled="pemLoading" @change="onPemFileChange" />
                </label>
                <ReInput
                  v-model="form.serverHostPrivateKey"
                  type="textarea"
                  :rows="4"
                  placeholder="-----BEGIN RSA PRIVATE KEY-----\n...（含 -----BEGIN/END----- 完整内容）或直接上传文件"
                  class="pem-textarea"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="form.authType === 'none'">
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">登录账号</label>
              <ReInput v-model="form.serverHostAccount" placeholder="如 root（目标主机已放行该账号免密登录）" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field field-wide">
              <ReText type="info">免密登录：目标主机不校验密码（SSH 空口令登录或已配置密钥放行），平台只凭登录账号连接，无需填写密码或私钥。</ReText>
            </div>
          </div>
        </template>
      </div>

      <!-- 硬件规格 / 网络地址（编辑模式） -->
      <template v-if="isEdit">
        <div class="form-section">
          <ReSectionHead title="硬件规格">
            <template #actions>
              <ReButton link type="primary" :loading="detecting" @click="onDetect" class="section-action">
                <ReIcon name="Cpu" :size="14" style="margin-right: 4px" />重新探测
              </ReButton>
            </template>
          </ReSectionHead>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">CPU 核心</label>
              <ReInput :model-value="form.serverHostCpuCores ?? '-'" disabled />
            </div>
            <div class="form-field">
              <label class="field-label">内存 (MB)</label>
              <ReInput :model-value="form.serverHostMemoryMb ?? '-'" disabled />
            </div>
            <div class="form-field">
              <label class="field-label">磁盘 (GB)</label>
              <ReInput :model-value="form.serverHostDiskGb ?? '-'" disabled />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">系统版本</label>
              <ReInput :model-value="form.serverHostOsVersion || '-'" disabled />
            </div>
            <div class="form-field">
              <label class="field-label">系统架构</label>
              <ReInput :model-value="form.serverHostOsArch || '-'" disabled />
            </div>
          </div>
        </div>

        <div class="form-section">
          <ReSectionHead title="网络地址">
            <template #actions>
              <ReButton link type="primary" :loading="refreshingIp" @click="onRefreshPublicIp" class="section-action">
                <ReIcon name="Refresh" :size="14" style="margin-right: 4px" />刷新公网 IP
              </ReButton>
            </template>
          </ReSectionHead>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">公网 IP</label>
              <ReInput :model-value="form.serverHostPublicIp || '-'" disabled>
                <template #suffix>
                  <ReIcon v-if="form.serverHostPublicIp" name="Connection" color="var(--pulse-online)" />
                </template>
              </ReInput>
            </div>
            <div class="form-field">
              <label class="field-label">内网 IP</label>
              <ReInput :model-value="form.serverHostPrivateIp || '-'" disabled />
            </div>
          </div>
        </div>

        <ReFormItem v-if="form.serverHostAgentKey">
          <template #label>
            <label class="field-label">探针标识</label>
          </template>
          <ReText type="info" >{{ form.serverHostAgentKey }}</ReText>
        </ReFormItem>
      </template>
    </ReForm>
  </ReDialog>
</template>

<style scoped lang="scss">
.re-host-form-dialog {
  :deep(.rm-dialog__body) {
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
  }
  :deep(.rm-dialog__title) {
    font-size: 15px;
  }
}
.form-section {
  margin-bottom: 20px;
}

.section-action {
  font-size: 12px;
  padding: 0;
}

/* ========== 行 + 字段 ========== */
.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
  align-items: flex-start;
}

.form-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field-wide {
  flex: 2;
}

.field-narrow {
  flex: 0 0 120px;
}

.field-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
}

.required {
  color: var(--el-color-danger);
}

/* ========== 系统类型卡片 ========== */
.os-type-cards {
  display: flex;
  gap: 10px;
}

.os-type-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  /* 缓动原来写 var(--ease-out)（pages/server 私有令牌），这里内联同一个
     cubic-bezier(0.4, 0, 0.2, 1)；时长取 0.2s 微交互档 */
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) cubic-bezier(0.4, 0, 0.2, 1),
    background-color var(--el-transition-duration-fast, 0.2s) cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow var(--el-transition-duration-fast, 0.2s) cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }

  /* role="button" + tabindex="0" 的原生可点 div：统一用全站自绘焦点环，
     替换原来的 outline: 2px + offset 写法 */
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }

  /* 选中态只用「主色边框 + 浅底 + 主色文字 + 加粗」表达，
     按 koi 规约不再叠一层静态投影（原来这层 box-shadow 是纯装饰，边框已足够） */
  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
  }
}

/* ========== PEM 私钥上传 ========== */
.pem-upload-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pem-pick {
  cursor: pointer;
  display: inline-flex;
}

.pem-textarea {
  :deep(textarea) {
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.6;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .os-type-card {
    transition: none;
  }
}
</style>
