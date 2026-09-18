<template>
    <div class="flex-1 overflow-hidden">
        <div class="space-y-8">
            <!-- 动态渲染所有配置分组 -->
            <div v-for="group in settingGroups" :key="group.group">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-[#e8e9ed] mb-3">{{ group.groupName }}</h3>
                <div class="rounded-xl border border-gray-200 dark:border-[#2e3035] bg-(--color-surface) overflow-hidden">
                    <!-- 模型字段：始终显示 -->
                    <template v-for="(item, index) in group.items" :key="item.field">
                    <div v-if="isModelField(group.group, item.field) && shouldShowField(group.group, item.field)"
                        class="px-4 py-3.5 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-[#2e3035]">
                        <div class="flex flex-col gap-1 min-w-0">
                            <span class="text-base text-gray-900 dark:text-[#e8e9ed]">{{ getFieldLabel(item) }}</span>
                            <span class="text-xs text-gray-500 dark:text-[#8b8d95]">{{ item.description }}</span>
                        </div>
                        <div class="w-full max-w-md shrink-0">
                            <!-- STRING 类型：模型选择器（如果是模型字段）或文本输入 -->
                            <el-input v-if="item.valueType === 'STRING' && isModelField(group.group, item.field)"
                                :model-value="getFieldValue(group.group, item.field) || '请选择模型'" readonly
                                class="cursor-pointer" @click="openModelDialog(group.group, item.field)">
                                <template #prefix>
                                    <OpenAI class="w-4 h-4" />
                                </template>
                                <template #suffix>
                                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                                </template>
                            </el-input>
                            <!-- STRING 类型：枚举下拉 -->
                            <el-select v-else-if="item.valueType === 'STRING' && isEnumField(item)"
                                :model-value="getFieldValue(group.group, item.field)"
                                @update:model-value="updateFieldValue(group.group, item.field, $event)"
                                class="w-full">
                                <el-option v-for="opt in parseEnumOptions(item.description)" :key="opt" :label="opt" :value="opt" />
                            </el-select>
                            <!-- STRING 类型：普通文本输入 -->
                            <el-input v-else-if="item.valueType === 'STRING'"
                                :model-value="getFieldValue(group.group, item.field)"
                                @input="updateFieldValue(group.group, item.field, $event)">
                            </el-input>
                            <!-- NUMBER 类型：数字输入 -->
                            <el-input-number v-else-if="item.valueType === 'NUMBER'"
                                :model-value="Number(getFieldValue(group.group, item.field))"
                                @change="(val) => updateFieldValue(group.group, item.field, val)"
                                :step="0.1"
                                :precision="2"
                                class="w-full">
                            </el-input-number>
                            <!-- BOOLEAN 类型：开关 -->
                            <el-switch v-else-if="item.valueType === 'BOOLEAN'"
                                :model-value="getFieldValue(group.group, item.field) === 'true'"
                                @update:model-value="updateFieldValue(group.group, item.field, $event ? 'true' : 'false')">
                            </el-switch>
                        </div>
                    </div>
                    </template>

                    <!-- 高级选项：折叠显示 -->
                    <el-collapse v-if="hasAdvancedSettings(group)" class="border-none custom-collapse">
                        <el-collapse-item>
                            <template #title>
                                <div class="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-[#2a2c30]">
                                    <span class="text-sm font-medium text-gray-600 dark:text-[#b8babf]">高级选项</span>
                                </div>
                            </template>
                            <template v-for="(item, index) in group.items" :key="item.field">
                            <div v-if="!isModelField(group.group, item.field) && shouldShowField(group.group, item.field)"
                                class="px-4 py-3.5 flex items-center justify-between gap-4"
                                :class="{ 'border-b border-gray-100 dark:border-[#2e3035]': index < group.items.length - 1 }">
                                <div class="flex flex-col gap-1 min-w-0">
                                    <span class="text-base text-gray-900 dark:text-[#e8e9ed]">{{ getFieldLabel(item) }}</span>
                                    <span class="text-xs text-gray-500 dark:text-[#8b8d95]">{{ item.description }}</span>
                                </div>
                                <div class="w-full max-w-md shrink-0">
                                    <!-- STRING 类型：usage_sync_providers 多选下拉 -->
                                    <el-select v-if="item.field === 'usage_sync_providers'"
                                        :model-value="getFieldValue(group.group, item.field) ? getFieldValue(group.group, item.field).split(',') : []"
                                        @update:model-value="(val) => updateFieldValue(group.group, item.field, val.join(','))"
                                        multiple
                                        clearable
                                        placeholder="留空=全部启用"
                                        class="w-full">
                                        <el-option v-for="parser in usageParsers" :key="parser.name" :label="parser.name" :value="parser.name" />
                                    </el-select>
                                    <!-- STRING 类型：枚举下拉 -->
                                    <el-select v-else-if="item.valueType === 'STRING' && isEnumField(item)"
                                        :model-value="getFieldValue(group.group, item.field)"
                                        @update:model-value="updateFieldValue(group.group, item.field, $event)"
                                        class="w-full">
                                        <el-option v-for="opt in parseEnumOptions(item.description)" :key="opt" :label="opt" :value="opt" />
                                    </el-select>
                                    <!-- STRING 类型：普通文本输入 -->
                                    <el-input v-else-if="item.valueType === 'STRING'"
                                        :model-value="getFieldValue(group.group, item.field)"
                                        @input="updateFieldValue(group.group, item.field, $event)">
                                    </el-input>
                                    <!-- NUMBER 类型：数字输入 -->
                                    <el-input-number v-else-if="item.valueType === 'NUMBER'"
                                        :model-value="Number(getFieldValue(group.group, item.field))"
                                        @change="(val) => updateFieldValue(group.group, item.field, val)"
                                        :step="0.1"
                                        :precision="2"
                                        class="w-full">
                                    </el-input-number>
                                    <!-- BOOLEAN 类型：开关 -->
                                    <el-switch v-else-if="item.valueType === 'BOOLEAN'"
                                        :model-value="getFieldValue(group.group, item.field) === 'true'"
                                        @update:model-value="updateFieldValue(group.group, item.field, $event ? 'true' : 'false')">
                                    </el-switch>
                                </div>
                            </div>
                            </template>
                        </el-collapse-item>
                    </el-collapse>
                </div>
            </div>
        </div>

        <!-- 模型选择对话框 -->
        <LDialog v-model="modelDialogVisible" title="选择模型" width="600px">
            <div class="space-y-4">
                <!-- 搜索框 -->
                <el-input v-model="modelSearchText" placeholder="搜索模型..." clearable>
                    <template #prefix>
                        <el-icon><Search /></el-icon>
                    </template>
                </el-input>

                <!-- 模型列表 -->
                <div class="max-h-96 overflow-y-auto space-y-4">
                    <div v-for="provider in filteredProviders" :key="provider.id">
                        <div class="text-sm font-medium text-gray-500 dark:text-[#8b8d95] mb-2">{{ provider.name }}</div>
                        <div v-for="model in provider.models" :key="model.id"
                            class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2e3035] cursor-pointer"
                            @click="selectModel(model.id)">
                            <div class="flex items-center gap-3">
                                <div>
                                    <div class="text-sm text-gray-900 dark:text-[#e8e9ed]">{{ model.modelName }}</div>
                                </div>
                            </div>
                            <el-icon v-if="tempModelId === model.id" class="text-primary" size="18">
                                <CheckCircleFilled />
                            </el-icon>
                        </div>
                    </div>
                </div>
            </div>
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
import { usePopup } from '@/composables/usePopup'
import LDialog from '@/components/ui/LDialog.vue'

