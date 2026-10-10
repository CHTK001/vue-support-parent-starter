<template>
  <ReDialog
    v-model="visible"
    :title="dialogTitle"
    width="640px"
    append-to-body
    :close-on-click-modal="false"
    class="fe-dialog"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" label-position="right">
      <el-form-item label="人脸照片" prop="photo">
        <!--
          拖拽上传区：点击选图 + 拖放落图，不再配「选择照片 / 重新选择」按钮。
          清除只留右上角一个图标入口（不是操作按钮行）—— 否则选错照片就没法去掉。
        -->
        <div
          class="fe-drop"
          :class="{ 'is-dragover': dragover, 'has-photo': !!form.photo }"
          @click="pickPhoto"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
          @drop.prevent="onDrop"
        >
          <img v-if="form.photo" :src="form.photo" class="fe-photo-img" alt="人脸照片" />
          <div v-else class="fe-photo-empty">
            <el-icon :size="26"><UploadFilled /></el-icon>
            <span>点击选择，或把照片拖到这里</span>
          </div>
          <span
            v-if="form.photo"
            class="fe-drop-clear"
            title="清除照片"
            @click.stop="form.photo = ''"
          >
            <el-icon><Close /></el-icon>
          </span>
        </div>
        <p class="fe-tip">正面清晰单人照效果最好；登记后可在人脸识别页做 1:N 相似匹配</p>
      </el-form-item>

      <!-- 两列用 el-row/el-col 而不是自定义 grid：栅格由 Element 统一算宽度与换行，
           同一行两个控件的 label 与 content 天然对齐（此前自定义 grid 下
           radio-group 与 select 高度不同会左右错位）。 -->
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="真实姓名或昵称" maxlength="24" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="年龄" prop="age">
            <!-- 换 ReInputNumber：el-input-number 在本主题下（:controls="false"）没有可见边框，
                 与同排的 el-input 观感不一致；ReInputNumber 是系统统一的数字输入控件。
                 model 与 update 分开绑：表单里 age 的既有语义是 number | null
                 （FaceRecord.age 就是可空），而 ReInputNumber 的 model 是 number | undefined，
                 这里显式做一次映射，不为了迁就控件去改 age 的对外语义。 -->
            <ReInputNumber
              :model-value="form.age ?? undefined"
              :min="0"
              :max="120"
              placeholder="0-120"
              style="width: 100%"
              @update:model-value="form.age = $event ?? null"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio value="男">男</el-radio>
              <el-radio value="女">女</el-radio>
              <el-radio value="未知">未知</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发型" prop="hair">
            <el-select v-model="form.hair" placeholder="选择发型" clearable filterable allow-create style="width: 100%">
              <el-option v-for="h in HAIR_OPTIONS" :key="h" :label="h" :value="h" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

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
      <el-button type="primary" :loading="submitting" @click="submit">{{ isEdit ? '保存修改' : '提交登记' }}</el-button>
    </template>

    <input ref="fileInput" type="file" accept="image/*" class="fe-hidden" @change="onPhotoPicked" />
  </ReDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Close, UploadFilled, Warning } from '@element-plus/icons-vue'
// 系统统一的数字输入控件（自带边框，与 el-input 观感一致）
import ReInputNumber from '@repo/ui/re-input-number'
import { apiService } from '@/services/ApiService'
import { useFaceRegistry, isValidIdCard, maskIdCard, type FaceRecord } from '@/composables/useFaceRegistry'


import ReDialog from '@repo/ui/re-dialog';const props = defineProps<{ modelValue: boolean; record?: FaceRecord | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'enrolled', record: FaceRecord): void }>()

/**
 * 编辑模式：传入 record 即为「改档案」，此时**不要求重传照片**、也不重跑检测。
 *
 * <p>为什么要有这个模式：`enroll` 需要图片，而「只改姓名/年龄/身份证」不该要求
 * 重新上传照片 —— 原照片可能已不在本地（缩略图只在登记它的浏览器里），
 * 强行要求重传会把一次纯文本修改卡死。</p>
 */
const isEdit = computed(() => !!props.record)
const dialogTitle = computed(() => (isEdit.value ? '编辑人脸信息' : '人脸登记'))

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const HAIR_OPTIONS = ['短发', 'bob', '长发', '卷发', '直发', '马尾', '寸头', '光头', '盘发']
const RATE_TEXTS = ['很差', '偏差', '一般', '不错', '很上镜']

const formRef = ref<FormInstance>()
const fileInput = ref<HTMLInputElement | null>(null)
const submitting = ref(false)
/** 拖拽悬停态：仅用于高亮落点，拖离或落下即复位 */
const dragover = ref(false)
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

/**
 * 校验规则。
 *
 * <p>编辑模式下**不要求照片**：档案字段可以独立于照片修改，
 * 而原照片未必还在本地（缩略图只存在登记它的浏览器里）。</p>
 */
