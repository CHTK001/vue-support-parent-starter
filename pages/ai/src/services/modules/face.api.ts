import type { ApiContext } from "./api-context";
import { currentToken, type RequestOptions } from "@/framework/context";
import { authHeaders } from "@/utils/token-origin";

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
  /** 所属分组（分组是第一层隔离，每组一套向量库；历史数据为 default） */
  group?: string;
  /** 登记时传入的元数据（label/name/age/gender/hair/idCard/photogenic/note） */
  [k: string]: unknown;
}

/** `GET /face/list` 的可选查询参数；不传任何参数时后端返回全量（兼容旧调用方）。 */
export interface FaceListParams {
  /** 页码（从 1 开始）；与 size 同时传才启用服务端分页 */
  page?: number;
  /** 每页条数（后端上限 500） */
  size?: number;
  /** 关键词：匹配 id 与元数据字符串字段，大小写不敏感 */
  keyword?: string;
  /** 状态筛选：thumb=有图 / noThumb=无图 */
  status?: string;
  /** 排序字段：id / hasImage / 或元数据键（name、age、idCard…） */
  sortField?: string;
  /** 排序方向：asc / desc */
  sortOrder?: string;
  /**
   * 只列某个分组的条目。
   *
   * <p>不传时后端按 {@code default} 处理（历史行 group 为 NULL，逻辑上归属 default），
   * 与旧调用方的行为一致。</p>
   */
  group?: string;
}

/** 人脸库全库统计（不受 keyword/status/sort 筛选影响）。 */
export interface FaceListStats {
  /** 全库条目数 */
  total: number;
  /** 服务端有登记图的条数 */
  withImage: number;
  /** 身份证已填的条数 */
  withIdCard: number;
}

/** `GET /face/list` 的返回体。 */
export interface FaceListPage {
  items: FaceLibraryItem[];
  /** **命中**总数（受 keyword/status 影响；分页时用于翻页） */
  total: number;
  /** 全库统计（服务端返回；全量模式下由调用方兜底推算） */
  stats?: FaceListStats;
}

/** 人脸关键点管线结果：坐标为**原图像素**（可直接叠加到原图上）。 */
export interface FaceLandmarkResult {
  /** 是否检出人脸并取到关键点 */
  matched: boolean;
  /** 取点所用的人脸框（原图像素） */
  box?: FaceBox | null;
  /** 扁平坐标 `[x1,y1,x2,y2,...]`，**原图像素** */
  points: number[];
  /** 关键点个数 */
  count: number;
  /** 模型输出的归一化约定：true=[-1,1]，false=[0,1]（排查坐标异常用） */
  signed?: boolean;
  /** 后端耗时至（毫秒） */
  elapsedMs?: number;
}

export interface FaceApi {
  /** 读 `face` 分组配置（检测/特征模型、阈值、topK 等），即「系统设置里的默认模型」 */
  getFaceSettings(): Promise<Record<string, unknown>>;
  /** 可用模型目录，按能力分组（detector / feature / liveness / ...） */
  getFaceModels(): Promise<Record<string, string[]>>;
  /** 当前账号人脸库已登记条目（服务端权威：跨浏览器/跨账号以它为准） */
  listFaces(params?: FaceListParams): Promise<FaceListPage>;
  /** 从当前账号人脸库删除一条（后端同步删向量索引与快照） */
  deleteFace(id: string, group?: string): Promise<boolean>;
  /** 更新一条人脸的档案字段（不重跑检测、不动特征向量） */
  updateFace(id: string, metadata: Record<string, unknown>, group?: string): Promise<boolean>;
  /**
   * 取一条人脸的**登记图**（后端在登记时落存的裁剪脸）二进制。
   *
   * <p>给「看大图 / 画人脸特征点」用。后端没有这张图时（改造前登记的老数据、
   * 登记时裁剪失败）回 404，这里统一转成 `null`，调用方按「无图」降级展示。</p>
   *
   * @param id 人脸标识
   * @param group 所属分组，缺省 = default
   * @return PNG 二进制；无图时 null
   */
  faceImageBlob(id: string, group?: string): Promise<Blob | null>;
  /**
   * 取一条人脸**登记时的原图**二进制。
   *
   * <p>特征点对话框画点必须用它：关键点是原图像素坐标，画在裁剪脸上只会得到
   * 「已经摆正的五个点」，无论模型准不准都看不出问题。后端对改造前登记的老数据
   * 没有原图，回 404，这里同样转成 `null`，调用方回退到 {@link faceImageBlob}
   * 的裁剪图并提示用户。</p>
   *
   * @param id 人脸标识
   * @param group 所属分组，缺省 = default
   * @return 原图二进制；无原图时 null
   */
  originalImageBlob(id: string, group?: string): Promise<Blob | null>;
  /**
   * 人脸修复（超分/去噪/去模糊）。
   *
   * <p>返回二进制而非 JSON：修复结果是一张新图。后端 {@code restore_model} 未配置时
   * 回业务错误，这里吞成 `null`，调用方提示「未配置修复模型」。</p>
   *
   * @param file     待修复图片（一般用原图，没有原图时用裁剪脸）
   * @param filename 文件名
   * @return 修复后的图片二进制；失败时 null
   */
  restoreFace(file: File | Blob, filename?: string): Promise<Blob | null>;
  /** 人脸检测：返回框、关键点、裁剪图、活体分数 */
  detectFace(file: File | Blob, filename?: string): Promise<FaceDetectResult>;
  /**
   * 人脸关键点管线（**坐标为原图像素**，可直接叠加到原图上）。
   *
   * <p>为什么不用 {@code /face/landmark}：那个端点把整图直接喂关键点模型，返回的是
   * 「相对模型输入图」的归一化坐标（±1），画到原图上会挤成一团。本方法走
   * `POST /face/landmark-pipeline`：后端先按检测框裁出最大脸、在裁剪脸上取点，
   * 再映射回原图像素，返回值可直接绘制。模型未配置时后端回业务错误，这里吞成未命中。</p>
   *
   * @param file     图片
   * @param filename 文件名
   * @return 关键点（原图像素）；不可用时 `matched=false`、`points` 为空
   */
  landmarkFace(file: File | Blob, filename?: string): Promise<FaceLandmarkResult>;
  /** 1:N 识别：拿上传图片与向量库里已登记人脸比对 */
  identifyFace(file: File | Blob, filename?: string, groups?: string[]): Promise<FaceIdentifyResult>;
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
    /** 落库分组，缺省 = default */
    group?: string,
  ): Promise<unknown>;
  /**
   * 当前账号下已存在数据的分组名（不含 default 的兜底，由调用方自行补）。
   *
   * <p>分组是第一层隔离：不同分组各自一套向量库，登记/检索/删除都必须带上分组，
   * 否则会落到 default 里，用户会看到「明明登记了却搜不到」。</p>
   */
  listFaceGroups(): Promise<string[]>;
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

