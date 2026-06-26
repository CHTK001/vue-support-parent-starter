// system-v2 系统管理模块导出
export * from "./api/index";
export type { } from "./api/adapter";

// View 组件
export { default as UserManageV2 } from "./pages/user/index.vue";
export { default as RoleManageV2 } from "./pages/role/index.vue";
export { default as MenuManageV2 } from "./pages/menu/index.vue";
export { default as DeptManageV2 } from "./pages/dept/index.vue";
export { default as DictTypeV2 } from "./pages/dict/type.vue";
export { default as DictDataV2 } from "./pages/dict/data.vue";
export { default as PostManageV2 } from "./pages/post/index.vue";
export { default as NoticeManageV2 } from "./pages/notice/index.vue";
export { default as LoginLogV2 } from "./pages/loginlog/index.vue";
export { default as OperLogV2 } from "./pages/operlog/index.vue";