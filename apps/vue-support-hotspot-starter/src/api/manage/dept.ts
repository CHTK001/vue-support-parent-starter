import { http, type ReturnResult } from "@repo/utils";

export type Dept = {
  sysDeptId: number;
  sysDeptName: string;
  sysDeptPid: number;
  sysDeptTreeId: string;
};

/**
 * 删除组织机构
 */
export const fetchDeleteDept = deptId => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/dept/delete", {
    data: { deptId: deptId }
  });
};

/**
 * 新增组织机构
 */
export const fetchSaveDept = dept => {
  return http.request<ReturnResult<Dept>>("post", "/v2/dept/save", {
    data: dept
  });
};

/**
 * 更新组织机构
 */
export const fetchUpdateDept = dept => {
  return http.request<ReturnResult<boolean>>("put", "/v2/dept/update", {
    data: dept
  });
};

/**
 * 组织机构列表
 */
export const fetchListDept = params => {
  return http.request<ReturnResult<Dept[]>>("get", "/v2/dept/list", {
    params
  });
};
