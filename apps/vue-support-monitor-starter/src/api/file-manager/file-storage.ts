///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { t } from "@repo/config";
import { http } from "@repo/utils";

// 文件列表
export function fileStorageList(params) {
  return http.post("/file-storage/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function uploadFile(formData) {
  return http.post("/file-storage/upload-sharding", formData, {
    headers: {
      "Content-Type": "multipart/form-data;charset=UTF-8",
      loading: "no",
    },
    // 0 表示无超时时间
    timeout: 0,
  });
}

export function uploadFileMerge(params) {
  return http.post("/file-storage/upload-sharding-merge", params, {
    // 0 表示无超时时间
    timeout: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 修改文件
export function fileEdit(params) {
  return http.post("/file-storage/edit", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 下载远程文件
export function remoteDownload(params) {
  return http.post("/file-storage/remote-download", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 判断文件是否存在
export function hasFile(params) {
  return http.get("/file-storage/has-file", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function delFile(params) {
  return http.get("/file-storage/del", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 下载 url
export function triggerUrl(params) {
  return http.get("/file-storage/trigger-url", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export const sourceMap = {
  0: t("i18n_d5a73b0c7f"),
  1: t("i18n_fcba60e773"),
  2: t("i18n_f26ef91424"),
  3: t("i18n_d40b511510"),
};

export const statusMap = {
  0: t("i18n_2d455ce5cd"),
  1: t("i18n_50940ed76f"),
  2: t("i18n_af924a1a14"),
};

/**
 * 上传小文件参数接口
 */
export interface UploadSmallFileParams {
  serverId: number;
  bucket?: string;
  filePath?: string;
  file: File;
}

/**
 * 上传小文件（10MB以内）
 * @param params 上传参数
 * @returns 上传结果
 */
export function uploadSmallFile(params: UploadSmallFileParams) {
  const formData = new FormData();
  formData.append("serverId", String(params.serverId));
  if (params.bucket) {
    formData.append("bucket", params.bucket);
  }
  if (params.filePath) {
    formData.append("filePath", params.filePath);
  }
  formData.append("file", params.file);

  return http.post("/file-storage/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data;charset=UTF-8",
    },
    timeout: 60000,
  });
}

/**
 * 生成分享链接参数
 */
export interface CreateShareLinkParams {
  serverId: number;
  bucket: string;
  filePath: string;
  fileName: string;
  /** 过期时间（分钟），0 表示永不过期 */
  expireMinutes?: number;
}

/**
 * 生成分享链接
 * @param params 分享参数
 * @returns 分享链接信息
 */
export function createShareLink(params: CreateShareLinkParams) {
  return http.post("/file-storage/share/create", params);
}

/**
 * 生成闪图参数（阅后即焚）
 */
export interface CreateFlashImageParams {
  serverId: number;
  bucket: string;
  filePath: string;
  fileName: string;
}

/**
 * 生成闪图链接（阅后即焚，查看一次后自动删除）
 * @param params 闪图参数
 * @returns 闪图链接信息
 */
export function createFlashImage(params: CreateFlashImageParams) {
  return http.post("/file-storage/flash/create", params);
}

/**
 * 获取分享链接列表
 * @param serverId 服务器ID
 */
export function getShareList(serverId: number) {
  return http.get("/file-storage/share/list", { serverId });
}

/**
 * 删除分享链接
 * @param shareId 分享ID
 */
export function deleteShareLink(shareId: string) {
  return http.delete(`/file-storage/share/${shareId}`);
}
