<template>
  <ReDialog
    v-model="visible"
    :title="isEditMode ? t('settings.providerDetail.editModelInfo') : t('settings.providerDetail.newModel')"
    width="880px"
    align-center
    class="model-edit-dialog"
    append-to-body
  >
    <div class="me-layout">
      <!-- 左：类型选择轨 -->
      <aside class="me-rail">
        <div class="me-rail-label">{{ t('settings.providerDetail.modelType') }}</div>
        <ul class="me-rail-list">
          <li
            v-for="type in modelTypeOptions"
            :key="type.value"
            class="me-rail-item"
            :class="{ active: form.modelType === type.value }"
            @click="selectModelType(type)"
          >
            <span class="me-rail-ico"><el-icon :size="16"><component :is="type.icon" /></el-icon></span>
            <span class="me-rail-name">{{ type.label }}</span>
            <el-icon v-if="form.modelType === type.value" class="me-rail-check" :size="14">
              <Checkmark24Regular />
            </el-icon>
          </li>
        </ul>
      </aside>

      <!-- 右：配置 -->
      <div class="me-body">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="default" class="me-form">
          <!-- 基本信息 -->
          <section class="me-section">
            <div class="me-section-head">
              <span class="me-section-ico"><el-icon :size="16"><Info24Regular /></el-icon></span>
              <span class="me-section-title">基本信息</span>
            </div>
            <el-form-item :label="t('settings.providerDetail.modelName')" prop="modelName">
              <div class="api-key-input-wrapper">
                <el-input
                  v-model="form.modelName"
                  :placeholder="t('settings.providerDetail.modelNamePlaceholder')"
                  clearable
                  :disabled="isEditMode"
                />
                
                <el-tooltip content="从提供商获取模型列表" placement="top">
                  <el-button
                    v-if="!isEditMode"
                    type="primary"
                    :loading="fetching"
                    :icon="CloudDownloadOutlined"
                    circle
                    @click="emit('request-fetch')"
                  />
                </el-tooltip>
                <el-tooltip content="按模型名自动获取指标参数（上下文/能力/思考档位等）" placement="top">
                  <el-button
                    type="success"
                    :loading="autoFetching"
                    :icon="AutoFixHighOutlined"
                    circle
                    :disabled="!form.modelName?.trim()"
                    @click="handleAutoFetch"
                  />
                </el-tooltip>
              </div>
              <div v-if="!isEditMode && matchedPreset" class="preset-hint" @click="applyPreset(matchedPreset)">
                <el-icon class="mr-1"><AutoFixHighOutlined /></el-icon>
                {{ t('settings.providerDetail.presetDetected', { label: matchedPreset.label || matchedPreset.name || matchedPreset.model }) }}
              </div>
            </el-form-item>
            <el-form-item label="模型别名" prop="alias">
              <el-input v-model="form.alias" placeholder="可选，业务展示用名称（如：我的模型）" clearable />
            </el-form-item>
            <el-form-item v-if="subTypeOptions.length" label="细分类型" prop="subType">
              <el-select v-model="form.subType" class="w-full" clearable placeholder="选择该模型在管线里的具体用途">
                <el-option v-for="opt in subTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
              <div class="field-hint mt-1">
                OCR 可区分文字检测/识别/校正；人脸可区分检测/特征/修复/动漫等人脸组合模型。
              </div>
            </el-form-item>
          </section>

          <!-- 类型配置 -->
          <section class="me-section">
            <div class="me-section-head">
              <span class="me-section-ico">
                <el-icon :size="16"><component :is="currentTypeIcon" /></el-icon>
              </span>
              <span class="me-section-title">{{ currentTypeLabel }}配置</span>
            </div>

          <!-- 对话模型 -->
          <div v-if="form.modelType === 'text'" class="me-group">
            <div class="me-group-title">能力</div>
            <el-form-item :label="t('settings.providerDetail.inputCapabilities')" prop="config.inputCapabilities" class="mb-2">
              <el-checkbox-group v-model="form.config.inputCapabilities">
                <el-checkbox-button value="text" disabled>
                  <span class="cap-label"><el-icon class="mr-1"><TextT24Regular /></el-icon>{{ t('settings.providerDetail.text') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="image">
                  <span class="cap-label"><el-icon class="mr-1"><Image24Regular /></el-icon>{{ t('settings.providerDetail.image') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="audio">
                  <span class="cap-label"><el-icon class="mr-1"><Speaker224Regular /></el-icon>{{ t('settings.providerDetail.audio') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="video">
                  <span class="cap-label"><el-icon class="mr-1"><Video24Regular /></el-icon>{{ t('settings.providerDetail.video') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="pdf">
                  <span class="cap-label"><el-icon class="mr-1"><DocumentText24Regular /></el-icon>{{ t('settings.providerDetail.pdf') }}</span>
                </el-checkbox-button>
              </el-checkbox-group>
              <!-- 勾了「图片」只表示「能读图」：多模态理解模型不需要填张数上限，
                   这里只留「支持参考图」；张数属于下面「图像生成参数」区的事，不重复问 -->
              <div v-if="hasImageIn" class="img-extra">
                <span class="img-extra-field">
                  <span class="img-extra-label">支持参考图</span>
                  <el-switch v-model="form.config.imageReference" />
                </span>
              </div>
            </el-form-item>
            <el-form-item :label="t('settings.providerDetail.outputCapabilities')" prop="config.outputCapabilities" class="mb-2">
              <el-checkbox-group v-model="form.config.outputCapabilities">
                <el-checkbox-button value="text" disabled>
                  <span class="cap-label"><el-icon class="mr-1"><TextT24Regular /></el-icon>{{ t('settings.providerDetail.text') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="image">
                  <span class="cap-label"><el-icon class="mr-1"><Image24Regular /></el-icon>{{ t('settings.providerDetail.image') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="audio">
                  <span class="cap-label"><el-icon class="mr-1"><Speaker224Regular /></el-icon>{{ t('settings.providerDetail.audio') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="video">
                  <span class="cap-label"><el-icon class="mr-1"><Video24Regular /></el-icon>{{ t('settings.providerDetail.video') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="pdf">
                  <span class="cap-label"><el-icon class="mr-1"><DocumentText24Regular /></el-icon>{{ t('settings.providerDetail.pdf') }}</span>
                </el-checkbox-button>
              </el-checkbox-group>
              <!-- 勾了「图片」即可，不再问输出张数：能否一次出多张由下面的
                   「图像生成参数 · 输出张数」决定，理解类模型没有这个概念 -->
            </el-form-item>
            <el-form-item :label="t('settings.providerDetail.advancedFeatures')" prop="config.features" class="mb-2">
              <el-checkbox-group v-model="form.config.features">
                <el-checkbox-button value="tools">
                  <span class="cap-label"><el-icon class="mr-1"><WrenchScrewdriver24Regular /></el-icon>{{ t('settings.providerDetail.toolCalling') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="thinking">
                  <span class="cap-label"><el-icon class="mr-1" :size="16"><BrainCircuit20Regular /></el-icon>{{ t('settings.providerDetail.mixedThinking') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="web-search">
                  <span class="cap-label"><el-icon class="mr-1" :size="16"><GlobeShield20Regular /></el-icon>在线检索</span>
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>

            <!-- 能力开关：attachment / reasoning / tool_call / temperature（随模型走 config） -->
            <el-form-item :label="t('settings.providerDetail.capabilitySwitches')" class="mb-2">
              <el-checkbox-group v-model="form.config.capabilities">
                <el-checkbox-button value="attachment">
                  <span class="cap-label">{{ t('settings.providerDetail.attachment') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="reasoning">
                  <span class="cap-label">{{ t('settings.providerDetail.reasoning') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="tool_call">
                  <span class="cap-label">{{ t('settings.providerDetail.toolCall') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="temperature">
                  <span class="cap-label">{{ t('settings.providerDetail.temperatureSupported') }}</span>
                </el-checkbox-button>
                <el-checkbox-button value="open_weights">
                  <span class="cap-label">{{ t('settings.providerDetail.openWeights') }}</span>
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>

            <!-- 模型信息回填：family / knowledge / release_date / last_updated / modalities（仅编辑态展示） -->
            <el-form-item v-if="isEditMode && modelBackfill" :label="t('settings.providerDetail.backfill')" class="mb-2">
              <div class="me-backfill">
                <template v-for="(label, idx) in backfillRows" :key="idx">
                  <span v-if="label.value" class="me-backfill-item">
                    <el-tag size="small" type="info" effect="plain">{{ label.label }}</el-tag>
                    <span class="me-backfill-val">{{ label.value }}</span>
                  </span>
                </template>
              </div>
            </el-form-item>

            <!-- 思考强度档位：在模型管理里配置该模型可选的档位（默认 none/minimal/low/medium/high/max）。
                 会话侧选「默认」= 不传档位，交由各厂商默认。 -->
            <el-form-item :label="t('common.thinkingEffort.levels')" prop="config.thinkingEfforts" class="mb-2">
              <el-checkbox-group v-model="form.config.thinkingEfforts">
                <el-checkbox-button v-for="effort in THINKING_EFFORT_LEVELS" :key="effort" :value="effort">
                  {{ t(`common.thinkingEffort.${effort}`) }}
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>

            <div class="me-group-title mt-2">参数</div>
            <div class="me-grid">
              <el-form-item :label="t('settings.providerDetail.contextWindow')" prop="config.contextWindow">
                <ReNumberInput v-model="form.config.contextWindow" placeholder="128000" controls-position="right" class="num-input" />
              </el-form-item>
              <el-form-item :label="t('settings.providerDetail.maxOutputTokens')" prop="config.maxOutputTokens">
                <ReNumberInput v-model="form.config.maxOutputTokens" placeholder="4096" controls-position="right" class="num-input" />
              </el-form-item>
              <el-form-item :label="t('settings.providerDetail.temperature')" prop="config.temperature">
                <ReNumberInput v-model="form.config.temperature" :min="0" :max="2" :step="0.1"
                  :placeholder="t('settings.providerDetail.modelDefault')" controls-position="right" class="num-input" />
              </el-form-item>
              <el-form-item label="Top P" prop="config.topP">
                <ReNumberInput v-model="form.config.topP" :min="0" :max="1" :step="0.05"
                  :placeholder="t('settings.providerDetail.modelDefault')" controls-position="right" class="num-input" />
              </el-form-item>
              <el-form-item :label="t('settings.providerDetail.frequencyPenalty')" prop="config.frequencyPenalty">
                <ReNumberInput v-model="form.config.frequencyPenalty" :min="-2" :max="2" :step="0.1"
                  :placeholder="t('settings.providerDetail.modelDefault')" controls-position="right" class="num-input" />
              </el-form-item>
            </div>
            <el-form-item :label="t('settings.providerDetail.customParameters')" prop="config.customParameters">
              <el-input v-model="customParamsStr" type="textarea" :rows="3"
                placeholder='{ "temperature": 0.7, "top_p": 1 }' class="font-mono text-xs" />
            </el-form-item>
          </div>

          <!-- 嵌入 -->
          <div v-else-if="form.modelType === 'embedding'" class="me-group">
            <el-form-item :label="t('settings.providerDetail.vectorDimensions')" prop="config.vectorDimensions">
              <ReNumberInput v-model="form.config.vectorDimensions" :placeholder="t('settings.providerDetail.vectorDimensionsPlaceholder')"
                class="num-input" controls-position="right" />
              <div class="field-hint mt-1">{{ t('settings.providerDetail.vectorDimensionsDesc') }}</div>
            </el-form-item>
          </div>

          <!-- 重排序 -->
          <div v-else-if="form.modelType === 'rerank'" class="me-group">
            <div class="me-grid">
              <el-form-item label="返回条数 (top_n)">
                <ReNumberInput v-model="form.config.rerankTopN" :min="1" placeholder="如 3"
                  controls-position="right" class="num-input" />
              </el-form-item>
              <el-form-item label="最大输入长度">
                <ReNumberInput v-model="form.config.rerankMaxLength" :min="1" placeholder="如 512"
                  controls-position="right" class="num-input" />
              </el-form-item>
            </div>
            <div class="field-hint">重排序模型对检索结果按相关度重新打分排序，常用于知识库检索。</div>
          </div>

          <!-- 图片识别 -->
          <div v-else-if="form.modelType === 'image_cv'" class="me-group">
            <el-form-item label="识别模式">
              <ReRadioGroup v-model="form.config.cvMode">
                <ReRadioButton value="classify">图像分类</ReRadioButton>
                <ReRadioButton value="detect">目标检测</ReRadioButton>
              </ReRadioGroup>
            </el-form-item>
            <el-form-item label="置信度阈值">
              <ReNumberInput v-model="form.config.cvConfidence" :min="0" :max="1" :step="0.05"
                placeholder="如 0.5" controls-position="right" class="num-input" />
            </el-form-item>
          </div>

          <!-- 检测 -->
          <div v-else-if="form.modelType === 'detection'" class="me-group">
            <el-form-item label="检测类型">
              <ReRadioGroup v-model="form.config.cvMode">
                <ReRadioButton value="object">目标检测</ReRadioButton>
                <ReRadioButton value="classify">图像分类</ReRadioButton>
                <ReRadioButton value="defect">缺陷检测</ReRadioButton>
              </ReRadioGroup>
            </el-form-item>
            <el-form-item label="置信度阈值">
              <ReNumberInput v-model="form.config.cvConfidence" :min="0" :max="1" :step="0.05"
                placeholder="如 0.5" controls-position="right" class="num-input" />
            </el-form-item>
          </div>

          <!-- 语音合成 -->
          <div v-else-if="form.modelType === 'tts'" class="me-group">
            <div class="me-grid">
              <el-form-item label="发音人 (voice)">
                <el-input v-model="form.config.ttsVoice" placeholder="如 alloy / 默认发音人" />
              </el-form-item>
              <el-form-item label="语速">
                <ReNumberInput v-model="form.config.ttsSpeed" :min="0.5" :max="2" :step="0.1"
                  placeholder="1.0" controls-position="right" class="num-input" />
              </el-form-item>
            </div>
            <el-form-item label="音频格式">
              <el-select v-model="form.config.ttsFormat" class="num-input">
                <el-option label="MP3" value="mp3" />
                <el-option label="WAV" value="wav" />
                <el-option label="OPUS" value="opus" />
                <el-option label="AAC" value="aac" />
                <el-option label="FLAC" value="flac" />
                <el-option label="PCM" value="pcm" />
              </el-select>
            </el-form-item>
          </div>

          <!-- OCR -->
          <div v-else-if="form.modelType === 'ocr'" class="me-group">
            <el-form-item label="识别语言" prop="config.ocrLanguages">
              <el-checkbox-group v-model="form.config.ocrLanguages">
                <el-checkbox-button value="zh">中文</el-checkbox-button>
                <el-checkbox-button value="en">英文</el-checkbox-button>
                <el-checkbox-button value="ja">日文</el-checkbox-button>
                <el-checkbox-button value="ko">韩文</el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="检测方向" prop="config.ocrDetectDirection">
              <ReRadioGroup v-model="form.config.ocrDetectDirection">
                <ReRadioButton value="horizontal">横向</ReRadioButton>
                <ReRadioButton value="vertical">竖向</ReRadioButton>
                <ReRadioButton value="auto">自动</ReRadioButton>
              </ReRadioGroup>
            </el-form-item>
          </div>

          <!-- 人脸 -->
          <div v-else-if="form.modelType === 'face'" class="me-group">
            <el-form-item label="检测功能" prop="config.faceFeatures">
              <el-checkbox-group v-model="form.config.faceFeatures">
                <el-checkbox-button value="detection">人脸检测</el-checkbox-button>
                <el-checkbox-button value="landmark">关键点定位</el-checkbox-button>
                <el-checkbox-button value="attribute">属性分析</el-checkbox-button>
                <el-checkbox-button value="compare">人脸比对</el-checkbox-button>
                <el-checkbox-button value="search">人脸搜索</el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="最小人脸尺寸" prop="config.faceMinSize">
              <ReNumberInput v-model="form.config.faceMinSize" placeholder="建议48~200"
                class="num-input" controls-position="right" />
            </el-form-item>
          </div>

          <!-- 布局 -->
          <div v-else-if="form.modelType === 'layout'" class="me-group">
            <el-form-item label="检测元素" prop="config.layoutElements">
              <el-checkbox-group v-model="form.config.layoutElements">
                <el-checkbox-button value="text">文本区域</el-checkbox-button>
                <el-checkbox-button value="table">表格</el-checkbox-button>
                <el-checkbox-button value="figure">图片</el-checkbox-button>
                <el-checkbox-button value="title">标题</el-checkbox-button>
                <el-checkbox-button value="list">列表</el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
          </div>

          <!-- 文生图 -->
          <div v-else-if="form.modelType === 'image'" class="me-group">
            <div class="me-group-title">生成参数</div>
            <el-form-item label="支持参考图" prop="config.generate.referenceImage">
              <el-switch v-model="form.config.generate.referenceImage" />
              <span class="me-hint">开启后「图像生成」页可上传参考图做图生图</span>
            </el-form-item>
            <!-- 输入张数：支持输入多少张参考图。参考图关着时没有输入可配，这项也不出现 -->
            <el-form-item v-if="form.config.generate.referenceImage" label="输入张数" prop="config.generate.referenceImageCount">
              <ReNumberInput v-model="form.config.generate.referenceImageCount" :min="1" :max="8"
                class="num-input" controls-position="right" />
              <span class="me-hint">支持输入多少张参考图</span>
            </el-form-item>
            <el-form-item label="支持负面词" prop="config.generate.negativePrompt">
              <el-switch v-model="form.config.generate.negativePrompt" />
            </el-form-item>
            <el-form-item label="支持随机种子" prop="config.generate.seed">
              <el-switch v-model="form.config.generate.seed" />
            </el-form-item>
            <el-form-item label="输出张数" prop="config.generate.maxCount">
              <ReNumberInput v-model="form.config.generate.maxCount" :min="1" :max="8"
                class="num-input" controls-position="right" />
              <span class="me-hint">单次生成最多几张（输出）</span>
            </el-form-item>
            <el-form-item label="可用分辨率" prop="config.generate.sizes">
              <el-select v-model="form.config.generate.sizes" multiple filterable allow-create
                default-first-option class="num-input" placeholder="回车添加，如 1024x1024" />
              <span class="me-hint">「图像生成」页的分辨率下拉取自这里</span>
            </el-form-item>
            <el-form-item label="支持风格" prop="config.generate.style">
              <el-switch v-model="form.config.generate.style" />
              <span class="me-hint">关闭时不展示风格入口、也不下发 style 参数（部分上游不认该参数会直接报错）</span>
            </el-form-item>
            <el-form-item v-if="form.config.generate.style" label="可用风格" prop="config.generate.styles">
              <el-select v-model="form.config.generate.styles" multiple filterable allow-create
                default-first-option class="num-input" placeholder="回车添加风格 key，如 photo / anime" />
              <span class="me-hint">留空则沿用内置默认风格表（无风格 / 胶片写实 / 动漫二次元 / 国风水墨 …）</span>
            </el-form-item>
            <el-form-item label="步数区间" prop="config.generate.stepsDefault">
              <div class="me-inline">
                <ReNumberInput v-model="form.config.generate.stepsMin" :min="1" :max="200"
                  placeholder="最小" controls-position="right" />
                <ReNumberInput v-model="form.config.generate.stepsMax" :min="1" :max="200"
                  placeholder="最大" controls-position="right" />
                <ReNumberInput v-model="form.config.generate.stepsDefault" :min="1" :max="200"
                  placeholder="默认" controls-position="right" />
              </div>
            </el-form-item>
          </div>

          <!-- 文生视频 -->
          <div v-else-if="form.modelType === 'video'" class="me-group">
            <div class="me-group-title">生成参数</div>
            <el-form-item label="支持参考图" prop="config.generate.referenceImage">
              <el-switch v-model="form.config.generate.referenceImage" />
              <span class="me-hint">开启后可上传首帧做图生视频</span>
            </el-form-item>
            <el-form-item label="张数上限" prop="config.generate.maxCount">
              <ReNumberInput v-model="form.config.generate.maxCount" :min="1" :max="4"
                class="num-input" controls-position="right" />
            </el-form-item>
            <el-form-item label="可用分辨率" prop="config.generate.sizes">
              <el-select v-model="form.config.generate.sizes" multiple filterable allow-create
                default-first-option class="num-input" placeholder="回车添加，如 1920x1080" />
            </el-form-item>
            <el-form-item label="可用时长" prop="config.generate.durations">
              <el-select v-model="form.config.generate.durations" multiple filterable allow-create
                default-first-option class="num-input" placeholder="回车添加秒数，如 5">
                <el-option v-for="d in [5, 10, 15, 30]" :key="d" :label="`${d} 秒`" :value="d" />
              </el-select>
            </el-form-item>
            <el-form-item label="支持负面词" prop="config.generate.negativePrompt">
              <el-switch v-model="form.config.generate.negativePrompt" />
            </el-form-item>
          </div>

          <!-- 语音识别 -->
          <div v-else-if="form.modelType === 'asr'" class="me-group">
            <el-form-item label="识别语言" prop="config.asrLanguage">
              <el-select v-model="form.config.asrLanguage" class="num-input">
                <el-option label="自动检测" value="auto" />
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
                <el-option label="日文" value="ja" />
                <el-option label="韩文" value="ko" />
              </el-select>
            </el-form-item>
            <el-form-item label="采样率" prop="config.asrSampleRate">
              <el-select v-model="form.config.asrSampleRate" class="num-input">
                <el-option label="16000 Hz" value="16000" />
                <el-option label="8000 Hz" value="8000" />
                <el-option label="44100 Hz" value="44100" />
              </el-select>
            </el-form-item>
          </div>
          </section>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="me-footer">
        <el-button class="me-foot-btn" @click="visible = false">{{ t('common.cancel') }}</el-button>
        <el-button class="me-foot-btn" type="primary" @click="handleSave" :loading="saving">{{ t('settings.providerDetail.saveChanges') }}</el-button>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ReDialog from '@repo/ui/re-dialog'
import { CloudDownloadOutlined, AutoFixHighOutlined } from '@vicons/material'
import {
  TextT24Regular, BrainCircuit20Regular, GlobeShield20Regular, Image24Regular, WrenchScrewdriver24Regular,
  Checkmark24Regular, Info24Regular, Speaker224Regular, Video24Regular, DocumentText24Regular,
} from '@vicons/fluent'
import { apiService } from '../../services/ApiService'
import { message } from '@repo/core'
import { MODEL_TYPE_OPTIONS, MODEL_SUBTYPE_OPTIONS, TYPE_TO_TASK, THINKING_EFFORT_LEVELS, isChannelProvider } from './model.constants'
import { channelApi } from '@/services/javaApi'
import {
  createDefaultModelConfig,
  inferSubType,
  inferModelType,
  deriveModelTraits,
  deriveCapabilitySwitches,
  deriveFetchedModelConfig,
} from './model.utils'
import ReNumberInput from '@/components/ui/ReNumberInput.vue'
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";

const props = defineProps<{
  provider: any
  modelPresets: any[]
  fetching?: boolean
}>()

const emit = defineEmits<{
  saved: []
  // 声明名须与模板里的 emit('request-fetch') 及父组件的 @request-fetch 一致，
  // 否则 vue-tsc 报 TS2769（运行时虽能靠 camelize 兜住，但类型上是坏的）
  'request-fetch': []
}>()

const { t } = useI18n()

const visible = ref(false)
const saving = ref(false)
/** 「自动获取」按钮 loading（按模型名从指标端点拉快照） */
const autoFetching = ref(false)
const isEditMode = ref(false)
const editingId = ref<string | null>(null)
/** 编辑中的模型行（只读回填展示用） */
const editingModel = ref<any>(null)
const formRef = ref<any>(null)
const modelTypeOptions = MODEL_TYPE_OPTIONS
const subTypeOptions = computed(() => MODEL_SUBTYPE_OPTIONS[form.value.modelType] || [])
const currentType = computed(() => modelTypeOptions.find((o) => o.value === form.value.modelType))
const currentTypeIcon = computed(() => currentType.value?.icon)
const currentTypeLabel = computed(() => currentType.value?.label || '')

/** 输入能力里勾了「图片」→ 展开「支持参考图」这一项（输出侧不再有细化项） */
const hasImageIn = computed(() => (form.value.config?.inputCapabilities || []).includes('image'))

const form = ref<any>({
  modelName: '',
  modelType: 'text',
  subType: '',
  config: createDefaultModelConfig(),
})

/**
 * 「自动获取」：按当前模型名从后台指标端点拉取指标快照（上下文/能力开关/思考档位/
 * family/knowledge 等），回填到表单 config；模型未被指标源收录时提示并保持表单不动。
 *
 * <p>这是**手动**入口（新增、编辑都能点，点了就是用户明确要求补全）。
 * 自动补全见 {@link autoFillMetrics}，只在新增时触发。</p>
 */
const handleAutoFetch = async () => {
  const modelName = String(form.value.modelName || '').trim()
  if (!modelName) return
  autoFetching.value = true
  try {
    const res: any = await apiService.fetchModelMetrics(props.provider.id, modelName)
    if (!res || res.found === false) {
      message.warning(res?.message || '该模型未被指标源收录，可手动填写配置')
      return
    }
    mergeMetricSnapshot(res)
    message.success(`已按模型「${modelName}」自动获取指标参数，请核对后保存`)
  } catch (error: any) {
    message.error(error?.message || '自动获取指标参数失败')
  } finally {
    autoFetching.value = false
  }
}

/**
 * 指标快照 → 表单 config 的回填主体（上下文 / 输出上限 / 能力开关 / 特性 /
 * 思考档位 / family 等信息字段）。
 *
 * <p>只负责回填，不弹提示、不管理 loading —— 手动按钮在外面包 toast，
 * 新增态的静默自动补全则完全不打扰用户。</p>
 *
 * @param res 指标端点返回的 data（已确认 found !== false）
 */
const mergeMetricSnapshot = (res: any) => {
  const cfg = form.value.config || {}
    // 上下文 / 输出上限：仅在未填时回填
    const ctx = Number(res.context_window_tokens)
    if (!cfg.contextWindow && Number.isFinite(ctx) && ctx > 0) cfg.contextWindow = ctx
    const maxOut = Number(res.max_output_tokens)
    if (!cfg.maxOutputTokens && Number.isFinite(maxOut) && maxOut > 0) cfg.maxOutputTokens = maxOut
    // 能力开关：Metrics 布尔 → config.capabilities（去重合并）
    const caps = new Set<string>(Array.isArray(cfg.capabilities) ? cfg.capabilities : [])
    const flagCap = (booleanValue: any, key: string) => {
      if (booleanValue === true || booleanValue === 'true' || booleanValue === 1) caps.add(key)
    }
    flagCap(res.attachment, 'attachment')
    flagCap(res.reasoning, 'reasoning')
    flagCap(res.tool_call, 'tool_call')
    flagCap(res.temperature_supported ?? res.temperature, 'temperature')
    flagCap(res.open_weights, 'open_weights')
    cfg.capabilities = [...caps]
    // 能力：features（思考/工具 等规约到前端同义键，供会话侧按钮联动）
    const features = new Set<string>(Array.isArray(cfg.features) ? cfg.features : [])
    if (res.reasoning) features.add('thinking')
    if (res.tool_call) features.add('tools')
    cfg.features = [...features]
    // 思考档位：reasoning_efforts（Models.dev reasoning_options 解析）
    if (Array.isArray(res.reasoning_efforts) && res.reasoning_efforts.length) {
      cfg.thinkingEfforts = res.reasoning_efforts
    }
    // 信息回填字段（编辑态只读展示 / 新增态保存下发）
    if (res.family) cfg.family = String(res.family)
    if (res.knowledge) cfg.knowledge = String(res.knowledge)
    if (res.release_date) cfg.releaseDate = String(res.release_date)
    if (res.last_updated) cfg.lastUpdated = String(res.last_updated)
    if (res.modalities && typeof res.modalities === 'object') cfg.modalities = res.modalities
  configMerged.value = true
}

/** 标记「自动获取已回填」：新增保存时把 family 等指标带到 payload */
const configMerged = ref(false)

/**
 * 新增态的**静默**自动补全：按模型名拉指标快照回填表单。
 *
 * <p>触发点只有一个 —— 从拉取列表点「选择」进入的新增表单（prefillFromFetch）。
 * 编辑态一律不自动补全：编辑的回显就是库里的值，再自动补一遍只会把手填内容
 * 盖掉（用户需求：只有新增才会补全，其它情况不处理）。</p>
 */
const autoFillMetrics = async () => {
  if (isEditMode.value) return
  const modelName = String(form.value.modelName || '').trim()
  if (!modelName) return
  try {
    const res: any = await apiService.fetchModelMetrics(props.provider.id, modelName)
    if (res && res.found !== false) mergeMetricSnapshot(res)
  } catch (error: any) {
    // 静默补全失败不打扰用户（指标源不可达 / 非管理员 403），控制台留痕即可
    console.debug('[ModelFormDialog] 自动补全指标参数跳过:', error)
  }
}

function configMergePayload() {
  const cfg = form.value.config || {}
  if (!configMerged.value || !isEditMode.value) {
    return cfg
  }
  // 编辑态：把自动获取的指标回填字段透传到 payload 顶层（与后端 toProviderModelResponse 键一致），
  // 保存时同步落库实体列
  const out: any = { ...cfg }
  if (cfg.family) out.family = cfg.family
  if (cfg.knowledge) out.knowledge = cfg.knowledge
  if (cfg.releaseDate) out.release_date = cfg.releaseDate
  if (cfg.lastUpdated) out.last_updated = cfg.lastUpdated
  if (cfg.modalities) out.modalities = cfg.modalities
  if (typeof cfg.openWeights === 'boolean') out.open_weights = cfg.openWeights
  if (typeof cfg.capabilities === 'object') {
    const c = cfg.capabilities || []
    out.attachment = c.includes('attachment') || false
    out.reasoning = c.includes('reasoning') || false
    out.tool_call = c.includes('tool_call') || false
    out.temperature_supported = c.includes('temperature') || false
    out.open_weights = c.includes('open_weights') || false
  }
  return out
}

/**
 * 编辑态只读展示的模型信息回填（family / knowledge / release_date / last_updated / modalities）。
 * 数据来自实体列与 metrics JSON（同步价格自动回填），仅编辑模型时展示。
 */
const modelBackfill = computed(() => !!editingModel.value && isEditMode.value)

const backfillRows = computed(() => {
  const m = editingModel.value || {}
  const cfg = form.value?.config || {}
  const rows: Array<{ label: string; value: string }> = []
  const push = (label: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return
    const text = Array.isArray(value)
      ? value.join(' / ')
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
    if (text) rows.push({ label, value: text })
  }
  push(t('settings.providerDetail.family'), cfg.family ?? m.family ?? m.metrics?.model_family)
  push(t('settings.providerDetail.knowledge'), cfg.knowledge ?? m.knowledge ?? m.metrics?.knowledge_cutoff)
  push(t('settings.providerDetail.releaseDate'), cfg.releaseDate ?? m.release_date ?? m.releaseDate ?? m.metrics?.release_date)
  push(t('settings.providerDetail.lastUpdated'), cfg.lastUpdated ?? m.last_updated ?? m.lastUpdated ?? m.metrics?.last_updated)
  push(t('settings.providerDetail.openWeights'), cfg.openWeights ?? m.open_weights ?? m.openWeights ?? m.metrics?.open_weights)
  const modalities = cfg.modalities ?? m.modalities ?? m.metrics?.modalities
  if (modalities && typeof modalities === 'object') {
    const input = Array.isArray(modalities.input) ? modalities.input.join(' / ') : ''
    const output = Array.isArray(modalities.output) ? modalities.output.join(' / ') : ''
    if (input || output) {
      push(t('settings.providerDetail.modalities'), `输入: ${input || '-'}  输出: ${output || '-'}`)
    }
  }
  return rows
})

const customParamsStr = computed({
  get() {
    try {
      return JSON.stringify(form.value.config.customParameters, null, 2)
    } catch {
      return ''
    }
  },
  set(val) {
    try {
      form.value.config.customParameters = val.trim() === '' ? {} : JSON.parse(val)
    } catch {
      // 解析失败不更新
    }
  },
})

const matchedPreset = computed(() => {
  if (!form.value.modelName) return null
  const lower = form.value.modelName.toLowerCase()
  return (
    props.modelPresets.find((p: any) => {
      // 旧版预设 schema（ai-guada 自带后端）：{ label, patterns, modeType, config }
      if (
        Array.isArray(p.patterns) &&
        p.patterns.some((src: string) => new RegExp(src).test(lower))
      ) {
        return true
      }
      // 系统后端 schema（AiModelPresetController）：预设库 = 已启用的供应商模型，
      // 条目为 { model, name, capabilities, description }，无 patterns。
      // 按模型名精确匹配——用户输入已配置过的模型名时给出一键回填提示。
      return !!p.model && String(p.model).toLowerCase() === lower
    }) || null
  )
})

const applyPreset = (preset: any) => {
  // 系统后端预设（{ model, name, capabilities }）：
  // capabilities 结构与 sys_ai_provider_model 行一致（task / traits / …），
  // 复用 inferModelType / deriveModelTraits 推导类型、模态与能力。
  if (!preset.config && Array.isArray(preset.capabilities)) {
    const modelType = inferModelType(preset)
    const traits = deriveModelTraits(preset, modelType)
    form.value.modelType = modelType
    form.value.config = createDefaultModelConfig({
      inputCapabilities: traits.inputCapabilities,
      outputCapabilities: traits.outputCapabilities,
      features: traits.features,
    })
    return
  }
  form.value.modelType = preset.modeType
  if (!MODEL_SUBTYPE_OPTIONS[form.value.modelType]?.some((opt) => opt.value === form.value.subType)) {
    form.value.subType = ''
  }
  form.value.config = createDefaultModelConfig({
    inputCapabilities: preset.config.inputCapabilities,
    outputCapabilities: preset.config.outputCapabilities,
    features: preset.config.features,
    contextWindow: preset.config.contextWindow,
    vectorDimensions: preset.config.vectorDimensions,
  })
}

const rules = computed(() => ({
  modelName: { required: true, message: t('settings.providerDetail.modelNameRequired'), trigger: 'blur' },
  modelType: { required: true, message: t('settings.providerDetail.modelTypeRequired'), trigger: 'change' },
  'config.contextWindow': {
    validator: (_r: any, v: any) => !v || v > 0,
    message: t('settings.providerDetail.contextWindowInvalid'),
    trigger: 'blur',
  },
  'config.maxOutputTokens': {
    validator: (_r: any, v: any) => !v || v > 0,
    message: t('settings.providerDetail.maxOutputTokensInvalid'),
    trigger: 'blur',
  },
}))

const selectModelType = (type: any) => {
  form.value.modelType = type.value
  if (!subTypeOptions.value.some((opt) => opt.value === form.value.subType)) {
    form.value.subType = ''
  }
}

const openAdd = () => {
  isEditMode.value = false
  editingId.value = null
  form.value = { modelName: '', modelType: 'text', subType: '', config: createDefaultModelConfig() }
  formRef.value?.clearValidate?.()
  visible.value = true
}

const openEdit = (model: any) => {
  isEditMode.value = true
  editingId.value = model.id
  editingModel.value = model
  form.value = {
    modelName: model.modelName || '',
    alias: model.alias || '',
    modelType: model.modelType || 'text',
    subType: model.subType || model.modelSubType || model.config?.modelSubType || inferSubType(model, model.modelType || 'text'),
    // generate 节点后端已回传（toProviderModelResponse），这里带回生成参数
    config: createDefaultModelConfig({
      ...model.config,
      generate: model.generate,
      // 图片输入输出细化（张数 / 参考图）：后端同样以顶层 image 节点回传
      image: model.image,
      // 档位后端同样以顶层 thinking_efforts 回传（见 ApiProviderController.toProviderModelResponse）
      thinkingEfforts: model.thinking_efforts,
      // 能力开关：由实体列/metrics 推导（编辑回显勾选态）
      capabilities: model.config?.capabilities ?? deriveCapabilitySwitches(model),
    }),
  }
  formRef.value?.clearValidate?.()
  visible.value = true
}

const prefillFromFetch = (model: any) => {
  const type = model.modelType || inferModelType(model)
  form.value = {
    modelName: model.modelName || '',
    alias: model.alias || '',
    modelType: type,
    subType: model.subType || model.modelSubType || model.config?.modelSubType || inferSubType(model, type),
    config: mergeFetchConfig(model, type),
  }
  visible.value = true
  // 只有新增才会补全（见 autoFillMetrics）：拉取列表里选中的行往往只有模型名，
  // 上下文 / 能力等参数在这里静默从指标端点补齐，不必再手动点「自动获取」。
  // 编辑态不补（openEdit 自己回显库里的值），这是本函数的固有前提，这里仍显式判断。
  void autoFillMetrics()
}

/**
 * 合并「上游拉取行」与它可能自带的 config。
 *
 * <p>上游行是扁平的（context_window / modalities / attachment …），由
 * {@link deriveFetchedModelConfig} 推导；已映射过的行自带 config 时以 config 为准，
 * 但空数组 / null 不能把推导值盖掉，否则输入输出能力又回到只有 text。</p>
 */
const mergeFetchConfig = (model: any, type: string) => {
  const cfg = model?.config && typeof model.config === 'object' ? model.config : {}
  const derived = deriveFetchedModelConfig(model, type)
  return createDefaultModelConfig({
    ...derived,
    ...cfg,
    inputCapabilities: listOr(cfg.inputCapabilities, derived.inputCapabilities),
    outputCapabilities: listOr(cfg.outputCapabilities, derived.outputCapabilities),
    features: listOr(cfg.features, derived.features),
    capabilities: listOr(cfg.capabilities, derived.capabilities),
    contextWindow: cfg.contextWindow ?? derived.contextWindow,
    maxOutputTokens: cfg.maxOutputTokens ?? derived.maxOutputTokens,
    temperature: cfg.temperature ?? derived.temperature,
    topP: cfg.topP ?? derived.topP,
    frequencyPenalty: cfg.frequencyPenalty ?? derived.frequencyPenalty,
  })
}

/** 非空数组优先，否则回退推导值 */
const listOr = (primary: any, fallback: any) =>
  Array.isArray(primary) && primary.length ? primary : fallback

/**
 * 仅显示但不重置表单数据：当从 fetchDialog 的「手动添加」退回时，
 * 表单可能已经打开且用户已填了部分内容，不能再调 openAdd 清空。
 */
const show = () => { visible.value = true }
const close = () => { visible.value = false }
defineExpose({ openAdd, openEdit, prefillFromFetch, show, close })

const handleSave = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  // 账号渠道 provider：新建模型时，模型名必须在该渠道已启用模型列表中
  if (!isEditMode.value && isChannelProvider(props.provider)) {
    const modelName = String(form.value.modelName || '').trim()
    if (modelName) {
      try {
        const channelPlatform = String(props.provider?.platform || props.provider?.provider || props.provider?.id || '').toLowerCase()
        const res: any = await channelApi.list()
        const allChannels: any[] = (res as any)?.data ?? res
        const channelList = Array.isArray(allChannels) ? allChannels : []
        const hit = channelList.find((c: any) => c.channel === channelPlatform || c.providerId === props.provider.id)
        if (hit) {
          const enabledModels: string[] = (Array.isArray(hit.models) ? hit.models : [])
            .filter((m: any) => m.enabled !== false)
            .map((m: any) => String(m.model || m.alias || ''))
          if (enabledModels.length > 0 && !enabledModels.includes(modelName)) {
            message.warning(`该渠道当前已启用的模型为：${enabledModels.join('、')}，请在渠道管理页开启目标模型后再添加`)
            return
          }
        }
      } catch {
        // 校验失败不阻断保存
      }
    }
  }
  saving.value = true
  try {
    // 保存时把规范类型写入 capabilities[].task，供刷新后回显与系统配置分组
    const task = TYPE_TO_TASK[form.value.modelType] || 'chat'
    const caps = form.value.config?.capabilities || []
    const merged = configMergePayload()
    const payload = {
      ...form.value,
      ...merged,
      providerId: props.provider.id,
      capabilities: [{ task, traits: [] }],
      // 思考强度档位：后端写进 capabilities[].thinking_efforts
      // （复用已有 JSON 列，不新增数据库字段；见 ApiProviderController.applyThinkingEfforts）
      thinking_efforts: form.value.config.thinkingEfforts,
      // 能力开关：config.capabilities 勾选态 → 顶层实体列（后端 boolOrNull 落库）
      attachment: caps.includes('attachment'),
      reasoning: caps.includes('reasoning'),
      tool_call: caps.includes('tool_call'),
      temperature_supported: caps.includes('temperature'),
      open_weights: caps.includes('open_weights'),
      // 自动获取回填的信息字段（family/knowledge/release_date/last_updated/modalities）
      ...(merged.family ? { family: merged.family } : {}),
      ...(merged.knowledge ? { knowledge: merged.knowledge } : {}),
      ...(merged.release_date ? { release_date: merged.release_date } : {}),
      ...(merged.last_updated ? { last_updated: merged.last_updated } : {}),
      ...(merged.modalities ? { modalities: merged.modalities } : {}),
    }
    if (isEditMode.value) {
      if (editingId.value) await apiService.updateModel(editingId.value, payload)
      message.success(t('settings.providerDetail.modelUpdated'))
    } else {
      await apiService.createModel(payload)
      message.success(t('settings.providerDetail.modelAdded'))
    }
    visible.value = false
    emit('saved')
  } catch (error: any) {
    message.error(error?.message || '模型信息保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.me-layout {
  display: flex;
  height: min(560px, 62vh);
  /* 原值 14px → lg 档（距 12/16 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

/* 类型轨 */
.me-rail {
  width: 176px;
  flex-shrink: 0;
  padding: 14px 12px;
  border-right: 1px solid var(--color-surface-border);
  background: var(--el-fill-color-light);
}
.me-rail-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-gray);
  margin-bottom: 12px;
  letter-spacing: .4px;
}
.me-rail-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
.me-rail-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 8px;
  /* 原值 11px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  font-size: 13px;
  color: var(--color-text-gray);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.me-rail-item:hover { background: var(--el-fill-color); color: var(--color-text); }
.me-rail-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; flex-shrink: 0;
  /* 原值 9px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  color: var(--color-text-gray);
  box-shadow: inset 0 0 0 1px var(--el-border-color-lighter);
}
.me-rail-name { flex: 1; }
.me-rail-check { color: var(--el-color-primary); flex-shrink: 0; }
.me-rail-item.active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-weight: 600;
}
.me-rail-item.active .me-rail-ico {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-5);
}

/* 配置区 */
.me-body { flex: 1; min-width: 0; overflow-y: auto; padding: 18px 20px; background: var(--el-bg-color); }
.me-body::-webkit-scrollbar { width: 7px; }
/* 原值 4px，7px 宽的滑块近似胶囊；用 full 令牌表达同一种形状 */
.me-body::-webkit-scrollbar-thumb { border-radius: var(--el-radius-full, 9999px); background: var(--el-border-color-lighter); }
.me-form { display: flex; flex-direction: column; }

/* 扁平分区 */
.me-section { padding: 2px; }
.me-section + .me-section {
  border-top: 1px solid var(--color-surface-border);
  margin: 16px 0 0;
  padding: 18px 2px 2px;
}
.me-section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.me-section-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  /* 原值 11px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.me-section-title { font-size: 13.5px; font-weight: 700; color: var(--color-text); letter-spacing: .2px; }

/* 类型配置内部 */
.me-group { margin-bottom: 2px; }
.me-group-title {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--color-text-gray);
  margin-bottom: 12px;
  letter-spacing: .4px;
}
.me-group-title.mt { margin-top: 20px; }

.me-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
}

.cap-label { display: inline-flex; align-items: center; }
.num-input { width: 100%; }

/* 图片能力细化：张数 / 参考图。放在能力勾选的同一个表单项里、勾选行下面一行展开，
   不再单独占一个带 label 的表单项（用户需求 1：图片类输入输出直接支持张数与参考图） */
.img-extra {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 18px;
  width: 100%;
  margin-top: 2px;
}
.img-extra-field { display: inline-flex; align-items: center; gap: 8px; }
.img-extra-label { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; }
.img-extra .num-input { width: 120px; }
.field-hint { font-size: 12px; color: var(--color-text-disabled); line-height: 1.6; }
/* 生成参数：表单项内的补充说明与并排输入 */
.me-hint {
  margin-left: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-disabled);
}
.me-inline {
  display: flex;
  gap: 8px;
  width: 100%;
}
.me-inline :deep(.el-input-number) { flex: 1; min-width: 0; }
.preset-hint {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  margin-top: 6px;
}
.api-key-input-wrapper { display: flex; gap: 8px; width: 100%; }

/* 圆角控件 */
.me-body :deep(.el-form-item) { margin-bottom: 15px; }
.me-body :deep(.el-form-item__label) {
  font-size: 12.5px; font-weight: 600; color: var(--color-text-gray);
  padding-bottom: 6px; line-height: 1.4;
}
.me-body :deep(.el-input__wrapper),
.me-body :deep(.el-textarea__inner),
.me-body :deep(.el-select__wrapper) {
  /* 原值 11px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
  background: var(--el-bg-color);
}
.me-body :deep(.el-input__wrapper.is-focus),
.me-body :deep(.el-textarea__inner:focus),
.me-body :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px var(--el-color-primary-light-9);
}
.me-body :deep(.el-checkbox-button:first-child .el-checkbox-button__inner) {
  /* 原值 10px → lg 档，与外层控件圆角一致 */
  border-top-left-radius: var(--el-radius-lg, 12px);
  border-bottom-left-radius: var(--el-radius-lg, 12px);
}
.me-body :deep(.el-checkbox-button:last-child .el-checkbox-button__inner) {
  /* 原值 10px → lg 档，与外层控件圆角一致 */
  border-top-right-radius: var(--el-radius-lg, 12px);
  border-bottom-right-radius: var(--el-radius-lg, 12px);
}

/* 底部按钮 */
.me-footer { display: flex; justify-content: flex-end; gap: 10px; }
/* 原值 11px → lg 档 */
.me-foot-btn { border-radius: var(--el-radius-lg, 12px); }
/* 按钮配色回归 Element Plus 默认（不再自造背景 / 边框 / 悬停主色） */

/* 动效降级：系统开启「减少动态效果」时，左侧导航项的底色与文字直接到位。
   只关 .me-rail-item 自己的 transition，不写 `*` / `.me-rail-item *` 通配，
   避免把 el-form / el-input / el-select 内部 Element Plus 组件的合法过渡一起掐掉
   （特别是下面 .is-focus 那条inset 描边环，它是输入框的焦点指示，不能被降级掉）。
   本文件只有 transition、无 animation，.active 选中态是静态声明，照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .me-rail-item {
    transition: none;
  }
}

/* 键盘焦点可见性：左侧导航项与「已匹配到预设」提示都是带 @click 的 div
   （不是可聚焦控件），浏览器不给默认焦点环。
   两者原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 弹层底色是令牌化的 --el-bg-color，一档主色描边足够可见。
   预设提示本身是主色文字，环与文字同源、不冲突。 */
.me-rail-item,
.preset-hint {
  outline: none;
}

.me-rail-item:focus-visible,
.preset-hint:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
