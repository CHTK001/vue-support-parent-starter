/**
 * InfluxDB 增强 接口封装
 *
 * <p>不改动 monitorApi.ts 既有函数；这里只放新增端点。
 * Nginx 相关接口已迁至 {@code src/nginx/api.ts}，本文件不再包含。</p>
 * @author CH
 * @since 4.0.0
 */
import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

// ==================== InfluxDB 增强 ====================

/**
 * InfluxDB 组织信息
 */
export interface InfluxdbOrg {
  orgId: string;
  orgName: string;
}

/**
 * 新建 Bucket 请求
 */
export type InfluxdbBucketCreate = {
  datasourceId?: number;
  name: string;
  /** 保留时长（小时），0/空表示永久 */
  retentionHours?: number | null;
  description?: string;
};

/**
 * 写入数据点请求（line protocol）
 */
export type InfluxdbWriteRequest = {
  datasourceId?: number;
  bucket: string;
  /** 时间精度 ns/us/ms/s，默认 ns */
  precision?: string;
  /** line protocol 文本，一行一个点 */
  lines: string;
};

/**
 * 读取当前数据源 Org 信息
 * @param datasourceId 数据源 ID
 */
export const fetchInfluxdbOrg = (datasourceId?: number) =>
  http()
    .get("/ms/monitor/influxdb/org")
    .query({ datasourceId })
    .then(r => unwrap<InfluxdbOrg>(r));

/**
 * 新建 Bucket
 * @param data 新建请求
 */
export const createInfluxdbBucket = (data: InfluxdbBucketCreate) =>
  http()
    .post("/ms/monitor/influxdb/bucket")
    .data(data)
    .then(r => unwrap<{ id: string; name: string; retentionHours: number | null; createdAt: string }>(r));

/**
 * 删除 Bucket
 * @param bucketId Bucket ID（UUID）
 * @param datasourceId 数据源 ID
 */
export const deleteInfluxdbBucket = (bucketId: string, datasourceId?: number) =>
  http()
    .delete(`/ms/monitor/influxdb/bucket/${encodeURIComponent(bucketId)}`)
    .query({ datasourceId })
    .then(r => unwrap<boolean>(r));

/**
 * 编辑 Bucket 保留期
 * @param bucketId Bucket ID（UUID）
 * @param retentionHours 保留时长（小时），0/空表示永久
 * @param datasourceId 数据源 ID
 */
export const updateInfluxdbBucketRetention = (
  bucketId: string,
  retentionHours?: number | null,
  datasourceId?: number
) =>
  http()
    .put(`/ms/monitor/influxdb/bucket/${encodeURIComponent(bucketId)}`)
    .data({ retentionHours })
    .query({ datasourceId })
    .then(r => unwrap<boolean>(r));

/**
 * 写入数据点（line protocol）
 * @param data 写入请求
 */
export const writeInfluxdbPoints = (data: InfluxdbWriteRequest) =>
  http()
    .post("/ms/monitor/influxdb/write")
    .data(data)
    .then(r => unwrap<boolean>(r));
