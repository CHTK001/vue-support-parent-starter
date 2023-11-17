import config from "@/config"
import http from "@/utils/request"

export default {
	token: {
		url: `${config.API_CONF}/v1/users/login`,
		name: "登录获取TOKEN",
		post: async function(data={}){
			return await http.post(this.url, data);
		}
	},
	captcha: {
		url: `${config.API_CONF}/v1/captcha`,
		name: "登录获取校验码",
		get: function(){
			return http.get(this.url);
		}
	},
	grid: {
		url: `${config.API_CONF}/v2/users/grid`,
		name: "保存首页布局",
		post: function(data){
			return http.post(this.url, data);
		}
	},
	menus: {
		url: `${config.API_CONF}/v1/users/menus/my/0.6.1`,
		name: "获取我的菜单",
		get: async function(){
			return await http.get(this.url);
		}
	},
}
