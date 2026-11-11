import type { ApiContext } from "./api-context";
import { type RequestOptions } from "@/framework/context";

/**
 * 人脸重识别 API（后端 {@code /v2/reid}）。
 *
 * <p>与人脸识别（{@code /v2/face}）的分工：</p>
 * <ul>
 *   <li>人脸识别回答「这张脸是谁」——1:1 核对或 1:N 定库检索，底库是<b>事先登记过的人</b>；</li>
 *   <li>重识别回答「<b>这个人</b>刚才从哪个摄像头走进了哪个摄像头」——
 *       底库是<b>实时观测到的轨迹</b>，不需要事先登记。</li>
 * </ul>
 *
 * <p>上传端点走 multipart（{@code file}），不能用 {@code _request} 的 JSON 通道，
 * 统一走 {@code this.client}；返回体是统一的 {@code ReturnResult} 信封，
 * 这里统一拆出 {@code data}。</p>
 */

/** 一条跨帧轨迹（由重识别底库汇聚）。 */
export interface ReidTrack {
  /** 轨迹 ID */
  trackId: string;
  /** 所属分组（分组是第一层隔离，每组一套向量库；后端历史行为空 = default） */
  group?: string;
  /** 出现过的摄像头集合（多个即为跨摄像头出现） */
  cameraIds: string[];
  /** 出现过的来源帧集合 */
  sourceIds: string[];
  /** 首次出现时间戳（毫秒） */
  firstSeen: number;
  /** 最近出现时间戳（毫秒） */
  lastSeen: number;
  /** 观测次数 */
  observations: number;
  /** 是否跨摄像头出现 */
  crossCamera: boolean;
  /** 最近一次观测的纬度（非必填） */
  lat?: number | null;
  /** 最近一次观测的经度（非必填） */
  lng?: number | null;
  /** 关联的人脸姓名（可空） */
  faceName?: string | null;
  /** 最近一次观测的缩略图（可空） */
  thumbnail?: string | null;
}

/** 一张人脸的检测框与归属轨迹（图上叠框用）。 */
export interface ReidFaceBox {
  /** 左上角 X（原图像素） */
  x: number;
  /** 左上角 Y */
  y: number;
  /** 宽 */
  width: number;
  /** 高 */
  height: number;
  /** 归属轨迹 */
  trackId?: string | null;
  /** 与轨迹的相似度 */
  score: number;
  /** 是否命中已有轨迹 */
  matched: boolean;
  /** 检测置信度（决定分流到哪条路） */
  confidence?: number;
  /**
   * 分流类型：`FACE` = 人脸识别（脸清晰，认出了是谁），
   * `REID` = 重识别（脸模糊，只知道这个人去过哪），
   * `INVALID` = 不合规（低于 ReID 阈值，只提示不落库）。
   */
  matchType?: "FACE" | "REID" | "INVALID" | null;
  /** 认出的姓名（人脸识别命中时非空） */
  faceName?: string | null;
  /** 分流原因（不合规时的提示文案；其余为空） */
  reason?: string | null;
}

/**
 * 登记入库（底库入口）的结果。
 *
 * <p>底库只收单人图：多脸时后端拒绝并回「请裁剪」，本接口不会返回成功。</p>
 */
export interface ReidEnrollResult {
  /** 后端提示文案（成功时固定「已登记」） */
  message?: string;
  /** 底库行标识（两套特征共用） */
  id?: string;
  /** 登记时的分流结论：FACE / REID */
  decision?: "FACE" | "REID" | null;
  /** 检出人脸数（成功时必为 1） */
  faceCount?: number;
  /** 是否两套特征都提取到了 */
  extracted?: boolean;
}

/** 观测一帧的结果。 */
export interface ReidObserveResult {
  /** 实际使用的摄像头标识 */
  cameraId: string;
  /** 实际使用的来源帧标识 */
  sourceId: string;
  /** 本帧检出人脸数 */
  faceCount: number;
  /** 本帧涉及的轨迹 ID 列表 */
  trackIds: string[];
  /** 其中命中已有轨迹的数量 */
  matched: number;
  /** 其中新建轨迹的数量 */
  newTracks: number;
  /** 其中走人脸识别的数量（脸清晰，认得出是谁） */
  faceMatches?: number;
  /** 其中走重识别的数量（脸模糊/远处，只能给轨迹） */
  reidMatches?: number;
  /** 其中判为「不合规」的数量（低于 ReID 阈值，不落库、不出结果行） */
  invalidCount?: number;
  /** 逐张脸的检测框（供叠加层画框） */
  faces?: ReidFaceBox[];
}

