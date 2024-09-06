import { defineStore } from "pinia";
import { fetchSetting } from "@/api/setting";
import { useUserStoreHook } from "@/store/modules/user";
import { useWatermark } from "@pureadmin/utils";
import { loopDebugger, redirectDebugger } from "@/utils/debug";
import { localStorageProxy } from "@/utils/storage";
import { ref, nextTick } from "vue";
import { socket } from "@/config/socket";

const preventLocal = ref();
const { setWatermark, clear } = useWatermark();

const { setWatermark: setPreventLocalWatermark } = useWatermark(preventLocal);
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
      CodecRequestKey: null
    },
    socket: null,
    config: {}
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
      this.version = localStorageProxy().getItem(this.storageVersionKey);
      const data = localStorageProxy().getItem(this.storageKey);
      if (!data) {
        return new Promise<void>(async resolve => {
          const { data } = await fetchSetting(this.settingGroup);

          localStorageProxy().setItem(this.storageKey, data);
          this.doRegister(data);
          resolve(null);
        });
      }

      return new Promise<void>(async resolve => {
        this.doRegister(data);
        resolve(null);
      });
    },
    async doRegister(data) {
      data.forEach(element => {
        this.config[element.sysSettingGroup + ":" + element.sysSettingName] = element.sysSettingConfig;
        if (element.sysSettingName == "Version") {
          this.systemSetting[element.sysSettingGroup + ":" + element.sysSettingName] = element.sysSettingVersion;
        } else {
          this.systemSetting[element.sysSettingGroup + ":" + element.sysSettingName] = element.sysSettingValue;
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
      if (this.systemSetting["config:WatermarkOpen"] == "true") {
        this.openWatermark();
      }
      if (this.systemSetting["config:SocketOpen"] == "true" && this.systemSetting["config:SocketUrl"]) {
        this.openSocket(this.systemSetting["config:SocketUrl"]?.split(","));
      }
    },
    async openSocket(urls) {
      this.close();
      this.socket = socket(urls);
    },
    async openWatermark() {
      var config = {
        globalAlpha: 0.15,
        color: "#888",
        rotate: 0
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
          height: 70
        });
      });
    }
  }
});
