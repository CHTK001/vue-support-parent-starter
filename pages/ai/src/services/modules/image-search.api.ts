import type { ApiContext } from "./api-context";
import { type RequestOptions } from "@/framework/context";

/**
 * 以图搜图 API（后端 {@code /v2/image-search}）。
 *
 * <p>上传端点走 multipart（{@code file}）而非 {@code _request} 的 JSON 通道，
 * 因为数据被框架包装成了 {@code ReturnResult} 信封（{@code {code,data,msg}}），
 * 这里统一拆出 {@code data}，调用方不必再判信封。
 * 图片端点返回二进制流，走框架的 {@code client}（自动带上 Bearer 令牌），
 * 不自行拼令牌进 URL（令牌一旦进 URL 就会落在历史、Referer 与访问日志里）。</p>
 */

/** 图像底库的一条记录。 */
export interface ImageItem {
  id: number;
  /** 前端展示用标识，形式为 {@code img-<id>} */
  vectorId?: string;
  name?: string;
  tags?: string[];
  thumbnail?: string | null;
  /** 后端给的相对路径（不带 /v2 前缀），由调用方交给 {@link resolveImageUrl} 解析 */
  url?: string | null;
  /** 后端是否留有原图；false 表示只能看缩略图 */
  hasOriginal?: boolean;
  width?: number;
  height?: number;
  /** 原图字节数；历史记录为 null（未知） */
  size?: number | null;
  /** 入库时间 */
  createdAt?: string | null;
}

/** 以图检索的命中项：同 `ImageItem` 口径，多一个相似度。 */
export interface ImageSearchHit {
  id?: number;
  vectorId?: string;
  name?: string;
  tags?: string[];
  thumbnail?: string | null;
  url?: string | null;
  hasOriginal?: boolean;
  width?: number;
  height?: number;
  size?: number | null;
  /** 与查询图的相似度（余弦，0~1） */
  score?: number | null;
}

/** 加入底库后的返回。 */
export interface ImageIndexed {
  id: number;
  name: string;
  /** 特征向量维度（与所选特征模型绑定） */
  dimension: number;
}

/** 底库状态。 */
export interface ImageSearchStatus {
  /** 是否已配置特征模型 */
  available: boolean;
  /** 当前模型标识 */
  model: string;
  /** 向量存储引擎标识 */
  storage: string;
  /** 底库记录数 */
  count: number;
  /** 特征向量维度 */
  dimension: number;
}

/** 底库记录列表。 */
export interface ImageListPage {
  items: ImageItem[];
  /** 命中总数（受 keyword 影响） */
  total: number;
}

/** `GET /image-search/list` 的可选查询参数。 */
export interface ImageListParams {
  /** 页码（从 1 开始）；与 size 同时传才启用服务端分页 */
  page?: number;
  /** 每页条数（后端上限 200） */
  size?: number;
  /** 关键词：匹配 name 与 tags，大小写不敏感 */
  keyword?: string;
  /**
   * 只列某个分组（单组口径：后端 {@code /image-search/list} 不收逗号分隔的多分组）。
   *
   * <p>不传时后端按 {@code default} 处理（历史行 group 为 NULL，逻辑上归属 default），
   * 与旧调用方的行为一致。</p>
   */
  group?: string;
}

/** `POST /image-search/search` 的回传结果载体（与 {@link ImageSearchHit} 同行）。 */
export type ImageSearchList = ImageSearchHit[];

export interface ImageSearchApi {
  /** 以图搜图状态（是否已配置特征模型、当前模型、底库规模） */
  status(): Promise<ImageSearchStatus>;
  /** 当前账号下已存在数据的分组名（不含 default 的兜底，由调用方自行补） */
  listImageGroups(): Promise<string[]>;
  /** 把一张图加入底库（特征提取 + 写入） */
  indexImage(file: File | Blob, name?: string, group?: string): Promise<ImageIndexed>;
  /** 以图检索：在选中的分组集合中找相似图 */
  searchImage(
    file: File | Blob,
    topK?: number,
    filename?: string,
    groups?: string[],
  ): Promise<ImageSearchHit[]>;
  /** 列出底库记录（分页 + 关键词 + 单组筛选） */
  listImage(params?: ImageListParams): Promise<ImageListPage>;
  /** 从底库删除一条（后端同步删向量索引与快照） */
  deleteImage(id: number, group?: string): Promise<boolean>;
  /**
   * 取一条底库记录的原图（后端在登记时落存的原图）二进制。
   *
   * <p>注意这个端点没有 `group` 参数：后端对 `{id}/image` 始终走默认组的 Store，
   * 所以它只适合按 id 盲取，分组筛选应交给 `url` + {@link resolveImageUrl} 的
   *鉴权加载器，不要依赖它看大图。</p>
   *
   * @param id 底库记录标识
   * @return 原图二进制；无图时 null
   */
  imageBlob(id: number): Promise<Blob | null>;
}

