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
  /** 驳回理由（驳回必填，通过时清空） */
  questionAuditRemark?: string;
  /** 累计审核次数（每次通过/驳回 +1） */
  questionAuditCount?: number;
  /**
   * 保存并审核（仅新建、仅管理员）：走服务端 auditOnSave 通道，新建即通过。
   * 只用于 save 入参，不落库、不回显。
   */
  auditOnSave?: boolean;
  questionUseCount?: number;
  /** 被新加入试卷的次数（改分、重复提交不重复计）；由组卷保存时 +1 */
  questionAddCount?: number;
  questionCorrectRate?: number;
  questionStatus?: number;
  /** 创建时间（后端实体来自 SysBase.createTime） */
  createTime?: string;
  /** 更新时间（后端实体来自 SysBase.updateTime） */
  updateTime?: string;
  questionCreateTime?: string;
  questionUpdateTime?: string;
}

/**
 * 题库市场列表项
 *
 * 与既有 {@link Question} 中市场列表实际使用的字段一致（edu_question 实体字段），
 * 供题库市场弹框（QuestionMarketDialog）与购物车（usePaperCart）共用。
 */
export interface MarketQuestion {
  questionId: number;
  questionType: string;
  questionSubject: string;
  questionGradeLevel: string;
  questionGrade: string;
  questionDifficulty?: number;
  /** 总分（单题分值） */
  questionScore?: number;
  questionStem: string;
  questionOptions?: string;
  questionAnswer?: string;
  questionAnalysis?: string;
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
  /** 题项编号（二维码内容）；注意字段名是 questionNo，不是 paperQuestionNo */
  questionNo?: string;
  /** 试卷内顺序（1 起） */
  order?: number;
  /** 题组 / 大题标识 */
  section?: string;
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
  /** 试卷整体难度 1-5 */
  paperDifficulty?: number;
  /** 纸张规格: A4 / A3 / A5 / B5 / LETTER */
  paperPageSize?: string;
  /** 纸张方向: PORTRAIT / LANDSCAPE */
  paperPageOrientation?: string;
  /** 首页大标题风格: classic / modern / simple / exam */
  paperTitleStyle?: string;
  /** 页头（富文本） */
  paperHeader?: string;
  /** 页脚（富文本） */
  paperFooter?: string;
  /** 引用的组卷模板ID */
  paperTemplateId?: number;
  questions?: PaperQuestionItem[];
}

/**
 * 手动组卷 / 编辑试卷的保存载荷（创建与更新共用）。
 *
 * <p>字段名必须与后端 {@code PaperComposeUpdateDTO} 的 record 组件名逐字一致。
 * 该 DTO 未开启未知属性失败，多写或写错字段名会被 Jackson 静默丢弃 ——
 * 曾因此把 {@code totalScore} 写成 {@code paperTotalScore}，表现为「保存成功但满分没变」。</p>
 */
export interface PaperComposePayload {
  /** 试卷名称 */
  name?: string;
  /** 学科 */
  subject?: string;
  /** 学段 PRIMARY / JUNIOR / SENIOR / UNIVERSITY（服务端归一化为中文名） */
  gradeLevel?: string;
  /** 年级 */
  grade?: string;
  /** 考试时长（分钟） */
  duration?: number;
  /** 纸张规格: A4 / A3 / A5 / B5 / LETTER */
  pageSize?: string;
  /** 纸张方向: PORTRAIT / LANDSCAPE */
  pageOrientation?: string;
  /** 首页模板标识 */
  template?: string;
  /** 首页大标题风格: default / line / double / calligraphy */
  titleStyle?: string;
  /** 页头（富文本）；传空字符串表示清空 */
  header?: string;
  /** 页脚（富文本）；传空字符串表示清空 */
  footer?: string;
  /** 学科/学段是否锁定: 0-否 1-是 */
  subjectLocked?: number;
  /** 试卷整体难度 1-5 */
  difficulty?: number;
  /** 引用的组卷模板ID */
  templateId?: number;
  /** 试卷满分（目标总分）；为空时新建卷按默认 100 */
  totalScore?: number;
}