const rules = computed<FormRules>(() => ({
  photo: isEdit.value ? [] : [{ required: true, message: '请选择人脸照片', trigger: 'change' }],
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  age: [{ required: true, message: '请填写年龄', trigger: 'change' }],
  idCard: [
    // 身份证改为必填（业务要求：档案需可实名核验）。
    // 两条规则必须分开：required 管「没填」，格式 validator 只管「填了但格式不对」。
    // 合成一个 validator 的话，空值分支 return cb() 会同时放行「未填」——
    // 即必填判定被自己的空值短路绕过去。
    { required: true, message: '请填写身份证号', trigger: 'blur' },
    {
      validator: (_r, v: string, cb: (e?: Error) => void) => {
        if (!v || !String(v).trim()) return cb()
        return isValidIdCard(v) ? cb() : cb(new Error('身份证号格式不正确（18 位，末位可为 X）'))
      },
      trigger: 'blur',
    },
  ],
}))

/**
 * 打开时按模式初始化表单：编辑模式预填 record，登记模式清空。
 *
 * <p>用 watch 而不是 onMounted：弹窗是同一个实例反复打开的，
 * 每次打开都要按当次的 record 重置，否则会串上一次的数据。</p>
 */
watch(
  () => [props.modelValue, props.record] as const,
  ([open]) => {
    if (!open) return
    if (props.record) {
      const r = props.record
      form.photo = r.thumb || ''
      form.name = r.name || ''
      form.age = r.age ?? null
      form.gender = r.gender || '未知'
      form.hair = r.hair || ''
      form.idCard = r.idCard || ''
      form.photogenic = r.photogenic ?? 3
      form.note = r.note || ''
    } else {
      reset()
    }
    // 打开后清掉上一次的校验痕迹
    nextTick(() => formRef.value?.clearValidate())
  },
)

function pickPhoto() {
  fileInput.value?.click()
}

function onPhotoPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) void setPhoto(f)
  input.value = ''
}

/**
 * 拖放落图。
 *
 * <p>只取第一个文件，且必须是图片类型 —— 拖进来一个 .txt 或文件夹时
 * 静默忽略，不要走 setPhoto（FileReader 读非图片会得到无法渲染的 dataURL，
 * 表现为「照片区变成一块空白」而不是明确报错）。</p>
 *
 * @param e 拖放事件
 */
function onDrop(e: DragEvent) {
  dragover.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f && f.type.startsWith('image/')) void setPhoto(f)
}

/**
 * 读成 dataURL 而不是 objectURL。
 *
 * <p>档案要落 localStorage，而 objectURL 生命周期跟当前文档绑定，
 * 一刷新就失效，相册和推荐卡头像会全变空白；dataURL 才能长期保存。</p>
 */
function setPhoto(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    form.photo = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
}

/** 提交：登记走 /v2/face/enroll；编辑走 PUT /v2/face/{id}（只改档案） */
async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
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

    if (isEdit.value && props.record) {
      // 编辑：只改档案，不重跑检测、不动向量；照片保持不变
      const id = props.record.id
      const okUpd = await apiService.updateFace(id, metadata)
      if (!okUpd) {
        ElMessage.error('更新失败：底库未确认更新')
        return
      }
      const updated: FaceRecord = {
        ...props.record,
        name: form.name,
        age: form.age,
        gender: form.gender,
        hair: form.hair,
        idCard: form.idCard,
        photogenic: form.photogenic,
        note: form.note,
      }
      upsert(updated)
      emit('enrolled', updated)
      ElMessage.success(`已更新：${form.name}`)
      visible.value = false
      return
    }

    const id = `face-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const blob = await (await fetch(form.photo)).blob()
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
    ElMessage.error(`${isEdit.value ? '更新' : '登记'}失败：${e?.message ?? e}`)
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
/* 拖拽上传区：整块可点、可拖放。未选图时虚线框，选中后只展示照片。
   两列布局交给 el-row/el-col，这里不再保留自定义 grid（原 .fe-row 已移除）。 */
.fe-drop {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: var(--el-border-radius-base, 6px);
  border: 1px dashed var(--el-border-color);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: border-color var(--el-transition-duration), background-color var(--el-transition-duration);
}

.fe-drop:hover,
.fe-drop.is-dragover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.fe-drop.has-photo {
  border-style: solid;
  border-color: var(--el-border-color-lighter);
}

.fe-photo-img,
.fe-photo-empty {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.fe-photo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

/* 清除入口：右上角图标，不是按钮行 —— 仅补一个「选错了能去掉」的操作 */
.fe-drop-clear {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #fff;
  background: color-mix(in srgb, var(--el-text-color-primary) 55%, transparent);
  opacity: 0;
  transition: opacity var(--el-transition-duration);
}

.fe-drop:hover .fe-drop-clear {
  opacity: 1;
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
