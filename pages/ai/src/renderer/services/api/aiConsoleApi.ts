/**
 * aiConsoleApi — AI 控制台统一 API 层
 *
 * 覆盖：模型管理（含 6 类管线模型）、管线目录、能力配置（全局 Bean）、
 * 用量管理与用量配置。所有请求经 @repo/core http + unwrapResult 解封 ReturnResult。
 */
import { http } from '@repo/core';
import { unwrapResult } from '@repo/utils';
import { apiRequest } from './apiHelper';

/* ==================== 类型 ==================== */

/** AI 模型 DTO（与后端 AiModelDTO 对齐） */
export interface AiModelDTO {
  id?: number;
  name: string;
  code: string;
  providerId?: number | null;
  providerName?: string | null;
  capabilities: string[];
  /** 必填管线标签（如 ocr / layout / face-recognize / text-to-image） */
  requiredPipelines?: string[];
  /** 非必填管线标签（管线内可选子能力） */
  optionalPipelines?: string[];
  description?: string;
  enabled?: boolean;
  sort?: number;
  inputPrice?: number | null;
  outputPrice?: number | null;
  cachePrice?: number | null;
  createdAt?: string | null;
  /** 模型别名列表（请求时别名自动映射到主模型） */
  aliases?: string[];
  /** 最近一次连通性测试延迟（毫秒） */
  lastLatency?: number | null;
  /** 最近一次连通性测试时间 */
  lastTestTime?: string | null;
}

/** 管线定义（后端 AiPipelineController） */
export interface PipelineDef {
  code: string;
  name: string;
  group: string;
  tag: string;
  required: string[];
  optional: string[];
  description: string;
  route: string;
  configGroup: string;
  kind: 'pipeline' | 'globalBean';
}

/** 能力配置字段（valueType: STRING / NUMBER / BOOLEAN） */
export interface SettingField {
  field: string;
  value: string;
  valueType: string;
  description: string;
  sort: number;
}

/** 用量统计 */
export interface UsageStatistics {
  totalCalls?: number;
  totalTokens?: number;
  totalCost?: number;
  todayCalls?: number;
  todayTokens?: number;
  todayCost?: number;
  providerCount?: number;
  modelCount?: number;
  [k: string]: unknown;
}

/** 用量明细记录（对齐后端 SysAiUsage 实体字段） */
export interface UsageRecord {
  sysAiUsageId?: number;
  sysAiUsageGroupName?: string;
  sysAiUsageProvider?: string;
  sysAiUsageModel?: string;
  sysAiUsageCallType?: string;
  sysAiUsagePromptTokens?: number;
  sysAiUsageCompletionTokens?: number;
  sysAiUsageTotalTokens?: number;
  sysAiUsageTotalCost?: number;
  sysAiUsageCallTime?: string;
  sysAiUsageRequestId?: string;
  sysAiUsageUserId?: string;
  sysAiUsageType?: string;
  sysAiUsageEndpoint?: string;
  sysAiUsageCachedTokens?: number;
  sysAiUsageInputCost?: number;
  sysAiUsageOutputCost?: number;
  [k: string]: unknown;
}

/** 每日趋势项（对齐后端 /v2/usage/trend 返回） */
export interface UsageTrendItem {
  date?: string;
  totalCalls?: number;
  promptTokens?: number;
  completionTokens?: number;
  cachedTokens?: number;
}

/** 用量数据源（/v2/usage/parsers） */
export interface UsageParserInfo {
  name: string;
  type: string;
  enabled: boolean;
}

/** 用量同步日志（内存缓冲） */
export interface SyncLogEntry {
  level: string;
  message: string;
  timestamp: string;
}

/** 用量同步日志（持久化分页） */
export interface SyncLogRow {
  id?: number;
  level?: string;
  source?: string;
  message?: string;
  createTime?: string;
}

/** 供应商 */
export interface Manufacturer {
  id: number;
  name: string;
  code?: string;
  enabled?: boolean;
  [k: string]: unknown;
}

/**
 * 内置默认提供商列表。
 *
 * 后端 /v2/manufacturer/list 为空或未配置时使用，确保本地模型（OCR/人脸/图像等）
 * 能通过 ollama / onnxruntime / python / pytorch 等本地运行时注册。
 * id 使用负数避免与后端自增 ID 冲突。
 */
export const DEFAULT_MANUFACTURERS: Manufacturer[] = [
  // —— 本地模型运行时 ——
  { id: -1, name: 'Ollama（本地大模型）', code: 'ollama', enabled: true },
  { id: -2, name: 'ONNX Runtime（本地推理）', code: 'onnx', enabled: true },
  { id: -3, name: 'Python 脚本（本地执行）', code: 'python', enabled: true },
  { id: -4, name: 'PyTorch（本地推理）', code: 'pytorch', enabled: true },
  { id: -5, name: 'TensorFlow（本地推理）', code: 'tensorflow', enabled: true },
  { id: -6, name: 'PaddlePaddle（本地推理）', code: 'paddle', enabled: true },
  { id: -7, name: 'FastDeploy（本地部署）', code: 'fastdeploy', enabled: true },
  { id: -8, name: 'Triton Inference Server', code: 'triton', enabled: true },
  { id: -9, name: '本地文件（直接加载）', code: 'local-file', enabled: true },
  // —— 常见云服务商 ——
  { id: -10, name: 'OpenAI', code: 'openai', enabled: true },
  { id: -11, name: 'Anthropic Claude', code: 'anthropic', enabled: true },
  { id: -12, name: 'Google Gemini', code: 'gemini', enabled: true },
  { id: -13, name: 'DeepSeek', code: 'deepseek', enabled: true },
  { id: -14, name: '通义千问（阿里云）', code: 'qwen', enabled: true },
  { id: -15, name: '智谱 GLM', code: 'zhipu', enabled: true },
  { id: -16, name: '百度文心一言', code: 'baidu', enabled: true },
  { id: -17, name: '讯飞星火', code: 'xfyun', enabled: true },
  { id: -18, name: '月之暗面 Kimi', code: 'moonshot', enabled: true },
  { id: -19, name: 'MiniMax', code: 'minimax', enabled: true },
  { id: -20, name: '快手可灵', code: 'kling', enabled: true },
  { id: -21, name: 'Midjourney', code: 'midjourney', enabled: true },
  { id: -22, name: 'Stability AI', code: 'stability', enabled: true },
  { id: -23, name: 'PaddleOCR（百度飞桨）', code: 'paddleocr', enabled: true },
  { id: -24, name: 'InsightFace（人脸分析）', code: 'insightface', enabled: true },
  { id: -25, name: 'MediaPipe（Google 视觉）', code: 'mediapipe', enabled: true },
];

