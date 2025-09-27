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

export type UserNotificationType = {
  level?: 'error' | 'success' | 'warning' | 'info' | undefined
  closable?: boolean
  title?: string
  content?: string
  enabled?: boolean
}

// 编辑
export function saveUserNotification(params: UserNotificationType) {
  return http.post('/user/notification/save', params);
}

// 获取通知
export function getUserNotification() {
  return http.get('/user/notification/get');
}

export function systemNotification() {
  return http.get('/system-notification');
}