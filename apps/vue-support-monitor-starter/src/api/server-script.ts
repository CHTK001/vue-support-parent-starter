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
import axios from "./config";

/**
 * script 服务端中的列表
 */
export function getScriptList(params) {
  return axios({
    url: "/script/list",
    method: "post",
    data: params,
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
  return axios({
    url: "/script/save.json",
    method: "post",
    data: params,
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
  return axios({
    url: "/script/del.json",
    method: "post",
    data: params,
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
  return axios({
    url: "/script/unbind.json",
    method: "get",
    params: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 脚本模版日志列表
export function getScriptLogList(params) {
  return axios({
    url: "/script_log/list",
    method: "post",
    data: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 删除执行记录
export function scriptDel(params) {
  return axios({
    url: "/script_log/del_log",
    method: "post",
    data: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

//执行记录 详情
export function scriptLog(params) {
  return axios({
    url: "/script_log/log",
    method: "post",
    data: params,
    headers: {
      tip: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function syncToWorkspace(params) {
  return axios({
    url: "/script/sync-to-workspace",
    method: "get",
    params: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function getScriptItem(params) {
  return axios({
    url: "/script/get",
    method: "get",
    params: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 获取触发器地址
 * @param {*} id
 */
export function getTriggerUrl(data) {
  return axios({
    url: "/script/trigger-url",
    method: "post",
    data: data,
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
