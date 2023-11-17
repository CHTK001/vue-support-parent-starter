import config from "@/config";
import http from "@/utils/request";

export default {
	profile: {
		profile: {
			url: `${config.API_CONF}/v1/profile/profile`,
			name: "查询applications信息",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		applications: {
			url: `${config.API_CONF}/v1/profile/applications`,
			name: "查询profile信息",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		}
	},
	config: {
		save: {
			url: `${config.API_CONF}/v1/config/save`,
			name: "保存配置",
			post: async function (data, config = { headers: {} }) {
				return await http.post(this.url, data, config);
			},
		},
		update: {
			url: `${config.API_CONF}/v1/config/update`,
			name: "更新配置",
			put: async function (data, config = { headers: {} }) {
				return await http.put(this.url, data, config);
			},
		},
		delete: {
			url: `${config.API_CONF}/v1/config/delete`,
			name: "删除配置",
			delete: async function (data, config = { headers: {} }) {
				return await http.delete(
					this.url + `?id=${data.id}`,
					data,
					config
				);
			},
		},
		page: {
			url: `${config.API_CONF}/v1/config/page`,
			name: "查询信息",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		list: {
			url: `${config.API_CONF}/v1/config/list`,
			name: "查询信息",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
	},
};
