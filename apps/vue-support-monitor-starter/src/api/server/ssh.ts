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

// ssh 列表
export function getSshList(params) {
  return http.post("/node/ssh/list_data.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// ssh group all
export function getSshGroupAll() {
  return http.get("/node/ssh/list-group-all", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// ssh list tree
export function getSshListTree() {
  return http.get("/node/ssh/list-tree", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 查询单个 ssh
export function getItem(params) {
  return http.get("/node/ssh/get-item.json", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 根据 nodeId 查询列表
export function getSshListAll() {
  return http.get("/node/ssh/list_data_all.json", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// ssh 操作日志列表
export function getSshOperationLogList(params) {
  return http.post("/node/ssh/log_list_data.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 编辑 SSH
 * @param {*} params
 * params.type = {'add': 表示新增, 'edit': 表示修改}
 */
export function editSsh(params) {
  return http.post("/node/ssh/save.json", {}, {
    params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 删除 SSH
export function deleteSsh(id) {
  return http.post("/node/ssh/del.json", { id }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 删除 SSH
export function deleteForeSsh(id) {
  return http.post("/node/ssh/del-fore", { id }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function syncToWorkspace(params) {
  return http.get("/node/ssh/sync-to-workspace", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}