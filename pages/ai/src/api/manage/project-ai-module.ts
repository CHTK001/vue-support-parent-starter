import {
  deleteAiModule,
  listAiModules,
  pageAiModules,
  saveAiModule,
  updateAiModule,
} from "../ai/module";

const normalizeModuleType = (value?: string) => {
  if (!value) return value;
  if (value === "VINCENT") return "IMAGE";
  return value;
};

const mapLegacyModule = (item) => ({
  ...item,
  sysProjectIcon: item?.sysProjectIcon || item?.sysAiModuleImage || "",
  sysProjectName: item?.sysProjectName || item?.sysAiModuleVendor || "",
  sysAiModuleType: item?.sysAiModuleType === "IMAGE" ? "VINCENT" : item?.sysAiModuleType,
});

/**
 * 项目模型分页列表
 */
export const fetchPageProjectForAiModule = (params) => {
  const query = {
    ...params,
    sysAiModuleType: normalizeModuleType(params?.sysAiModuleType),
  };
  return pageAiModules(query).then((res) => ({
    ...res,
    data: res?.data
      ? {
          ...res.data,
          records: (res.data.records || []).map(mapLegacyModule),
        }
      : res?.data,
  }));
};
/**
 * 项目模型列表
 */
export const fetchListProjectForAiModule = (params) => {
  return listAiModules(normalizeModuleType(params?.sysAiModuleType)).then((res) => ({
    ...res,
    data: (res?.data || []).map(mapLegacyModule),
  }));
};
/**
 * 删除模型模板
 */
export const fetchDeleteProjectForAiModule = (params) => {
  return deleteAiModule(params?.sysAiModuleId);
};
/**
 * 更新模型模板
 */
export const fetchUpdateProjectForAiModule = (params) => {
  return updateAiModule(params);
};
/**
 * 新增模型模板
 */
export const fetchSaveProjectForAiModule = (params) => {
  return saveAiModule(params);
};
