/**
 * 用户展示信息工具（@repo/utils）
 *
 * 统一从多数据源（authStore.loginUser + 框架 storage.getUserInfo + userStore.userInfo）
 * 解析用户展示字段（昵称、头像、手机、邮箱、角色、协议版本等）。
 *
 * <p>使用场景：个人中心页（/system/personage）、koi 主题 mine 页等需要展示当前登录用户信息的页面。</p>
 *
 * <h3>字段优先级（按从高到低）：</h3>
 * <ol>
 *   <li>authStore.loginUser（最近一次 {@code getLoginUserInfo()} 调用写入）</li>
 *   <li>框架 storage.getUserInfo()（登录响应或持久化缓存）</li>
 *   <li>userStore.userInfo（登录时写入的冗余快照）</li>
 * </ol>
 *
 * @author CH
 * @since 2026/4
 */
import { getUserInfo } from "./token";

/** 展示字段类型定义 */
export interface UserDisplayInfo {
  /** 用户ID（字符串或数字） */
  userId?: string | number;
  /** 登录账号 */
  username?: string;
  /** 昵称（显示用） */
  nickname?: string;
  /** 头像地址 */
  avatar?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 性别（0:未知/男, 1:女, 2:保密） */
  sex?: number;
  /** 角色编码列表 */
  roles?: string[];
  /** 头像框 ID */
  avatarFrame?: number;
  /** 是否显示头像框（0/1） */
  avatarFrameShow?: number;
  /** 生日（yyyy-MM-dd） */
  birthday?: string;
  /** 身份证号 */
  idCard?: string;
}

/** 简化的 store 形状（解耦 pinia 模块依赖） */
export interface UserInfoSources {
  /** authStore.loginUser（authStore.getLoginUserInfo 写入） */
  authLoginUser?: Record<string, unknown> | null;
  /** userStore.userInfo（登录时设置） */
  userStoreInfo?: Record<string, unknown> | null;
}

/**
 * 合并多数据源解析当前登录用户的展示信息。
 *
 * <p>字段优先级：{@code authLoginUser} > {@code storage getUserInfo()} > {@code userStoreInfo}</p>
 *
 * @param sources 可选的数据源（不传则自动从 storage 读取）
 * @return 标准化后的展示信息对象（字段可能为空字符串）
 *
 * @example
 * ```ts
 * const display = resolveUserDisplayInfo({
 *   authLoginUser: authStore.loginUser,
 *   userStoreInfo: userStore.userInfo,
 * });
 * console.log(display.nickname, display.avatar);
 * ```
 */
export function resolveUserDisplayInfo(sources?: UserInfoSources): UserDisplayInfo {
  const authLoginUser = (sources?.authLoginUser ?? {}) as Record<string, unknown>;
  const userStoreInfo = (sources?.userStoreInfo ?? {}) as Record<string, unknown>;
  // storage 是最新数据源（getLoginUserInfo 会写入），优先级低于 authLoginUser
  const storage = (getUserInfo<Record<string, unknown>>() ?? {}) as Record<string, unknown>;

  // 按优先级合并：authLoginUser > storage > userStoreInfo
  const merged: Record<string, unknown> = {
    ...userStoreInfo,
    ...storage,
    ...authLoginUser,
  };

  return {
    userId: (merged.userId as string | number) ?? (merged.sysUserId as string | number),
    username:
      (merged.sysUserUsername as string) ??
      (merged.username as string) ??
      (authLoginUser.loginName as string) ??
      "",
    nickname: (merged.sysUserNickname as string) ?? (merged.nickname as string) ?? "",
    avatar:
      (merged.avatar as string) ??
      (merged.sysUserAvatar as string) ??
      "",
    phone: (merged.sysUserPhone as string) ?? (merged.phone as string) ?? "",
    email: (merged.sysUserEmail as string) ?? (merged.email as string) ?? "",
    sex: (merged.sysUserSex as number) ?? (merged.sex as number) ?? 0,
    roles: (merged.roles as string[]) ?? [],
    avatarFrame:
      (merged.sysUserAvatarFrame as number) ?? (merged.avatarFrame as number) ?? 0,
    avatarFrameShow:
      (merged.sysUserAvatarFrameShow as number) ??
      (merged.avatarFrameShow as number) ??
      0,
    birthday: (merged.sysUserBirthday as string) ?? (merged.birthday as string) ?? "",
    idCard: (merged.sysUserIdCard as string) ?? (merged.idCard as string) ?? "",
  };
}
