/**
 * 知识库重构探索 —— mock 数据（Phase 2 专用，选定后删除）。
 *
 * <p>数据字段<b>严格对齐</b>真实类型，保证变体里能呈现的字段在 Phase 3 接真数据时无需改模板：</p>
 * <ul>
 *   <li>{@code KnowledgeBase}：id / name / description / isPublic / isActive / chunkMaxSize /
 *       chunkOverlapSize / chunkMinSize / sourceUrl / sourceMaxPages / cover / createdAt / updatedAt</li>
 *   <li>{@code KBFile}：fileName / displayName / fileSize / fileExtension / processingStatus /
 *       progressPercentage / currentStep / errorMessage / totalChunks / totalTokens /
 *       uploadedAt / processedAt / relativePath</li>
 *   <li>图谱：实体（id / text / type / degree / image）与关系（from / to / text）</li>
 *   <li>问答：question / answer / citations / elapsed</li>
 * </ul>
 *
 * <p><b>为什么专门造「失败」「解析中」「刚上传未处理」三类文档</b>：真实场景里这几种状态最常被
 * 忽略，而它们恰恰是重做要解决的重点（错误原因此前不可见、进度不可见、token 数从未上屏）。</p>
 */

/** 文档处理状态（与 KBFile.processingStatus 同口径，去掉 uploading 以精简样例） */
type FileStatus = 'queued' | 'pending' | 'processing' | 'completed' | 'failed'

/** 知识库（对齐 stores/knowledgeBase.ts 的 KnowledgeBase） */
export interface MockKB {
  id: string
  name: string
  description: string
  isPublic: boolean
  /** 停用的库（UI 上应以灰态/暂停标识表达，此前完全没有体现） */
  isActive: boolean
  chunkMaxSize: number
  chunkOverlapSize: number
  chunkMinSize: number
  sourceUrl: string
  sourceMaxPages: number
  createdAt: string
  updatedAt: string
}

/** 文档（对齐 KBFile） */
export interface MockFile {
  id: string
  kbId: string
  displayName: string
  relativePath: string
  fileSize: number
  fileExtension: string
  processingStatus: FileStatus
  progressPercentage: number
  currentStep: string | null
  errorMessage: string | null
  totalChunks: number
  totalTokens: number
  uploadedAt: string
  processedAt: string | null
}

/** 图谱实体 */
export interface MockEntity {
  id: string
  text: string
  type: string
  degree: number
}

/** 图谱关系 */
export interface MockRelation {
  from: string
  to: string
  text: string
}

/** 问答记录 */
export interface MockTurn {
  id: number
  question: string
  answer: string
  citations: Array<{ index: number; fileName: string; score: number; snippet: string }>
  elapsed: number
}

/** 实体类型 → 展示名 */
export const ENTITY_LABEL: Record<string, string> = {
  person: '人物',
  event: '事件',
  concept: '概念',
  place: '地点',
  work: '作品',
  organization: '组织',
}

/** 状态 → 展示名 */
export const STATUS_LABEL: Record<FileStatus, string> = {
  queued: '排队中',
  pending: '待处理',
  processing: '解析中',
  completed: '已索引',
  failed: '解析失败',
}

/** 知识库列表 */
export const MOCK_KBS: MockKB[] = [
  {
    id: 'kb-1',
    name: '三国演义 · 教研库',
    description: '课文、考点与人物关系抽取，用于整本书阅读教学',
    isPublic: true,
    isActive: true,
    chunkMaxSize: 800,
    chunkOverlapSize: 80,
    chunkMinSize: 200,
    sourceUrl: '',
    sourceMaxPages: 0,
    createdAt: '2026-09-12 10:20',
    updatedAt: '2026-10-21 16:04',
  },
  {
    id: 'kb-2',
    name: '小学古诗 112 首',
    description: '按朝代与主题组织的诗词库，含注解与赏析',
    isPublic: false,
    isActive: true,
    chunkMaxSize: 500,
    chunkOverlapSize: 50,
    chunkMinSize: 120,
    sourceUrl: '',
    sourceMaxPages: 0,
    createdAt: '2026-08-03 09:12',
    updatedAt: '2026-10-19 11:38',
  },
  {
    id: 'kb-3',
    name: '教务通知归档',
    description: '近三年教务发文，供问答检索',
    isPublic: true,
    isActive: false,
    chunkMaxSize: 1000,
    chunkOverlapSize: 100,
    chunkMinSize: 300,
    sourceUrl: 'https://jwc.example.edu.cn',
    sourceMaxPages: 24,
    createdAt: '2026-06-20 14:00',
    updatedAt: '2026-09-02 08:15',
  },
]

