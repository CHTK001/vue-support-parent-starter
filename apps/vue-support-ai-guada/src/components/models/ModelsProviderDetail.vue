<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 详情标题区（固定不滚动） -->
    <div class="shrink-0 flex items-center justify-between gap-4 mb-8 mt-2 px-4 w-full md:max-w-260 md:mx-auto">
      <div class="flex items-center gap-3 min-w-0">
        <el-button link @click="$emit('back')"
          class="flex items-center gap-1 text-gray-900 dark:text-[#e8e9ed] hover:text-(--color-primary) font-medium shrink-0">
          <el-icon :size="20"><ArrowBackIosFilled /></el-icon>
          <span>{{ t('settings.providerDetail.back') }}</span>
        </el-button>
        <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed] truncate">{{ provider?.name }}</h1>
      </div>
      <el-button @click="handleAddModel">
        <template #icon><PlusOutlined /></template>
        {{ t('settings.providerDetail.addModel') }}
      </el-button>
    </div>

    <!-- 内容区（独立滚动，满屏宽度） -->
    <div class="flex-1 overflow-auto" style="scrollbar-gutter: stable both-edges;">
      <div class="px-4 pb-4 w-full md:max-w-260 md:mx-auto">
        <!-- 空状态 -->
        <div v-if="models.length === 0" class="rounded-[var(--size-surface-radius)] border border-(--color-surface-border) bg-(--color-surface) p-12 text-center">
          <el-icon size="48" class="text-gray-300 dark:text-[#3e4046] mb-3">
            <Box16Regular />
          </el-icon>
          <p class="text-lg text-gray-500 dark:text-[#8b8d95]">{{ t('settings.providerDetail.noModels') }}</p>
          <p class="text-sm mt-1 text-gray-400 dark:text-[#6b6d75]">{{ t('settings.providerDetail.noModelsDesc') }}</p>
          <div class="flex justify-center gap-3 mt-6">
            <el-button type="primary" @click="handleAddModel">
              <template #icon><PlusOutlined /></template>
              {{ t('settings.providerDetail.addModel') }}
            </el-button>
          </div>
        </div>

        <!-- 模型列表 -->
        <div v-else class="rounded-[var(--size-surface-radius)] border border-(--color-surface-border) bg-(--color-surface) px-3 py-1 mb-4">
          <ul>
            <li v-for="model in models" :key="model.id"
              class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#2e3035] last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#2a2c30]/50 transition-colors rounded px-3 -mx-3">
              <div class="flex items-center flex-1 min-w-0 mr-4">
                <Avatar class="w-10 h-10 shrink-0 mr-3" :src="getModelAvatarForSetting(model)"
                  :name="getModelDisplayName(model.modelName)" type="assistant" :round="false" />
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-gray-800 dark:text-[#e8e9ed] truncate mb-2">{{
                    getModelDisplayName(model.modelName) }}</div>
                  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-[#8b8d95]">
                    <span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#2a2c30] font-medium">
                      {{ model.modelType === 'text' ? t('settings.providerDetail.chatType') : t('settings.providerDetail.embeddingType') }}
                    </span>
                    <div v-if="model.modelType === 'text'"
                      class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-[#2a2c30] border border-gray-100 dark:border-[#2e3035]">
                      <div class="flex items-center gap-0.5">
                        <template v-for="cap in (model.config?.inputCapabilities || [])" :key="'in-' + cap">
                          <LTooltip :content="t('settings.providerDetail.input') + (cap === 'text' ? t('settings.providerDetail.text') : t('settings.providerDetail.image'))" placement="top">
                            <el-icon class="hover:text-primary transition-colors" :size="16">
                              <TextT24Regular v-if="cap === 'text'" />
                              <Image24Regular v-else-if="cap === 'image'" />
                            </el-icon>
                          </LTooltip>
                        </template>
                      </div>
                      <el-icon class="text-gray-300 dark:text-[#3e4046] mx-0.5" :size="12">
                        <ArrowRight24Regular />
                      </el-icon>
                      <div class="flex items-center gap-0.5">
                        <template v-for="cap in (model.config?.outputCapabilities || [])" :key="'out-' + cap">
                          <LTooltip :content="t('settings.providerDetail.output') + (cap === 'text' ? t('settings.providerDetail.text') : t('settings.providerDetail.image'))" placement="top">
                            <el-icon class="hover:text-primary transition-colors" :size="16">
                              <TextT24Regular v-if="cap === 'text'" />
                              <Image24Regular v-else-if="cap === 'image'" />
                            </el-icon>
                          </LTooltip>
                        </template>
                      </div>
                      <template v-if="(model.config?.features || []).length > 0">
                        <span class="w-px h-3 bg-gray-200 dark:bg-[#2e3035] mx-1"></span>
                        <template v-for="feature in (model.config?.features || [])" :key="feature">
                          <LTooltip :content="getLableName(feature)" placement="top">
                            <el-icon class="hover:text-primary transition-colors" :size="16">
                              <WrenchScrewdriver24Regular v-if="feature === 'tools'" />
                              <LightbulbFilament24Regular v-else-if="feature === 'thinking'" />
                              <ScienceOutlined v-else />
                            </el-icon>
                          </LTooltip>
                        </template>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity shrink-0">
                <el-switch v-model="model.isActive" :active-text="t('common.enabled')" :inactive-text="t('common.disabled')"
                  @change="handleToggleModelActive(model)" inline-prompt size="small" />
                <el-button link style="font-size: 18px; color: var(--el-text-color-secondary)"
                  @click="handleEditClick(model)">
                  <el-icon><SettingsOutlined /></el-icon>
                </el-button>
                <el-button type="danger" link style="font-size: 18px" @click="handleDeleteClick(model)">
                  <el-icon><RemoveCircleOutlineRound /></el-icon>
                </el-button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 编辑/新增模型信息的模态框 -->
    <LDialog v-model="showEditModal" :title="isEditMode ? t('settings.providerDetail.editModelInfo') : t('settings.providerDetail.newModel')" width="720px" align-center
      class="model-edit-dialog dialog-with-scroll" append-to-body>
      <div class="dialog-content">
        <el-form ref="editFormRef" :model="editModelForm" :rules="editModelRules" label-position="top"
          size="default" class="model-form">

          <div class="form-section">
            <el-form-item :label="t('settings.providerDetail.modelName')" prop="modelName">
              <div class="api-key-input-wrapper">
                <el-input v-model="editModelForm.modelName" :placeholder="t('settings.providerDetail.modelNamePlaceholder')" clearable
                  :disabled="isEditMode" size="large" />
                <el-tooltip v-if="!isEditMode" content="从提供商获取模型列表" placement="top">
                  <el-button type="primary" @click="handleFetchModels"
                    :loading="fetchingModels" :icon="CloudDownloadOutlined" circle size="large"></el-button>
                </el-tooltip>
              </div>
              <!-- 预设检测提示 -->
              <div v-if="!isEditMode && matchedPreset" class="preset-hint" @click="applyPreset(matchedPreset)">
                <el-icon class="mr-1"><AutoFixHighOutlined /></el-icon>
                {{ t('settings.providerDetail.presetDetected', { label: matchedPreset.label }) }}
              </div>
            </el-form-item>

            <el-form-item :label="t('settings.providerDetail.modelType')" prop="modelType" class="mt-4">
              <div class="model-type-grid">
                <div v-for="type in modelTypeOptions" :key="type.value"
                  class="model-type-card" :class="{ active: editModelForm.modelType === type.value }"
                  @click="editModelForm.modelType = type.value">
                  <el-icon class="model-type-icon"><component :is="type.icon" /></el-icon>
                  <div class="model-type-label">{{ type.label }}</div>
                </div>
              </div>
            </el-form-item>
          </div>

          <!-- 对话模型配置 -->
          <div v-if="editModelForm.modelType === 'text'" class="transition-all">
            <el-form-item :label="t('settings.providerDetail.inputCapabilities')" prop="config.inputCapabilities" class="mb-3">
              <el-checkbox-group v-model="editModelForm.config.inputCapabilities">
                <el-checkbox-button value="text" disabled>
                  <span class="flex items-center"><el-icon class="mr-1 align-middle">
                      <TextT24Regular />
                    </el-icon> {{ t('settings.providerDetail.text') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="image">
                  <span class="flex items-center"><el-icon class="mr-1 align-middle">
                      <Image24Regular />
                    </el-icon> {{ t('settings.providerDetail.image') }}</span>
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item :label="t('settings.providerDetail.outputCapabilities')" prop="config.outputCapabilities" class="mb-3">
              <el-checkbox-group v-model="editModelForm.config.outputCapabilities">
                <el-checkbox-button value="text" disabled>
                  <span class="flex items-center"><el-icon class="mr-1 align-middle">
                      <TextT24Regular />
                    </el-icon> {{ t('settings.providerDetail.text') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="image">
                  <span class="flex items-center"><el-icon class="mr-1 align-middle">
                      <Image24Regular />
                    </el-icon> {{ t('settings.providerDetail.image') }}</span>
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item :label="t('settings.providerDetail.advancedFeatures')" prop="config.features" class="mb-4">
              <el-checkbox-group v-model="editModelForm.config.features">
                <el-checkbox-button value="tools">
                  <span class="flex items-center"><el-icon class="mr-1 align-middle">
                      <WrenchScrewdriver24Regular />
                    </el-icon> {{ t('settings.providerDetail.toolCalling') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="thinking">
                  <span class="flex items-center"><el-icon class="mr-1 align-middle">
                      <LightbulbFilament24Regular />
                    </el-icon> {{ t('settings.providerDetail.mixedThinking') }}</span>
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item :label="t('settings.providerDetail.contextWindow')" prop="config.contextWindow">
              <el-input-number v-model="editModelForm.config.contextWindow" placeholder="128000"
                controls-position="right" style="width: 240px;">
                <template #suffix><span class="text-gray-400 text-xs ml-1">Tokens</span></template>
              </el-input-number>
            </el-form-item>

            <el-form-item :label="t('settings.providerDetail.maxOutputTokens')" prop="config.maxOutputTokens">
              <el-input-number v-model="editModelForm.config.maxOutputTokens" placeholder="4096"
                controls-position="right" style="width: 240px;">
                <template #suffix><span class="text-gray-400 text-xs ml-1">Tokens</span></template>
              </el-input-number>
            </el-form-item>

            <div class="text-xs text-gray-400 my-3 leading-relaxed">
              {{ t('settings.providerDetail.defaultParamsDesc') }}
            </div>

            <el-form-item :label="t('settings.providerDetail.temperature')" prop="config.temperature">
              <el-input-number v-model="editModelForm.config.temperature" :min="0" :max="2" :step="0.1"
                :placeholder="t('settings.providerDetail.modelDefault')" controls-position="right" style="width: 240px;" />
            </el-form-item>

            <el-form-item label="Top P" prop="config.topP">
              <el-input-number v-model="editModelForm.config.topP" :min="0" :max="1" :step="0.05"
                :placeholder="t('settings.providerDetail.modelDefault')" controls-position="right" style="width: 240px;" />
            </el-form-item>

            <el-form-item :label="t('settings.providerDetail.frequencyPenalty')" prop="config.frequencyPenalty">
              <el-input-number v-model="editModelForm.config.frequencyPenalty" :min="-2" :max="2" :step="0.1"
                :placeholder="t('settings.providerDetail.modelDefault')" controls-position="right" style="width: 240px;" />
            </el-form-item>

            <el-form-item :label="t('settings.providerDetail.customParameters')" prop="config.customParameters">
              <el-input v-model="customParamsStr" type="textarea" :rows="3"
                placeholder='{ "temperature": 0.7, "top_p": 1 }' class="font-mono text-xs" />
            </el-form-item>
          </div>

          <!-- 嵌入模型配置 -->
          <div v-else-if="editModelForm.modelType === 'embedding'" class="transition-all">
            <el-form-item :label="t('settings.providerDetail.vectorDimensions')" prop="config.vectorDimensions">
              <el-input-number v-model="editModelForm.config.vectorDimensions" :placeholder="t('settings.providerDetail.vectorDimensionsPlaceholder')"
                style="width: 240px;" controls-position="right" />
              <div class="text-xs text-gray-400 mt-1">{{ t('settings.providerDetail.vectorDimensionsDesc') }}</div>
            </el-form-item>
          </div>

          <!-- OCR模型配置 -->
          <div v-else-if="editModelForm.modelType === 'ocr'" class="transition-all">
            <el-form-item label="识别语言" prop="config.ocrLanguages">
              <el-checkbox-group v-model="editModelForm.config.ocrLanguages">
                <el-checkbox-button value="zh">中文</el-checkbox-button>
                <el-checkbox-button value="en">英文</el-checkbox-button>
                <el-checkbox-button value="ja">日文</el-checkbox-button>
                <el-checkbox-button value="ko">韩文</el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="检测方向" prop="config.ocrDetectDirection">
              <el-radio-group v-model="editModelForm.config.ocrDetectDirection">
                <el-radio-button value="horizontal">横向</el-radio-button>
                <el-radio-button value="vertical">竖向</el-radio-button>
                <el-radio-button value="auto">自动</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>

          <!-- 人脸识别模型配置 -->
          <div v-else-if="editModelForm.modelType === 'face'" class="transition-all">
            <el-form-item label="检测功能" prop="config.faceFeatures">
              <el-checkbox-group v-model="editModelForm.config.faceFeatures">
                <el-checkbox-button value="detection">人脸检测</el-checkbox-button>
                <el-checkbox-button value="landmark">关键点定位</el-checkbox-button>
                <el-checkbox-button value="attribute">属性分析</el-checkbox-button>
                <el-checkbox-button value="compare">人脸比对</el-checkbox-button>
                <el-checkbox-button value="search">人脸搜索</el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="最小人脸尺寸" prop="config.faceMinSize">
              <el-input-number v-model="editModelForm.config.faceMinSize" :placeholder="'建议48~200'"
                style="width: 240px;" controls-position="right">
                <template #suffix><span class="text-gray-400 text-xs ml-1">px</span></template>
              </el-input-number>
            </el-form-item>
          </div>

          <!-- 布局识别模型配置 -->
          <div v-else-if="editModelForm.modelType === 'layout'" class="transition-all">
            <el-form-item label="检测元素" prop="config.layoutElements">
              <el-checkbox-group v-model="editModelForm.config.layoutElements">
                <el-checkbox-button value="text">文本区域</el-checkbox-button>
                <el-checkbox-button value="table">表格</el-checkbox-button>
                <el-checkbox-button value="figure">图片</el-checkbox-button>
                <el-checkbox-button value="title">标题</el-checkbox-button>
                <el-checkbox-button value="list">列表</el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
          </div>

          <!-- 文生图模型配置 -->
          <div v-else-if="editModelForm.modelType === 'image'" class="transition-all">
            <el-form-item label="默认尺寸" prop="config.imageSize">
              <el-select v-model="editModelForm.config.imageSize" style="width: 240px;">
                <el-option label="512x512" value="512x512" />
                <el-option label="768x768" value="768x768" />
                <el-option label="1024x1024" value="1024x1024" />
                <el-option label="1024x768 (横图)" value="1024x768" />
                <el-option label="768x1024 (竖图)" value="768x1024" />
              </el-select>
            </el-form-item>
            <el-form-item label="默认步数" prop="config.imageSteps">
              <el-input-number v-model="editModelForm.config.imageSteps" :min="1" :max="100"
                :placeholder="'建议20~50'" style="width: 240px;" controls-position="right" />
            </el-form-item>
            <el-form-item label="默认提示词引导" prop="config.imageGuidance">
              <el-input-number v-model="editModelForm.config.imageGuidance" :min="1" :max="20" :step="0.5"
                :placeholder="'7.5'" style="width: 240px;" controls-position="right" />
            </el-form-item>
          </div>

          <!-- 文生视频模型配置 -->
          <div v-else-if="editModelForm.modelType === 'video'" class="transition-all">
            <el-form-item label="默认时长" prop="config.videoDuration">
              <el-input-number v-model="editModelForm.config.videoDuration" :min="1" :max="60"
                :placeholder="'5'" style="width: 240px;" controls-position="right">
                <template #suffix><span class="text-gray-400 text-xs ml-1">秒</span></template>
              </el-input-number>
            </el-form-item>
            <el-form-item label="分辨率" prop="config.videoResolution">
              <el-select v-model="editModelForm.config.videoResolution" style="width: 240px;">
                <el-option label="720p" value="720p" />
                <el-option label="1080p" value="1080p" />
                <el-option label="4K" value="4k" />
              </el-select>
            </el-form-item>
            <el-form-item label="帧率" prop="config.videoFps">
              <el-input-number v-model="editModelForm.config.videoFps" :min="15" :max="60"
                :placeholder="'24'" style="width: 240px;" controls-position="right">
                <template #suffix><span class="text-gray-400 text-xs ml-1">fps</span></template>
              </el-input-number>
            </el-form-item>
          </div>

          <!-- 语音识别模型配置 -->
          <div v-else-if="editModelForm.modelType === 'asr'" class="transition-all">
            <el-form-item label="识别语言" prop="config.asrLanguage">
              <el-select v-model="editModelForm.config.asrLanguage" style="width: 240px;">
                <el-option label="自动检测" value="auto" />
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
                <el-option label="日文" value="ja" />
                <el-option label="韩文" value="ko" />
              </el-select>
            </el-form-item>
            <el-form-item label="采样率" prop="config.asrSampleRate">
              <el-select v-model="editModelForm.config.asrSampleRate" style="width: 240px;">
                <el-option label="16000 Hz" value="16000" />
                <el-option label="8000 Hz" value="8000" />
                <el-option label="44100 Hz" value="44100" />
              </el-select>
            </el-form-item>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer flex justify-end gap-3">
          <el-button @click="showEditModal = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleSaveModel" :loading="saving">{{ t('settings.providerDetail.saveChanges') }}</el-button>
        </div>
      </template>
    </LDialog>

    <!-- 获取模型列表的模态框 -->
    <LDialog v-model="showFetchModal" :title="t('settings.providerDetail.fetchModelsTitle')" width="600px" align-center
      class="model-fetch-dialog dialog-with-scroll" append-to-body>
      <div class="dialog-content">
        <div class="mb-2 sticky top-0 bg-white dark:bg-[#232428] z-10">
          <el-input v-model="searchModelName" :placeholder="t('settings.providerDetail.searchModelName')" clearable @input="handleSearchModel">
            <template #prefix>
              <el-icon>
                <SearchOutlined />
              </el-icon>
            </template>
          </el-input>
        </div>

        <div v-if="fetchingModels" class="flex justify-center items-center py-12">
          <el-icon class="is-loading text-primary" style="font-size: 32px;">
            <Loading />
          </el-icon>
        </div>
        <div v-else class="pb-4">
          <div v-if="filteredFetchedModels.length > 0">
            <ul
              class="rounded-lg border border-gray-100 dark:border-[#2e3035] divide-y divide-gray-100 dark:divide-[#2e3035]">
              <li v-for="model in filteredFetchedModels" :key="model.modelName"
                class="flex items-center justify-between py-2 px-4 hover:bg-gray-50 dark:hover:bg-[#2a2c30]/50 transition-colors">
                <div class="flex items-center gap-2 flex-1 min-w-0 mr-4">
                  <span class="font-medium text-gray-800 dark:text-[#e8e9ed] truncate">{{ model.modelName }}</span>
                  <span v-if="model.modelType !== 'text'"
                    class="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-xs">
                    {{ t('settings.providerDetail.embeddingBadge') }}
                  </span>
                  <template v-for="feature in (model.config?.features || [])" :key="feature">
                    <LTooltip :content="getLableName(feature)" placement="top">
                      <el-icon class="hover:text-primary transition-colors" :size="14">
                        <WrenchScrewdriver24Regular v-if="feature === 'tools'" />
                        <LightbulbFilament24Regular v-else-if="feature === 'thinking'" />
                        <ScienceOutlined v-else />
                      </el-icon>
                    </LTooltip>
                  </template>
                </div>
                <el-button link type="primary" size="small" @click="handleSelectFromFetch(model)">
                  {{ t('settings.providerDetail.select') }}
                </el-button>
              </li>
            </ul>
          </div>

          <div v-if="filteredFetchedModels.length === 0" class="text-center py-12 text-gray-400 text-sm">
            {{ t('settings.providerDetail.noMatchFound') }}
          </div>
        </div>
      </div>
    </LDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import { ElMessageBox } from 'element-plus'
import Avatar from '../ui/Avatar.vue'
import LTooltip from '../ui/LTooltip.vue'
import {
  SettingsOutlined,
  RemoveCircleOutlineRound,
  SearchOutlined, ArrowBackIosFilled, PlusOutlined, CloudDownloadOutlined, ScienceOutlined,
  AutoFixHighOutlined
} from '@vicons/material'
import {
  TextT24Regular, LightbulbFilament24Regular, Image24Regular, WrenchScrewdriver24Regular, Group24Regular, ArrowRight24Regular, Box16Regular,
  DocumentText24Regular, PersonCircle24Regular, Grid24Regular, Video24Regular, Mic24Regular
} from '@vicons/fluent'
import { Loading } from '@element-plus/icons-vue'
import { apiService } from '../../services/ApiService'
import { usePopup } from '../../composables/usePopup'
import { getModelDisplayName, getModelAvatarPath } from '@/utils/modelUtils'
import LDialog from '@/components/ui/LDialog.vue'

const props = defineProps<{
  provider: any
  models: any[]
  modelPresets: any[]
}>()

const emit = defineEmits<{
  back: []
  changed: []
}>()

const { t } = useI18n()
const { notify, confirm } = usePopup()

// 模型类型选项
const modelTypeOptions = [
  { value: 'text', label: '对话', icon: TextT24Regular },
  { value: 'embedding', label: '嵌入', icon: Group24Regular },
  { value: 'ocr', label: 'OCR识别', icon: DocumentText24Regular },
  { value: 'face', label: '人脸识别', icon: PersonCircle24Regular },
  { value: 'layout', label: '布局识别', icon: Grid24Regular },
  { value: 'image', label: '文生图', icon: Image24Regular },
  { value: 'video', label: '文生视频', icon: Video24Regular },
  { value: 'asr', label: '语音识别', icon: Mic24Regular }
]

// ========== 编辑/新增模型信息 ==========
const showEditModal = ref(false)
const saving = ref(false)
const editFormRef = ref<any>(null)
const currentEditModelId = ref<string | null>(null)
const isEditMode = ref(false)

const editModelForm = ref<any>({
  modelName: '',
  modelType: 'text',
  config: {
    inputCapabilities: ['text'],
    outputCapabilities: ['text'],
    features: [],
    contextWindow: null,
    maxOutputTokens: null,
    temperature: null,
    topP: null,
    frequencyPenalty: null,
    customParameters: {},
    vectorDimensions: null
  }
})

// 用于双向绑定自定义参数字符串
const customParamsStr = computed({
  get() {
    try {
      return JSON.stringify(editModelForm.value.config.customParameters, null, 2)
    } catch (e) {
      return ''
    }
  },
  set(val) {
    try {
      if (val.trim() === '') {
        editModelForm.value.config.customParameters = {}
      } else {
        editModelForm.value.config.customParameters = JSON.parse(val)
      }
    } catch (e) {
      // 解析失败时不更新，避免报错
    }
  }
})

// 检测当前输入的模型名是否匹配预设库
const matchedPreset = computed(() => {
  if (!editModelForm.value.modelName) return null
  const lower = editModelForm.value.modelName.toLowerCase()
  return props.modelPresets.find((p: any) =>
    p.patterns.some((src: string) => new RegExp(src).test(lower))
  ) || null
})

// 应用预设配置到表单
const applyPreset = (preset: any) => {
  editModelForm.value.modelType = preset.modeType
  editModelForm.value.config = {
    inputCapabilities: preset.config.inputCapabilities || ['text'],
    outputCapabilities: preset.config.outputCapabilities || ['text'],
    features: preset.config.features || [],
    contextWindow: preset.config.contextWindow || null,
    maxOutputTokens: preset.config.maxOutputTokens || null,
    temperature: null,
    topP: null,
    frequencyPenalty: null,
    customParameters: {},
    vectorDimensions: preset.config.vectorDimensions || null
  }
}

const editModelRules = computed(() => ({
  modelName: { required: true, message: t('settings.providerDetail.modelNameRequired'), trigger: 'blur' },
  modelType: { required: true, message: t('settings.providerDetail.modelTypeRequired'), trigger: 'change' },
  'config.contextWindow': {
    required: false,
    type: 'number' as const,
    validator: (rule: any, value: any) => !value || value > 0,
    message: t('settings.providerDetail.contextWindowInvalid'),
    trigger: 'blur' as const
  },
  'config.maxOutputTokens': {
    required: false,
    type: 'number' as const,
    validator: (rule: any, value: any) => !value || value > 0,
    message: t('settings.providerDetail.maxOutputTokensInvalid'),
    trigger: 'blur' as const
  }
}))

const getLableName = (type: string) => {
  switch (type) {
    case 'visual':
      return t('settings.providerDetail.visual')
    case 'tools':
      return t('settings.providerDetail.toolCalling')
    case 'thinking':
      return t('settings.providerDetail.mixedThinking')
    default:
      return type
  }
}

// 获取模型头像路径
const getModelAvatarForSetting = (model: { modelName: string }) => {
  if (!model || !model.modelName) return undefined
  const providerName = props.provider?.name || undefined
  const avatarPath = getModelAvatarPath(model.modelName, providerName)
  return avatarPath || undefined
}

// 从获取列表中选择模型（预填充到编辑表单，不调用API）
const handleSelectFromFetch = (model: any) => {
  editModelForm.value = {
    modelName: model.modelName || '',
    modelType: model.modelType || 'text',
    config: {
      inputCapabilities: model.config?.inputCapabilities || ['text'],
      outputCapabilities: model.config?.outputCapabilities || ['text'],
      features: model.config?.features || [],
      contextWindow: model.config?.contextWindow || null,
      maxOutputTokens: model.config?.maxOutputTokens || null,
      temperature: model.config?.temperature ?? null,
      topP: model.config?.topP ?? null,
      frequencyPenalty: model.config?.frequencyPenalty ?? null,
      customParameters: model.config?.customParameters || {},
      vectorDimensions: model.config?.vectorDimensions || null
    }
  }
  showFetchModal.value = false
}

// 新增模型
const handleAddModel = () => {
  isEditMode.value = false
  currentEditModelId.value = null
  editModelForm.value = {
    modelName: '',
    modelType: 'text',
    config: {
      inputCapabilities: ['text'],
      outputCapabilities: ['text'],
      features: [],
      contextWindow: null,
      maxOutputTokens: null,
      temperature: null,
      topP: null,
      frequencyPenalty: null,
      customParameters: {},
      vectorDimensions: null
    }
  }
  showEditModal.value = true
}

// 编辑模型
const handleEditClick = (model: any) => {
  isEditMode.value = true
  currentEditModelId.value = model.id
  const config = model.config || {}
  editModelForm.value = {
    modelName: model.modelName || '',
    modelType: model.modelType || 'text',
    config: {
      inputCapabilities: config.inputCapabilities || ['text'],
      outputCapabilities: config.outputCapabilities || ['text'],
      features: config.features || [],
      contextWindow: config.contextWindow || null,
      maxOutputTokens: config.maxOutputTokens || null,
      temperature: config.temperature ?? null,
      topP: config.topP ?? null,
      frequencyPenalty: config.frequencyPenalty ?? null,
      customParameters: config.customParameters || {},
      vectorDimensions: config.vectorDimensions || null
    }
  }
  showEditModal.value = true
}

// 保存模型
const handleSaveModel = async () => {
  try {
    await editFormRef.value?.validate()

    if (isEditMode.value) {
      if (currentEditModelId.value) {
        await apiService.updateModel(currentEditModelId.value, editModelForm.value)
      }
      notify.success(t('common.saveSuccess'), t('settings.providerDetail.modelUpdated'))
    } else {
      await apiService.createModel({
        ...editModelForm.value,
        providerId: props.provider.id
      })
      notify.success(t('common.createSuccess'), t('settings.providerDetail.modelAdded'))
    }

    showEditModal.value = false
    emit('changed')
  } catch (errors) {
    // 验证失败，不关闭模态框
    return false
  }
}

// 删除模型
const handleDeleteClick = async (model: any) => {
  const result = await confirm(t('settings.providerDetail.deleteModel'), t('settings.providerDetail.deleteModelConfirm'))
  if (!result) return
  await apiService.deleteModel(model.id)
  notify.success(t('common.deleteSuccess'), t('settings.providerDetail.modelDeleted'))
  emit('changed')
}

// 切换模型启用状态
const handleToggleModelActive = async (model: any) => {
  try {
    const result = await apiService.toggleModelActive(model.id)
    model.isActive = result.isActive
    const statusText = result.isActive ? t('settings.providerDetail.modelEnabled') : t('settings.providerDetail.modelDisabled')
    notify.success(t('common.operationSuccess'), statusText, { duration: 2000 })
    emit('changed')
  } catch (error) {
    console.error('切换模型状态失败:', error)
    notify.error(t('common.operationFailed'), t('settings.providerDetail.toggleModelError'), { duration: 2000 })
    model.isActive = !model.isActive
  }
}

// ========== 获取模型列表 ==========
const showFetchModal = ref(false)
const fetchingModels = ref(false)
const fetchedModels = ref<any[]>([])
const searchModelName = ref('')

const handleSearchModel = useDebounceFn((value) => {
  // 防抖处理，仅依赖 computed 过滤
}, 300)

const filteredFetchedModels = computed(() => {
  if (!searchModelName.value) {
    return fetchedModels.value
  }
  const searchTerm = searchModelName.value.toLowerCase()
  return fetchedModels.value.filter(model =>
    model.modelName.toLowerCase().includes(searchTerm)
  )
})

const handleFetchModels = async () => {
  const hasApiKey = props.provider.apiKey || 
                   (props.provider.apiKeyList && props.provider.apiKeyList.length > 0) ||
                   (props.provider.api_keys && props.provider.api_keys.length > 0)
  
  if (!props.provider.apiUrl || !hasApiKey) {
    notify.error(t('settings.providerDetail.configError'), t('settings.providerDetail.configApiError'), { duration: 2000 })
    return
  }

  fetchingModels.value = true
  showFetchModal.value = true

  try {
    const data = await apiService.fetchRemoteModels(props.provider.id)
    // 兼容两种返回格式：直接返回items，或者包在data里
    const apiModels = data.items || data.data?.items || []
    // 从已添加的模型中继承config参数
    const enrichedModels = apiModels.map((apiModel: any) => {
      const existingModel = props.models.find(
        (model: any) => model.modelName === apiModel.modelName
      )
      if (existingModel) {
        return {
          ...apiModel,
          id: existingModel.id,
          config: { ...existingModel.config }
        }
      }
      return {
        ...apiModel,
        config: apiModel.config || { features: [] }
      }
    })
    fetchedModels.value = enrichedModels
    notify.success(t('common.operationSuccess'), t('settings.providerDetail.fetchSuccess', { n: enrichedModels.length }), { duration: 2000 })
  } catch (error) {
    fetchedModels.value = []
    notify.error(t('common.operationFailed'), t('settings.providerDetail.fetchFailed'), { duration: 2000 })
    console.error('获取模型列表失败:', error)
  } finally {
    fetchingModels.value = false
  }
}
</script>

<style scoped>
/* 统一输入框内容左对齐 */
:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  text-align: left !important;
}

/* 优化 Button 组样式，使其更简约 */
:deep(.el-checkbox-button__inner),
:deep(.el-radio-button__inner) {
  padding: 6px 12px;
  border-radius: 6px !important;
  font-size: 13px;
}

/* 调整相邻按钮的间距 */
:deep(.el-checkbox-button + .el-checkbox-button),
:deep(.el-radio-button + .el-radio-button) {
  margin-left: 6px;
  margin-top: 4px;
}

/* API Key 输入框和按钮布局 */
.api-key-input-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;
}

.api-key-input-wrapper :deep(.el-input) {
  flex: 1;
  min-width: 0;
}

/* 预设检测提示 */
.preset-hint {
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-primary);
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.15s;
}

.preset-hint:hover {
  opacity: 1;
}

/* 对话框内容美化 */
.dialog-content {
  padding: 0 4px;
}

/* 表单分区 */
.form-section {
  padding: 12px 0;
}

.form-section + .form-section {
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 8px;
}

/* 表单项间距优化 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

/* 表单项label样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding-bottom: 6px;
}

/* 模型类型网格 */
.model-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
}

.model-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--el-bg-color);
}

.model-type-card:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.model-type-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

.model-type-icon {
  font-size: 24px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.model-type-card.active .model-type-icon {
  color: var(--el-color-primary);
}

.model-type-label {
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

/* 对话框底部按钮美化 */
:deep(.dialog-footer .el-button) {
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
}

/* 输入框聚焦效果 */
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
}

/* 输入框圆角 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* 数字输入框宽度 */
:deep(.el-input-number) {
  width: 100%;
}

/* 复选框按钮组 */
:deep(.el-checkbox-button__inner) {
  border-radius: 6px !important;
  padding: 8px 14px;
}
</style>
