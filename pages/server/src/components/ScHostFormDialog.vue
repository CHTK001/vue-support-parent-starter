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
  authType: 'password' as 'password' | 'key',
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
    ElMessage.warning('主机名称与地址不能为空');
    return;
  }
  const hasAccount = form.serverHostAccount.trim();
  const hasPassword = !!form.serverHostPassword;
  const hasKey = form.serverHostPrivateKey.trim();
  if (form.authType === 'password' && hasAccount && !hasPassword) {
    ElMessage.warning('请填写登录密码');
    return;
  }
  if (form.authType === 'key' && hasAccount && !hasKey) {
    ElMessage.warning('请填写 PEM 私钥');
    return;
  }
  if (form.authType === 'key' && !hasAccount && hasKey) {
    ElMessage.warning('请填写登录账号');
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
  if (form.authType === 'password' && hasAccount && hasPassword) {
    submit.serverHostAccount = form.serverHostAccount.trim();
    submit.serverHostPassword = form.serverHostPassword;
  } else if (form.authType === 'key' && hasAccount && hasKey) {
    submit.serverHostAccount = form.serverHostAccount.trim();
    submit.serverHostPrivateKey = form.serverHostPrivateKey.trim();
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
    @confirm="onSubmit"
    @cancel="visible = false"
  >
    <el-form label-position="top" class="host-form" @submit.prevent="onSubmit">
      <!-- 系统类型卡片 -->
      <div class="form-section">
        <div class="section-label">系统类型</div>
        <div class="os-type-cards">
          <div
            v-for="opt in osTypeOptions"
            :key="opt.value"
            class="os-type-card"
            :class="{ active: form.serverHostOsType === opt.value }"
            @click="form.serverHostOsType = opt.value; onOsTypeChange(opt.value)"
          >
            <el-icon :size="20"><Monitor /></el-icon>
            <span>{{ opt.label }}</span>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-label">基本信息</div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">主机名称<span class="required">*</span></label>
            <el-input v-model="form.serverHostName" placeholder="如：应用服务器-01" />
          </div>
          <div class="form-field">
            <label class="field-label">主机编码</label>
            <el-input v-model="form.serverHostCode" placeholder="可选，唯一标识" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field field-wide">
            <label class="field-label">主机地址<span class="required">*</span></label>
            <el-input v-model="form.serverHostAddress" placeholder="IP 或域名" />
          </div>
          <div class="form-field field-narrow">
            <label class="field-label">端口</label>
            <el-input-number v-model="form.serverHostPort" :min="1" :max="65535" style="width: 100%" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">标签</label>
            <el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              placeholder="输入后回车添加"
              style="width: 100%"
            >
              <el-option v-for="t in tagSuggestions" :key="t" :label="t" :value="t" />
            </el-select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">描述</label>
            <el-input v-model="form.serverHostDescription" type="textarea" :rows="2" placeholder="备注信息" />
          </div>
        </div>
      </div>

      <!-- 连接凭据 -->
      <div class="form-section">
        <div class="section-label">
          连接凭据
          <span class="section-hint">{{ isEdit ? '留空不修改' : '' }}</span>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">认证类型</label>
            <el-radio-group v-model="form.authType">
              <el-radio-button v-for="opt in authTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <template v-if="form.authType === 'password'">
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">登录账号</label>
              <el-input v-model="form.serverHostAccount" placeholder="如 root" />
            </div>
            <div class="form-field">
              <label class="field-label">登录密码</label>
              <el-input v-model="form.serverHostPassword" type="password" show-password placeholder="密码" />
            </div>
          </div>
        </template>
        <template v-else-if="form.authType === 'key'">
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">登录账号</label>
              <el-input v-model="form.serverHostAccount" placeholder="如 ubuntu" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field field-wide">
              <label class="field-label">PEM 私钥</label>
              <div class="pem-upload-wrap">
                <el-upload
                  :show-file-list="false"
                  :auto-upload="false"
                  accept=".pem,.key,.priv"
                  :disabled="pemLoading"
                  @change="onPemFileChange"
                >
                  <el-button size="small" :loading="pemLoading" plain>
                    <el-icon style="margin-right: 4px"><Upload /></el-icon>选择文件
                  </el-button>
                </el-upload>
                <el-input
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
      </div>

      <!-- 硬件规格 / 网络地址（编辑模式） -->
      <template v-if="isEdit">
        <div class="form-section">
          <div class="section-label">
            硬件规格
            <el-button link type="primary" :loading="detecting" @click="onDetect" class="section-action">
              <el-icon style="margin-right: 4px"><Cpu /></el-icon>重新探测
            </el-button>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">CPU 核心</label>
              <el-input :model-value="form.serverHostCpuCores ?? '-'" disabled />
            </div>
            <div class="form-field">
              <label class="field-label">内存 (MB)</label>
              <el-input :model-value="form.serverHostMemoryMb ?? '-'" disabled />
            </div>
            <div class="form-field">
              <label class="field-label">磁盘 (GB)</label>
              <el-input :model-value="form.serverHostDiskGb ?? '-'" disabled />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">系统版本</label>
              <el-input :model-value="form.serverHostOsVersion || '-'" disabled />
            </div>
            <div class="form-field">
              <label class="field-label">系统架构</label>
              <el-input :model-value="form.serverHostOsArch || '-'" disabled />
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-label">
            网络地址
            <el-button link type="primary" :loading="refreshingIp" @click="onRefreshPublicIp" class="section-action">
              <el-icon style="margin-right: 4px"><Refresh /></el-icon>刷新公网 IP
            </el-button>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">公网 IP</label>
              <el-input :model-value="form.serverHostPublicIp || '-'" disabled>
                <template #suffix>
                  <el-icon v-if="form.serverHostPublicIp" color="#67c23a"><Connection /></el-icon>
                </template>
              </el-input>
            </div>
            <div class="form-field">
              <label class="field-label">内网 IP</label>
              <el-input :model-value="form.serverHostPrivateIp || '-'" disabled />
            </div>
          </div>
        </div>

        <el-form-item v-if="form.serverHostAgentKey">
          <template #label>
            <label class="field-label">探针标识</label>
          </template>
          <el-text type="info" size="small">{{ form.serverHostAgentKey }}</el-text>
        </el-form-item>
      </template>
    </el-form>
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

.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
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
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }

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

.pem-textarea {
  :deep(textarea) {
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
