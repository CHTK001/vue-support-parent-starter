/**
 * 教育 AI 领域类型定义。
 */

/** 分页响应（与后端 PageResult 对齐） */
export interface PageResult<T> {
  pageNo: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: T[];
  records?: T[];
}

/** 题目 */
export interface Question {
  questionId: number;
  questionType: string;
  questionSubject: string;
  questionGradeLevel: string;
  questionGrade: string;
  questionYear?: string;
  questionDifficulty?: number;
  /** 总分（单题分值） */
  questionScore?: number;
  questionKnowledgePointIds?: string;
  questionStem: string;
  questionStemImages?: string;
  questionOptions?: string;
  questionAnswer: string;
  questionAnalysis?: string;
  questionSource?: string;
  questionSourceType?: string;
  questionAuditStatus?: number;
  questionUseCount?: number;
  questionCorrectRate?: number;
  questionStatus?: number;
  /** 创建时间（后端实体来自 SysBase.createTime） */
  createTime?: string;
  /** 更新时间（后端实体来自 SysBase.updateTime） */
  updateTime?: string;
  questionCreateTime?: string;
  questionUpdateTime?: string;
}

/** 题库中真实存在的"学段 + 年级"组合，对应后端 QuestionGradeDimensionVO */
export interface QuestionGradeDimension {
  gradeLevel: string | null;
  grade: string | null;
  questionCount: number;
}

/** 试卷详情内的题目（后端 QuestionVO 短字段名） */
export interface PaperQuestionItem {
  id: number;
  type: string;
  stem: string;
  options?: string;
  answer: string;
  analysis?: string;
  score?: number;
}

/** 试卷 */
export interface Paper {
  paperId: number;
  paperName: string;
  paperSubject: string;
  paperGradeLevel: string;
  paperGrade: string;
  paperTotalScore?: number;
  paperDuration?: number;
  paperQuestionCount?: number;
  paperStatus?: number;
  paperSource?: string;
  paperCreateTime?: string;
  questions?: PaperQuestionItem[];
}

/** 答题卡 */
export interface AnswerSheetItem {
  questionId: number;
  answer: string;
}

/** 提交答题卡 */
export interface MarkingSubmitRequest {
  examId: number;
  studentId: string;
  content?: string;
  answers: AnswerSheetItem[];
}

/** 阅卷结果 */
export interface MarkingResultVO {
  taskId: string;
  status: number;
  totalScore: number;
  total: number;
  finished: boolean;
  results: Array<{
    resultId: number;
    questionId: number;
    maxScore?: number;
    score: number;
    comment?: string;
    teacherScore?: number;
    teacherComment?: string;
  }>;
}

/** 阅卷确认 */
export interface MarkingAdjust {
  resultId: number;
  score: number;
  comment?: string;
}

/** 知识点 */
export interface KnowledgePoint {
  knowledgePointId: number;
  knowledgePointName: string;
  knowledgePointCode?: string;
  knowledgePointParentId?: number;
  knowledgePointSubject?: string;
  knowledgePointGradeLevel?: string;
  knowledgePointGrade?: string;
  knowledgePointDescription?: string;
  knowledgePointSortOrder?: number;
  knowledgePointStatus?: number;
  /** 内容类型: TEXT/FILE */
  knowledgePointContentType?: string;
  /** 文本内容（TEXT 类型） */
  knowledgePointContent?: string;
  /** 附件原始文件名 */
  knowledgePointFileName?: string;
  /** 附件存储相对路径（data/knowledge-files 下） */
  knowledgePointFilePath?: string;
  /** 附件扩展名: png/jpg/pdf/docx 等 */
  knowledgePointFileType?: string;
  /** 附件字节数 */
  knowledgePointFileSize?: number;
  children?: KnowledgePoint[];
}

