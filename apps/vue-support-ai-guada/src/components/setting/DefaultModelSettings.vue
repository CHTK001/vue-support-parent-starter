<template>
  <div class="flex-1">
    <!-- 动态渲染所有配置分组 -->
    <SettingsCard v-for="group in settingGroups" :key="group.group" :title="group.groupName">
      <!-- 模型字段：始终显示 -->
      <SettingsRow
        v-for="item in visibleFields(group)"
        :key="item.field"
        :label="getFieldLabel(item)"
        :description="item.description"
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
          :step="0.1" :precision="numberPrecision(group.group, item.field)" class="w-full" />
        <!-- BOOLEAN -->
        <el-switch v-else-if="item.valueType === 'BOOLEAN'"
          :model-value="getFieldValue(group.group, item.field) === 'true'"
          @update:model-value="updateFieldValue(group.group, item.field, $event ? 'true' : 'false')" />
      </SettingsRow>

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
              :step="0.1" :precision="numberPrecision(group.group, item.field)" class="w-full" />
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
import LDialog from '@/components/ui/LDialog.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReTag from '@/components/re/ReTag.vue'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import ImageLibraryPanel from './ImageLibraryPanel.vue'
import { isAdmin } from '@repo/core'
import { getModelAvatarPath } from '@/utils/modelUtils'

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

// 配置分组定义
const settingGroups = ref([])

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
    group === 'generate'
    && (String(field || '').startsWith('media_') || String(field || '') === 'task_timeout_minutes')

/** 始终显示且不是选模型的字段 */
const plainVisibleFields = (group) =>
    (group.items || []).filter(item =>
        notAdminOnly(item) && !isModelField(group.group, item.field) && isPlainVisibleField(group.group, item.field) && shouldShowField(group.group, item.field))

/** 始终显示的字段：选模型的 + 上面这类目录配置 */
const visibleFields = (group) => [...modelFields(group), ...plainVisibleFields(group)]

const advancedFields = (group) =>
    (group.items || []).filter(item =>
        notAdminOnly(item) && !isModelField(group.group, item.field) && !isPlainVisibleField(group.group, item.field) && shouldShowField(group.group, item.field))

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
    image_cv: '图片识别'
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
    image_cv: 'info'
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
    layout: 'layout'
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
    if (l.includes('dall-e') || l.includes('image-gen') || l.includes('cogview') || l.includes('flux') || l.includes('image')) return 'image'
    if (l.includes('cogvideo') || l.includes('video-gen') || l.includes('video')) return 'video'
    return 'text'
}

// 从 capabilities + 模型名解析模型的类型与特性
const resolveModelMeta = (modelName, capabilities) => {
    const types = []
    const features = []
    ;(capabilities || []).forEach((cap) => {
        const task = cap?.task
        if (!task) return
        if (TASK_TO_TYPE[task]) {
            const t = TASK_TO_TYPE[task]
            if (!types.includes(t)) types.push(t)
        } else if (FEATURE_LABELS[task]) {
            if (!features.includes(task)) features.push(task)
        }
    })
    // 名称强类型优先（修正 capabilities 误标，如 agnes-image 被标为 chat）
    const nameType = inferTypeByName(modelName)
    if (nameType !== 'text') {
        for (let i = types.length - 1; i >= 0; i--) {
            if (types[i] === 'text') types.splice(i, 1)
        }
        if (!types.includes(nameType)) types.unshift(nameType)
    }
    if (types.length === 0) types.push(nameType)

    const primaryType = types[0]
    const displayTags = [
        { value: `type:${primaryType}`, label: TYPE_LABELS[primaryType] || primaryType, tagType: TYPE_TAG_TYPE[primaryType] || 'info' }
    ]
    // thinking / web-search / tools 等特性仅对话模型有意义
    if (primaryType === 'text') {
        features.slice(0, 2).forEach((f) =>
            displayTags.push({ value: `feat:${f}`, label: FEATURE_LABELS[f], tagType: 'info' })
        )
    }
    return { types, features, primaryType, displayTags }
}

// 根据配置分组与字段，确定该字段需要的规范模型类型
const requiredTypeFor = (group, field) => {
    const g = String(group || '')
    const f = String(field || '').toLowerCase()
    // CV / ONNX 管线分组（非 OpenAI 兼容接口模型）
    if (g === 'face') return 'face'
    if (g === 'ocr') return 'ocr'
    if (g === 'layout') return 'layout'
    if (g === 'image') return 'image_cv'
    if (g === 'asr') return 'asr'
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

// 判断字段中文标签
    // 从描述中提取中文名称
    if (item.description) {
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
            'layout_model': '布局模型',
            'pose_model': '姿态估计模型',
            'optimizer_model': '优化模型',
            'compression_model': '压缩模型',
            'rag_embedding_model': 'Embedding引擎',
            'rag_llm_model': 'LLM模型',
            'rag_ocr_model': 'OCR模型',
            'image_model': '文生图模型',
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
            'min_similarity': '相似度下限'
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

// 判断分组是否有高级选项
const hasAdvancedSettings = (group) => {
    if (!group || !group.items) return false
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

// 模型字段的展示文本。
//
// 合并视图里的 value 已经是「生效值」，所以还要看 overridden：
// overridden=false 说明该值来自全局默认（本人没设过），必须显式标出来，
// 否则用户会以为这是自己设的默认模型。
const modelFieldDisplay = (group, field) => {
    const value = getFieldValue(group, field)
    const meta = fieldMeta[group]?.[field]
    if (!value) {
        return '请选择模型'
    }
    // 系统内置默认值必须显式说明，否则用户会以为这是自己或管理员配的。
    // 实测 2026-09-30 那批一次性种子（onnx / bge-large-zh-embedding / 1024 等）
    // 从来没人配置过，界面上却显示「继承全局：onnx」，看着像已配置。
    if (meta && meta.origin === 'SYSTEM_DEFAULT') {
        return `系统默认：${value}（未配置）`
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
const currentTypeLabel = computed(() => {
    const t = requiredTypeFor(currentDialogGroup.value, currentDialogField.value)
    return TYPE_LABELS[t] || t
})

// 过滤后的模型列表
const filteredModels = computed(() => {
    let result = models.value

    // 按当前字段需要的模型类型过滤
    if (currentDialogGroup.value && currentDialogField.value) {
        const required = requiredTypeFor(currentDialogGroup.value, currentDialogField.value)
        if (required) {
            result = result.filter((model) => model.types?.includes(required))
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
    } catch (error) {
        console.error(`保存 ${group} 分组设置失败:`, error)
        notify.error('保存设置失败', error)
    }
}

// 加载所有分组的值
const loadAllGroupValues = async () => {
    for (const group of settingGroups.value) {
        await loadGroupValues(group.group)
    }
}

// 生命周期
onMounted(async () => {
    await loadSettingDefinitions()
    await loadAllGroupValues()
    await loadModels()
    await loadUsageParsers()
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
