import config from "@/config"
import http from "@/utils/request"

export default {
	socket: {
		url: `ws://172.16.2.226:31257`,
		name: "socket",
		get: async function(params){
			return await http.get(this.url, params);
		}
	},
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
			name: "查询应用",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v1/app/update`,
			name: "查询应用",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v1/app/delete`,
			name: "查询应用",
			delete: async function(params){
				return await http.delete(this.url + `?id=${params.id}`, params);
			}
		},
	},
	
}