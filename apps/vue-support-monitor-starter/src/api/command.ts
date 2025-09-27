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
import { loadRouterBase } from "./config";

// 命令列表
export function getCommandList(params) {
  return http.post("/node/ssh_command/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

// 编辑命令
export function editCommand(params) {
  return http.post("/node/ssh_command/edit", params, {
    headers: {
      "Content-Type": "application/json"
    }
  });
}

// 删除命令
export function deleteCommand(id) {
  return http.post("/node/ssh_command/del", { id }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

// 删除命令
export function executeBatch(param) {
  return http.post("/node/ssh_command/batch", param, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

// 命令日志列表
export function getCommandLogList(params) {
  return http.post("/node/ssh_command_log/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

// 命令日志批次列表
export function getCommandLogBarchList(params) {
  return http.get("/node/ssh_command_log/batch_list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

// 删除命令执行记录
export function deleteCommandLog(id) {
  return http.post("/node/ssh_command_log/del", { id }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

// 命令日志信息
export function getCommandLogInfo(params) {
  return http.post("/node/ssh_command_log/log", params, {
    headers: {
      loading: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 下载日志
 * @param {*} logId
 */
export function downloadLog(logId) {
  return loadRouterBase("/node/ssh_command_log/download_log", {
    logId: logId
  });
}

export function syncToWorkspace(params) {
  return http.get("/node/ssh_command/sync-to-workspace", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

/**
 * 获取触发器地址
 * @param {*} id
 */
export function getTriggerUrl(data) {
  return http.post("/node/ssh_command/trigger-url", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  });
}

export const statusMap = {
  0: t("i18n_46e3867956"),
  1: t("i18n_ec219f99ee"),
  2: t("i18n_05f6e923af"),
  3: t("i18n_e2f942759e")
};

export const triggerExecTypeMap = {
  0: t("i18n_2a3e7f5c38"),
  1: t("i18n_3aed2c11e9"),
  2: t("i18n_4696724ed3")
};