/** 供应商密钥 */
export interface ManufacturerKey {
  id?: number;
  name?: string;
  code?: string;
  apiKey?: string;
  baseUrl?: string;
  enabled?: boolean;
  [k: string]: unknown;
}

/* ==================== 分组 → 配置接口路径 ==================== */

const CONFIG_PATHS: Record<string, string> = {
  ocr: '/v2/ocr/config',
  layout: '/v2/layout/config',
  face: '/v2/face/config',
  image: '/v2/image-recognition/config',
  generate: '/v2/generate/config',
  global: '/v2/usage/config',
};

/** 读取任意能力分组配置 */
export function getGroupConfig(group: string): Promise<SettingField[]> {
  const path = CONFIG_PATHS[group];
  if (!path) {
    return Promise.reject(new Error(`未注册的配置分组: ${group}`));
  }
  return apiRequest(http().get(path).then((r) => unwrapResult<SettingField[]>(r)));
}

/** 更新任意能力分组配置（整组替换） */
export function updateGroupConfig(group: string, fields: SettingField[]): Promise<unknown> {
  const path = CONFIG_PATHS[group];
  if (!path) {
    return Promise.reject(new Error(`未注册的配置分组: ${group}`));
  }
  return apiRequest(http().put(path).data({ fields }).then((r) => unwrapResult<unknown>(r)));
}

/* ==================== 模型管理 ==================== */

/** 请求体类型适配：接口对象 → RequestBody（Record<string, unknown>） */
function toBody<T extends object>(obj: T): Record<string, unknown> {
  return obj as unknown as Record<string, unknown>;
}

export const modelApi = {
  /** 模型列表 */
  list: (): Promise<AiModelDTO[]> => apiRequest(http().get('/v2/models').then((r) => unwrapResult<AiModelDTO[]>(r))),
  /** 新建模型 */
  create: (m: AiModelDTO): Promise<AiModelDTO> =>
    apiRequest(http().post('/v2/models').data(toBody(m)).then((r) => unwrapResult<AiModelDTO>(r))),
  /** 更新模型 */
  update: (id: number, m: AiModelDTO): Promise<AiModelDTO> =>
    apiRequest(http().put(`/v2/models/${id}`).data(toBody(m)).then((r) => unwrapResult<AiModelDTO>(r))),
  /** 删除模型 */
  remove: (id: number): Promise<unknown> =>
    apiRequest(http().delete(`/v2/models/${id}`).then((r) => unwrapResult<unknown>(r))),
  /** 测试模型连通性延迟（非本地模型） */
  testLatency: (id: number): Promise<AiModelDTO> =>
    apiRequest(http().post(`/v2/models/${id}/test-latency`).then((r) => unwrapResult<AiModelDTO>(r))),
  /** 模型能力目录（capability -> 模型清单） */
  capabilities: (): Promise<Record<string, string[]>> =>
    apiRequest(http().get('/v2/ai/models/capabilities').then((r) => unwrapResult<Record<string, string[]>>(r))),
};

/* ==================== 管线目录 ==================== */

export const pipelineApi = {
  list: (): Promise<PipelineDef[]> => apiRequest(http().get('/v2/ai/pipelines').then((r) => unwrapResult<PipelineDef[]>(r))),
};

/* ==================== 供应商 / 密钥 ==================== */

export const manufacturerApi = {
  list: (): Promise<Manufacturer[]> =>
    apiRequest(http().get('/v2/manufacturer/list').then((r) => unwrapResult<Manufacturer[]>(r))),
  keys: (): Promise<ManufacturerKey[]> =>
    apiRequest(http().get('/v2/manufacturer-key/list').then((r) => unwrapResult<ManufacturerKey[]>(r))),
};

/* ==================== 用量管理 ==================== */

/** 用量时间范围（ISO 字符串，后端 /v2/usage/* 可选查询参数） */
export interface UsageTimeRange {
  startTime?: string;
  endTime?: string;
}

/** 拼接到 URL 的时间范围查询串 */
function rangeQuery(range?: UsageTimeRange): string {
  if (!range) return '';
  const p: string[] = [];
  if (range.startTime) p.push(`startTime=${encodeURIComponent(range.startTime)}`);
  if (range.endTime) p.push(`endTime=${encodeURIComponent(range.endTime)}`);
  return p.length ? `&${p.join('&')}` : '';
}

