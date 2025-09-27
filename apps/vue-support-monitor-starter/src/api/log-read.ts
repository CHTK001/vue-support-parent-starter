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

// 日志搜索列表
export function getLogReadList(params) {
  return http.post("/log-read/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 编辑日志搜索
 * @param {
 *  id: 监控 ID
 *  name: 监控名称
 *  nodeProject: { nodeId:'',projectId:''}
 *
 * } params
 */
export function editLogRead(params) {
  return http.post("/log-read/save.json", params, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function updateCache(params) {
  return http.post("/log-read/update-cache.json", params, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * 删除日志搜索
 * @param {*} id
 */
export function deleteLogRead(id) {
  return http.post("/log-read/del.json", { id }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}