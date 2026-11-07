<template>
  <ReDialog
    v-model="visible"
    title="添加账号"
    width="560px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="acc-form">
      <el-form-item label="所属渠道">
        <span class="form-static">{{ channelName || channelKey }}</span>
      </el-form-item>
      <div class="form-grid">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如 主账号 / 备用" maxlength="128" />
        </el-form-item>
        <el-form-item label="种类">
          <el-select v-model="form.kind" class="w-full">
            <el-option label="API 密钥" value="API_KEY" />
            <el-option label="邮箱账号" value="EMAIL" />
            <el-option label="短信账号" value="SMS" />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="登录名 / 地址">
        <el-input v-model="form.username" placeholder="可选：邮箱 / 手机号 / 用户名" maxlength="255" />
      </el-form-item>
      <el-form-item label="凭据 / 密钥">
        <el-input
          v-model="form.secret"
          type="password"
          show-password
          :placeholder="secretPlaceholder"
          spellcheck="false"
        />
        <span class="form-hint">{{ secretHint }}</span>
      </el-form-item>
      <el-form-item label="服务地址">
        <el-input v-model="form.endpoint" placeholder="可选：API baseUrl / SMTP 主机" maxlength="512" />
      </el-form-item>
    </el-form>

    <template #footer>
      <ReButton @click="visible = false">取消</ReButton>
      <ReButton type="primary" :loading="saving" @click="submit">创建</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 渠道账号新增弹窗。
 *
 * <p>渠道管理只有一种模型：渠道 + 账号。AI 账号渠道与免登录渠道
 * （DuckDuckGo / Trae / Pollinations）都用同一个表单挂账号；
 * 免登录渠道的凭据可留空，服务端只存「有没有配凭据」。</p>
 *
 * <p>与 Cookie 池同口径：凭据只进不出，读接口只回 {@code hasSecret}。</p>
 */
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import { channelApi, type ChannelAccountInput } from '../channelApi'

const props = defineProps<{
  /** 弹窗显隐（v-model） */
  modelValue: boolean
  /** 所属渠道标识（channelKey） */
  channelKey: string
  /** 所属渠道展示名（弹窗里展示用） */
  channelName?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

/** 弹窗显隐双向绑定 */
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const formRef = ref()
const saving = ref(false)

const form = ref<ChannelAccountInput>({
  code: '',
  name: '',
  kind: 'API_KEY',
  channelKey: '',
  username: '',
  secret: '',
  endpoint: '',
  status: 1,
})

/** 校验规则：名称必填；凭据选填（免登录渠道可留空） */
const rules = {
  name: [{ required: true, message: '请填写名称', trigger: 'blur' }],
}

const secretPlaceholder = '留空表示不配置凭据（免登录渠道可留空）'
const secretHint = '写入后会加密存储，读接口只回「是否已配置」。'

/** 打开时重置表单，并把渠道归属带进来 */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    form.value = {
      code: '',
      name: '',
      kind: 'API_KEY',
      channelKey: props.channelKey,
      username: '',
      secret: '',
      endpoint: '',
      status: 1,
    }
  },
  { immediate: true },
)

/** 提交 */
async function submit(): Promise<void> {
  const valid = await formRef.value?.validate?.().catch(() => false)
  if (valid === false) return
  if (!props.channelKey) {
    ElMessage.warning('未选择渠道')
    return
  }
  const stamp = Date.now().toString(36)
  const payload: ChannelAccountInput = {
    ...form.value,
    code: `${props.channelKey}-${stamp}`,
    name: form.value.name.trim(),
    channelKey: props.channelKey,
    username: form.value.username?.trim() || undefined,
    secret: form.value.secret?.trim() || undefined,
    endpoint: form.value.endpoint?.trim() || undefined,
  }
  saving.value = true
  try {
    await channelApi.createAccount(payload)
    ElMessage.success('账号已创建')
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message ?? '创建失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.acc-form {
  padding-top: 4px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}
.form-static {
  font-size: 12.5px;
  color: var(--text-tertiary);
}
.form-hint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-tertiary);
}
.w-full {
  width: 100%;
}
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