/** 手动组卷：加入试卷的题目条目（POST /v2/edu/paper/{paperId}/questions） */
/** 班级试卷布置（布置记录 + 试卷摘要），老师端与学生端共用同一视图 */
export interface PaperAssignVO {
  assignId: number;
  paperId: number;
  paperNo?: string | null;
  paperName?: string | null;
  paperSubject?: string | null;
  paperGradeLevel?: string | null;
  paperGrade?: string | null;
  paperTotalScore?: number | null;
  paperQuestionCount?: number | null;
  paperDuration?: number | null;
  classId: number;
  className?: string | null;
  teacherAccount?: string | null;
  assignStatus?: number | null;
  assignRemark?: string | null;
  assignTime?: string | null;
}

export interface PaperQuestionAddItem {
  /** 题目标识 */
  questionId: number;
  /** 题目分值；不传按试卷总分均分 */
  score?: number;
  /** 题目顺序（从 1 开始）；不传按追加顺序 */
  order?: number;
}

/** 试卷修改历史（列表与详情同形，详情多返回快照） */
export interface PaperHistoryItem {
  /** 历史记录标识 */
  historyId: number;
  /** 所属试卷标识 */
  paperId: number;
  /** 操作类型：CREATE / ADD_QUESTION / REMOVE_QUESTION / SORT / EVEN_SCORES / UPDATE / PUBLISH */
  operateType?: string;
  /** 操作说明（后端生成的可读文案） */
  operateDesc?: string;
  /** 操作人账号 */
  operator?: string;
  /** 操作时间 */
  createTime?: string;
  /** 试卷快照（历史详情返回，JSON 文本） */
  snapshot?: string;
}

/** 扫码识卷：二维码短码解析出的试卷信息 */
export interface PaperQuestionQr {
  /** 二维码内容 / 短码 */
  no: string;
  /** 试卷标识 */
  paperId: number;
  /** 试卷名称 */
  paperName: string;
  /** 学科 */
  paperSubject?: string;
  /** 学段 */
  paperGradeLevel?: string;
  /** 年级 */
  paperGrade?: string;
}

/** 试卷模板（edu_paper_template；GET/POST/PUT/DELETE /v2/edu/paper-template） */
export interface PaperTemplate {
  templateId?: number;
  templateName: string;
  /** 版式：classic/modern/simple/exam */
  templateStyle: string;
  templateHeader?: string;
  templateFooter?: string;
  templatePageSize?: string;
  templateOrientation?: string;
  templateStatus?: number;
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
  /** 适用学段 PRIMARY/JUNIOR/SENIOR；null 表示各学段通用（管理端模块） */
  funConfigGradeLevel?: string | null;
  moduleName: string;
  moduleDesc: string;
  /** 学生端卡片副标题 */
  funConfigSubtitle?: string | null;
  moduleIcon: string;
  modulePath: string;
  /** 学生端卡片图标渐变起始色 */
  funConfigColor?: string | null;
  /** 学生端卡片图标渐变结束色 */
  funConfigColorTo?: string | null;
  /** 是否显示未完成角标：0/1 */
  funConfigShowBadge?: number | null;
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
  /**
   * 取材范围：
   * - `level` 全部按学段取材
   * - `mixed` 本学段成语不够，已用全库补齐
   * - `all` 本学段无成语，整盘来自全库
   */
  scope?: "level" | "mixed" | "all" | string;
}

/** 成语接龙：起始题目（GET /v2/edu/idiom/chain/start） */
export interface IdiomChainStart {
  start: { idiomId?: number; content: string; pinyin?: string | null; meaning?: string | null };
  /** 期望步数 */
  length: number;
  /**
   * 出题取材范围：
   * - `level`：按请求的学段取材
   * - `all`：本学段没有可接续的成语，已回落全库（前端需要给出说明）
   */
  scope?: "level" | "all" | string;
  /** 规则说明 */
  rule?: string;
}

