<template>
  <div class="flex-1">
    <!-- 主题模式 -->
    <SettingsCard title="主题模式">
      <SettingsRow label="显示模式" description="选择浅色、深色或跟随系统主题">
        <SegmentedToggle
          :model-value="themeMode"
          :options="themeOptions"
          @update:model-value="setTheme($event as ThemeMode)"
        />
      </SettingsRow>
      <SettingsRow
        label="配色主题"
        :description="`浅色/深色可分别设置，当前：${isDark ? '深色' : '浅色'}`"
        control-width="208px"
      >
        <el-select
          v-model="selectedThemePreset"
          @change="handleThemePresetChange"
          placeholder="选择主题"
        >
          <el-option
            v-for="theme in themePresetList"
            :key="theme.id"
            :label="themeName(theme)"
            :value="theme.id"
          >
            <div class="flex items-center gap-2">
              <span class="inline-block w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: theme.primaryColor }" />
              <span class="inline-block w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: theme.secondaryColor }" />
              <span>{{ themeName(theme) }}</span>
            </div>
          </el-option>
          <template #prefix>
            <span v-if="currentThemeInfo" class="inline-block w-3 h-3 rounded-full shrink-0"
              :style="{ backgroundColor: currentThemeInfo.primaryColor }" />
          </template>
        </el-select>
      </SettingsRow>
    </SettingsCard>

    <!-- 背景壁纸 -->
    <SettingsCard title="背景壁纸">
      <SettingsRow label="自定义壁纸" description="上传一张图片作为应用背景，支持 JPG、PNG、WebP 格式" stack>
        <!-- 壁纸预览 -->
        <div v-if="previewUrl" class="wall-preview">
          <img :src="previewUrl" class="wall-img" />
          <div class="wall-overlay">
            <el-button type="danger" @click="handleRemoveWallpaper">
              <el-icon class="mr-1"><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
        <!-- 上传区 -->
        <el-upload
          v-else
          ref="uploadRef"
          class="wallpaper-uploader"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept="image/jpeg,image/png,image/webp"
        >
          <div class="wall-dropzone">
            <el-icon class="wall-drop-ico"><Plus /></el-icon>
            <span class="wall-drop-text">点击或拖拽上传壁纸</span>
          </div>
        </el-upload>
      </SettingsRow>
    </SettingsCard>

    <!-- 透明度调节（仅有壁纸时） -->
    <SettingsCard v-if="previewUrl" title="透明度调节">
      <SettingsRow label="侧边栏透明度" description="调节侧边栏背景的不透明度" control-width="200px">
        <div class="slider-line">
          <el-slider v-model="settingsForm.sidebarOpacity" :min="0" :max="100" :step="1"
            class="flex-1" @change="handleOpacityChange" />
          <span class="slider-val">{{ settingsForm.sidebarOpacity }}%</span>
        </div>
      </SettingsRow>
      <SettingsRow label="内容区透明度" description="调节主内容区域背景的不透明度" control-width="200px">
        <div class="slider-line">
          <el-slider v-model="settingsForm.contentOpacity" :min="0" :max="100" :step="1"
            class="flex-1" @change="handleOpacityChange" />
          <span class="slider-val">{{ settingsForm.contentOpacity }}%</span>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- 毛玻璃效果（仅有壁纸时） -->
    <SettingsCard v-if="previewUrl" title="毛玻璃效果">
      <SettingsRow label="启用毛玻璃效果" description="为背景添加毛玻璃模糊效果">
        <el-switch v-model="settingsForm.acrylicEnabled" @change="handleAcrylicChange" />
      </SettingsRow>
      <SettingsRow label="模糊程度" description="调节背景壁纸的模糊半径" control-width="200px">
        <div class="slider-line">
          <el-slider v-model="settingsForm.blurRadius" :min="0" :max="50" :step="1"
            class="flex-1" @change="handleBlurChange" />
          <span class="slider-val">{{ settingsForm.blurRadius }}px</span>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- 悬浮任务状态 -->
    <SettingsCard title="悬浮任务状态">
      <SettingsRow label="显示悬浮窗" description="最小化到托盘时显示任务运行和未读统计">
        <el-switch v-model="settingsForm.floatWidgetEnabled" @change="handleFloatWidgetChange" />
      </SettingsRow>
      <SettingsRow label="悬浮窗透明度" description="调节悬浮窗卡片的不透明度" control-width="200px">
        <div class="slider-line">
          <el-slider v-model="settingsForm.floatWidgetOpacity" :min="30" :max="100" :step="1"
            class="flex-1" @change="handleFloatWidgetChange" />
          <span class="slider-val">{{ settingsForm.floatWidgetOpacity }}%</span>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- 重置 -->
    <div class="flex justify-end mt-5">
      <el-button @click="handleReset">恢复默认设置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, onMounted, watch, markRaw, computed } from 'vue'
