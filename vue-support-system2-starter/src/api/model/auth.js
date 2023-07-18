import config from "@/config"
import http from "@/utils/request"

export default {
	token: {
		url: `${config.API_URL}/v2/users/login`,
		name: "登录获取TOKEN",
		post: async function(data={}){
			return await http.post(this.url, data);
		}
	},
	captcha: {
		url: `${config.API_URL}/v1/captcha`,
		name: "登录获取校验码",
		get: function(){
			return http.get(this.url);
		}
	}
}