/**
 * 分组参数归一化：空白视为「没传」。
 *
 * <p>为什么不把空串直接发给后端：Spring 会把空串绑成 {@code ""} 而不是 null，
 * 于是「用户没选分组」会变成一个不存在的空分组，数据落到谁都看不见的地方。</p>
 *
 * @param group 分组名
 * @returns 去除首尾空白后的分组名；空则 undefined
 */
function normalizeGroup(group?: string | null): string | undefined {
  const g = typeof group === "string" ? group.trim() : "";
  return g || undefined;
}

/**
 * 多分组参数归一化：去空、去重后逗号连接。
 *
 * @param groups 分组名数组
 * @returns 形如 `g1,g2`；无有效项时 undefined（后端按 default 处理）
 */
function joinGroups(groups?: string[] | null): string | undefined {
  if (!Array.isArray(groups)) {
    return undefined;
  }
  const list = [...new Set(groups.map((g) => String(g ?? "").trim()).filter(Boolean))];
  return list.length ? list.join(",") : undefined;
}

/**
 * 拆 `{ groups: string[] }` 信封，顺带把脏数据挡在类型之外。
 *
 * @param res 原始返回
 * @returns 去重后的分组名数组
 */
function toGroups(res: unknown): string[] {
  const data = unwrap<{ groups?: unknown }>(res);
  const raw = Array.isArray(data?.groups) ? data.groups : [];
  return [...new Set(raw.map((g) => String(g ?? "").trim()).filter(Boolean))];
}

/**
 * 拼「图片/原图」端点地址。
 *
 * <p>分组走查询参数：这两个端点与 /list 是同一套分组口径，漏带就会取到 default
 * 里的同名条目图（同一个 id 在不同分组下是两条完全不同的记录）。</p>
 *
 * @param id 人脸标识
 * @param suffix 端点后缀（image / original）
 * @param group 分组名
 * @returns 相对地址（供 fetch 自行拼 baseURL）
 */