import { ElUpload, ElSlider, ElSwitch, ElButton, ElIcon, ElSelect, ElOption } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue'
import { WeatherSunny20Regular, WeatherMoon20Filled, Desktop16Regular } from '@vicons/fluent'
import { useDebounceFn } from '@vueuse/core'
import { apiService } from '@/services/ApiService'
import { useLayoutStore } from '@/stores/layout'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import { themePresets, type ThemePresetInfo } from '@/themes'
import { useI18n } from 'vue-i18n'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import SegmentedToggle from '../ui/SegmentedToggle.vue'

const { t } = useI18n()

// 主题名称：内置主题用 i18n key，外部插件用 name 字段
function themeName(theme: ThemePresetInfo): string {
  return theme.nameKey ? t(theme.nameKey) : theme.name
}

const layoutStore = useLayoutStore()
const { themeMode, setTheme, isDark, activeThemePreset, setActiveThemePreset,
        setLightThemePreset, setDarkThemePreset } = useTheme()

// 主题预设
const themePresetList = themePresets
// 下拉绑定当前生效的预设（浅色/暗色自动切换）
const selectedThemePreset = ref<string>(activeThemePreset.value)
const currentThemeInfo = computed<ThemePresetInfo | undefined>(() =>
  themePresets.find(t => t.id === selectedThemePreset.value)
)

// 显示模式切换时，下拉同步到对应模式的预设
watch(activeThemePreset, (val) => {
  selectedThemePreset.value = val
})

const handleThemePresetChange = (val: string) => {
  setActiveThemePreset(val)
  handleSave()
}

const themeOptions = computed(() => [
  { label: t('settings.appearance.light'), value: 'light' as ThemeMode, icon: markRaw(WeatherSunny20Regular) },
  { label: t('settings.appearance.dark'), value: 'dark' as ThemeMode, icon: markRaw(WeatherMoon20Filled) },
  { label: t('settings.appearance.system'), value: 'system' as ThemeMode, icon: markRaw(Desktop16Regular) },
])

// 表单数据
const settingsForm = reactive({
  sidebarOpacity: 100,
  contentOpacity: 100,
  acrylicEnabled: true,
  blurRadius: 20,
  floatWidgetEnabled: false,
  floatWidgetOpacity: 95,
})

const previewUrl = ref<string | null>(null)
const uploadRef = ref<InstanceType<typeof ElUpload> | null>(null)

/**
 * 将相对路径拼接为完整 URL（用于预览和显示）
 * 根据当前 apiService.baseURL 动态拼接，适配 Electron 随机端口
 */
const resolveWallpaperUrl = (storedUrl: string | null): string | null => {
  if (!storedUrl) return null
  if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) {
    return storedUrl
  }
  const baseUrl = apiService.baseURL.replace(/\/api\/v1$/, '')
  return `${baseUrl}${storedUrl.startsWith('/') ? '' : '/'}${storedUrl}`
}

/**
 * 从完整 URL 中提取相对路径（用于保存到后端）
 */
const extractRelativePath = (fullUrl: string | null): string | null => {
  if (!fullUrl) return null
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    return fullUrl
  }
  try {
    const url = new URL(fullUrl)
    return url.pathname
  } catch {
    return fullUrl
  }
}

