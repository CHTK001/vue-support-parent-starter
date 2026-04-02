import { fetchSetting } from "@pages/setting";
import { useWatermark } from "@pureadmin/utils";
import {
  localStorageProxy,
  stopCrashDebugger,
  stopLoopDebugger,
  stopRedirectDebugger,
} from "@repo/utils";
import { defineStore } from "pinia";
import {
  closeGlobalSocketService,
  getGlobalSocketService,
  initGlobalSocketService,
  setGlobalSocketConfig,
  type ProtocolType,
} from "../../config/socketService";
import { useUserStoreHook } from "../../store/modules/UserStore";
import {
  CONFIG_VERSION_CHANGE_EVENT,
  buildFrontendSystemConfigOverrides,
  getConfig,
  getFrontendSystemConfig,
  getInitialConfig,
  putConfig,
} from "@repo/config";
import { useSettingStore } from "./SettingStore";
import { syncFrontendSystemRuntime } from "../../runtime/frontend-system";

const { setWatermark, clear } = useWatermark();
const DEFAULT_SYSTEM_SETTING = {
  LoopDebuggerOpen: "false",
  CrashPageOpen: "false",
  WatermarkOpen: "false",
  CodecResponseOpen: "false",
  CodecRequestOpen: "false",
  SocketStartupConnect: "true",
  watermarkColor: "#409EFF",
  CodecRequestKey: null,
};
const CONFIG_GROUP_PREFIX = "config:";

type ConfigVersionChangeEventDetail = {
  version?: string;
};

let configVersionChangeListenerBound = false;
let configVersionChangeStore:
  | { upgrade: (version: string) => Promise<void> | void }
  | null = null;
let configVersionChangeHandler:
  | ((event: Event) => void)
  | null = null;

export const bindConfigVersionUpgradeListener = (
  store: { upgrade: (version: string) => Promise<void> | void },
) => {
  if (typeof window === "undefined") {
    return;
  }

  configVersionChangeStore = store;

  if (!configVersionChangeHandler) {
    configVersionChangeHandler = (event: Event) => {
      const version = (event as CustomEvent<ConfigVersionChangeEventDetail>)
        ?.detail?.version;
      if (!version) {
        return;
      }
      void configVersionChangeStore?.upgrade(version);
    };
  }

  if (configVersionChangeListenerBound) {
    return;
  }

  window.addEventListener(
    CONFIG_VERSION_CHANGE_EVENT,
    configVersionChangeHandler as EventListener,
  );
  configVersionChangeListenerBound = true;
};

// 百度统计初始化函数
const initBaiduAnalytics = (hmId: string) => {
  if (!hmId) return;

  // 避免重复加载
  if (window._hmt) return;

  // 创建百度统计脚本
  const hmScript = document.createElement("script");
  hmScript.src = `https://hm.baidu.com/hm.js?${hmId}`;
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode.insertBefore(hmScript, firstScript);

  // 初始化_hmt对象
  window._hmt = window._hmt || [];
};

