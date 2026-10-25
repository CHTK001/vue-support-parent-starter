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
  /** 逐张脸的检测框（供叠加层画框） */
  faces?: ReidFaceBox[];
}

/** 以图搜人的命中项。 */
export interface ReidHit {
  /** 轨迹 ID */
  trackId: string;
  /** 相似度（余弦，越大越像） */
  similarity: number;
  /** 轨迹详情（后端字段名 track，与人脸底库同口径） */
  track: ReidTrack | null;
}

/** 轨迹列表查询参数。 */
export interface ReidTracksParams {
  /** 只看某个摄像头的轨迹 */
  cameraId?: string;
  /** 只看跨摄像头轨迹 */
  crossOnly?: boolean;
  /** 返回上限 */
  limit?: number;
}

/** 轨迹统计。 */
export interface ReidStats {
  /** 重识别能力是否就绪 */
  available: boolean;
  /** 当前轨迹数 */
  tracks: number;
  /** 当前配置摘要 */
  config?: string;
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
  ): Promise<ReidObserveResult>;
  /** 以图搜人：在已有轨迹中检索最相似的人 */
  searchReid(file: File | Blob, topK?: number, filename?: string): Promise<ReidHit[]>;
  /** 列出轨迹 */
  listReidTracks(params?: ReidTracksParams): Promise<ReidTrack[]>;
  /** 轨迹详情 */
  getReidTrack(trackId: string): Promise<ReidTrack | null>;
  /** 轨迹统计 */
  getReidStats(): Promise<ReidStats>;
  /** 清空当前账号的全部轨迹 */
  clearReidTracks(): Promise<number>;
}

/** 拆 ReturnResult 信封；兼容部分链路已拆好的情况。 */
function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && "code" in res) {
    return res.data as T;
  }
  return res as T;
}

/** 拼 multipart；后端形参名固定为 file。 */
function toForm(file: File | Blob, filename = "reid.png"): FormData {
  const form = new FormData();
  form.append("file", file, filename);
  return form;
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
    const res = await this.client.post("/reid/observe", form, MULTIPART);
    const data = unwrap<Partial<ReidObserveResult>>(res);
    return {
      cameraId: data?.cameraId ?? cameraId ?? "",
      sourceId: data?.sourceId ?? sourceId ?? "",
      faceCount: Number(data?.faceCount ?? 0),
      trackIds: Array.isArray(data?.trackIds) ? data.trackIds : [],
      matched: Number(data?.matched ?? 0),
      newTracks: Number(data?.newTracks ?? 0),
      faces: Array.isArray(data?.faces) ? data.faces : [],
    };
  },

  async searchReid(this: ApiContext, file: File | Blob, topK?: number, filename = "reid.png") {
    const form = toForm(file, filename);
    if (typeof topK === "number" && topK > 0) {
      form.append("topK", String(topK));
    }
    const res = await this.client.post("/reid/search", form, MULTIPART);
    const data = unwrap<{ hits?: ReidHit[] }>(res);
    return Array.isArray(data?.hits) ? data.hits : [];
  },

  async listReidTracks(this: ApiContext, params?: ReidTracksParams): Promise<ReidTrack[]> {
    const res = await this._request("/reid/tracks", {
      params: params
        ? {
            cameraId: params.cameraId || undefined,
            crossOnly: params.crossOnly ? true : undefined,
            limit: params.limit || undefined,
          }
        : undefined,
    });
    const data = unwrap<{ tracks?: ReidTrack[] }>(res);
    return Array.isArray(data?.tracks) ? data.tracks : [];
  },

  async getReidTrack(this: ApiContext, trackId: string): Promise<ReidTrack | null> {
    const res = await this._request(`/reid/tracks/${encodeURIComponent(trackId)}`);
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
    };
  },

  async clearReidTracks(this: ApiContext): Promise<number> {
    const res = await this._request("/reid/tracks", { method: "DELETE" });
    const data = unwrap<{ cleared?: number }>(res);
    return Number(data?.cleared ?? 0);
  },
};