// 防抖保存（300ms）
const debouncedSave = useDebounceFn(async () => {
  await handleSave()
}, 300)

// 监听透明度/模糊程度变化自动保存（仅在有壁纸时生效）
watch(
  () => [settingsForm.sidebarOpacity, settingsForm.contentOpacity, settingsForm.blurRadius],
  () => {
    if (previewUrl.value) {
      debouncedSave()
    }
  },
)

// 加载外观设置
const loadSettings = async () => {
  try {
    const response = await apiService.fetchGroupSettings('appearance')

    settingsForm.sidebarOpacity = response.sidebarOpacity ?? 100
    settingsForm.contentOpacity = response.contentOpacity ?? 100
    settingsForm.acrylicEnabled = response.acrylicEnabled !== false
    settingsForm.blurRadius = response.blurRadius ?? 20
    settingsForm.floatWidgetEnabled = response.floatWidgetEnabled === true
    settingsForm.floatWidgetOpacity = response.floatWidgetOpacity ?? 95
    previewUrl.value = resolveWallpaperUrl(response.wallpaperUrl || null)

    // 同步主题预设（后端优先，覆盖本地 localStorage）
    if (response.lightThemePreset) {
      setLightThemePreset(response.lightThemePreset)
    }
    if (response.darkThemePreset) {
      setDarkThemePreset(response.darkThemePreset)
    }
    selectedThemePreset.value = activeThemePreset.value

    // 同步到 layout store
    syncToLayoutStore()
    // 同步到 Electron 主进程
    pushFloatWidgetSettings()
  } catch (error) {
    console.error('获取外观设置失败:', error)
    // 使用默认值
  }
}

// 同步表单数据到 layout store
const syncToLayoutStore = () => {
  layoutStore.setSidebarOpacity(settingsForm.sidebarOpacity)
  layoutStore.setContentOpacity(settingsForm.contentOpacity)
  layoutStore.setAcrylicEnabled(settingsForm.acrylicEnabled)
  layoutStore.setBlurRadius(settingsForm.blurRadius)
  layoutStore.setWallpaperUrl(previewUrl.value)
  layoutStore.setFloatWidgetEnabled(settingsForm.floatWidgetEnabled)
  layoutStore.setFloatWidgetOpacity(settingsForm.floatWidgetOpacity)
}

// 保存设置
const handleSave = async () => {
  try {
    const { lightThemePreset, darkThemePreset } = useTheme()
    const dataToSave = {
      sidebarOpacity: settingsForm.sidebarOpacity,
      contentOpacity: settingsForm.contentOpacity,
      acrylicEnabled: settingsForm.acrylicEnabled,
      blurRadius: settingsForm.blurRadius,
      wallpaperUrl: extractRelativePath(previewUrl.value),
      floatWidgetEnabled: settingsForm.floatWidgetEnabled,
      floatWidgetOpacity: settingsForm.floatWidgetOpacity,
      lightThemePreset: lightThemePreset.value,
      darkThemePreset: darkThemePreset.value,
    }

    await apiService.updateGroupSettings('appearance', dataToSave)

    // 同步到 layout store
    syncToLayoutStore()
    // 同步到 Electron 主进程
    pushFloatWidgetSettings()
  } catch (error: any) {
    console.error('保存外观设置失败:', error)
    message.error('保存失败: ' + (error.message || '未知错误'))
  }
}

// 处理文件选择
const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw as File
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.error('不支持的文件类型，请上传 JPG、PNG 或 WebP 格式图片')
    return
  }

  // 验证文件大小（最大 10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    message.error('图片大小不能超过 10MB')
    return
  }

  try {
    const response = await apiService.uploadWallpaper(file)
    previewUrl.value = resolveWallpaperUrl(extractRelativePath(response.url))
    await handleSave()
    message.success('壁纸上传成功')
  } catch (error: any) {
    console.error('壁纸上传失败:', error)
    message.error('壁纸上传失败: ' + (error.message || '未知错误'))
  }
}

