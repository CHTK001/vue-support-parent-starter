/**
 * 教育 AI HTTP 客户端。
 *
 * 复用 @repo/core 的 http() 实例（由 createApp 注入，含加密/拦截器）。
 * 返回的 Promise 直接 resolve 到 data 字段（业务负载）。
 */
import { http, unwrapResult } from "@repo/utils";
import type {
  PageResult,
  Question,
  QuestionGradeDimension,
  Paper,
  MarkingSubmitRequest,
  MarkingResultVO,
  MarkingAdjust,
  KnowledgePoint,
  KnowledgePointUploadResult,
  KnowledgeCard,
  KnowledgeFileItem,
  KnowledgeDoc,
  WrongQuestion,
  Exam,
  FunConfig,
  Idiom,
  IdiomGameData,
  Insect,
  InsectGameData,
  InsectOrderCount,
  InsectLibraryItem,
  InsectStageView,
  InsectGuideView,
  CollectTask,
  CollectTaskForm,
  CollectLog,
  CollectMeta,
  CollectTriggerResult,
  CollectScriptSample,
  CollectDbTable,
  EduSubject,
  EduGrade,
  GradeLevelOption,
} from "./types";

/** 解包 { code, msg, data }（兼容 AxiosResponse 双层包装）为业务负载 */
function unwrap<T>(r: unknown): T {
  return unwrapResult<T>(r);
}

/**
 * 教育 AI API 客户端（题库/组卷/阅卷/知识库/错题/考试 全模块）
 * @author CH
 * @since 4.0.0
 */
