/**
 * 独立文件存储服务器 API 封装（FileStorageServerFilter）
 *
 * 对应后端 FileStorageServerFilter（spring-support-filesystem-starter）暴露的 REST 接口：
 *   1) 路径规则 /{bucket}/{key}，bucket 为注册的存储名（如 local）
 *   2) GET  /{bucket}          — 根目录对象列表（JSON）
 *   3) GET  /{bucket}/{dir}    — 子目录浏览（目录 Key 自动回退列表 JSON）
 *   4) PUT  /{bucket}/{key}    — 上传（body 为原始文件内容）
 *   5) GET  /{bucket}/{key}    — 下载/预览（?download=true 强制附件下载）
 *   6) HEAD /{bucket}/{key}    — 存在性检查（200 存在 / 404 不存在）
 *   7) DELETE /{bucket}/{key}  — 删除
 *
 * 该服务为独立 HTTP 服务（非网关代理），通过 createHttp 指定 baseUrl，
 * 与业务接口共用统一链式请求封装。
 */
import { AxiosError, createHttp } from "@repo/utils";
import type { Http } from "@repo/utils";

/** localStorage 中服务器地址的键名 */
const SERVER_KEY = "filestorage.server";

/** localStorage 中默认存储桶的键名 */
const BUCKET_KEY = "filestorage.bucket";

/** 默认服务器地址 */
export const DEFAULT_SERVER = "http://127.0.0.1:18080";

/** 默认存储桶名称 */
export const DEFAULT_BUCKET = "local";

/**
 * 对象元数据（列表项）
 */
export interface StorageObject {
  /** 对象名称 */
  name: string;
  /** 字节大小 */
  size: number;
  /** 是否为目录 */
  directory: boolean;
  /** 最后修改时间（毫秒时间戳） */
  lastModified?: number;
}

/**
 * 存储桶公开配置（?format=config 返回结构，不含敏感字段）
 */
export interface BucketConfig {
  /** 存储桶名 */
  bucket: string;
  /** 存储实现类简称 */
  storage: string;
  /** 开关 */
  openPreview: boolean;
  /** 开关 */
  openDownload: boolean;
  /** 开关 */
  openRange: boolean;
  /** 开关 */
  openWatermark: boolean;
  /** 开关 */
  openWebjars: boolean;
  /** 开关 */
  openRemoteFile: boolean;
  /** 水印文字（可能为空） */
  watermark: string | null;
  /** 布局开关 */
  layout: boolean;
  /** 布局类型 */
  layoutType: string;
  /** 一次性链接默认有效期（毫秒） */
  oneTimeTtlMs: number;
}

/**
 * 目录列表响应结构
 */
interface ListResponse {
  bucket?: string;
  path?: string;
  count?: number;
  items?: StorageObject[];
}

/**
 * 读取已保存的服务器地址
 *
 * @return 服务器地址（未配置时返回默认值）
 */
export function getServerBase(): string {
  return localStorage.getItem(SERVER_KEY) || DEFAULT_SERVER;
}

/**
 * 保存服务器地址
 *
 * @param value 服务器地址
 */
export function setServerBase(value: string): void {
  localStorage.setItem(SERVER_KEY, value.replace(/\/+$/, ""));
}

/**
 * 读取默认存储桶
 *
 * @return 存储桶名称
 */
export function getDefaultBucket(): string {
  return localStorage.getItem(BUCKET_KEY) || DEFAULT_BUCKET;
}

/**
 * 保存默认存储桶
 *
 * @param value 存储桶名称
 */
export function setDefaultBucket(value: string): void {
  localStorage.setItem(BUCKET_KEY, value);
}

/**
 * 创建指向文件服务器的请求实例
 *
 * 每次调用按最新配置创建，保证地址修改后即时生效。
 *
 * @return Http 实例
 */
function storageHttp(): Http {
  return createHttp({
    baseUrl: getServerBase(),
    useAppConfig: false,
    timeout: 30_000,
  });
}

/**
 * 构建对象访问 URL 路径
 *
 * @param bucket   存储桶名
 * @param key      对象 Key（空表示桶根路径）
 * @return 相对路径，如 /local/docs/a.txt
 */
function objectPath(bucket: string, key = ""): string {
  const encodedKey = key
    ? `/${key.split("/").map(encodeURIComponent).join("/")}`
    : "";
  return `/${encodeURIComponent(bucket)}${encodedKey}`;
}

/**
 * 构建对象完整访问 URL（用于 window.open 直链）
 *
 * @param bucket   存储桶名
 * @param key      对象 Key
 * @param download 是否强制附件下载
 * @return 完整 URL
 */
export function objectUrl(bucket: string, key: string, download = false): string {
  const suffix = download ? "?download=true" : "";
  return `${getServerBase().replace(/\/+$/, "")}${objectPath(bucket, key)}${suffix}`;
}