// 删除壁纸
const handleRemoveWallpaper = async () => {
  try {
    await apiService.deleteWallpaper()
    previewUrl.value = null
    await handleSave()
    message.success('壁纸已删除')
  } catch (error: any) {
    console.error('壁纸删除失败:', error)
    message.error('壁纸删除失败: ' + (error.message || '未知错误'))
  }
}

// 透明度变化实时同步到 layout store
const handleOpacityChange = () => {
  layoutStore.setSidebarOpacity(settingsForm.sidebarOpacity)
  layoutStore.setContentOpacity(settingsForm.contentOpacity)
}

// 毛玻璃开关变化
const handleAcrylicChange = () => {
  layoutStore.setAcrylicEnabled(settingsForm.acrylicEnabled)
  handleSave()
}

// 模糊程度变化
const handleBlurChange = () => {
  layoutStore.setBlurRadius(settingsForm.blurRadius)
}

/**
 * 推送悬浮窗设置到 Electron 主进程
 */
const pushFloatWidgetSettings = () => {
  window.electronAPI?.updateTraySettings({
    enabled: settingsForm.floatWidgetEnabled,
    opacity: settingsForm.floatWidgetOpacity,
  })
}

/**
 * 悬浮任务窗设置变化（开关 / 透明度）
 */
const handleFloatWidgetChange = () => {
  layoutStore.setFloatWidgetEnabled(settingsForm.floatWidgetEnabled)
  layoutStore.setFloatWidgetOpacity(settingsForm.floatWidgetOpacity)
  handleSave()
}

// 恢复默认设置
const handleReset = async () => {
  settingsForm.sidebarOpacity = 100
  settingsForm.contentOpacity = 100
  settingsForm.acrylicEnabled = true
  settingsForm.blurRadius = 20
  settingsForm.floatWidgetEnabled = false
  settingsForm.floatWidgetOpacity = 95

  // 重置主题预设
  setLightThemePreset('default')
  setDarkThemePreset('default')
  selectedThemePreset.value = 'default'

  if (previewUrl.value) {
    try {
      await apiService.deleteWallpaper()
    } catch (error) {
      console.error('删除壁纸失败:', error)
    }
    previewUrl.value = null
  }

  await handleSave()
  message.success('已恢复默认设置')
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.wallpaper-uploader :deep(.el-upload) { width: 100%; }

/* 壁纸预览 */
.wall-preview {
  position: relative; width: 100%; height: 160px;
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px); overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}
.wall-img { width: 100%; height: 100%; object-fit: cover; }
.wall-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  /* 盖在壁纸预览图上的浮层蒙版，保留压暗效果但改为跟随主题前景色 */
  background: color-mix(in srgb, var(--el-text-color-primary) 32%, transparent); opacity: 0;
  transition: opacity 0.18s ease;
}
.wall-preview:hover .wall-overlay { opacity: 1; }

/* 上传拖放区 */
.wall-dropzone {
  width: 100%; height: 160px;
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  border: 1.5px dashed var(--el-border-color);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.18s ease;
}
.wall-dropzone:hover { border-color: var(--el-color-primary); }
.wall-drop-ico { font-size: 28px; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.wall-drop-text { font-size: 13px; color: var(--el-text-color-secondary); }

/* 滑杆行 */
.slider-line { display: flex; align-items: center; gap: 12px; width: 100%; }
.slider-val {
  width: 42px; text-align: right; font-size: 12.5px;
  color: var(--el-text-color-regular); flex-shrink: 0;
}

/* 动效降级：系统开启「减少动态效果」时，预览蒙版与拖放区虚线框改为瞬间切换。
   逐个列出，不写 `*` / .wall-preview * 通配，
   避免把 el-upload / el-slider 内部 Element Plus 组件的合法过渡一起掐掉。
   蒙版的 opacity: 0 与悬停时的 1、拖放区的虚线变色都是静态声明，
   停掉过渡后「悬停出现蒙版」「拖放区高亮」照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .wall-overlay,
  .wall-dropzone {
    transition: none;
  }
}
</style>
