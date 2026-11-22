/**
 * 教育 AI API —— 教师中心。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  PageResult,
  TeacherQuestionUploadResult,
  Paper,
  TeacherBindState,
  TeacherBindRequest,
  TeacherOverview,
  EduClass,
  EduStudent,
  DimensionDropdown,
  TeacherMarkingTask,
} from "../types";
import { unwrap } from "./unwrap";

export const teacherApi = {
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
  /**
   * 我的试卷（本人分页，教师端组卷 / 阅卷下拉共用）
   *
   * <p>不走通用 pagePapers：通用分页对管理员会放行全量，
   * 老师端要求「新增 / 查看都只能是自己的卷」。</p>
   */
  teacherPapers: (params: { pageNum?: number; pageSize?: number; subject?: string; gradeLevel?: string; status?: number } = {}) =>
    http()
      .get("/v2/edu/teacher/papers")
      .query(params)
      .then<PageResult<Paper>>(unwrap),
  /** 老师上传题目（待审核，管理员可配自动通过；与批量导入同格式的 JSON 数组） */
  teacherQuestionUpload: (list: unknown[]) =>
    http()
      .post("/v2/edu/teacher/questions")
      .data(list as unknown as Record<string, unknown>)
      .then<TeacherQuestionUploadResult>(unwrap),
  /** 我发起的阅卷任务 */
  teacherMarkingTasks: (limit = 20) =>
    http()
      .get("/v2/edu/teacher/marking/tasks")
      .query({ limit })
      .then<TeacherMarkingTask[]>(unwrap),
  /** 我发起的阅卷任务（分页，按创建时间倒序） */
  pageTeacherMarkingTasks: (params: { pageNum?: number; pageSize?: number; teacherFinished?: 0 | 1; keyword?: string } = {}) =>
    http()
      .get("/v2/edu/teacher/marking/tasks/page")
      .query(params as unknown as Record<string, unknown>)
      .then<PageResult<TeacherMarkingTask>>(unwrap),
  /** 撤销阅卷完成：删除任务的错题记录并复位完成状态 */
  unfinishMarking: (taskId: string) =>
    http()
      .post(`/v2/edu/marking/${taskId}/unfinish`)
      .then<import("../types").MarkingUndoResult>(unwrap),
};
