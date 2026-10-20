<template>
  <div class="flex-1">
    <!-- 动态渲染所有配置分组 -->
    <SettingsCard v-for="group in displayGroups" :key="group.group" :title="group.groupName"
      v-show="!fieldSearch || groupMatchesSearch(group)">
      <!-- 模型字段：始终显示 -->
      <SettingsRow
        v-for="item in visibleFields(group)"
        :key="item.field"
        :label="getFieldLabel(item)"
        :description="item.description"
        :tip="getFieldTip(item)"
        :risk="getFieldRisk(item)"
        :risk-tip="getFieldRiskTip(item)"
        control-flex
      >
        <!-- STRING：模型选择器 -->
        <el-input
          v-if="item.valueType === 'STRING' && isModelField(group.group, item.field)"
          :model-value="modelFieldDisplay(group.group, item.field)"
          readonly
          class="cursor-pointer"
          @click="openModelDialog(group.group, item.field)"
        >
          <template #prefix>
            <img v-if="getFieldModelLogo(group.group, item.field)" :src="getFieldModelLogo(group.group, item.field)"
              alt="" class="w-4 h-4 object-contain" />
            <OpenAI v-else class="w-4 h-4" />
          </template>
          <template #suffix>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </template>
        </el-input>
        <!-- STRING：枚举下拉 -->
        <el-select v-else-if="item.valueType === 'STRING' && isEnumField(item)"
          :model-value="getFieldValue(group.group, item.field)"
          @update:model-value="updateFieldValue(group.group, item.field, $event)"
          class="w-full">
          <el-option v-for="opt in optionsOf(item)" :key="opt" :label="opt" :value="opt" />
        </el-select>
        <!-- STRING：普通文本 -->
        <el-input v-else-if="item.valueType === 'STRING'"
          :model-value="getFieldValue(group.group, item.field)"
          @input="updateFieldValue(group.group, item.field, $event)" />
        <!-- NUMBER -->
        <el-input-number v-else-if="item.valueType === 'NUMBER'"
          :model-value="Number(getFieldValue(group.group, item.field))"
          @change="(val) => updateFieldValue(group.group, item.field, val)"
          :step="numberStep(group.group, item.field)" :precision="numberPrecision(group.group, item.field)" class="w-full" />
        <!-- BOOLEAN -->
        <el-switch v-else-if="item.valueType === 'BOOLEAN'"
          :model-value="getFieldValue(group.group, item.field) === 'true'"
          @update:model-value="updateFieldValue(group.group, item.field, $event ? 'true' : 'false')" />
      </SettingsRow>

      <!-- 向量库配置：仅 RAG 组 + 管理员（描述器驱动的动态表单，保存到全局层）。
           后端 /v2/rag/options.vectorStorageOptions 返回每个 SPI 的字段声明，
           前端据此渲染表单；新增向量库实现无需再改这里。

           样式说明：这块原先是手搓的 .vs-head/.vs-title 虚线子块，与同卡片的
           「高级选项」折叠面板完全是两套视觉语言，看着像另一个功能的残渣。
           这里改为复用同一个 el-collapse + .adv-head 外观，只在标题上挂一个
           「管理员」徽标以说明作用域——折叠交互、箭头、字号、间距全部与高级选项一致。 -->
      <el-collapse v-if="group.group === 'rag' && isAdmin()" v-model="activeAdvanced"
        class="adv-collapse">
        <el-collapse-item name="vector-storage">
          <template #title>
            <div class="adv-head">
              <span class="adv-title">向量库配置</span>
              <span class="adv-badge">管理员专属 · 保存到全局</span>
              <el-icon class="adv-chevron"><ArrowDown /></el-icon>
            </div>
          </template>
          <SettingsRow label="向量库实现" :description="selectedDescriptor?.description" control-flex>
            <el-select v-model="selectedVectorStorage" class="w-full">
              <el-option v-for="desc in vectorStorageOptions" :key="desc.name"
                :label="desc.displayName || desc.name" :value="desc.name">
                <div class="vs-opt-row">
                  <span>{{ desc.displayName || desc.name }}</span>
                  <span class="vs-opt-sub">{{ desc.name }}</span>
                </div>
              </el-option>
            </el-select>
          </SettingsRow>
          <SettingsRow v-for="field in selectedVectorFields" :key="field.key"
            :label="field.label" :description="field.description"
            :tip="fieldTip(field)"
            :badge="field.required ? '必填' : undefined" control-flex>
            <!-- 密码/敏感字段：保存后不回显，留空=保持不变 -->
            <el-input v-if="field.secret || field.type === 'PASSWORD'"
              v-model="vectorFormValues[field.key]"
              type="password" show-password clearable
              :placeholder="secretPlaceholder(field)" />
            <!-- 数字 -->
            <el-input-number v-else-if="field.type === 'NUMBER'"
              v-model="vectorFormValues[field.key]" class="w-full" />
            <!-- 开关 -->
            <el-switch v-else-if="field.type === 'BOOLEAN'"
              v-model="vectorFormValues[field.key]" />
            <!-- 下拉 -->
            <el-select v-else-if="field.type === 'SELECT'" v-model="vectorFormValues[field.key]"
              class="w-full" clearable>
              <el-option v-for="opt in (field.options || [])" :key="opt" :label="opt" :value="opt" />
            </el-select>
            <!-- 文本（含 PATH：服务器路径，暂以文本输入） -->
            <el-input v-else v-model="vectorFormValues[field.key]"
              :placeholder="field.placeholder || ''" clearable />
          </SettingsRow>
          <div class="vs-actions">
            <ReButton type="primary" :loading="vectorConfigSaving" @click="saveVectorConfig">
              保存向量库配置
            </ReButton>
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 高级选项：折叠显示 -->
      <el-collapse v-if="hasAdvancedSettings(group)" v-model="activeAdvanced" class="adv-collapse">
        <el-collapse-item :name="group.group">
          <template #title>
            <div class="adv-head">
              <span class="adv-title">高级选项</span>
              <el-icon class="adv-chevron"><ArrowDown /></el-icon>
            </div>
          </template>
          <SettingsRow
            v-for="item in advancedFields(group)"
            :key="item.field"
            :label="getFieldLabel(item)"
            :description="item.description"
            :tip="getFieldTip(item)"
            :risk="getFieldRisk(item)"
            :risk-tip="getFieldRiskTip(item)"
            control-flex
          >
            <!-- usage_sync_providers 多选 -->
            <el-select v-if="item.field === 'usage_sync_providers'"
              :model-value="getFieldValue(group.group, item.field) ? getFieldValue(group.group, item.field).split(',') : []"
              @update:model-value="(val) => updateFieldValue(group.group, item.field, val.join(','))"
              multiple clearable placeholder="留空=全部启用" class="w-full">
              <el-option v-for="parser in usageParsers" :key="parser.name" :label="parser.name" :value="parser.name" />
            </el-select>
            <!-- 系统提示词：多行文本 -->
            <el-input v-else-if="item.valueType === 'STRING' && isPromptField(item.field)"
              :model-value="getFieldValue(group.group, item.field)"
              type="textarea" :rows="4" maxlength="2000" show-word-limit
              @input="updateFieldValue(group.group, item.field, $event)" />
            <!-- 枚举下拉 -->
            <el-select v-else-if="item.valueType === 'STRING' && isEnumField(item)"
              :model-value="getFieldValue(group.group, item.field)"
              @update:model-value="updateFieldValue(group.group, item.field, $event)"
              class="w-full">
              <el-option v-for="opt in optionsOf(item)" :key="opt" :label="opt" :value="opt" />
            </el-select>
            <!-- 普通文本 -->
            <el-input v-else-if="item.valueType === 'STRING'"
              :model-value="getFieldValue(group.group, item.field)"
              @input="updateFieldValue(group.group, item.field, $event)" />
            <!-- NUMBER -->
            <el-input-number v-else-if="item.valueType === 'NUMBER'"
              :model-value="Number(getFieldValue(group.group, item.field))"
              @change="(val) => updateFieldValue(group.group, item.field, val)"
              :step="numberStep(group.group, item.field)" :precision="numberPrecision(group.group, item.field)" class="w-full" />
            <!-- BOOLEAN -->
            <el-switch v-else-if="item.valueType === 'BOOLEAN'"
              :model-value="getFieldValue(group.group, item.field) === 'true'"
              @update:model-value="updateFieldValue(group.group, item.field, $event ? 'true' : 'false')" />
          </SettingsRow>
        </el-collapse-item>
      </el-collapse>

    </SettingsCard>

    <!-- 模型选择对话框 -->
    <LDialog v-model="modelDialogVisible" title="选择模型" width="600px">
      <div class="md-body">
        <el-input v-model="modelSearchText" placeholder="搜索模型..." clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="md-list">
          <div v-for="provider in filteredProviders" :key="provider.id">
            <div class="md-provider">{{ provider.name }}</div>
            <div v-for="model in provider.models" :key="model.id" class="md-row"
              @click="selectModel(model.id)">
              <div class="md-row-left">
                <img v-if="getModelRowLogo(model)" :src="getModelRowLogo(model)" alt=""
                  class="w-4 h-4 object-contain shrink-0" />
                <span class="md-name">{{ model.model }}</span>
                <span class="md-tags">
                  <ReTag v-for="tag in model.displayTags" :key="tag.value" :type="tag.tagType" >
                    {{ tag.label }}
                  </ReTag>
                </span>
              </div>
              <el-icon v-if="tempModelId === model.id" class="md-check" :size="18">
                <CheckCircleFilled />
              </el-icon>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredProviders.length === 0" class="md-empty">
            <div class="md-empty-main">没有匹配「{{ currentTypeLabel }}」类型的模型</div>
            <div class="md-empty-sub">请先在「模型管理」中添加对应类型的模型</div>
          </div>
        </div>
      </div>
      <template #footer>
        <ReButton type="default" @click="clearModelField">清空（使用默认）</ReButton>
      </template>
    </LDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { OpenAI } from "@/components/icons";
