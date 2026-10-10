<template>
  <LDialog
    v-model="visible"
    title="添加本地工具"
    width="520px"
    align-center
    append-to-body
    class="ct-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="ct-form"
      @submit.prevent
    >
      <el-form-item label="工具名称（可选）">
        <el-input
          v-model="form.name"
          placeholder="留空则读取清单中的名称"
          clearable
          maxlength="40"
        >
          <template #prefix><el-icon><Tag24Regular /></el-icon></template>
        </el-input>
      </el-form-item>

      <el-form-item label="工具目录" prop="path">
        <el-input
          v-model="form.path"
          placeholder="如 D:\\tools\\my-plugin"
          clearable
        >
          <template #prefix><el-icon><Folder24Regular /></el-icon></template>
        </el-input>
      </el-form-item>

      <div class="ct-tip">
        <el-icon class="ct-tip-ico"><Info24Regular /></el-icon>
        <div class="ct-tip-text">
          目录中需包含 <code>plugin.json</code> 或 <code>package.json</code> 清单；
          若所选目录本身没有清单，会自动扫描它的一级子目录。
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="ct-footer">
        <el-button class="ct-btn" @click="visible = false">取消</el-button>
        <el-button class="ct-btn" type="primary" :loading="saving" @click="handleSave">添加</el-button>
      </div>
    </template>
  </LDialog>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref } from 'vue'

import LDialog from '@/components/ui/LDialog.vue'
import {
  Info24Regular, Tag24Regular, Folder24Regular,
} from '@vicons/fluent'
import { apiService } from '@/services/ApiService'

const emit = defineEmits<{ saved: [] }>()

const visible = ref(false)
const saving = ref(false)
const formRef = ref<any>(null)
const form = ref({ name: '', path: '' })

const rules = {
  path: { required: true, message: '请输入工具目录路径', trigger: 'blur' },
}

function open() {
  form.value = { name: '', path: '' }
  formRef.value?.clearValidate?.()
  visible.value = true
}
defineExpose({ open })

async function handleSave() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const res = await apiService.addCustomTool(form.value.name.trim(), form.value.path.trim())
    if (!res.success) {
      message.error(res.message || '添加失败')
      return
    }
    message.success(`已添加 ${res.count ?? ''} 个工具`)
    visible.value = false
    emit('saved')
  } catch (e: any) {
    message.error(e?.message || '添加失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ct-form :deep(.el-form-item) { margin-bottom: 15px; }
.ct-form :deep(.el-form-item__label) {
  font-size: 12.5px; font-weight: 600; color: var(--el-text-color-regular);
  padding-bottom: 6px; line-height: 1.4;
}
.ct-form :deep(.el-input__wrapper) {
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
}
.ct-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px var(--el-color-primary-light-9);
}

.ct-tip {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 11px 12px;
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-regular);
}
.ct-tip-ico { flex: none; margin-top: 1px; color: var(--el-color-primary); }
.ct-tip-text { font-size: 12px; line-height: 1.7; }
.ct-tip code {
  /* 原值 5px → sm 档 */
  padding: 1px 5px; border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-primary-light-7);
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 11.5px;
}

.ct-footer { display: flex; justify-content: flex-end; gap: 10px; }
/* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
.ct-btn { border-radius: var(--el-radius-lg, 12px); }
.ct-btn:not(.el-button--primary) {
  background: var(--el-bg-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-regular);
}
.ct-btn:not(.el-button--primary):hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
</style>
