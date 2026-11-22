/**
 * 教育 AI API —— 学生 / 班级 / 教师管理 + 应用配置。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  PageResult,
  EduClass,
  EduStudent,
  EduTeacher,
} from "../types";
import { unwrap } from "./unwrap";

export const orgApi = {
  // ==================== 学生 / 班级 / 教师（数据配置 - 学生管理） ====================
  // 管理端维护档案；学生本人的绑定与学习数据走 /v2/edu/student/*（学生中心）
  listStudents: (params: { classId?: number; gradeLevel?: string; grade?: string } = {}) =>
    http()
      .get("/v2/edu/dimension/students")
      .query(params)
      .then<EduStudent[]>(unwrap),
  /** 学生分页（后端筛选 + 归属隔离；供学生管理 ReTable 使用） */
  pageStudents: (params: {
    classId?: number;
    gradeLevel?: string;
    grade?: string;
    keyword?: string;
    pageNum?: number;
    pageSize?: number;
  } = {}) =>
    http()
      .get("/v2/edu/dimension/students/page")
      .query(params)
      .then<PageResult<EduStudent>>(unwrap),
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
  resetTeacherPassword: (teacherId: number, newPassword: string) =>
    http()
      .post("/v2/edu/dimension/teachers/reset-password")
      .data({ teacherId, newPassword } as unknown as Record<string, unknown>)
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
  /** 班级分页（后端筛选 + 归属隔离） */
  pageClasses: (params: {
    gradeLevel?: string;
    keyword?: string;
    pageNum?: number;
    pageSize?: number;
  } = {}) =>
    http()
      .get("/v2/edu/dimension/classes/page")
      .query(params)
      .then<PageResult<EduClass>>(unwrap),
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
  /** 教师分页（后端筛选 + 归属隔离） */
  pageTeachers: (params: {
    subjectCode?: string;
    keyword?: string;
    pageNum?: number;
    pageSize?: number;
  } = {}) =>
    http()
      .get("/v2/edu/dimension/teachers/page")
      .query(params)
      .then<PageResult<EduTeacher>>(unwrap),
  saveTeacher: (data: Partial<EduTeacher>) =>
    http()
      .post("/v2/edu/dimension/teachers/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteTeacher: (id: number) =>
    http()
      .delete(`/v2/edu/dimension/teachers/${id}`)
      .then<boolean>(unwrap),
  /** 教师已配置的班级（老师端数据范围；管理端「学生管理 → 教师 → 配置班级」） */
  listTeacherClasses: (teacherId: number) =>
    http()
      .get(`/v2/edu/dimension/teachers/${teacherId}/classes`)
      .then<EduClass[]>(unwrap),
  /** 保存教师班级配置（全量替换） */
  saveTeacherClasses: (teacherId: number, classIds: number[]) =>
    http()
      .post(`/v2/edu/dimension/teachers/${teacherId}/classes`)
      .data(classIds as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 读取应用配置（管理员专属，如「老师上传自动通过」） */
  getAppConfig: (key: string) =>
    http()
      .get(`/v2/edu/app-config/${key}`)
      .then<string | null>(unwrap),
  /** 写入应用配置（管理员专属） */
  saveAppConfig: (key: string, value: string) =>
    http()
      .post(`/v2/edu/app-config/${key}`)
      .data({ value } as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
};