import { ArrowDown, Search } from "@element-plus/icons-vue";
import { CheckCircleFilled } from "@vicons/material";

import { apiService } from '@/services/ApiService'
import { adminApi } from '@/framework/context'
import { usePopup } from '@/composables/usePopup'
import { useModelConfigStore } from '@/stores/modelConfig'
import LDialog from '@/components/ui/LDialog.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReTag from '@/components/re/ReTag.vue'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import ImageLibraryPanel from './ImageLibraryPanel.vue'
import { isAdmin } from '@repo/core'
import { getModelAvatarPath } from '@/utils/modelUtils'
import { MODEL_SUBTYPE_LABELS } from '@/components/models/model.constants'
import { inferSubType } from '@/components/models/model.utils'

// Element Plus 组件导入
import {
    ElInput,
    ElInputNumber,
    ElSwitch,
    ElIcon,
    ElButton,
    ElSelect,
    ElOption,
    ElCollapse,
    ElCollapseItem
} from 'element-plus'

const { t } = useI18n()
const { notify } = usePopup()
/**
 * 模型门禁 store：本页保存 face / image_search 后要即时刷新它，
 * 侧栏菜单的「未配置」徽标与人脸/以图搜图页的门禁才会立刻跟着变
 * （否则要等下次进页面重新拉合并视图）。
 */
const modelConfig = useModelConfigStore()

// 配置分组定义
const settingGroups = ref([])

/**
 * 拆分菜单复用本组件时传入要渲染的分组；不传则渲染默认模型页全部分组。
 */
const props = defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
})

/**
 * 从默认模型页拆出的独立配置分组：这些分组有各自的设置中心菜单，
 * 再出现在整页里就是「同一批字段两个入口、各自保存互相打架」。
 *
 * <p>图像上色**不在此列**：它是 image 分组里的两个字段（colorize_model /
 * colorize_device），量级够不上独立菜单，按需求并回默认模型页。
 * <p>对话路由（runtime）也在此列：默认对话模型、标题总结、历史压缩、翻译模型等
 * 本就是「会话」语义，与整页的模型选择混在一起反而更难找，已挪到会话配置页。</p>
 */
const SPLIT_GROUPS = ['face', 'image_search', 'layout', 'rag', 'ocr', 'bot', 'language', 'runtime']

/** 传入 groups 时只渲染指定分组（设置中心拆出的独立菜单复用同一套交互与保存逻辑） */
const displayGroups = computed(() => {
  const all = settingGroups.value
  if (!props?.groups?.length) {
    return all.filter((g) => !SPLIT_GROUPS.includes(g.group))
  }
  return all.filter((g) => props.groups.includes(g.group))
})

// 各分组的实际值
const groupValues = reactive({})

// 每个字段的归属信息（overridden 是否本人覆盖、defaultValue 继承值），来自 /settings/{group}/merged
const fieldMeta = reactive({})

// 本次改动过的字段（按分组记录）：保存时只提交这些字段，
// 免得把没动过的项也写成个人覆盖，从此屏蔽掉全局默认的后续变更
const dirtyFields = reactive({})

// 模型数据
const models = ref([])
const providers = ref([])

// Usage Parser SPI 列表
const usageParsers = ref([])

// 高级选项展开的分组
const activeAdvanced = ref([])

// ===================== 向量库配置（描述器驱动的动态表单） =====================
// 后端 VectorStorageProvider SPI 的 descriptor() 声明每个实现的配置项（键/类型/必填/敏感），
// /v2/rag/options.vectorStorageOptions 原样下发；前端据此渲染表单——新增向量库实现
// 后端注册 SPI 即自动出现，无需改这里。保存走 /v2/global-settings（全局层、管理员专属）：
// 向量库连接是共享基础设施，不属于个人偏好；RagClientManager 读全局值动态建库。
const vectorStorageOptions = ref([])
const selectedVectorStorage = ref('')
const savedVectorConfig = ref({})
const vectorFormValues = reactive({})
const vectorConfigSaving = ref(false)

// 当前选中实现的描述器
const selectedDescriptor = computed(() =>
    vectorStorageOptions.value.find((d) => d?.name === selectedVectorStorage.value) || null)

// 选中实现的配置字段（无需配置的实现返回空列表，表单区自动隐藏）
const selectedVectorFields = computed(() => selectedDescriptor.value?.fields || [])

// 敏感字段占位：已保存（后端回掩码）→ 提示留空保持不变；未保存 → 字段自己的提示
const secretPlaceholder = (field) => {
    const saved = savedVectorConfig.value[selectedVectorStorage.value]
    const has = saved && saved[field.key] != null && String(saved[field.key]).trim() !== ''
    return has ? '已保存（留空保持不变）' : (field.placeholder || '')
}

// 读取全局设置里的当前向量库与已保存配置（敏感字段后端已掩码为 ******）
const loadVectorGlobalSettings = async () => {
    try {
        const resp = await apiService._request('/global-settings')
        const data = resp?.data ?? resp ?? {}
        selectedVectorStorage.value = data.ragVectorStorage || 'jvector'
        savedVectorConfig.value = data.ragVectorStorageConfig || {}
        resetVectorFormValues()
    } catch (error) {
        console.warn('[设置] 读取全局向量库配置失败:', error?.message || error)
    }
}

// 切换向量库或加载完成后，按描述器重置表单值（敏感字段不回显）。
// BOOLEAN 统一转布尔：描述器默认值是字符串 "true"/"false"，直接用会触发
// el-switch 的 model-value 类型告警；已保存值可能是 JSON 布尔或字符串，一并归一。
const resetVectorFormValues = () => {
    Object.keys(vectorFormValues).forEach((k) => delete vectorFormValues[k])
    const saved = savedVectorConfig.value[selectedVectorStorage.value] || {}
    for (const field of selectedVectorFields.value) {
        if (field.secret) {
            vectorFormValues[field.key] = ''
            continue
        }
        const raw = saved[field.key] != null ? saved[field.key] : field.defaultValue
        if (raw == null) {
            vectorFormValues[field.key] = field.type === 'BOOLEAN' ? false
                : (field.type === 'NUMBER' ? undefined : '')
        } else if (field.type === 'BOOLEAN') {
            vectorFormValues[field.key] = raw === true || String(raw).toLowerCase() === 'true'
        } else if (field.type === 'NUMBER') {
            const n = Number(raw)
            vectorFormValues[field.key] = Number.isNaN(n) ? undefined : n
        } else {
            vectorFormValues[field.key] = raw
        }
    }
}

// 切换实现时表单跟着切（描述器变了，字段集合不同）
watch(selectedVectorStorage, () => resetVectorFormValues())

// 保存：PUT /v2/global-settings（DTO 部分更新；后端拒绝未注册 SPI/未知字段、
// 敏感字段留空自动保留原值、两层增量合并不抹其它库的配置）。
// 保存后顺手清掉本人 rag_vector_storage 的个人覆盖——旧界面把它写进过覆盖层，
// 覆盖层优先级高于全局值，不清掉的话新选择对该账号不生效。
const saveVectorConfig = async () => {
    try {
        vectorConfigSaving.value = true
        const fields = {}
        for (const field of selectedVectorFields.value) {
            const raw = vectorFormValues[field.key]
            if (raw === '' || raw == null) continue
            fields[field.key] = raw
        }
        const payload = { ragVectorStorage: selectedVectorStorage.value }
        if (selectedVectorFields.value.length > 0) {
            payload.ragVectorStorageConfig = { [selectedVectorStorage.value]: fields }
        }
        await apiService._request('/global-settings', { method: 'PUT', data: payload })
        try {
            await apiService.updateUserGroupOverrides('rag', { rag_vector_storage: null })
        } catch { /* 个人覆盖清不掉不致命：全局值已保存 */ }
        notify.success('向量库配置已保存')
        await loadVectorGlobalSettings()
    } catch (error) {
        console.error('保存向量库配置失败:', error)
        notify.error('保存向量库配置失败', error)
    } finally {
        vectorConfigSaving.value = false
    }
}

