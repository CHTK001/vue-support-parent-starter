/**
 * system-v2 API 适配层
 * 将后端 (vue-support-system-parent) 的数据格式转换为 koi-ui 兼容格式
 * 不修改后端代码，纯前端转换
 */

import { http, type ReturnResult } from "@repo/utils";

// ==================== 数据转换适配器 ====================

/** 角色数据：后端 → koi-ui */
export function adaptRole(role: any) {
  if (!role) return role;
  return {
    roleId: role.sysRoleId ?? role.roleId,
    roleName: role.sysRoleName ?? role.roleName,
    roleCode: role.sysRoleCode ?? role.roleCode,
    roleSort: role.sysRoleSort ?? role.roleSort ?? 0,
    status: role.sysRoleStatus ?? role.status ?? "0",
    remark: role.sysRoleRemark ?? role.remark ?? "",
    createTime: role.createTime ?? role.create_time ?? "",
    ...role,
  };
}

/** 菜单数据：后端 → koi-ui */
export function adaptMenu(menu: any) {
  if (!menu) return menu;
  return {
    menuId: String(menu.sysMenuId ?? menu.menuId ?? menu.id ?? ""),
    parentId: String(menu.sysMenuPid ?? menu.parentId ?? menu.parent_id ?? "0"),
    menuName: menu.sysMenuName ?? menu.menuName ?? menu.title ?? "",
    menuType: String(menu.sysMenuType ?? menu.menuType ?? menu.type ?? ""),
    path: menu.sysMenuPath ?? menu.path ?? "",
    name: menu.sysMenuNameEn ?? menu.name ?? "",
    component: menu.sysMenuComponent ?? menu.component ?? "",
    icon: menu.sysMenuIcon ?? menu.icon ?? "",
    isVisible: String(menu.sysMenuVisible ?? menu.isVisible ?? menu.visible ?? "1"),
    isKeepAlive: String(menu.sysMenuKeepAlive ?? menu.isKeepAlive ?? "1"),
    isAffix: String(menu.sysMenuAffix ?? menu.isAffix ?? "0"),
    linkUrl: menu.sysMenuLink ?? menu.linkUrl ?? "",
    redirect: menu.redirect ?? "",
    activeMenu: menu.activeMenu ?? "",
    orderNum: menu.orderNum ?? menu.order_num ?? 0,
    children: (menu.children || []).map(adaptMenu),
    ...menu,
  };
}

/** 部门数据：后端 → koi-ui */
export function adaptDept(dept: any) {
  if (!dept) return dept;
  return {
    deptId: dept.sysDeptId ?? dept.deptId ?? dept.id,
    parentId: dept.sysDeptPid ?? dept.parentId ?? dept.parent_id ?? "0",
    deptName: dept.sysDeptName ?? dept.deptName ?? dept.name ?? "",
    deptCode: dept.sysDeptCode ?? dept.deptCode ?? "",
    orderNum: dept.orderNum ?? dept.order_num ?? dept.sysDeptOrder ?? 0,
    status: dept.sysDeptStatus ?? dept.status ?? "0",
    leader: dept.sysDeptPrincipal ?? dept.leader ?? dept.principal ?? "",
    phone: dept.phone ?? "",
    email: dept.email ?? "",
    children: (dept.children || []).map(adaptDept),
    ...dept,
  };
}

/** 用户数据：后端 → koi-ui */
export function adaptUser(user: any) {
  if (!user) return user;
  return {
    userId: user.sysUserId ?? user.userId ?? user.id,
    userName: user.sysUserName ?? user.userName ?? user.username ?? "",
    nickName: user.sysNickName ?? user.nickName ?? user.nickname ?? "",
    email: user.sysEmail ?? user.email ?? "",
    phone: user.sysPhone ?? user.phone ?? "",
    sex: user.sysSex ?? user.sex ?? "0",
    avatar: user.sysAvatar ?? user.avatar ?? "",
    status: user.sysUserStatus ?? user.status ?? "0",
    deptId: user.sysDeptId ?? user.deptId ?? "",
    remark: user.remark ?? "",
    createTime: user.createTime ?? user.create_time ?? "",
    ...user,
  };
}

/** 字典数据：后端 → koi-ui */
export function adaptDict(dict: any) {
  if (!dict) return dict;
  return {
    dictId: dict.sysDictId ?? dict.dictId ?? dict.id,
    dictName: dict.sysDictName ?? dict.dictName ?? dict.name ?? "",
    dictType: dict.sysDictType ?? dict.dictType ?? dict.type ?? "",
    status: dict.sysDictStatus ?? dict.status ?? "0",
    remark: dict.remark ?? "",
    createTime: dict.createTime ?? "",
    ...dict,
  };
}

