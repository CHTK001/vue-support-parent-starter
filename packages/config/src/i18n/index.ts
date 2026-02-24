// 多组件库的国际化和本地项目国际化兼容
import { isObject } from "@pureadmin/utils";
import type { App, WritableComputedRef } from "vue";
import { computed } from "vue";
import { createI18n, type I18n } from "vue-i18n";
import { StorageConfigs } from "./type";
// element-plus国际化
import enLocale from "element-plus/es/locale/lang/en";
import zhLocale from "element-plus/es/locale/lang/zh-cn";
import yaml from "js-yaml";

/**
 * 合并对象
 * @param obj1 - 要合并的对象
 * @param obj2 - 要合并的对象
 * @returns 合并后的对象
 */
function mergeObjects(obj1, obj2) {
  for (var key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj1.hasOwnProperty(key) && typeof obj1[key] === "object" && typeof obj2[key] === "object") {
        mergeObjects(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
}

const siphonI18n = (function () {
  /**
   * 加载国际化文件
   * @param globResult - import.meta.glob 的结果
   * @param parser - 解析函数（yaml.load 或 JSON.parse）
   * @param source - 来源描述（用于调试）
   * @returns 解析后的国际化对象
   */
  const loadI18nFiles = (globResult: Record<string, any>, parser: (content: string) => any, source: string): Record<string, any> => {
    try {
      const entries = Object.entries(globResult);
      
      //@ts-ignore
      if (import.meta.env?.DEV) {
        console.log(`[i18n] ${source} - 匹配到 ${entries.length} 个文件:`, entries.map(([key]) => key));
      }
      
      if (entries.length === 0) {
        return {};
      }
      return Object.fromEntries(
        entries
          .map(([key, value]: any) => {
            try {
              const matched = key.match(/([A-Za-z0-9-_]+)\./i);
              if (!matched || !matched[1]) {
                console.warn(`[i18n] ${source} - 无法从路径中提取语言代码: ${key}`);
                return null;
              }
              const langCode = matched[1];
              const content = value?.default || value;
              if (!content) {
                console.warn(`[i18n] ${source} - 文件内容为空: ${key}`);
                return null;
              }
              const parsed = parser(content);
      //@ts-ignore
              if (import.meta.env?.DEV) {
                console.log(`[i18n] ${source} - 成功加载: ${key} -> ${langCode}`);
              }
              return [langCode, parsed];
            } catch (error) {
              console.error(`[i18n] ${source} - 解析文件失败: ${key}`, error);
              return null;
            }
          })
          .filter((entry): entry is [string, any] => entry !== null)
      );
    } catch (error) {
      console.error(`[i18n] ${source} - 加载国际化文件失败`, error);
      return {};
    }
  };

  // 加载相对路径的 yaml 文件（从 packages/config/src/i18n/index.ts 到 packages/config/locales）
  const cache1 = loadI18nFiles(import.meta.glob("../../locales/*.y(a)?ml", { eager: true, query: "?raw" }), (content) => yaml.load(content), "相对路径 YAML");
  // 加载相对路径的 json 文件
  const cache2 = loadI18nFiles(import.meta.glob("../../locales/*.json", { eager: true, query: "?raw" }), (content) => JSON.parse(content), "相对路径 JSON");
  // 加载应用级别的 yaml 文件
  const extCache = loadI18nFiles(import.meta.glob("@/locales/*.y(a)?ml", { eager: true, query: "?raw" }), (content) => yaml.load(content), "应用级别 YAML");
  // 加载应用级别的 json 文件
  const extCache2 = loadI18nFiles(import.meta.glob("@/locales/*.json", { eager: true, query: "?raw" }), (content) => JSON.parse(content), "应用级别 JSON");

  // 合并所有缓存（应用级别优先级最高，其次为相对路径）
  // 确保每个合并步骤都有默认空对象，防止没有数据时出错
  const packageCache = mergeObjects(cache1 || {}, cache2 || {});
  const appCache = mergeObjects(extCache || {}, extCache2 || {});
  const finalCache = mergeObjects(packageCache, appCache);

  // 开发环境下输出调试信息
      //@ts-ignore
  if (import.meta.env?.DEV) {
    const availableLangs = Object.keys(finalCache);
    if (availableLangs.length > 0) {
      console.log(`[i18n] 已加载语言: ${availableLangs.join(", ")}`);
      console.log(`[i18n] 各来源加载情况:`);
      console.log(`  - 相对路径 YAML: ${Object.keys(cache1).join(", ") || "无"}`);
      console.log(`  - 相对路径 JSON: ${Object.keys(cache2).join(", ") || "无"}`);
      console.log(`  - 应用级别 YAML: ${Object.keys(extCache).join(", ") || "无"}`);
      console.log(`  - 应用级别 JSON: ${Object.keys(extCache2).join(", ") || "无"}`);
    } else {
      console.warn("[i18n] 未找到任何国际化文件");
    }
  }

  const getI18n = (prefix = "zh-CN") => {
    const result = finalCache[prefix];
      //@ts-ignore
    if (!result && import.meta.env?.DEV) {
      console.warn(`[i18n] 未找到语言配置: ${prefix}，可用语言: ${Object.keys(finalCache).join(", ")}`);
    }
    return result || {};
  };

  // 暴露所有已加载的语言代码
  (getI18n as any).getAllLanguages = () => Object.keys(finalCache);

  return getI18n as typeof getI18n & { getAllLanguages: () => string[] };
})();

/**
 * 语言短缩写到完整语言代码的映射表
 * 支持在URL中使用短缩写（如 en、zh）自动转换为完整代码（如 en-US、zh-CN）
 */
const languageShortcutMap: Record<string, string> = {
  "zh": "zh-CN",
  "en": "en-US",
  "cn": "zh-CN",
  "us": "en-US",
};

/**
 * Element Plus 语言映射表
 * 将语言代码映射到对应的 Element Plus locale 对象
 */
const elementPlusLocaleMap: Record<string, any> = {
  "zh-CN": zhLocale,
  "en-US": enLocale,
};

/**
 * 语言显示配置映射表
 * 包含语言代码、显示名称、国旗、描述等信息
 */
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
}

const languageConfigMap: Record<string, Omit<LanguageConfig, "code">> = {
  "zh-CN": {
    name: "简体中文",
    nativeName: "简体中文",
    flag: "🇨🇳",
    description: "Simplified Chinese",
  },
  "en-US": {
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    description: "United States",
  },
  "zh-TW": {
    name: "繁體中文",
    nativeName: "繁體中文",
    flag: "🇹🇼",
    description: "Traditional Chinese",
  },
  "ja-JP": {
    name: "日本語",
    nativeName: "日本語",
    flag: "🇯🇵",
    description: "Japanese",
  },
  "ko-KR": {
    name: "한국어",
    nativeName: "한국어",
    flag: "🇰🇷",
    description: "Korean",
  },
  "fr-FR": {
    name: "Français",
    nativeName: "Français",
    flag: "🇫🇷",
    description: "French",
  },
  "de-DE": {
    name: "Deutsch",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    description: "German",
  },
  "es-ES": {
    name: "Español",
    nativeName: "Español",
    flag: "🇪🇸",
    description: "Spanish",
  },
  "ru-RU": {
    name: "Русский",
    nativeName: "Русский",
    flag: "🇷🇺",
    description: "Russian",
  },
  "pt-BR": {
    name: "Português",
    nativeName: "Português",
    flag: "🇧🇷",
    description: "Portuguese (Brazil)",
  },
};

/**
 * 获取所有可用语言的配置
 * @returns 语言配置数组
 */
export function getAllLanguageConfigs(): LanguageConfig[] {
  const allLanguages = siphonI18n.getAllLanguages();
  const configs: LanguageConfig[] = [];

  for (const langCode of allLanguages) {
    const config = languageConfigMap[langCode];
    if (config) {
      configs.push({
        code: langCode,
        ...config,
      });
    } else {
      // 如果没有配置，使用默认值
      const parts = langCode.split("-");
      const lang = parts[0];
      const region = parts[1] || "";
      configs.push({
        code: langCode,
        name: langCode,
        nativeName: langCode,
        flag: "🌐",
        description: region ? `${lang} (${region})` : lang,
      });
    }
  }

  // 如果没有加载任何语言，至少提供默认的 zh-CN 和 en-US
  if (configs.length === 0) {
    configs.push(
      {
        code: "zh-CN",
        ...languageConfigMap["zh-CN"],
      },
      {
        code: "en-US",
        ...languageConfigMap["en-US"],
      }
    );
  }

  return configs;
}

/**
 * 获取指定语言的配置
 * @param langCode - 语言代码
 * @returns 语言配置，如果不存在则返回默认配置
 */
export function getLanguageConfig(langCode: string): LanguageConfig {
  const config = languageConfigMap[langCode];
  if (config) {
    return {
      code: langCode,
      ...config,
    };
  }

  // 如果没有配置，使用默认值
  const parts = langCode.split("-");
  const lang = parts[0];
  const region = parts[1] || "";
  return {
    code: langCode,
    name: langCode,
    nativeName: langCode,
    flag: "🌐",
    description: region ? `${lang} (${region})` : lang,
  };
}

/**
 * 自动生成 localesConfigs
 * 根据 siphonI18n 加载的所有语言自动生成配置
 */
const generateLocalesConfigs = (): Record<string, any> => {
  const allLanguages = siphonI18n.getAllLanguages();
  const configs: Record<string, any> = {};

  // 如果没有加载任何语言，至少提供默认的 zh-CN 和 en-US
  if (allLanguages.length === 0) {
    configs["zh-CN"] = {
      ...siphonI18n("zh-CN"),
      ...zhLocale,
    };
    configs["en-US"] = {
      ...siphonI18n("en-US"),
    ...enLocale,
    };
    return configs;
  }

  // 为每个已加载的语言生成配置
  for (const langCode of allLanguages) {
    const i18nMessages = siphonI18n(langCode);
    const elementPlusLocale = elementPlusLocaleMap[langCode];

    if (elementPlusLocale) {
      // 如果有对应的 Element Plus locale，则合并
      configs[langCode] = {
        ...i18nMessages,
        ...elementPlusLocale,
};
    } else {
      // 如果没有对应的 Element Plus locale，只使用 i18n 消息
      configs[langCode] = i18nMessages;
    }
  }

  return configs;
};

export const localesConfigs = generateLocalesConfigs();

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
    const messages = siphonI18n(prefix);
    if (messages && isObject(messages) && Object.keys(messages).length > 0) {
      cache = getObjectKeys(messages);
      keysCache.set(prefix, cache);
    } else {
      // 如果消息为空，返回空 Set
      cache = new Set<string>();
    keysCache.set(prefix, cache);
    }
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
    if (!i18n?.global) {
      return message;
    }
    const locale: string | WritableComputedRef<string> | any = i18n.global.locale;
    return message[locale?.value];
  }

  const key = message.match(/(\S*)\./)?.input ? message.match(/(\S*)\./)?.input : message;

  // 确保 i18n 和 flatI18n 都已初始化
  if (!i18n?.global || typeof flatI18n !== "function") {
    return message;
  }

  try {
    const flatKeys = flatI18n("zh-CN");
    if (key && flatKeys && flatKeys.has && flatKeys.has(key)) {
    return i18n.global.t.call(i18n.global.locale, message);
    } else {
      const zhCNMessages = siphonI18n("zh-CN");
      if (key && zhCNMessages && isObject(zhCNMessages) && Object.prototype.hasOwnProperty.call(zhCNMessages, key)) {
    // 兼容非嵌套形式的国际化写法
    return i18n.global.t.call(i18n.global.locale, message);
  } else {
        return message;
      }
    }
  } catch (error) {
    // 如果 flatI18n 调用失败，回退到直接检查 siphonI18n
    const zhCNMessages = siphonI18n("zh-CN");
    if (key && i18n?.global && zhCNMessages && isObject(zhCNMessages) && Object.prototype.hasOwnProperty.call(zhCNMessages, key)) {
      return i18n.global.t.call(i18n.global.locale, message);
    }
    return message;
  }
}

