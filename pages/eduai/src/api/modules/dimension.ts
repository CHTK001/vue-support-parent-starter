/**
 * 教育 AI API —— 维度数据。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http, setAccessToken } from "@repo/utils";
import type {
  EduSubject,
  EduGrade,
  GradeLevelOption,
} from "../types";
import { unwrap } from "./unwrap";

export const dimensionApi = {
  // 维度数据（学科 / 学段 / 年级）
  listSubjects: (gradeLevel?: string, includeDisabled?: boolean) =>
    http()
      .get("/v2/edu/dimension/subjects")
      .query({ gradeLevel, includeDisabled: includeDisabled || undefined })
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
      // 决定用哪个认证实现的是 accountType：后端把 LoginHandler 的扩展名组合成
      // loginType-accountType（null 段跳过），这里组合出的名字是 "student"，
      // 由业务侧注册的 STUDENT 处理器（复用 StudentCredentialProvider 查 edu_student）接住。
      // authType 只作链路归因的附带字段，LoginData 并不解析它——不要依赖它选实现。
      .data({ ...data, authType: "STUDENT", accountType: "student" } as unknown as Record<string, unknown>)
      .then<{ accessToken?: string; [k: string]: unknown } | undefined>(unwrap);
    if (res?.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  teacherLogin: async (data: { username: string; password: string }) => {
    const res = await http()
      .post("/v2/user/login")
      // 与 studentLogin 同形：accountType=teacher 组合出查找名 "teacher"，
      // 由业务侧注册的 TEACHER 处理器接住（校验口径复用 TeacherCredentialProvider，查 edu_teacher）。
      // 注册名写大写的 TEACHER 也能命中，是因为 SPI 的注册与查找两侧都会做大小写归一。
      // 后端返回未认证（如「工号不存在」）时原样抛出，由调用方决定是否回落到系统账号登录。
      .data({ ...data, authType: "TEACHER", accountType: "teacher" } as unknown as Record<string, unknown>)
      .then<{ accessToken?: string; [k: string]: unknown } | undefined>(unwrap);
    if (res?.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },
};
