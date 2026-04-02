import { reactive, toRaw, type App } from "vue";
import { applyFrontendSystemConfigOverrides } from "../frontend-system";
import { globalSetting } from "../setting";
import type { PlatformConfigs } from "../types/config";
import yaml from "js-yaml";

const config = reactive<Record<string, any>>({});
const configGroup = reactive<Record<string, any>>({});
export const CONFIG_VERSION_CHANGE_EVENT = "repo-config-version-change";

const cloneConfig = (value: Record<string, any>) =>
  JSON.parse(JSON.stringify(toRaw(value ?? {})));

const setConfig = (cfg?: unknown, value?: unknown) => {
  if (typeof cfg === "string") {
    config[cfg] = value;
    return;
  }

  if (cfg && typeof cfg === "object") {
    Object.assign(config, cfg);
  }
};

const putConfig = (key: string, value: any) => {
  config[key] = value;
};

setConfig(globalSetting);
//@ts-ignore
const extConfig = import.meta.glob(["/src/app.y(a)?ml", "/app.y(a)?ml"], {
  eager: true,
  query: "?raw",
});
Object.values(extConfig).forEach((value: any) => {
  const data = yaml.load(value.default);
  setConfig(data);
});
const initialConfig = cloneConfig(config);
applyFrontendSystemConfigOverrides(setConfig, initialConfig);

/** 版本升级 */
const upgrade = (version: string) => {
  if (localStorage.getItem("version") !== version) {
    localStorage.setItem("version", version);
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(CONFIG_VERSION_CHANGE_EVENT, {
          detail: { version },
        }),
      );
    }
  }
};

/** 获取配置组 */
const getConfigGroup = (groupName?: string): PlatformConfigs | any => {
  return configGroup[groupName];
};

/** 设置配置组 */
const setConfigGroup = (groupName: string, key: string, value: object) => {
  if (!configGroup[groupName]) {
    configGroup[groupName] = {};
  }
  configGroup[groupName][key] = value;
  setConfig({ [key]: value });
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

/** 获取初始化基线配置 */
const getInitialConfig = (key?: string): PlatformConfigs | any => {
  if (!key) {
    return initialConfig;
  }

  const arr = key.split(".");
  if (!arr.length) {
    return initialConfig;
  }

  let data: any = initialConfig;
  arr.forEach((item) => {
    if (data && typeof data[item] !== "undefined") {
      data = data[item];
    } else {
      data = null;
    }
  });
  return data;
};

/** 获取项目动态全局配置 */
export const getStaticPlatformConfig = (
  app: App,
  callback: (config: PlatformConfigs | Record<string, any>) => void,
) => {
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
  return config as PlatformConfigs;
};

/**
 *
 * 解释路径
 * @param path 路径
 */
export const resolveAbsolutePath = (path: string) => {
  const baseUrl = getConfig()["BaseUrl"] || "";

  if (!path) {
    return baseUrl;
  }
  return path.startsWith("/") ? baseUrl + path : baseUrl + "/" + path;
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export {
  getConfig,
  getInitialConfig,
  getConfigGroup,
  putConfig,
  responsiveStorageNameSpace,
  setConfig,
  setConfigGroup,
  upgrade,
};
