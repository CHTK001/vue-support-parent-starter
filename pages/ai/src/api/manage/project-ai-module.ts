import {
  deleteAiModule,
  listAiModules,
  pageAiModules,
  saveAiModule,
  updateAiModule,
} from "../ai/module";

/**
 * 项目模型分页列表
 */
export const fetchPageProjectForAiModule = (params) => {
  return pageAiModules(params);
};
/**
 * 项目模型列表
 */
export const fetchListProjectForAiModule = (params) => {
  return listAiModules(params?.sysAiModuleType);
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