export const usageApi = {
  /** 用量统计概览 */
  statistics: (range?: UsageTimeRange): Promise<UsageStatistics> =>
    apiRequest(http().get(`/v2/usage/statistics?1=1${rangeQuery(range)}`).then((r) => unwrapResult<UsageStatistics>(r))),
  /** 每日用量趋势（按天聚合，默认最近 30 天） */
  trend: (range?: UsageTimeRange): Promise<UsageTrendItem[]> =>
    apiRequest(http().get(`/v2/usage/trend?1=1${rangeQuery(range)}`).then((r) => unwrapResult<UsageTrendItem[]>(r))),
  /** 用量明细（分页） */
  list: (page: number, size: number, groupName?: string, range?: UsageTimeRange): Promise<{ records: UsageRecord[]; total: number; page: number; pageSize: number }> =>
    apiRequest(
      http()
        .get(`/v2/usage/list?page=${page}&size=${size}${groupName ? `&groupName=${encodeURIComponent(groupName)}` : ''}${rangeQuery(range)}`)
        .then((r) => unwrapResult<{ records: UsageRecord[]; total: number; page: number; pageSize: number }>(r)),
    ),
  /** 可用数据源（UsageParser SPI） */
  parsers: (): Promise<UsageParserInfo[]> => apiRequest(http().get('/v2/usage/parsers').then((r) => unwrapResult<UsageParserInfo[]>(r))),
  /** 立即同步外部用量 */
  trigger: (): Promise<unknown> => apiRequest(http().post('/v2/usage/trigger').then((r) => unwrapResult<unknown>(r))),
  /** 聚合当天 */
  aggregate: (): Promise<unknown> => apiRequest(http().post('/v2/usage/aggregate').then((r) => unwrapResult<unknown>(r))),
  /** 全量聚合 */
  aggregateAll: (): Promise<unknown> => apiRequest(http().post('/v2/usage/aggregate-all').then((r) => unwrapResult<unknown>(r))),
  /** 最近同步日志（内存缓冲） */
  syncLogsLive: (): Promise<SyncLogEntry[]> => apiRequest(http().get('/v2/usage/logs').then((r) => unwrapResult<SyncLogEntry[]>(r))),
  /** 用量同步日志（持久化分页） */
  syncLogs: (page: number, size: number, level?: string): Promise<{ records: SyncLogRow[]; total: number; page: number; pageSize: number }> =>
    apiRequest(
      http()
        .get(`/v2/usage/sync-logs?page=${page}&size=${size}${level ? `&level=${encodeURIComponent(level)}` : ''}`)
        .then((r) => unwrapResult<{ records: SyncLogRow[]; total: number; page: number; pageSize: number }>(r)),
    ),
};

/* ==================== 全局 Bean（ChatClient 会话） ==================== */

export interface ChatGlobalBean {
  chatClientEnabled?: boolean;
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  enableCache?: boolean;
  stream?: boolean;
  systemPrompt?: string;
}

export const globalBeanApi = {
  get: (): Promise<ChatGlobalBean> =>
    apiRequest(http().get('/v2/global-settings').then((r) => unwrapResult<ChatGlobalBean>(r))),
  update: (patch: ChatGlobalBean): Promise<unknown> =>
    apiRequest(http().put('/v2/global-settings').data(toBody(patch)).then((r) => unwrapResult<unknown>(r))),
};

/* ==================== 格式化工具 ==================== */

/** 数字 → 友好展示（千分位） */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('zh-CN');
}

