import type { App } from "vue";
import { globalSetting } from "../setting";
import { PlatformConfigs } from "../../index";

let config: object = {};
const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};
setConfig(globalSetting);

/** 版本升级 */
const upgrade = async (version) => {
  localStorage.getItem("version") !== version &&
    localStorage.setItem("version", version);
};

const getConfig = (key?: string): PlatformConfigs | any => {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data = config;
      arr.forEach((v) => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v];
        } else {
          data = null;
        }
      });
      return data;
    }
  }
  return config;
};

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<PlatformConfigs> => {
  app.config.globalProperties.$config = getConfig();

  return new Promise((resolve) => {
    Object.assign(config, globalSetting);
    resolve(globalSetting);
  });
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace, upgrade };