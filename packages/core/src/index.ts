export * from "./createApp";
// 统一配置的便捷再导出：@repo/config 是 @repo/core 的既有依赖，
// 页面模块与组件借用本入口即可读取 / 合并写入全局配置，无需各自再声明直接依赖。
// 典型用例：pages/server 的文件服务器深度查看入口需要按部署解析主存储桶
// （otherConfig.filestorage.bucket，缺省 local）。
export { getConfig, setConfig, applyConfig } from "@repo/config";
export * from "./crypto";
export * from "./permission";
export * from "./directives";
export * from "./token";
export * from "./session-scope";
export * from "./thirdCallback";
export * from "./single-flight";
export * from "./httpCrypto";
export * from "./progress";
export * from "./storage";
export { default as nprogress, startLoading, doneLoading, forceDoneLoading } from "./progress";
export * from "./router";
export * from "./api";
export * from "./setting";
export { message, messageBox, msg, msgPrimary, msgSuccess, msgError, msgWarning, msgInfo, msgBox, msgBoxPrompt, msgBoxAlert, notice, noticeSuccess, noticeError, noticeWarning, noticeInfo } from "./msg";
export * from "./hooks/useDataSource";
export * from "./hooks/useStationMessage";
export * from "./obfuscation/fontObfuscator";
export * from "./obfuscation/ocrNoise";
export * from "./security/antiDebug";
export * from "./socket";
export * from "./monitor";
