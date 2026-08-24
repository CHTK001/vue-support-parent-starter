/**
 * 独立文件存储服务器 API 封装（FileStorageServerFilter）
 *
 * 对应后端 FileStorageServerFilter（spring-support-filesystem-starter）暴露的 REST 接口：
 *   1) 路径规则 /{bucket}/{key}，bucket 为注册的存储名（如 local）
 *   2) GET  /{bucket}          — 对象列表（JSON）
 *   3) PUT  /{bucket}/{key}    — 上传（body 为原始文件内容）
 *   4) GET  /{bucket}/{key}    — 下载/预览（?download=true 强制附件下载）
 *   5) HEAD /{bucket}/{key}    — 存在性检查（200 存在 / 404 不存在）
 *   6) DELETE /{bucket}/{key}  — 删除
 *
 * 该服务为独立 HTTP 服务（非网关代理），因此使用原生 fetch 而非 getApiHttp。
 */

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
 * 构建请求基础路径
 *
 * @return 形如 http://host:port 的地址
 */
function base(): string {
  return getServerBase().replace(/\/+$/, "");
}

/**
 * 构建对象访问 URL
 *
 * @param bucket   存储桶名
 * @param key      对象 Key
 * @param download 是否强制附件下载
 * @return 完整 URL
 */
export function objectUrl(bucket: string, key: string, download = false): string {
  const suffix = download ? "?download=true" : "";
  return `${base()}/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}${suffix}`;
}

/**
 * 查询对象列表
 *
 * @param bucket 存储桶名
 * @param path   子目录路径（空表示根目录）
 * @return 对象元数据列表
 */
export async function listObjects(bucket: string, path = ""): Promise<StorageObject[]> {
  const query = path ? `?path=${encodeURIComponent(path)}` : "";
  const res = await fetch(`${base()}/${encodeURIComponent(bucket)}${query}`);
  if (!res.ok) throw new Error(`列表查询失败（HTTP ${res.status}）`);
  const json = (await res.json()) as { items?: StorageObject[] };
  return json.items ?? [];
}

/**
 * 拉取对象文本内容（用于文本类文件预览）
 *
 * @param bucket 存储桶名
 * @param key    对象 Key
 * @return 文本内容
 */
export async function fetchObjectText(bucket: string, key: string): Promise<string> {
  const res = await fetch(objectUrl(bucket, key));
  if (!res.ok) throw new Error(`内容读取失败（HTTP ${res.status}）`);
  return res.text();
}

/**
 * 上传对象（原始内容直传）
 *
 * @param bucket  存储桶名
 * @param key     对象 Key（支持子目录）
 * @param content 文件内容
 */
export async function putObject(bucket: string, key: string, content: Blob | ArrayBuffer): Promise<void> {
  const res = await fetch(objectUrl(bucket, key), {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: content as BodyInit,
  });
  if (!res.ok) throw new Error(`上传失败（HTTP ${res.status}）`);
}

/**
 * 删除对象
 *
 * @param bucket 存储桶名
 * @param key    对象 Key
 */
export async function deleteObject(bucket: string, key: string): Promise<void> {
  const res = await fetch(objectUrl(bucket, key), { method: "DELETE" });
  if (!res.ok) throw new Error(`删除失败（HTTP ${res.status}）`);
}

/**
 * 存在性检查
 *
 * @param bucket 存储桶名
 * @param key    对象 Key
 * @return true 表示存在
 */
export async function existObject(bucket: string, key: string): Promise<boolean> {
  const res = await fetch(objectUrl(bucket, key), { method: "HEAD" });
  if (res.ok) return true;
  if (res.status === 404) return false;
  throw new Error(`存在性检查失败（HTTP ${res.status}）`);
}