// 模型选择对话框相关
const modelDialogVisible = ref(false)
const modelSearchText = ref('')
const tempModelId = ref(null)
const currentDialogGroup = ref('')
const currentDialogField = ref('')

// ===================== 字段分组辅助 =====================
/**
 * 管理员专属字段对普通账号不可见。
 *
 * <p>定义接口会带出 {@code adminOnly} 标记（如 runtime 的 user_tool_access）；取值出口
 * 已剔除其值，若这里不过滤，普通账号会在「高级选项」里看到一个空的管理员专属开关。
 * 前端按同一标记隐藏，与后端 {@code adminOnlyFields} 保持一致。</p>
 *
 * @param item 定义项
 * @return true 表示当前账号可见
 */
const notAdminOnly = (item) => !(item && item.adminOnly === true && !isAdmin())

const modelFields = (group) =>
    (group.items || []).filter(item =>
        notAdminOnly(item) && isModelField(group.group, item.field) && shouldShowField(group.group, item.field))

/**
 * 是否属于「该直接显示、但不是选模型」的字段。
 *
 * <p>生成目录这类配置项名字里没有 "model"，会被判进「高级选项」折叠区 ——
 * 而它是用户在设置页里最想直接看到并改的一项，藏起来等于没有。
 * 这里把它们单独挑出来放到始终显示的那一块；注意不能直接让 isModelField 返回 true，
 * 那会走「模型选择器」那一支（只读输入框 + 弹模型对话框），语义完全不同。</p>
 */
const isPlainVisibleField = (group, field) =>
    (group === 'generate'
    && (String(field || '').startsWith('media_') || String(field || '') === 'task_timeout_minutes'))
    || (group === 'image_search' && String(field || '') === 'keyword_extractor')

/** 始终显示且不是选模型的字段 */
const plainVisibleFields = (group) =>
    (group.items || []).filter(item =>
        notAdminOnly(item) && !isModelField(group.group, item.field) && isPlainVisibleField(group.group, item.field) && shouldShowField(group.group, item.field))

/**
 * 该分组是否存在「始终显示」区域。
 *
 * <p>会话(session)分组里一个模型字段都没有，也没有 generate 的目录字段，
 * 于是 visibleFields 为空、advancedFields 吃掉了全部字段——卡片打开后只剩一个
 * 「高级选项」折叠条，正文空空如也，用户看不到任何可配项（实测：会话分组只有高级，
 * 不是设计如此，是这条过滤规则把整组都塞进了折叠区）。</p>
 *
 * <p>判据不能只看「有没有模型字段」：分组里可能只有几个开关（如 asr 的语言），
 * 那本来就该平铺。把它们无差别塞进「高级」同样会让用户觉得功能缺失。
 * 因此这里看的是「折叠区是否吞掉了整组的可见字段」。</p>
 */
const groupHasAlwaysVisibleFields = (group) =>
    modelFields(group).length > 0 || plainVisibleFields(group).length > 0

/** 始终显示的字段：选模型的 + 上面这类目录配置。
 *  分组若没有任何常驻字段，则全部字段平铺，不再套一层空的「高级选项」。 */
const visibleFields = (group) => {
    const always = [...modelFields(group), ...plainVisibleFields(group)]
    if (always.length > 0) return always
    return (group.items || []).filter(item =>
        notAdminOnly(item) && shouldShowField(group.group, item.field))
}

const advancedFields = (group) => {
    // 该分组没有常驻字段时，visibleFields 已平铺全部字段，折叠区必须为空，
    // 否则同一批字段会渲染两遍
    if (!groupHasAlwaysVisibleFields(group)) return []
    return (group.items || []).filter(item =>
        notAdminOnly(item) && !isModelField(group.group, item.field) && !isPlainVisibleField(group.group, item.field) && shouldShowField(group.group, item.field))
}

// ===================== 模型类型体系 =====================
// 规范类型中文标签
const TYPE_LABELS = {
    text: '对话',
    embedding: '嵌入',
    asr: '语音识别',
    tts: '语音合成',
    image: '文生图',
    video: '文生视频',
    rerank: '重排序',
    ocr: 'OCR识别',
    face: '人脸识别',
    layout: '布局识别',
    image_cv: '图片识别',
    detection: '检测'
}
// 规范类型 → ReTag 配色
const TYPE_TAG_TYPE = {
    text: 'primary',
    embedding: 'success',
    asr: 'info',
    tts: 'info',
    image: 'warning',
    video: 'danger',
    rerank: 'info',
    ocr: 'info',
    face: 'info',
    layout: 'info',
    image_cv: 'info',
    detection: 'info'
}
// 后端 capability.task → 规范类型
const TASK_TO_TYPE = {
    chat: 'text',
    text_generation: 'text',
    realtime_conversation: 'text',
    embedding: 'embedding',
    rerank: 'rerank',
    speech_recognition: 'asr',
    asr: 'asr',
    speech_synthesis: 'tts',
    tts: 'tts',
    image_generation: 'image',
    'text-to-image': 'image',
    image: 'image',
    video_generation: 'video',
    'text-to-video': 'video',
    video: 'video',
    ocr: 'ocr',
    ocr_recognition: 'ocr',
    face: 'face',
    face_recognition: 'face',
    layout: 'layout',
    // 图片识别 / 图像特征：后端 ApiProviderController.classifyOnnxTask 的兜底分支
    // 就归这一类（resnet/clip/dino 等），此前前端没有对应项，
    // 于是一律落到 'text'，「图像特征模型」字段的弹框里一个 CV 模型都看不到。
    image_cv: 'image_cv',
    image_feature: 'image_cv',
    feature_extraction: 'image_cv',
    detection: 'detection',
    detect: 'detection',
    object_detection: 'detection',
}
// feature 类 capability（属于附加能力，不是主类型）
const FEATURE_LABELS = {
    thinking: '深度思考',
    'web-search': '在线检索',
    tools: '工具调用',
    tool_calls: '工具调用'
}

// 依据模型名推断规范类型（与后端 inferTasks 对齐）
const inferTypeByName = (modelName) => {
    const l = String(modelName || '').toLowerCase()
    if (l.includes('embedding') || l.includes('embed') || l.includes('-bge-')) return 'embedding'
    if (l.includes('rerank')) return 'rerank'
    if (l.includes('tts') || l.includes('speech-synthesis') || l.includes('speech_synthesis')) return 'tts'
    if (l.includes('whisper') || l.includes('asr') || l.includes('speech-recognition')) return 'asr'
    if (l.includes('detect') || l.includes('-det-') || l.includes('yolo')
        || l.includes('scrfd') || l.includes('nms')) return 'detection'
    if (l.includes('dall-e') || l.includes('image-gen') || l.includes('cogview') || l.includes('flux') || l.includes('image')) return 'image'
    if (l.includes('cogvideo') || l.includes('video-gen') || l.includes('video')) return 'video'
    return 'text'
}

// 从 capabilities + 模型名解析模型的类型与特性
const resolveModelMeta = (modelName, capabilities) => {
    const types = []
    const features = []
    const subTypes = []
    ;(capabilities || []).forEach((cap) => {
        const task = cap?.task
        if (!task) return
        if (TASK_TO_TYPE[task]) {
            const t = TASK_TO_TYPE[task]
            if (!types.includes(t)) types.push(t)
        } else if (FEATURE_LABELS[task]) {
            if (!features.includes(task)) features.push(task)
        }
        const sub = cap?.subtype ?? cap?.subType
        if (sub && MODEL_SUBTYPE_LABELS[String(sub)] && !subTypes.includes(String(sub))) {
            subTypes.push(String(sub))
        }
    })
    // 名称强类型纠偏：**仅在 capabilities 没给出任何确定类型时**才生效。
    //
    // 原为「名称无条件优先」，本意是修正 capabilities 误标（如 agnes-image 被标成 chat）。
    // 但它会把 cn-clip-rn50-image、resnet50-feature 这类「名字里带 image 的图像特征模型」
    // 经 inferTypeByName 的 'image' 分支拽到「文生图」去 —— 而 capabilities 已经明确
    // 给了 embedding / image_cv。结果：「图像特征模型」字段的弹框里只剩扩散模型，
    // 真正的特征模型一个都选不到（实测：以图搜图因此永远配不上）。
    // 现在 capabilities 给出确定类型时以它为准，名称只在「空 / 只有 text」时兜底。
    const nameType = inferTypeByName(modelName)
    const hasDefinitive = types.some((t) => t !== 'text')
    if (!hasDefinitive && nameType !== 'text') {
        for (let i = types.length - 1; i >= 0; i--) {
            if (types[i] === 'text') types.splice(i, 1)
        }
        if (!types.includes(nameType)) types.unshift(nameType)
    }
    if (types.length === 0) types.push(nameType)

    const primaryType = types[0]
    const inferredSubType = inferSubType({ model: modelName, capabilities }, primaryType)
    if (inferredSubType && !subTypes.includes(inferredSubType)) {
        subTypes.push(inferredSubType)
    }
    const displayTags = [
        { value: `type:${primaryType}`, label: TYPE_LABELS[primaryType] || primaryType, tagType: TYPE_TAG_TYPE[primaryType] || 'info' }
    ]
    subTypes.forEach((sub) => displayTags.push({
        value: `sub:${sub}`,
        label: MODEL_SUBTYPE_LABELS[sub] || sub,
        tagType: 'info'
    }))
    // thinking / web-search / tools 等特性仅对话模型有意义
    if (primaryType === 'text') {
        features.slice(0, 2).forEach((f) =>
            displayTags.push({ value: `feat:${f}`, label: FEATURE_LABELS[f], tagType: 'info' })
        )
    }
    return { types, features, primaryType, displayTags, subTypes }
}

