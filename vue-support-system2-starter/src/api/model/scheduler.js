import config from "@/config"
import http from "@/utils/request"

export default {
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
	clearLog: {
        url: `${config.API_SCHEDULER}/joblog/clearLog`,
		name: "清除日志",
		get: async function(data, config={headers:{}}){
			config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			return await http.post(this.url, data, config);
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