// Element Plus 组件导入
import {
    ElInput,
    ElInputNumber,
    ElSwitch,
    ElIcon,
    ElButton,
    ElSelect,
    ElOption
} from 'element-plus'

const { t } = useI18n()
const { notify } = usePopup()

// 配置分组定义
const settingGroups = ref([])

// 各分组的实际值
const groupValues = reactive({})

// 模型数据
const models = ref([])
const providers = ref([])

// Usage Parser SPI 列表
const usageParsers = ref([])

// 模型选择对话框相关
const modelDialogVisible = ref(false)
const modelSearchText = ref('')
const tempModelId = ref(null)
const currentDialogGroup = ref('')
const currentDialogField = ref('')

// 判断是否是模型字段（包含 model 关键词）
const isModelField = (group, field) => {
    if (!field) return false
    // protocol-server 分组的所有字段都直接显示（因为它没有模型字段）
    if (group === 'protocol-server') return true
    // 用量配置分组的"用量开关"直接显示，不放在高级选项里
    if (group === 'global' && field === 'enable_usage_analysis') return true
    return field.toLowerCase().includes('model')
}

// 获取字段中文标签
const getFieldLabel = (item) => {
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
            'rag_embedding_model': 'Embedding模型',
            'rag_llm_model': 'LLM模型',
            'rag_ocr_model': 'OCR模型',
            'image_model': '文生图模型',
            'video_model': '文生视频模型',
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
            'usage_timewheel_enabled': '时间轮调度'
        }
        return labelMap[item.field] || item.field
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

