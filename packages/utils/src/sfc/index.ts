import { defineAsyncComponent } from "vue";
import * as Vue from "vue";
import { isNumber } from "@pureadmin/utils";
import { http } from "../http";
import * as date from "../date";
import * as Config from "@repo/config";
import * as sass from "sass";
import * as echarts from "echarts";
import EchartsLayoutVue from "@repo/components/ScEcharts/index.vue";
import { loadJS } from "../load";
import type { ReturnResult } from "../http";
import { getConfig } from "@repo/config";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import FrameComponent from "@repo/pages/layout/simpleFrame.vue";

const getOptions = (name, sysSfcId) => {
  return {
    moduleCache: {
      vue: Vue,
      date: date,
      http: http,
      config: Config,
      echarts: echarts,
    },
    devMode: true,
    loadModule(id) {
      if (id.indexOf("vue.js") > -1) {
        return Vue;
      }

      if (id.indexOf("scEcharts/index.vue") > -1) {
        return EchartsLayoutVue;
      }

      if (id.indexOf("utils/http") > -1) {
        return http;
      }
      if (id.indexOf("utils/date") > -1) {
        return date;
      }

      if (id.indexOf("config/index.ts") > -1) {
        return Config;
      }
    },
    pathResolve({ refPath, relPath }) {
      let path = refPath;
      if (relPath === ".") {
        // self
        path = refPath;
      } else if (relPath.indexOf("iconify-icons") !== -1) {
        path = String(new URL(relPath.replace("@", "/node_modules/@"), window.location.href)) + ".js";
      } else if (relPath[0] === "@" && relPath.indexOf(".") === -1) {
        path = String(new URL(relPath.replace("@", "/src/"), window.location.href)) + ".ts";
      } else if (relPath[0] === "@" && relPath.indexOf(".") != -1) {
        path = String(new URL(relPath.replace("@", "/src/"), window.location.href));
      } else if (relPath[0] !== "." && relPath[0] !== "/") {
        path = relPath;
      } else if (relPath[0] == ".") {
        path = String(new URL("/src" + relPath.substring(1), window.location.href));
      } else {
        path = String(new URL(relPath, window.location.href));
      }
      return path;
    },
    async getFile(url) {
      if (url === name && sysSfcId && isNumber(sysSfcId)) {
        //@ts-ignore
        const params = {
          sysSfcId: sysSfcId,
        };
        const code = await http.request<ReturnResult<Boolean>>("get", "/v2/sfc/get", {
          params,
        });
        return code?.data;
      }
      url = /.*?\.js|.mjs|.ts|.css|.less|.vue$/.test(url) ? url : `${url}.vue`;
      const type = /.*?\.js|.mjs.*$/.test(url) ? ".mjs" : /.*?\.vue.*$/.test(url) ? ".vue" : /.*?\.css.*$/.test(url) ? ".css" : /.*?\.ts.*$/.test(url) ? ".ts" : ".vue";
      const getContentData = async () => {
        const res = await fetch(url);
        const rs = await res.text();
        return rs;
      };
      return { getContentData: getContentData, type: type };
    },
    async handleModule(type, getContentData, path, options) {
      switch (type) {
        case ".css":
          const res = await getContentData(false);
          options.addStyle(res);
          return null;
        case ".less":
          console.error(".......");
      }
    },
    async processStyles(src, lang, filename, options) {
      // if (lang !== "sass" && lang !== "scss") {
      //   throw new Error(`unsupported "${lang}" style processor`);
      // }
      const sassDepImporter = {
        canonicalize: (str) => new URL(str, "file:"),
        load: async (url) => {
          const res = options.getResource({ refPath: filename, relPath: url.pathname }, options);
          const content = await res.getContent();
          return {
            contents: await content.getContentData(false),
            syntax: content.type.slice(1), // content.type is the file extension, then just strip the "."
          };
        },
      };

      try {
        const compiled = await sass.compileStringAsync(src, {
          importers: [sassDepImporter],
        });

        return compiled.css;
      } catch (ex) {
        options.log("error", ex.message);
        return undefined;
      }
    },
    log(type, ...args) {
      console.log(type, ...args);
    },
    addStyle(textContent) {
      const style = Object.assign(document.createElement("style"), {
        textContent,
      });
      const ref = document.head.getElementsByTagName("style")[0] || null;
      document.head.insertBefore(style, ref);
    },
  };
};

const cacheLoadModule = {};
/**
 * 加载远程组件
 * @param name
 * @param sysSfcId
 * @param sysSfc
 */
const loadRemoteModule = (name, sysSfcId, sysSfc) => {
  return defineAsyncComponent({
    loadingComponent: LoadingComponent,
    delay: sysSfc.delay || 0,
    timeout: sysSfc.timeout || 1000,
    loader: async () => {
      let module = cacheLoadModule[sysSfcId];
      if (module) {
        if (module.timestamp + 360_000 < new Date().getTime()) {
          cacheLoadModule[sysSfcId] = null;
        } else {
          return module.module;
        }
      }
      let res = null;
      await loadJS(getConfig().sfcScriptUrl, "js", undefined);
      const loadModule = exports["vue3-sfc-loader"]?.loadModule || window["vue3-sfc-loader"]?.loadModule;
      res = await loadModule(name, getOptions(name, sysSfcId));
      cacheLoadModule[sysSfcId] = {
        timestamp: new Date().getTime(),
        module: res,
      };
      return res;
    },
  });
};
const localModule = {};
Object.entries(
  //@ts-ignore
  import.meta.glob(["../../../module/**/*.json"], {
    eager: true,
    query: "raw",
  })
).map(([key, value]: any) => {
  const setting = JSON.parse(value.default);
  setting.vue = key.replace("config.json", "index.vue");
  localModule[key.replace("../../..", "@repo").replace("config.json", "index.vue") + ""] = setting;
});

const loadRemoteAddressModule = (name, sysSfcId, sysSfc) => {
  return FrameComponent;
};
/**
 * 加载远程组件
 *   // return defineAsyncComponent({
 *       //   // 加载组件时的 loading 组件
 *       //   loadingComponent: LoadingComponent,
 *       //   // 异步加载的组件工厂
 *       //   loader: () => loadSfcModule(sysSfc.sysSfcName + ".vue", sysSfc.sysSfcId),
 *       //   // 加载超时的时间（可选）
 *       //   delay: 2000,
 *       //   // 最大等待时间，超时将显示加载组件（可选）
 *       //   timeout: 3000
 *
 *       // });
 * @param name
 * @param sysSfcId
 */
export const loadSfcModule = (name, sysSfcId, sysSfc) => {
  if (sysSfc.sysSfcType === 0 || sysSfc.sysSfcType === 1) {
    return loadRemoteModule(name, sysSfcId, sysSfc);
  }

  if (sysSfc.sysSfcType === 2) {
    return loadRemoteAddressModule(name, sysSfcId, sysSfc);
  }
  //@vite-ignore
  return () => import(localModule[sysSfc.sysSfcPath]["vue"]);
};
