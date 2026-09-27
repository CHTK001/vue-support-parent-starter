<template>
  <el-dialog
    v-model="visible"
    title="人脸登记"
    width="640px"
    append-to-body
    :close-on-click-modal="false"
    class="fe-dialog"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" label-position="right">
      <el-form-item label="人脸照片" prop="photo">
        <div class="fe-photo">
          <img v-if="form.photo" :src="form.photo" class="fe-photo-img" alt="人脸照片" />
          <div v-else class="fe-photo-empty">
            <el-icon :size="26"><Picture /></el-icon>
            <span>未选择</span>
          </div>
          <div class="fe-photo-ops">
            <el-button size="small" @click="pickPhoto">
              <el-icon><FolderOpened /></el-icon>{{ form.photo ? '重新选择' : '选择照片' }}
            </el-button>
            <el-button v-if="form.photo" size="small" text @click="form.photo = ''">清除</el-button>
          </div>
        </div>
        <p class="fe-tip">正面清晰单人照效果最好；登记后可在人脸识别页做 1:N 相似匹配</p>
      </el-form-item>

      <div class="fe-row">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="真实姓名或昵称" maxlength="24" />
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="form.age" :min="0" :max="120" :controls="false" style="width: 100%" placeholder="0-120" />
        </el-form-item>
      </div>

      <div class="fe-row">
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
            <el-radio value="未知">未知</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发型" prop="hair">
          <el-select v-model="form.hair" placeholder="选择发型" clearable filterable allow-create style="width: 100%">
            <el-option v-for="h in HAIR_OPTIONS" :key="h" :label="h" :value="h" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="身份证号" prop="idCard">
        <el-input v-model="form.idCard" placeholder="18 位身份证号" maxlength="18" />
        <p class="fe-tip">
          <el-icon><Warning /></el-icon>
          属敏感个人信息，页面展示一律脱敏（{{ maskedIdCard || '—' }}）；请确认所在地法律允许留存
        </p>
      </el-form-item>

      <el-form-item label="上镜感" prop="photogenic">
        <el-rate v-model="form.photogenic" :max="5" :texts="RATE_TEXTS" show-text />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.note" type="textarea" :rows="2" maxlength="120" show-word-limit placeholder="选填，如来源、用途说明" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交登记</el-button>
    </template>

    <input ref="fileInput" type="file" accept="image/*" class="fe-hidden" @change="onPhotoPicked" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { FolderOpened, Picture, Warning } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { useFaceRegistry, isValidIdCard, maskIdCard, type FaceRecord } from '@/composables/useFaceRegistry'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'enrolled', record: FaceRecord): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const HAIR_OPTIONS = ['短发', 'bob', '长发', '卷发', '直发', '马尾', '寸头', '光头', '盘发']
const RATE_TEXTS = ['很差', '偏差', '一般', '不错', '很上镜']

const formRef = ref<FormInstance>()
const fileInput = ref<HTMLInputElement | null>(null)
const submitting = ref(false)
const { upsert } = useFaceRegistry()

const form = reactive({
  photo: '',
  name: '',
  age: null as number | null,
  gender: '未知',
  hair: '',
  idCard: '',
  photogenic: 3,
  note: '',
})

const maskedIdCard = computed(() => maskIdCard(form.idCard))

const rules: FormRules = {
  photo: [{ required: true, message: '请选择人脸照片', trigger: 'change' }],
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  age: [{ required: true, message: '请填写年龄', trigger: 'change' }],
  idCard: [
    {
      // 身份证选填；填了才校验格式，避免逼着用户填敏感信息
      validator: (_r, v: string, cb: (e?: Error) => void) => {
        if (!v || !String(v).trim()) return cb()
        return isValidIdCard(v) ? cb() : cb(new Error('身份证号格式不正确（18 位，末位可为 X）'))
      },
      trigger: 'blur',
    },
  ],
}

function pickPhoto() {
  fileInput.value?.click()
}

function onPhotoPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) form.photo = URL.createObjectURL(f)
  input.value = ''
}

/** 提交：调 /v2/face/enroll，档案同时落前端登记簿 */
async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    const id = `face-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const blob = await (await fetch(form.photo)).blob()
    // metadata 会随向量一起存进后端，1:N 命中时原样回传
    const metadata = {
      label: form.name,
      name: form.name,
      age: form.age,
      gender: form.gender,
      hair: form.hair,
      idCard: form.idCard,
      photogenic: form.photogenic,
      note: form.note,
    }
    await apiService.enrollFace(id, blob, metadata, 'enroll.png')

    upsert({
      id,
      name: form.name,
      age: form.age,
      gender: form.gender,
      hair: form.hair,
      idCard: form.idCard,
      photogenic: form.photogenic,
      note: form.note,
      thumb: form.photo,
      enrolledAt: Date.now(),
    })
    emit('enrolled', { id, name: form.name, age: form.age, gender: form.gender, hair: form.hair, idCard: form.idCard, photogenic: form.photogenic, note: form.note, thumb: form.photo, enrolledAt: Date.now() })
    ElMessage.success(`已登记：${form.name}`)
    visible.value = false
    reset()
  } catch (e: any) {
    ElMessage.error(`登记失败：${e?.message ?? e}`)
  } finally {
    submitting.value = false
  }
}

function reset() {
  form.photo = ''
  form.name = ''
  form.age = null
  form.gender = '未知'
  form.hair = ''
  form.idCard = ''
  form.photogenic = 3
  form.note = ''
}
</script>

<style scoped>
.fe-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.fe-photo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.fe-photo-img,
.fe-photo-empty {
  width: 96px;
  height: 96px;
  border-radius: var(--mp-radius, 11px);
  object-fit: cover;
  border: 1px solid var(--color-surface-border);
  background: var(--color-surface-hover);
}

.fe-photo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--color-text-gray);
  font-size: 12px;
}

.fe-photo-ops {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fe-tip {
  margin: 6px 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-gray);
}

.fe-hidden {
  display: none;
}
</style>