export const useConfigStore = defineStore({
  id: "config-setting",
  state: () => ({
    version: "1",
    settingGroup: "config",
    storageVersionKey: "config-setting-version",
    storageKey: "config-setting",
    systemSetting: {
      ...DEFAULT_SYSTEM_SETTING,
    },
    config: {},
    // API接口地址，如果设置则所有HTTP请求都走这个地址
    apiAddress: null as string | null,
    // 加载状态标志，防止重复加载
    isLoaded: false,
    isLoading: false,
  }),
  actions: {
    /**
     * 获取全局 Socket 服务
     * @returns Socket 服务实例
     */
    getSocket() {
      return getGlobalSocketService();
    },
    /**
     * 获取API接口地址
     * @returns API接口地址，如果未设置则返回null
     */
    getApiAddress(): string | null {
      return this.apiAddress;
    },
    /**
     * 设置API接口地址
     * @param address API接口地址
     */
    setApiAddress(address: string | null) {
      this.apiAddress = address;
      // 同步到配置中
      putConfig("ApiAddress", address);
    },
    /** 请求密钥 */
    codecRequestKey() {
      const str = this.systemSetting["config:CodecRequestKey"];
      if (!str) {
        return "";
      }
      var res = "";
      const sp = String(str).split("");
      for (var i = 0; i < sp.length; i++) {
        res += sp[i].charCodeAt(0).toString(16);
      }
      return res;
    },
    /** 响应式请求数据 */
    requestCodecOpen() {
      return this.systemSetting["config:CodecRequestOpen"] == "true";
    },
    async close() {
      stopCrashDebugger();
      stopLoopDebugger();
      stopRedirectDebugger();
      clear();
      closeGlobalSocketService();
    },
    async upgrade(version: any) {
      if (!version || this.version == version) {
        return;
      }
      //@ts-ignore
      const hash = window.location.hash.replace("#", "");
      if (hash == "/login" || hash == "/register") {
        return;
      }
      this.version = version;
      console.log("版本升级: " + version);
      setTimeout(() => {
        this.reset();
        localStorageProxy().setItem(this.storageVersionKey, this.version);
        this.version = version;
      }, 500);
    },
    async clear() {
      localStorageProxy().removeItem(this.storageKey);
      this.isLoaded = false;
      this.isLoading = false;
      this.close();
    },
    async reset() {
      this.clear();
      return this.load();
    },
    /** 登入 */
    async load() {
      bindConfigVersionUpgradeListener(this);
      // 如果已经加载过或正在加载中，直接返回
      if (this.isLoaded || this.isLoading) {
        return;
      }

      const config = getConfig();
      if (!config?.OpenSetting) {
        this.isLoaded = true;
        return;
      }

      this.isLoading = true;

      try {
        this.version = localStorageProxy().getItem(this.storageVersionKey);
        let dataSetting = localStorageProxy().getItem(this.storageKey);
        // 验证从localStorage获取的数据是否为有效数组
        if (typeof dataSetting === "string") {
          try {
            dataSetting = JSON.parse(dataSetting);
          } catch (e) {
            dataSetting = null;
          }
        }

        if (!dataSetting) {
          return new Promise<void>(async (resolve) => {
            try {
              const response = await fetchSetting(this.settingGroup);
              const data = response?.data; // 提取data字段
              if (!data) {
                this.isLoaded = true;
                this.isLoading = false;
                resolve(null);
                return;
              }
              localStorageProxy().setItem(this.storageKey, data);
              await this.doRegister(data);
              this.isLoaded = true;
            } catch (error) {
              // 兼容接口异常返回 Blob/text/plain 的情况，避免控制台只看到 Blob 对象
              const err: any = error as any;
              const blobLike = err instanceof Blob ? err : err?.response?.data;
              if (blobLike instanceof Blob) {
                blobLike
                  .text()
                  .then((text: string) => {
                    console.warn(
                      "Failed to fetch remote settings (blob):",
                      text || "[empty]",
                    );
                  })
                  .catch(() => {
                    console.warn(
                      "Failed to fetch remote settings (empty blob).",
                    );
                  });
              } else {
                console.warn("Failed to fetch remote settings:", error);
              }
              // 标记已尝试加载，避免后续反复进入远程加载逻辑
              this.isLoaded = true;
            } finally {
              this.isLoading = false;
            }
            resolve(null);
          });
        }

        return new Promise<void>(async (resolve) => {
          await this.doRegister(dataSetting);
          this.isLoaded = true;
          this.isLoading = false;
          resolve(null);
        });
      } catch (error) {
        console.error("Failed to load config:", error);
        this.isLoading = false;
        throw error;
      }
    },
    async doRegister(data) {
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = text ? JSON.parse(text) : [];
          data = parsed?.data?.data ?? parsed?.data ?? parsed;
        } catch (error) {
          console.warn("ConfigStore.doRegister: failed to parse blob data", error);
          return;
        }
      }

      if (data?.data && Array.isArray(data.data)) {
        data = data.data;
      }

      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        Object.keys(data).length === 0
      ) {
        return;
      }

      // 确保data是数组格式
      if (data && !Array.isArray(data)) {
        console.error("ConfigStore.doRegister: data is not an array", data);
        return;
      }

      const loadedNames = new Set<string>();
      data?.forEach((element) => {
        if (element?.sysSettingGroup === this.settingGroup && element?.sysSettingName) {
          loadedNames.add(element.sysSettingName);
        }
      });

      Object.keys(this.systemSetting)
        .filter((key) => key.startsWith(CONFIG_GROUP_PREFIX))
        .forEach((key) => {
          const name = key.slice(CONFIG_GROUP_PREFIX.length);
          if (loadedNames.has(name)) {
            return;
          }

          delete this.systemSetting[key];
          delete this.config[key];
          putConfig(name, getInitialConfig(name));
        });

      data?.forEach((element) => {
        const key = element.sysSettingGroup + ":" + element.sysSettingName;
        this.config[key] = element.sysSettingConfig;
        putConfig(element.sysSettingName, element.sysSettingValue);
        if (element.sysSettingName == "Version") {
          this.systemSetting[key] = element.sysSettingVersion;
        } else {
          this.systemSetting[key] = element.sysSettingValue;
        }
        // 添加日志便于调试，特别是主题相关配置
        if (element.sysSettingGroup === "theme") {
          console.debug(
            `[ConfigStore] Theme setting loaded: ${element.sysSettingName} = ${element.sysSettingValue}`,
          );
        }
      });
      const frontendSystemConfig = getFrontendSystemConfig(getInitialConfig());
      const frontendOverrides = buildFrontendSystemConfigOverrides(
        frontendSystemConfig,
      );

      Object.entries(frontendOverrides).forEach(([key, value]) => {
        putConfig(key, value);
        this.systemSetting[`${CONFIG_GROUP_PREFIX}${key}`] =
          typeof value === "string" ? value : String(value);
      });

      this.version = this.systemSetting["config:Version"] || "1";
      localStorageProxy().setItem(this.storageVersionKey, this.version);
      clear();
      await syncFrontendSystemRuntime(getInitialConfig());
      useSettingStore().setSetting(
        "Title",
        this.systemSetting["config:SystemName"] || getInitialConfig("Title"),
      );
      useSettingStore().setSetting(
        "BaseUrl",
        this.systemSetting["config:BaseUrl"] ?? getInitialConfig("BaseUrl"),
      );
      // 处理 ApiAddress 配置，如果存在则所有HTTP请求都走这个接口地址
      this.setApiAddress(
        this.systemSetting["config:ApiAddress"] ?? getInitialConfig("ApiAddress"),
      );
      if (this.systemSetting["config:WatermarkOpen"] == "true") {
        this.openWatermark();
      }
      if (
        this.systemSetting["config:SocketOpen"] == "true" &&
        this.systemSetting["config:SocketUrl"]
      ) {
        // 获取协议类型配置，默认 socketio
        const protocol =
          (this.systemSetting["config:SocketProtocol"] as ProtocolType) ||
          "socketio";
        const urls = this.systemSetting["config:SocketUrl"]?.split(",");
        const context = this.systemSetting["config:SocketPath"];

        // 缓存全局配置，供 createNamedSocketService 使用
        setGlobalSocketConfig({ protocol, urls, context });

        const startupConnect =
          this.systemSetting["config:SocketStartupConnect"] !== "false";
        const socketService = this.openSocket(
          urls,
          context,
          protocol,
          startupConnect,
        );
        if (!startupConnect) {
          socketService.disconnect();
        }
      } else {
        setGlobalSocketConfig({
          protocol: undefined,
          urls: [],
          context: undefined,
        });
        closeGlobalSocketService();
      }
      // 初始化百度统计
      if (this.systemSetting["config:BaiduHmId"]) {
        initBaiduAnalytics(this.systemSetting["config:BaiduHmId"]);
      }
    },
    /**
     * 打开 Socket 连接
     * 通过统一的 socketService 管理，根据协议类型自动选择实现
     *
     * @param urls 服务器地址数组
     * @param context 上下文路径（Socket.IO 专用）
     * @param protocol 协议类型，默认 socketio
     */
    openSocket(
      urls: string[],
      context?: string,
      protocol: ProtocolType = "socketio",
      startupConnect = true,
    ) {
      // 使用统一的 socketService 初始化
      const socket = initGlobalSocketService({
        protocol,
        urls,
        context,
        autoConnect: startupConnect,
      });
      if (startupConnect) {
        socket.connect();
      }
      return socket;
    },
    async openWatermark() {
      var config = {
        globalAlpha: 0.15,
        color: "#888",
        rotate: 0,
      };
      try {
        config.color = this.systemSetting["config:WatermarkColor"];
        config.globalAlpha = this.systemSetting["config:WatermarkAlpha"];
        config.rotate = this.systemSetting["config:WatermarkRotate"];
      } catch (error) {}
      setWatermark(useUserStoreHook().nickname, config);
    },
    /** 获取水印配置（供布局组件使用） */
    getWatermarkConfig() {
      return {
        enabled: this.systemSetting["config:WatermarkOpen"] == "true",
        text: useUserStoreHook().nickname || "水印",
        color: this.systemSetting["config:WatermarkColor"] || "#888",
        globalAlpha: this.systemSetting["config:WatermarkAlpha"] || 0.15,
        rotate: this.systemSetting["config:WatermarkRotate"] || -15,
      };
    },
  },
});

/**
 * 在组件外部使用 ConfigStore
 * @returns ConfigStore 实例
 */
export function useConfigStoreHook() {
  return useConfigStore();
}
