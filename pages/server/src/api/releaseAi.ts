/**
 * 发布管理 AI 接口（/ms/server/release/ai/*）。
 *
 * <p>能力探测先行：宿主没装 ai-starter 或没配可用模型时返回 available=false，
 * 页面据此隐藏入口——不做一个点了才报错的按钮。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { http, unwrapResult } from "@repo/utils";

/** AI 能力 */
export interface ReleaseAiCapabilities {
  available: boolean;
  providers: string[];
  models: string[];
}

/**
 * 查 AI 能力。
 *
 * <p>失败按「不可用」处理：AI 是可选能力，不该让日志页因为探测失败而报错。</p>
 *
 * @returns 能力信息
 */
export const getReleaseAiCapabilities = async (): Promise<ReleaseAiCapabilities> => {
  try {
    const res = await http().get("/ms/server/release/ai/capabilities");
    const data = unwrapResult<ReleaseAiCapabilities>(res);
    return {
      available: !!data?.available,
      providers: data?.providers || [],
      models: data?.models || [],
    };
  } catch {
    return { available: false, providers: [], models: [] };
  }
};

/**
 * 日志 AI 排查。
 *
 * @param projectName 项目名（给模型一点上下文）
 * @param logText     日志正文（调用方截取最近的若干行）
 * @returns 结论全文
 */
export const diagnoseReleaseLog = (projectName: string, logText: string) =>
  http()
    .post("/ms/server/release/ai/log-diagnose")
    .data({ projectName, logText })
    .then((r) => unwrapResult<{ conclusion: string }>(r));
