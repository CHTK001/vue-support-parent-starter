<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { message } from '@repo/core';
import { installNginxHost } from '../api';

/**
 * 软件安装对话框
 *
 * <p>目标主机必须是「已开启 SSH」的主机（serverHostSshEnabled === 1），
 * 目前仅支持安装 nginx，软件下拉只有唯一选项。</p>
 */

/** 对话框可见性（v-model） */
const visible = defineModel<boolean>({ required: true });

const props = defineProps<{
  /** 当前主机（操作列点击来源） */
  host: Record<string, any> | null;
  /** 候选主机列表（用于选择其它 SSH 主机） */
  hosts: Array<Record<string, any>>;
}>();

/** 安装完成事件：通知父组件刷新 */
const emit = defineEmits<{ (e: 'installed'): void }>();

/** 可安装主机：仅 SSH 已开启的主机 */
const sshHosts = computed(() =>
  (props.hosts || []).filter(h => h.serverHostSshEnabled === 1 && h.id != null)
);

/** 软件选项（目前仅 nginx） */
const softwareOptions = [{ value: 'nginx', label: 'Nginx' }];

/** 表单状态 */
const form = reactive({
  hostId: null as number | null,
  software: 'nginx',
});

/** 安装进行中 */
const installing = ref(false);

/** 表单校验错误 */
const formError = ref('');

// 打开时预选：当前主机若可安装则选中，否则选第一个可安装主机
watch(visible, show => {
  if (!show) return;
  formError.value = '';
  form.software = 'nginx';
  const current = props.host;
  if (current && current.serverHostSshEnabled === 1) {
    form.hostId = current.id;
  } else {
    form.hostId = sshHosts.value[0]?.id ?? null;
  }
});

/** 当前选中主机 */
const selectedHost = computed(() => sshHosts.value.find(h => h.id === form.hostId) ?? null);

/**
 * 提交安装：调用后端 install-nginx 接口
 */
async function onInstall(): Promise<void> {
  formError.value = '';
  if (form.hostId == null) {
    formError.value = '请选择一台已开启 SSH 的主机';
    return;
  }
  installing.value = true;
  try {
    const version = await installNginxHost(form.hostId);
    message.success(`安装完成：${version || 'nginx 已安装'}`);
    visible.value = false;
    emit('installed');
  } catch (e) {
    message.error((e as Error).message || '安装失败');
  } finally {
    installing.value = false;
  }
}
</script>

<template>
  <ReDialog
    v-model="visible"
    title="软件安装"
    width="520"
    :height="430"
    confirm-text="开始安装"
    cancel-text="取消"
    :confirm-loading="installing"
    :footer-hidden="false" @confirm="onInstall"
    @cancel="visible = false"
  >
    <ReDescriptions :column="1" border style="margin-bottom: 16px">
      <ReDescriptionsItem label="当前主机">
        {{ host?.serverHostName || '-' }}
        <ReTag v-if="host?.serverHostSshEnabled === 1" type="success" size="small" style="margin-left: 8px">SSH 已开启</ReTag>
        <ReTag v-else type="danger" size="small" style="margin-left: 8px">SSH 未开启</ReTag>
      </ReDescriptionsItem>
      <ReDescriptionsItem label="系统类型">{{ host?.serverHostOsType || '-' }}</ReDescriptionsItem>
    </ReDescriptions>

    <ReForm label-position="left" label-width="90px">
      <ReFormItem label="目标主机" required>
        <ReSelect
          v-model="form.hostId"
          :data="sshHosts.map(h => ({ value: h.id, label: `${h.serverHostName}（${h.serverHostAddress}）` }))"
          filterable
          placeholder="仅可安装已开启 SSH 的主机"
          style="width: 100%"
        />
      </ReFormItem>
      <ReFormItem label="安装软件" required>
        <ReSelect v-model="form.software" :data="softwareOptions" disabled style="width: 100%" />
      </ReFormItem>
      <ReFormItem
        v-if="host && host.serverHostSshEnabled !== 1"
        label=" "
      >
        <div class="ssh-tip">
          当前主机未开启 SSH，无法安装；请在上方选择其它已开启 SSH 的主机，或在主机表单中开启 SSH。
        </div>
      </ReFormItem>
      <div v-if="formError" class="form-error">{{ formError }}</div>
      <div class="soft-note">
        说明：将通过 SSH 登录目标主机，按发行版包管理器（apt / yum / dnf / zypper / apk）安装 nginx，
        安装完成后回显 nginx 版本。需要 root 或可 sudo 的账户。
      </div>
    </ReForm>
  </ReDialog>
</template>

<style scoped>
.ssh-tip {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-color-warning);
}
.form-error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
}
.soft-note {
  margin-top: 4px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-base, 8px);
}
</style>