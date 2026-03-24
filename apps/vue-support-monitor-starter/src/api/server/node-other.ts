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

/************************** */

/**
 * script 服务端中的所有列表
 */
export function getScriptListAll(params) {
  return http.post("/node/script/list_all", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 脚本模版日志列表
export function getScriptLogList(params) {
  return http.post("/node/script_log/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 删除执行记录
export function scriptDel(params) {
  return http.post("/node/script_log/del", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

//执行记录 详情
export function scriptLog(params) {
  return http.post("/node/script_log/log", params, {
    headers: {
      tip: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * Script 编辑
 * @param {nodeId, id, name, path, port, appBase} params
 * params.type: add 表示新增
 * params.nodeId 节点 ID
 * params.id 编辑修改时判断 ID
 * params.name 名称
 * params.context 内容
 */
export function editScript(params) {
  return http.post("/node/script/save.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function itemScript(params) {
  return http.get("/node/script/item.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function syncScript(params) {
  return http.get("/node/script/sync", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}
export const triggerExecTypeMap = {
  0: t("i18n_2a3e7f5c38"),
  1: t("i18n_3aed2c11e9"),
  2: t("i18n_4696724ed3"),
};

/**
 * 获取触发器地址
 * @param {*} id
 */
export function getTriggerUrl(data) {
  return http.post("/node/script/trigger-url", data, {
    params: data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 删除 Script
 * @param {nodeId, id} params
 * params.nodeId 节点 ID
 * params.id 编辑修改时判断 ID
 */
export function deleteScript(params) {
  return http.post("/node/script/del.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 解绑 Script
 * @param {id} params

 * params.id 编辑修改时判断 ID
 */
export function unbindScript(params) {
  return http.get("/node/script/unbind.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}