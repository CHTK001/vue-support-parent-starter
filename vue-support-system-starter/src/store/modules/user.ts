import {defineStore} from "pinia";
import md5 from "js-md5"
import base64 from "js-base64"

import {loginApi, logoutApi} from "@/api/auth";
import {getUserInfo} from "@/api/user";
import {resetRouter} from "@/router";
import {store} from "@/store";

import {LoginData} from "@/api/auth/types";
import {UserInfo} from "@/api/user/types";

import {useStorage} from "@vueuse/core";
import {assign} from "@/utils";
import Global from "@/config/global";
import {local} from "@/utils/storage";

export const useUserStore = defineStore("user", () => {
	// state
	const token = useStorage("accessToken", "");
	const nickname = ref("");
	const avatar = ref("");
	const roles = ref<Array<string>>([]); // 用户角色编码集合 → 判断路由权限
	const perms = ref<Array<string>>([]); // 用户权限编码集合 → 判断按钮权限

	/**
	 * 登录调用
	 *
	 * @param {LoginData}
	 * @returns
	 */
	function login(loginData: LoginData) {
		return new Promise<void>((resolve, reject) => {
			loginApi(assign(loginData, {password: md5(loginData.password as string)}))
				.then((response: any) => {
					const {tokenType, accessToken} = response.data;
					token.value = accessToken; // Bearer eyJhbGciOiJIUzI1NiJ9.xxx.xxx
					resolve();
				})
				.catch((error: any) => {
					reject(error);
				});
		});
	}

	// 获取信息(用户昵称、头像、角色集合、权限集合)
	function getInfo() {
		return new Promise<UserInfo>((resolve, reject) => {
			let data: UserInfo = local.get(Global.USER_KEY);
			if(null != data) {
				nickname.value = data.nickname;
				avatar.value = data.avatar;
				roles.value = data.roles;
				perms.value = data.perms;
				resolve(data);
				return;
			}
			getUserInfo()
				.then(({data}) => {
					if (!data) {
						return reject("Verification failed, please Login again.");
					}
					if (!data.roles || data.roles.length <= 0) {
						reject("getUserInfo: roles must be a non-null array!");
					}
					nickname.value = data.nickname;
					avatar.value = data.avatar;
					roles.value = data.roles;
					perms.value = data.perms;
					resolve(data);
					local.set(Global.USER_KEY, data);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	// 注销
	function logout() {
		return new Promise<void>((resolve, reject) => {
			logoutApi()
				.then(() => {
					resetRouter();
					resetToken();
					location.reload(); // 清空路由
					local.clear();
					resolve();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	// 重置
	function resetToken() {
		token.value = "";
		nickname.value = "";
		avatar.value = "";
		roles.value = [];
		perms.value = [];
	}

	return {
		token,
		nickname,
		avatar,
		roles,
		perms,
		login,
		getInfo,
		logout,
		resetToken,
	};
});

// 非setup
export function useUserStoreHook() {
	return useUserStore(store);
}
