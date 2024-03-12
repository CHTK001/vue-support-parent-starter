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
	limit: {
		upload: {
			url: `${config.API_URL}/v1/limit/upload`,
			name: "下发limit",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		page: {
			url: `${config.API_URL}/v1/limit/page`,
			name: "查询应用",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v1/limit/save`,
			name: "添加应用",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v1/limit/update`,
			name: "修改应用",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v1/limit/delete`,
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
	ip: {
		url: `${config.API_URL}/instance/ip`,
		name: "请求访问IP",
		handler: async function(params){
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
	job: {
		log: {
			page: {
				url: `${config.API_URL}/v1/job/log`,
				name: "查询log",
				get: async function(params){
					return await http.get(this.url, params);
				}
			},
			time: {
				url: `${config.API_URL}/v1/job/time`,
				name: "查询log",
				get: async function(params){
					return await http.get(this.url, params);
				}
			},
		},
		trigger: {
			url: `${config.API_URL}/v1/job/trigger`,
			name: "触发",
			handler: async function(params){
				return await http.get(this.url, params);
			}
		},
		nextTime: {
			url: `${config.API_URL}/v1/job/nextTriggerTime`,
			name: "下一次触发时间",
			handler: async function(params){
				return await http.get(this.url, params);
			}
		},
		list: {
			url: `${config.API_URL}/v1/job/list`,
			name: "查询 job",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		page: {
			url: `${config.API_URL}/v1/job/page`,
			name: "查询 job",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v1/job/save`,
			name: "添加 job",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v1/job/update`,
			name: "修改 job",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		start: {
			url: `${config.API_URL}/v1/job/start`,
			name: "启动 job",
			handler: async function(params){
				return await http.get(this.url + `?jobId=${params.jobId}`);
			}
		},
		stop: {
			url: `${config.API_URL}/v1/job/stop`,
			name: "停止 job",
			handler: async function(params){
				return await http.get(this.url + `?jobId=${params.jobId}`);
			}
		},
	},
	mybatis: {
		upload: {
			url: `${config.API_URL}/v1/mybatis/upload`,
			name: "下发 mybatis",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		list: {
			url: `${config.API_URL}/v1/mybatis/list`,
			name: "查询 mybatis",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		page: {
			url: `${config.API_URL}/v1/mybatis/page`,
			name: "查询 mybatis",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v1/mybatis/save`,
			name: "添加 mybatis",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v1/mybatis/update`,
			name: "修改 mybatis",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v1/mybatis/delete`,
			name: "删除 mybatis",
			delete: async function(params){
				return await http.delete(this.url + `?id=${params.id}`, params);
			}
		},
	},
	patch: {
		upload: {
			url: `${config.API_URL}/v1/patch/upload`,
			name: "下发 补丁",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		loadPatch: {
			url: `${config.API_URL}/v1/patch/loadPatch`,
			name: "上传补丁",
			post: async function(params){
				const formDataItem = new FormData();
				Object.keys(params).forEach(key => {
					formDataItem.append(key, params[key]);
				});
				return await http.post(this.url, formDataItem, {'Content-Type': 'multipart/form-data'});
			}
		},
		unloadPatch: {
			url: `${config.API_URL}/v1/patch/unloadPatch`,
			name: "卸载补丁",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		downloadPatch: {
			url: `${config.API_URL}/v1/patch/downloadPatch`,
			name: "下载补丁",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		list: {
			url: `${config.API_URL}/v1/patch/list`,
			name: "查询 补丁",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		page: {
			url: `${config.API_URL}/v1/patch/page`,
			name: "查询 补丁",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v1/patch/deletePatch`,
			name: "删除 补丁",
			delete: async function(params){
				return await http.delete(this.url + `?id=${params.id}`, params);
			}
		},
	},
	
}