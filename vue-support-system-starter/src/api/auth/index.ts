import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {CaptchaResult, LoginData, LoginResult} from './types';
import Global from "@/config/global";

/**
 * 登录API
 *
 * @param data {LoginData}
 * @returns
 */
export function loginApi(data: LoginData): AxiosPromise<LoginResult> {
	return request.post(Global.HOST + '/api/v1/auth/login', data)
}

/**
 * 注销API
 */
export function logoutApi() {
	return request({
		url: Global.HOST + '/api/v1/auth/logout',
		method: 'delete'
	});
}


/**
 * 获取验证码
 */
export function getCaptchaApi(): AxiosPromise<CaptchaResult> {
	return request({
		url: '/captcha',
		method: 'get'
	});
}
