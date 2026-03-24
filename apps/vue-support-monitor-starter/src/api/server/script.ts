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

/**
 * script 服务端中的列表
 */
export function getScriptList(params) {
  return http.post("/script/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 *  保存脚本
 * @param {Json} params
 * @returns
 */
export function editScript(params) {
  return http.post("/script/save.json", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 删除 Script
 * @param {id} params

 * params.id 编辑修改时判断 ID
 */
export function deleteScript(params) {
  return http.post("/script/del.json", params, {
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
  return http.get(
    "/script/unbind.json",
    { params },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
}

// 脚本模版日志列表
export function getScriptLogList(params) {
  return http.post("/script_log/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 删除执行记录
export function scriptDel(params) {
  return http.post("/script_log/del_log", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

//执行记录 详情
export function scriptLog(params) {
  return http.post("/script_log/log", params, {
    headers: {
      tip: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function syncToWorkspace(params) {
  return http.get(
    "/script/sync-to-workspace",
    { params },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
}

export function getScriptItem(params) {
  return http.get(
    "/script/get",
    { params },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
}

/**
 * 获取触发器地址
 * @param {*} id
 */
export function getTriggerUrl(data) {
  return http.post("/script/trigger-url", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export const triggerExecTypeMap = {
  0: t("i18n_2a3e7f5c38"),
  1: t("i18n_3aed2c11e9"),
  2: t("i18n_4696724ed3"),
  3: t("i18n_dba16b1b92"),
};

// ======================== 服务端脚本管理 API ========================

/** 获取服务端脚本分页列表 */
export function getServerScriptPageList(params) {
  return http.post("/script/page", params);
}

/** 保存服务端脚本（创建） */
export function saveServerScript(params) {
  return http.post("/script", params);
}

/** 更新服务端脚本 */
export function updateServerScript(params) {
  return http.put("/script", params);
}

/** 删除服务端脚本 */
export function deleteServerScript(scriptId: number) {
  return http.delete(`/script/${scriptId}`);
}

/** 复制服务端脚本 */
export function duplicateServerScript(params) {
  return http.post("/script/copy.json", params);
}

/** 执行服务端脚本 */
export function executeServerScript(params) {
  return http.post("/script/exec.json", params);
}

/** 执行节点脚本 */
export function executeNodeScript(params) {
  return http.post("/script/node-exec.json", params);
}

/** 获取脚本执行记录分页列表 */
export function getScriptExecutionPageList(params) {
  return http.post("/script_log/list", params);
}

/** 获取脚本执行详情 */
export function getScriptExecutionDetail(params) {
  return http.get("/script_log/detail", { params });
}

/** 获取脚本执行输出 */
export function getScriptExecutionOutput(params) {
  return http.post("/script_log/log", params);
}

/** 获取运行中的脚本执行 */
export function getRunningScriptExecutions(params) {
  return http.post("/script_log/running", params);
}

/** 停止脚本执行 */
export function stopScriptExecution(params) {
  return http.post("/script_log/stop.json", params);
}

/** 清理过期的执行记录 */
export function cleanExpiredExecutions(params) {
  return http.post("/script_log/clean.json", params);
}

/** 验证脚本 */
export function validateScript(params) {
  return http.post("/script/validate.json", params);
}

/** 导出脚本 */
export function exportScript(params) {
  return http.get("/script/export", { params });
}

/** 导入脚本 */
export function importScript(formData) {
  return http.post("/script/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data;charset=UTF-8",
    },
  });
}
