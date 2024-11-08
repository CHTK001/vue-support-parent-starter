import { loadModule } from "vue3-sfc-loader";
import { defineAsyncComponent } from "vue";
import * as Vue from "vue";
import { fetchGetSfc } from "@/api/manage/sfc";
import * as date from "@/utils/date";
import { isNumber } from "@pureadmin/utils";
import * as http from "@/utils/http";
import * as Config from "@/config";
import * as sass from "sass";
import * as echarts from "echarts";
import EchartsLayoutVue from "@/components/scEcharts/index.vue";

const getOptions = (name, sysSfcId) => {
  return {
    moduleCache: {
      vue: Vue,
      date: date,
      http: http,
      config: Config,
      echarts: echarts
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
        const code = await fetchGetSfc({ sysSfcId: sysSfcId });
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
        canonicalize: str => new URL(str, "file:"),
        load: async url => {
          const res = options.getResource({ refPath: filename, relPath: url.pathname }, options);
          const content = await res.getContent();
          return {
            contents: await content.getContentData(false),
            syntax: content.type.slice(1) // content.type is the file extension, then just strip the "."
          };
        }
      };

      try {
        const compiled = await sass.compileStringAsync(src, {
          importers: [sassDepImporter]
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
        textContent
      });
      const ref = document.head.getElementsByTagName("style")[0] || null;
      document.head.insertBefore(style, ref);
    }
  };
};

const cacheLoadModule = {};
export const loadSfcModule = (name, sysSfcId) => {
  return defineAsyncComponent(async () => {
    let module = cacheLoadModule[sysSfcId];
    if (module) {
      if (module.timestamp + 360_000 < new Date().getTime()) {
        cacheLoadModule[sysSfcId] = null;
      } else {
        return module.module;
      }
    }
    const res = await loadModule(name, getOptions(name, sysSfcId));
    cacheLoadModule[sysSfcId] = {
      timestamp: new Date().getTime(),
      module: res
    };
    return res;
  });
};

export const loadRemoteModule = url => {
  return defineAsyncComponent(async () => {
    const res = await loadModule(url, getOptions(url, url));
    return res;
  });
};
