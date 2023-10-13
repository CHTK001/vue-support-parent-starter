import config from "@/config";
import http from "@/utils/request";

export default {
    config: {
		page: {
			url: `${config.API_SPIDER}/v1/spider/config/page`,
			name: "获取配置",
			get: async function (params) {
				return await http.get(this.url, params);
			},
		},
        save: {
			url: `${config.API_SPIDER}/v1/spider/config/save`,
			name: "保存配置",
			post: async function (params) {
				return await http.post(this.url, params);
			},
		},
        update: {
			url: `${config.API_SPIDER}/v1/spider/config/update`,
			name: "更新配置",
			post: async function (params) {
				return await http.post(this.url, params);
			},
		},
        delete: {
			url: `${config.API_SPIDER}/v1/spider/config/delete`,
			name: "获取配置",
			get: async function (params) {
				return await http.get(this.url, params);
			},
		},
    },
    rule: {
		page: {
			url: `${config.API_SPIDER}/v1/spider/rule/page`,
			name: "获取规则",
			get: async function (params) {
				return await http.get(this.url, params);
			},
		},
        save: {
			url: `${config.API_SPIDER}/v1/spider/rule/save`,
			name: "保存规则",
			post: async function (params) {
				return await http.post(this.url, params);
			},
		},
        update: {
			url: `${config.API_SPIDER}/v1/spider/rule/update`,
			name: "更新规则",
			post: async function (params) {
				return await http.post(this.url, params);
			},
		},
        delete: {
			url: `${config.API_SPIDER}/v1/spider/rule/delete`,
			name: "删除规则",
			get: async function (params) {
				return await http.get(this.url, params);
			},
		},
    },
    rule: {
		page: {
			url: `${config.API_SPIDER}/v1/spider/result/page`,
			name: "获取结果",
			get: async function (params) {
				return await http.get(this.url, params);
			},
		},
    }
};