/**
 * 将异常转换为可读错误消息
 *
 * @param e      捕获的异常
 * @param action 操作描述
 * @return 错误消息
 */
function toErrorMessage(e: unknown, action: string): string {
  if (e instanceof AxiosError && e.response) {
    return `${action}失败（HTTP ${e.response.status}）`;
  }
  return (e as Error)?.message ?? `${action}失败`;
}

/**
 * 查询对象列表（支持子目录）
 *
 * @param bucket 存储桶名
 * @param path   子目录路径（空表示根目录）
 * @return 对象元数据列表
 */
export async function listObjects(bucket: string, path = ""): Promise<StorageObject[]> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket, path))
      .query({ format: "json" })
      .then<ListResponse>((r) => r.data);
    return res.items ?? [];
  } catch (e) {
    throw new Error(toErrorMessage(e, "列表查询"));
  }
}

/**
 * 获取存储桶公开配置
 *
 * @param bucket 存储桶名
 * @return 配置对象
 */
export async function getBucketConfig(bucket: string): Promise<BucketConfig> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket))
      .query({ config: "true" })
      .then<BucketConfig>((r) => r.data);
    return res;
  } catch (e) {
    throw new Error(toErrorMessage(e, "配置获取"));
  }
}

/**
 * 目录树节点
 */
export interface TreeItem {
  /** 目录名 */
  name: string;
  /** 相对路径 */
  path: string;
  /** 子目录 */
  children?: TreeItem[];
}

/**
 * 获取目录树（仅目录，KodExplorer 式左侧文件树）
 *
 * @param bucket 存储桶名
 * @return 树节点数组
 */
export async function getBucketTree(bucket: string): Promise<TreeItem[]> {
  try {
    const res = await storageHttp()
      .get(objectPath(bucket))
      .query({ tree: "true" })
      .then<TreeItem[]>((r) => r.data);
    return res ?? [];
  } catch (e) {
    throw new Error(toErrorMessage(e, "目录树获取"));
  }
}

/**
 * 上传对象（原始内容直传）
 *
 * @param bucket  存储桶名
 * @param key     对象 Key（支持子目录）
 * @param content 文件内容
 */
export async function putObject(bucket: string, key: string, content: Blob | ArrayBuffer): Promise<void> {
  try {
    await storageHttp()
      .put(objectPath(bucket, key))
      .headers({ "Content-Type": "application/octet-stream" })
      .data(content);
  } catch (e) {
    throw new Error(toErrorMessage(e, "上传"));
  }
}

/**
 * 删除对象
 *
 * @param bucket 存储桶名
 * @param key    对象 Key
 */
export async function deleteObject(bucket: string, key: string): Promise<void> {
  try {
    await storageHttp().delete(objectPath(bucket, key));
  } catch (e) {
    throw new Error(toErrorMessage(e, "删除"));
  }
}

/**
 * 存在性检查
 *
 * @param bucket 存储桶名
 * @param key    对象 Key
 * @return true 表示存在
 */
export async function existObject(bucket: string, key: string): Promise<boolean> {
  try {
    const res = await storageHttp().head(objectPath(bucket, key));
    return res.status === 200;
  } catch (e) {
    // 404 表示不存在，属于正常业务结果；其余异常向上抛出
    if (e instanceof AxiosError && e.response?.status === 404) {
      return false;
    }
    throw new Error(toErrorMessage(e, "存在性检查"));
  }
}

/**
 * 创建访问链接
 *
 * @param bucket  存储桶名
 * @param key     对象 Key
 * @param type    链接类型：once=一次性（访问即销毁）/ expiry=限时（有效期内多次访问）
 * @param expires 过期时间（秒），如 60（1分钟）、600（10分钟）、3600（1小时）、86400（1天）
 * @return 链接信息
 */
export async function createOneTimeLink(
  bucket: string,
  key: string,
  expires?: number,
  type: "once" | "expiry" = "once",
): Promise<{ token: string; url: string; type: string; expires: string }> {
  try {
    const params: Record<string, string> = { bucket, key, type };
    if (expires != null && expires > 0) params.expires = String(expires);
    const url = "/ot?" + new URLSearchParams(params).toString();
    const res = await storageHttp()
      .post(url)
      .timeout(10000)
      .then<{ token: string; url: string; type: string; expires: string }>((r) => r.data);
    return res;
  } catch (e) {
    throw new Error(toErrorMessage(e, "创建访问链接"));
  }
}

/**
 * 拉取对象文本内容（用于文本类文件预览）
 *
 * @param bucket 存储桶名
 * @param key    对象 Key
 * @return 文本内容
 */
export async function fetchObjectText(bucket: string, key: string): Promise<string> {
  try {
    return await storageHttp()
      .get(objectPath(bucket, key))
      .responseType("text")
      .then<string>((r) => r.data as string);
  } catch (e) {
    throw new Error(toErrorMessage(e, "内容读取"));
  }
}
