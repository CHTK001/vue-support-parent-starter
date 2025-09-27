///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { http } from "@repo/utils";

// login
export function login(params) {
  return http.post('/userLogin', params);
}

// oauth2Login
export function oauth2Login(params) {
  return http.post('/oauth2/login', params);
}

export function oauth2Url(params) {
  return http.get('/oauth2-url', { params });
}

/**
 * 验证输入的验证码
 * @param {JSON} params
 * @returns
 */
export function mfaVerify(params) {
  return http.get('/mfa_verify', { params });
}

// refresh token
export function refreshToken() {
  return http.post('/renewal');
}

// 关闭 两步验证信息
export function closeMfa(params) {
  return http.get('/user/close_mfa', { params });
}

// 生成 两步验证信息
export function generateMfa() {
  return http.get('/user/generate_mfa');
}

/**
 *  绑定 mfa
 * @param {JSON} params
 * @returns
 */
export function bindMfa(params) {
  return http.get('/user/bind_mfa', { params });
}

// 获取用户信息
export function getUserInfo() {
  return http.post('/user/user-basic-info');
}

// 退出登录
export function loginOut(params) {
  return http.get('/logout2', { data: params });
}

// 修改密码
export function updatePwd(params) {
  return http.post('/user/updatePwd', params);
}

// 所有管理员列表
export function getUserListAll() {
  return http.post('/user/get_user_list_all');
}

// 用户列表
export function getUserList(params) {
  return http.post('/user/get_user_list', params);
}

// 编辑
export function editUser(params) {
  return http.post('/user/edit', params);
}

// // 修改用户
// export function updateUser(params) {
//   return http.post('/user/updateUser', params);
// }

// 删除用户
export function deleteUser(id) {
  return http.post('/user/deleteUser', { id });
}

/**
 * 编辑用户资料
 * @param {
 *  token: token,
 *  email: 邮箱地址,
 *  code: 邮箱验证码
 *  dingDing: 钉钉群通知地址,
 *  workWx: 企业微信群通知地址
 * } params
 */
export function editUserInfo(params) {
  return http.post('/user/save_basicInfo.json', params);
}

/**
 * 发送邮箱验证码
 * @param {String} email 邮箱地址
 */
export function sendEmailCode(email) {
  return http.post('/user/sendCode.json', { email }, { timeout: 0 });
}

/**
 * 解锁管理员
 * @param {String} id 管理员 ID
 * @returns
 */
export function unlockUser(id) {
  return http.get('/user/unlock', { params: { id } });
}

/**
 * 关闭用户 mfa 两步验证
 * @param {String} id 管理员 ID
 * @returns
 */
export function closeUserMfa(id) {
  return http.get('/user/close_user_mfa', { params: { id } });
}

/**
 * 重置用户密码
 * @param {String} id 管理员 ID
 * @returns
 */
export function restUserPwd(id) {
  return http.get('/user/rest-user-pwd', { params: { id } });
}

/**
 * 用户的工作空间列表
 * @param {String} userId 管理员 ID
 * @returns
 */
export function workspaceList(userId) {
  return http.get('/user/workspace_list', { params: { userId } });
}

/**
 * 我的工作空间
 *
 * @returns
 */
export function myWorkspace() {
  return http.get('/user/my-workspace', { params: {} });
}

export function statWorkspace() {
  return http.get('/stat/workspace', { params: {} });
}

export function statSystemOverview() {
  return http.get('/stat/system', { params: {} });
}

/**
 * 我的集群
 *
 * @returns
 */
export function clusterList() {
  return http.get('/user/cluster-list', { params: {} });
}

/**
 * 保存我的工作空间
 *
 * @returns
 */
export function saveWorkspace(data) {
  return http.post('/user/save-workspace', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * 登录页面 信息
 *
 * @returns
 */
export function loginConfig() {
  return http.get('/login-config', { params: {} });
}

/**
 * 登录验证码
 *
 * @returns
 */
export function loginRandCode(params) {
  return http.get('/rand-code', { params });
}

export function listLoginLog(params) {
  return http.post('/user/list-login-log-data', params);
}

export function listOperaterLog(params) {
  return http.post('/user/list-operate-log-data', params);
}

export function recentLogData(params) {
  return http.post('/user/recent-log-data', params);
}