<template>
  <ReDialog :close-on-click-modal="true"
    v-model="visible"
    :title="isEdit ? t('plugins.characters.form.editTitle') : t('plugins.characters.form.addTitle')"
    width="640px"
    align-center
    append-to-body
    class="cf-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="cf-form"
      @submit.prevent
    >
      <!-- 基本信息 -->
      <section class="cf-section">
        <div class="cf-section-head">
          <span class="cf-section-ico"><el-icon :size="15"><Info24Regular /></el-icon></span>
          <span class="cf-section-title">{{ t('plugins.characters.form.sectionBasic') }}</span>
        </div>

        <el-form-item :label="t('plugins.characters.form.nameLabel')" prop="title">
          <el-input v-model="form.title" :placeholder="t('plugins.characters.form.namePlaceholder')" clearable maxlength="40" show-word-limit />
        </el-form-item>

        <div class="cf-grid">
          <el-form-item :label="t('plugins.characters.form.codeLabel')" prop="code">
            <el-input
              v-model="form.code"
              :placeholder="t('plugins.characters.form.codePlaceholder')"
              :disabled="isEdit"
              clearable
            />
          </el-form-item>
          <el-form-item :label="t('plugins.characters.form.categoryLabel')">
            <el-select v-model="form.category" class="cf-full">
              <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item :label="t('plugins.characters.form.avatarLabel')">
          <el-input v-model="form.avatar" :placeholder="t('plugins.characters.form.avatarPlaceholder')" clearable>
            <template #prefix><el-icon><Image24Regular /></el-icon></template>
          </el-input>
        </el-form-item>
      </section>

      <!-- 角色设定 -->
      <section class="cf-section">
        <div class="cf-section-head">
          <span class="cf-section-ico"><el-icon :size="15"><Edit24Regular /></el-icon></span>
          <span class="cf-section-title">{{ t('plugins.characters.form.sectionProfile') }}</span>
        </div>

        <el-form-item :label="t('plugins.characters.form.descLabel')">
          <el-input v-model="form.description" :placeholder="t('plugins.characters.form.descPlaceholder')" clearable maxlength="120" show-word-limit />
        </el-form-item>

        <el-form-item :label="t('plugins.characters.form.promptLabel')" prop="systemPrompt">
          <el-input
            v-model="form.systemPrompt"
            type="textarea"
            :autosize="{ minRows: 7, maxRows: 16 }"
            :placeholder="t('plugins.characters.form.promptPlaceholder')"
            class="cf-prompt"
          />
        </el-form-item>
      </section>

      <!-- 模型与参数（可选） -->
      <section class="cf-section">
        <div class="cf-section-head">
          <span class="cf-section-ico"><el-icon :size="15"><WrenchScrewdriver24Regular /></el-icon></span>
          <span class="cf-section-title">{{ t('plugins.characters.form.sectionModel') }}</span>
        </div>

        <div class="cf-grid">
          <el-form-item :label="t('plugins.characters.form.modelLabel')">
            <el-select
              v-model="form.modelId"
              class="cf-full"
              clearable
              filterable
              :placeholder="t('plugins.characters.form.modelPlaceholder')"
            >
              <el-option-group
                v-for="group in modelGroups"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="m in group.options"
                  :key="m.value"
                  :label="m.label"
                  :value="m.value"
                />
              </el-option-group>
            </el-select>
          </el-form-item>

          <el-form-item :label="t('plugins.characters.form.temperatureLabel')">
            <ReNumberInput
              v-model="form.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :precision="1"
              controls-position="right"
              class="cf-full"
              :placeholder="t('plugins.characters.form.temperaturePlaceholder')"
            />
          </el-form-item>
        </div>
        <div class="cf-hint">{{ t('plugins.characters.form.modelHint') }}</div>
      </section>
    </el-form>

    <template #footer>
      <div class="cf-footer">
        <el-button class="cf-btn" @click="visible = false">{{ t('plugins.characters.cancel') }}</el-button>
        <el-button class="cf-btn" type="primary" :loading="saving" @click="handleSave">
          {{ isEdit ? t('plugins.characters.form.saveEdit') : t('plugins.characters.form.create') }}
        </el-button>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ReDialog from '@repo/ui/re-dialog'
import {
  Info24Regular, Edit24Regular, Image24Regular, WrenchScrewdriver24Regular,
} from '@vicons/fluent'
import { apiService } from '@/services/ApiService'
import ReNumberInput from '@/components/ui/ReNumberInput.vue'

const emit = defineEmits<{ saved: [] }>()

const { t } = useI18n()

const categoryOptions = [
  '研发效能', '数据分析', '写作办公', '营销运营', '通用助手', '专业翻译与学习', '生活规划',
]

