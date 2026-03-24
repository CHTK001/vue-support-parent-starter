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

// node 列表
export function getNodeList(params) {
  return http.post("/node/list_data.json", params, {
    headers: {
      loading: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// node 列表 all
export function getNodeListAll(params) {
  return http.get("/node/list_data_all.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// node group all
export function getNodeGroupAll() {
  return http.get("/node/list_group_all.json", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 节点和版本信息
export function getNodeListWithVersion(params) {
  return http.get("/node/list_data_with_version", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// // node 状态
// export function getNodeStatus(nodeId) {
//   return http.post("/node/node_status", { nodeId });
// }

// 节点 + 项目列表
export function getProjectList(params, loading) {
  return http.post("/node/project_list", params, {
    headers: {
      loading: loading === false ? "no" : "",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 节点 + 项目列表
export function getProjectListAll(params) {
  return http.get("/node/project_list_all", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 同步节点项目
export function syncProject(nodeId) {
  return http.get("/node/sync_project", { nodeId: nodeId }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function syncToWorkspace(params) {
  return http.get("/node/sync-to-workspace", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

//
export function sortItem(params) {
  return http.get("/node/sort-item", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 项目排序
export function sortItemProject(params) {
  return http.get("/node/project-sort-item", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 编辑 node
 * @param {
 *  id: ID,
 *  name: 节点名称,
 *  group: 分组名称,
 *  sshId: SSH ID,
 *  protocol: 协议 HTTPS || HTTP,
 *  url: URL 地址,
 *  timeOut: 超时时间,
 *  cycle: 监控周期,
 *  openStatus: 状态,
 *  loginName: 用户名,
 *  loginPwd: 密码,
 *  type: 操作类型 add || update
 * } params
 */
export function editNode(params) {
  const data = {
    id: params.id,
    name: params.name,
    group: params.group,
    sshId: params.sshId,
    protocol: params.protocol,
    url: params.url,
    timeOut: params.timeOut,
    cycle: params.cycle,
    openStatus: params.openStatus,
    loginName: params.loginName,
    loginPwd: params.loginPwd,
    type: params.type,
    httpProxy: params.httpProxy,
    httpProxyType: params.httpProxyType,
  };
  return http.post("/node/save.json", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 删除 node
export function deleteNode(id) {
  return http.post("/node/del.json", { id }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 解绑 node
export function unbind(id) {
  return http.get("/node/unbind.json", { id }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// // 节点 top 命令
// export function getNodeTop(nodeId) {
//   return http.post("/node/getTop", { nodeId }, {
//     headers: {
//       loading: "no",
//     },
//   });
// }

// 获取进程列表
export function getProcessList(data) {
  return http.post("/node/processList", data, {
    timeout: 0,
    headers: {
      loading: "no",
      tip: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 杀掉进程
 * @param {nodeId, pid} params
 */
export function killPid(params) {
  return http.post("/node/kill.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 节点监控图表数据
 * @param {
 *  nodeId: 节点 ID,
 *  time: 时间段，格式：yyyy-MM-dd HH:mm:ss ~ yyyy-MM-dd HH:mm:ss
 * } params
 */
export function nodeMonitorData(params, loading) {
  return http.post("/node/node_monitor_data.json", params, {
    headers: {
      loading: loading === false ? "no" : "",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 上传升级文件
 * @param {
 *  file: 文件 multipart/form-data,
 *  nodeId: 节点 ID
 * } formData
 */
export function uploadAgentFile(formData) {
  return http.post("/node/upload-agent-sharding", formData, {
    headers: {
      "Content-Type": "multipart/form-data;charset=UTF-8",
      loading: "no",
    },
    // 0 表示无超时时间
    timeout: 0,
  });
}

/**
 *  上传文件合并
 * @returns json
 */
export function uploadAgentFileMerge(data) {
  return http.post("/node/upload-agent-sharding-merge", data, {
    // 0 表示无超时时间
    timeout: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 *  检查远程最新
 * @returns json
 */
export function checkVersion() {
  return http.get("/node/check_version.json", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 快速安装
 * @returns1
 */
export function fastInstall() {
  return http.get("/node/fast_install.json", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 拉取结果
 * @param {JSON} params
 * @returns
 */
export function pullFastInstallResult(params) {
  return http.get("/node/pull_fast_install_result.json", params, {
    headers: {
      loading: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 安装确认
 * @param {Json} params
 * @returns
 */
export function confirmFastInstall(params) {
  return http.get("/node/confirm_fast_install.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 下载远程文件
 * @returns json
 */
export function downloadRemote() {
  return http.get("/node/download_remote.json", {}, {
    // 0 表示无超时时间
    timeout: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}