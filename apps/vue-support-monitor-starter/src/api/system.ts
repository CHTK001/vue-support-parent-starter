///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { http } from "@repo/utils";
import { loadRouterBase } from "./config";

/**
 * 日志列表
 * @param {nodeId} params
 */
export function getLogList(params) {
  return http.post("/system/log_data.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 下载日志
 * 下载文件的返回是 blob 类型，把 blob 用浏览器下载下来
 * @param {nodeId, path} params
 */
export function downloadFile(params) {
  return loadRouterBase("/system/log_download", params);
}

/**
 * 删除日志
 * @param {nodeId, path} params
 */
export function deleteLog(params) {
  return http.post("/system/log_del.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * server 缓存数据
 */
export function getServerCache() {
  return http.post("/system/server-cache", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 节点缓存数据
 * @param {String} nodeId
 */
export function getNodeCache(data) {
  return http.post("/system/node_cache.json", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 清空缓存
 * @param {
 *  type: 类型
 *  nodeId: 节点 ID
 * } params
 */
export function clearCache(params) {
  return http.post("/system/clearCache.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

export function asyncRefreshCache(params) {
  return http.get("/system/async-refresh-cache", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 清理错误工作空间的数据
 *
 */
export function clearErrorWorkspace(params) {
  return http.get("/system/clear-error-workspace", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 加载配置数据
 * @param {String} nodeId 节点 ID，若为空表示加载 Server 端配置
 */
export function getConfigData(data) {
  return http.post("/system/config-data", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 加载ip配置数据
 */
export function getIpConfigData() {
  return http.post("/system/ip-config-data", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 编辑配置
 * @param {JSON} params {
 *  allowed: 允许访问，授权ip,
 *  prohibited: 禁止访问，禁止ip
 * }
 */
export function editIpConfig(params) {
  return http.post("/system/save_ip_config.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 编辑配置
 * @param {
 *  nodeId: 节点 ID,
 *  content: 配置内容,
 *  restart: 是否重启
 * } params
 */
export function editConfig(params) {
  return http.post("/system/save_config.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 加载邮件配置
 */
export function getMailConfigData() {
  return http.post("/system/mail-config-data", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

export function oauthConfigOauth2(params) {
  return http.get("/system/oauth-config/oauth2", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

export function oauthConfigOauth2Save(params) {
  return http.post("/system/oauth-config/oauth2-save", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 编辑配置
 * @param {
 *  host: SMTP 服务器域名,
 *  port: SMTP 服务端口,
 *  user: 用户名,
 *  pass: 密码,
 *  from: 发送方，遵循RFC-822标准,
 *  sslEnable: 是否 SSL 安全连接,
 *  socketFactoryPort: SSL 加密端口
 * } params
 */
export function editMailConfig(params) {
  return http.post("/system/mailConfig_save.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 系统程序信息
 * @param {String} nodeId 节点 ID
 */
export function systemInfo(data) {
  return http.post("/system/info", data, {
    headers: {
      tip: "no",
      loading: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 上传升级文件
 * @param {
 *  file: 文件 multipart/form-data,
 *  nodeId: 节点 ID
 * } formData
 */
export function uploadUpgradeFile(formData) {
  return http.post("/system/upload-jar-sharding", formData, {
    headers: {
      "Content-Type": "multipart/form-data;charset=UTF-8",
      loading: "no"
    },
    // 0 表示无超时时间
    timeout: 0
  });
}

/**
 * 上传文件合并
 *@param {String} nodeId 节点 ID
 */
export function uploadUpgradeFileMerge(data) {
  return http.post("/system/upload-jar-sharding-merge", data, {
    // 0 表示无超时时间
    timeout: 0
  });
}

/**
 * 获取更新日志
 *@param {String} nodeId 节点 ID
 */
export function changelog(data) {
  return http.post("/system/change_log", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

export function changBetaRelease(params) {
  return http.get("/system/change-beta-release", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

export function changeDownloadAuth(params) {
  return http.get("/system/change-download-auth", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 检查新版本
 *@param {String} nodeId 节点 ID
 */
export function checkVersion(data) {
  return http.post("/system/check_version.json", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 远程升级
 *@param {String} nodeId 节点 ID
 */
export function remoteUpgrade(params) {
  return http.get("/system/remote_upgrade.json", { params }, {
    timeout: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 加载 代理配置
 */
export function getProxyConfig() {
  return http.get("/system/get_proxy_config", {}, {
    params: {},
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 保存代理配置
 */
export function saveProxyConfig(data) {
  return http.post("/system/save_proxy_config", data, {
    headers: {
      "Content-Type": "application/json"
    }
  });
}