function imageUrl(id: string, suffix: string, group?: string): string {
  const g = normalizeGroup(group);
  return `/face/${encodeURIComponent(id)}/${suffix}${g ? `?group=${encodeURIComponent(g)}` : ""}`;
}

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

  async listFaces(this: ApiContext, params?: FaceListParams) {
    const res = await this._request("/face/list", {
      params: params
        ? {
            page: params.page,
            size: params.size,
            keyword: params.keyword || undefined,
            status: params.status || undefined,
            sortField: params.sortField || undefined,
            sortOrder: params.sortOrder || undefined,
            group: normalizeGroup(params.group),
          }
        : undefined,
    });
    const data = unwrap<{ items?: FaceLibraryItem[]; total?: number; stats?: FaceListStats }>(res) ?? {};
    const items = Array.isArray(data.items) ? data.items : [];
    const total = typeof data.total === "number" ? data.total : items.length;
    return { items, total, stats: data.stats };
  },

  async deleteFace(this: ApiContext, id: string, group?: string) {
    const res = await this._request(`/face/${encodeURIComponent(id)}`, {
      method: "DELETE",
      params: { group: normalizeGroup(group) },
    });
    return unwrap<boolean>(res) === true;
  },

  async updateFace(this: ApiContext, id: string, metadata: Record<string, unknown>, group?: string) {
    // 后端返回的是 ReturnResult.ok("更新成功") / error("未找到该人脸：…")
    const res = await this._request(`/face/${encodeURIComponent(id)}`, {
      method: "PUT",
      data: metadata,
      params: { group: normalizeGroup(group) },
    });
    const r = res as any;
    if (r && typeof r === "object" && "code" in r) {
      return r.code === "00000";
    }
    return true;
  },

  async faceImageBlob(this: ApiContext, id: string, group?: string) {
    // 图片端点返回二进制，不能走 JSON 通道；令牌走请求头，绝不进 URL
    // （与 utils/authImage 同一条口径）。
    const token = currentToken();
    if (!token || !id) {
      return null;
    }
    const base = (this.baseURL || "").replace(/\/+$/, "");
    const url = `${base}${imageUrl(id, "image", group)}`;
    try {
      const res = await fetch(url, {
        headers: authHeaders(token, url),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!res.ok) {
        return null;
      }
      return await res.blob();
    } catch {
      return null;
    }
  },

  async originalImageBlob(this: ApiContext, id: string, group?: string) {
    // 与 faceImageBlob 同一条口径：令牌走请求头，绝不进 URL
    const token = currentToken();
    if (!token || !id) {
      return null;
    }
    const base = (this.baseURL || "").replace(/\/+$/, "");
    const url = `${base}${imageUrl(id, "original", group)}`;
    try {
      const res = await fetch(url, {
        headers: authHeaders(token, url),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!res.ok) {
        return null;
      }
      return await res.blob();
    } catch {
      return null;
    }
  },

  async restoreFace(this: ApiContext, file: File | Blob, filename = "face.png") {
    const token = currentToken();
    if (!token) {
      return null;
    }
    const base = (this.baseURL || "").replace(/\/+$/, "");
    const url = `${base}/face/restore`;
    try {
      // 二进制响应，不能走 JSON 通道；与图片端点同一套认证头
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(token, url),
        body: toForm(file, filename),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!res.ok) {
        return null;
      }
      return await res.blob();
    } catch {
      return null;
    }
  },

  async detectFace(this: ApiContext, file: File | Blob, filename = "face.png") {
    const res = await this.client.post("/face/detect", toForm(file, filename), MULTIPART);
    const data = unwrap<FaceDetectResult>(res);
    return { count: data?.count ?? 0, faces: data?.faces ?? [] };
  },

  async identifyFace(this: ApiContext, file: File | Blob, filename = "face.png", groups?: string[]) {
    const form = toForm(file, filename);
    // 检索范围：后端收逗号分隔的多分组；没选时不带，由后端按 default 兜底
    const joined = joinGroups(groups);
    if (joined) {
      form.append("groups", joined);
    }
    const res = await this.client.post("/face/identify", form, MULTIPART);
    const data = unwrap<FaceIdentifyResult>(res);
    return { matched: !!data?.matched, bestId: data?.bestId, bestScore: data?.bestScore, hits: data?.hits ?? [] };
  },

  async landmarkFace(this: ApiContext, file: File | Blob, filename = "face.png") {
    const res = await this.client.post("/face/landmark-pipeline", toForm(file, filename), MULTIPART);
    const data = unwrap<{
      matched?: boolean;
      box?: FaceBox | null;
      points?: number[];
      count?: number;
      signed?: boolean;
      elapsedMs?: number;
    }>(res);
    const pts = Array.isArray(data?.points)
      ? data.points.filter((n) => Number.isFinite(Number(n))).map(Number)
      : [];
    return {
      matched: !!data?.matched && pts.length > 0,
      box: data?.box ?? null,
      points: pts,
      count: typeof data?.count === "number" ? data.count : Math.floor(pts.length / 2),
      signed: data?.signed,
      elapsedMs: data?.elapsedMs,
    };
  },

  async compareFaces(this: ApiContext, fileA: File | Blob, fileB: File | Blob, filenameA = "a.png", filenameB = "b.png") {
    const form = new FormData();
    form.append("fileA", fileA, filenameA);
    form.append("fileB", fileB, filenameB);
    const res = await this.client.post("/face/compare", form, MULTIPART);
    return unwrap<FaceCompareResult>(res);
  },

  async enrollFace(
    this: ApiContext,
    id: string,
    file: File | Blob,
    metadata?: Record<string, unknown>,
    filename = "face.png",
    group?: string,
  ) {
    const form = new FormData();
    form.append("id", id);
    form.append("file", file, filename);
    if (metadata) {
      form.append("metadata", JSON.stringify(metadata));
    }
    // 「没选分组」就不带：空串会被后端当成一个空分组名，而不是 default
    const g = normalizeGroup(group);
    if (g) {
      form.append("group", g);
    }
    const res = await this.client.post("/face/enroll", form, MULTIPART);
    return unwrap<unknown>(res);
  },

  async listFaceGroups(this: ApiContext): Promise<string[]> {
    const res = await this._request("/face/groups");
    return toGroups(res);
  },
};
