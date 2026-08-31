<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { detectHost, refreshHostPublicIp } from '../api';

/**
 * 主机编辑表单对话框
 * 新增与编辑共用；编辑模式下地址/端口可改，agentKey 只读展示。
 * 新增时支持直接填写账号密码 / PEM 私钥，保存时后端自动创建身份并绑定。
 * 支持硬件探测与公网 IP 刷新（探测/刷新后回填表单）。
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
  serverHostCpuCores: null as number | null,
  serverHostMemoryMb: null as number | null,
  serverHostDiskGb: null as number | null,
  serverHostOsVersion: '',
  serverHostPublicIp: '',
  serverHostPrivateIp: '',
  serverHostAccount: '',
  serverHostPassword: '',
  serverHostPrivateKey: '',
  serverHostAgentKey: '',
});

/** 是否编辑模式 */
const isEdit = computed(() => props.host != null);

/** 探测 / 刷新加载态 */
const detecting = ref(false);
const refreshingIp = ref(false);

/** 标签建议 */
const tagSuggestions = ['生产', '测试', '核心', '边缘', 'Linux', 'Windows'];

/**
 * 添加标签（回车 / 建议点击）
 */
function addTag(tag: string): void {
  const t = tag.trim();
  if (!t) return;
  if (!form.tags.includes(t)) {
    form.tags.push(t);
  }
  form.tagsInput = '';
}

/**
 * 移除标签
 */
function removeTag(tag: string): void {
  form.tags = form.tags.filter(t => t !== tag);
}

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
    form.serverHostCpuCores = src.serverHostCpuCores ?? null;
    form.serverHostMemoryMb = src.serverHostMemoryMb ?? null;
    form.serverHostDiskGb = src.serverHostDiskGb ?? null;
    form.serverHostOsVersion = src.serverHostOsVersion ?? '';
    form.serverHostPublicIp = src.serverHostPublicIp ?? '';
    form.serverHostPrivateIp = src.serverHostPrivateIp ?? '';
    form.serverHostAccount = '';
    form.serverHostPassword = '';
    form.serverHostPrivateKey = '';
    form.serverHostAgentKey = src.serverHostAgentKey ?? '';
  },
  { immediate: true },
);

/**
 * 系统类型变更时联动端口（仅未手动修改过端口时）
 */
function onOsTypeChange(type: string): void {
  const defPort = PORT_BY_OS[type] ?? 22;
  // 仅当端口等于旧系统默认端口时才联动，避免覆盖用户自定义
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
 * 硬件探测：调用后端 SSH 采集并回填表单
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
    form.serverHostPrivateIp = updated?.serverHostPrivateIp ?? form.serverHostPrivateIp;
    form.serverHostPublicIp = updated?.serverHostPublicIp ?? form.serverHostPublicIp;
    form.serverHostOsArch = updated?.serverHostOsArch ?? form.serverHostOsArch;
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
 */
function onSubmit(): void {
  if (!form.serverHostName.trim() || !form.serverHostAddress.trim()) {
    ElMessage.warning('主机名称与地址不能为空');
    return;
  }
  emit('submit', {
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
    serverHostCpuCores: form.serverHostCpuCores,
    serverHostMemoryMb: form.serverHostMemoryMb,
    serverHostDiskGb: form.serverHostDiskGb,
    serverHostOsVersion: form.serverHostOsVersion.trim(),
    serverHostPublicIp: form.serverHostPublicIp.trim(),
    serverHostPrivateIp: form.serverHostPrivateIp.trim(),
    serverHostAccount: form.serverHostAccount.trim() || undefined,
    serverHostPassword: form.serverHostPassword || undefined,
    serverHostPrivateKey: form.serverHostPrivateKey.trim() || undefined,
  });
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑主机' : '新增主机'"
    width="720px"
    destroy-on-close
    append-to-body
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
            @keyup.enter.prevent=""
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

      <!-- 连接凭据：仅新增时展示（编辑时凭据需在凭据管理中调整） -->
      <template v-if="!isEdit">
        <el-divider content-position="left">连接凭据（可选，保存后自动创建身份）</el-divider>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="登录账号">
              <el-input v-model="form.serverHostAccount" placeholder="如 root" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登录密码">
              <el-input v-model="form.serverHostPassword" type="password" show-password placeholder="密码或密钥口令" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="PEM 私钥">
          <el-input
            v-model="form.serverHostPrivateKey"
            type="textarea"
            :rows="3"
            placeholder="-----BEGIN RSA PRIVATE KEY-----\n... 可选，与密码二选一"
          />
        </el-form-item>
      </template>

      <!-- 硬件规格 -->
      <el-divider content-position="left">
        硬件规格
        <el-button
          v-if="isEdit"
          link
          type="primary"
          :loading="detecting"
          @click="onDetect"
        >
          <el-icon style="margin-right: 4px"><Cpu /></el-icon>
          探测
        </el-button>
      </el-divider>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="CPU核心">
            <el-input-number v-model="form.serverHostCpuCores" :min="1" :max="256" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="内存(MB)">
            <el-input-number v-model="form.serverHostMemoryMb" :min="1" :max="1048576" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="磁盘(GB)">
            <el-input-number v-model="form.serverHostDiskGb" :min="1" :max="1048576" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="系统版本">
        <el-input v-model="form.serverHostOsVersion" placeholder="如 Ubuntu 24.04 LTS" />
      </el-form-item>

      <!-- 网络地址 -->
      <el-divider content-position="left">
        网络地址
        <el-button
          v-if="isEdit"
          link
          type="primary"
          :loading="refreshingIp"
          @click="onRefreshPublicIp"
        >
          <el-icon style="margin-right: 4px"><Refresh /></el-icon>
          刷新公网IP
        </el-button>
      </el-divider>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="公网IP">
            <el-input v-model="form.serverHostPublicIp" placeholder="公网IP地址">
              <template #suffix>
                <el-icon v-if="form.serverHostPublicIp" class="ip-dot" color="#67c23a"><Connection /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="内网IP">
            <el-input v-model="form.serverHostPrivateIp" placeholder="内网IP地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item v-if="isEdit && form.serverHostAgentKey" label="探针标识">
        <el-text type="info" size="small">{{ form.serverHostAgentKey }}</el-text>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="onSubmit">保存</el-button>
    </template>
  </el-dialog>
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

.ip-dot {
  margin-top: 8px;
}
</style>
