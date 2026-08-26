<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';

/**
 * 主机编辑表单对话框
 * 新增与编辑共用；编辑模式下地址/端口可改，agentKey 只读展示。
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
  { value: 'LINUX', label: 'Linux' },
  { value: 'WINDOWS', label: 'Windows' },
  { value: 'MACOS', label: 'macOS' },
];

/** 表单数据 */
const form = reactive({
  serverHostName: '',
  serverHostCode: '',
  serverHostAddress: '',
  serverHostPort: 22,
  serverHostOsType: 'LINUX',
  msServerGroupId: null as number | null,
  tagsText: '',
  serverHostDescription: '',
});

/** 是否编辑模式 */
const isEdit = computed(() => props.host != null);

// 打开时同步外部数据到表单
watch(
  () => [visible.value, props.host] as const,
  ([show]) => {
    if (!show) return;
    const src = props.host ?? {};
    form.serverHostName = src.serverHostName ?? '';
    form.serverHostCode = src.serverHostCode ?? '';
    form.serverHostAddress = src.serverHostAddress ?? '';
    form.serverHostPort = src.serverHostPort ?? 22;
    form.serverHostOsType = src.serverHostOsType ?? 'LINUX';
    form.msServerGroupId = src.msServerGroupId ?? null;
    form.tagsText = parseTags(src.serverHostTags);
    form.serverHostDescription = src.serverHostDescription ?? '';
  },
  { immediate: true },
);

/**
 * 解析标签 JSON 字符串为逗号分隔文本
 *
 * @param raw JSON 数组字符串
 */
function parseTags(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return '';
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.join(',') : '';
  } catch {
    return '';
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
  let tags: string[] = [];
  if (form.tagsText.trim()) {
    tags = form.tagsText.split(/[,，]/).map(t => t.trim()).filter(Boolean);
  }
  emit('submit', {
    ...(props.host ?? {}),
    serverHostName: form.serverHostName.trim(),
    serverHostCode: form.serverHostCode.trim(),
    serverHostAddress: form.serverHostAddress.trim(),
    serverHostPort: Number(form.serverHostPort) || 22,
    serverHostOsType: form.serverHostOsType,
    msServerGroupId: form.msServerGroupId,
    serverHostTags: tags.length ? JSON.stringify(tags) : '[]',
    serverHostDescription: form.serverHostDescription.trim(),
  });
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑主机' : '新增主机'"
    width="520px"
    destroy-on-close
    append-to-body
  >
    <el-form label-width="90px" @submit.prevent="onSubmit">
      <el-form-item label="主机名称" required>
        <el-input v-model="form.serverHostName" placeholder="如：应用服务器-01" />
      </el-form-item>
      <el-form-item label="主机编码">
        <el-input v-model="form.serverHostCode" placeholder="可选，唯一标识" />
      </el-form-item>
      <el-form-item label="主机地址" required>
        <el-input v-model="form.serverHostAddress" placeholder="IP 或域名" />
      </el-form-item>
      <el-form-item label="SSH 端口">
        <el-input-number v-model="form.serverHostPort" :min="1" :max="65535" />
      </el-form-item>
      <el-form-item label="系统类型">
        <el-select v-model="form.serverHostOsType" style="width: 100%">
          <el-option v-for="opt in osTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-input v-model="form.tagsText" placeholder="逗号分隔，如：生产,核心" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.serverHostDescription" type="textarea" :rows="2" placeholder="备注信息" />
      </el-form-item>
      <el-form-item v-if="isEdit && host?.serverHostAgentKey" label="探针标识">
        <el-text type="info" size="small">{{ host.serverHostAgentKey }}</el-text>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="onSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
