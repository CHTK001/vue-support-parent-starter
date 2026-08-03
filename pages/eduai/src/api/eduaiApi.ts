/**
 * 教育 AI HTTP 客户端。
 *
 * 复用 @repo/core 的 getApiHttp() 实例（由 createApp 注入，含加密/拦截器）。
 * 返回的 Promise 直接 resolve 到 data 字段（业务负载）。
 */
import { getApiHttp } from "@repo/core";
import type {
  PageResult,
  Question,
  Paper,
  MarkingSubmitRequest,
  MarkingResultVO,
  MarkingAdjust,
  KnowledgePoint,
  WrongQuestion,
  Exam,
} from "./types";

/** 解包 { code, msg, data } 为 data */
function unwrap<T>(r: { data?: T }): T {
  return r.data as T;
}

export const eduaiApi = {
  // 题库
  pageQuestions: (params: { pageNum?: number; pageSize?: number; subject?: string; type?: string }) =>
    getApiHttp()
      .get("/v2/edu/question/page")
      .query(params)
      .then<PageResult<Question>>(unwrap),
  getQuestion: (id: number) =>
    getApiHttp()
      .get(`/v2/edu/question/${id}`)
      .then<Question>(unwrap),
  saveQuestion: (data: Partial<Question>) =>
    getApiHttp()
      .post("/v2/edu/question/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  importQuestions: (list: Partial<Question>[]) =>
    getApiHttp()
      .post("/v2/edu/question/import")
      .data(list as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteQuestion: (id: number) =>
    getApiHttp()
      .delete(`/v2/edu/question/${id}`)
      .then<boolean>(unwrap),

  // 组卷
  pagePapers: (params: { pageNum?: number; pageSize?: number; subject?: string }) =>
    getApiHttp()
      .get("/v2/edu/paper/page")
      .query(params)
      .then<PageResult<Paper>>(unwrap),
  getPaper: (id: number) =>
    getApiHttp()
      .get(`/v2/edu/paper/${id}`)
      .then<Paper>(unwrap),
  generatePaper: (data: any) =>
    getApiHttp()
      .post("/v2/edu/paper/generate")
      .data(data as Record<string, unknown>)
      .then<number>(unwrap),
  replacePaperQuestion: (paperId: number, oldId: number, newId: number) =>
    getApiHttp()
      .put(`/v2/edu/paper/${paperId}/replace`)
      .query({ oldId, newId })
      .then<boolean>(unwrap),

  // 阅卷
  submitMarking: (data: MarkingSubmitRequest) =>
    getApiHttp()
      .post("/v2/edu/marking/submit")
      .data(data as unknown as Record<string, unknown>)
      .then<string>(unwrap),
  getMarkingResult: (taskId: string) =>
    getApiHttp()
      .get(`/v2/edu/marking/result/${taskId}`)
      .then<MarkingResultVO>(unwrap),
  confirmMarking: (data: { taskId: string; adjustments: MarkingAdjust[] }) =>
    getApiHttp()
      .put("/v2/edu/marking/confirm")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),

  // 知识点
  treeKnowledge: (params: { subject?: string; gradeLevel?: string; grade?: string } = {}) =>
    getApiHttp()
      .get("/v2/edu/knowledge-point/tree")
      .query(params)
      .then<KnowledgePoint[]>(unwrap),
  saveKnowledgePoint: (data: Partial<KnowledgePoint>) =>
    getApiHttp()
      .post("/v2/edu/knowledge-point/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteKnowledgePoint: (id: number) =>
    getApiHttp()
      .delete(`/v2/edu/knowledge-point/${id}`)
      .then<boolean>(unwrap),

  // 错题
  listWrongQuestions: (params: { studentId?: string; subject?: string; pageNum?: number; pageSize?: number } = {}) =>
    getApiHttp()
      .get("/v2/edu/wrongbook/page")
      .query(params)
      .then<PageResult<WrongQuestion>>(unwrap),
  reviewWrongbook: (data: any) =>
    getApiHttp()
      .post("/v2/edu/wrongbook/review")
      .data(data as Record<string, unknown>)
      .then<string>(unwrap),
  updateMastery: (id: number, level: number) =>
    getApiHttp()
      .put("/v2/edu/wrongbook/mastery")
      .query({ id, level })
      .then<boolean>(unwrap),

  // 考试
  pageExams: (params: { pageNum?: number; pageSize?: number } = {}) =>
    getApiHttp()
      .get("/v2/edu/exam/page")
      .query(params)
      .then<PageResult<Exam>>(unwrap),
  getExam: (id: number) =>
    getApiHttp()
      .get(`/v2/edu/exam/${id}`)
      .then<Exam>(unwrap),
  createExam: (data: Partial<Exam>) =>
    getApiHttp()
      .post("/v2/edu/exam/create")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  updateExam: (data: Partial<Exam>) =>
    getApiHttp()
      .put("/v2/edu/exam/update")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deleteExam: (id: number) =>
    getApiHttp()
      .delete(`/v2/edu/exam/${id}`)
      .then<boolean>(unwrap),

  // 调试
  aiHealth: () =>
    getApiHttp()
      .get("/v2/edu/debug/ai-health")
      .then<Record<string, unknown>>(unwrap),
  queueEcho: () =>
    getApiHttp()
      .get("/v2/edu/debug/queue-echo")
      .then<Record<string, unknown>>(unwrap),
  queueName: () =>
    getApiHttp()
      .get("/v2/edu/debug/queue-name")
      .then<Record<string, unknown>>(unwrap),
};

export default eduaiApi;