/** 文档列表（含完成 / 解析中 / 失败三类状态） */
export const MOCK_FILES: MockFile[] = [
  {
    id: 'f-1',
    kbId: 'kb-1',
    displayName: '第一回 宴桃园豪杰三结义.md',
    relativePath: '正文/',
    fileSize: 48211,
    fileExtension: 'md',
    processingStatus: 'completed',
    progressPercentage: 100,
    currentStep: null,
    errorMessage: null,
    totalChunks: 42,
    totalTokens: 12840,
    uploadedAt: '2026-10-02 09:30',
    processedAt: '2026-10-02 09:34',
  },
  {
    id: 'f-2',
    kbId: 'kb-1',
    displayName: '人物关系图谱说明.pdf',
    relativePath: '教研/',
    fileSize: 1820440,
    fileExtension: 'pdf',
    processingStatus: 'completed',
    progressPercentage: 100,
    currentStep: null,
    errorMessage: null,
    totalChunks: 118,
    totalTokens: 46210,
    uploadedAt: '2026-10-05 15:12',
    processedAt: '2026-10-05 15:21',
  },
  {
    id: 'f-3',
    kbId: 'kb-1',
    displayName: '期中试卷 · 文言文阅读.docx',
    relativePath: '试题/',
    fileSize: 302818,
    fileExtension: 'docx',
    processingStatus: 'processing',
    progressPercentage: 62,
    currentStep: '向量化 74/120',
    errorMessage: null,
    totalChunks: 0,
    totalTokens: 0,
    uploadedAt: '2026-10-21 15:58',
    processedAt: null,
  },
  {
    id: 'f-4',
    kbId: 'kb-1',
    displayName: '整本书阅读任务单.pdf',
    relativePath: '教研/',
    fileSize: 921600,
    fileExtension: 'pdf',
    processingStatus: 'failed',
    progressPercentage: 18,
    currentStep: null,
    errorMessage: 'PDF 为扫描件且未开启 OCR，未能提取任何文本层',
    totalChunks: 0,
    totalTokens: 0,
    uploadedAt: '2026-10-20 10:02',
    processedAt: null,
  },
  {
    id: 'f-5',
    kbId: 'kb-1',
    displayName: '考点整理 · 战役与计谋.md',
    relativePath: '教研/',
    fileSize: 21430,
    fileExtension: 'md',
    processingStatus: 'completed',
    progressPercentage: 100,
    currentStep: null,
    errorMessage: null,
    totalChunks: 21,
    totalTokens: 6020,
    uploadedAt: '2026-10-12 11:05',
    processedAt: '2026-10-12 11:06',
  },
  {
    id: 'f-6',
    kbId: 'kb-1',
    displayName: '教参 · 作者与成书背景.txt',
    relativePath: '',
    fileSize: 8120,
    fileExtension: 'txt',
    processingStatus: 'queued',
    progressPercentage: 0,
    currentStep: '等待调度',
    errorMessage: null,
    totalChunks: 0,
    totalTokens: 0,
    uploadedAt: '2026-10-21 16:02',
    processedAt: null,
  },
]

/** 实体（degree 用于节点大小与「关联最多」排序） */
export const MOCK_ENTITIES: MockEntity[] = [
  { id: 'e-1', text: '诸葛亮', type: 'person', degree: 18 },
  { id: 'e-2', text: '刘备', type: 'person', degree: 14 },
  { id: 'e-3', text: '曹操', type: 'person', degree: 12 },
  { id: 'e-4', text: '赤壁之战', type: 'event', degree: 9 },
  { id: 'e-5', text: '三顾茅庐', type: 'event', degree: 7 },
  { id: 'e-6', text: '蜀汉', type: 'organization', degree: 6 },
  { id: 'e-7', text: '草船借箭', type: 'event', degree: 5 },
  { id: 'e-8', text: '荆州', type: 'place', degree: 5 },
  { id: 'e-9', text: '义', type: 'concept', degree: 4 },
  { id: 'e-10', text: '三国演义', type: 'work', degree: 4 },
]

/** 关系 */
export const MOCK_RELATIONS: MockRelation[] = [
  { from: 'e-2', to: 'e-1', text: '三顾茅庐' },
  { from: 'e-1', to: 'e-4', text: '参与' },
  { from: 'e-3', to: 'e-4', text: '败于' },
  { from: 'e-2', to: 'e-6', text: '建立' },
  { from: 'e-1', to: 'e-6', text: '辅佐' },
  { from: 'e-1', to: 'e-7', text: '实施' },
  { from: 'e-6', to: 'e-8', text: '据守' },
  { from: 'e-10', to: 'e-9', text: '主题' },
]

/** 问答记录 */
export const MOCK_TURNS: MockTurn[] = [
  {
    id: 1,
    question: '赤壁之战中曹操失败的主要原因是什么？',
    answer:
      '从本库文档看，原因可归为三层：\n\n1. **水战劣势**：曹军多为北方士卒，不习水战，连环船虽缓解晕船却丧失机动性。\n2. **火攻与风向**：东南风起，黄盖诈降纵火，连环船首尾相接无法拆解。\n3. **疫病与补给**：军中疫病流行，长途补给线拉长，士气与战力同时下滑。\n\n教材《考点整理 · 战役与计谋》把第一条列为主要考点，讲义强调第二、三条为「次要但常考」。',
    citations: [
      { index: 1, fileName: '考点整理 · 战役与计谋.md', score: 0.91, snippet: '东南风急，因风纵火，船皆连缀，不能进退……' },
      { index: 2, fileName: '人物关系图谱说明.pdf', score: 0.78, snippet: '曹操与赤壁之战为「败于」关系，权重高于其余战役……' },
    ],
    elapsed: 1840,
  },
]
