import { http, type ReturnResult } from "@repo/utils";

/**
 * 招生计划查询对象类型
 */
export interface SchoolPlanQuery {
  schoolId?: number;
  schoolPlanYear?: number;
  schoolPlanName?: string;
  schoolPlanType?: string;
  schoolPlanLevel?: string;
  schoolPlanMajor?: string;
  schoolPlanStatus?: number;
  schoolPlanProvince?: string;
  schoolPlanCity?: string;
  schoolPlanDistrict?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 招生计划对象类型
 */
export interface SchoolPlan {
  schoolPlanId?: number;
  schoolId: number;
  schoolPlanYear: number;
  schoolPlanName: string;
  schoolPlanCode?: string;
  schoolPlanType?: string;
  schoolPlanLevel?: string;
  schoolPlanMajor?: string;
  schoolPlanSubjectId?: number;
  schoolPlanQuota?: number;
  schoolPlanEnrolled?: number;
  schoolPlanMinScore?: number;
  schoolPlanAvgScore?: number;
  schoolPlanStartDate?: string;
  schoolPlanEndDate?: string;
  schoolPlanExamDate?: string;
  schoolPlanResultDate?: string;
  schoolPlanFee?: number;
  schoolPlanScholarship?: string;
  schoolPlanRequirement?: string;
  schoolPlanProcess?: string;
  schoolPlanContact?: string;
  schoolPlanPhone?: string;
  schoolPlanEmail?: string;
  schoolPlanWebsite?: string;
  schoolPlanAttachment?: string;
  schoolPlanProvince?: string;
  schoolPlanCity?: string;
  schoolPlanDistrict?: string;
  schoolPlanPriority?: number;
  schoolPlanStatus?: number;
  schoolPlanDescription?: string;
  schoolPlanCreateBy?: string;
  schoolPlanCreateTime?: string;
  schoolPlanUpdateBy?: string;
  schoolPlanUpdateTime?: string;
  schoolPlanRemark?: string;
  schoolPlanDeleted?: number;
}

/**
 * 获取招生计划列表
 * @param params 查询参数
 * @returns 招生计划列表数据
 */
export const getSchoolPlanList = (params: SchoolPlanQuery) => {
  return http.request<ReturnResult<SchoolPlan[]>>("post", "/v1/school/plan/page", { data: params });
};

/**
 * 获取招生计划详情
 * @param planId 计划ID
 * @returns 招生计划详情数据
 */
export const getSchoolPlan = (planId: number) => {
  return http.request<ReturnResult<SchoolPlan>>("get", `/v1/school/plan/${planId}`);
};

/**
 * 新增招生计划
 * @param data 招生计划数据
 * @returns 新增结果
 */
export const addSchoolPlan = (data: SchoolPlan) => {
  return http.request<ReturnResult<SchoolPlan>>("post", "/v1/school/plan/save", { data });
};

/**
 * 更新招生计划
 * @param data 招生计划数据
 * @returns 更新结果
 */
export const updateSchoolPlan = (data: SchoolPlan) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/school/plan/update", { data });
};

/**
 * 删除招生计划
 * @param planId 计划ID
 * @returns 删除结果
 */
export const deleteSchoolPlan = (planId: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/school/plan/${planId}`);
}; 