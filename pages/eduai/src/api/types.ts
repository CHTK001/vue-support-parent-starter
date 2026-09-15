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
  questionCreateTime?: string;
  questionUpdateTime?: string;
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
  children?: KnowledgePoint[];
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