/** 字典项数据：后端 → koi-ui */
export function adaptDictData(item: any) {
  if (!item) return item;
  return {
    dictCode: item.sysDictDataId ?? item.dictCode ?? item.id,
    dictSort: item.sysDictSort ?? item.dictSort ?? 0,
    dictLabel: item.sysDictLabel ?? item.dictLabel ?? item.label ?? "",
    dictValue: item.sysDictValue ?? item.dictValue ?? item.value ?? "",
    dictType: item.sysDictType ?? item.dictType ?? "",
    status: item.sysDictDataStatus ?? item.status ?? "0",
    remark: item.remark ?? "",
    ...item,
  };
}

/** 岗位数据：后端 → koi-ui */
export function adaptPost(post: any) {
  if (!post) return post;
  return {
    postId: post.sysPostId ?? post.postId ?? post.id,
    postCode: post.sysPostCode ?? post.postCode ?? "",
    postName: post.sysPostName ?? post.postName ?? "",
    postSort: post.sysPostSort ?? post.postSort ?? 0,
    status: post.sysPostStatus ?? post.status ?? "0",
    remark: post.remark ?? "",
    ...post,
  };
}

/** 通知公告数据：后端 → koi-ui */
export function adaptNotice(notice: any) {
  if (!notice) return notice;
  return {
    noticeId: notice.sysNoticeId ?? notice.noticeId ?? notice.id,
    noticeTitle: notice.sysNoticeTitle ?? notice.noticeTitle ?? notice.title ?? "",
    noticeType: notice.sysNoticeType ?? notice.noticeType ?? notice.type ?? "1",
    noticeContent: notice.sysNoticeContent ?? notice.noticeContent ?? notice.content ?? "",
    status: notice.sysNoticeStatus ?? notice.status ?? "0",
    createTime: notice.createTime ?? "",
    createBy: notice.createBy ?? notice.create_by ?? "",
    ...notice,
  };
}

/** 登录日志数据：后端 → koi-ui */
export function adaptLoginLog(log: any) {
  if (!log) return log;
  return {
    infoId: log.sysLoginLogId ?? log.infoId ?? log.id,
    userName: log.sysUserName ?? log.userName ?? log.username ?? "",
    ipaddr: log.sysLoginIp ?? log.ipaddr ?? log.ip ?? "",
    loginLocation: log.sysLoginLocation ?? log.loginLocation ?? "",
    browser: log.sysBrowser ?? log.browser ?? "",
    os: log.sysOs ?? log.os ?? "",
    status: log.sysLoginStatus ?? log.status ?? "0",
    msg: log.sysLoginMsg ?? log.msg ?? "",
    loginTime: log.createTime ?? log.loginTime ?? log.login_time ?? "",
    ...log,
  };
}

/** 操作日志数据：后端 → koi-ui */
export function adaptOperLog(log: any) {
  if (!log) return log;
  return {
    operId: log.sysOperLogId ?? log.operId ?? log.id,
    title: log.sysModule ?? log.title ?? log.module ?? "",
    businessType: log.sysBusinessType ?? log.businessType ?? 0,
    method: log.sysMethod ?? log.method ?? "",
    requestMethod: log.sysRequestMethod ?? log.requestMethod ?? "",
    operatorType: log.sysOperatorType ?? log.operatorType ?? 0,
    operName: log.sysOperName ?? log.operName ?? log.userName ?? "",
    deptName: log.sysDeptName ?? log.deptName ?? "",
    operUrl: log.sysOperUrl ?? log.operUrl ?? "",
    operIp: log.sysOperIp ?? log.operIp ?? log.ip ?? "",
    operLocation: log.sysOperLocation ?? log.operLocation ?? "",
    operParam: log.sysOperParam ?? log.operParam ?? "",
    jsonResult: log.sysJsonResult ?? log.jsonResult ?? "",
    status: log.sysOperStatus ?? log.status ?? "0",
    errorMsg: log.sysErrorMsg ?? log.errorMsg ?? "",
    operTime: log.createTime ?? log.operTime ?? "",
    ...log,
  };
}

// ==================== 批量转换 ====================

export function adaptRoleList(list: any[]) {
  return (list || []).map(adaptRole);
}
export function adaptMenuList(list: any[]) {
  return (list || []).map(adaptMenu);
}
export function adaptDeptList(list: any[]) {
  return (list || []).map(adaptDept);
}
export function adaptUserList(list: any[]) {
  return (list || []).map(adaptUser);
}
export function adaptDictList(list: any[]) {
  return (list || []).map(adaptDict);
}
export function adaptDictDataList(list: any[]) {
  return (list || []).map(adaptDictData);
}
export function adaptPostList(list: any[]) {
  return (list || []).map(adaptPost);
}
export function adaptNoticeList(list: any[]) {
  return (list || []).map(adaptNotice);
}
export function adaptLoginLogList(list: any[]) {
  return (list || []).map(adaptLoginLog);
}
export function adaptOperLogList(list: any[]) {
  return (list || []).map(adaptOperLog);
}