/** 成语接龙：一步校验结果（POST /v2/edu/idiom/chain/validate） */
export interface IdiomChainStep {
  ok: boolean;
  message?: string;
  content?: string;
  /** 接上后的末字 */
  next?: string;
  pinyin?: string | null;
  meaning?: string | null;
}

/** 成语接龙：提示（GET /v2/edu/idiom/chain/hint） */
export interface IdiomChainHint {
  ok: boolean;
  content?: string;
  pinyin?: string | null;
  meaning?: string | null;
}

/**
 * 汉字基础数据（字 / 读音 / 笔画 / 部首 / 结构 / 笔顺 / 释义 / 字画 / 学段）。
 *
 * 对应后端 {@code edu_hanzi} 表；唯一键是 hanziChar（一个字一条）。
 */
export interface EduHanzi {
  hanziId?: number;
  /** 汉字（单个字） */
  hanziChar: string;
  /** 读音（拼音，可带声调） */
  hanziPinyin?: string | null;
  /** 笔画数 */
  hanziStrokes?: number | null;
  /** 部首 */
  hanziRadical?: string | null;
  /** 结构：独体 / 上下 / 左右 / 半包围 / 全包围 */
  hanziStructure?: string | null;
  /** 笔顺（按书写顺序排列的笔画名） */
  hanziStrokeOrder?: string | null;
  /** 释义 / 常用组词 */
  hanziMeaning?: string | null;
  /** 字画（图片路径或字形图） */
  hanziImage?: string | null;
  /** 适用学段：PRIMARY / JUNIOR / SENIOR */
  hanziGradeLevel?: string | null;
  /** 状态：0 停用 / 1 启用 */
  hanziStatus?: number | null;
}

/**
 * 汉字识字练习：一道题。
 *
 * type=pinyin 时选项是读音文本；type=strokes 时选项是笔画数字字符串。
 * 题干同时带上笔顺/部首/结构/释义/字画，答完直接当「学习卡」讲解。
 */
