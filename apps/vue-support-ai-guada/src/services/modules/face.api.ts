import type { ApiContext } from "./api-context";
import type { RequestOptions } from "@/framework/context";

/**
 * 人脸识别 API（后端 {@code /v2/face}）。
 *
 * <p>全部端点都是 {@code admin} 权限，参数走 multipart（{@code file}），
 * 因此不能用 {@code _request} 的 JSON 通道，统一走 {@code this.client}。
 * 返回体是统一的 {@code ReturnResult} 信封（{@code {code,data,msg}}），
 * 这里统一拆出 {@code data}，调用方不必再判信封。</p>
 */

/** 检测框。坐标与 keypoints 均为「原图像素」，左上角为原点。 */
export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: number;
  /** 人脸关键点，[[x,y], ...]；检测器不吐关键点时为空 */
  keypoints?: number[][] | null;
}

/** 单个检测命中（框 + 裁剪图 + 活体）。 */
export interface FaceHit {
  box: FaceBox;
  /** 裁剪后人脸图，base64（无 jpeg 前缀）；裁剪失败时为空 */
  faceImage?: string | null;
  live: boolean;
  liveScore: number;
}

export interface FaceDetectResult {
  count: number;
  faces: FaceHit[];
}

/** 向量库命中（1:N 检索结果项）。 */
export interface FaceMatch {
  id: string;
  /** 相似度分数；余弦算法下为 0~1，越大越像 */
  score: number;
  metadata?: Record<string, unknown> | null;
  content?: string | null;
}

export interface FaceIdentifyResult {
  matched: boolean;
  bestId?: string | null;
  bestScore?: number;
  hits: FaceMatch[];
}

export interface FaceCompareResult {
  similarity: number;
  matched: boolean;
}

/** {@code face} 分组单项配置。 */
export interface FaceSettingItem {
  field: string;
  value: unknown;
  valueType?: string;
  description?: string;
  sort?: number;
}

/** 人脸库一条已登记条目（服务端权威列表项；metadata 里是登记时传入的档案字段）。 */
export interface FaceLibraryItem {
  id: string;
  /** 登记时传入的元数据（label/name/age/gender/hair/idCard/photogenic/note） */
  [k: string]: unknown;
}

export interface FaceApi {
  /** 读 `face` 分组配置（检测/特征模型、阈值、topK 等），即「系统设置里的默认模型」 */
  getFaceSettings(): Promise<Record<string, unknown>>;
  /** 可用模型目录，按能力分组（detector / feature / liveness / ...） */
  getFaceModels(): Promise<Record<string, string[]>>;
  /** 当前账号人脸库已登记条目（服务端权威：跨浏览器/跨账号以它为准） */
  listFaces(): Promise<{ items: FaceLibraryItem[]; total: number }>;
  /** 从当前账号人脸库删除一条（后端同步删向量索引与快照） */
  deleteFace(id: string): Promise<boolean>;
  /** 人脸检测：返回框、关键点、裁剪图、活体分数 */
  detectFace(file: File | Blob, filename?: string): Promise<FaceDetectResult>;
  /** 1:N 识别：拿上传图片与向量库里已登记人脸比对 */
  identifyFace(file: File | Blob, filename?: string): Promise<FaceIdentifyResult>;
  /** 1:1 比对 */
  compareFaces(
    fileA: File | Blob,
    fileB: File | Blob,
    filenameA?: string,
    filenameB?: string,
  ): Promise<FaceCompareResult>;
  /** 登记人脸入库（跑 detect→crop→liveness→align→feature） */
  enrollFace(
    id: string,
    file: File | Blob,
    metadata?: Record<string, unknown>,
    filename?: string,
  ): Promise<unknown>;
}

/** 拆 ReturnResult 信封；兼容部分链路已拆好的情况。 */
function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && "code" in res) {
    return res.data as T;
  }
  return res as T;
}

/** 拼 multipart；后端形参名固定为 file。 */
function toForm(file: File | Blob, filename = "face.png"): FormData {
  const form = new FormData();
  form.append("file", file, filename);
  return form;
}

/**
 * multipart 请求选项。
 *
 * <p>刻意不手写 {@code Content-Type}：boundary 必须由底层 HTTP 客户端生成，
 * 手写 {@code multipart/form-data} 会丢掉 boundary 参数，后端收到的部件全是坏的。</p>
 */
const MULTIPART: RequestOptions = {};

export const faceApi: FaceApi = {
  async getFaceSettings(this: ApiContext) {
    const res = await this._request("/face/config");
    const items = unwrap<FaceSettingItem[]>(res) ?? [];
    // 后端返回数组，这里折成 field -> value，页面按名字直接取
    const map: Record<string, unknown> = {};
    for (const it of items) {
      if (it && typeof it.field === "string") {
        map[it.field] = it.value;
      }
    }
    return map;
  },

  async getFaceModels(this: ApiContext) {
    const res = await this.client.get("/face/config/models");
    return unwrap<Record<string, string[]>>(res) ?? {};
  },

  async listFaces(this: ApiContext) {
    const res = await this._request("/face/list");
    const data = unwrap<{ items?: FaceLibraryItem[]; total?: number }>(res) ?? {};
    const items = Array.isArray(data.items) ? data.items : [];
    return { items, total: typeof data.total === "number" ? data.total : items.length };
  },

  async deleteFace(this: ApiContext, id: string) {
    const res = await this._request(`/face/${encodeURIComponent(id)}`, { method: "DELETE" });
    return unwrap<boolean>(res) === true;
  },

  async detectFace(this: ApiContext, file: File | Blob, filename = "face.png") {
    const res = await this.client.post("/face/detect", toForm(file, filename), MULTIPART);
    const data = unwrap<FaceDetectResult>(res);
    return { count: data?.count ?? 0, faces: data?.faces ?? [] };
  },

  async identifyFace(this: ApiContext, file: File | Blob, filename = "face.png") {
    const res = await this.client.post("/face/identify", toForm(file, filename), MULTIPART);
    const data = unwrap<FaceIdentifyResult>(res);
    return { matched: !!data?.matched, bestId: data?.bestId, bestScore: data?.bestScore, hits: data?.hits ?? [] };
  },

  async compareFaces(this: ApiContext, fileA: File | Blob, fileB: File | Blob, filenameA = "a.png", filenameB = "b.png") {
    const form = new FormData();
    form.append("fileA", fileA, filenameA);
    form.append("fileB", fileB, filenameB);
    const res = await this.client.post("/face/compare", form, MULTIPART);
    return unwrap<FaceCompareResult>(res);
  },

  async enrollFace(this: ApiContext, id: string, file: File | Blob, metadata?: Record<string, unknown>, filename = "face.png") {
    const form = new FormData();
    form.append("id", id);
    form.append("file", file, filename);
    if (metadata) {
      form.append("metadata", JSON.stringify(metadata));
    }
    const res = await this.client.post("/face/enroll", form, MULTIPART);
    return unwrap<unknown>(res);
  },
};
