/**
 * 教育 AI API —— 学生中心 / 通用登录。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http, setAccessToken } from "@repo/utils";
import type {
  EduaiRequestOptions,
  MarkingResultVO,
  StudentBindState,
  StudentBindRequest,
  StudentOverview,
  StudyReportRequest,
  TeacherMarkingTask,
  StudentWrongQuestion,
} from "../types";
import { unwrap } from "./unwrap";

export const studentApi = {
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
  /** 一键订正我的错题（重新作答后的客观标记，老师端可见订正率） */
  updateStudentWrongCorrected: (wrongId: number) =>
    http()
      .put(`/v2/edu/student/wrongbook/correct/${wrongId}`)
      .then<boolean>(unwrap),
  /** 我的答题/阅卷记录 */
  studentMarkingTasks: (limit = 20) =>
    http()
      .get("/v2/edu/student/marking/tasks")
      .query({ limit })
      .then<TeacherMarkingTask[]>(unwrap),
  /** 我的某次阅卷结果 */
  studentMarkingResult: (taskId: string, opts?: EduaiRequestOptions) =>
    http()
      .get(`/v2/edu/student/marking/result/${taskId}`)
      .signal(opts?.signal)
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
};
