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
        <p class="fe-tip">
          <span class="fe-tip-text">
            仅支持<strong>单人脸</strong>登记：多脸照片会被拒绝，请先裁剪到只含目标人脸。
            照片需 <strong>≤ 10 MB</strong> 且短边 <strong>≥ 100px</strong>；正面清晰无遮挡效果最好。
          </span>
        </p>
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
          <el-form-item label="发型" prop="hair">
            <el-select v-model="form.hair" placeholder="选择发型" clearable filterable allow-create style="width: 100%">
              <el-option v-for="h in HAIR_OPTIONS" :key="h" :label="h" :value="h" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="现居住地" prop="residence">
            <el-input v-model="form.residence" placeholder="当前居住地，选填" maxlength="80" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="11 位手机号，选填" maxlength="11" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="身份证号" prop="idCard">
        <el-input v-model="form.idCard" placeholder="18 位身份证号" maxlength="18" />
        <p class="fe-tip">
          <el-icon class="fe-tip-icon"><Warning /></el-icon>
          <span class="fe-tip-text">
            属敏感个人信息，页面展示一律脱敏（{{ maskedIdCard || '—' }}）；请确认所在地法律允许留存
          </span>
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

    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="fe-hidden"
      @change="onPhotoPicked" />
  </ReDialog>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { type FormInstance, type FormRules } from 'element-plus';
import { Close, UploadFilled, Warning } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { useFaceRegistry, isValidIdCard, isValidPhone, maskIdCard, type FaceRecord } from '@/composables/useFaceRegistry'


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
  residence: '',
  phone: '',
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
  const files = Array.from(e.dataTransfer?.files ?? [])
  const images = files.filter((f) => f.type.startsWith('image/'))
  if (!images.length) {
    message.error('请拖入图片文件')
    return
  }
  if (images.length > 1) {
    message.warning('一次只能登记一张人脸，已取第一张；如需登记多人请分多次操作')
  }
  void setPhoto(images[0])
}

/**
 * 照片准入校验（5.5）。
 *
 * <p>此前**完全没有体积与分辨率校验**：只有 {@code accept="image/*"} 这个选择器提示，
 * 拖放路径更是任何 {@code image/*} 都收。一个几百 KB 的缩略图会被特征模型直接入库，
 * 得到一个识别率极差却毫无提示的向量；反过来手机直出的 12MP 原图会经 base64 膨胀约 33%
 * 再以 multipart 上传，极易顶到 100MB 的服务端上限。</p>
 *
 * <p>下限取 100×100：低于此几乎必然检不出可用人脸（后端检测模型的人脸最小边约 80px），
 * 与其让人等一次必然失败的入库，不如当场拦下。</p>
 */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const MIN_PHOTO_EDGE = 100

/** 校验并读入照片；不合格时给出可执行的提示（说清是哪一项不达标、怎么办） */
function setPhoto(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return
  }
  if (file.size > MAX_PHOTO_BYTES) {
    message.error(`照片过大（${(file.size / 1024 / 1024).toFixed(1)} MB），请压缩到 10 MB 以内再登记`)
    return
  }
  const reader = new FileReader()
  reader.onload = async () => {
    const dataUrl = String(reader.result ?? '')
    const img = new Image()
    img.onload = async () => {
      const { width, height } = img
      if (Math.min(width, height) < MIN_PHOTO_EDGE) {
        message.error(
          `照片分辨率过低（${width}×${height}），人脸特征提取需要短边不小于 ${MIN_PHOTO_EDGE} 像素，` +
          '请换一张更清晰的照片；过小的图即使入库，识别率也会极差',
        )
        return
      }
      // 单脸预检（5.3）：后端原本静默取最大的一张脸，多脸照片会让用户以为
      // 「A 和 B 都登记了」，实际只进了 A。这里提交前先探一次并明确拒绝。
      await assertSingleFace(dataUrl)
      form.photo = dataUrl
    }
    img.onerror = () => message.error('无法解析该图片，请换一张')
    img.src = dataUrl
  }
  reader.onerror = () => message.error('读取图片失败，请重试')
  reader.readAsDataURL(file)
}

/** 多脸提示语：说清检测到几张、后果是什么 */
const faceCount = ref(0)
const checkingFace = ref(false)

/**
 * 单人脸预检：调 {@code POST /v2/face/detect} 探一次脸数。
 *
 * <p>失败不阻断登记 —— 预检只是提前给一个更好的错误信息，真正的兜底在后端
 * （enroll 会拒绝多脸）。若这里因网络/模型问题失败，仍放行给后端判定，
 * 不能因为预检接口不可用就把整个登记功能锁死。</p>
 */
async function assertSingleFace(dataUrl: string): Promise<boolean> {
  checkingFace.value = true
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const res = await apiService.detectFace(blob, 'preview.png')
    // 只读 count：detectFace 的实现已经把返回值收敛成 { count, faces } 两个字段，
    // faceCount 从来不存在，属于写上去就没生效过的死分支。
    const n = Number(res?.count ?? 0)
    faceCount.value = Number.isFinite(n) ? n : 0
    if (faceCount.value > 1) {
      message.error(
        `检测到 ${faceCount.value} 张人脸，人脸底库只支持单人脸登记` +
        '（一张照片只会入库其中一张，容易录错人）。请裁剪到只含目标人脸后重试',
      )
      return false
    }
    if (faceCount.value === 0) {
      message.warning('未在这张照片中检测到人脸，换一张正脸清晰、无遮挡的照片再试')
      return false
    }
    return true
  } catch (e: any) {
    // 预检失败不拦截：交给后端 enroll 判定
    faceCount.value = 0
    return true
  } finally {
    checkingFace.value = false
  }
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
        message.error('更新失败：底库未确认更新')
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
      message.success(`已更新：${form.name}`)
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
    message.success(`已登记：${form.name}`)
    visible.value = false
    reset()
  } catch (e: any) {
    message.error(`${isEdit.value ? '更新' : '登记'}失败：${e?.message ?? e}`)
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