const visible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<any>(null)

const form = ref<any>(emptyForm())

function emptyForm() {
  return {
    title: '',
    code: '',
    category: '通用助手',
    avatar: '',
    description: '',
    systemPrompt: '',
    modelId: null,
    temperature: null,
  }
}

/** 按供应商分组的文本模型选项 */
const modelGroups = ref<{ label: string; options: { label: string; value: string }[] }[]>([])

async function loadModelGroups() {
  try {
    const resp = await apiService.fetchModels()
    const groups: { label: string; options: { label: string; value: string }[] }[] = []
    resp.items.forEach((provider: any) => {
      const textModels = (provider.models || []).filter((m: any) => m.modelType === 'text')
      if (!textModels.length) return
      groups.push({
        label: provider.name || provider.id,
        options: textModels.map((m: any) => ({ label: m.modelName || m.model || m.name || m.id, value: m.id })),
      })
    })
    modelGroups.value = groups
  } catch (e) {
    console.error('加载模型选项失败:', e)
  }
}

const rules = computed(() => ({
  title: { required: true, message: t('plugins.characters.form.nameRequired'), trigger: 'blur' },
  systemPrompt: { required: true, message: t('plugins.characters.form.promptRequired'), trigger: 'blur' },
  code: {
    pattern: /^[a-zA-Z0-9_-]*$/,
    message: t('plugins.characters.form.codePattern'),
    trigger: 'blur',
  },
}))

function openAdd() {
  isEdit.value = false
  editingId.value = null
  form.value = emptyForm()
  formRef.value?.clearValidate?.()
  loadModelGroups()
  visible.value = true
}

function openEdit(role: any) {
  isEdit.value = true
  // 自定义卡片 id 形如 custom-2466，真正的数字主键在 roleId
  editingId.value = String(role.roleId ?? role.id)
  form.value = {
    title: role.title || role.name || '',
    code: role.code || '',
    category: role.category || '通用助手',
    avatar: role.avatar || role.avatarUrl || '',
    description: role.description || '',
    systemPrompt: role.systemPrompt || '',
    modelId: role.modelId ?? null,
    temperature: role.temperature ?? null,
  }
  formRef.value?.clearValidate?.()
  loadModelGroups()
  visible.value = true
}

defineExpose({ openAdd, openEdit })

async function handleSave() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload: any = {
      code: form.value.code || slug(form.value.title),
      name: form.value.title,
      title: form.value.title,
      description: form.value.description || '',
      systemPrompt: form.value.systemPrompt,
      avatar: form.value.avatar || '',
      modelId: form.value.modelId ?? null,
      temperature: form.value.temperature ?? null,
      settings: { systemPrompt: form.value.systemPrompt },
    }
    if (isEdit.value && editingId.value) {
      await apiService.updateCharacter(editingId.value, payload)
      message.success(t('plugins.characters.form.updated'))
    } else {
      await apiService.createCharacter(payload)
      message.success(t('plugins.characters.form.created'))
    }
    visible.value = false
    emit('saved')
  } catch (e: any) {
    console.error('保存角色失败:', e)
    message.error(e?.message || t('plugins.characters.form.saveFailed'))
  } finally {
    saving.value = false
  }
}

/** 由中文/任意名称生成一个兜底 code（时间戳保证唯一） */
function slug(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${base || 'custom-role'}-${Date.now().toString(36)}`
}
</script>

<style scoped>
.cf-form { display: flex; flex-direction: column; }

.cf-section + .cf-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.cf-section-head { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
.cf-section-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.cf-section-title { font-size: 13.5px; font-weight: 700; color: var(--el-text-color-primary); }

.cf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
}
.cf-full { width: 100%; }
.cf-hint { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.6; }
.cf-prompt { font-size: 13px; }

.cf-form :deep(.el-form-item) { margin-bottom: 15px; }
.cf-form :deep(.el-form-item__label) {
  font-size: 12.5px; font-weight: 600; color: var(--el-text-color-regular);
  padding-bottom: 6px; line-height: 1.4;
}
.cf-form :deep(.el-input__wrapper),
.cf-form :deep(.el-textarea__inner),
.cf-form :deep(.el-select__wrapper) {
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
}
.cf-form :deep(.el-input__wrapper.is-focus),
.cf-form :deep(.el-textarea__inner:focus),
.cf-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px var(--el-color-primary-light-9);
}

.cf-footer { display: flex; justify-content: flex-end; gap: 10px; }
/* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
.cf-btn { border-radius: var(--el-radius-lg, 12px); }
.cf-btn:not(.el-button--primary) {
  background: var(--el-bg-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-regular);
}
.cf-btn:not(.el-button--primary):hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
</style>
