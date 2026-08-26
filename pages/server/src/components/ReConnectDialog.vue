<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

/**
 * 远控连接配置对话框
 * 选择协议与登录身份后，由父组件发起连接（打开 ReGuacViewer 全屏抽屉）。
 */

/** 对话框可见性（v-model） */
const visible = defineModel<boolean>({ required: true });

const props = defineProps<{
  /** 目标主机 */
  host: Record<string, any> | null;
  /** 可选身份列表 */
  identities: Array<Record<string, any>>;
}>();

/** 确认事件：携带连接参数 */
const emit = defineEmits<{
  (e: 'connect', params: { hostId: number; protocol: string; identityId: number | null; targetPort: number | null }): void;
}>();

/** 协议选项 */
const protocolOptions = [
  { value: 'ssh', label: 'SSH 终端' },
  { value: 'vnc', label: 'VNC 桌面' },
  { value: 'rdp', label: 'RDP 远程桌面' },
];

/** 表单状态 */
const form = reactive({
  protocol: 'ssh',
  identityId: null as number | null,
  targetPort: null as number | null,
});

// 打开时重置为默认协议并预选第一个绑定身份
watch(visible, show => {
  if (!show) return;
  form.protocol = 'ssh';
  form.identityId = null;
  form.targetPort = null;
});

/** 目标端口提示文案 */
const portPlaceholder = computed(() => {
  if (form.protocol === 'vnc') return '默认 5900';
  if (form.protocol === 'rdp') return '默认 3389';
  return 'SSH 使用主机台账端口';
});

/**
 * 发起连接
 */
function onConnect(): void {
  if (!props.host) return;
  emit('connect', {
    hostId: props.host.id,
    protocol: form.protocol,
    identityId: form.identityId,
    targetPort: form.targetPort,
  });
  visible.value = false;
}
</script>

<template>
  <el-dialog v-model="visible" title="远程连接" width="440px" append-to-body>
    <el-descriptions v-if="host" :column="1" border size="small" style="margin-bottom: 16px">
      <el-descriptions-item label="主机">{{ host.serverHostName }}</el-descriptions-item>
      <el-descriptions-item label="地址">{{ host.serverHostAddress }}</el-descriptions-item>
      <el-descriptions-item label="系统">{{ host.serverHostOsType }}</el-descriptions-item>
    </el-descriptions>

    <el-form label-width="90px" @submit.prevent="onConnect">
      <el-form-item label="协议">
        <el-radio-group v-model="form.protocol">
          <el-radio-button v-for="opt in protocolOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="登录身份">
        <el-select v-model="form.identityId" placeholder="默认取优先级最高的绑定身份" clearable style="width: 100%">
          <el-option
            v-for="identity in identities"
            :key="identity.id"
            :value="identity.id"
            :label="`${identity.msServerIdentityUsername} (${identity.msServerIdentityAuthType})`"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.protocol !== 'ssh'" label="目标端口">
        <el-input-number v-model="form.targetPort" :min="1" :max="65535" :placeholder="portPlaceholder" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="onConnect">连接</el-button>
    </template>
  </el-dialog>
</template>
