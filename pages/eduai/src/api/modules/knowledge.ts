/**
 * 教育 AI API —— 知识点 / 知识库文档 / 错题。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  PageResult,
  KnowledgePoint,
  KnowledgePointUploadResult,
  KnowledgeCard,
  KnowledgeFileItem,
  KnowledgeDoc,
  WrongQuestion,
  WrongSource,
} from "../types";
import { unwrap } from "./unwrap";

export const knowledgeApi = {
  // 知识点
  treeKnowledge: (params: { subject?: string; gradeLevel?: string; grade?: string } = {}) =>
    http()
      .get("/v2/edu/knowledge-point/tree")
      .query(params)
      .then<KnowledgePoint[]>(unwrap),
  /** 关键字扁平检索（题目知识点远程多选用） */
  listKnowledge: (params: { keyword?: string; subject?: string; limit?: number } = {}) =>
    http()
      .get("/v2/edu/knowledge-point/list")
      .query(params)
      .then<KnowledgePoint[]>(unwrap),
  /** 知识卡片扁平列表（含正文标记与附件计数） */
  listKnowledgeCards: (params: { keyword?: string; subject?: string; gradeLevel?: string; grade?: string } = {}) =>
    http()
      .get("/v2/edu/knowledge-point/cards")
      .query(params)
      .then<KnowledgeCard[]>(unwrap),
  /** 卡片详情（含富文本正文） */
  getKnowledgePoint: (id: number) =>
    http()
      .get(`/v2/edu/knowledge-point/${id}`)
      .then<KnowledgePoint>(unwrap),
  /** 卡片下附件条目列表 */
  listKnowledgeFiles: (knowledgePointId: number) =>
    http()
      .get(`/v2/edu/knowledge-point/${knowledgePointId}/files`)
      .then<KnowledgeFileItem[]>(unwrap),
  /** 把已上传附件绑定到卡片 */
  bindKnowledgeFile: (data: {
    knowledgePointId: number;
    knowledgeFileName?: string;
    knowledgeFilePath?: string;
    knowledgeFileType?: string;
    knowledgeFileSize?: number;
  }) =>
    http()
      .post("/v2/edu/knowledge-point/file/bind")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 删除卡片附件条目（逻辑删除） */
  deleteKnowledgeFile: (id: number) =>
    http()
      .delete(`/v2/edu/knowledge-point/file/${id}`)
      .then<boolean>(unwrap),
  saveKnowledgePoint: (data: Partial<KnowledgePoint>) =>
    http()
      .post("/v2/edu/knowledge-point/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  deleteKnowledgePoint: (id: number) =>
    http()
      .delete(`/v2/edu/knowledge-point/${id}`)
      .then<boolean>(unwrap),
  /** 上传知识点附件（图片/PDF/DOCX），返回相对路径供 save 绑定 */
  uploadKnowledgeFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http()
      .post("/v2/edu/knowledge-point/upload")
      .data(form)
      .then<KnowledgePointUploadResult>(unwrap);
  },
  /** 附件直链预览地址（后端已 whitelist，img/iframe 可直接带 path 访问） */
  knowledgeFileUrl: (path?: string) =>
    path ? `/v2/edu/knowledge-point/file?path=${encodeURIComponent(path)}` : "",

  // 知识库文档
  pageDocs: (params: { page?: number; pageSize?: number; knowledgeDocName?: string; knowledgeDocSubject?: string; knowledgeDocStatus?: number } = {}) =>
    http()
      .get("/v2/edu/knowledge-doc/page")
      .query(params)
      .then<PageResult<KnowledgeDoc>>(unwrap),
  uploadDoc: (data: Partial<KnowledgeDoc> & { filePath?: string; fileSize?: number }) =>
    http()
      .post("/v2/edu/knowledge-doc/upload")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  searchDocs: (params: { keyword: string; subject?: string; limit?: number }) =>
    http()
      .get("/v2/edu/knowledge-doc/search")
      .query(params)
      .then<PageResult<KnowledgeDoc>>(unwrap),
  deleteDoc: (id: number) =>
    http()
      .delete(`/v2/edu/knowledge-doc/${id}`)
      .then<boolean>(unwrap),

  // 错题
  listWrongQuestions: (params: { studentId?: string; subject?: string; masteryLevel?: number; pageNum?: number; pageSize?: number } = {}) =>
    http()
      .get("/v2/edu/wrongbook/page")
      .query(params)
      .then<PageResult<WrongQuestion>>(unwrap),
  reviewWrongbook: (data: { studentId?: string; count?: number; subject?: string }) =>
    http()
      .post("/v2/edu/wrongbook/review")
      .data(data as Record<string, unknown>)
      .then<number[]>(unwrap),
  updateMastery: (wrongId: number, masteryLevel: number) =>
    http()
      .put("/v2/edu/wrongbook/mastery")
      .query({ wrongId, masteryLevel })
      .then<boolean>(unwrap),
  markCorrected: (wrongId: number) =>
    http()
      .put(`/v2/edu/wrongbook/correct/${wrongId}`)
      .then<boolean>(unwrap),
  wrongSources: (wrongId: number) =>
    http()
      .get(`/v2/edu/wrongbook/sources/${wrongId}`)
      .then<WrongSource[]>(unwrap),
};
