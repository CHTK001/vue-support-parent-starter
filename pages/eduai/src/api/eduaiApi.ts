/**
 * 教育 AI HTTP 客户端（聚合出口）。
 *
 * 复用 @repo/core 的 http() 实例（由 createApp 注入，含加密/拦截器）。
 * 返回的 Promise 直接 resolve 到 data 字段（业务负载）。
 *
 * 实现按业务域拆分在 ./modules/*；本文件只做聚合导出，
 * 调用方仍从本文件导入 { eduaiApi }（或 default）。
 */
import { questionApi } from "./modules/question";
import { paperApi } from "./modules/paper";
import { markingApi } from "./modules/marking";
import { knowledgeApi } from "./modules/knowledge";
import { examApi } from "./modules/exam";
import { funApi } from "./modules/fun";
import { dimensionApi } from "./modules/dimension";
import { studentApi } from "./modules/student";
import { teacherApi } from "./modules/teacher";
import { paperAssignApi } from "./modules/paperAssign";
import { orgApi } from "./modules/org";

/**
 * 教育 AI API 客户端（题库/组卷/阅卷/知识库/错题/考试 全模块）
 * @author CH
 * @since 4.0.0
 */
export const eduaiApi = {
  ...questionApi,
  ...paperApi,
  ...markingApi,
  ...knowledgeApi,
  ...examApi,
  ...funApi,
  ...dimensionApi,
  ...studentApi,
  ...teacherApi,
  ...paperAssignApi,
  ...orgApi,
} as const;

export default eduaiApi;
