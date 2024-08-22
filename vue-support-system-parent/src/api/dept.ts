import { http, type ReturnResult } from "@/utils/http";

export type Dept = {
  sysDeptId: number;
  sysDeptName: string;
  sysDeptPid: number;
  sysDeptTreeId: string;
};

/**
 * 删除组织机构
 */
export const deleteDept = deptId => {
  return http.request<Boolean>("delete", "/v2/dept/delete", {
    data: { deptId: deptId }
  });
};

/**
 * 新增组织机构
 */
export const addDept = dept => {
  return http.request<Boolean>("post", "/v2/dept/save", { data: dept });
};

/**
 * 更新组织机构
 */
export const updateDept = dept => {
  return http.request<Boolean>("put", "/v2/dept/update", { data: dept });
};

/**
 * 组织机构列表
 */
export const deptList = params => {
  return http.request<ReturnResult<Dept[]>>("get", "/v2/dept/list", {
    params
  });
};
