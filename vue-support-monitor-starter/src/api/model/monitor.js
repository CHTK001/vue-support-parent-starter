import config from "@/config"
import http from "@/utils/request"

export default {
	actuator: {
		page: {
			url: `${config.API_URL}/v1/monitor/actuator`,
			name: "查询应用",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
	},
	app: {
		list: {
			url: `${config.API_URL}/v1/app/list`,
			name: "查询应用",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		page: {
			url: `${config.API_URL}/v1/app/page`,
			name: "查询应用",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v1/app/save`,
			name: "添加应用",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v1/app/update`,
			name: "修改应用",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v1/app/delete`,
			name: "删除应用",
			delete: async function(params){
				return await http.delete(this.url + `?id=${params.id}`, params);
			}
		},
	},
	link: {
		url: `${config.API_URL}/v1/link`,
		name: "请求链路",
		get: async function(params){
			return await http.get(this.url, params);
		}
	},
	register: {
		url: `${config.API_URL}/v1/register`,
		name: "配置中心",
		get: async function(params){
			return await http.get(this.url, params);
		}
	},
	config: {
		upload: {
			url: `${config.API_URL}/v1/config/upload`,
			name: "下发config",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		list: {
			url: `${config.API_URL}/v1/config/list`,
			name: "查询config",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		page: {
			url: `${config.API_URL}/v1/config/page`,
			name: "查询config",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v1/config/save`,
			name: "添加config",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v1/config/update`,
			name: "修改config",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v1/config/delete`,
			name: "删除config",
			delete: async function(params){
				return await http.delete(this.url + `?id=${params.id}`, params);
			}
		},
	},
	
}