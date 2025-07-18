///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///
import { getHashQuery } from "@/utils/utils";
import axios from "./config";
export function getWorkspaceId(state) {
  const query = getHashQuery();
  return query.wid || state?.workspaceId || "DEFAULT";
}
/**
 *
 * @param data
 */
export function editWorkSpace(data) {
  return axios({
    url: "/system/workspace/edit",
    method: "post",
    data: data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/*
 * 工作空间列表
 * @param {*}
 * } params
 */
export function getWorkSpaceList(params) {
  return axios({
    url: "/system/workspace/list",
    method: "post",
    data: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/*
 * 工作空间分组列表
 * @param {*}
 * } params
 */
export function getWorkSpaceGroupList(params) {
  return axios({
    url: "/system/workspace/list-group-all",
    method: "get",
    params: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/*
 * 工作空间列表（查询所有)
 * @param {*}
 * } params
 */
export function getWorkSpaceListAll() {
  return axios({
    url: "/system/workspace/list_all",
    method: "get",
    data: {},
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/*
 * 删除工作空间
 * @param {String} id
 * } params
 */
export function deleteWorkspace(id) {
  return axios({
    url: "/system/workspace/delete",
    method: "get",
    params: { id: id },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/*
 * 删除工作空间检查
 * @param {String} id
 * } params
 */
export function preDeleteWorkspace(id) {
  return axios({
    url: "/system/workspace/pre-check-delete",
    method: "get",
    params: { id: id },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/*
 * 工作空间环境变量列表
 * @param {*}
 * } params
 */
export function getWorkspaceEnvList(params) {
  return axios({
    url: "/system/workspace_env/list",
    method: "post",
    data: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}
/*
 * 工作空间环境变量全部列表
 * @param {*}
 * } params
 */
export function getWorkspaceEnvAll(data) {
  return axios({
    url: "/system/workspace_env/all",
    method: "post",
    data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 *
 * @param data
 */
export function editWorkspaceEnv(data) {
  return axios({
    url: "/system/workspace_env/edit",
    method: "post",
    data: data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/*
 * 删除工作空间变量
 * @param {String} id
 * } params
 */
export function deleteWorkspaceEnv(params) {
  return axios({
    url: "/system/workspace_env/delete",
    method: "get",
    params: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function getTriggerUrlWorkspaceEnv(params) {
  return axios({
    url: "/system/workspace_env/trigger-url",
    method: "post",
    params: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 加载 菜单配置信息
 */
export function getMenusConfig(data) {
  return axios({
    url: "/system/workspace/get_menus_config",
    method: "post",
    data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 保存菜单配置信息
 */
export function saveMenusConfig(data) {
  return axios({
    url: "/system/workspace/save_menus_config.json",
    method: "post",
    data: data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}
