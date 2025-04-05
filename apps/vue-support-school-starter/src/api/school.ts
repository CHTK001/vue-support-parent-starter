import { http, type ReturnResult } from "@repo/utils";

// 学校信息管理接口部分

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
  pageNum?: number;
  pageSize?: number;
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
  schoolPhone?: string;
  schoolEmail?: string;
  schoolWebsite?: string;
  schoolFoundingDate?: string;
  schoolArea?: number;
  schoolBuildingArea?: number;
  schoolStudentCount?: number;
  schoolTeacherCount?: number;
  schoolClassCount?: number;
  schoolDescription?: string;
  schoolFeatures?: string;
  schoolPrincipal?: string;
  schoolLogo?: string;
  schoolStatus?: number;
  schoolCreateBy?: string;
  schoolCreateTime?: string;
  schoolUpdateBy?: string;
  schoolUpdateTime?: string;
  schoolRemark?: string;
  schoolDeleted?: number;
}

/**
 * 获取学校信息列表
 * @param params 查询参数
 * @returns 学校信息列表数据
 */
export const getSchoolInfoList = (params: SchoolInfoQuery) => {
  return http.request<ReturnResult<SchoolInfo[]>>("post", "/v1/school/info/page", { data: params });
};

/**
 * 获取学校信息详情
 * @param schoolId 学校ID
 * @returns 学校详情数据
 */
export const getSchoolInfo = (schoolId: number) => {
  return http.request<ReturnResult<SchoolInfo>>("get", `/v1/school/info/${schoolId}`);
};

/**
 * 新增学校信息
 * @param data 学校信息数据
 * @returns 新增结果
 */
export const addSchoolInfo = (data: SchoolInfo) => {
  return http.request<ReturnResult<SchoolInfo>>("post", "/v1/school/info/add", { data });
};

/**
 * 更新学校信息
 * @param data 学校信息数据
 * @returns 更新结果
 */
export const updateSchoolInfo = (data: SchoolInfo) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/school/info/update", { data });
};

/**
 * 删除学校信息
 * @param schoolId 学校ID
 * @returns 删除结果
 */
export const deleteSchoolInfo = (schoolId: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/school/info/${schoolId}`);
};

// 学校学科管理接口部分

/**
 * 学科查询对象类型
 */
export interface SchoolSubjectQuery {
  schoolId?: number;
  schoolSubjectName?: string;
  schoolSubjectType?: string;
  schoolSubjectCategory?: string;
  schoolSubjectGrade?: string;
  schoolSubjectIsMain?: number;
  schoolSubjectIsExam?: number;
  schoolSubjectStatus?: number;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 学科对象类型
 */
export interface SchoolSubject {
  schoolSubjectId?: number;
  schoolId: number;
  schoolSubjectName: string;
  schoolSubjectCode?: string;
  schoolSubjectType?: string;
  schoolSubjectCategory?: string;
  schoolSubjectCredit?: number;
  schoolSubjectHours?: number;
  schoolSubjectDescription?: string;
  schoolSubjectRequirement?: string;
  schoolSubjectGrade?: string;
  schoolSubjectSemester?: string;
  schoolSubjectTeacherCount?: number;
  schoolSubjectStudentCount?: number;
  schoolSubjectTextbook?: string;
  schoolSubjectIsMain?: number;
  schoolSubjectIsExam?: number;
  schoolSubjectExamType?: string;
  schoolSubjectOrder?: number;
  schoolSubjectStatus?: number;
  schoolSubjectCreateBy?: string;
  schoolSubjectCreateTime?: string;
  schoolSubjectUpdateBy?: string;
  schoolSubjectUpdateTime?: string;
  schoolSubjectRemark?: string;
  schoolSubjectDeleted?: number;
}

/**
 * 获取学科列表
 * @param params 查询参数
 * @returns 学科列表数据
 */
export const getSchoolSubjectList = (params: SchoolSubjectQuery) => {
  return http.request<ReturnResult<SchoolSubject[]>>("post", "/v1/school/subject/page", { data: params });
};

/**
 * 获取学科详情
 * @param subjectId 学科ID
 * @returns 学科详情数据
 */
export const getSchoolSubject = (subjectId: number) => {
  return http.request<ReturnResult<SchoolSubject>>("get", `/v1/school/subject/${subjectId}`);
};

/**
 * 新增学科
 * @param data 学科数据
 * @returns 新增结果
 */
export const addSchoolSubject = (data: SchoolSubject) => {
  return http.request<ReturnResult<SchoolSubject>>("post", "/v1/school/subject/add", { data });
};

/**
 * 更新学科
 * @param data 学科数据
 * @returns 更新结果
 */
export const updateSchoolSubject = (data: SchoolSubject) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/school/subject/update", { data });
};

/**
 * 删除学科
 * @param subjectId 学科ID
 * @returns 删除结果
 */
export const deleteSchoolSubject = (subjectId: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/school/subject/${subjectId}`);
};

// 学校招生计划管理接口部分

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
  return http.request<ReturnResult<SchoolPlan>>("post", "/v1/school/plan/add", { data });
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