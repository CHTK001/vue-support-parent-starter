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
import { http } from "@repo/utils";

export function getWorkspaceId(state) {
  const query = getHashQuery();
  return query.wid || state?.workspaceId || "DEFAULT";
}

/**
 *
 * @param data
 */
export function editWorkSpace(data) {
  return http.post("/system/workspace/edit", data, {
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
  return http.post("/system/workspace/list", params, {
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
  return http.get("/system/workspace/list-group-all", { params }, {
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
  return http.get("/system/workspace/list_all", {}, {
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
  return http.get("/system/workspace/delete", { params: { id } }, {
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
  return http.get("/system/workspace/pre-check-delete", { params: { id } }, {
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
  return http.post("/system/workspace_env/list", params, {
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
  return http.post("/system/workspace_env/all", data, {
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
  return http.post("/system/workspace_env/edit", data, {
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
  return http.get("/system/workspace_env/delete", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function getTriggerUrlWorkspaceEnv(params) {
  return http.post("/system/workspace_env/trigger-url", {}, {
    params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 加载 菜单配置信息
 */
export function getMenusConfig(data) {
  return http.post("/system/workspace/get_menus_config", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 保存菜单配置信息
 */
export function saveMenusConfig(data) {
  return http.post("/system/workspace/save_menus_config.json", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}