/** 以图搜人的命中项。 */
export interface ReidHit {
  /** 轨迹 ID（人脸识别命中时为人脸库条目 ID） */
  trackId: string;
  /** 相似度（余弦，越大越像） */
  similarity: number;
  /** 轨迹详情（后端字段名 track，与人脸底库同口径） */
  track: ReidTrack | null;
  /**
   * 分流类型：`FACE` = 人脸识别（脸清晰，认出了是谁），
   * `REID` = 重识别（脸模糊，只知道这个人去过哪）。
   */
  matchType?: "FACE" | "REID" | null;
  /** 认出的姓名（人脸识别命中时非空） */
  faceName?: string | null;
}

/** 轨迹列表查询参数。 */
export interface ReidTracksParams {
  /** 只看某个摄像头的轨迹 */
  cameraId?: string;
  /** 只看跨摄像头轨迹 */
  crossOnly?: boolean;
  /** 返回上限 */
  limit?: number;
  /**
   * 只看某个分组的轨迹。
   *
   * <p>不传时后端按 {@code default} 处理（历史行 group 为 NULL，逻辑上归属 default），
   * 与旧调用方的行为一致。</p>
   */
  group?: string;
}

/** 轨迹统计。 */
export interface ReidStats {
  /** 重识别能力是否就绪 */
  available: boolean;
  /** 当前轨迹数 */
  tracks: number;
  /** 当前配置摘要 */
  config?: string;
  /** 统计口径所属分组（后端未回传时为空） */
  group?: string;
}

/** 重识别底库的一条观测记录（一份人员信息，不做跨帧轨迹汇聚）。 */
export interface ReidLibraryItem {
  /** 底库记录 ID（即底层向量标识） */
  id: string;
  /** 所属分组（历史数据缺失时按 default 展示） */
  group?: string | null;
  /** 摄像头标识 */
  cameraId?: string | null;
  /** 记录名 */
  name?: string | null;
  /** 关联的人脸姓名（人脸识别命中时非空） */
  faceName?: string | null;
  /** 最近一次观测的纬度（可空） */
  lat?: string | number | null;
  /** 最近一次观测的经度（可空） */
  lng?: string | number | null;
  /** 最近一次观测的缩略图（可空） */
  thumbnail?: string | null;
  /** 观测时间（后端返回 LocalDateTime 字符串） */
  createTime?: string | null;
}

/** 一张脸的检索结果（识别入口逐脸返回：一张脸一行，多脸即多行）。 */
export interface ReidFaceResult {
  /** 第几张脸（从 1 开始，按检测框在图中出现顺序） */
  index: number;
  /** 该脸的检测框 */
  box: ReidFaceBox;
  /** 检测置信度（三档分流的判据） */
  confidence: number;
  /**
   * 分流结论：`FACE` = 人脸识别管线，`REID` = 重识别管线，
   * `INVALID` = 不合规（低于 ReID 阈值，只提示、不出结果）。
   */
  decision: "FACE" | "REID" | "INVALID";
  /** 不合规时的提示文案（其余为空） */
  reason?: string | null;
  /** 该脸命中的记录（不合规或未命中时为空数组） */
  hits: ReidHit[];
}

/** 底库观测记录列表查询参数。 */
export interface ReidLibraryParams {
  /** 只看某个分组的观测记录（不传 = 当前分组下的全部观测） */
  group?: string;
}

