import { http, type ReturnResult } from "@repo/utils";

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
  return http.request<ReturnResult<SchoolSubject>>("post", "/v1/school/subject/save", { data });
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