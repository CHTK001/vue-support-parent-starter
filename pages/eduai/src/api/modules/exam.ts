/**
 * 教育 AI API —— 考试。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  PageResult,
  Exam,
} from "../types";
import { unwrap } from "./unwrap";

export const examApi = {
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
};
