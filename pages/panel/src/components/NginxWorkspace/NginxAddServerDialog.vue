<template>
  <ElDialog
    :model-value="modelValue"
    title="添加站点"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="dialog-form">
      <div class="form-row">
        <label class="form-label">监听端口</label>
        <input v-model="form.listen" class="form-input" placeholder="80" />
      </div>
      <div class="form-row">
        <label class="form-label">域名 (server_name)</label>
        <input v-model="form.serverName" class="form-input" placeholder="example.com" />
      </div>
      <div class="form-row">
        <label class="form-label">根目录 (root)</label>
        <input v-model="form.root" class="form-input" placeholder="/var/www/html" />
      </div>
      <div class="form-row">
        <label class="form-label">默认文件 (index)</label>
        <input v-model="form.index" class="form-input" placeholder="index.html" />
      </div>
    </div>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSubmit">添加</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ElButton, ElDialog, ElMessage } from 'element-plus'
import { reactive, watch } from 'vue'
import type { NginxServerBlock } from '../../api/nginx'

const props = defineProps<{
  modelValue: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', server: NginxServerBlock): void
}>()

const form = reactive<NginxServerBlock>({
  listen: '80',
  serverName: '',
  root: '/var/www/html',
  index: 'index.html',
  locations: [{ path: '/', tryFiles: '$uri $uri/ =404' }],
})

const resetForm = () => {
  Object.assign(form, {
    listen: '80',
    serverName: '',
    root: '/var/www/html',
    index: 'index.html',
    locations: [{ path: '/', tryFiles: '$uri $uri/ =404' }],
  })
}

watch(() => props.modelValue, (v) => { if (v) resetForm() })

const handleSubmit = () => {
  if (!form.serverName?.trim() && !form.listen?.trim()) {
    ElMessage.warning('请填写域名或端口')
    return
  }
  emit('submit', {
    listen: form.listen,
    serverName: form.serverName,
    root: form.root,
    index: form.index,
    locations: [...(form.locations ?? [])],
  })
}
</script>

<style scoped lang="scss">
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.form-row {
  display: flex;
  align-items: center;
  height: 46px;
  gap: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);

  &:last-child { border-bottom: none; }
}

.form-label {
  flex-shrink: 0;
  width: 150px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.form-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: #fff;
  }
}

/* ── Dark Mode ── */
:global(html.dark) {
  .form-label {
    color: #94a3b8;
  }

  .form-input {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(148, 163, 184, 0.15);
    color: #e2e8f0;

    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      background: rgba(15, 23, 42, 0.85);
    }
  }

  .form-row {
    border-bottom-color: rgba(148, 163, 184, 0.06);
  }
}
</style>
