import { http, type ReturnResult } from "@repo/utils";

/**
 * 学校信息查询对象类型
 */
export interface SchoolInfoQuery {
  schoolName?: string;
  schoolType?: string;
  schoolLevel?: string;
  schoolProvince?: string;
  schoolCity?: string;
  schoolDistrict?: string;
  schoolStatus?: number;
  schoolIs985?: number;
  schoolIs211?: number;
  schoolIsDoubleFirst?: number;
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
}

/**
 * 学校信息对象类型
 */
export interface SchoolInfo {
  schoolId?: number;
  schoolName: string;
  schoolCode?: string;
  schoolType?: string;
  schoolLevel?: string;
  schoolAddress?: string;
  schoolProvince?: string;
  schoolCity?: string;
  schoolDistrict?: string;
  schoolLogo?: string;
  schoolLogoUrl?: string;
  schoolIs985?: number;
  schoolIs211?: number;
  schoolIsDoubleFirst?: number;
  schoolStatus?: number;
  schoolDeleted?: number;
  createTime?: string;
  updateTime?: string;
}

/**
 * 获取学校信息列表
 * @param params 查询参数
 * @returns 学校信息列表数据
 */
export const getSchoolInfoList = (params: SchoolInfoQuery) => {
  return http.request<ReturnResult<SchoolInfo[]>>("post", "/v1/school/page", { data: params });
};

/**
 * 获取学校信息详情
 * @param schoolId 学校ID
 * @returns 学校详情数据
 */
export const getSchoolInfo = (schoolId: number) => {
  return http.request<ReturnResult<SchoolInfo>>("get", `/v1/school/${schoolId}`);
};

/**
 * 新增学校信息
 * @param data 学校信息数据
 * @returns 新增结果
 */
export const addSchoolInfo = (data: SchoolInfo) => {
  return http.request<ReturnResult<SchoolInfo>>("post", "/v1/school/save", { data });
};

/**
 * 更新学校信息
 * @param data 学校信息数据
 * @returns 更新结果
 */
export const updateSchoolInfo = (data: SchoolInfo) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/school/update", { data });
};

/**
 * 删除学校信息
 * @param schoolId 学校ID
 * @returns 删除结果
 */
export const deleteSchoolInfo = (schoolId: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/school/${schoolId}`);
}; 