/**
 * 教育 AI API —— 班级试卷布置 / 学生作答。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  EduaiRequestOptions,
  Paper,
  PaperAssignVO,
  StudentPaperSubmitPayload,
} from "../types";
import { unwrap } from "./unwrap";

export const paperAssignApi = {
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
  myClassPaperDetail: (paperId: number, opts?: EduaiRequestOptions) =>
    http()
      .get(`/v2/edu/paper-assign/paper/${paperId}`)
      .signal(opts?.signal)
      .then<Paper>(unwrap),
  /**
   * 学生：开始作答某张布置给本班的试卷（脱敏详情）。
   *
   * <p>不能复用 {@code myClassPaperDetail}：那个接口给学生返回的是**含标准答案
   * 与解析**的完整详情（教师端同款），在线作答时学生抓一下报文就能抄答案。
   * 本接口走学生中心的学生视角授权，题目只带题干/选项，answer/analysis 恒为空。</p>
   */
  studentAnswerPaper: (paperId: number, opts?: EduaiRequestOptions) =>
    http()
      .get(`/v2/edu/student/papers/${paperId}/answer`)
      .signal(opts?.signal)
      .then<Paper>(unwrap),
  /**
   * 学生：提交在线作答，进入 AI 阅卷。
   *
   * <p>返回阅卷任务标识，用 {@code studentMarkingResult(taskId)} 轮询结果；
   * 同一考试同一学生只允许一份答题卡，重复提交后端会拒绝。</p>
   */
  studentSubmitPaper: (paperId: number, payload: StudentPaperSubmitPayload) =>
    http()
      .post(`/v2/edu/student/papers/${paperId}/submit`)
      .data(payload as unknown as Record<string, unknown>)
      .then<string>(unwrap),
  /**
   * 学生：查询我在某张试卷下的剩余作答时间（服务端计时）。
   *
   * <p>计时锚点是服务端为本人建的草稿答题卡时间（首次拉卷即建）；前端只做展示，
   * 交卷时服务端会再做权威校验。timed=false / remainingSeconds&lt;0 表示不限时。</p>
   */
  studentPaperTimer: (paperId: number) =>
    http()
      .get(`/v2/edu/student/papers/${paperId}/timer`)
      .then<{ timed: boolean; durationMinutes: number; remainingSeconds: number }>(unwrap),
};
