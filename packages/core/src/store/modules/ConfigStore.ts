import { fetchSetting } from "@pages/setting";
import { useWatermark } from "@pureadmin/utils";
import { localStorageProxy, loopDebugger, redirectDebugger } from "@repo/utils";
import { defineStore } from "pinia";
import { nextTick, ref } from "vue";
import { provideGlobalSocket } from "../../config/socket";
import { useUserStoreHook } from "../../store/modules/UserStore";
import { getConfig, putConfig } from "../utils";
import { useSettingStore } from "./SettingStore";
const config = getConfig();

const preventLocal = ref();
const { setWatermark, clear } = useWatermark();

const { setWatermark: setPreventLocalWatermark } = useWatermark(preventLocal);

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
    socket: null,
    config: {},
  }),
  actions: {
    getSocket() {
      return this.socket;
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
      this.socket?.close();
      this.socket = null;
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
      this.close();
    },
    async reset() {
      this.clear();
      return this.load();
    },
    /** 登入 */
    async load() {
      if (!config.OpenSetting) {
        return;
      }
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
          const response = await fetchSetting(this.settingGroup);
          const data = response.data; // 提取data字段
          if(!data) {
            resolve(null);
            return;
          }
          localStorageProxy().setItem(this.storageKey, data);
          this.doRegister(data);
          resolve(null);
        });
      }

      return new Promise<void>(async (resolve) => {
        this.doRegister(dataSetting);
        resolve(null);
      });
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
        useSettingStore().setSetting("Title", this.systemSetting["config:SystemName"]);
      }
      if (this.systemSetting["config:BaseUrl"]) {
        useSettingStore().setSetting("BaseUrl", this.systemSetting["config:BaseUrl"]);
      }
      if (this.systemSetting["config:WatermarkOpen"] == "true") {
        this.openWatermark();
      }
      if (this.systemSetting["config:SocketOpen"] == "true" && this.systemSetting["config:SocketUrl"]) {
        this.openSocket(this.systemSetting["config:SocketUrl"]?.split(","), this.systemSetting["config:SocketPath"]);
      }
      // 初始化百度统计
      if (this.systemSetting["config:BaiduHmId"]) {
        initBaiduAnalytics(this.systemSetting["config:BaiduHmId"]);
      }
    },
    async openSocket(urls, context) {
      this.close();
      this.socket = provideGlobalSocket(urls, context, {});
      this.socket.connect();
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
      nextTick(() => {
        setPreventLocalWatermark("无法删除的水印", {
          forever: true,
          width: 180,
          height: 70,
        });
      });
    },
  },
});