/** 此函数只是配合i18n Ally插件 */
export const $t = (key: string) => {
  return transformI18n(key);
};

// 获取响应式存储命名空间，避免循环依赖
// 使用默认值，如果 config 模块已加载则尝试获取实际值
const getResponsiveStorageNameSpace = (): string => {
  try {
    // 尝试从 window 对象获取（如果 config 模块已初始化）
    if (typeof window !== "undefined" && (window as any).__APP_CONFIG__?.ResponsiveStorageNameSpace) {
      return (window as any).__APP_CONFIG__.ResponsiveStorageNameSpace;
    }
  } catch (e) {
    // 忽略错误
  }
  // 使用默认值（与 globalSetting 中的默认值一致）
  return "responsive-";
};

/**
 * 将短缩写语言代码转换为完整语言代码
 * @param langCode - 语言代码（可能是短缩写或完整代码）
 * @returns 完整语言代码
 */
const normalizeLanguageCode = (langCode: string): string => {
  if (!langCode) {
    return "zh-CN";
  }
  // 如果已经是完整代码且在映射表中，直接返回
  if (localesConfigs[langCode]) {
    return langCode;
  }
  // 尝试通过短缩写映射表转换
  const normalized = languageShortcutMap[langCode.toLowerCase()];
  if (normalized && localesConfigs[normalized]) {
    return normalized;
  }
  // 如果都不匹配，返回原始值（后续会验证）
  return langCode;
};

