/**
 * 教育 AI API —— 阅卷。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  EduaiRequestOptions,
  MarkingSubmitRequest,
  MarkingResultVO,
  MarkingAdjust,
  MarkingFinishResult,
  MarkingFinishPreview,
  BatchMarkingResult,
} from "../types";
import { unwrap } from "./unwrap";

export const markingApi = {
  // 阅卷
  submitMarking: (data: MarkingSubmitRequest) =>
    http()
      .post("/v2/edu/marking/submit")
      .data(data as unknown as Record<string, unknown>)
      .then<string>(unwrap),
  getMarkingResult: (taskId: string, opts?: EduaiRequestOptions) =>
    http()
      .get(`/v2/edu/marking/result/${taskId}`)
      .signal(opts?.signal)
      .then<MarkingResultVO>(unwrap),
  confirmMarking: (data: { taskId: string; adjustments: MarkingAdjust[] }) =>
    http()
      .put("/v2/edu/marking/confirm")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),

  /**
   * 阅卷完成：把该卷错题按最终分归入对应学生的错题库。
   *
   * <p>老师复核收口动作。学生取卷面识别 / 人工纠正后的学号，
   * 未识别到学生时后端拒绝（错题必须落到「对应学生」）。
   * 幂等：重复调用不会重复累加错题次数。</p>
   *
   * @param taskId 任务标识
   * @returns 完成结果（学生 / 试卷 / 本次错题数）
   */
  finishMarking: (taskId: string, excludeQuestionIds?: number[]) =>
    http()
      .post(`/v2/edu/marking/${taskId}/finish`)
      .data({ excludeQuestionIds: excludeQuestionIds && excludeQuestionIds.length ? excludeQuestionIds : undefined } as unknown as Record<string, unknown>)
      .then<MarkingFinishResult>(unwrap),

  /**
   * 阅卷完成预览：按当前判错阈值算出将登记的题目清单。
   *
   * <p>老师点「完成」前先拉预览，弹窗列出题目与得分率，勾选剔除后再调用
   * {@code finishMarking}。预览不做任何数据变更。</p>
   *
   * @param taskId 任务标识
   * @returns 预览结果（学生 / 将登记题数 / 题目清单）
   */
  previewFinishMarking: (taskId: string) =>
    http()
      .get(`/v2/edu/marking/finish-preview/${taskId}`)
      .then<MarkingFinishPreview>(unwrap),

  /**
   * 批量阅卷完成。
   *
   * @param taskIds 任务标识列表
   * @param excludeQuestionIdsByTask 任务 → 剔除题目列表（可选）
   * @returns 逐任务完成结果
   */
  batchFinishMarking: (taskIds: string[], excludeQuestionIdsByTask?: Record<string, number[]>) =>
    http()
      .post("/v2/edu/marking/batch-finish")
      .data({ taskIds, excludeQuestionIdsByTask } as unknown as Record<string, unknown>)
      .then<BatchMarkingResult[]>(unwrap),

  /**
   * 批量撤销阅卷完成。
   *
   * @param taskIds 任务标识列表
   * @returns 逐任务撤销结果
   */
  batchUnfinishMarking: (taskIds: string[]) =>
    http()
      .post("/v2/edu/marking/batch-unfinish")
      .data({ taskIds } as unknown as Record<string, unknown>)
      .then<BatchMarkingResult[]>(unwrap),

  /**
   * 获取「与图片同版式」的结构化解析结果。
   *
   * <p>逐页返回版面区域/文字块坐标（已归一化到 0~1）与页尺寸，以及题号锚点与判分明细
   * （含知识点），用于把分数标记/对错/知识点按原图位置叠放。</p>
   *
   * @param taskId 任务标识
   * @returns 结构化数据
   */
  getMarkingStructure: (taskId: string, opts?: EduaiRequestOptions) =>
    http()
      .get(`/v2/edu/marking/structure/${taskId}`)
      .signal(opts?.signal)
      .then<Record<string, any>>(unwrap),

  /**
   * 把外来卷（任意卷）识别出的题目加入题库。
   *
   * <p>仅 {@code mode=ANY} 可用：自有卷的题目本来就来自题库，后端会拒绝。
   * 题干与学生作答由服务端回读阅卷明细，这里只提交选中行、学科/学段/年级与
   * 老师补写的标准答案。</p>
   *
   * @param taskId 任务标识
   * @param data   入题库请求
   * @returns 逐条容错的入库结果
   */
  addMarkingToBank: (
    taskId: string,
    data: {
      resultIds: number[];
      questionSubject: string;
      questionGradeLevel: string;
      questionGrade: string;
      questionDifficulty?: number;
      questionScore?: number;
      answers?: Record<number, string>;
    },
  ) =>
    http()
      .post(`/v2/edu/marking/${taskId}/to-bank`)
      .data(data as unknown as Record<string, unknown>)
      .then<{ successCount: number; duplicateCount: number; failedCount: number; errors: string[]; needAnswerNos: string[] }>(unwrap),

  /**
   * 读取 AI 运行时配置（管理员专属，用于 AI 配置中心）。
   *
   * <p>返回 runtime 分组 field -> value 的键值对（provider / provider_base_url /
   * provider_api_key / default_model / temperature / max_tokens / timeout_millis 等）。
   * 凭据类字段对非管理员回掩码 {@code ***}；管理员回显原值。</p>
   *
   * @returns runtime 分组配置键值对
   */
  getAiRuntimeConfig: () =>
    http()
      .get("/v2/settings/runtime")
      .then<Record<string, any>>(unwrap),

  /**
   * 保存 AI 运行时配置（管理员专属）。
   *
   * <p>整组覆盖提交；凭据字段值为 {@code ***} 表示保留原值不覆盖。保存后服务端
   * 发布变更事件，后端按新签名重建对话客户端（无需重启）。</p>
   *
   * @param data runtime 分组配置键值对
   * @returns 保存后的配置
   */
  saveAiRuntimeConfig: (data: Record<string, any>) =>
    http()
      .put("/v2/settings/runtime")
      .data(data as unknown as Record<string, unknown>)
      .then<Record<string, any>>(unwrap),

  /**
   * 获取答卷原图（同版式展示的打底图）。
   *
   * <p>返回 Blob 而非 JSON：该接口输出 PNG 字节，需要带鉴权头请求后由前端转 objectURL。</p>
   *
   * @param taskId  任务标识
   * @param page    页码（从 1 开始）
   * @param variant 图片变体：{@code thumb} 取缩略图（最长边 ~900px，体积约 1/3），
   *                不传取原图
   * @returns 图片 Blob
   */
  getSheetImageBlob: (taskId: string, page: number, variant?: 'thumb') =>
    http()
      .get(`/v2/edu/marking/image/${taskId}`)
      .query(variant ? { page, variant } : { page })
      .responseType("blob")
      .then<Blob>((resp: any) => resp.data as Blob),

  /**
   * 扫描试卷图片并阅卷。
   *
   * <p>SELF 自有卷按题号回数据库取准确分值；ANY 任意卷由模型抽取并判定。
   * 表单字段：{@code file} 图片、{@code mode}、{@code paperId}、{@code studentId}、{@code maxScore}。</p>
   *
   * @param form 表单数据
   * @returns 任务 ID，用 getMarkingResult 轮询
   */
  scanMarking: (form: FormData) =>
    http()
      .post("/v2/edu/marking/scan")
      .data(form)
      .then<string>(unwrap),

  /**
   * 阅卷进度 SSE 流地址。
   *
   * <p>拿到 scanMarking 返回的 taskId 后立刻 {@code http().get(url).sse({...})}：
   * 识别 / 解析 / 判分每推进一步都会收到一帧 {@code progress}，终态收到 {@code done}。
   * 不再靠 2s 轮询问结果接口。</p>
   *
   * @param taskId 任务标识
   * @returns SSE 流地址
   */
  markingProgressStreamUrl: (taskId: string) => `/v2/edu/marking/stream/${taskId}`,
};
