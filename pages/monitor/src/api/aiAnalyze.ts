/**
 * AI 智能分析 API（/ms/monitor/ai/*）。
 *
 * <p>属监控侧能力（对监控数据做 AI 解读），故放在 @pages/monitor；
 * 主机详情页需要它时从本包引入，不再从监控台宿主拿。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

// ==================== AI 智能分析 ====================

/**
 * AI 状态
 * @author CH
 * @since 4.0.0
 */
export interface AiStatus {
  enabled: boolean;
  model?: string;
  provider?: string;
}

/**
 * AI 分析结果
 * @author CH
 * @since 4.0.0
 */
export interface AiAnalyzeResult {
  content: string;
  model?: string;
  usage?: unknown;
  hostId?: number;
  hostName?: string;
}

/**
 * 查询 AI 分析是否启用
 * @returns AI 状态
 */
export const fetchAiStatus = () =>
  http()
    .get("/ms/monitor/ai/status")
    .then(r => unwrap<AiStatus>(r));

/**
 * 通用 AI 分析
 * @param prompt 用户提示词
 * @param options 可选配置（systemPrompt / model）
 * @returns AI 分析结果
 */
export const aiAnalyze = (prompt: string, options?: { systemPrompt?: string; model?: string }) =>
  http()
    .post("/ms/monitor/ai/analyze")
    .data({ prompt, systemPrompt: options?.systemPrompt, model: options?.model })
    .then(r => unwrap<AiAnalyzeResult>(r));

/**
 * 主机指标智能分析
 * @param hostId 主机 ID（ms_server_host.id）
 * @param options 可选配置（dimension 分析重点 / systemPrompt / model）
 * @returns AI 分析结果
 */
export const aiAnalyzeHost = (
  hostId: number,
  options?: { dimension?: string; systemPrompt?: string; model?: string }
) =>
  http()
    .post(`/ms/monitor/ai/host/${hostId}/analyze`)
    .data({
      dimension: options?.dimension,
      systemPrompt: options?.systemPrompt,
      model: options?.model,
    })
    // 大模型同步回包可能超过默认 10s，超时后前端会误报"分析失败"
    .timeout(120_000)
    .then(r => unwrap<AiAnalyzeResult>(r));