export interface ReidApi {
  /** 观测一帧：检测人脸并归并进跨帧轨迹 */
  observeReid(
    file: File | Blob,
    cameraId?: string,
    sourceId?: string,
    filename?: string,
    lat?: number | null,
    lng?: number | null,
    /** 落库分组，缺省 = default */
    group?: string,
  ): Promise<ReidObserveResult>;
  /**
   * 登记入库（底库入口）：只接受单人图。
   *
   * <p>多脸由后端拒绝并返回「请裁剪到只含目标人脸后重试」，
   * 不会悄悄挑一张脸入库 —— 底库一行对应一个人。</p>
   *
   * @param id       人员标识（底库行的向量标识，两套特征共用）
   * @param metadata 附加元数据（可含 name / cameraId / lat / lng）
   * @param group    落库分组，缺省 = default
   */
  enrollReid(
    file: File | Blob,
    id: string,
    metadata?: Record<string, unknown>,
    filename?: string,
    group?: string,
  ): Promise<ReidEnrollResult>;
  /**
   * 以图搜人：在已有轨迹中检索最相似的人。
   *
   * @param groups 检索范围（多分组一起搜），缺省 = default；单组传 `[g]` 即可
   */
  searchReid(file: File | Blob, topK?: number, filename?: string, groups?: string[]): Promise<ReidHit[]>;
  /**
   * 以图搜人（逐脸）：一张脸一行结果，多脸就是多行，不合并。
   *
   * <p>每张脸按自己的检测置信度走三档：≥ 人脸阈值 → 人脸识别；
   * 低于人脸阈值但 ≥ ReID 阈值 → 重识别；都不到 → 不合规（只回提示）。</p>
   *
   * @param groups 检索范围（多分组一起搜），缺省 = default；单组传 `[g]` 即可
   */
  searchReidFaces(file: File | Blob, topK?: number, filename?: string, groups?: string[]): Promise<ReidFaceResult[]>;
  /** 列出轨迹 */
  listReidTracks(params?: ReidTracksParams): Promise<ReidTrack[]>;
  /** 列出底库观测记录（人员，不做跨帧轨迹汇聚） */
  listReidLibrary(params?: ReidLibraryParams): Promise<ReidLibraryItem[]>;
  /** 轨迹详情 */
  getReidTrack(trackId: string, group?: string): Promise<ReidTrack | null>;
  /** 轨迹统计 */
  getReidStats(): Promise<ReidStats>;
  /** 清空轨迹（只清指定分组，缺省 = default） */
  clearReidTracks(group?: string): Promise<number>;
  /** 当前账号下已存在数据的分组名（不含 default 的兜底，由调用方自行补） */
  listReidGroups(): Promise<string[]>;
}

/** 拆 ReturnResult 信封；兼容部分链路已拆好的情况。 */
function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && "code" in res) {
    return res.data as T;
  }
  return res as T;
}

/**
 * 拼 multipart；后端形参名固定为 file。
 */
function toForm(file: File | Blob, filename = "reid.png"): FormData {
  const form = new FormData();
  form.append("file", file, filename);
  return form;
}

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
 * multipart 请求选项。
 *
 * <p>刻意不手写 {@code Content-Type}：boundary 必须由底层 HTTP 客户端生成。</p>
 */
const MULTIPART: RequestOptions = {};

