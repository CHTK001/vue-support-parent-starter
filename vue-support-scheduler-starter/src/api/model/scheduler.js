import config from "@/config"
import http from "@/utils/request"

export default {
	jobgroupDel: {
        url: `${config.API_SCHEDULER}/jobgroup/remove`,
		name: "执行器列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobgroupUpdate: {
        url: `${config.API_SCHEDULER}/jobgroup/update`,
		name: "执行器列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobgroupAdd: {
        url: `${config.API_SCHEDULER}/jobgroup/save`,
		name: "执行器列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobgroupPageList: {
        url: `${config.API_SCHEDULER}/jobgroup/pageList`,
		name: "执行器列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	pageList: {
        url: `${config.API_SCHEDULER}/jobinfo/pageList`,
		name: "任务列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoTrigger: {
        url: `${config.API_SCHEDULER}/jobinfo/trigger`,
		name: "任务触发",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoStop: {
        url: `${config.API_SCHEDULER}/jobinfo/stop`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoStart: {
        url: `${config.API_SCHEDULER}/jobinfo/start`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoRemove: {
        url: `${config.API_SCHEDULER}/jobinfo/remove`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoAdd: {
        url: `${config.API_SCHEDULER}/jobinfo/add`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoUpdate: {
        url: `${config.API_SCHEDULER}/jobinfo/update`,
		name: "任务添加",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobinfoNextTriggerTime: {
        url: `${config.API_SCHEDULER}/jobinfo/nextTriggerTime`,
		name: "任务触发",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobgroupById: {
        url: `${config.API_SCHEDULER}/jobgroup/loadById`,
		name: "注册节点",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	info: {
        url: `${config.API_SCHEDULER}/info`,
		name: "基本信息",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			return await http.post(this.url, data, config);
		}
	},
	joblogChart: {
        url: `${config.API_SCHEDULER}/chartInfo`,
		name: "调用信息",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			return await http.post(this.url, data, config);
		}
	},
	clearLog: {
        url: `${config.API_SCHEDULER}/joblog/clearLog`,
		name: "清除日志",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			return await http.post(this.url, data, config);
		}
	},
	logDetailCat: {
        url: `${config.API_SCHEDULER}/joblog/logDetailCat`,
		name: "日志详情",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			return await http.get(this.url, data, config);
		}
	},
	getJobsByGroup: {
        url: `${config.API_SCHEDULER}/joblog/getJobsByGroup`,
		name: "任务列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
	jobGroup: {
        url: `${config.API_SCHEDULER}/jobgroup/pageList`,
		name: "执行器列表",
		get: async function(data, config={}){
			return await http.post(this.url, data, config);
		}
	},
	joblog: {
        url: `${config.API_SCHEDULER}/joblog/pageList`,
		name: "日志列表",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
		}
	},
}