/** 金额展示 */
export function formatCost(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '-';
  const v = Number(n);
  if (v === 0) return '0.00';
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/** 能力标签 → 中文名（覆盖对话/生成/OCR/版面/人脸/图像/视频/音频/NLP/3D/医学/遥感/安全/工业/农业等全部常见 AI 模型类型） */
export const CAPABILITY_LABELS: Record<string, string> = {
  // —— 对话 / 大语言模型 ——
  chat: '对话',
  vision: '视觉',
  think: '深度思考',
  search: '联网搜索',
  'code-generation': '代码生成',
  'code-completion': '代码补全',
  'math-solving': '数学解题',
  'logical-reasoning': '逻辑推理',
  'question-answering': '问答',
  'dialogue': '多轮对话',
  'instruction-following': '指令跟随',
  'role-play': '角色扮演',

  // —— 生成类 ——
  'text-to-image': '文生图',
  'text-to-video': '文生视频',
  'image-generate': '图像生成',
  'image-to-image': '图生图',
  'image-to-video': '图生视频',
  'video-to-video': '视频转视频',
  'text-to-3d': '文生3D',
  'image-to-3d': '图生3D',
  '3d-generate': '3D 生成',
  'music-generate': '音乐生成',
  'audio-generate': '音频生成',
  'speech-synthesize': '语音合成',
  'voice-clone': '声音克隆',
  'voice-conversion': '声音转换',

  // —— OCR / 文档理解 ——
  ocr: '文字识别',
  'ocr-detect': '文字检测',
  'ocr-recognize': '文字识别',
  'ocr-correct': '方向矫正',
  'ocr-sr': '超分增强',
  'handwriting-recognition': '手写识别',
  'document-understanding': '文档理解',
  'document-classification': '文档分类',
  'seal-recognition': '印章识别',
  'id-card-recognition': '身份证识别',
  'passport-recognition': '护照识别',
  'bank-card-recognition': '银行卡识别',
  'vin-code-recognition': 'VIN码识别',
  'barcode-recognition': '条码识别',
  'qr-code-recognition': '二维码识别',
  'receipt-ocr': '票据识别',
  'invoice-ocr': '发票识别',

  // —— 版面分析 ——
  layout: '版面分析',
  'layout-table': '表格识别',
  'layout-formula': '公式识别',
  'layout-paragraph': '段落分析',
  'layout-title': '标题识别',
  'layout-figure': '图表识别',

  // —— 通用检测 / 识别 ——
  detect: '目标检测',
  'image-detect': '图像检测',
  classify: '图像分类',
  feature: '特征提取',
  embedding: '向量嵌入',
  'text-embedding': '文本嵌入',
  rerank: '重排序',
  'cross-encoder': '交叉编码器',
  'bi-encoder': '双向编码器',
  tokenizer: '分词器',
  'multimodal-fusion': '多模态融合',

  // —— 人脸分析 ——
  'face-detect': '人脸检测',
  'face-recognize': '人脸识别',
  'anime-face-detect': '动漫人脸检测',
  'eye-detect': '眼睛检测',
  'smile-detect': '微笑检测',
  'face-quality': '人脸质量',
  liveness: '活体检测',
  'face-landmark': '人脸关键点',
  'face-attr': '人脸属性',
  'face-swapping': '人脸替换',
  'face-generation': '人脸生成',
  'face-animation': '人脸动画',
  'lip-sync': '唇形同步',
  'age-estimation': '年龄估计',
  'gender-estimation': '性别估计',
  'expression-recognition': '表情识别',
  'head-pose': '头部姿态',
  'gaze-estimation': '视线估计',

  // —— 人体 / 行为 ——
  pose: '姿态估计',
  'body-pose': '人体姿态',
  'hand-detect': '手部检测',
  'hand-pose': '手部姿态',
  'human-parsing': '人体解析',
  'action-recognition': '行为识别',
  'gesture-recognition': '手势识别',
  'fall-detection': '跌倒检测',
  'crowd-counting': '人群计数',
  'crowd-density': '人群密度',
  pedestrian: '行人检测',
  'pedestrian-attribute': '行人属性',
  're-id': '行人重识别',

  // —— 车辆 / 交通 ——
  'plate-detect': '车牌检测',
  'plate-recognize': '车牌识别',
  'vehicle-detect': '车辆检测',
  'vehicle-attribute': '车辆属性',
  'vehicle-reid': '车辆重识别',
  'traffic-sign': '交通标志',
  'parking-detect': '停车位检测',
  'lane-detect': '车道线检测',

  // —— 图像增强 / 修复 ——
  enhance: '画质增强',
  'image-quality': '图像质量',
  'image-restoration': '图像修复',
  'image-denoising': '图像去噪',
  'image-deblurring': '图像去模糊',
  'image-super-resolution': '图像超分',
  'image-colorization': '图像上色',
  'image-inpainting': '图像补全',
  'image-outpainting': '图像外扩',
  'image-style-transfer': '风格迁移',
  'image-cartoonization': '图像卡通化',
  'image-sketch': '图像素描',
  'background-removal': '背景移除',
  matting: '抠图',
  'image-compression': '图像压缩',
  'image-harmonization': '图像融合',

  // —— 图像理解 / 分割 ——
  segment: '图像分割',
  'semantic-segmentation': '语义分割',
  'instance-segmentation': '实例分割',
  'panoptic-segmentation': '全景分割',
  captioning: '图像描述',
  depth: '深度估计',
  'image-caption': '图像描述',
  'visual-question-answering': '视觉问答',
  'visual-grounding': '视觉定位',
  'saliency-detection': '显著性检测',
  'edge-detection': '边缘检测',

  // —— 视频理解 / 处理 ——
  'video-understand': '视频理解',
  'video-classification': '视频分类',
  'video-detection': '视频目标检测',
  'video-tracking': '目标跟踪',
  'video-segmentation': '视频分割',
  'video-super-resolution': '视频超分',
  'video-frame-interpolation': '视频插帧',
  'video-denoising': '视频去噪',
  'video-stabilization': '视频防抖',
  'video-enhancement': '视频增强',
  'video-captioning': '视频描述',
  'video-question-answering': '视频问答',
  'video-editing': '视频编辑',
  'video-matting': '视频抠图',
  'video-restoration': '视频修复',
  'anomaly-detection-video': '视频异常检测',

  // —— 音频 / 语音 ——
  asr: '语音识别',
  tts: '语音合成',
  'speech-recognize': '语音识别',
  translate: '翻译',
  'audio-classification': '音频分类',
  'audio-source-separation': '音源分离',
  'noise-suppression': '降噪',
  'echo-cancellation': '回声消除',
  'speech-enhancement': '语音增强',
  'speech-separation': '语音分离',
  'speaker-diarization': '说话人分离',
  'speaker-verification': '说话人验证',
  'audio-denoising': '音频去噪',
  'music-separation': '音乐分离',
  'beat-tracking': '节拍跟踪',
  'audio-tagging': '音频标签',
  'sound-event-detection': '声音事件检测',

  // —— NLP / 文本理解 ——
  'text-classification': '文本分类',
  'sentiment-analysis': '情感分析',
  ner: '命名实体识别',
  'keyword-extraction': '关键词提取',
  'text-summarization': '文本摘要',
  'text-correction': '文本纠错',
  'grammar-check': '语法检查',
  'relation-extraction': '关系抽取',
  'entity-linking': '实体链接',
  'text-clustering': '文本聚类',
  'text-matching': '文本匹配',
  'text-similarity': '文本相似度',
  'paraphrase': '同义改写',
  'text-style-transfer': '文本风格迁移',
  'text-simplification': '文本简化',
  'reading-comprehension': '阅读理解',
  'natural-language-inference': '自然语言推理',
  'coreference-resolution': '共指消解',
  'dependency-parsing': '依存句法分析',
  'constituency-parsing': '成分句法分析',
  'word-sense-disambiguation': '词义消歧',

  // —— 3D / 点云 ——
  'point-cloud-classification': '点云分类',
  'point-cloud-segmentation': '点云分割',
  'point-cloud-detection': '点云检测',
  '3d-reconstruction': '3D重建',
  '3d-segmentation': '3D分割',
  'mesh-generation': '网格生成',
  'texture-generation': '纹理生成',
  nerf: '神经辐射场(NeRF)',
  'gaussian-splatting': '高斯泼溅',
  'slam': '同步定位与建图',
  '3d-pose-estimation': '3D姿态估计',

  // —— 医学影像 ——
  'medical-image-classification': '医学图像分类',
  'medical-image-segmentation': '医学图像分割',
  'medical-image-detection': '医学图像检测',
  'lesion-detection': '病灶检测',
  'tumor-segmentation': '肿瘤分割',
  'organ-segmentation': '器官分割',
  'x-ray-analysis': 'X光分析',
  'ct-analysis': 'CT分析',
  'mri-analysis': 'MRI分析',
  'ultrasound-analysis': '超声分析',
  'pathology-analysis': '病理分析',
  'retinal-image-analysis': '眼底图像分析',
  'dental-image-analysis': '牙科图像分析',
  'medical-image-registration': '医学图像配准',

  // —— 遥感 / 卫星 ——
  'remote-sensing-classification': '遥感分类',
  'remote-sensing-detection': '遥感检测',
  'remote-sensing-segmentation': '遥感分割',
  'change-detection': '变化检测',
  'building-extraction': '建筑提取',
  'road-extraction': '道路提取',
  'land-cover-classification': '土地覆盖分类',
  'remote-sensing-super-resolution': '遥感超分',

  // —— 安全 / 监控 ——
  'intrusion-detection': '入侵检测',
  'loitering-detection': '徘徊检测',
  'helmet-detection': '安全帽检测',
  'fire-detection': '火灾检测',
  'smoke-detection': '烟雾检测',
  'weapon-detection': '武器检测',
  'queue-length': '排队长度',
  'abandoned-object-detection': '遗留物检测',
  'violence-detection': '暴力检测',
  'crowd-anomaly': '人群异常',

  // —— 工业 / 质检 ——
  'defect-detection': '缺陷检测',
  'defect-classification': '缺陷分类',
  'surface-defect': '表面缺陷',
  'product-counting': '产品计数',
  'industrial-ocr': '工业OCR',
  'anomaly-detection': '异常检测',
  'quality-inspection': '质量检测',

  // —— 农业 ——
  'plant-disease-detection': '植物病害检测',
  'crop-classification': '作物分类',
  'weed-detection': '杂草检测',
  'fruit-detection': '水果检测',
  'yield-estimation': '产量估计',
  'plant-counting': '植株计数',
  'soil-analysis': '土壤分析',

  // —— 推荐 / 排序 ——
  recommendation: '推荐',
  'click-prediction': '点击率预测',
  'conversion-prediction': '转化率预测',
  'user-profile': '用户画像',
  'collaborative-filtering': '协同过滤',

  // —— 时间序列 ——
  'time-series-forecasting': '时间序列预测',
  'time-series-anomaly': '时序异常检测',
  'forecasting': '预测',

  // —— 图 / 知识图谱 ——
  'graph-neural-network': '图神经网络',
  'knowledge-graph': '知识图谱',
  'link-prediction': '链接预测',

  // —— 模型压缩 / 优化 ——
  'model-quantization': '模型量化',
  'model-distillation': '模型蒸馏',
  'model-pruning': '模型剪枝',
  'model-compression': '模型压缩',
};

export function capabilityLabel(cap: string): string {
  return CAPABILITY_LABELS[cap] ?? cap;
}

/* ==================== Agent 管理 ==================== */

export interface AgentDefinition {
  agentId?: string;
  name?: string;
  description?: string;
  agentType?: string;
  agentSource?: string;
  enabled?: boolean;
  available?: boolean;
  model?: string;
  providerId?: string | number;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  tools?: string[];
  skills?: string[];
  mcpServers?: string[];
  isLeader?: boolean;
  mode?: 'SINGLE' | 'ROUTER';
  subAgents?: AgentDefinition[];
  registeredModel?: string;
  createdAt?: number;
  updatedAt?: number;
  [k: string]: unknown;
}

export interface OrchestrationData {
  nodes: Array<{ id: string; label: string; type?: string; kind?: string; position?: { x: number; y: number } }>;
  edges: Array<{ id: string; source: string; target: string; label?: string }>;
  mode?: string;
}

export const agentApi = {
  list: (): Promise<AgentDefinition[]> =>
    apiRequest(http().get('/api/agents/managed').then((r) => unwrapResult<AgentDefinition[]>(r))),
  get: (agentId: string): Promise<AgentDefinition> =>
    apiRequest(http().get(`/api/agents/managed/${agentId}`).then((r) => unwrapResult<AgentDefinition>(r))),
  create: (body: Partial<AgentDefinition>): Promise<AgentDefinition> =>
    apiRequest(http().post('/api/agents/managed').data(toBody(body)).then((r) => unwrapResult<AgentDefinition>(r))),
  update: (agentId: string, body: Partial<AgentDefinition>): Promise<AgentDefinition> =>
    apiRequest(http().put(`/api/agents/managed/${agentId}`).data(toBody(body)).then((r) => unwrapResult<AgentDefinition>(r))),
  remove: (agentId: string): Promise<unknown> =>
    apiRequest(http().delete(`/api/agents/managed/${agentId}`).then((r) => unwrapResult<unknown>(r))),
  createSubAgent: (agentId: string, body: Partial<AgentDefinition>): Promise<AgentDefinition> =>
    apiRequest(http().post(`/api/agents/managed/${agentId}/sub-agents`).data(toBody(body)).then((r) => unwrapResult<AgentDefinition>(r))),
  updateSubAgent: (agentId: string, subId: string, body: Partial<AgentDefinition>): Promise<AgentDefinition> =>
    apiRequest(http().put(`/api/agents/managed/${agentId}/sub-agents/${subId}`).data(toBody(body)).then((r) => unwrapResult<AgentDefinition>(r))),
  removeSubAgent: (agentId: string, subId: string): Promise<unknown> =>
    apiRequest(http().delete(`/api/agents/managed/${agentId}/sub-agents/${subId}`).then((r) => unwrapResult<unknown>(r))),
  getOrchestration: (agentId: string): Promise<OrchestrationData> =>
    apiRequest(http().get(`/api/agents/managed/${agentId}/orchestration`).then((r) => unwrapResult<OrchestrationData>(r))),
  saveOrchestration: (agentId: string, data: OrchestrationData): Promise<unknown> =>
    apiRequest(http().post(`/api/agents/managed/${agentId}/orchestration`).data(toBody(data)).then((r) => unwrapResult<unknown>(r))),
  registerAsModel: (agentId: string, modelName?: string): Promise<{ registered: boolean; modelName: string }> =>
    apiRequest(
      http().post(`/api/agents/managed/${agentId}/register${modelName ? `?model_name=${encodeURIComponent(modelName)}` : ''}`)
        .then((r) => unwrapResult<{ registered: boolean; modelName: string }>(r)),
    ),
  unregisterModel: (agentId: string): Promise<unknown> =>
    apiRequest(http().delete(`/api/agents/managed/${agentId}/register`).then((r) => unwrapResult<unknown>(r))),
  getRegisteredModel: (agentId: string): Promise<{ registered: boolean; modelName?: string }> =>
    apiRequest(http().get(`/api/agents/managed/${agentId}/registered-model`).then((r) => unwrapResult<{ registered: boolean; modelName?: string }>(r))),
  listRegisteredModels: (): Promise<Array<{ modelName: string; agentName: string }>> =>
    apiRequest(http().get('/api/agents/managed/registered-models').then((r) => unwrapResult<Array<{ modelName: string; agentName: string }>>(r))),
  rebuild: (agentId: string): Promise<unknown> =>
    apiRequest(http().post(`/api/agents/managed/${agentId}/rebuild`).then((r) => unwrapResult<unknown>(r))),
};

/* ==================== 服务管理 ==================== */

export interface ServiceStatus {
  name: string;
  running?: boolean;
  pid?: number;
  uptime?: number;
  port?: number;
  usageEnabled?: boolean;
  protocols?: { openai?: boolean; cc?: boolean; codex?: boolean; gemini?: boolean };
  description?: string;
}

export const serviceApi = {
  list: (): Promise<ServiceStatus[]> =>
    apiRequest(http().get('/v2/services/status').then((r) => unwrapResult<ServiceStatus[]>(r))),
  start: (name: string): Promise<unknown> =>
    apiRequest(http().post(`/v2/services/${name}/start`).then((r) => unwrapResult<unknown>(r))),
  stop: (name: string): Promise<unknown> =>
    apiRequest(http().post(`/v2/services/${name}/stop`).then((r) => unwrapResult<unknown>(r))),
};

/* ==================== Skills 配置（本地/在线 Provider 开关） ==================== */

export interface SkillProviderConfig {
  key: string;
  providerKey: string;
  name: string;
  type: 'local' | 'online';
  marketType?: string;
  url?: string;
  enabled: boolean;
}

export interface SkillsConfigResponse {
  localProviders: SkillProviderConfig[];
  onlineProviders: SkillProviderConfig[];
  localCount: number;
  onlineCount: number;
}

export const skillsConfigApi = {
  list: (): Promise<SkillsConfigResponse> =>
    apiRequest(http().get('/v2/skills-config').then((r) => unwrapResult<SkillsConfigResponse>(r))),
  update: (config: Record<string, boolean>): Promise<SkillsConfigResponse> =>
    apiRequest(http().put('/v2/skills-config').data(config).then((r) => unwrapResult<SkillsConfigResponse>(r))),
};

/* ==================== 角色 / MCP / 插件 Provider 配置（与 skills-config 同构） ==================== */

/**
 * 角色 Provider 开关（/v2/roles-config）。
 * 返回结构与 SkillsConfigResponse 一致：localProviders + onlineProviders。
 */
export const rolesConfigApi = {
  list: (): Promise<SkillsConfigResponse> =>
    apiRequest(http().get('/v2/roles-config').then((r) => unwrapResult<SkillsConfigResponse>(r))),
  update: (config: Record<string, boolean>): Promise<SkillsConfigResponse> =>
    apiRequest(http().put('/v2/roles-config').data(config).then((r) => unwrapResult<SkillsConfigResponse>(r))),
};

/** MCP Provider 开关（/v2/mcp-config） */
export const mcpConfigApi = {
  list: (): Promise<SkillsConfigResponse> =>
    apiRequest(http().get('/v2/mcp-config').then((r) => unwrapResult<SkillsConfigResponse>(r))),
  update: (config: Record<string, boolean>): Promise<SkillsConfigResponse> =>
    apiRequest(http().put('/v2/mcp-config').data(config).then((r) => unwrapResult<SkillsConfigResponse>(r))),
};

/** 插件 Provider 开关（/v2/plugins-config） */
export const pluginsConfigApi = {
  list: (): Promise<SkillsConfigResponse> =>
    apiRequest(http().get('/v2/plugins-config').then((r) => unwrapResult<SkillsConfigResponse>(r))),
  update: (config: Record<string, boolean>): Promise<SkillsConfigResponse> =>
    apiRequest(http().put('/v2/plugins-config').data(config).then((r) => unwrapResult<SkillsConfigResponse>(r))),
};

/* ==================== 模型指标采集（ModelMetricsPushTask） ==================== */

/** 模型指标采集配置 */
export interface ModelMetricsConfig {
  enabled: boolean;
  intervalSec: number;
}

/** 模型指标快照 */
export interface ModelMetricsSnapshot {
  total?: number;
  updatedAt?: string;
  [k: string]: unknown;
}

export const modelMetricsApi = {
  /** 读取模型指标采集配置 */
  getConfig: (): Promise<ModelMetricsConfig> =>
    apiRequest(http().get('/api/model-metrics/config').then((r) => unwrapResult<ModelMetricsConfig>(r))),
  /** 保存模型指标采集配置 */
  saveConfig: (data: ModelMetricsConfig): Promise<ModelMetricsConfig> =>
    apiRequest(http().put('/api/model-metrics/config').data(toBody(data)).then((r) => unwrapResult<ModelMetricsConfig>(r))),
  /** 立即同步官方定价到 sys_ai_pricing 表 */
  syncPricing: (): Promise<unknown> =>
    apiRequest(http().post('/api/model-metrics/sync-pricing').then((r) => unwrapResult<unknown>(r))),
  /** 读取指标快照 */
  getSnapshot: (): Promise<ModelMetricsSnapshot> =>
    apiRequest(http().get('/api/model-metrics').then((r) => unwrapResult<ModelMetricsSnapshot>(r))),
};

/* ==================== 用量明细（参考 New API 风格） ==================== */

export interface UsageDetail {
  id?: string;
  apiKey?: string;
  model?: string;
  reasoningEffort?: string;
  endpoint?: string;
  ip?: string;
  group?: string;
  type?: string;
  billingMode?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  totalTokens?: number;
  cost?: number;
  originalCost?: number;
  firstTokenLatency?: number;
  totalLatency?: number;
  time?: number;
  isError?: boolean;
  errorMessage?: string;
}

export interface UsageDashboard {
  totalRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  avgLatency: number;
  modelDistribution: Array<{ model: string; requests: number; tokens: number; cost: number }>;
  groupDistribution: Array<{ group: string; requests: number; tokens: number; cost: number }>;
  endpointDistribution: Array<{ endpoint: string; requests: number; tokens: number; cost: number }>;
  tokenTrend: Array<{ time: string; input: number; output: number; cacheRead: number; cacheCreation: number; cacheHitRate: number }>;
}

export const usageDetailApi = {
  dashboard: (params: { startDate?: string; endDate?: string; granularity?: string }): Promise<UsageDashboard> =>
    apiRequest(http().get('/v2/usage/dashboard').query(params).then((r) => unwrapResult<UsageDashboard>(r))),
  list: (params: Record<string, unknown>): Promise<{ items: UsageDetail[]; total: number }> =>
    apiRequest(http().get('/v2/usage/details').query(params).then((r) => unwrapResult<{ items: UsageDetail[]; total: number }>(r))),
};

/* ==================== Skills（已安装技能 / 本地扫描 / 市场搜索安装） ==================== */

/** 已安装技能 */
export interface InstalledSkill {
  name: string;
  description?: string;
  path?: string;
  source: 'builtin' | 'custom';
}

/** 探测到的技能目录 */
export interface DetectedSkillPath {
  name: string;
  path: string;
}

/** Skills 目录配置 */
export interface SkillsDirs {
  user_skills_dir?: string;
  builtin_skills_dir?: string;
}

/** 市场搜索条目 */
export interface MarketSearchItem {
  id: string;
  source: string;
  rank?: number;
  name: string;
  description?: string;
  url?: string;
  install_command?: string;
  tags?: string[];
  stats?: Record<string, unknown>;
}

/** 市场搜索分页信息 */
export interface MarketPagination {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  [k: string]: unknown;
}

/** 市场搜索结果 */
export interface MarketSearchResult {
  items: MarketSearchItem[];
  pagination?: MarketPagination;
  errors?: string[];
}

/** 安装结果 */
export interface SkillInstallResult {
  skill_name: string;
  installed: string[];
  errors?: string[];
}

export const skillApi = {
  /** 已安装技能列表 */
  list: (): Promise<InstalledSkill[]> =>
    apiRequest(http().get('/api/skills').then((r) => unwrapResult<InstalledSkill[]>(r))),
  /** 扫描指定本地目录 */
  scan: (folderPath: string): Promise<InstalledSkill[]> =>
    apiRequest(http().post('/api/skills/scan').data(toBody({ folder_path: folderPath })).then((r) => unwrapResult<InstalledSkill[]>(r))),
  /** 探测内置 / 用户技能目录 */
  detectPaths: (): Promise<DetectedSkillPath[]> =>
    apiRequest(http().get('/api/skills/detect-paths').then((r) => unwrapResult<DetectedSkillPath[]>(r))),
  /** 读取技能目录配置 */
  paths: (): Promise<SkillsDirs> =>
    apiRequest(http().get('/api/skills/paths').then((r) => unwrapResult<SkillsDirs>(r))),
  /** 删除（卸载）技能 */
  remove: (skillName: string): Promise<unknown> =>
    apiRequest(http().delete(`/api/skills/${encodeURIComponent(skillName)}`).then((r) => unwrapResult<unknown>(r))),
  /** 市场搜索 */
  marketSearch: (params: { search?: string; page?: number; limit?: number; sortBy?: string }): Promise<MarketSearchResult> =>
    apiRequest(
      http()
        .get('/api/skills/market/search')
        .query({
          search: params.search ?? '',
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          sortBy: params.sortBy ?? 'stars',
        })
        .then((r) => unwrapResult<MarketSearchResult>(r)),
    ),
  /** 市场安装 */
  marketInstall: (pkg: { source: string; id: string; url?: string }): Promise<SkillInstallResult> =>
    apiRequest(http().post('/api/skills/market/package/install').data(toBody(pkg)).then((r) => unwrapResult<SkillInstallResult>(r))),
  /** 同步市场排行（插件源等） */
  rankingsSync: (sources: string[]): Promise<unknown> =>
    apiRequest(http().post('/api/skills/market/rankings/sync').data(toBody({ sources })).then((r) => unwrapResult<unknown>(r))),
};

/* ==================== 角色（/v2/roles） ==================== */

/** AI 角色 DTO（与后端 SysAiRole 对齐） */
export interface AiRole {
  id?: number;
  name: string;
  code: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  sort?: number;
  /** 1=启用 0=禁用 */
  status?: number;
}

export const roleApi = {
  /** 角色列表 */
  list: (): Promise<AiRole[]> =>
    apiRequest(http().get('/v2/roles').then((r) => unwrapResult<AiRole[]>(r))),
  /** 启用角色列表 */
  enabled: (): Promise<AiRole[]> =>
    apiRequest(http().get('/v2/roles/enabled').then((r) => unwrapResult<AiRole[]>(r))),
  /** 单个角色 */
  get: (id: number): Promise<AiRole> =>
    apiRequest(http().get(`/v2/roles/${id}`).then((r) => unwrapResult<AiRole>(r))),
  /** 创建 */
  create: (role: AiRole): Promise<AiRole> =>
    apiRequest(http().post('/v2/roles').data(toBody(role)).then((r) => unwrapResult<AiRole>(r))),
  /** 更新 */
  update: (id: number, role: AiRole): Promise<AiRole> =>
    apiRequest(http().put(`/v2/roles/${id}`).data(toBody(role)).then((r) => unwrapResult<AiRole>(r))),
  /** 删除 */
  remove: (id: number): Promise<unknown> =>
    apiRequest(http().delete(`/v2/roles/${id}`).then((r) => unwrapResult<unknown>(r))),
};

/* ==================== MCP（/api/mcp） ==================== */

/** MCP 传输配置 */
export interface McpTransport {
  type: 'stdio' | 'sse' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

/** MCP 服务器 */
export interface McpServer {
  mcp_server_id: string;
  name: string;
  transport: McpTransport;
  enabled: boolean;
  builtin?: boolean;
  last_test_status?: string | null;
  created_at?: string;
  updated_at?: string;
  original_json?: string;
}

/** 连接测试结果 */
export interface McpTestResult {
  status: string;
  message?: string;
  tools?: Array<{ name?: string; description?: string }>;
}

export const mcpApi = {
  /** 服务器列表 */
  list: (): Promise<McpServer[]> =>
    apiRequest(http().get('/api/mcp/servers').then((r) => unwrapResult<McpServer[]>(r))),
  /** 创建 */
  create: (body: { name: string; transport: McpTransport; enabled?: boolean }): Promise<McpServer> =>
    apiRequest(http().post('/api/mcp/servers').data(toBody(body)).then((r) => unwrapResult<McpServer>(r))),
  /** 更新 */
  update: (serverId: string, body: Partial<{ name: string; transport: McpTransport; enabled: boolean }>): Promise<McpServer> =>
    apiRequest(http().put(`/api/mcp/servers/${encodeURIComponent(serverId)}`).data(toBody(body)).then((r) => unwrapResult<McpServer>(r))),
  /** 删除 */
  remove: (serverId: string): Promise<unknown> =>
    apiRequest(http().delete(`/api/mcp/servers/${encodeURIComponent(serverId)}`).then((r) => unwrapResult<unknown>(r))),
  /** 切换启用状态 */
  toggle: (serverId: string): Promise<unknown> =>
    apiRequest(http().post(`/api/mcp/servers/${encodeURIComponent(serverId)}/toggle`).then((r) => unwrapResult<unknown>(r))),
  /** 测试连接 */
  testConnection: (body: { name: string; transport: McpTransport }): Promise<McpTestResult> =>
    apiRequest(http().post('/api/mcp/test-connection').data(toBody(body)).then((r) => unwrapResult<McpTestResult>(r))),
};

/* ==================== 插件（复用 Skills 市场，source=clawhub_plugins） ==================== */

export const pluginApi = {
  /** 插件市场搜索（复用 skillApi 市场搜索，按 source 过滤） */
  search: (params: { search?: string; page?: number; limit?: number }): Promise<MarketSearchResult> =>
    skillApi.marketSearch({ ...params, sortBy: 'stars' }).then((res) => ({
      ...res,
      items: (res.items ?? []).filter((it) => it.source === 'clawhub_plugins'),
    })),
  /** 同步插件市场排行 */
  syncRankings: (): Promise<unknown> => skillApi.rankingsSync(['clawhub_plugins']),
};
