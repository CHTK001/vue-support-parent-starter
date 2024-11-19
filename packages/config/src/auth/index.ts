import { isIncludeAllChildren, isString } from "@pureadmin/utils";

/**
 * 全局变量
 */
const USER_ROLE_AND_EXT = {
  value: [],
  perms: [],
};

/**
 *
 * @param roles
 */
export function setUserRole(roles: Array<string>) {
  USER_ROLE_AND_EXT.value = roles;
}

export function setUserPerm(perm: Array<string>) {
  USER_ROLE_AND_EXT.perms = perm;
}

export function hasAuth(role: string) {
  if (!role) {
    return false;
  }
  const roles = USER_ROLE_AND_EXT.value;
  const perms = USER_ROLE_AND_EXT.perms;
  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
    return true;
  }

  if (
    isString(role)
      ? perms.includes(role)
      : isIncludeAllChildren(role, perms || [])
  ) {
    return true;
  }
  return false;
}