export interface HanziQuestion {
  type: "pinyin" | "strokes" | "order" | "none" | string;
  hanziId?: number;
  /** 汉字（单字） */
  char: string;
  pinyin?: string | null;
  strokes?: number | null;
  radical?: string | null;
  structure?: string | null;
  strokeOrder?: string | null;
  meaning?: string | null;
  image?: string | null;
  /** 正确选项 */
  answer: string;
  /** 选项（含正确项，服务端已打乱） */
  options: string[];
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

/** 古诗 */
export interface Poem {
  poemId: number;
  poemTitle: string;
  poemAuthor: string;
  poemDynasty: string;
  poemContent: string;
  poemTranslation: string;
  poemAppreciation: string;
  poemNotes: string;
  poemTags: string;
  poemDifficulty: number;
  /** 适用学段列表（保存时同步 edu_poem_grade，详情接口回填） */
  gradeLevels?: string[];
  /** 适用年级列表（为空表示该学段通用） */
  grades?: string[];
  createTime: string;
  updateTime: string;
}

/** 古诗游戏数据（补全下句） */
export interface PoemGameData {
  items: PoemGameItem[];
  totalItems: number;
  gradeLevel: string;
  grade: string;
}

/** 古诗游戏题目：给上一句，从 4 个选项里选下一句 */
export interface PoemGameItem {
  poemId: number;
  title: string;
  author: string;
  dynasty: string;
  /** 题干（上一句，末尾带逗号） */
  question: string;
  /** 正确答案（下一句） */
  answer: string;
  options: string[];
  answerIndex: number;
  difficulty: number;
}

/** 古诗文趣味游戏（七种玩法共用的题目载体，按 mode 解释 items 结构） */
export interface PoemChallengeData {
  mode: PoemChallengeMode;
  items: PoemChallengeItem[];
  totalItems: number;
  gradeLevel: string;
  grade: string;
  /** 无法出题时的说明（如朝代不足两种） */
  hint?: string;
}

/** 古诗文趣味游戏玩法标识 */
export type PoemChallengeMode =
  | "order"
  | "feihualing"
  | "title"
  | "author"
  | "dynasty"
  | "theme"
  | "fill";

/** 古诗文趣味游戏单题（字段随 mode 不同而取用不同子集） */
export interface PoemChallengeItem {
  mode: PoemChallengeMode;
  poemId?: number;
  title?: string;
  author?: string;
  dynasty?: string;
  /** order：打乱后的句子 */
  sentences?: string[];
  /** order：正确句序（字符串数组）；四选一：正确答案文本 */
  answer?: string | string[];
  /** 四选一类的题干（title/author/dynasty） */
  question?: string;
  /** 选项：四选一类为字符串数组，飞花令为 {text,hit} 对象数组 */
  options?: Array<string | { text: string; hit: boolean }>;
  /** 四选一类的正确项下标 */
  answerIndex?: number;
  /** feihualing：关键字（单字） */
  keyword?: string;
  /** feihualing：应选中的句数 */
  hitCount?: number;
  /** fill：挖空后的句子 */
  blanked?: string;
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
  /**
   * 复用的 3D 建模标识（slug）；为空表示用自身 insectCode 的建模文件
   */
  insectModelCode?: string | null;
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
  /**
   * 该物种全部标注点锚点（后端 /all 一并带出）。
   *
   * 用于「看同样有某部位的虫」：在名录里直接判断谁有该部位，
   * 不必为 63 个物种各请求一次详情。
   */
  anchors?: string[];
  /**
   * 是否已配深度讲解（后端 /all 一并带出）
   *
   * 维护页据此标出漏配讲解的物种；没有讲解时识图页的「分步讲解/小测验」会禁用。
   */
  hasGuide?: boolean;
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

/**
 * 讲解与测验的保存载荷
 *
 * 与读取端 {@link InsectGuideView} 同形，前端不需要自己序列化 JSON 文本。
 */
export interface InsectGuideSaveRequest {
  /** 物种 slug，必填 */
  insectCode: string;
  /** 分步讲解；可为空数组 */
  lesson: InsectLessonStep[];
  motion: { title: string; body: string };
  /** 单选题；可为空数组 */
  quiz: InsectQuizItem[];
  habitat: { title: string; body: string };
}

/** 学生档案（学生端展示用） */
export interface StudentProfile {
  studentId: number;
  studentNo: string;
  studentName: string;
  /** PRIMARY / JUNIOR / SENIOR */
  gradeLevel: string;
  grade: string;
  classId: number | null;
}

/** 学生端绑定状态；bound=false 时必须先弹绑定表单 */
export interface StudentBindState {
  bound: boolean;
  /** 该账号绑定的是教师档案（登录了学生端但身份是老师） */
  teacherBound?: boolean;
  student?: StudentProfile;
  className?: string | null;
  stage?: string | null;
}

/** 绑定学生档案的请求体 */
export interface StudentBindRequest {
  studentNo?: string;
  studentName?: string;
  gradeLevel?: string;
  grade?: string;
  className?: string;
}

/** 学习统计项（今日 / 本周 / 累计共用同一形状） */
export interface StudyStat {
  studyCount: number;
  studyMinutes: number;
  questionCount: number;
  correctCount: number;
  stars: number;
  points: number;
  /** 正确率百分比，仅 week 段返回 */
  accuracy?: number;
}

/** 模块学习进度 */
export interface ModuleProgress {
  moduleCode: string;
  /** 0-100 */
  progress: number;
  studyMinutes: number | null;
  questionCount: number | null;
  correctCount: number | null;
  lastStudyTime: string | null;
}

/** 学生端首页数据 */
export interface StudentOverview {
  bound: boolean;
  student?: StudentProfile;
  className?: string | null;
  stage?: string | null;
  today?: StudyStat;
  week?: StudyStat;
  total?: StudyStat;
  /** 连续打卡天数 */
  streakDays?: number;
  /** 待复习错题数 */
  wrongPending?: number;
  modules?: ModuleProgress[];
  /** 已攻克（进度 100）的模块数 */
  modulesMastered?: number;
  /** 已开始的模块数 */
  modulesStarted?: number;
  /** 班级排名 */
  classRank?: number;
  /** 班级人数 */
  classSize?: number;
  /** 今日推荐模块编码 */
  recommend?: string | null;
}

/** 学习行为上报请求体 */
export interface StudyReportRequest {
  moduleCode?: string;
  studyMinutes?: number;
  questionCount?: number;
  correctCount?: number;
  stars?: number;
  points?: number;
  progressDelta?: number;
}

/** 教师档案 */
export interface TeacherProfile {
  teacherId: number;
  teacherNo: string;
  teacherName: string;
  subjectCode: string | null;
}

/** 教师端绑定状态 */
export interface TeacherBindState {
  bound: boolean;
  teacher?: TeacherProfile;
}

/** 绑定教师档案的请求体 */
export interface TeacherBindRequest {
  teacherNo: string;
  teacherName?: string;
  subjectCode?: string;
}

/** 教师端班级概览行 */
export interface TeacherClassRow {
  classId: number;
  className: string;
  gradeLevel: string | null;
  grade: string | null;
  studentCount: number;
  /** 已绑定登录账号的学生数 */
  boundCount: number;
}

/** 教师端工作台数据 */
export interface TeacherOverview {
  bound: boolean;
  teacher?: TeacherProfile;
  classes?: TeacherClassRow[];
  classCount?: number;
  studentCount?: number;
}

/** 教师端字典下拉（GET /v2/edu/teacher/dropdown） */
export interface DimensionDropdown {
  gradeLevels: GradeLevelOption[];
  subjects: EduSubject[];
  grades: EduGrade[];
}

/** 教师端阅卷任务（GET /v2/edu/teacher/marking/tasks） */
export interface TeacherMarkingTask {  markingTaskId: number;
  /** 对外业务任务号，查结果用 */
  markingTaskTaskId: string;
  /** 0 待处理 / 1 处理中 / 2 完成 / 3 失败 */
  markingTaskStatus: number;
  /** SELF 自有卷 / ANY 任意卷 */
  markingTaskMode?: string | null;
  markingTaskPaperId?: number | null;
  markingTaskStudentId?: string | null;
  markingTaskStage?: string | null;
  markingTaskTotal?: number | null;
  markingTaskDoneCount?: number | null;
  markingTaskError?: string | null;
  markingTaskStartTime?: string | null;
  markingTaskFinishTime?: string | null;
}

/** 学生端错题卡（带题干/选项/答案，GET /v2/edu/student/wrongbook） */
export interface StudentWrongQuestion {
  wrongQuestionId: number;
  questionId?: number | null;
  questionType?: string | null;
  questionSubject?: string | null;
  questionGradeLevel?: string | null;
  questionGrade?: string | null;
  questionDifficulty?: number | null;
  questionStem?: string | null;
  questionOptions?: string | null;
  questionAnswer?: string | null;
  wrongCount?: number | null;
  /** 0 未掌握 / 1 复习中 / 2 已掌握 */
  masteryLevel?: number | null;
  reviewCount?: number | null;
  lastWrongTime?: string | null;
}

/**
 * 趣味模块配置（edu_fun_config） *
 * 同一张表两用：
 *   - funConfigGradeLevel 为 null → 管理端「趣味中心」的模块开关（原语义）
 *   - 指定学段 → 学生端首页该学段的功能卡（moduleCode 可跨学段重复）
 */
export interface FunModuleConfig {
  configId: number;
  moduleCode: string;
  /** PRIMARY / JUNIOR / SENIOR；null 表示各学段通用（管理端模块） */
  funConfigGradeLevel?: string | null;
  moduleName: string;
  moduleDesc?: string | null;
  /** 学生端卡片副标题 */
  funConfigSubtitle?: string | null;
  moduleIcon?: string | null;
  modulePath?: string | null;
  /** 学生端卡片图标渐变起始色 */
  funConfigColor?: string | null;
  /** 学生端卡片图标渐变结束色 */
  funConfigColorTo?: string | null;
  /** 是否显示未完成角标 */
  funConfigShowBadge?: number | null;
  enabled: number;
  sortOrder: number;
  configJson?: string | null;
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

/**
 * AI 组卷能力探测结果
 *
 * <p>AI 组卷能力依赖后端的 spring-support-ai-starter（需要注册了可用的对话客户端）。
 * 前端用它决定 AI 组卷入口是可用还是禁用：available 为 false 时应禁用入口并把
 * reason 展示给用户，而不是让用户点下去再失败。</p>
 *
 * <p>对应后端 EduAiCapabilityVO。</p>
 */
export interface EduAiCapability {
  /** 是否可用 */
  available: boolean;
  /** 结论说明；不可用时是具体原因 */
  reason: string;
  /** 配置的模型提供商，可能为空 */
  provider?: string | null;
  /** 配置的模型名，可能为空 */
  model?: string | null;
}

/** AI 选题请求（对应后端 QuestionAiSelectDTO） */
export interface QuestionAiSelectPayload {
  subject?: string;
  gradeLevel?: string;
  grade?: string;
  types?: string[];
  knowledgePointIds?: number[];
  count?: number;
}

/**
 * 班级
 *
 * 学生挂在班级下；class_teacher_id 是数字 userId，与登录账号（字符串）不同源，
 * 因此教师绑定走 teacher_account，班级归属走 owner_user_id。
 */
export interface EduClass {
  classId: number;
  classCode: string;
  className: string;
  /** 学段 PRIMARY / JUNIOR / SENIOR */
  classGradeLevel?: string | null;
  classGrade?: string | null;
  classTeacherId?: number | null;
  classStatus?: number | null;
}

/**
 * 学生档案
 *
 * studentAccount 非空表示该学生已用登录账号绑定学生端；
 * 后台新建的学生默认未绑定，学生首次进 /edu/student 时自己绑定。
 */
export interface EduStudent {
  studentId: number;
  studentUserId?: number | null;
  /** 绑定的登录账号；null = 未绑定 */
  studentAccount?: string | null;
  studentNo: string;
  studentName?: string | null;
  studentClassId?: number | null;
  studentGradeLevel?: string | null;
  studentGrade?: string | null;
  studentEnrollYear?: number | null;
  /** 家长手机号：学生端可用它登录（与学号二选一）；同号可带多个孩子，故不唯一 */
  studentParentPhone?: string | null;
  /** 头像：图片 URL 或 Base64 */
  studentAvatar?: string | null;
  /** 身份证号：仅管理端维护，学生端接口不下发 */
  studentIdCard?: string | null;
  /** 0-离校 1-在读 */
  studentStatus?: number | null;
  createTime?: string;
  updateTime?: string;
  /**
   * 登录口令明文：**只提交、不回显**。
   * 后端只返回加盐摘要，从不返回明文，因此编辑态恒为空串；
   * 留空提交表示「本次不修改口令」。
   */
  studentPwdInput?: string;
}

/** 教师档案 */
export interface EduTeacher {
  teacherId: number;
  teacherUserId?: number | null;
  /** 绑定的登录账号；null = 未绑定 */
  teacherAccount?: string | null;
  teacherNo: string;
  teacherName?: string | null;
  teacherSubjectCode?: string | null;
  /** 0-离职 1-在职 */
  teacherStatus?: number | null;
  createTime?: string;
  updateTime?: string;
}