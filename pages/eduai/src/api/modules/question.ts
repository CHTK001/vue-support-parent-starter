/**
 * 教育 AI API —— 题库。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  PageResult,
  Question,
  QuestionGradeDimension,
  QuestionImportResult,
} from "../types";
import { unwrap } from "./unwrap";

export const questionApi = {
  // 题库
  pageQuestions: (params: { pageNum?: number; pageSize?: number; keyword?: string; subject?: string; gradeLevel?: string; grade?: string; type?: string; difficulty?: number; status?: number; auditStatus?: number; orderBy?: string; orderDir?: "asc" | "desc" }) =>
    http()
      .get("/v2/edu/question/page")
      .query(params)
      .then<PageResult<Question>>(unwrap),
  questionStats: () =>
    http()
      .get("/v2/edu/question/stats")
      .then<{ total?: number; pendingAudit?: number; todayNew?: number; yesterdayNew?: number; subjectCount?: number }>(unwrap),
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
};
