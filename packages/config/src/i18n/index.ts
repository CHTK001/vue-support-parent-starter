// 多组件库的国际化和本地项目国际化兼容
import { isObject } from "@pureadmin/utils";
import { localStorageProxy, mergeObjects } from "@repo/utils";
import type { App, WritableComputedRef } from "vue";
import { createI18n, type I18n } from "vue-i18n";
import { responsiveStorageNameSpace } from "../../index";
import { StorageConfigs } from "./type";
// element-plus国际化
import enLocale from "element-plus/es/locale/lang/en";
import zhLocale from "element-plus/es/locale/lang/zh-cn";
import yaml from "js-yaml";
const siphonI18n = (function () {
  // 仅初始化一次国际化配置
  let cache1 = Object.fromEntries(
    Object.entries(
      //@ts-ignore
      import.meta.glob(["../../locales/*.y(a)?ml"], {
        eager: true,
        query: "raw",
      })
    ).map(([key, value]: any) => {
      const matched = key.match(/([A-Za-z0-9-_]+)\./i)[1];
      return [matched, yaml.load(value.default)];
    })
  );
  // 仅初始化一次国际化配置
  let cache2 = Object.fromEntries(
    Object.entries(
      //@ts-ignore
      import.meta.glob(["../../locales/*.json"], {
        eager: true,
        query: "raw",
      })
    ).map(([key, value]: any) => {
      const matched = key.match(/([A-Za-z0-9-_]+)\./i)[1];
      return [matched, JSON.parse(value.default)];
    })
  );
  let extCache = Object.fromEntries(
    Object.entries(
      //@ts-ignore
      import.meta.glob("@/locales/*.y(a)?ml", {
        eager: true,
        query: "raw",
      })
    ).map(([key, value]: any) => {
      const matched = key.match(/([A-Za-z0-9-_]+)\./i)[1];
      return [matched, yaml.load(value.default)];
    })
  );
  let extCache2 = Object.fromEntries(
    Object.entries(
      //@ts-ignore
      import.meta.glob("@/locales/*.json", {
        eager: true,
        query: "raw",
      })
    ).map(([key, value]: any) => {
      const matched = key.match(/([A-Za-z0-9-_]+)\./i)[1];
      return [matched, JSON.parse(value.default)];
    })
  );
  const _cache = mergeObjects(extCache, extCache2);
  const _cache1 = mergeObjects(cache1, _cache);
  const cache3 = mergeObjects(_cache1, cache2);
  return (prefix = "zh-CN") => {
    return cache3[prefix];
  };
})();

export const localesConfigs = {
  "zh-CN": {
    ...siphonI18n("zh-CN"),
    ...zhLocale,
  },
  "en-US": {
    ...siphonI18n("en-US"),
    ...enLocale,
  },
};

/** 获取对象中所有嵌套对象的key键，并将它们用点号分割组成字符串 */
function getObjectKeys(obj) {
  const stack = [];
  const keys: Set<string> = new Set();

  stack.push({ obj, key: "" });

  while (stack.length > 0) {
    const { obj, key } = stack.pop();

    for (const k in obj) {
      const newKey = key ? `${key}.${k}` : k;

      if (obj[k] && isObject(obj[k])) {
        stack.push({ obj: obj[k], key: newKey });
      } else {
        keys.add(newKey);
      }
    }
  }

  return keys;
}

/** 将展开的key缓存 */
const keysCache: Map<string, Set<string>> = new Map();
const flatI18n = (prefix = "zh-CN") => {
  let cache = keysCache.get(prefix);
  if (!cache) {
    cache = getObjectKeys(siphonI18n(prefix));
    keysCache.set(prefix, cache);
  }
  return cache;
};

/**
 * 国际化转换工具函数（自动读取根目录locales文件夹下文件进行国际化匹配）
 * @param message message
 * @returns 转化后的message
 */
export function transformI18n(message: any = "") {
  if (!message) {
    return "";
  }

  // 处理存储动态路由的title,格式 {zh:"",en:""}
  if (typeof message === "object") {
    const locale: string | WritableComputedRef<string> | any = i18n.global.locale;
    return message[locale?.value];
  }

  const key = message.match(/(\S*)\./)?.input ? message.match(/(\S*)\./)?.input : message;

  if (key && flatI18n("zh-CN").has(key)) {
    return i18n.global.t.call(i18n.global.locale, message);
  } else if (!key && Object.hasOwn(siphonI18n("zh-CN"), message)) {
    // 兼容非嵌套形式的国际化写法
    return i18n.global.t.call(i18n.global.locale, message);
  } else {
    return message;
  }
}

/** 此函数只是配合i18n Ally插件 */
export const $t = (key: string) => {
  return transformI18n(key);
};

const getLocale = () => {
  try {
    const key = localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}locale`)?.locale || "zh-CN";
    if (localesConfigs[key]) {
      return key;
    }
    return "zh-CN";
  } catch (error) {
    try {
      return JSON.parse(localStorage.getItem(`${responsiveStorageNameSpace()}locale`))?.locale || "zh-CN";
    } catch (error) {}
  }
  return navigator.language;
};
export const i18n: I18n = createI18n({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: "zh-CN",
  messages: localesConfigs,
});

export function useI18n(app: App) {
  app.use(i18n);
}
