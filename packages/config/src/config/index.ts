import type { App } from "vue";
import { globalSetting } from "../setting";
import type { PlatformConfigs } from "../types/config";
import yaml from "js-yaml";

let config: object = {};
let configGroup: object = {};
const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

const putConfig = (key: string, value: object) => {
  config[key] = value;
};

setConfig(globalSetting);
//@ts-ignore
const extConfig = import.meta.glob("@/application*.y(a)?ml", {
  eager: true,
  query: "raw",
});
Object.entries(extConfig).map(([key, value]: any) => {
  const data = yaml.load(value.default);
  setConfig(data);
});

/** 版本升级 */
const upgrade = async (version) => {
  localStorage.getItem("version") !== version && localStorage.setItem("version", version);
};

/** 获取配置组 */
const getConfigGroup = (groupName?: string): PlatformConfigs | any => {
  return configGroup[groupName];
};

/** 设置配置组 */
const setConfigGroup = (groupName: string, key: string, value: object) => {
  if (!configGroup[key]) {
    configGroup[key] = {};
  }
  configGroup[groupName][key] = value;
  setConfig({ key: value });
};

/** 获取配置 */
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
export const getStaticPlatformConfig = (app: App, callback: Function) => {
  app.config.globalProperties.$config = getConfig();
  //@ts-ignore
  const viteEnv = window?.__APP_CONFIG__ || {};
  setConfig({
    defaultUsername: viteEnv.VITE_APP_DEFAULT_USERNAME,
    defaultPassword: viteEnv.VITE_APP_DEFAULT_PASSWORD,
  });
  callback(config);
};
/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<PlatformConfigs> => {
  app.config.globalProperties.$config = getConfig();
  //@ts-ignore
  const viteEnv = window?.__APP_CONFIG__ || {};
  setConfig({
    defaultUsername: viteEnv.VITE_APP_DEFAULT_USERNAME,
    defaultPassword: viteEnv.VITE_APP_DEFAULT_PASSWORD,
  });
  return new Promise((resolve) => {
    resolve(config);
  });
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, putConfig, responsiveStorageNameSpace, upgrade };
