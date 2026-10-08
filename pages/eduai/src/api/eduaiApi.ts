/**
 * 教育 AI HTTP 客户端。
 *
 * 复用 @repo/core 的 http() 实例（由 createApp 注入，含加密/拦截器）。
 * 返回的 Promise 直接 resolve 到 data 字段（业务负载）。
 */
import { http, setAccessToken, unwrapResult } from "@repo/utils";
import type {
  PageResult,
  Question,
  EduAiCapability,
  QuestionAiSelectPayload,
  QuestionGradeDimension,
  QuestionImportResult,
  Paper,
  PaperComposePayload,
  PaperQuestionAddItem,
  PaperHistoryItem,
  PaperQuestionQr,
  PaperTemplate,
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
  IdiomChainStart,
  IdiomChainStep,
  IdiomChainHint,
  EduHanzi,
  HanziQuestion,
  Poem,
  PoemChallengeData,
  PoemChallengeMode,
  PoemGameData,
  Insect,
  InsectGameData,
  InsectOrderCount,
  InsectLibraryItem,
  InsectDetail,
  InsectStageView,
  InsectGuideView,
  InsectGuideSaveRequest,
  StudentBindState,
  StudentBindRequest,
  StudentOverview,
  StudyReportRequest,
  TeacherBindState,
  TeacherBindRequest,
  TeacherOverview,
  FunModuleConfig,
  EduClass,
  EduStudent,
  EduTeacher,
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
  DimensionDropdown,
  TeacherMarkingTask,
  StudentWrongQuestion,
  PaperAssignVO,
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
  pageQuestions: (params: { pageNum?: number; pageSize?: number; subject?: string; gradeLevel?: string; grade?: string; type?: string; difficulty?: number; status?: number; auditStatus?: number; orderBy?: string; orderDir?: "asc" | "desc" }) =>
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
      .then<QuestionImportResult>(unwrap),
  deleteQuestion: (id: number) =>
    http()
      .delete(`/v2/edu/question/${id}`)
      .then<boolean>(unwrap),
  /** 审核单条题目（通过/驳回，仅管理员） */
  auditQuestion: (id: number, passed: boolean, remark?: string) =>
    http()
      .post(`/v2/edu/question/audit/${id}`)
      .query({ passed, ...(remark ? { remark } : {}) })
      .then<boolean>(unwrap),
  /** 批量审核题目（通过/驳回，仅管理员），返回成功条数 */
  auditQuestions: (ids: number[], passed: boolean, remark?: string) =>
    http()
      .post("/v2/edu/question/audit-batch")
      .query({ passed, ...(remark ? { remark } : {}) })
      .data(ids as unknown as Record<string, unknown>)
      .then<number>(unwrap),

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

  /**
   * 探测 AI 组卷能力是否可用
   *
   * <p>AI 组卷依赖后端的 spring-support-ai-starter（需注册了可用的对话客户端）。
   * 不可用时后端会给出具体原因，前端据此禁用入口并展示原因，而不是让用户点下去再失败。</p>
   */
  aiCapability: () =>
    http()
      .get("/v2/edu/ai/capability")
      .then<EduAiCapability>(unwrap),

  /**
   * AI 选题：按条件向 AI 要一批题目，用于往**已存在的试卷**里补题
   *
   * <p>与 `generatePaper` 的区别是不建卷，只返回题目列表。AI 不可用时后端会回退到
   * 规则选题，因此调用前应先用 `aiCapability()` 判断是否展示 AI 入口。</p>
   */
  aiSelectQuestions: (data: QuestionAiSelectPayload) =>
    http()
      .post("/v2/edu/question/ai-select")
      .data(data as Record<string, unknown>)
      .then<Question[]>(unwrap),
  replacePaperQuestion: (paperId: number, oldId: number, newId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/replace`)
      .query({ oldId, newId })
      .then<boolean>(unwrap),

  // 组卷 —— 手动组卷（PaperComposeView 用；草稿 -> 加题 -> 调序/均分 -> 发布）
  /** 新建试卷（草稿），返回试卷 ID */
  createPaper: (data: PaperComposePayload) =>
    http()
      .post("/v2/edu/paper")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 向试卷追加题目（分值/顺序可随条目传入），返回实际写入条数 */
  addPaperQuestions: (paperId: number, items: PaperQuestionAddItem[]) =>
    http()
      .post(`/v2/edu/paper/${paperId}/questions`)
      .data(items as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 从试卷移除某道题（questionId 为题库题目标识） */
  removePaperQuestion: (paperId: number, questionId: number) =>
    http()
      .delete(`/v2/edu/paper/${paperId}/questions/${questionId}`)
      .then<boolean>(unwrap),
  /** 按新顺序重排题目（questionNos 为试卷题唯一编号列表，数组顺序即目标顺序） */
  sortPaperQuestions: (paperId: number, questionNos: string[]) =>
    http()
      .put(`/v2/edu/paper/${paperId}/questions/sort`)
      .data(questionNos as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 按试卷总分均分题目分值 */
  evenPaperScores: (paperId: number) =>
    http()
      .post(`/v2/edu/paper/${paperId}/questions/even`)
      .then<boolean>(unwrap),
  /** 更新试卷基础信息（名称/学科/学段/年级/时长等） */
  updatePaper: (paperId: number, data: PaperComposePayload) =>
    http()
      .put(`/v2/edu/paper/${paperId}`)
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 发布试卷（草稿 -> 已发布） */
  publishPaper: (paperId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/publish`)
      .then<boolean>(unwrap),

  /**
   * 下架试卷（已发布 → 草稿）
   *
   * <p>业务口径「发布=冻结」：已发布的卷要改动必须先下架。下架后学生端不可见，
   * 可以继续编辑，改完再发布。</p>
   */
  unpublishPaper: (paperId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/unpublish`)
      .then<boolean>(unwrap),

  /**
   * 归档试卷（草稿/已发布 → 已归档）
   *
   * <p>归档后只读留档：不可修改、不可再发布，学生端也不可见。</p>
   */
  archivePaper: (paperId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/archive`)
      .then<boolean>(unwrap),
  /** 试卷修改历史列表 */
  getPaperHistory: (paperId: number) =>
    http()
      .get(`/v2/edu/paper/${paperId}/history`)
      .then<PaperHistoryItem[]>(unwrap),
  /** 试卷修改历史详情（含试卷快照） */
  getPaperHistoryDetail: (historyId: number) =>
    http()
      .get(`/v2/edu/paper/history/${historyId}`)
      .then<PaperHistoryItem>(unwrap),
  /** 扫码识卷：按二维码短码取试卷 */
  getPaperByQr: (no: string) =>
    http()
      .get(`/v2/edu/paper/qr/${no}`)
      .then<PaperQuestionQr>(unwrap),

  // 试卷模板（edu_paper_template）
  /** 模板分页列表（PaperView 选模板下拉用） */
  getPaperTemplatePage: (params: { pageNum?: number; pageSize?: number; templateName?: string; templateStyle?: string; templateStatus?: number } = {}) =>
    http()
      .get("/v2/edu/paper-template/page")
      .query(params)
      .then<PageResult<PaperTemplate>>(unwrap),
  /** 模板详情 */
  getPaperTemplate: (id: number) =>
    http()
      .get(`/v2/edu/paper-template/${id}`)
      .then<PaperTemplate>(unwrap),
  /** 新建模板（DataConfigView 保存用），返回模板 ID */
  savePaperTemplate: (data: Partial<PaperTemplate>) =>
    http()
      .post("/v2/edu/paper-template")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 更新模板 */
  updatePaperTemplate: (id: number, data: Partial<PaperTemplate>) =>
    http()
      .put(`/v2/edu/paper-template/${id}`)
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 删除模板 */
  deletePaperTemplate: (id?: number) =>
    http()
      .delete(`/v2/edu/paper-template/${id}`)
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

  /**
   * 获取「与图片同版式」的结构化解析结果。
   *
   * <p>逐页返回版面区域/文字块坐标（已归一化到 0~1）与页尺寸，以及题号锚点与判分明细
   * （含知识点），用于把分数标记/对错/知识点按原图位置叠放。</p>
   *
   * @param taskId 任务标识
   * @returns 结构化数据
   */
  getMarkingStructure: (taskId: string) =>
    http()
      .get(`/v2/edu/marking/structure/${taskId}`)
      .then<Record<string, any>>(unwrap),

  /**
   * 获取答卷原图（同版式展示的打底图）。
   *
   * <p>返回 Blob 而非 JSON：该接口输出 PNG 字节，需要带鉴权头请求后由前端转 objectURL。</p>
   *
   * @param taskId 任务标识
   * @param page   页码（从 1 开始）
   * @returns 图片 Blob
   */
  getSheetImageBlob: (taskId: string, page: number) =>
    http()
      .get(`/v2/edu/marking/image/${taskId}`)
      .query({ page })
      .responseType("blob")
      .then<Blob>((resp: any) => resp.data as Blob),

  /**
   * 扫描试卷图片并阅卷。
   *
   * <p>SELF 自有卷按题号回数据库取准确分值；ANY 任意卷由模型抽取并判定。
   * 表单字段：{@code file} 图片、{@code mode}、{@code paperId}、{@code studentId}、{@code maxScore}。</p>
   *
   * @param form 表单数据
   * @returns 任务 ID，用 getMarkingResult 轮询
   */
  scanMarking: (form: FormData) =>
    http()
      .post("/v2/edu/marking/scan")
      .data(form)
      .then<string>(unwrap),

  /**
   * 阅卷进度 SSE 流地址。
   *
   * <p>拿到 scanMarking 返回的 taskId 后立刻 {@code http().get(url).sse({...})}：
   * 识别 / 解析 / 判分每推进一步都会收到一帧 {@code progress}，终态收到 {@code done}。
   * 不再靠 2s 轮询问结果接口。</p>
   *
   * @param taskId 任务标识
   * @returns SSE 流地址
   */
  markingProgressStreamUrl: (taskId: string) => `/v2/edu/marking/stream/${taskId}`,

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
  /** 成语接龙：服务端自动出题（首尾相接），返回起始成语与步数（不含答案） */
  idiomChainStart: (params: { gradeLevel?: string; grade?: string; length?: number } = {}) =>
    http()
      .get("/v2/edu/idiom/chain/start")
      .query(params)
      .then<IdiomChainStart>(unwrap),
  /** 成语接龙：校验一步（答案由服务端判定，前端拿不到答案） */
  idiomChainValidate: (data: { current: string; answer: string }) =>
    http()
      .post("/v2/edu/idiom/chain/validate")
      .data(data as unknown as Record<string, unknown>)
      .then<IdiomChainStep>(unwrap),
  /** 成语接龙：给当前成语一个提示答案 */
  idiomChainHint: (current: string) =>
    http()
      .get("/v2/edu/idiom/chain/hint")
      .query({ current })
      .then<IdiomChainHint>(unwrap),

  // 汉字基础数据（字 / 读音 / 笔顺 / 字画 / 释义）
  /** 分页查询汉字（关键字匹配 字/拼音/释义） */
  pageHanzi: (params: { keyword?: string; gradeLevel?: string; pageNum?: number; pageSize?: number }) =>
    http()
      .get("/v2/edu/hanzi/page")
      .query(params)
      .then<PageResult<EduHanzi>>(unwrap),
  /** 汉字详情 */
  getHanzi: (id: number) =>
    http()
      .get(`/v2/edu/hanzi/${id}`)
      .then<EduHanzi>(unwrap),
  /** 保存汉字（同一个字重复提交则更新） */
  saveHanzi: (data: Partial<EduHanzi>) =>
    http()
      .post("/v2/edu/hanzi/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 删除汉字 */
  deleteHanzi: (id: number) =>
    http()
      .delete(`/v2/edu/hanzi/${id}`)
      .then<boolean>(unwrap),
  /** 汉字识字练习：服务端自动出题（读音 / 笔画，题目带笔顺与释义） */
  hanziPractice: (params: { gradeLevel?: string; count?: number } = {}) =>
    http()
      .get("/v2/edu/hanzi/practice")
      .query(params)
      .then<HanziQuestion[]>(unwrap),

  // 古诗库与古诗游戏（补全下句）
  listPoems: (params: { gradeLevel?: string; grade?: string; count?: number }) =>
    http()
      .get("/v2/edu/poem/list")
      .query(params)
      .then<Poem[]>(unwrap),
  /** 分页查询古诗（服务端分页：关键字/学段过滤 + 全库 total，替代前端 count=5000 全量拉取） */
  pagePoems: (params: { keyword?: string; gradeLevel?: string; grade?: string; pageNum?: number; pageSize?: number }) =>
    http()
      .get("/v2/edu/poem/page")
      .query(params)
      .then<PageResult<Poem>>(unwrap),
  generatePoemGame: (params: { gradeLevel?: string; grade?: string; count?: number }) =>
    http()
      .get("/v2/edu/poem/game/generate")
      .query(params)
      .then<PoemGameData>(unwrap),
  getPoemDetail: (poemId: number) =>
    http()
      .get(`/v2/edu/poem/detail/${poemId}`)
      .then<Poem>(unwrap),
  savePoem: (data: Partial<Poem>) =>
    http()
      .post("/v2/edu/poem/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deletePoem: (poemId: number) =>
    http()
      .delete(`/v2/edu/poem/delete/${poemId}`)
      .then<boolean>(unwrap),

  // 古诗文趣味游戏（七种玩法，见 EduPoemChallengeController）
  poemChallenge: (
    mode: PoemChallengeMode,
    params: { gradeLevel?: string; grade?: string; keyword?: string; count?: number },
  ) =>
    http()
      .get(`/v2/edu/poem-challenge/${mode}`)
      .query(params)
      .then<PoemChallengeData>(unwrap),
  poemChallengeKeywords: () =>
    http()
      .get("/v2/edu/poem-challenge/keywords")
      .then<string[]>(unwrap),

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
  saveInsectGuide: (data: InsectGuideSaveRequest) =>
    http()
      .post("/v2/edu/insect/guide/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
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
  // /detail 与 /stage 返回同一形态的详情视图：四个 JSON 列都已解析成数组，
  // 所以这里返回 InsectDetail（数组）而不是落库契约 Insect（JSON 字符串）。
  // 保存走 saveInsect，那才是字符串形态。
  getInsectDetail: (insectId: number) =>
    http()
      .get(`/v2/edu/insect/detail/${insectId}`)
      .then<InsectDetail>(unwrap),
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

  /**
   * 学生登录（/edu/student-login 用）
   *
   * 走的是 oauth 统一登录接口 `/v2/user/login`，只多传一个 `accountType: "student"`，
   * 由 oauth 的凭据扩展点交给 edu_student 去校验 —— 前端不自己判断学号还是手机号，
   * 也不持有任何学生口令相关的分支逻辑。
   *
   * 成功后把令牌写进框架 storage（与后台登录同一套存储），
   * 这样学生端后续请求自动带上鉴权头。
   *
   * @param data 登录名（学号或家长手机号）与口令
   * @returns 登录结果，含 accessToken 与用户信息
   */
  studentLogin: async (data: { username: string; password: string }) => {
    const res = await http()
      .post("/v2/user/login")
      // authType 决定 OAuth 服务端用哪个认证实现：STUDENT 对应其
      // StudentLoginService（查 edu_student）。accountType 仍一并传，
      // 供不区分 authType 的链路（如 static）识别账号来源。
      .data({ ...data, authType: "STUDENT", accountType: "student" } as unknown as Record<string, unknown>)
      .then<{ accessToken?: string; [k: string]: unknown } | undefined>(unwrap);
    if (res?.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  // 学生中心（学生端 /edu/student 专用；归属取自登录态，不接受客户端传学生 ID）
  studentMe: () =>
    http()
      .get("/v2/edu/student/me")
      .then<StudentBindState>(unwrap),
  studentBind: (data: StudentBindRequest) =>
    http()
      .post("/v2/edu/student/bind")
      .data(data as unknown as Record<string, unknown>)
      .then<StudentBindState>(unwrap),
  studentOverview: () =>
    http()
      .get("/v2/edu/student/overview")
      .then<StudentOverview>(unwrap),
  reportStudy: (data: StudyReportRequest) =>
    http()
      .post("/v2/edu/student/study/report")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 我的错题本（带题干/选项/答案） */
  studentWrongbook: (params: { subject?: string; masteryLevel?: number } = {}) =>
    http()
      .get("/v2/edu/student/wrongbook")
      .query(params)
      .then<StudentWrongQuestion[]>(unwrap),
  /** 更新我的错题掌握度（0 未掌握 / 1 复习中 / 2 已掌握） */
  updateStudentWrongMastery: (wrongId: number, masteryLevel: number) =>
    http()
      .put("/v2/edu/student/wrongbook/mastery")
      .query({ wrongId, masteryLevel })
      .then<boolean>(unwrap),
  /** 我的答题/阅卷记录 */
  studentMarkingTasks: (limit = 20) =>
    http()
      .get("/v2/edu/student/marking/tasks")
      .query({ limit })
      .then<TeacherMarkingTask[]>(unwrap),
  /** 我的某次阅卷结果 */
  studentMarkingResult: (taskId: string) =>
    http()
      .get(`/v2/edu/student/marking/result/${taskId}`)
      .then<MarkingResultVO>(unwrap),

  /**
   * 通用登录（教务端统一登录页用）。
   *
   * <p>不带 authType：由 oauth 走默认凭据链，用于老师/管理员账号。
   * 学生账号走 {@link #studentLogin}（authType=STUDENT）。</p>
   */
  userLogin: async (data: { username: string; password: string }) => {
    const res = await http()
      .post("/v2/user/login")
      .data(data as unknown as Record<string, unknown>)
      .then<{ accessToken?: string; roles?: string[]; user?: Record<string, unknown>; [k: string]: unknown } | undefined>(unwrap);
    if (res?.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  // 教师中心（老师端 /edu/teacher 专用）
  teacherMe: () =>
    http()
      .get("/v2/edu/teacher/me")
      .then<TeacherBindState>(unwrap),
  teacherBind: (data: TeacherBindRequest) =>
    http()
      .post("/v2/edu/teacher/bind")
      .data(data as unknown as Record<string, unknown>)
      .then<TeacherBindState>(unwrap),
  teacherOverview: () =>
    http()
      .get("/v2/edu/teacher/overview")
      .then<TeacherOverview>(unwrap),
  /** 我带的班级（教师端，归属取自登录态） */
  teacherClasses: () =>
    http()
      .get("/v2/edu/teacher/classes")
      .then<EduClass[]>(unwrap),
  /** 新建 / 修改我自己的班级，返回班级 ID */
  saveTeacherClass: (data: Partial<EduClass>) =>
    http()
      .post("/v2/edu/teacher/classes")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 删除我自己的班级（班级下有学生时后端会拒绝） */
  deleteTeacherClass: (classId: number) =>
    http()
      .delete(`/v2/edu/teacher/classes/${classId}`)
      .then<boolean>(unwrap),
  /** 我某个班的学生清单 */
  teacherClassStudents: (classId: number) =>
    http()
      .get(`/v2/edu/teacher/classes/${classId}/students`)
      .then<EduStudent[]>(unwrap),
  /** 在我自己的班级下新增 / 修改学生，返回学生 ID */
  saveTeacherStudent: (classId: number, data: Partial<EduStudent>) =>
    http()
      .post(`/v2/edu/teacher/classes/${classId}/students`)
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 删除我班里的学生 */
  deleteTeacherStudent: (studentId: number) =>
    http()
      .delete(`/v2/edu/teacher/students/${studentId}`)
      .then<boolean>(unwrap),
  /** 重置我班学生的登录口令 */
  resetTeacherStudentPassword: (studentId: number, newPassword: string) =>
    http()
      .post(`/v2/edu/teacher/students/${studentId}/reset-password`)
      .data({ newPassword } as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 教师端字典下拉（管理端下拉是管理员专属，教师令牌会 403） */
  teacherDropdown: () =>
    http()
      .get("/v2/edu/teacher/dropdown")
      .then<DimensionDropdown>(unwrap),
  /** 我发起的阅卷任务 */
  teacherMarkingTasks: (limit = 20) =>
    http()
      .get("/v2/edu/teacher/marking/tasks")
      .query({ limit })
      .then<TeacherMarkingTask[]>(unwrap),

  // ==================== 班级试卷布置（老师给班级组卷 -> 班内学生可见） ====================
  /** 老师把一张试卷布置给自己的某个班级（重复布置同一班同一卷走「复活」，不重复建行） */
  assignPaperToClass: (data: { paperId: number; classId: number; remark?: string }) =>
    http()
      .post("/v2/edu/paper-assign")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 我（老师）布置过的试卷 */
  myPaperAssigns: () =>
    http()
      .get("/v2/edu/paper-assign/mine")
      .then<PaperAssignVO[]>(unwrap),
  /** 撤回布置（软删，学生端立即看不到） */
  revokePaperAssign: (assignId: number) =>
    http()
      .delete(`/v2/edu/paper-assign/${assignId}`)
      .then<boolean>(unwrap),
  /** 学生：我所在班级收到的试卷（按登录态定位自己的班级，不传班级 ID） */
  myClassPapers: () =>
    http()
      .get("/v2/edu/paper-assign/my-class")
      .then<PaperAssignVO[]>(unwrap),
  /**
   * 学生：查看布置给本班的某张试卷详情（含题目）。
   *
   * <p>不能用通用的 {@code getPaper}：那个接口按「试卷归属人」鉴权，学生不是归属人，
   * 实测 400 B0500S0001 —— 学生只能看到卷名、点「查看试卷」是空的。</p>
   */
  myClassPaperDetail: (paperId: number) =>
    http()
      .get(`/v2/edu/paper-assign/paper/${paperId}`)
      .then<Paper>(unwrap),

  /**
   * 指定学段的模块清单（学生端首页用）。
   * 后台在「模块配置」里按学段增删改排序，学生端不需要改代码。
   *
   * @param gradeLevel PRIMARY / JUNIOR / SENIOR
   */
  funModules: (gradeLevel: string) =>
    http()
      .get("/v2/edu/fun/modules")
      .query({ gradeLevel })
      .then<FunModuleConfig[]>(unwrap),

  // ==================== 学生 / 班级 / 教师（数据配置 - 学生管理） ====================
  // 管理端维护档案；学生本人的绑定与学习数据走 /v2/edu/student/*（学生中心）
  listStudents: (params: { classId?: number; gradeLevel?: string; grade?: string } = {}) =>
    http()
      .get("/v2/edu/dimension/students")
      .query(params)
      .then<EduStudent[]>(unwrap),
  saveStudent: (data: Partial<EduStudent>) =>
    http()
      .post("/v2/edu/dimension/students/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /**
   * 上传学生头像，返回相对路径供 saveStudent 绑定到 studentAvatar。
   *
   * <p>单独一条上传通道（不复用知识点附件上传）：两者存储目录与生命周期不同，
   * 混用会让「换学生头像」误动到知识点附件。</p>
   */
  uploadStudentAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http()
      .post("/v2/edu/student-avatar/upload")
      .data(form)
      .then<{ filePath: string }>(unwrap);
  },
  /**
   * 头像直链地址（后端已 whitelist，`<img>` 可直接带 path 访问）。
   *
   * <p>相对路径要拼成预览地址：库里存的是 `data/student-avatars` 下的相对路径，
   * 不是可直接用的 URL。已是 http(s)/data: 的旧值原样返回，兼容历史数据。</p>
   */
  studentAvatarUrl: (path?: string) => {
    if (!path) {
      return "";
    }
    if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) {
      return path;
    }
    return `/v2/edu/student-avatar/file?path=${encodeURIComponent(path)}`;
  },
  deleteStudent: (id: number) =>
    http()
      .delete(`/v2/edu/dimension/students/${id}`)
      .then<boolean>(unwrap),
  /**
   * 管理员重置学生登录口令。
   *
   * <p>与学生自助改密（`/v2/edu/student/change-password`）分开：
   * 这条不需要旧口令，但后端仍校验归属，越权重置会被拒。</p>
   */
  resetStudentPassword: (studentId: number, newPassword: string) =>
    http()
      .post("/v2/edu/dimension/students/reset-password")
      .data({ studentId, newPassword } as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /**
   * 学生自助修改登录口令。
   *
   * <p>改的是谁由登录态决定，请求体里不带学号——带了等于让客户端决定改谁的。</p>
   */
  changeOwnPassword: (data: { oldPassword?: string; newPassword: string }) =>
    http()
      .post("/v2/edu/student/change-password")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /**
   * 代入指定学生：签发一个短期、只读、仅限学生端路径的临时令牌。
   *
   * 管理员用它打开某个学生的学生端页面排查问题，不必索要学生密码，
   * 也不会写入学生的学习记录。仅管理员可用。
   *
   * @param data 学生标识、可选有效期（秒）与可访问路径
   * @returns 临时令牌、有效期、只读标记与被代入学生信息
   */
  impersonateStudent: (data: {
    studentId: number;
    expireSeconds?: number;
    allowedUrls?: string[];
  }) =>
    http()
      .post("/v2/edu/dimension/students/impersonate")
      .data(data as unknown as Record<string, unknown>)
      .then<{
        accessToken?: string;
        expires?: number;
        readonly?: boolean;
        userId?: string;
        nickname?: string;
      }>(unwrap),

  listClasses: (params: { gradeLevel?: string; teacherId?: number } = {}) =>
    http()
      .get("/v2/edu/dimension/classes")
      .query(params)
      .then<EduClass[]>(unwrap),
  saveClass: (data: Partial<EduClass>) =>
    http()
      .post("/v2/edu/dimension/classes/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteClass: (id: number) =>
    http()
      .delete(`/v2/edu/dimension/classes/${id}`)
      .then<boolean>(unwrap),

  listTeachers: (params: { subjectCode?: string } = {}) =>
    http()
      .get("/v2/edu/dimension/teachers")
      .query(params)
      .then<EduTeacher[]>(unwrap),
  saveTeacher: (data: Partial<EduTeacher>) =>
    http()
      .post("/v2/edu/dimension/teachers/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteTeacher: (id: number) =>
    http()
      .delete(`/v2/edu/dimension/teachers/${id}`)
      .then<boolean>(unwrap),
};

export default eduaiApi;
