<template>
  <div class="flex-1 overflow-hidden">
    <div class="space-y-8">
      <!-- AI 检测设置分组 -->
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">AI 检测配置</h3>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-(--color-surface) overflow-hidden">
          <!-- 文本检测开关 -->
          <div class="px-4 py-3.5 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800">
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-base text-gray-900 dark:text-gray-100">文本 AI 检测</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">关闭后「AI 检测」页的文本检测入口返回未启用提示</span>
            </div>
            <el-switch v-model="settingsForm.textEnabled" class="shrink-0" />
          </div>

          <!-- 文本判定阈值 -->
          <div class="px-4 py-3.5 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800">
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-base text-gray-900 dark:text-gray-100">文本判定阈值</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">评分达到该值（0~100）判定为「很可能 AI 生成」，默认 60</span>
            </div>
            <ReNumberInput v-model="settingsForm.textThreshold" :min="0" :max="100" placeholder="60" class="shrink-0" />
          </div>

          <!-- 图片检测开关 -->
          <div class="px-4 py-3.5 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800">
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-base text-gray-900 dark:text-gray-100">图片 AI 检测</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">关闭后「AI 检测」页的图片检测入口返回未启用提示</span>
            </div>
            <el-switch v-model="settingsForm.imageEnabled" class="shrink-0" />
          </div>

          <!-- 图片大小上限 -->
          <div class="px-4 py-3.5 flex items-center justify-between gap-4">
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-base text-gray-900 dark:text-gray-100">图片大小上限（MB）</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">单张图片超过该大小拒绝检测；0 表示不限制，默认 20</span>
            </div>
            <ReNumberInput v-model="settingsForm.imageMaxSizeMb" :min="0" :max="500" placeholder="20" class="shrink-0" />
          </div>

          <!-- 提示信息 -->
          <div class="px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>文本检测为纯统计特征分析（不依赖模型）；图片检测基于元数据（C2PA 凭证 / XMP / EXIF / 生成参数块）。</div>
              <div>修改后立即生效，无需重启服务。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { apiService } from '@/services/ApiService'
import { usePopup } from '@/composables/usePopup'
import ReNumberInput from '@/components/ui/ReNumberInput.vue'

const { notify } = usePopup()

// 表单数据（detect 分组的四个字段）
const settingsForm = reactive({
  textEnabled: true,
  textThreshold: 60,
  imageEnabled: true,
  imageMaxSizeMb: 20,
})

// 原始设置备份，用于对比是否有改动
const originalSettings = ref<any>(null)

// 计算是否有改动
const hasChanges = computed(() => {
  if (!originalSettings.value) return false
  return JSON.stringify(settingsForm) !== JSON.stringify(originalSettings.value)
})

// 自动保存（防抖 300ms）
const debouncedSave = useDebounceFn(async () => {
  if (!hasChanges.value) return
  await handleSave()
}, 300)

// 监听设置变化自动保存
watch(() => ({
  textEnabled: settingsForm.textEnabled,
  textThreshold: settingsForm.textThreshold,
  imageEnabled: settingsForm.imageEnabled,
  imageMaxSizeMb: settingsForm.imageMaxSizeMb,
}), () => {
  debouncedSave()
}, { deep: true })

// 加载 detect 分组设置
const loadSettings = async () => {
  try {
    const response = await apiService.fetchGroupSettings('detect')

    // GET 返回的键是 SPI 字段名原样（snake_case），布尔值在库里是字符串，做一次宽容归一化
    settingsForm.textEnabled = toBool(response.text_enabled, true)
    settingsForm.textThreshold = toNumber(response.text_threshold, 60, 0, 100)
    settingsForm.imageEnabled = toBool(response.image_enabled, true)
    settingsForm.imageMaxSizeMb = toNumber(response.image_max_size_mb, 20, 0, 500)

    // 备份原始数据
    originalSettings.value = JSON.parse(JSON.stringify(settingsForm))
  } catch (error) {
    console.error('获取 AI 检测设置失败:', error)
    // detect 分组可能尚未初始化，使用默认值
    originalSettings.value = JSON.parse(JSON.stringify(settingsForm))
  }
}

// 保存设置
const handleSave = async () => {
  try {
    await apiService.updateGroupSettings('detect', {
      text_enabled: settingsForm.textEnabled,
      text_threshold: settingsForm.textThreshold,
      image_enabled: settingsForm.imageEnabled,
      image_max_size_mb: settingsForm.imageMaxSizeMb,
    })

    // 保存成功后更新原始数据备份
    originalSettings.value = JSON.parse(JSON.stringify(settingsForm))

    notify.success('保存成功', 'AI 检测配置已更新')
  } catch (error: any) {
    console.error('保存 AI 检测设置失败:', error)
    notify.error('保存失败', error.message || '未知错误')
  }
}

/** 布尔归一化：兼容 true/"true"/"1"/1 */
function toBool(v: any, def: boolean): boolean {
  if (v === true) return true
  if (v === false || v == null) return def === false ? false : v === true
  const s = String(v).trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(s)) return true
  if (['false', '0', 'no', 'off'].includes(s)) return false
  return def
}

/** 数字归一化并夹取范围 */
function toNumber(v: any, def: number, min: number, max: number): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  return Math.min(max, Math.max(min, Math.round(n)))
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>
