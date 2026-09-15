/**
 * 教育 AI HTTP 客户端。
 *
 * 复用 @repo/core 的 http() 实例（由 createApp 注入，含加密/拦截器）。
 * 返回的 Promise 直接 resolve 到 data 字段（业务负载）。
 */
import { http } from "@repo/utils";
import type {
  PageResult,
  Question,
  Paper,
  MarkingSubmitRequest,
  MarkingResultVO,
  MarkingAdjust,
  KnowledgePoint,
  KnowledgeDoc,
  WrongQuestion,
  Exam,
} from "./types";

/** 解包 { code, msg, data } 为 data */
function unwrap<T>(r: { data?: T }): T {
  return r.data as T;
}

/**
 * 教育 AI API 客户端（题库/组卷/阅卷/知识库/错题/考试 全模块）
 * @author CH
 * @since 4.0.0
 */
export const eduaiApi = {
  // 题库
  pageQuestions: (params: { pageNum?: number; pageSize?: number; subject?: string; gradeLevel?: string; grade?: string; type?: string; difficulty?: number }) =>
    http()
      .get("/v2/edu/question/page")
      .query(params)
      .then<PageResult<Question>>(unwrap),
  getQuestion: (id: number) =>
    http()
      .get(`/v2/edu/question/${id}`)
      .then<Question>(unwrap),
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
  pagePapers: (params: { pageNum?: number; pageSize?: number; subject?: string }) =>
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
  saveKnowledgePoint: (data: Partial<KnowledgePoint>) =>
    http()
      .post("/v2/edu/knowledge-point/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteKnowledgePoint: (id: number) =>
    http()
      .delete(`/v2/edu/knowledge-point/${id}`)
      .then<boolean>(unwrap),

  // 知识库文档
  pageDocs: (params: { page?: number; pageSize?: number; name?: string; subject?: string; status?: number } = {}) =>
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
  listWrongQuestions: (params: { studentId?: string; subject?: string; pageNum?: number; pageSize?: number } = {}) =>
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
  pageExams: (params: { page?: number; pageSize?: number } = {}) =>
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
};

export default eduaiApi;
