import { fetchSetting } from "@pages/setting";
import { useWatermark } from "@pureadmin/utils";
import { localStorageProxy, loopDebugger, redirectDebugger } from "@repo/utils";
import { defineStore } from "pinia";
import {
  closeGlobalSocketService,
  getGlobalSocketService,
  initGlobalSocketService,
  setGlobalSocketConfig,
  type ProtocolType,
} from "../../config/socketService";
import { useUserStoreHook } from "../../store/modules/UserStore";
import { getConfig, putConfig } from "../utils";
import { useSettingStore } from "./SettingStore";
const config = getConfig();

const { setWatermark, clear } = useWatermark();

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
      LoopDebuggerOpen: "false",
      CrashPageOpen: "false",
      WatermarkOpen: "false",
      CodecResponseOpen: "false",
      CodecRequestOpen: "false",
      watermarkColor: "#409EFF",
      CodecRequestKey: null,
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
      if (address) {
        putConfig("ApiAddress", address);
      }
    },
    /** 请求密钥 */
    codecRequestKey() {
      const str = this.systemSetting["config:CodecRequestKey"];
      var res = "";
      const sp = str.split("");
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
      // 如果已经加载过或正在加载中，直接返回
      if (this.isLoaded || this.isLoading) {
        return;
      }
      
      if (!config.OpenSetting) {
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
              console.warn("Failed to fetch remote settings:", error);
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
      // 确保data是数组格式
      if (data && !Array.isArray(data)) {
        console.error("ConfigStore.doRegister: data is not an array", data);
        return;
      }

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
          console.debug(`[ConfigStore] Theme setting loaded: ${element.sysSettingName} = ${element.sysSettingValue}`);
        }
      });
      this.version = this.systemSetting["config:Version"] || "1";
      localStorageProxy().setItem(this.storageVersionKey, this.version);
      if (this.systemSetting["config:LoopDebuggerOpen"] == "true") {
        loopDebugger();
      }
      if (this.systemSetting["config:CrashPageOpen"] == "true") {
        redirectDebugger();
      }
      if (this.systemSetting["config:SystemName"]) {
        useSettingStore().setSetting(
          "Title",
          this.systemSetting["config:SystemName"]
        );
      }
      if (this.systemSetting["config:BaseUrl"]) {
        useSettingStore().setSetting(
          "BaseUrl",
          this.systemSetting["config:BaseUrl"]
        );
      }
      // 处理 ApiAddress 配置，如果存在则所有HTTP请求都走这个接口地址
      if (this.systemSetting["config:ApiAddress"]) {
        this.setApiAddress(this.systemSetting["config:ApiAddress"]);
      }
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
        
        this.openSocket(urls, context, protocol);
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
    async openSocket(
      urls: string[],
      context?: string,
      protocol: ProtocolType = "socketio"
    ) {
      // 使用统一的 socketService 初始化
      const socket = initGlobalSocketService({
        protocol,
        urls,
        context,
      });
      socket.connect();
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
