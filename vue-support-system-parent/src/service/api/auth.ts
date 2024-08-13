import { request } from '../request';

/**
 * 获取验证码
 *
 * @returns 验证码
 */

export function fetchVerifyCode() {
  return request<Api.Common.VerifyCode>({
    url: '/v2/captcha'
  });
}
/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(loginData: Api.Auth.LoginData) {
  return request<Api.Auth.LoginToken>({
    url: '/v2/user/login',
    method: 'post',
    data: loginData
  });
}

/** user logout */
export function fetchLogout() {
  return request<Boolean>({
    url: '/auth/logout',
    method: 'post'
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/v2/user/me' });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refresh_token',
    method: 'post',
    data: {
      refreshToken
    }
  });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}
