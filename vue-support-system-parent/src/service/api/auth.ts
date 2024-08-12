import { request } from '../request';
/**
 * 获取二维码
 *
 */
export function getCapture() {
  return request<Api.Common.VerifyCode>({
    url: '/v1/captcha',
    method: 'get'
  });
}
/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(userLogin: Api.Auth.UserLogin) {
  return request<Api.Auth.LoginToken>({
    url: '/v2/user/login',
    method: 'post',
    data: {
      userLogin
    }
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
    url: '/auth/refreshToken',
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
