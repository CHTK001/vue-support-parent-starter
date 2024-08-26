import { defineStore } from "pinia";
import { fetchSetting } from "@/api/setting";
import { useUserStoreHook } from "@/store/modules/user";
import { useWatermark } from "@pureadmin/utils";
import { loopDebugger, redirectDebugger } from "@/utils/debug";
import { localStorageProxy } from "@/utils/storage";
import { ref, nextTick, onBeforeUnmount, onUnmounted } from "vue";
import { socket } from "@/config/socket";

const preventLocal = ref();
const { setWatermark, clear } = useWatermark();

const { setWatermark: setPreventLocalWatermark } = useWatermark(preventLocal);
onBeforeUnmount(() => {
  // 在离开该页面时清除整页水印
  clear();
});
export const useConfigStore = defineStore({
  id: "config-setting",
  state: () => ({
    version: "1",
    settingGroup: "config",
    storageKey: "config-setting",
    systemSetting: {
      openLoopDebugger: "false",
      openLoopRedirect: "false",
      openLoopWatermark: "false",
      watermarkColor: "#409EFF"
    },
    socket: null,
    config: {}
  }),
  actions: {
    async upgrade(version) {
      if (this.version == version) {
        return;
      }

      this.version = version;
      console.log("版本升级");
    },
    async clear() {
      localStorageProxy().removeItem(this.storageKey);
    },
    async reset() {
      this.clear();
      return this.load();
    },
    /** 登入 */
    async load() {
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
        this.systemSetting[
          element.sysSettingGroup + ":" + element.sysSettingName
        ] = element.sysSettingValue;
        this.config[element.sysSettingGroup + ":" + element.sysSettingName] =
          element.sysSettingConfig;
      });

      this.version = this.systemSetting["config:version"] || "1";
      if (this.systemSetting["config:openLoopDebugger"] == "true") {
        loopDebugger();
      }
      if (this.systemSetting["config:openLoopRedirect"] == "true") {
        redirectDebugger();
      }
      if (this.systemSetting["config:openLoopWatermark"] == "true") {
        this.openWatermark();
      }
      if (
        this.systemSetting["config:openSocket"] == "true" &&
        this.systemSetting["config:socket_url"]
      ) {
        this.openSocket(this.systemSetting["config:socket_url"]?.split(","));
      }
    },
    async openSocket(urls) {
      this.socket = socket(urls);
      onUnmounted(() => {
        this.socket?.close();
      });
    },
    async openWatermark() {
      var config = {};
      try {
        config = JSON.parse(config["config:openLoopWatermark"]);
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
