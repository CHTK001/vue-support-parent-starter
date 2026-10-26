/**
 * 协同选人的用户列表接口。
 *
 * 复用系统模块的用户分页接口 {@code GET /v2/user/page}（与管理页
 * 用户管理的 pageForUser 同通道，走应用登录态），拉当前可用用户，
 * 供协同文档「私有 → 指定用户」的授权选择。
 *
 * 设计口径：协同模块不持有用户管理实现，只依赖该稳定查询接口——
 * 后端在用户管理模块提供 /v2/user/page（已在用户管理页验证可用），
 * 协同侧仅做查询适配，不重复定义用户模型。
 */

import { createHttp, getAccessToken } from "@repo/utils";
import type { Http } from "@repo/utils";

/** 应用通道 HTTP（与上传任务/文件日志同一登录态通道） */
function collabHttp(): Http {
  return createHttp({ headers: { "x-oauth-token": getAccessToken() ?? "" } });
}

/** 用户分页返回结构（与系统模块 SysUser/PageResult 对齐的最小切片） */
interface PickerSysUser {
  sysUserId?: number;
  sysUserUsername?: string;
  sysUserNickname?: string;
  sysUserStatus?: number;
}
interface PickerPage<T> {
  records?: T[];
  list?: T[];
  total?: number;
}
interface PickerPageResult {
  data?: PickerPage<PickerSysUser> | PickerSysUser[] | null;
  records?: unknown;
  total?: number;
}

/**
 * 拉取可选择授权的用户列表（共享用户，供协同私有授权选择）。
 *
 * @param limit 拉取上限（默认 100）
 * @return userId → 展示标签 的列表
 */
export async function listUsersForPicker(limit = 100): Promise<Array<{ userId: string; label: string }>> {
  try {
    const r = (await collabHttp()
      .get("/v2/user/page")
      .query({ page: 1, pageSize: limit, sysUserStatus: 1 })
      .then((resp) => resp.data)) as unknown as PickerPageResult;
    // 兼容 { records } 与 { list } 两种分页形态，以及直接数组形态
    const wrap = r && typeof r === "object" ? (r as PickerPageResult) : {};
    const page = (wrap.data ?? {}) as PickerPage<PickerSysUser> | PickerSysUser[];
    const users = Array.isArray(page)
      ? page
      : ((page?.records ?? page?.list ?? []) as PickerSysUser[]);
    return (users ?? [])
      .filter((u) => u && u.sysUserId != null && u.sysUserStatus !== 0)
      .map((u) => ({
        userId: String(u.sysUserId),
        label: u.sysUserNickname || u.sysUserUsername || String(u.sysUserId),
      }));
  } catch {
    // 用户列表接口不可用时授权选择降级为空（公开协同不受影响）
    return [];
  }
}