// 根据配置分组与字段，确定该字段需要的规范模型类型
const requiredTypeFor = (group, field) => {
    const g = String(group || '')
    const f = String(field || '').toLowerCase()
    // CV / ONNX 管线分组（非 OpenAI 兼容接口模型）
    if (g === 'face') return 'face'
    if (g === 'ocr') return 'ocr'
    if (g === 'layout') return 'layout'
    // 图片识别组里的检测模型是独立类型，分类/分割等仍归 image_cv
    if (g === 'image' && f === 'detect_model') return 'detection'
    if (g === 'image') return 'image_cv'
    if (g === 'asr') return 'asr'
    // 以图搜图：分组名 image_search 不在上面的 CV 名单里，而字段名
    // default_image_feature_model 又含 "image"，会被下面按名称的分支判成「文生图」
    // —— 弹框里只剩扩散模型，真正的图像特征模型一个都选不到
    // （实测：以图搜图因此永远配不上，门禁永远不亮）。
    // runtime 分组的同名兜底项同样处理（后端 ImageSearchStore 会回退读它）。
    // keyword_model 是关键词提取用的多模态模型，走模型管理里的 vLLM / OpenAI
    // 兼容对话模型，必须放行 text 类型，不能跟特征模型一样被锁在 image_cv。
    if (g === 'image_search' && f === 'keyword_model') return 'text'
    if (g === 'image_search') return 'image_cv'
    if (f === 'default_image_feature_model') return 'image_cv'
    // RAG / 其它字段按名称判断
    if (f.includes('embedding')) return 'embedding'
    if (f.includes('ocr')) return 'ocr'
    if (f.includes('rerank')) return 'rerank'
    if (f.includes('tts') || f.includes('speech_synthesis')) return 'tts'
    if (f.includes('video')) return 'video'
    if (f.includes('image')) return 'image'
    // 其余 LLM（runtime default/compression、bot、optimizer、memory extract、rag llm）→ 对话
    return 'text'
}

/**
 * 该字段**可以接受**的模型类型（弹框过滤用，可能多个）。
 *
 * <p>与 {@link requiredTypeFor} 分开：后者给标题用「这一类模型」的单数标签，
 * 前者决定列表里实际出现哪些模型。需要多值的只有一个场景 ——
 * 图像特征模型：后端 {@code classifyOnnxTask} 把名字里带 clip / dino / feature
 * 的模型归到 {@code embedding}（嵌入分支在前面截获），纯图片识别类的归
 * {@code image_cv}，两类都能抽图像特征。只认一类就会有一半模型选不到。</p>
 */
const acceptableTypesFor = (group, field) => {
    if (String(field || '') === 'default_image_feature_model') {
        return ['image_cv', 'embedding']
    }
    if (String(group || '') === 'image_search' && String(field || '') === 'keyword_model') {
        return ['text']
    }
    return [requiredTypeFor(group, field)]
}

/**
 * 设置字段要求的具体细分类型。
 *
 * <p>OCR 与人脸分组的每个独立模型槽位（detector_model、recognizer_model、
 * corrector_model、anime_detector_model 等）必须有细分类型才不会被错误模型占位；
 * 没有对应细分滤条件的字段不限制。</p>
 */
const SUBTYPE_FOR_FIELD = {
    'ocr.detector_model': ['ocr_detection'],
    'ocr.recognizer_model': ['ocr_recognition'],
    'ocr.corrector_model': ['ocr_correction'],
    'ocr.direction_model': ['ocr_direction'],
    'ocr.restorer_model': ['ocr_restore'],
    'face.detector_model': ['face_detection'],
    'face.feature_model': ['face_feature'],
    'face.landmark_model': ['face_landmark'],
    'face.liveness_model': ['face_liveness'],
    'face.anime_detector_model': ['anime_face_detection'],
    'face.restore_model': ['face_restore', 'face_enhance'],
    'face.attribute_model': ['face_attribute'],
    'face.emotion_model': ['face_emotion'],
    'face.deepfake_model': ['face_deepfake'],
    'face.recognizer_model': ['face_recognition'],
    'face.pose_model': ['face_pose'],
    'image.detect_model': ['object_detection', 'defect_detection'],
}

// 判断是否是模型字段（包含 model 关键词）
const isModelField = (group, field) => {
    if (!field) return false
    // protocol-server 分组的所有字段都直接显示（因为它没有模型字段）
    if (group === 'protocol-server') return true
    // 用量配置分组的"用量开关"直接显示，不放在高级选项里
    if (group === 'global' && field === 'enable_usage_analysis') return true
    return field.toLowerCase().includes('model')
}

// 判断是否是系统提示词字段（渲染为多行文本框）
const isPromptField = (field) => {
    if (!field) return false
    return field === 'system_prompt' || field.toLowerCase().endsWith('system_prompt')
}

/**
 * 引擎/服务商类字段：不属于「选模型」，界面上不再让用户挑。
 *
 * <p>引擎是实现细节，由所选模型决定：命中本地模型库 → onnx，否则按供应商 platform
 * 判定是否注册了 EmbeddingClient SPI。让用户选引擎既没意义也容易配错——实测种子把
 * {@code rag_embedding_model} 写成 {@code onnx}，界面显示成「已配置」，但从没有人配置过。
 * 后端已不再读取该字段，这里同步隐藏，避免旧库残留行继续以设置项形态出现。</p>
 */
const ENGINE_FIELDS = ['rag_embedding_model']