/** 知识点附件上传结果（POST /v2/edu/knowledge-point/upload） */
export interface KnowledgePointUploadResult {
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

/** 知识卡片（扁平列表项，带正文标记与附件计数） */
export interface KnowledgeCard {
  knowledgePointId: number;
  knowledgePointName: string;
  knowledgePointCode?: string;
  knowledgePointParentId?: number;
  knowledgePointSubject?: string;
  knowledgePointGradeLevel?: string;
  knowledgePointGrade?: string;
  knowledgePointDescription?: string;
  knowledgePointSortOrder?: number;
  knowledgePointStatus?: number;
  /** 是否已有富文本正文 */
  hasContent?: boolean;
  /** 有效附件条数 */
  fileCount: number;
  createTime?: string;
}

/** 知识卡片附件条目 */
export interface KnowledgeFileItem {
  knowledgeFileId: number;
  knowledgePointId: number;
  knowledgeFileName?: string;
  knowledgeFilePath?: string;
  knowledgeFileType?: string;
  knowledgeFileSize?: number;
  knowledgeFileSortOrder?: number;
  knowledgeFileStatus?: number;
  createTime?: string;
}

/** 知识库文档 */
export interface KnowledgeDoc {
  knowledgeDocId: number;
  knowledgeDocName: string;
  knowledgeDocType?: string;
  knowledgeDocFilePath?: string;
  knowledgeDocFileSize?: number;
  knowledgeDocVectorStoreId?: string;
  knowledgeDocSubject?: string;
  knowledgeDocGradeLevel?: string;
  knowledgeDocStatus?: number;
  knowledgeDocCreateTime?: string;
}

/** 错题 */
export interface WrongQuestion {
  wrongQuestionId: number;
  wrongQuestionStudentId: string;
  wrongQuestionQuestionId: number;
  wrongQuestionExamId?: number;
  wrongQuestionWrongCount?: number;
  wrongQuestionMasteryLevel?: number;
  wrongQuestionLastWrongTime?: string;
  wrongQuestionReviewCount?: number;
  wrongQuestionStatus?: number;
}

/** 考试 */
export interface Exam {
  examId: number;
  examPaperId: number;
  examName: string;
  examClassId?: string;
  examStartTime?: string;
  examEndTime?: string;
  examDuration?: number;
  examStatus?: number;
}

/** 趣味模块配置 */
export interface FunConfig {
  configId: number;
  moduleCode: string;
  moduleName: string;
  moduleDesc: string;
  moduleIcon: string;
  modulePath: string;
  enabled: number;
  sortOrder: number;
  configJson: string;
  createTime: string;
  updateTime: string;
}

/** 成语 */
export interface Idiom {
  idiomId: number;
  idiomContent: string;
  idiomPinyin: string;
  idiomMeaning: string;
  idiomSource: string;
  idiomExample: string;
  idiomSynonyms: string;
  idiomAntonyms: string;
  idiomDifficulty: number;
  idiomTags: string;
  /** 适用学段列表（保存时同步 edu_idiom_grade，详情接口回填） */
  gradeLevels?: string[];
  /** 适用年级列表（为空表示该学段通用） */
  grades?: string[];
  createTime: string;
  updateTime: string;
}

/** 成语游戏数据 */
export interface IdiomGameData {
  items: IdiomGameItem[];
  distractorPinyin: string[];
  distractorMeanings: string[];
  totalItems: number;
  gradeLevel: string;
  grade: string;
}

/** 成语游戏项目 */
export interface IdiomGameItem {
  idiomId: number;
  content: string;
  pinyin: string;
  meaning: string;
  difficulty: number;
  tags: string;
}

/** 昆虫形态特征项（对应 insect-world 的 facts） */
export interface InsectFact {
  key: string;
  value: string;
  /** 图标语义：size/weight/time/place/food/ability */
  icon: string;
}

/** 昆虫 3D 标注点（对应 insect-world 的 hotspots） */
export interface InsectHotspot {
  id: string;
  label: string;
  note: string;
  /** 3D 模型锚点名 */
  anchor: string;
  /** 配色语义：coral/sage/amber/lavender */
  tone: string;
}

/** 昆虫图鉴条目 */
export interface Insect {
  insectId: number;
  insectCode: string;
  insectName: string;
  insectLatin: string;
  insectEpithet: string;
  /** 所属目 slug，如 coleoptera */
  insectOrder: string;
  insectSummary: string;
  /** 落库为 JSON 文本，详情接口原样返回，需自行 JSON.parse */
  insectFacts: string;
  /** 落库为 JSON 文本，需自行 JSON.parse */
  insectHotspots: string;
  insectEcology: string;
  insectTrivia: string;
  /** complete-完全变态，incomplete-不完全变态 */
  insectMetamorphosis: string;
  /** 落库为 JSON 文本，需自行 JSON.parse */
  insectLifecycle: string;
  insectRange: string;
  insectStatus: string;
  /** 落库为 JSON 文本，需自行 JSON.parse */
  insectRelatives: string;
  /** 主题色 hex */
  insectAccent: string;
  insectDifficulty: number;
  createTime: string;
  updateTime: string;
}

/** 昆虫识图游戏项目：JSON 列已由后端解析成数组，前端直接渲染 */
export interface InsectGameItem {
  insectId: number;
  insectCode: string;
  insectName: string;
  insectLatin: string;
  insectEpithet: string;
  insectOrder: string;
  insectSummary: string;
  insectEcology: string;
  insectTrivia: string;
  insectMetamorphosis: string;
  insectRange: string;
  insectStatus: string;
  insectAccent: string;
  insectDifficulty: number;
  insectFacts: InsectFact[];
  insectHotspots: InsectHotspot[];
  insectLifecycle: string[];
  insectRelatives: string[];
}

/** 昆虫识图游戏数据 */
export interface InsectGameData {
  items: InsectGameItem[];
  totalItems: number;
  order: string;
  metamorphosis: string;
  maxDifficulty: number | null;
}

/** 各目物种数统计行 */
export interface InsectOrderCount {
  order: string;
  speciesCount: number;
}

/** 名录轻量条目（后端 /v2/edu/insect/all，不含大 JSON，够筛选与列表渲染） */
export interface InsectLibraryItem {
  insectId: number;
  insectCode: string;
  insectName: string;
  insectLatin: string;
  insectEpithet: string;
  insectOrder: string;
  insectMetamorphosis: string;
  insectAccent: string;
  /**
   * 复用的 3D 建模标识（slug）。
   *
   * 为空时前端用 insectCode 自己的建模文件；指定后复用该 slug 的模型，
   * 这样新增物种不需要写 three.js 建模代码。
   */
  insectModelCode?: string | null;
  insectDifficulty: number;
}

/** 物种详情（后端 /v2/edu/insect/stage 的 insect 段，JSON 列已解析成数组） */
export interface InsectDetail extends InsectLibraryItem {
  insectSummary: string;
  insectEcology: string;
  insectTrivia: string;
  insectRange: string;
  insectStatus: string;
  insectFacts: InsectFact[];
  insectHotspots: InsectHotspot[];
  insectLifecycle: string[];
  insectRelatives: string[];
}

/** 分步讲解的一步 */
export interface InsectLessonStep {
  title: string;
  body: string;
  /** 对应 3D 模型的部位锚点；为空则不联动镜头 */
  anchor?: string;
}

/** 单选题 */
export interface InsectQuizItem {
  question: string;
  /** 3 个选项 */
  options: string[];
  /** 正确选项下标 */
  answer: number;
  /** 作答后的解释 */
  explain: string;
}

/** 深度讲解与测验（后端 /v2/edu/insect/stage 的 guide 段） */
export interface InsectGuideView {
  insectCode: string;
  lesson: InsectLessonStep[];
  motion: { title: string; body: string };
  quiz: InsectQuizItem[];
  habitat: { title: string; body: string };
}

/** 展台视图：一次请求同时拿到物种详情与讲解测验 */
export interface InsectStageView {
  insect: InsectDetail | null;
  guide: InsectGuideView | null;
}

/** 题库采集任务（列表出参：业务列 + sys_job 调度态） */
export interface CollectTask {
  collectTaskId: number;
  collectTaskName: string;
  collectTaskSourceType: string;
  collectTaskSourceConfig?: string;
  collectTaskSubject?: string;
  collectTaskGradeLevel?: string;
  collectTaskGrade?: string;
  collectTaskDifficulty?: number;
  collectTaskStatus?: number;
  collectTaskRemark?: string;
  collectTaskTotalCount?: number;
  collectTaskLastRunTime?: string;
  collectTaskLastRunStatus?: number;
  collectTaskLastRunCount?: number;
  /** 对应的调度任务键（sys_job 派发标识） */
  jobKey?: string;
  /** 生效 cron（来自 sys_job，空表示未登记调度） */
  cron?: string;
  /** 下次触发时刻（毫秒时间戳） */
  nextFireTime?: number | null;
  /** 最近一次派发时刻（毫秒时间戳） */
  lastFireTime?: number | null;
  /** 本节点是否已注册该任务的执行器 */
  handlerRegistered?: boolean;
  collectTaskCreateTime?: string;
}

/** 采集任务保存入参（只带业务列与 cron，计量列由服务端维护） */
export interface CollectTaskForm {
  collectTaskId?: number;
  collectTaskName: string;
  collectTaskSourceType: string;
  collectTaskSourceConfig?: string;
  collectTaskSubject?: string;
  collectTaskGradeLevel?: string;
  collectTaskGrade?: string;
  collectTaskDifficulty?: number;
  collectTaskStatus?: number;
  collectTaskRemark?: string;
  cron?: string;
}

/** 采集：可入库的数据表元数据（数据表入库来源用） */
export interface CollectDbTable {
  /** 表名，如 edu_idiom */
  name: string;
  /** 展示名，如 成语库 */
  label: string;
  /** 建议唯一键（多列逗号分隔） */
  uniqueKey?: string;
  /** 列清单 */
  columns: { name: string; type: string }[];
}

/** 采集执行日志 */
export interface CollectLog {
  collectLogId: number;
  collectLogTaskId: number;
  collectLogTaskName?: string;
  collectLogTriggerType?: string;
  collectLogSourceType?: string;
  collectLogStatus?: number;
  collectLogQuestionCount?: number;
  collectLogErrorMsg?: string;
  collectLogStartTime?: string;
  collectLogEndTime?: string;
}

/** 手动触发采集结果 */
export interface CollectTriggerResult {
  status: string;
  message: string;
}

/** 采集页元数据（服务器时刻用于倒计时纠偏） */
export interface CollectMeta {
  serverTime: number;
  defaultCron: string;
}

/** 内置 Groovy 采集脚本样例 */
export interface CollectScriptSample {
  code: string;
  name: string;
  subject?: string;
  description?: string;
  configHint?: string;
  content: string;
}

/** 学科维度（EduSubject） */
export interface EduSubject {
  subjectId?: number;
  subjectCode: string;
  subjectName: string;
  /** 适用学段，逗号分隔 PRIMARY/JUNIOR/SENIOR/UNIVERSITY */
  subjectGradeLevels?: string;
  subjectSortOrder?: number;
  /** 0 停用 / 1 启用 */
  subjectStatus?: number;
  /** 图标 key */
  subjectIcon?: string;
  /** 主题色 hex */
  subjectColor?: string;
  createTime?: string;
  updateTime?: string;
}

/** 年级维度（EduGrade） */
export interface EduGrade {
  gradeId?: number;
  gradeLevel: string;
  gradeName: string;
  gradeOrder?: number;
  createTime?: string;
}

/** 学段下拉项（系统内置枚举，只读） */
export interface GradeLevelOption {
  value: string;
  label: string;
}