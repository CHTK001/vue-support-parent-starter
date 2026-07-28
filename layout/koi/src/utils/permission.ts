import useAuthStore from "../stores/modules/auth.ts";

/** 是否超级管理员 */
export function isSuperAdmin(): boolean {
  const { buttonList } = useAuthStore();
  return buttonList.includes("*");
}

/** 是否拥有任一权限 [OR] */
export function hasAnyPerm(codes: string | string[]): boolean {
  if (isSuperAdmin()) return true;
  const list = Array.isArray(codes) ? codes : [codes];
  const { buttonList } = useAuthStore();
  return list.some((code) => buttonList.includes(code));
}

/** 是否拥有全部权限 [AND] */
export function hasAllPerm(codes: string[]): boolean {
  if (isSuperAdmin()) return true;
  const { buttonList } = useAuthStore();
  return codes.every((code) => buttonList.includes(code));
}