// 获取字段中文标签
const getFieldLabel = (item) => {
    // 从描述中提取中文名称
    // 值域兜底补的行（valueOnly）没有后端描述，但字段名可能在 labelMap 里
    // （如 corrector_model → 文本矫正模型），必须同样走这层，否则直接露出英文字段名
    if (item.description || item.valueOnly) {
        // 取描述的前几个字作为标签
        const labelMap = {
            'default_model': '默认模型',
            'classify_model': '分类模型',
            'detect_model': '检测模型',
            'segment_model': '分割模型',
            'captioning_model': '描述模型',
            'super_resolution_model': '超分模型',
            'detector_model': '检测模型',
            'feature_model': '特征模型',
            'liveness_model': '活体检测模型',
            'anime_detector_model': '动漫人脸检测模型',
            'restore_model': '修复模型',
            'attribute_model': '属性模型',
            'emotion_model': '表情模型',
            'landmark_model': '关键点模型',
            'deepfake_model': '换脸检测模型',
            'recognizer_model': '识别模型',
            'direction_model': '方向矫正模型',
            'restorer_model': '修复模型',
            'corrector_model': '文本矫正模型',
            'layout_model': '布局模型',
            'pose_model': '姿态估计模型',
            'optimizer_model': '优化模型',
            'compression_model': '压缩模型',
            'rag_embedding_model': 'Embedding引擎',
            'rag_llm_model': 'LLM模型',
            'image_model': '文生图模型',
            'colorize_model': '图像上色模型',
            'video_model': '文生视频模型',
            'media_base_path': '生成文件根目录',
            'media_upload_dir': '上传目录名',
            'task_timeout_minutes': '生成任务超时时间',
            'classify_threshold': '分类阈值',
            'detect_threshold': '检测阈值',
            'temperature': '温度',
            'max_tokens': '最大Tokens',
            'timeout_millis': '超时时间',
            'enabled': '启用',
            'super_resolution_enabled': '超分能力',
            'liveness_enabled': '活体检测',
            'quality_enabled': '质量评估',
            'anime_enabled': '动漫检测',
            'restore_enabled': '修复能力',
            'attribute_enabled': '属性分析',
            'emotion_enabled': '表情识别',
            'landmark_enabled': '关键点定位',
            'deepfake_enabled': '换脸检测',
            'device': '推理设备',
            'language': '语言',
            'vector_storage': '向量存储',
            'vector_algorithm': '向量算法',
            'compare_threshold': '比对阈值',
            'match_threshold': '检索阈值',
            'top_k': 'TopK',
            'min_face_size': '最小人脸尺寸',
            'liveness_threshold': '活体阈值',
            'feature_dimension': '特征维度',
            'nms_threshold': 'NMS阈值',
            'detector_threshold': '检测阈值',
            'sort_reading_order': '阅读顺序',
            'table_enabled': '表格识别',
            'reading_order_enabled': '阅读排序',
            'ocr_link_enabled': '联动OCR',
            'provider': '服务商',
            'provider_base_url': '接口地址',
            'provider_api_key': 'API Key',
            'provider_app_key': 'App Key',
            'provider_app_secret': 'App Secret',
            'factory': '工厂实现',
            'system_prompt': '系统提示词',
            'input_optimization_enabled': '输入优化',
            'context_compression_enabled': '上下文压缩',
            'context_compression_threshold': '压缩阈值',
            'context_compression_retain_messages': '保留消息数',
            'protocol_server_enabled': '协议服务',
            'protocol_server_port': '协议端口',
            'protocol_server_host': '协议地址',
            'extra_headers': '自定义请求头',
            'optimizer_enabled': '优化启用',
            'optimizer_prompt': '优化提示词',
            'optimizer_temperature': '优化温度',
            'rag_chunk_size': '分块大小',
            'rag_chunk_overlap': '分块重叠',
            'rag_upload_dir': '上传目录',
            'rag_system_prompt': '系统提示词',
            'rag_splitter': '分割器',
            'rag_default_top_k': '默认TopK',
            'rag_similarity_threshold': '相似度阈值',
            'rag_embedding_dimensions': '向量维度',
            'rag_embedding_base_url': 'Embedding地址',
            'rag_embedding_api_key': 'Embedding密钥',
            'rag_embedding_model_name': 'Embedding模型',
            'rag_client_provider': '客户端类型',
            'image_enabled': '文生图启用',
            'image_provider': '文生图服务商',
            'image_base_url': '文生图地址',
            'image_api_key': '文生图Key',
            'image_size': '出图尺寸',
            'image_negative_prompt': '负面提示词',
            'image_device': '文生图设备',
            'video_enabled': '文生视频启用',
            'video_provider': '文生视频服务商',
            'video_base_url': '文生视频地址',
            'video_api_key': '文生视频Key',
            'video_duration': '视频时长',
            'video_ratio': '视频比例',
            'enable_usage_analysis': '用量开关',
            'usage_report_interval': '同步时间',
            'usage_sync_providers': '同步数据源',
            'usage_timewheel_enabled': '时间轮调度',
            // 以图搜图：字段名比「模型」长得多（default_image_feature_model / vector_storage_engine /
            // search_top_k），此前不在表里，界面上直接显示英文原名。表只收录「人工确认过的短标签」，
            // 未收录的走下面的描述前缀兜底，不要再往这里堆。
            'default_image_feature_model': '图像特征模型',
            'vector_storage_engine': '向量存储实现',
            'search_top_k': '返回条数上限',
            'min_similarity': '相似度下限',
            'keyword_extractor': '关键词提取方式',
            'keyword_model': '图片信息提取模型',
            'keyword_prompt': '关键词提取提示词'
        }
        // 1) 优先用人工维护的短标签（精确、跨分组统一）
        if (labelMap[item.field]) {
            return labelMap[item.field]
        }
        // 2) 兜底：从描述里取中文前缀。
        //    provider 的 description 约定是「标签（补充说明）」或「标签：补充说明」，
        //    取首个分隔符之前的部分即可。
        //    为什么必须有这一层：labelMap 是硬编码的，后端新增一个设置项而前端忘了同步，
        //    界面就会直接显示英文字段名。实测以图搜图(default_image_feature_model)、
        //    记忆(memory_extract_model)、布局(layout_threshold)、用量(enable_usage_analysis)
        //    四个分组都中过这个招。有兜底后，漏项最多显示成稍长的中文，不会再露出英文。
        const prefix = String(item.description).match(/^\s*([^（(：:]{1,16})/)
        if (prefix && /[\u4e00-\u9fa5]/.test(prefix[1])) {
            return prefix[1].trim()
        }
        return item.field
    }
    return item.field
}

/**
 * 左侧小标题的「tip 兜底文案」。
 *
 * 默认模型页的字段标签来自后端描述/字段名，个别项（如动漫人脸检测模型、
 * 上下文压缩保留消息数、生成任务超时时间）很长，会把左侧文本列撑开、
 * 把右侧控件挤出可视区。SettingsRow 已经支持单行省略，这里只负责把完整文案
 * 交给气泡：短标题返回空（不显示问号图标，避免无意义的装饰）。
 */
const LONG_LABEL_THRESHOLD = 10

const getFieldTip = (item) => {
    const label = String(getFieldLabel(item) ?? '').trim()
    if (!label) return ''
    // 描述已单独成行展示，不再重复塞进气泡
    if (label.length <= LONG_LABEL_THRESHOLD) return ''
    return item.description ? `${label}：${item.description}` : label
}

/**
 * 字段的「变更风险」等级（5.6）。
 *
 * <p>只对**底库已有数据**时才有意义：空库换模型零成本，没必要吓唬用户。
 * 红点与黄点的分界是「改了之后已有数据还能不能用」：</p>
 *
 * <ul>
 *   <li><b>红（high）</b>：特征/识别模型。特征向量活在它定义的嵌入空间里，
 *       换模型等于换了一套坐标系，底库里所有人脸的旧向量全部对不上，
 *       1:N 检索会「谁都不匹配」——必须重新登记整库。</li>
 *   <li><b>黄（medium）</b>：检测/关键点/活体/分割/描述等。它们只影响**新登记**
 *       的处理过程，历史向量本身仍然有效；影响面存在但不致命。</li>
 * </ul>
 */
const HIGH_RISK_FIELDS = new Set(['feature_model', 'recognizer_model'])
const MEDIUM_RISK_FIELDS = new Set([
  'detector_model', 'landmark_model', 'liveness_model', 'segment_model',
  'captioning_model', 'anime_detector_model', 'attribute_model', 'emotion_model',
  'deepfake_model', 'direction_model',
])

/** 人脸底库 / 图像底库条目数；0 表示空库。加载失败按 0 处理（不打扰用户） */
const faceLibraryCount = ref(0)
const imageLibraryCount = ref(0)

const getFieldRisk = (item) => {
  const field = String(item?.field ?? '')
  if (HIGH_RISK_FIELDS.has(field)) {
    return faceLibraryCount.value > 0 ? 'high' : ''
  }
  if (MEDIUM_RISK_FIELDS.has(field)) {
    const count = groupIsFace(item) ? faceLibraryCount.value : imageLibraryCount.value
    return count > 0 ? 'medium' : ''
  }
  return ''
}

/** 该字段属于人脸底库还是图像底库：face 分组里混了图像侧的字段，不能一概而论 */
const groupIsFace = (item) => {
  const f = String(item?.field ?? '')
  return !['captioning_model', 'segment_model'].includes(f)
}

const getFieldRiskTip = (item) => {
  const field = String(item?.field ?? '')
  if (HIGH_RISK_FIELDS.has(field)) {
    return `人脸底库已有 ${faceLibraryCount.value} 条。换特征模型后，旧人脸向量与新模型不在同一嵌入空间，` +
      '1:N 检索会对所有历史条目失配，必须重新登记整库。若只是想微调阈值，请改「相似度阈值」而不是换模型。'
  }
  const count = groupIsFace(item) ? faceLibraryCount.value : imageLibraryCount.value
  return `${count > 0 ? '底库已有 ' + count + ' 条。' : ''}更换该模型只影响之后新登记/新检索的处理过程，` +
    '已入库的向量仍然可用；但新旧模型混用会让部分条目的效果不一致，建议换模型后重登一遍底库。'
}

/**
 * 读两个底库的条目数（各取一条即可拿到 total，不拉全量）。
 *
 * <p>失败一律按 0 处理：不显示风险点比显示一个来路不明的计数更安全。</p>
 */
async function loadLibraryCounts() {
  try {
    const r = await apiService.listFaces({ page: 1, size: 1 })
    faceLibraryCount.value = Number(r?.total) || 0
  } catch { faceLibraryCount.value = 0 }
  try {
    const r = await apiService._request('/image-search/list', { params: { page: 1, size: 1 } })
    const d = (r && typeof r === 'object' && 'data' in r ? r.data : r) || {}
    imageLibraryCount.value = Number(d.total) || 0
  } catch { imageLibraryCount.value = 0 }
}

/** 向量库字段描述器同样可能给出很长的 label，走与默认模型一致的 tip 兜底 */
const fieldTip = (field) => {
    const label = String(field?.label ?? '').trim()
    if (!label || label.length <= LONG_LABEL_THRESHOLD) return ''
    return field.description ? `${label}：${field.description}` : label
}

// 判断分组是否有高级选项
const hasAdvancedSettings = (group) => {
    if (!group || !group.items) return false
    // 无常驻字段的分组已经整体平铺，不再显示空的折叠条
    if (!groupHasAlwaysVisibleFields(group)) return false
    return group.items.some(item => !isModelField(group.group, item.field) && shouldShowField(group.group, item.field))
}

// 判断分组是否有模型字段
const groupHasModelFields = (group) => {
    if (!group || !group.items) return false
    return group.items.some(item => isModelField(group.group, item.field) && shouldShowField(group.group, item.field))
}

// 判断字段是否应该显示
const shouldShowField = (group, field) => {
    // 语音识别（asr）分组：只显示模型选择和语言，隐藏provider、api_key、base_url等复杂配置
    if (group === 'asr') {
        const hiddenFields = ['provider', 'provider_api_key', 'provider_base_url']
        return !hiddenFields.includes(field)
    }
    // 文生图/文生视频分组：隐藏provider、api_key、base_url等，只显示模型选择
    if (group === 'generate') {
        const hiddenFields = ['image_provider', 'image_api_key', 'image_base_url',
                              'video_provider', 'video_api_key', 'video_base_url']
        return !hiddenFields.includes(field)
    }
    // 对话路由（runtime）分组：隐藏provider、api_key、app_key、app_secret、base_url等，只显示模型选择
    if (group === 'runtime') {
        const hiddenFields = ['provider', 'provider_api_key', 'provider_app_key',
                              'provider_app_secret', 'provider_base_url']
        return !hiddenFields.includes(field)
    }
    // 引擎类字段一律不显示（由所选模型推导）
    if (ENGINE_FIELDS.includes(field)) {
        return false
    }
    // RAG 向量库选择：由「向量库配置」动态表单接管（保存到全局层而非个人覆盖），
    // 这里隐藏通用行，避免出现双入口（下拉值与动态表单各自保存会互相打架）
    if (group === 'rag' && field === 'rag_vector_storage') {
        return false
    }
    return true
}

// 从描述中解析枚举选项
const parseEnumOptions = (description) => {
    if (!description) return []
    // 匹配括号里的内容，用 / 分隔的选项
    const match = description.match(/[（(]([^）)]+)[）)]/)
    if (!match) return []
    const optionsStr = match[1]
    // 用 / 分隔，每个选项可能还有中文描述，取第一个部分
    return optionsStr.split('/').map(opt => opt.trim().split(' ')[0]).filter(opt => opt && opt.length < 50)
}