// 判断是否是枚举字段
const isEnumField = (item) => {
    if (item.valueType !== 'STRING') return false
    const options = parseEnumOptions(item.description)
    return options.length >= 2 && options.length <= 10
}

// 获取字段值
const getFieldValue = (group, field) => {
    return groupValues[group]?.[field] || ''
}

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

// 过滤后的模型列表
const filteredModels = computed(() => {
    let result = models.value
    
    // 根据当前打开对话框的分组和字段，过滤模型类型
    if (currentDialogGroup.value && currentDialogField.value) {
        const group = currentDialogGroup.value
        const field = currentDialogField.value
        
        // 根据分组和字段，确定需要的模型能力类型
        let requiredCapability = ''
        if (group === 'asr' && field === 'default_model') {
            requiredCapability = 'asr'
        } else if (group === 'image' && field === 'classify_model') {
            requiredCapability = 'image-classify'
        } else if (group === 'image' && field === 'detect_model') {
            requiredCapability = 'image-detect'
        } else if (group === 'image' && field === 'segment_model') {
            requiredCapability = 'image-segment'
        } else if (group === 'image' && field === 'captioning_model') {
            requiredCapability = 'image-caption'
        } else if (group === 'face' && field === 'detector_model') {
            requiredCapability = 'face-detect'
        } else if (group === 'face' && field === 'liveness_model') {
            requiredCapability = 'face-liveness'
        } else if (group === 'ocr' && field === 'det_model') {
            requiredCapability = 'ocr-detect'
        } else if (group === 'ocr' && field === 'rec_model') {
            requiredCapability = 'ocr-rec'
        } else if (group === 'generate' && field === 'image_model') {
            requiredCapability = 'text-to-image'
        } else if (group === 'generate' && field === 'video_model') {
            requiredCapability = 'text-to-video'
        } else if (group === 'chat' || group === 'models') {
            // 聊天相关的分组，默认显示chat类型的模型
            requiredCapability = 'chat'
        }
        
        // 如果指定了需要的能力类型，过滤模型列表
        if (requiredCapability) {
            result = result.filter(model => 
                model.capabilities && model.capabilities.includes(requiredCapability)
            )
        }
    }
    
    if (modelSearchText.value) {
        const searchText = modelSearchText.value.toLowerCase()
        result = result.filter(model =>
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

// 加载模型列表
const loadModels = async () => {
    try {
        const res = await fetch('/api/providers')
        const data = await res.json()
        const providersData = data.data || data || []

        providersData.forEach((provider) => {
            const providerModels = (provider.models || [])
                .filter(m => m.enabled !== false)
                .map(m => ({
                    id: `${provider.provider_id}:${m.model}`,
                    modelName: `${provider.name}/${m.model}`,
                    model: m.model,
                    providerId: provider.provider_id,
                    providerName: provider.name,
                }))
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
    }
}

// 加载所有配置分组定义
const loadSettingDefinitions = async () => {
    try {
        const response = await apiService._request("/global-setting-definitions")
        settingGroups.value = response?.data || response || []
    } catch (error) {
        console.error('获取配置定义失败:', error)
        notify.error('加载配置定义失败', error)
    }
}

// 加载某个分组的实际值
const loadGroupValues = async (group) => {
    try {
        const response = await apiService.fetchGroupSettings(group)
        groupValues[group] = response?.data || response || {}
    } catch (error) {
        console.error(`获取 ${group} 分组设置失败:`, error)
    }
}

// 保存某个分组的设置
const saveGroupSettings = async (group) => {
    try {
        await apiService.updateGroupSettings(group, groupValues[group])
        notify.success('设置已保存')
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
:deep(.model-item) {
    transition: all 0.2s;
}
:deep(.model-item:hover) {
    border-color: var(--el-color-primary-light-5);
}
/* 隐藏 el-collapse 自带的箭头 */
:deep(.custom-collapse .el-collapse-item__arrow) {
    display: none;
}
</style>