const getLocale = () => {
  // 默认语言
  const defaultLocale = "zh-CN";
  
  try {
    // 1. 优先从地址栏的 language 参数读取（支持短缩写）
    if (typeof window !== "undefined" && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const languageParam = urlParams.get("language");
      if (languageParam) {
        const normalizedLang = normalizeLanguageCode(languageParam);
        if (localesConfigs[normalizedLang]) {
          return normalizedLang;
        }
      }
    }
    
    // 2. 从 localStorage 读取（支持短缩写）
    const namespace = getResponsiveStorageNameSpace();
    if (typeof localStorage !== "undefined") {
      const storedValue = localStorage.getItem(`${namespace}locale`);
      if (storedValue) {
        try {
          const key = JSON.parse(storedValue)?.locale;
          if (key) {
            const normalizedLang = normalizeLanguageCode(key);
            if (localesConfigs[normalizedLang]) {
              return normalizedLang;
    }
          }
        } catch (e) {
          // 解析失败，忽略
        }
      }
    }
    
    // 3. 默认返回 zh-CN
    return defaultLocale;
  } catch (error) {
    // 发生任何错误都返回默认语言
    return defaultLocale;
  }
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

/**
 * 获取 Element Plus 的 locale 对象（响应式）
 * @returns Element Plus locale 对象
 */
export function getElementPlusLocale() {
  if (!i18n?.global) {
    return zhLocale;
  }
  const locale = i18n.global.locale;
  const localeValue = typeof locale === "string" ? locale : locale.value;
  return localeValue === "zh-CN" ? zhLocale : enLocale;
}

/**
 * Element Plus 的响应式 locale 对象
 */
export const elementPlusLocale = computed(() => getElementPlusLocale());