/**
 * 取值被固定的字段：只允许一个选项，其它一律删除。
 *
 * <p>例：客户端类型只支持管线（pipeline）；memory 已下线，不留在下拉里误导用户。</p>
 */
const FIXED_OPTIONS = { rag_client_provider: ['pipeline'] }

/** 该字段可选项（固定项优先，其余从后端描述里的括号解析） */
const optionsOf = (item) => {
    if (item.field in FIXED_OPTIONS) return FIXED_OPTIONS[item.field]
    return parseEnumOptions(item.description)
}

// 判断是否是枚举字段
const isEnumField = (item) => {
    if (item.valueType !== 'STRING') return false
    if (item.field in FIXED_OPTIONS) return true
    const options = parseEnumOptions(item.description)
    return options.length >= 2 && options.length <= 10
}

// 获取字段值
const getFieldValue = (group, field) => {
    return groupValues[group]?.[field] || ''
}

/**
 * 数值字段显示几位小数。
 *
 * <p>此前模板写死 :precision="2"，于是分块大小显示成「1000.00」、向量维度
 * 「1024.00」、TopK「5.00」——都是整数项，看着像被改成了带小数的值。
 * 这里按原始字符串里实际的小数位决定：整数项显示整数，0.7 这类显示一位。</p>
 *
 * @param group 配置分组名
 * @param field 字段名
 * @return 小数位数（0 表示按整数显示）
 */
const numberPrecision = (group, field) => {
    const raw = String(getFieldValue(group, field) ?? '').trim()
    const dot = raw.indexOf('.')
    if (dot < 0) {
        return 0
    }
    return Math.min(6, raw.length - dot - 1)
}

/**
 * 数值字段的步长。
 *
 * <p>必须和 {@link numberPrecision} 同源，否则步进按钮会**彻底失效**。
 * 之前模板把 :step 写死成 0.1：整数字段（分块大小、向量维度、TopK）精度是 0，
 * 点「增加数值」时 Element Plus 走 ensurePrecision(1000 + 0.1)，
 * 精度 0 下即 Math.round(1000.1) === 1000 —— 新值等于旧值，
 * setCurrentValue 里 `if (oldVal === newVal && value) return` 直接提前返回，
 * 界面一动不动，按钮成了死的（实测点击扫描报 6 条 no-effect 正是这 3 个输入框）。
 * 这里按小数位反推步长：精度 0 → 1，精度 1 → 0.1，精度 2 → 0.01。</p>
 *
 * @param group 配置分组名
 * @param field 字段名
 * @return 步长（至少 1e-6）
 */
const numberStep = (group, field) => Math.max(1e-6, 10 ** -numberPrecision(group, field))

// 模型字段的展示文本。
//
// 合并视图里的 value 已经是「生效值」，所以还要看 overridden：
// overridden=false 说明该值来自全局默认（本人没设过），必须显式标出来，
// 否则用户会以为这是自己设的默认模型。
const modelFieldDisplay = (group, field) => {
    const value = getFieldValue(group, field)
    const meta = fieldMeta[group]?.[field]
    // 系统内置默认值（origin=SYSTEM_DEFAULT）表示「从来没有人为这个字段配过模型」，
    // 那条种子值并不是有效配置。原先渲染成「系统默认：cn-clip-rn50-image（未配置）」——
    // 既给出一个模型名、又声称未配置，自相矛盾，用户会以为已经配好了。
    // 现在统一按未配置处理：只提示去选，不暴露种子里的模型名。
    if (!value || (meta && meta.origin === 'SYSTEM_DEFAULT')) {
        return '请选择模型'
    }
    return meta && meta.overridden === false ? `继承全局：${value}` : value
}

// 取字段当前所选模型的提供商 logo（字段值形如 providerId:modelName）
const getFieldModelLogo = (group, field) => {
    const v = getFieldValue(group, field)
    if (!v) return null
    const name = v.includes(':') ? v.split(':').slice(1).join(':') : v
    return getModelAvatarPath(name)
}

// 取弹框模型行的提供商 logo
const getModelRowLogo = (model) => getModelAvatarPath(model?.model || '')

// 更新字段值
const updateFieldValue = (group, field, value) => {
    if (!groupValues[group]) {
        groupValues[group] = {}
    }
    // 数字类型转换成字符串，后端期望字符串格式
    if (typeof value === 'number') {
        value = String(value)
    }
    groupValues[group][field] = value
    // 记下改过的字段：保存时只提交这些，避免把未改动的项也写成个人覆盖
    if (!dirtyFields[group]) {
        dirtyFields[group] = new Set()
    }
    dirtyFields[group].add(field)
    // 自动保存
    saveGroupSettings(group)
}

// 打开模型对话框
const openModelDialog = async (group, field) => {
    currentDialogGroup.value = group
    currentDialogField.value = field
    modelSearchText.value = ''

    if (models.value.length === 0) {
        await loadModels()
    }

    tempModelId.value = getFieldValue(group, field)
    modelDialogVisible.value = true
}

// 选择模型
const selectModel = (modelId) => {
    if (!modelId) return
    updateFieldValue(currentDialogGroup.value, currentDialogField.value, modelId)
    modelDialogVisible.value = false
}

/**
 * 清空当前字段（写入空值覆盖，使其回到「未配置」）。
 *
 * <p>此前模型字段一旦选过就再也清不掉：弹框只列出可选模型、没有清空入口，
 * 而 {@code selectModel} 又要求非空模型 id。这里显式写空值，后端按用户覆盖层存空串，
 * 读取时即为「未配置」，不会被其它默认值顶回来。</p>
 */
const clearModelField = () => {
    if (!currentDialogGroup.value || !currentDialogField.value) return
    updateFieldValue(currentDialogGroup.value, currentDialogField.value, '')
    modelDialogVisible.value = false
}

