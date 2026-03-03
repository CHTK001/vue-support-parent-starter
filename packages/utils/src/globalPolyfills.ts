// 如果项目出现 `global is not defined` 报错，可能是您引入某个库的问题，比如 aws-sdk-js https://github.com/aws/aws-sdk-js
// 解决办法就是将该文件引入 src/main.ts 即可 import "@/utils/globalPolyfills";
// 同时初始化前端日志，将全局 console.* 代理到 SLF4J 风格日志
import "./log/setupConsole";

if (typeof (window as any).global === "undefined") {
  (window as any).global = window;
}

export {};
