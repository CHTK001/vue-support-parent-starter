import config from "@/config"
import http from "@/utils/request"

export default {
	jobgroupDel: {
        url: `${config.API_URL}/jobgroup/remove`,
		name: "执行器列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobgroupUpdate: {
        url: `${config.API_URL}/jobgroup/update`,
		name: "执行器列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobgroupAdd: {
        url: `${config.API_URL}/jobgroup/save`,
		name: "执行器列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobgroupPageList: {
        url: `${config.API_URL}/jobgroup/pageList`,
		name: "执行器列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	pageList: {
        url: `${config.API_URL}/jobinfo/pageList`,
		name: "任务列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoTrigger: {
        url: `${config.API_URL}/jobinfo/trigger`,
		name: "任务触发",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoStop: {
        url: `${config.API_URL}/jobinfo/stop`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoStart: {
        url: `${config.API_URL}/jobinfo/start`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoRemove: {
        url: `${config.API_URL}/jobinfo/remove`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoAdd: {
        url: `${config.API_URL}/jobinfo/add`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoUpdate: {
        url: `${config.API_URL}/jobinfo/update`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoNextTriggerTime: {
        url: `${config.API_URL}/jobinfo/nextTriggerTime`,
		name: "任务触发",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobgroupById: {
        url: `${config.API_URL}/jobgroup/loadById`,
		name: "注册节点",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	joblogChart: {
        url: `${config.API_URL}/chartInfo`,
		name: "清除日志",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			return await http.post(this.url, data, config);
		}
	},
	clearLog: {
        url: `${config.API_URL}/joblog/clearLog`,
		name: "清除日志",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			return await http.post(this.url, data, config);
		}
	},
	getJobsByGroup: {
        url: `${config.API_URL}/joblog/getJobsByGroup`,
		name: "任务列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobGroup: {
        url: `${config.API_URL}/jobgroup/pageList`,
		name: "执行器列表",
		get: async function(data, config={}){
			return await http.post(this.url, data, config);
		}
	},
	joblog: {
        url: `${config.API_URL}/joblog/pageList`,
		name: "日志列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
}