// 当前字段需要的类型中文标签
const currentSubtypeLabel = computed(() => {
    const subTypes = SUBTYPE_FOR_FIELD[`${currentDialogGroup.value}.${currentDialogField.value}`] || []
    return subTypes.length ? MODEL_SUBTYPE_LABELS[subTypes[0]] || subTypes[0] : ''
})
const currentTypeLabel = computed(() => {
    const t = requiredTypeFor(currentDialogGroup.value, currentDialogField.value)
    const base = TYPE_LABELS[t] || t
    const sub = currentSubtypeLabel.value
    return sub ? `${base} · ${sub}` : base
})

// 过滤后的模型列表
const filteredModels = computed(() => {
    let result = models.value

    // 按当前字段可接受的模型类型过滤（图像特征模型同时认 image_cv / embedding）
    if (currentDialogGroup.value && currentDialogField.value) {
        const acceptable = acceptableTypesFor(currentDialogGroup.value, currentDialogField.value)
        if (acceptable.length) {
            result = result.filter((model) => (model.types || []).some((t) => acceptable.includes(t)))
        }
        const requiredSubTypes = SUBTYPE_FOR_FIELD[`${currentDialogGroup.value}.${currentDialogField.value}`] || []
        if (requiredSubTypes.length) {
            result = result.filter((model) =>
                requiredSubTypes.some((subType) => (model.subTypes || []).includes(subType)),
            )
        }
    }

    if (modelSearchText.value) {
        const searchText = modelSearchText.value.toLowerCase()
        result = result.filter((model) =>
            model.model?.toLowerCase().includes(searchText) ||
            model.modelName?.toLowerCase().includes(searchText)
        )
    }
    return result
})

// 按供应商分组
const filteredProviders = computed(() => {
    if (!models.value.length || !providers.value.length) return []
    return providers.value.map(provider => ({
        ...provider,
        models: filteredModels.value.filter(model => model.providerId === provider.id)
    })).filter(provider => provider.models.length > 0)
})

/**
 * 把「本地推理模型」并入可选列表。
 *
 * <p>为什么必须并入：模型选择器的候选只来自 /api/providers，而该接口里
 * {@code provider_id=onnx} 的 models 恒为 0（实测），因为本地模型并不登记在
 * {@code sys_ai_provider_model} —— 它在 deeplearning 的 ModelRegistry 里。
 * 结果是 embedding 字段点开弹框只有一句「没有匹配『嵌入』类型的模型」，
 * 27 个可用模型（/v2/rag/options.embeddingModels）一个都选不到。</p>
 *
 * <p>挂在 onnx 提供商下、值形如 {@code onnx:bge-large-zh-embedding}，与后端
 * {@code resolveEmbeddingEngineByModel} 能识别的「本地模型 → onnx 引擎」一致
 * （后端会剥掉 {@code provider:} 前缀后再匹配）。</p>
 */
const loadLocalModels = async () => {
    try {
        const body = await apiService._request('/rag/options')
        const data = body?.data ?? body ?? {}
        // 向量库描述器：RAG 组「向量库配置」动态表单的数据源（与本地模型共用一次请求）
        if (Array.isArray(data.vectorStorageOptions)) {
            vectorStorageOptions.value = data.vectorStorageOptions
        }
        const local = []
        const collect = (items, task) => {
            ;(items || []).forEach((it) => {
                const id = typeof it === 'string' ? it : (it?.id || it?.model)
                if (!id) return
                const meta = resolveModelMeta(id, [{ task }])
                local.push({
                    id: `onnx:${id}`,
                    modelName: `本地/${id}`,
                    model: id,
                    providerId: 'onnx',
                    providerName: 'ONNX 本地推理',
                    ...meta
                })
            })
        }
        collect(data.embeddingModels, 'embedding')
        collect(data.ocrModels, 'ocr')
        if (local.length > 0) {
            const existing = new Set(models.value.map((m) => m.id))
            const fresh = local.filter((m) => !existing.has(m.id))
            models.value.push(...fresh)
            providers.value.push({ id: 'onnx', name: 'ONNX 本地推理', models: fresh })
            console.info(`[设置] 并入本地推理模型 ${fresh.length} 个`)
        }
    } catch (error) {
        // 并入失败不应让整个模型列表不可用，模型管理里的条目照常可选
        console.warn('加载本地推理模型失败（不影响模型管理中的模型）:', error)
    }
}

// 加载 Usage Parser SPI 列表
const loadUsageParsers = async () => {
    try {
        const response = await apiService._request('/usage/parsers')
        usageParsers.value = response?.data || response || []
    } catch (error) {
        console.error('加载 Usage Parser 列表失败:', error)
    }
}

// 加载模型列表（in-flight 去重：onMounted 与 openModelDialog 可能在数据尚未就绪时
// 并发触发本函数，共享同一个 Promise 可避免竞态导致 providers/models 翻倍）
let modelsLoadPromise = null
const loadModels = () => {
    if (modelsLoadPromise) return modelsLoadPromise
    modelsLoadPromise = (async () => {
        try {
            models.value = []
            providers.value = []
            const providersBody = await adminApi.get('/api/providers')
            // adminApi 可能已解包为数组，也可能返回 {data}，两种形态都要兼容
            const providersData = Array.isArray(providersBody) ? providersBody : providersBody?.data || []

            providersData.forEach((provider) => {
                // ONNX 本地提供商：模型描述来自各门户注册表，但必须先「绑定本地目录」
                // （external=true）才真正可用、可被选为默认；未配置时不出现在下拉中。
                const isOnnxProvider = provider.provider_id === 'onnx' || provider.platform === 'onnx'
                const providerModels = (provider.models || [])
                    .filter(m => m.enabled !== false)
                    .filter(m => isOnnxProvider ? m.external === true : true)
                    .map((m) => {
                        const meta = resolveModelMeta(m.model, m.capabilities)
                        return {
                            id: `${provider.provider_id}:${m.model}`,
                            modelName: `${provider.name}/${m.model}`,
                            model: m.model,
                            providerId: provider.provider_id,
                            providerName: provider.name,
                            ...meta
                        }
                    })
                models.value.push(...providerModels)
                if (providerModels.length > 0) {
                    providers.value.push({
                        id: provider.provider_id,
                        name: provider.name,
                        models: providerModels,
                    })
                }
            })
        } catch (error) {
            console.error('获取模型列表失败:', error)
            notify.error('加载模型列表失败', error)
        } finally {
            // 本地推理模型独立并入：/api/providers 的 onnx 分支恒为空，
            // 不并入的话 embedding / ocr 字段在弹框里无任何可选项。
            await loadLocalModels()
            modelsLoadPromise = null
        }
    })()
    return modelsLoadPromise
}

// 加载所有配置分组定义
const loadSettingDefinitions = async () => {
    try {
        const response = await apiService._request("/global-setting-definitions")
        settingGroups.value = pickGroups(response)
    } catch (error) {
        console.error('获取配置定义失败:', error)
        notify.error('加载配置定义失败', error)
    }
}

/**
 * 从响应里取出分组数组。
 *
 * <p>后端这个接口的响应是**双层信封**：
 * {@code {code, data: {success, data: [ {group...} ]}}}。
 * 此前直接取 {@code response?.data}，拿到的是内层的对象而不是数组，
 * {@code v-for} 遍历对象渲染不出任何内容，于是「默认模型」等设置页整块空白
 * （侧栏还在，正文没有）。这里把三种可能形态都兜住，避免再被包裹层数变化打穿。</p>
 *
 * @param response 接口响应
 * @return 分组数组；取不到时返回空数组
 */
const pickGroups = (response) => {
    const first = response?.data ?? response
    if (Array.isArray(first)) {
        return first
    }
    if (Array.isArray(first?.data)) {
        return first.data
    }
    return []
}

/**
 * 已知的「值域遗留字段」：字段名是模型范式、库里可能还有值行，但已无任何运行时读者
 * （全仓 grep 证实），mergeValueOnlyModelFields 不得因它们补行，避免旧库残留
 * 以设置项形态回流到界面。
 */
const LEGACY_VALUE_ONLY_FIELDS = {
    // 旧版 OCR 一体化默认模型：现管线读 detector / recognizer / direction / restorer / corrector
    ocr: ['default_ocr_model'],
    // 旧版版面分析遗留：layout 管线现只读 layout_model
    layout: ['pose_model', 'super_resolution_model'],
}

