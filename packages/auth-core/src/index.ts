/**
 * auth-core 入口
 *
 * 框架无关（纯 TypeScript）的认证核心包，供 Vue / React 等各端共享：
 * - types    ：登录 / 用户 / 认证状态等类型定义
 * - token    ：令牌与会话存储管理
 * - api      ：认证接口（login / logout / me / refresh-token）封装
 */
export * from "./types";
export * from "./token";
export * from "./api";
