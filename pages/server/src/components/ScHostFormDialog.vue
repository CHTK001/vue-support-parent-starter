<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
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
 *
 * @param raw JSON 数组字符串
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
    ElMessage.warning('请先保存主机后再探测');
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
    ElMessage.success('硬件探测成功，已回填');
  } catch (e) {
    ElMessage.error((e as Error).message || '硬件探测失败');
  } finally {
    detecting.value = false;
  }
}

/**
 * 公网 IP 刷新：调用后端探测出口 IP 并回填
 */
async function onRefreshPublicIp(): Promise<void> {
  if (!form.id) {
    ElMessage.warning('请先保存主机后再刷新公网 IP');
    return;
  }
  refreshingIp.value = true;
  try {
    const ip = await refreshHostPublicIp(form.id);
    form.serverHostPublicIp = ip;
    ElMessage.success(`公网 IP 已刷新：${ip}`);
  } catch (e) {
    ElMessage.error((e as Error).message || '公网 IP 刷新失败');
  } finally {
    refreshingIp.value = false;
  }
}

/**
 * 提交表单（基础校验后向父组件抛出）
 * 仅提交基础配置与凭据；硬件/网络由后台探测维护，不在此处提交。
 */
function onSubmit(): void {
  if (!form.serverHostName.trim() || !form.serverHostAddress.trim()) {
    ElMessage.warning('主机名称与地址不能为空');
    return;
  }
  // 新增：凭据必填（任一类型）；编辑：填了才更新
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
  // 凭据：按类型携带（编辑时未填则不提交）
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
    :title="isEdit ? '编辑主机' : '新增主机'"
    width="760"
    :height="640"
    confirm-text="保存"
    cancel-text="取消"
    @confirm="onSubmit"
    @cancel="visible = false"
  >
    <el-form label-width="100px" @submit.prevent="onSubmit">
      <!-- 系统类型卡片 -->
      <el-form-item label="系统类型" required>
        <div class="os-type-cards">
          <div
            v-for="opt in osTypeOptions"
            :key="opt.value"
            class="os-type-card"
            :class="{ active: form.serverHostOsType === opt.value }"
            @click="form.serverHostOsType = opt.value; onOsTypeChange(opt.value)"
          >
            <el-icon :size="22"><Monitor /></el-icon>
            <span>{{ opt.label }}</span>
          </div>
        </div>
      </el-form-item>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="主机名称" required>
            <el-input v-model="form.serverHostName" placeholder="如：应用服务器-01" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="主机编码">
            <el-input v-model="form.serverHostCode" placeholder="可选，唯一标识" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="16">
          <el-form-item label="主机地址" required>
            <el-input v-model="form.serverHostAddress" placeholder="IP 或域名" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="端口">
            <el-input-number v-model="form.serverHostPort" :min="1" :max="65535" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="标签">
        <div class="tag-editor">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder="输入后回车添加标签"
            style="width: 100%"
          >
            <el-option
              v-for="t in tagSuggestions"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </div>
      </el-form-item>

      <el-form-item label="描述">
        <el-input v-model="form.serverHostDescription" type="textarea" :rows="2" placeholder="备注信息" />
      </el-form-item>

      <!-- 连接凭据：新增必填；编辑时可重新选择类型更新凭据（留空表示不修改） -->
      <el-divider content-position="left">
        连接凭据{{ isEdit ? '（编辑时留空不修改）' : '' }}
      </el-divider>
      <el-form-item :label="isEdit ? '更新凭据' : '认证类型'">
        <el-radio-group v-model="form.authType">
          <el-radio-button v-for="opt in authTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
        <el-text v-if="isEdit" size="small" type="info" style="margin-left: 8px">留空则不更新</el-text>
      </el-form-item>

      <template v-if="form.authType === 'password'">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="登录账号">
              <el-input v-model="form.serverHostAccount" placeholder="如 root" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登录密码">
              <el-input v-model="form.serverHostPassword" type="password" show-password placeholder="密码" />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template v-else-if="form.authType === 'key'">
        <el-form-item label="登录账号">
          <el-input v-model="form.serverHostAccount" placeholder="如 ubuntu" />
        </el-form-item>
        <el-form-item label="PEM 私钥">
          <el-input
            v-model="form.serverHostPrivateKey"
            type="textarea"
            :rows="4"
            placeholder="-----BEGIN RSA PRIVATE KEY-----\n...（含 -----BEGIN/END----- 完整内容）"
          />
        </el-form-item>
      </template>

      <!-- 硬件规格 / 网络地址：后台探测结果，只读展示 -->
      <template v-if="isEdit">
        <el-divider content-position="left">
          硬件规格
          <el-button link type="primary" :loading="detecting" @click="onDetect">
            <el-icon style="margin-right: 4px"><Cpu /></el-icon>
            重新探测
          </el-button>
        </el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="CPU核心">
              <el-input :model-value="form.serverHostCpuCores ?? '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内存(MB)">
              <el-input :model-value="form.serverHostMemoryMb ?? '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="磁盘(GB)">
              <el-input :model-value="form.serverHostDiskGb ?? '-'" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="系统版本">
              <el-input :model-value="form.serverHostOsVersion || '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="系统架构">
              <el-input :model-value="form.serverHostOsArch || '-'" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          网络地址
          <el-button link type="primary" :loading="refreshingIp" @click="onRefreshPublicIp">
            <el-icon style="margin-right: 4px"><Refresh /></el-icon>
            刷新公网IP
          </el-button>
        </el-divider>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="公网IP">
              <el-input :model-value="form.serverHostPublicIp || '-'" disabled>
                <template #suffix>
                  <el-icon v-if="form.serverHostPublicIp" color="#67c23a"><Connection /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内网IP">
              <el-input :model-value="form.serverHostPrivateIp || '-'" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-form-item v-if="isEdit && form.serverHostAgentKey" label="探针标识">
        <el-text type="info" size="small">{{ form.serverHostAgentKey }}</el-text>
      </el-form-item>
    </el-form>
  </ReDialog>
</template>

<style scoped lang="scss">
.os-type-cards {
  display: flex;
  gap: 12px;
  width: 100%;
}

.os-type-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--el-text-color-regular);

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

.tag-editor {
  width: 100%;
}
</style>

<!-- 弹窗外观覆写：加大圆角 + 磨砂玻璃背景（ReDialog 挂载在 body 下，需全局样式） -->
<style lang="scss">
.koi-dialog-shell {
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: saturate(160%) blur(20px);
  backdrop-filter: saturate(160%) blur(20px);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.koi-dialog-shell .el-dialog__body {
  background: transparent;
}
</style>
