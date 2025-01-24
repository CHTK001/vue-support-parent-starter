import type { App } from "vue";
import { globalSetting } from "../setting";
import type { PlatformConfigs } from "../types/config";
import yaml from "js-yaml";

let config: object = {};
const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
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

export { getConfig, setConfig, responsiveStorageNameSpace, upgrade };
