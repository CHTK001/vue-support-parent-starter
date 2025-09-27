///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

/**
 * 节点管理 api
 */
import { t } from "@repo/config";
import { http } from "@repo/utils";
import { loadRouterBase } from "./config";

/**
 * 项目列表
 * @param {JSON} params {
 *  nodeId: 节点 ID
 *  group: 分组名称
 * }
 */
export function getProjectList(params) {
  return http.post("/node/manage/get_project_info", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 项目运行信息，返回项目占用端口和 pid
 * @param {JSON} params {
 *  nodeId: 节点 ID
 *  ids: 项目 ID 数组字符串格式 ["id1", "id2"]
 * }
 */
export function getRuningProjectInfo(params, noTip) {
  return http.post("/node/manage/getProjectPort", params, {
    timeout: 0,
    headers: {
      // loading: 'no',
      tip: noTip ? "no" : "",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 获取单个项目信息
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID
 * } params
 */
export function getProjectData(params, loading) {
  return http.post("/node/manage/getProjectData.json", params, {
    headers: {
      loading: loading === false ? "no" : "",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 项目授权列表
 * @param {String} nodeId 节点 ID
 */
export function getProjectAccessList(nodeId) {
  return http.post("/node/manage/project-access-list", { nodeId }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 编辑项目
 * @param {JSON} params {
 *  nodeId: 节点 ID
 *  id: 项目 ID
 *  name: 项目名称
 *  runMode: 运行方式
 *  whitelistDirectory: 项目授权路径
 *  lib: 项目文件夹
 *  group: 分组名称
 *  ...
 * }

 */
export function editProject(params) {
  const data = {
    nodeId: params.nodeId,
    id: params.id,
    name: params.name,
    group: params.group,
    runMode: params.runMode,
    whitelistDirectory: params.whitelistDirectory,
    lib: params.lib,
    mainClass: params.mainClass,
    javaExtDirsCp: params.javaExtDirsCp,
    jvm: params.jvm,
    args: params.args,
    javaCopyIds: params.javaCopyIds,
    token: params.token,
    logPath: params.logPath,
    autoStart: params.autoStart,
    dslContent: params.dslContent,
    dslEnv: params.dslEnv,
    linkId: params.linkId,
    disableScanDir: params.disableScanDir,
    logCharset: params.logCharset,
  };
  return http.post("/node/manage/saveProject", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 删除项目
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID

 * } params
 */
export function deleteProject(params) {
  return http.post("/node/manage/deleteProject", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function migrateWorkspace(params) {
  return http.post("/node/manage/migrate-workspace", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function releaseOutgiving(params) {
  return http.post("/node/manage/release-outgiving", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 项目文件列表
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID
 * } params
 */
export function getFileList(params) {
  return http.post("/node/manage/file/getFileList", params, {
    headers: {
      loading: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 下载项目文件
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID
 *  levelName: 文件 levelName
 *  filename: 文件名称
 * } params
 */
export function downloadProjectFile(params) {
  return loadRouterBase("/node/manage/file/download", params);
  // return http.get("/node/manage/file/download", params, {
  //   responseType: "blob",
  //   timeout: 0,
  // });
}

export function readFile(formData) {
  return http.get("/node/manage/file/read_file", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function remoteDownload(formData) {
  return http.get("/node/manage/file/remote_download", formData, {
    timeout: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function updateFile(formData) {
  return http.post("/node/manage/file/update_config_file", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 上传项目文件
 * @param {
 *  file: 文件 multipart/form-data
 *  nodeId: 节点 ID
 *  id: 项目 ID
 *  levelName: 目录地址
 *  type: unzip 表示压缩文件 *上传压缩文件时需要
 *  clearType: {clear: 清空文件夹, noClear: 不清空} *上传压缩文件时需要
 * } formData
 */
export function uploadProjectFile(formData) {
  return http.post("/node/manage/file/upload-sharding", formData, {
    headers: {
      "Content-Type": "multipart/form-data;charset=UTF-8",
      loading: "no",
    },
    // 0 表示无超时时间
    timeout: 0,
  });
}

/**
 * 合并分片项目文件
 * @param {
 *  file: 文件 multipart/form-data
 *  nodeId: 节点 ID
 *  id: 项目 ID
 *  levelName: 目录地址
 *  type: unzip 表示压缩文件 *上传压缩文件时需要
 *  clearType: {clear: 清空文件夹, noClear: 不清空} *上传压缩文件时需要
 * } formData
 */
export function shardingMerge(formData) {
  return http.post("/node/manage/file/sharding-merge", formData, {
    // 0 表示无超时时间
    timeout: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 删除文件
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID
 *  levelName: 文件 levelName
 *  filename: 文件名称
 *  type: 操作类型 {clear: 清空, noclear: 不清空} 填入此参数可以忽略 levelName 和 filename 参数
 * } params
 */
export function deleteProjectFile(params) {
  return http.post("/node/manage/file/deleteFile", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 获取项目日志文件大小
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID

 * } params
 */
export function getProjectLogSize(params) {
  return http.post("/node/manage/log/logSize", params, {
    headers: {
      loading: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 下载项目日志文件
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID

 * } params
 */
export function downloadProjectLogFile(params) {
  return loadRouterBase("/node/manage/log/export", params);
}

/**
 * 项目日志备份列表
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID
 * } params
 */
export function getLogBackList(params) {
  return http.post("/node/manage/log/log-back-list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 项目日志备份文件下载
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID

 *  key: 文件名
 * } params
 */
export function downloadProjectLogBackFile(params) {
  return loadRouterBase("/node/manage/log/logBack_download", params);
}

/**
 * 项目日志备份文件删除
 * @param {
 *  nodeId: 节点 ID
 *  id: 项目 ID

 *  name: 文件名
 * } params
 */
export function deleteProjectLogBackFile(params) {
  return http.post("/node/manage/log/logBack_delete", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 获取内存信息接口
 * @param {
 *  nodeId: 节点 ID
 *  tag: 项目 ID

 * } params
 */
export function getInternalData(params) {
  return http.post("/node/manage/getInternalData", params, {
    timeout: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// /**
//  * 查看线程
//  * @param {
//  *  nodeId: 节点 ID
//  * } params
//  */
// export function getThreadInfo(params) {
//   return http.post("/node/manage/threadInfos", params, {
//     timeout: 0,
//   });
// }

// /**
//  * 导出堆栈信息
//  * @param {
//  *  nodeId: 节点 ID
//  *  tag: 项目 ID
//  * } params
//  */
// export function exportStack(params) {
//   return http.get("/node/manage/stack", params, {
//     responseType: "blob",
//     timeout: 0,
//   });
// }

// /**
//  * 导出内存信息
//  * @param {
//  *  nodeId: 节点 ID
//  *  tag: 项目 ID
//  * } params
//  */
// export function exportRam(params) {
//   return http.get("/node/manage/ram", params, {
//     responseType: "blob",
//     timeout: 0,
//   });
// }

// /**
//  * 查询节点目录是否存在
//  * @param {
//  *  nodeId: 节点 ID,
//  *  newLib: 新目录地址
//  * } params
//  */
// export function nodeJudgeLibExist(params) {
//   return http.post("/node/manage/judge_lib.json", params, {
//     headers: {
//       tip: "no",
//     },
//   });
// }

/**
 * 操作项目
 * @param {
 *  nodeId: 节点 ID,
 *  id: 项目id
 * } params
 */
export function operateProject(params) {
  return http.post("/node/manage/operate", params, {
    headers: {
      loading: "no",
      tip: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 获取触发器地址
 * @param {*} id
 */
export function getProjectTriggerUrl(data) {
  return http.post("/node/project-trigger-url", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 新增目录  或文件
 * @param params
 * @returns {id, path, name,unFolder} params x
 */
export function newFileFolder(params) {
  return http.get("/node/manage/file/new_file_folder", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 修改目录或文件名称
 * @param params
 * @returns {id, levelName, filename,newname} params x
 */
export function renameFileFolder(params) {
  return http.get("/node/manage/file/rename_file_folder", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 复制文件
 * @param params
 * @returns {id, levelName, filename,newname} params x
 */
export function copyFileFolder(params) {
  return http.post("/node/manage/file/copy", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 压缩文件
 * @param params
 * @returns {id, levelName, filename,newname} params x
 */
export function compressFileFolder(params) {
  return http.post("/node/manage/file/compress", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 构建分组
 */
export function getProjectGroupAll() {
  return http.get("/node/list-project-group-all", {}, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 所有的运行模式
 */
export const runModeList = ["Dsl", "ClassPath", "Jar", "JarWar", "JavaExtDirsCp", "File", "Link"];

export const runModeArray = [
  { name: "Dsl", desc: t("i18n_386edb98a5") },
  { name: "ClassPath", desc: t("i18n_f9c9f95929") },
  { name: "Jar", desc: t("i18n_be24e5ffbe") },
  { name: "JavaExtDirsCp", desc: t("i18n_eef4dfe786") },
  { name: "File", desc: t("i18n_f282058f75") },
  {
    name: "Link",
    desc: t("i18n_c538b1db4a"),
    // 仅有节点有此项目（节点分发不支持）
    onlyNode: true,
  },
  { name: "JarWar", desc: t("i18n_d6eab4107a") },
];

/**
 * java 项目的运行模式
 */
export const javaModes = ["ClassPath", "Jar", "JarWar", "JavaExtDirsCp"];

/**
 * 有状态管理的运行模式
 */
export const noFileModes = ["ClassPath", "Jar", "JarWar", "JavaExtDirsCp", "Dsl", "Link"];

/*
 * 下载导入模板
 *
 */
export function importTemplate(data) {
  return loadRouterBase("/node/manage/import-template", data);
}

/*
 * 导出数据
 *
 */
export function exportData(data) {
  return loadRouterBase("/node/manage/export-data", data);
}
// 导入数据
export function importData(formData) {
  return http.post("/node/manage/import-data", formData, {
    headers: {
      "Content-Type": "multipart/form-data;charset=UTF-8",
    },
    // 0 表示无超时时间
    timeout: 0,
  });
}