export const reidApi: ReidApi = {
  async observeReid(
    this: ApiContext,
    file: File | Blob,
    cameraId?: string,
    sourceId?: string,
    filename = "reid.png",
    lat?: number | null,
    lng?: number | null,
    group?: string,
  ): Promise<ReidObserveResult> {
    const form = toForm(file, filename);
    if (cameraId) {
      form.append("cameraId", cameraId);
    }
    if (sourceId) {
      form.append("sourceId", sourceId);
    }
    // 经纬度为**非必填**：只在用户确实填了的时候带上，
    // 传空串会让后端 BigDecimal 解析失败（400），而不是"当作没填"。
    if (typeof lat === "number" && Number.isFinite(lat)) {
      form.append("lat", String(lat));
    }
    if (typeof lng === "number" && Number.isFinite(lng)) {
      form.append("lng", String(lng));
    }
    // 同样「没选就不带」：空串会让后端把观测落到一个空分组里
    const g = normalizeGroup(group);
    if (g) {
      form.append("group", g);
    }
    const res = await this.client.post("/reid/observe", form, MULTIPART);
    const data = unwrap<Partial<ReidObserveResult>>(res);
    const faces = Array.isArray(data?.faces) ? data.faces : [];
    return {
      cameraId: data?.cameraId ?? cameraId ?? "",
      sourceId: data?.sourceId ?? sourceId ?? "",
      faceCount: Number(data?.faceCount ?? 0),
      trackIds: Array.isArray(data?.trackIds) ? data.trackIds : [],
      matched: Number(data?.matched ?? 0),
      newTracks: Number(data?.newTracks ?? 0),
      // 后端未回传分流统计时按每张脸的 matchType 现场统计，保证 UI 始终有数
      faceMatches: Number(
        data?.faceMatches ?? faces.filter((f) => f.matchType === "FACE").length,
      ),
      reidMatches: Number(
        data?.reidMatches ?? faces.filter((f) => f.matchType === "REID").length,
      ),
      invalidCount: Number(
        data?.invalidCount ?? faces.filter((f) => f.matchType === "INVALID").length,
      ),
      faces,
    };
  },

  async enrollReid(
    this: ApiContext,
    file: File | Blob,
    id: string,
    metadata?: Record<string, unknown>,
    filename = "reid-enroll.png",
    group?: string,
  ): Promise<ReidEnrollResult> {
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
    const res = await this.client.post("/reid/enroll", form, MULTIPART);
    return unwrap<ReidEnrollResult>(res);
  },

  async searchReid(
    this: ApiContext,
    file: File | Blob,
    topK?: number,
    filename = "reid.png",
    groups?: string[],
  ) {
    const form = toForm(file, filename);
    if (typeof topK === "number" && topK > 0) {
      form.append("topK", String(topK));
    }
    // 后端收逗号分隔的多分组（单参 `group`），没选分组时不带，由后端按 default 兜底
    const joined = joinGroups(groups);
    if (joined) {
      form.append("group", joined);
    }
    const res = await this.client.post("/reid/search", form, MULTIPART);
    const data = unwrap<{ hits?: ReidHit[] }>(res);
    return Array.isArray(data?.hits)
      ? data.hits.map((hit) => ({
          ...hit,
          matchType: hit?.matchType ?? null,
          faceName: hit?.faceName ?? hit?.track?.faceName ?? null,
        }))
      : [];
  },

  async searchReidFaces(
    this: ApiContext,
    file: File | Blob,
    topK?: number,
    filename = "reid.png",
    groups?: string[],
  ): Promise<ReidFaceResult[]> {
    const form = toForm(file, filename);
    if (typeof topK === "number" && topK > 0) {
      form.append("topK", String(topK));
    }
    const joined = joinGroups(groups);
    if (joined) {
      form.append("group", joined);
    }
    const res = await this.client.post("/reid/search", form, MULTIPART);
    const data = unwrap<{ faces?: ReidFaceResult[] }>(res);
    if (!Array.isArray(data?.faces)) {
      return [];
    }
    return data.faces.map((face, i) => ({
      index: Number(face?.index ?? i + 1),
      box: face?.box ?? { x: 0, y: 0, width: 0, height: 0, score: 0, matched: false },
      confidence: Number(face?.confidence ?? face?.box?.confidence ?? 0),
      decision: (face?.decision ?? "INVALID") as ReidFaceResult["decision"],
      reason: face?.reason ?? null,
      hits: Array.isArray(face?.hits)
        ? face.hits.map((hit) => ({
            ...hit,
            matchType: hit?.matchType ?? null,
            faceName: hit?.faceName ?? hit?.track?.faceName ?? null,
          }))
        : [],
    }));
  },

  async listReidTracks(this: ApiContext, params?: ReidTracksParams): Promise<ReidTrack[]> {
    const res = await this._request("/reid/tracks", {
      params: params
        ? {
            cameraId: params.cameraId || undefined,
            crossOnly: params.crossOnly ? true : undefined,
            limit: params.limit || undefined,
            group: normalizeGroup(params.group),
          }
        : undefined,
    });
    const data = unwrap<{ tracks?: ReidTrack[] }>(res);
    return Array.isArray(data?.tracks) ? data.tracks : [];
  },

  /**
   * 列出底库观测记录。
   *
   * <p>观测记录是一份人员信息（摄像头、时间、姓名、坐标），<b>不做跨帧轨迹汇聚</b> ——
   * 每一条就是库里的一个人，既没有“跨镜”的语义，也不依赖轨迹聚合接口。</p>
   */
  async listReidLibrary(this: ApiContext, params?: ReidLibraryParams): Promise<ReidLibraryItem[]> {
    const res = await this._request("/reid/library", {
      params: params ? { group: normalizeGroup(params.group) } : undefined,
    });
    const data = unwrap<{ items?: ReidLibraryItem[] }>(res);
    return Array.isArray(data?.items) ? data.items : [];
  },

  async getReidTrack(this: ApiContext, trackId: string, group?: string): Promise<ReidTrack | null> {
    const res = await this._request(`/reid/tracks/${encodeURIComponent(trackId)}`, {
      params: { group: normalizeGroup(group) },
    });
    const data = unwrap<ReidTrack | null>(res);
    return data && typeof data === "object" ? data : null;
  },

  async getReidStats(this: ApiContext): Promise<ReidStats> {
    const res = await this._request("/reid/stats");
    const data = unwrap<Partial<ReidStats>>(res);
    return {
      available: !!data?.available,
      tracks: Number(data?.tracks ?? 0),
      config: typeof data?.config === "string" ? data.config : undefined,
      group: typeof data?.group === "string" ? data.group : undefined,
    };
  },

  async clearReidTracks(this: ApiContext, group?: string): Promise<number> {
    // 只清当前分组：分组是第一层隔离，清空动作不该越界删掉别的分组的数据
    const res = await this._request("/reid/tracks", {
      method: "DELETE",
      params: { group: normalizeGroup(group) },
    });
    const data = unwrap<{ cleared?: number }>(res);
    return Number(data?.cleared ?? 0);
  },

  async listReidGroups(this: ApiContext): Promise<string[]> {
    const res = await this._request("/reid/groups");
    return toGroups(res);
  },
};
