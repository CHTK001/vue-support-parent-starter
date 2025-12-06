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
import { loadRouterBase } from "../config";
// 导入证书
export function certificateImportFile(formData) {
  return http.post('/certificate/import-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data;charset=UTF-8'
    }
  })
}

/**
 * cert 列表
 */
export function certList(params) {
  return http.post("/certificate/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * cert 列表
 */
export function certListAll(params) {
  return http.post("/certificate/list-all", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 删除 cert
 * @param {
 *
 * } params
 */
export function deleteCert(params) {
  return http.get("/certificate/del", { params }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

/**
 * 导出 cert
 * @param {
 *
 * } params
 */
export function downloadCert(params) {
  return loadRouterBase('/certificate/export', params)
}

// 修改证书
export function certificateEdit(params) {
  return http.post("/certificate/edit", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

// 部署证书
export function certificateDeploy(params) {
  return http.post("/certificate/deploy", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}