/**
 * 值域兜底：定义里没有、但合并值里存在的「选模型」字段，补进分组渲染。
 *
 * <p><b>为什么需要。</b>本页的行由 {@code /v2/global-setting-definitions} 的定义驱动，
 * 定义来自后端 GlobalSettingProvider 的启动期缓存。共享联调后端与本地新代码之间常有
 * 一两个版本滞后 —— 例如 OCR 的 {@code corrector_model}：值行已入库（/v2/settings/ocr
 * 能读到），旧后端定义里却没有它，于是「文本矫正模型」在设置中心整行消失，
 * 只能在能力页（/capabilities/ocr）配置。这里按「已存值 + 命名约定」兜底补行；
 * 后端补齐定义后该字段已存在，合并为空操作，不会重复渲染。</p>
 *
 * <p><b>并入范围。</b>只收 `_model` 结尾的字段（本页「选模型」行的既有命名约定）；
 * {@code enable_model_metrics_push} 这类名称含 model 的开关/间隔不适用选择器语义，不并入。
 * {@code rag_embedding_model} 等引擎字段照常被 shouldShowField 的 ENGINE_FIELDS 拦下。</p>
 *
 * @param group 分组名
 * @param values 该分组的合并值（field -> value，可能含 __meta）
 */
const mergeValueOnlyModelFields = (group, values) => {
    const def = settingGroups.value.find((g) => g.group === group)
    if (!def || !Array.isArray(def.items)) {
        return
    }
    const known = new Set(def.items.map((item) => item.field))
    const legacy = new Set(LEGACY_VALUE_ONLY_FIELDS[group] || [])
    for (const field of Object.keys(values || {})) {
        if (field === '__meta' || known.has(field) || legacy.has(field)) {
            continue
        }
        if (!String(field).endsWith('_model')) {
            continue
        }
        def.items.push({
            field,
            defaultValue: '',
            valueType: 'STRING',
            description: '',
            sort: 9999,
            adminOnly: false,
            // 标记来源：值域兜底补的行（非后端定义），供后续差异化展示/排查
            valueOnly: true,
        })
    }
}

// 加载某个分组对当前用户生效的值（全局默认 + 本人覆盖）
const loadGroupValues = async (group) => {
    try {
        const response = await apiService.fetchMergedGroupSettings(group)
        const items = response?.data ?? response ?? []
        const values = {}
        const meta = {}
        if (Array.isArray(items)) {
            // 后端返回 [{ field, value, defaultValue, overridden, origin }]
            items.forEach((item) => {
                values[item.field] = item.value ?? ''
                meta[item.field] = {
                    overridden: item.overridden === true,
                    defaultValue: item.defaultValue ?? '',
                    // 值来源：USER=我的覆盖 / GLOBAL=管理员配过的全局值 /
                    // SYSTEM_DEFAULT=系统内置默认值（从未有人配置过）。
                    origin: item.origin || (item.overridden === true ? 'USER' : 'GLOBAL'),
                }
            })
        } else {
            // 扁平形状：field -> value，值来源另放在 __meta 里。
            // 读之前先摘掉 __meta，否则它会被当成一个名为 __meta 的设置项。
            const raw = { ...items }
            const metaBag = raw.__meta || {}
            delete raw.__meta
            Object.assign(values, raw)
            Object.keys(raw).forEach((field) => {
                const m = metaBag[field] || {}
                meta[field] = {
                    overridden: m.overridden === true,
                    defaultValue: raw[field],
                    origin: m.origin || (m.overridden === true ? 'USER' : 'GLOBAL'),
                }
            })
        }
        groupValues[group] = values
        fieldMeta[group] = meta
        dirtyFields[group] = new Set()
        // 定义滞后兜底（幂等：字段已在定义中时不重复 push）
        mergeValueOnlyModelFields(group, values)
    } catch (error) {
        console.error(`获取 ${group} 分组设置失败:`, error)
    }
}

// 保存某个分组的设置：只写「本人改过的字段」，写到用户覆盖层（不动全局默认）
const saveGroupSettings = async (group) => {
    const dirty = dirtyFields[group]
    if (!dirty || dirty.size === 0) {
        return
    }
    const payload = {}
    for (const field of dirty) {
        const value = groupValues[group]?.[field]
        // 空值 = 重置：值传 null，由后端撤销本人覆盖（回落到继承值），
        // 而不是把空串写进全局层 —— 那正是以前「重置不成空」的原因
        payload[field] = value === '' || value === null || value === undefined ? null : value
    }
    try {
        await apiService.updateUserGroupOverrides(group, payload)
        notify.success('设置已保存')
        // 重新拉取合并视图：拿回 overridden/defaultValue，界面上「继承全局」状态才会刷新
        await loadGroupValues(group)
        // 这几个分组的模型是人脸识别 / 以图搜图 / 图像上色的门禁判据，保存后即时刷新，
        // 侧栏徽标与各页面的可用性不用等刷新页面就跟着变
        if (group === 'face' || group === 'image_search' || group === 'image' || group === 'runtime') {
            await modelConfig.refresh()
        }
    } catch (error) {
        console.error(`保存 ${group} 分组设置失败:`, error)
        notify.error('保存设置失败', error)
    }
}

// 加载所有分组的值
const loadAllGroupValues = async () => {
    for (const group of displayGroups.value) {
        await loadGroupValues(group.group)
    }
}

// 生命周期
onMounted(async () => {
    await loadSettingDefinitions()
    await loadAllGroupValues()
    await loadModels()
    await loadUsageParsers()
    // 风险点判据依赖底库条目数，必须在渲染前拿到，否则首屏一闪而过没有红点
    await loadLibraryCounts()
    // 向量库配置：管理员专属（全局层）；放模型加载后——表单字段依赖 /rag/options 的描述器
    if (isAdmin()) {
        await loadVectorGlobalSettings()
    }
})
</script>

<style scoped>
/* 以图搜图图像底库：挂在本分组的字段列表之下，作为一块独立管理区 */
.lib-slot {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color-lighter, #ebeef5);
}

.lib-slot-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}

.lib-slot-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.lib-slot-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

/* ============ 向量库配置（描述器驱动的动态表单） ============
   外壳已改为复用「高级选项」的 el-collapse 外观，这里只保留下拉候选行
   与保存按钮的内边距；旧的 .vector-storage-block / .vs-head / .vs-title /
   .vs-sub 手搓头部样式已随模板一并删除，避免两套视觉语言继续并存。 */

/* 下拉候选行：显示名 + SPI 名（区分同名实现） */
.vs-opt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.vs-opt-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.vs-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-extra-light, #f2f6fc);
}

/* ============ 高级选项折叠 ============ */
:deep(.adv-collapse) { border: none; }
:deep(.adv-collapse .el-collapse-item__wrap) {
  border-bottom: none;
  border-top: 1px solid var(--el-border-color-lighter);
}
:deep(.adv-collapse .el-collapse-item__header) {
  height: auto; min-height: 0; line-height: normal;
  border-bottom: none; background: transparent; padding: 0;
}
/* 隐藏 el-collapse 自带箭头，使用自定义 adv-chevron（避免右侧双图标） */
:deep(.adv-collapse .el-collapse-item__arrow) { display: none; }
:deep(.adv-collapse .el-collapse-item__header:hover) { background: transparent; }
:deep(.adv-collapse .el-collapse-item__content) { padding: 0; }

.adv-head {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; cursor: pointer;
  transition: background 0.16s ease;
}
.adv-head:hover { background: var(--el-fill-color-light); }
.adv-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-regular); }
/* 折叠标题上的作用域徽标（向量库配置 = 管理员专属 · 保存到全局） */
.adv-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  margin-left: 8px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
:deep(.adv-chevron) {
  color: var(--el-text-color-secondary);
  transition: transform 0.22s ease;
}
:deep(.adv-collapse .el-collapse-item__header.is-active .adv-chevron) {
  transform: rotate(180deg);
}

/* ============ 模型选择对话框 ============ */
.md-body { display: flex; flex-direction: column; gap: 14px; }
.md-list { max-height: 384px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.md-provider { font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.md-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 9px 12px;
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px); cursor: pointer;
  transition: background 0.16s ease;
}
.md-row:hover { background: var(--el-fill-color-light); }
.md-row-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.md-name { font-size: 13px; color: var(--el-text-color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.md-tags { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.md-check { color: var(--el-color-primary); flex-shrink: 0; }
.md-empty { padding: 40px 0; text-align: center; }
.md-empty-main { font-size: 13px; color: var(--el-text-color-regular); }
.md-empty-sub { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }

/* 动效降级：系统开启「减少动态效果」时，高级设置折叠头与模型行的底色直接到位、
   折叠箭头改为瞬间翻转。逐个列出，不写 `*` / .md-list * 通配，
   避免把 el-collapse / el-tag / el-input 内部 Element Plus 组件的合法过渡一起掐掉。
   箭头的展开/收起终态是 rotate(180deg) 这条静态声明，停掉过渡后朝向依然可读，
   信息不会因此丢失。 */
@media (prefers-reduced-motion: reduce) {
  .adv-head,
  .md-row,
  :deep(.adv-chevron) {
    transition: none;
  }
}

/* 键盘焦点可见性：模型行是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 行底色透明、落在弹层表面色上，一档主色描边足够可见。 */
.md-row {
  outline: none;
}

.md-row:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

</style>
