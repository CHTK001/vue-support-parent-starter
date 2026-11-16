import { http, unwrapResult } from "@repo/utils";

/**
 * 账号模块只读接口（配置页选账号用）。
 *
 * <p>「配置管理 → 邮件 / 短信」不再自己存 SMTP / 短信密钥，而是指向账号管理里的
 * {@code EMAIL} / {@code SMS} 账号；这里只取挑选下拉需要的字段，账号的增删改
 * 仍由账号管理页面负责。</p>
 *
 * <p>账号模块返回 {@code ApiResult}（{@code success/data}），与全局
 * {@code ReturnResult} 信封不同，但成功判定都靠 {@code success}，
 * 因此 {@code unwrapResult} 可直接复用。</p>
 */

/** 账号模块接口基址（spring-support-account-starter） */
const B = "/api/accounts";

/** 账号种类：与后端 {@code AccountKind} 常量同名 */
export type AccountKind = "API_KEY" | "EMAIL" | "SMS";

/**
 * 挑选下拉需要的账号字段。
 *
 * <p>只读回显，不含 {@code secret}（后端读接口恒为 {@code null}）。</p>
 */
export interface SysAccountBrief {
  /** 账号标识（UUID），保存到 {@code sys_setting_value} 的值 */
  accountId: string;
  /** 账号编码（业务唯一键） */
  code?: string;
  /** 账号名称 */
  name?: string;
  /** 账号种类 */
  kind?: AccountKind;
  /** 厂商 / 服务商，如 aliyun / smtp / qcloud */
  vendor?: string;
  /** 登录名 / 发件邮箱 / 手机号 */
  username?: string;
  /** 状态：1 启用 / 0 停用 */
  status?: number;
  /** 是否同种类默认账号 */
  defaultAccount?: boolean;
}

/**
 * 按种类取账号列表。
 *
 * <p>后端按归属隔离：登录态下额外包含本人创建的账号，部署级账号对所有人生效。</p>
 *
 * @param kind 账号种类
 */
export function listAccounts(kind: AccountKind) {
  return http()
    .get(B)
    .query({ kind })
    .then(r => unwrapResult<SysAccountBrief[]>(r));
}

/** 账号列表短时缓存：配置页里两个分组共用一次请求结果 */
const cache = new Map<AccountKind, Promise<SysAccountBrief[]>>();

/**
 * 带缓存的账号列表（同一次页面生命周期内只请求一次）。
 *
 * @param kind 账号种类
 */
export function listAccountsCached(kind: AccountKind): Promise<SysAccountBrief[]> {
  const hit = cache.get(kind);
  if (hit) return hit;
  const task = listAccounts(kind).catch(e => {
    cache.delete(kind);
    throw e;
  });
  cache.set(kind, task);
  return task;
}

/**
 * 丢弃缓存：账号管理里刚新增 / 停用账号后，再回到配置页需要看到最新列表。
 */
export function clearAccountCache() {
  cache.clear();
}