export const eduaiApi = {
  // 题库
  pageQuestions: (params: { pageNum?: number; pageSize?: number; subject?: string; gradeLevel?: string; grade?: string; type?: string; difficulty?: number; status?: number }) =>
    http()
      .get("/v2/edu/question/page")
      .query(params)
      .then<PageResult<Question>>(unwrap),
  getQuestion: (id: number) =>
    http()
      .get(`/v2/edu/question/${id}`)
      .then<Question>(unwrap),
  questionGradeDimensions: (params: { status?: number } = {}) =>
    http()
      .get("/v2/edu/question/grade-dimensions")
      .query(params)
      .then<QuestionGradeDimension[]>(unwrap),
  saveQuestion: (data: Partial<Question>) =>
    http()
      .post("/v2/edu/question/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  importQuestions: (list: Partial<Question>[]) =>
    http()
      .post("/v2/edu/question/import")
      .data(list as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteQuestion: (id: number) =>
    http()
      .delete(`/v2/edu/question/${id}`)
      .then<boolean>(unwrap),

  // 组卷
  pagePapers: (params: { pageNum?: number; pageSize?: number; subject?: string; gradeLevel?: string; status?: number }) =>
    http()
      .get("/v2/edu/paper/page")
      .query(params)
      .then<PageResult<Paper>>(unwrap),
  getPaper: (id: number) =>
    http()
      .get(`/v2/edu/paper/${id}`)
      .then<Paper>(unwrap),
  generatePaper: (data: any) =>
    http()
      .post("/v2/edu/paper/generate")
      .data(data as Record<string, unknown>)
      .then<number>(unwrap),
  replacePaperQuestion: (paperId: number, oldId: number, newId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/replace`)
      .query({ oldId, newId })
      .then<boolean>(unwrap),

  // 阅卷
  submitMarking: (data: MarkingSubmitRequest) =>
    http()
      .post("/v2/edu/marking/submit")
      .data(data as unknown as Record<string, unknown>)
      .then<string>(unwrap),
  getMarkingResult: (taskId: string) =>
    http()
      .get(`/v2/edu/marking/result/${taskId}`)
      .then<MarkingResultVO>(unwrap),
  confirmMarking: (data: { taskId: string; adjustments: MarkingAdjust[] }) =>
    http()
      .put("/v2/edu/marking/confirm")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),

  // 知识点
  treeKnowledge: (params: { subject?: string; gradeLevel?: string; grade?: string } = {}) =>
    http()
      .get("/v2/edu/knowledge-point/tree")
      .query(params)
      .then<KnowledgePoint[]>(unwrap),
  /** 关键字扁平检索（题目知识点远程多选用） */
  listKnowledge: (params: { keyword?: string; subject?: string; limit?: number } = {}) =>
    http()
      .get("/v2/edu/knowledge-point/list")
      .query(params)
      .then<KnowledgePoint[]>(unwrap),
  /** 知识卡片扁平列表（含正文标记与附件计数） */
  listKnowledgeCards: (params: { keyword?: string; subject?: string; gradeLevel?: string; grade?: string } = {}) =>
    http()
      .get("/v2/edu/knowledge-point/cards")
      .query(params)
      .then<KnowledgeCard[]>(unwrap),
  /** 卡片详情（含富文本正文） */
  getKnowledgePoint: (id: number) =>
    http()
      .get(`/v2/edu/knowledge-point/${id}`)
      .then<KnowledgePoint>(unwrap),
  /** 卡片下附件条目列表 */
  listKnowledgeFiles: (knowledgePointId: number) =>
    http()
      .get(`/v2/edu/knowledge-point/${knowledgePointId}/files`)
      .then<KnowledgeFileItem[]>(unwrap),
  /** 把已上传附件绑定到卡片 */
  bindKnowledgeFile: (data: {
    knowledgePointId: number;
    knowledgeFileName?: string;
    knowledgeFilePath?: string;
    knowledgeFileType?: string;
    knowledgeFileSize?: number;
  }) =>
    http()
      .post("/v2/edu/knowledge-point/file/bind")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 删除卡片附件条目（逻辑删除） */
  deleteKnowledgeFile: (id: number) =>
    http()
      .delete(`/v2/edu/knowledge-point/file/${id}`)
      .then<boolean>(unwrap),
  saveKnowledgePoint: (data: Partial<KnowledgePoint>) =>
    http()
      .post("/v2/edu/knowledge-point/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteKnowledgePoint: (id: number) =>
    http()
      .delete(`/v2/edu/knowledge-point/${id}`)
      .then<boolean>(unwrap),
  /** 上传知识点附件（图片/PDF/DOCX），返回相对路径供 save 绑定 */
  uploadKnowledgeFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http()
      .post("/v2/edu/knowledge-point/upload")
      .data(form)
      .then<KnowledgePointUploadResult>(unwrap);
  },
  /** 附件直链预览地址（后端已 whitelist，img/iframe 可直接带 path 访问） */
  knowledgeFileUrl: (path?: string) =>
    path ? `/v2/edu/knowledge-point/file?path=${encodeURIComponent(path)}` : "",

  // 知识库文档
  pageDocs: (params: { page?: number; pageSize?: number; knowledgeDocName?: string; knowledgeDocSubject?: string; knowledgeDocStatus?: number } = {}) =>
    http()
      .get("/v2/edu/knowledge-doc/page")
      .query(params)
      .then<PageResult<KnowledgeDoc>>(unwrap),
  uploadDoc: (data: Partial<KnowledgeDoc> & { filePath?: string; fileSize?: number }) =>
    http()
      .post("/v2/edu/knowledge-doc/upload")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  searchDocs: (params: { keyword: string; subject?: string; limit?: number }) =>
    http()
      .get("/v2/edu/knowledge-doc/search")
      .query(params)
      .then<PageResult<KnowledgeDoc>>(unwrap),
  deleteDoc: (id: number) =>
    http()
      .delete(`/v2/edu/knowledge-doc/${id}`)
      .then<boolean>(unwrap),

  // 错题
  listWrongQuestions: (params: { studentId?: string; subject?: string; masteryLevel?: number; pageNum?: number; pageSize?: number } = {}) =>
    http()
      .get("/v2/edu/wrongbook/page")
      .query(params)
      .then<PageResult<WrongQuestion>>(unwrap),
  reviewWrongbook: (data: { studentId?: string; count?: number; subject?: string }) =>
    http()
      .post("/v2/edu/wrongbook/review")
      .data(data as Record<string, unknown>)
      .then<number[]>(unwrap),
  updateMastery: (wrongId: number, masteryLevel: number) =>
    http()
      .put("/v2/edu/wrongbook/mastery")
      .query({ wrongId, masteryLevel })
      .then<boolean>(unwrap),

  // 考试
  pageExams: (params: { page?: number; pageSize?: number; examName?: string; examClassId?: string; examStatus?: number } = {}) =>
    http()
      .get("/v2/edu/exam/page")
      .query(params)
      .then<PageResult<Exam>>(unwrap),
  getExam: (id: number) =>
    http()
      .get(`/v2/edu/exam/${id}`)
      .then<Exam>(unwrap),
  createExam: (data: Partial<Exam>) =>
    http()
      .post("/v2/edu/exam/create")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  updateExam: (data: Partial<Exam>) =>
    http()
      .put("/v2/edu/exam/update")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deleteExam: (id: number) =>
    http()
      .delete(`/v2/edu/exam/${id}`)
      .then<boolean>(unwrap),

  // 调试
  aiHealth: () =>
    http()
      .get("/v2/edu/debug/ai-health")
      .then<Record<string, unknown>>(unwrap),
  queueEcho: () =>
    http()
      .get("/v2/edu/debug/queue-echo")
      .then<Record<string, unknown>>(unwrap),
  queueName: () =>
    http()
      .get("/v2/edu/debug/queue-name")
      .then<Record<string, unknown>>(unwrap),

  // 趣味模块配置
  listFunConfigs: () =>
    http()
      .get("/v2/edu/fun/list")
      .then<FunConfig[]>(unwrap),
  listAllFunConfigs: () =>
    http()
      .get("/v2/edu/fun/list-all")
      .then<FunConfig[]>(unwrap),
  getFunConfig: (moduleCode: string) =>
    http()
      .get(`/v2/edu/fun/detail/${moduleCode}`)
      .then<FunConfig>(unwrap),
  toggleFunConfig: (moduleCode: string, enabled: number) =>
    http()
      .put(`/v2/edu/fun/toggle/${moduleCode}`)
      .query({ enabled })
      .then<boolean>(unwrap),
  saveFunConfig: (data: Partial<FunConfig>) =>
    http()
      .post("/v2/edu/fun/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deleteFunConfig: (configId: number) =>
    http()
      .delete(`/v2/edu/fun/delete/${configId}`)
      .then<boolean>(unwrap),

  // 成语游戏
  listIdioms: (params: { gradeLevel?: string; grade?: string; count?: number }) =>
    http()
      .get("/v2/edu/idiom/list")
      .query(params)
      .then<Idiom[]>(unwrap),
  generateIdiomGame: (params: { gradeLevel?: string; grade?: string; count?: number }) =>
    http()
      .get("/v2/edu/idiom/game/generate")
      .query(params)
      .then<IdiomGameData>(unwrap),
  validateIdiomPair: (data: { idiomId: number; pinyin: string; meaning: string }) =>
    http()
      .post("/v2/edu/idiom/game/validate")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  getIdiomDetail: (idiomId: number) =>
    http()
      .get(`/v2/edu/idiom/detail/${idiomId}`)
      .then<Idiom>(unwrap),
  saveIdiom: (data: Partial<Idiom>) =>
    http()
      .post("/v2/edu/idiom/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deleteIdiom: (idiomId: number) =>
    http()
      .delete(`/v2/edu/idiom/delete/${idiomId}`)
      .then<boolean>(unwrap),

  // 昆虫图鉴（后端 EduInsectController；数据源自开源项目 insect-world，63 种 / 14 个目）
  insectLibrary: () =>
    http()
      .get("/v2/edu/insect/all")
      .then<InsectLibraryItem[]>(unwrap),
  insectStage: (insectCode: string) =>
    http()
      .get("/v2/edu/insect/stage")
      .query({ insectCode })
      .then<InsectStageView>(unwrap),
  insectGuide: (insectCode: string) =>
    http()
      .get(`/v2/edu/insect/guide/${insectCode}`)
      .then<InsectGuideView>(unwrap),
  listInsects: (params: { order?: string; metamorphosis?: string; maxDifficulty?: number; count?: number }) =>
    http()
      .get("/v2/edu/insect/list")
      .query(params)
      .then<Insect[]>(unwrap),
  insectOrders: () =>
    http()
      .get("/v2/edu/insect/orders")
      .then<InsectOrderCount[]>(unwrap),
  generateInsectGame: (params: { order?: string; metamorphosis?: string; maxDifficulty?: number; count?: number }) =>
    http()
      .get("/v2/edu/insect/game/generate")
      .query(params)
      .then<InsectGameData>(unwrap),
  validateInsectPair: (data: { insectId: number; latin: string }) =>
    http()
      .post("/v2/edu/insect/game/validate")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  getInsectDetail: (insectId: number) =>
    http()
      .get(`/v2/edu/insect/detail/${insectId}`)
      .then<Insect>(unwrap),
  saveInsect: (data: Partial<Insect>) =>
    http()
      .post("/v2/edu/insect/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deleteInsect: (insectId: number) =>
    http()
      .delete(`/v2/edu/insect/delete/${insectId}`)
      .then<boolean>(unwrap),

  // 题库采集 —— 任务 CRUD / 手动触发 / 日志 / 元数据（后端 EduCollectController，调度态落在 sys_job）
  pageCollectTasks: (params: { pageNum?: number; pageSize?: number; taskName?: string; sourceType?: string; subject?: string; status?: number }) =>
    http()
      .get("/v2/edu/collect/task/page")
      .query(params)
      .then<PageResult<CollectTask>>(unwrap),
  saveCollectTask: (data: CollectTaskForm) =>
    http()
      .post("/v2/edu/collect/task/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteCollectTask: (id: number) =>
    http()
      .delete(`/v2/edu/collect/task/${id}`)
      .then<boolean>(unwrap),
  changeCollectTaskStatus: (id: number, status: number) =>
    http()
      .put("/v2/edu/collect/task/status")
      .query({ id, status })
      .then<boolean>(unwrap),
  triggerCollectTask: (id: number) =>
    http()
      .post(`/v2/edu/collect/task/trigger/${id}`)
      .timeout(300000)
      .then<CollectTriggerResult>(unwrap),
  pageCollectLogs: (params: { taskId?: number; pageNum?: number; pageSize?: number }) =>
    http()
      .get("/v2/edu/collect/log/page")
      .query(params)
      .then<PageResult<CollectLog>>(unwrap),
  collectMeta: () =>
    http()
      .get("/v2/edu/collect/meta")
      .then<CollectMeta>(unwrap),
  collectSourceTypes: () =>
    http()
      .get("/v2/edu/collect/source-types")
      .then<string[]>(unwrap),
  collectScriptSamples: () =>
    http()
      .get("/v2/edu/collect/script-samples")
      .then<CollectScriptSample[]>(unwrap),
  /** 数据表入库：可写表元数据（表名/列/建议唯一键） */
  collectDbTables: () =>
    http()
      .get("/v2/edu/collect/db-tables")
      .then<CollectDbTable[]>(unwrap),
  /** 数据表入库：三方 JSON 字段预览 */
  collectDbPreview: (params: { url: string; dataPath?: string; limit?: number }) =>
    http()
      .get("/v2/edu/collect/db-preview")
      .query(params)
      .then<Record<string, unknown>[]>(unwrap),
  /** 前置处理器试跑：按 JSONPath/Groovy 输出「一行一个」的行集合（大词库下载较慢，放宽超时） */
  collectPreviewRows: (params: { url: string; mode?: string; expr?: string; script?: string; mapping?: string; limit?: number }) =>
    http()
      .get("/v2/edu/collect/preview-rows")
      .query(params)
      .timeout(120000)
      .then<Record<string, unknown>[]>(unwrap),

  // 维度数据（学科 / 学段 / 年级）
  listSubjects: (gradeLevel?: string) =>
    http()
      .get("/v2/edu/dimension/subjects")
      .query({ gradeLevel })
      .then<EduSubject[]>(unwrap),
  saveSubject: (data: Partial<EduSubject>) =>
    http()
      .post("/v2/edu/dimension/subjects/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteSubject: (id: number) =>
    http()
      .delete(`/v2/edu/dimension/subjects/${id}`)
      .then<boolean>(unwrap),
  listGrades: (gradeLevel?: string) =>
    http()
      .get("/v2/edu/dimension/grades")
      .query({ gradeLevel })
      .then<EduGrade[]>(unwrap),
  saveGrade: (data: Partial<EduGrade>) =>
    http()
      .post("/v2/edu/dimension/grades/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteGrade: (id: number) =>
    http()
      .delete(`/v2/edu/dimension/grades/${id}`)
      .then<boolean>(unwrap),
  dimensionDropdown: () =>
    http()
      .get("/v2/edu/dimension/dropdown")
      .then<{ gradeLevels: GradeLevelOption[]; subjects: EduSubject[]; grades: EduGrade[] }>(unwrap),
};

export default eduaiApi;
