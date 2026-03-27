// 字体加密副作用入口
// 说明：
// - main.ts 中导入本模块即可自动注册：import "@repo/font-encryption";
// - 若需要显式控制时机，请从 ./core 导入 registerEncryptedFonts

export * from "./core";

import { registerEncryptedFonts } from "./core";

// 默认在模块导入时执行一次注册，确保兼容原有“导入即生效”的用法
void registerEncryptedFonts();
