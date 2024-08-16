import { http } from "@/utils/http";


/**
 * 删除组织机构
 */
export const deleteDept = deptId => {
    return http.request<Boolean>("delete", "/v2/dept/delete", {
      data: { deptId: deptId }
    });
  };