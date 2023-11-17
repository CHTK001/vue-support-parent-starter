import config from "@/config";
import http from "@/utils/request";

export default {
	cloudPlatform: {
		service: {
			accessEvent: {
				url: `${config.API_CONF}/v1/device/cloud/event`,
				name: "同步设备数据",
				post: async function (
					data,
					config = { headers: {}, timeout: 300_000 }
				) {
					return await http.post(this.url, data, config);
				},
			},
			liveAddress: {
				url: `${config.API_CONF}/v1/device/cloud/liveAddress`,
				name: "视频设备监控",
				post: async function (data, config = { headers: {} }) {
					return await http.post(this.url, data, config);
				},
			},
			syncDevice: {
				url: `${config.API_CONF}/v1/device/cloud/syncDevice`,
				name: "同步设备",
				post: async function (data, config = { headers: {} }) {
					return await http.post(this.url, data, config);
				},
			},
			syncOrg: {
				url: `${config.API_CONF}/v1/device/cloud/syncOrg`,
				name: "同步组织",
				post: async function (data, config = { headers: {} }) {
					return await http.post(this.url, data, config);
				},
			},
		},
	},

	manufacturer: {
		save: {
			url: `${config.API_CONF}/v1/device/manufacturer/save`,
			name: "保存厂家配置",
			post: async function (data, config = { headers: {} }) {
				return await http.post(this.url, data, config);
			},
		},
		update: {
			url: `${config.API_CONF}/v1/device/manufacturer/update`,
			name: "更新厂家配置",
			put: async function (data, config = { headers: {} }) {
				return await http.put(this.url, data, config);
			},
		},
		delete: {
			url: `${config.API_CONF}/v1/device/manufacturer/delete`,
			name: "删除厂家配置",
			delete: async function (data, config = { headers: {} }) {
				return await http.delete(
					this.url + `?id=${data.id}`,
					data,
					config
				);
			},
		},
		page: {
			url: `${config.API_CONF}/v1/device/manufacturer/page`,
			name: "查询厂家信息",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		list: {
			url: `${config.API_CONF}/v1/device/manufacturer/list`,
			name: "查询厂家信息",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
	},
	cloud: {
		platform: {
			save: {
				url: `${config.API_CONF}/v1/device/cloud/platform/save`,
				name: "保存厂家配置",
				post: async function (data, config = { headers: {} }) {
					return await http.post(this.url, data, config);
				},
			},
			update: {
				url: `${config.API_CONF}/v1/device/cloud/platform/update`,
				name: "更新厂家配置",
				put: async function (data, config = { headers: {} }) {
					return await http.put(this.url, data, config);
				},
			},
			delete: {
				url: `${config.API_CONF}/v1/device/cloud/platform/delete`,
				name: "删除厂家配置",
				delete: async function (data, config = { headers: {} }) {
					return await http.delete(
						this.url + `?id=${data.id}`,
						data,
						config
					);
				},
			},
			page: {
				url: `${config.API_CONF}/v1/device/cloud/platform/page`,
				name: "查询厂家信息",
				get: async function (data, config = { headers: {} }) {
					return await http.get(this.url, data, config);
				},
			},
			list: {
				url: `${config.API_CONF}/v1/device/cloud/platform/list`,
				name: "查询厂家信息",
				get: async function (data, config = { headers: {} }) {
					return await http.get(this.url, data, config);
				},
			},
		},
		connector: {
			save: {
				url: `${config.API_CONF}/v1/device/cloud/platform/connector/save`,
				name: "保存服务配置",
				post: async function (data, config = { headers: {} }) {
					return await http.post(this.url, data, config);
				},
			},
			update: {
				url: `${config.API_CONF}/v1/device/cloud/platform/connector/update`,
				name: "更新服务配置",
				put: async function (data, config = { headers: {} }) {
					return await http.put(this.url, data, config);
				},
			},
			delete: {
				url: `${config.API_CONF}/v1/device/cloud/platform/connector/delete`,
				name: "删除服务配置",
				delete: async function (data, config = { headers: {} }) {
					return await http.delete(
						this.url + `?id=${data.id}`,
						data,
						config
					);
				},
			},
			page: {
				url: `${config.API_CONF}/v1/device/cloud/platform/connector/page`,
				name: "查询服务信息",
				get: async function (data, config = { headers: {} }) {
					return await http.get(this.url, data, config);
				},
			},
			list: {
				url: `${config.API_CONF}/v1/device/cloud/platform/connector/list`,
				name: "查询服务信息",
				get: async function (data, config = { headers: {} }) {
					return await http.get(this.url, data, config);
				},
			},
		},
	},
	type: {
		save: {
			url: `${config.API_CONF}/v1/device/type/save`,
			name: "保存设备类型",
			post: async function (data, config = { headers: {} }) {
				return await http.post(this.url, data, config);
			},
		},
		update: {
			url: `${config.API_CONF}/v1/device/type/update`,
			name: "更新设备类型",
			put: async function (data, config = { headers: {} }) {
				return await http.put(this.url, data, config);
			},
		},
		delete: {
			url: `${config.API_CONF}/v1/device/type/delete`,
			name: "删除设备类型",
			delete: async function (data, config = { headers: {} }) {
				return await http.delete(
					this.url + `?id=${data.id}`,
					data,
					config
				);
			},
		},
		page: {
			url: `${config.API_CONF}/v1/device/type/page`,
			name: "设备类型",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		list: {
			url: `${config.API_CONF}/v1/device/type/list`,
			name: "设备类型",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		tree: {
			url: `${config.API_CONF}/v1/device/type/tree`,
			name: "设备类型tree",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
	},
	org: {
		save: {
			url: `${config.API_CONF}/v1/device/org/save`,
			name: "保存设备org",
			post: async function (data, config = { headers: {} }) {
				return await http.post(this.url, data, config);
			},
		},
		update: {
			url: `${config.API_CONF}/v1/device/org/update`,
			name: "更新设备org",
			put: async function (data, config = { headers: {} }) {
				return await http.put(this.url, data, config);
			},
		},
		delete: {
			url: `${config.API_CONF}/v1/device/org/delete`,
			name: "删除设备org",
			delete: async function (data, config = { headers: {} }) {
				return await http.delete(
					this.url + `?id=${data.id}`,
					data,
					config
				);
			},
		},
		page: {
			url: `${config.API_CONF}/v1/device/org/page`,
			name: "设备org",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		list: {
			url: `${config.API_CONF}/v1/device/org/list`,
			name: "设备org",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		tree: {
			url: `${config.API_CONF}/v1/device/org/tree`,
			name: "设备orgtree",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
	},
	device: {
		save: {
			url: `${config.API_CONF}/v1/device/device/save`,
			name: "保存设备",
			post: async function (data, config = { headers: {} }) {
				return await http.post(this.url, data, config);
			},
		},
		update: {
			url: `${config.API_CONF}/v1/device/device/update`,
			name: "更新设备",
			put: async function (data, config = { headers: {} }) {
				return await http.put(this.url, data, config);
			},
		},
		delete: {
			url: `${config.API_CONF}/v1/device/device/delete`,
			name: "删除设备",
			delete: async function (data, config = { headers: {} }) {
				return await http.delete(
					this.url + `?id=${data.id}`,
					data,
					config
				);
			},
		},
		page: {
			url: `${config.API_CONF}/v1/device/device/page`,
			name: "设备",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		list: {
			url: `${config.API_CONF}/v1/device/device/list`,
			name: "设备",
			get: async function (data, config = { headers: {} }) {
				return await http.get(this.url, data, config);
			},
		},
		data: {
			page: {
				url: `${config.API_CONF}/v1/device/data/page`,
				name: "设备channel",
				get: async function (data, config = { headers: {} }) {
					return await http.post(this.url, data, config);
				},
			},
		},
		channel: {
			save: {
				url: `${config.API_CONF}/v1/device/channel/save`,
				name: "保存设备channel",
				post: async function (data, config = { headers: {} }) {
					return await http.post(this.url, data, config);
				},
			},
			update: {
				url: `${config.API_CONF}/v1/device/channel/update`,
				name: "更新设备channel",
				put: async function (data, config = { headers: {} }) {
					return await http.put(this.url, data, config);
				},
			},
			delete: {
				url: `${config.API_CONF}/v1/device/channel/delete`,
				name: "删除设备channel",
				delete: async function (data, config = { headers: {} }) {
					return await http.delete(
						this.url + `?id=${data.id}`,
						data,
						config
					);
				},
			},
			page: {
				url: `${config.API_CONF}/v1/device/channel/page`,
				name: "设备channel",
				get: async function (data, config = { headers: {} }) {
					return await http.get(this.url, data, config);
				},
			},
			list: {
				url: `${config.API_CONF}/v1/device/channel/list`,
				name: "设备channel",
				get: async function (data, config = { headers: {} }) {
					return await http.get(this.url, data, config);
				},
			},
		},
	},
};
