/**
 * 教育 AI API —— 组卷 / 手动组卷 / 试卷模板。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  PageResult,
  Question,
  EduAiCapability,
  QuestionAiSelectPayload,
  Paper,
  PaperComposePayload,
  PaperQuestionAddItem,
  PaperHistoryItem,
  PaperQuestionQr,
  PaperTemplate,
} from "../types";
import { unwrap } from "./unwrap";

export const paperApi = {
  // 组卷
  pagePapers: (params: { pageNum?: number; pageSize?: number; subject?: string; gradeLevel?: string; status?: number }) =>
    http()
      .get("/v2/edu/paper/page")
      .query(params)
      .then<PageResult<Paper>>(unwrap),
  getPaper: (id: number) =>
    http()
      .get(`/v2/edu/paper/${id}`)
      .then<Paper>(unwrap),
  generatePaper: (data: any) =>
    http()
      .post("/v2/edu/paper/generate")
      .data(data as Record<string, unknown>)
      .then<number>(unwrap),

  /**
   * 读取「AI 组卷」试卷配置（配置中心 pages/ai 的 compose 分组）。
   *
   * <p>返回 field -> value 的键值对：{@code default_question_count} /
   * {@code default_score_per_question} / {@code max_total_score}。取的是「全局默认 +
   * 本人覆盖」的合并视图，与配置中心界面上看到的值一致，避免两处默认值各说各话。</p>
   *
   * <p>后端 merged 接口返回的是「配置项数组」，但外面可能还套着一层
   * {@code { success: true, data: [...] }}（业务包装）或 {@code { items: [...] }}。
   * 这里按这几种已知形态取到数组，再摊平成 field -> value，避免外层包装变化时
   * 静默退化成「取不到配置」，让页面悄悄用回写死的默认值。</p>
   *
   * @returns compose 分组配置键值对（值为后端下发的字符串）
   */
  getPaperComposeConfig: () =>
    http()
      .get("/v2/settings/compose/merged")
      .then<Record<string, any>>((r) => {
        const payload = unwrap<any>(r);
        const items: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.data?.data)
                ? payload.data.data
                : [];
        const map: Record<string, any> = {};
        for (const item of items) {
          if (item && typeof item === 'object' && item.field) {
            map[String(item.field)] = item.value;
          }
        }
        return map;
      }),

  /**
   * 探测 AI 对话能力是否可用
   *
   * <p>能力探测端点属于 AI 模块（spring-support-ai-starter）：`GET /v2/chat/capability`。
   * 不可用时后端会给出具体原因，前端据此禁用入口并展示原因，而不是让用户点下去再失败。</p>
   */
  aiCapability: () =>
    http()
      .get("/v2/chat/capability")
      .then<EduAiCapability>(unwrap),

  /**
   * AI 选题：按条件向 AI 要一批题目，用于往**已存在的试卷**里补题
   *
   * <p>与 `generatePaper` 的区别是不建卷，只返回题目列表。AI 不可用时后端会回退到
   * 规则选题，因此调用前应先用 `aiCapability()` 判断是否展示 AI 入口。</p>
   */
  aiSelectQuestions: (data: QuestionAiSelectPayload) =>
    http()
      .post("/v2/edu/question/ai-select")
      .data(data as Record<string, unknown>)
      .then<Question[]>(unwrap),
  replacePaperQuestion: (paperId: number, oldId: number, newId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/replace`)
      .query({ oldId, newId })
      .then<boolean>(unwrap),

  // 组卷 —— 手动组卷（PaperComposeView 用；草稿 -> 加题 -> 调序/均分 -> 发布）
  /** 新建试卷（草稿），返回试卷 ID */
  createPaper: (data: PaperComposePayload) =>
    http()
      .post("/v2/edu/paper")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 向试卷追加题目（分值/顺序可随条目传入），返回实际写入条数 */
  addPaperQuestions: (paperId: number, items: PaperQuestionAddItem[]) =>
    http()
      .post(`/v2/edu/paper/${paperId}/questions`)
      .data(items as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 从试卷移除某道题（questionId 为题库题目标识） */
  removePaperQuestion: (paperId: number, questionId: number) =>
    http()
      .delete(`/v2/edu/paper/${paperId}/questions/${questionId}`)
      .then<boolean>(unwrap),
  /** 按新顺序重排题目（questionNos 为试卷题唯一编号列表，数组顺序即目标顺序） */
  sortPaperQuestions: (paperId: number, questionNos: string[]) =>
    http()
      .put(`/v2/edu/paper/${paperId}/questions/sort`)
      .data(questionNos as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 按试卷总分均分题目分值 */
  evenPaperScores: (paperId: number) =>
    http()
      .post(`/v2/edu/paper/${paperId}/questions/even`)
      .then<boolean>(unwrap),
  /** 更新试卷基础信息（名称/学科/学段/年级/时长等） */
  updatePaper: (paperId: number, data: PaperComposePayload) =>
    http()
      .put(`/v2/edu/paper/${paperId}`)
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 发布试卷（草稿 -> 已发布） */
  publishPaper: (paperId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/publish`)
      .then<boolean>(unwrap),

  /**
   * 下架试卷（已发布 → 草稿）
   *
   * <p>业务口径「发布=冻结」：已发布的卷要改动必须先下架。下架后学生端不可见，
   * 可以继续编辑，改完再发布。</p>
   */
  unpublishPaper: (paperId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/unpublish`)
      .then<boolean>(unwrap),

  /**
   * 归档试卷（草稿/已发布 → 已归档）
   *
   * <p>归档后只读留档：不可修改、不可再发布，学生端也不可见。</p>
   */
  archivePaper: (paperId: number) =>
    http()
      .put(`/v2/edu/paper/${paperId}/archive`)
      .then<boolean>(unwrap),
  /** 试卷修改历史列表 */
  getPaperHistory: (paperId: number) =>
    http()
      .get(`/v2/edu/paper/${paperId}/history`)
      .then<PaperHistoryItem[]>(unwrap),
  /** 试卷修改历史详情（含试卷快照） */
  getPaperHistoryDetail: (historyId: number) =>
    http()
      .get(`/v2/edu/paper/history/${historyId}`)
      .then<PaperHistoryItem>(unwrap),
  /** 扫码识卷：按二维码短码取试卷 */
  getPaperByQr: (no: string) =>
    http()
      .get(`/v2/edu/paper/qr/${no}`)
      .then<PaperQuestionQr>(unwrap),

  // 试卷模板（edu_paper_template）
  /** 模板分页列表（PaperView 选模板下拉用） */
  getPaperTemplatePage: (params: { pageNum?: number; pageSize?: number; name?: string; style?: string; status?: number; templateStatus?: number } = {}) =>
    http()
      .get("/v2/edu/paper-template/page")
      .query(params)
      .then<PageResult<PaperTemplate>>(unwrap),
  /** 模板详情 */
  getPaperTemplate: (id: number) =>
    http()
      .get(`/v2/edu/paper-template/${id}`)
      .then<PaperTemplate>(unwrap),
  /** 新建模板（DataConfigView 保存用），返回模板 ID */
  savePaperTemplate: (data: Partial<PaperTemplate>) =>
    http()
      .post("/v2/edu/paper-template")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 更新模板 */
  updatePaperTemplate: (id: number, data: Partial<PaperTemplate>) =>
    http()
      .put(`/v2/edu/paper-template/${id}`)
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  /** 删除模板 */
  deletePaperTemplate: (id?: number) =>
    http()
      .delete(`/v2/edu/paper-template/${id}`)
      .then<boolean>(unwrap),
};