/** 拆 ReturnResult 信封；兼容部分链路已拆好的情况。 */
export function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && "code" in res) {
    return res.data as T;
  }
  return res as T;
}

/** 拼 multipart；后端形参名固定为 file。 */
export function toForm(file: File | Blob, filename = "image.png"): FormData {
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
 * 于是「用户没选分组»会变成一个不存在的空分组，数据落到谁都看不见的地方。</p>
 *
 * @param group 分组名
 * @returns 去除首尾空白后的分组名；空则 undefined
 */
export function normalizeGroup(group?: string | null): string | undefined {
  const g = typeof group === "string" ? group.trim() : "";
  return g || undefined;
}

/**
 * 多分组参数归一化：去空、去重后逗号连接。
 *
 * @param groups 分组名数组
 * @returns 形如 `g1,g2`；无有效项时 undefined（后端按 default 处理）
 */
export function joinGroups(groups?: string[] | null): string | undefined {
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
export function toGroups(res: unknown): string[] {
  const data = unwrap<{ groups?: unknown }>(res);
  const raw = Array.isArray(data?.groups) ? data.groups : [];
  return [...new Set(raw.map((g) => String(g ?? "").trim()).filter(Boolean))];
}

/**
 * 拼「查看大图」端点地址。
 *
 * <p>注意：本端点没有 `group` 参数（与 `/list` 的团队分离），所以不搞地址拼接，
 * 直接返回相对路径（由 `client.get` 拼上 baseURL）。分组筛选请走 `url` 字段
 * 与 {@link resolveImageUrl}。</p>
 */
function imageIdPath(id: number): string {
  return `/image-search/${id}/image`;
}

export const imageSearchApi: ImageSearchApi = {
  async status(this: ApiContext) {
    const res = await this._request("/image-search/status");
    const data = unwrap<Partial<ImageSearchStatus>>(res) ?? {};
    return {
      available: !!data.available,
      model: typeof data.model === "string" ? data.model : "",
      storage: typeof data.storage === "string" ? data.storage : "",
      count: Number(data.count ?? 0),
      dimension: Number(data.dimension ?? 0),
    };
  },

  async listImageGroups(this: ApiContext): Promise<string[]> {
    const res = await this._request("/image-search/groups");
    return toGroups(res);
  },

  async indexImage(this: ApiContext, file: File | Blob, name?: string, group?: string) {
    // multipart 的形参名固定为 `file`；`name` 是后端的展示名，两个不是一回事。
    // 这里的 part 文件名直接取文件自身名字（File 才有 name），不加混淆。
    const form = toForm(file, (file as File).name || 'image.png');
    if (name) {
      form.append("name", name);
    }
    // 「没选分组就不带」：空串会被后端当成一个空分组名，而不是 default
    const g = normalizeGroup(group);
    if (g) {
      form.append("group", g);
    }
    const res = await this.client.post("/image-search/index", form, MULTIPART);
    return unwrap<ImageIndexed>(res);
  },

  async searchImage(
    this: ApiContext,
    file: File | Blob,
    topK?: number,
    filename = "image.png",
    groups?: string[],
  ) {
    const form = toForm(file, filename);
    if (typeof topK === "number" && topK > 0) {
      form.append("topK", String(topK));
    }
    // 检索范围：后端收逗号分隔的多分组；没选时不带，由后端按 default 兜底
    const joined = joinGroups(groups);
    if (joined) {
      form.append("group", joined);
    }
    const res = await this.client.post("/image-search/search", form, MULTIPART);
    const data = unwrap<ImageSearchList | { items?: ImageSearchList } | null>(res);
    return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  },

  async listImage(this: ApiContext, params?: ImageListParams) {
    const res = await this._request("/image-search/list", {
      params: params
        ? {
            page: params.page || 1,
            size: params.size || 24,
            keyword: params.keyword || undefined,
            group: normalizeGroup(params.group),
          }
        : undefined,
    });
    const data = unwrap<{ items?: ImageItem[]; total?: number }>(res) ?? {};
    const items = Array.isArray(data.items) ? data.items : [];
    const total = typeof data.total === "number" ? data.total : items.length;
    return { items, total };
  },

  async deleteImage(this: ApiContext, id: number, group?: string) {
    const res = await this._request(`/image-search/${id}`, {
      method: "DELETE",
      params: { group: normalizeGroup(group) },
    });
    return unwrap<boolean>(res) === true;
  },

  async imageBlob(this: ApiContext, id: number): Promise<Blob | null> {
    // 图片端点返回二进制，不能走 JSON 通道；令牌由框架客户端自动带上，
    // 绝不进 URL（与 utils/authImage 同一条口径）。
    if (!id) {
      return null;
    }
    try {
      const res = await this.client.get(imageIdPath(id), { responseType: "blob" });
      return res;
    } catch {
      return null;
    }
  },
};
