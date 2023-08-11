import config from "@/config";
import http from "@/utils/request";

export default {
    config: {
		page: {
			url: `${config.API_CONF}/v1/configuration/page`,
			name: "获取映射",
			get: async function () {
				return await http.get(this.url);
			},
		},
		save: {
			url: `${config.API_CONF}/v1/configuration/save`,
			name: "添加映射",
			post: function (params) {
				return http.post(this.url, params);
			},
		},
		update: {
			url: `${config.API_CONF}/v1/configuration/update`,
			name: "更新映射",
			put: function (params) {
				return http.put(this.url, params);
			},
		},
		delete: {
			url: `${config.API_CONF}/v1/configuration/delete`,
			name: "删除映射",
			delete: function (p) {
				return http.delete(this.url + `?mapId=${p.libId}`, {
					params: p,
				});
			},
		},
	},
	mapping: {
		page: {
			url: `${config.API_CONF}/v1/mapping/page`,
			name: "获取映射",
			get: async function () {
				return await http.get(this.url);
			},
		},
		save: {
			url: `${config.API_CONF}/v1/mapping/save`,
			name: "添加映射",
			post: function (params) {
				return http.post(this.url, params);
			},
		},
		update: {
			url: `${config.API_CONF}/v1/mapping/update`,
			name: "更新映射",
			put: function (params) {
				return http.put(this.url, params);
			},
		},
		delete: {
			url: `${config.API_CONF}/v1/mapping/delete`,
			name: "删除映射",
			delete: function (p) {
				return http.delete(this.url + `?mapId=${p.libId}`, {
					params: p,
				});
			},
		},
	},
};
