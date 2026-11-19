/**
 * 学生端学习行为上报 composable
 *
 * <p>后端 {@code POST /v2/edu/student/study/report} 按登录态定位学生档案
 * （未绑定学生时直接报错），因此**只在学生端内嵌时上报**：用 portalHost
 * 是否存在判断当前是不是被 StudentPortalView 就地挂载。同一游戏页在管理
 * 后台作为隐藏路由打开时（老师/管理员试玩）没有宿主，自动跳过，不会刷出
 * 一条「尚未绑定学生信息」的错误。</p>
 *
 * <p>上报失败刻意静默（仅 console.warn）：结算体验不应被一次上报失败打断，
 * 本地战绩仍有 localStorage 兜底。</p>
 */
import { eduaiApi } from "../api/eduaiApi";
import type { StudyReportRequest } from "../api/types";
import { usePortalModuleHost } from "../views/portal/portalHost";

/** 每完成一局给该模块带来的进度增量（封顶 100 由后端负责） */
export const STUDY_PROGRESS_PER_ROUND = 10;

/**
 * 取学习行为上报器
 *
 * @returns report(payload)：在学生端内嵌时真正发出请求，否则为空操作
 */
export function useStudyReport() {
  const host = usePortalModuleHost();

  /**
   * 上报一次学习行为。
   *
   * @param payload 本次学习数据；moduleCode 必须用 modules.ts 里的稳定编码
   */
  function report(payload: StudyReportRequest): void {
    if (!host) {
      return;
    }
    eduaiApi.reportStudy(payload).catch((e) => {
      console.warn("[eduai] 学习行为上报失败", e);
    });
  }

  return { report };
}
