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

// 任务列表
export function fileReleaseTaskLog(params) {
  return http.post("/file-storage/release-task/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 新增发布任务
export function addReleaseTask(params) {
  return http.post("/file-storage/release-task/add-task", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 重新发布任务
export function reReleaseTask(params) {
  return http.post("/file-storage/release-task/re-task", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 取消任务
export function cancelReleaseTask(params) {
  return http.get("/file-storage/release-task/cancel-task", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 删除任务
export function deleteReleaseTask(params) {
  return http.get("/file-storage/release-task/delete", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function getTaskTemplate(params) {
  return http.get("/file-storage/release-task/get-template", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function listTaskTemplate(params) {
  return http.post("/file-storage/release-task/list-template", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function deleteTaskTemplate(params) {
  return http.get("/file-storage/release-task/delete-template", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 任务详情
export function taskDetails(params) {
  return http.get("/file-storage/release-task/details", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function taskLogInfoList(params) {
  return http.get("/file-storage/release-task/log-list", params, {
    headers: {
      loading: "no",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export const statusMap = {
  0: t("i18n_a87818b04f"),
  1: t("i18n_fb852fc6cc"),
  2: t("i18n_5ab90c17a3"),
  3: t("i18n_250688d7c9"),
  4: t("i18n_d926e2f58e"),
};

export const taskTypeMap = {
  0: "SSH",
  1: t("i18n_3bf3c0a8d6"),
};