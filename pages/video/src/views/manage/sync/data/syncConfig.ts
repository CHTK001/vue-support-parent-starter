import { reactive } from "vue";

// 同步配置接口定义
export interface SyncConfigFormState {
  videoSyncConfigId?: string;
  videoSyncConfigName: string;
  videoSyncConfigType: string;
  videoSyncConfigUrl: string;
  videoSyncConfigSource?: string;
  videoSyncConfigKey?: string;
  videoSyncConfigCookie?: string;
  videoSyncConfigExtra?: string;
  videoSyncConfigEnabled: boolean;
}

// 同步类型选项
export const syncTypeOptions = [{ label: "观影", value: "GUANYING" }];

// 默认表单状态
export const getDefaultSyncConfig = (): SyncConfigFormState => ({
  videoSyncConfigName: "",
  videoSyncConfigType: "GUANYING",
  videoSyncConfigUrl: "",
  videoSyncConfigSource: "",
  videoSyncConfigKey: "",
  videoSyncConfigCookie: "",
  videoSyncConfigExtra: "",
  videoSyncConfigEnabled: true,
});

// 表单验证规则
export const syncConfigRules = {
  videoSyncConfigName: [{ required: true, message: "请输入同步配置名称", trigger: "blur" }],
  videoSyncConfigType: [{ required: true, message: "请选择同步方式", trigger: "change" }],
  videoSyncConfigUrl: [{ required: true, message: "请输入同步地址", trigger: "blur" }],
};

// 创建一个新的同步配置表单状态
export const createSyncFormState = () => {
  return reactive<SyncConfigFormState>(getDefaultSyncConfig());
};

// 重置表单状态
export const resetSyncFormState = (formState: SyncConfigFormState) => {
  Object.assign(formState, getDefaultSyncConfig());
};

// 从API响应填充表单状态
export const fillSyncFormFromResponse = (formState: SyncConfigFormState, response: any, id?: string) => {
  // 重置表单
  resetSyncFormState(formState);

  // 提取数据
  const syncData = response?.data?.data || response?.data || response;

  if (!syncData) return;

  // 设置ID
  if (id) {
    formState.videoSyncConfigId = id;
  }

  // 填充表单数据
  if (syncData.videoSyncConfigName) formState.videoSyncConfigName = syncData.videoSyncConfigName;
  if (syncData.videoSyncConfigType) formState.videoSyncConfigType = syncData.videoSyncConfigType;
  if (syncData.videoSyncConfigUrl) formState.videoSyncConfigUrl = syncData.videoSyncConfigUrl;
  if (syncData.videoSyncConfigKey) formState.videoSyncConfigKey = syncData.videoSyncConfigKey;
  if (syncData.videoSyncConfigCookie) formState.videoSyncConfigCookie = syncData.videoSyncConfigCookie;
  if (syncData.videoSyncConfigExtra) formState.videoSyncConfigExtra = syncData.videoSyncConfigExtra;
  if (syncData.videoSyncConfigEnabled !== undefined) formState.videoSyncConfigEnabled = !!syncData.videoSyncConfigEnabled;
  if (syncData.videoSyncConfigSource) formState.videoSyncConfigSource = syncData.videoSyncConfigSource;
};

// 验证额外参数是否为有效的JSON
export const validateExtraParams = (extraParams?: string): boolean => {
  if (!extraParams) return true;

  try {
    JSON.parse(extraParams);
    return true;
  } catch (e) {
    return false;
  }
};
