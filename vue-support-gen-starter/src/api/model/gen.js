import config from "@/config"
import http from "@/utils/request"

export default {
	dbc: {
		support: {
			url: `${config.API_CONF}/v1/dbc/support`,
			name: "数据库配置列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		deleteFile: {
			url: `${config.API_CONF}/v1/dbc/deleteFile`,
			name: "数据库配置列表",
			delete: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		download: {
			url: `${config.API_CONF}/v1/dbc/download`,
			name: "下载驱动",
			get: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		uploadDriver: {
			url: `${config.API_CONF}/v1/dbc/uploadDriver`,
			name: "上传驱动",
			post: async function(data, config={headers:{}}){
				config.headers['Content-Type'] = 'multipart/form-data'
				return await http.post(this.url, data, config);
			}
		},
		list: {
			url: `${config.API_CONF}/v1/dbc/list`,
			name: "数据库配置列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		save: {
			url: `${config.API_CONF}/v1/dbc/save`,
			name: "保存数据配置",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		update: {
			url: `${config.API_CONF}/v1/dbc/update`,
			name: "更新数据配置",
			put: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		delete: {
			url: `${config.API_CONF}/v1/dbc/delete`,
			name: "删除数据配置",
			delete: async function(data, config={headers:{}}){
				return await http.get(this.url , data, config);
			}
		},
	},
	database: {
		support: {
			url: `${config.API_CONF}/v1/db/support`,
			name: "数据库列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		deleteFile: {
			url: `${config.API_CONF}/v1/db/deleteFile`,
			name: "数据库配置列表",
			delete: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		uploadDriver: {
			url: `${config.API_CONF}/v1/db/uploadDriver`,
			name: "上传数据文件",
			post: async function(data, config={headers:{}}){
				config.headers['Content-Type'] = 'multipart/form-data'
				return await http.post(this.url, data, config);
			}
		},
		list: {
			url: `${config.API_CONF}/v1/db/list`,
			name: "数据库列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		save: {
			url: `${config.API_CONF}/v1/db/save`,
			name: "保存数据源",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		update: {
			url: `${config.API_CONF}/v1/db/update`,
			name: "更新数据源",
			put: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		delete: {
			url: `${config.API_CONF}/v1/db/delete`,
			name: "删除数据源",
			delete: async function(data, config={headers:{}}){
				return await http.get(this.url , data, config);
			}
		},
	},
	column: {
		info: {
			url: `${config.API_CONF}/v1/column/info`,
			name: "表信息",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		update: {
			url: `${config.API_CONF}/v1/column/update`,
			name: "更新表字段",
			put: async function(data, config={headers:{}}){
				return await http.put(this.url, data, config);
			}
		},
	},
	session: {
		info: {
			url: `${config.API_CONF}/v1/session/info`,
			name: "服务器信息",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		save: {
			url: `${config.API_CONF}/v1/session/save`,
			name: "保存数据",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		update: {
			url: `${config.API_CONF}/v1/session/update`,
			name: "更新数据",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		delete: {
			url: `${config.API_CONF}/v1/session/delete`,
			name: "删除数据",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		explain: {
			url: `${config.API_CONF}/v1/session/explain`,
			name: "解释语句",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		execute: {
			url: `${config.API_CONF}/v1/session/execute`,
			name: "解释语句",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		keyword: {
			url: `${config.API_CONF}/v1/session/keyword`,
			name: "关键词",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		children: {
			url: `${config.API_CONF}/v1/session/children`,
			name: "关键词",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
	},
	table: {
		subscribe: {
			url: `${config.API_CONF}/v1/table/subscribe/`,
			name: "表列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		sync: {
			url: `${config.API_CONF}/v1/table/sync`,
			name: "表列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		
		list: {
			url: `${config.API_CONF}/v1/table/page`,
			name: "表列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		info: {
			url: `${config.API_CONF}/v1/table/info`,
			name: "表信息",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		template: {
			url: `${config.API_CONF}/v1/table/template`,
			name: "表列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		table: {
			url: `${config.API_CONF}/v1/table/table`,
			name: "表列表",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		importColumn: {
			url: `${config.API_CONF}/v1/table/importColumn`,
			name: "导入表",
			imports: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		batchGenCode: {
			url: `${config.API_CONF}/v1/table/batchGenCode`,
			name: "导入表",
			download: async function(data, config={headers:{}}){
				return await http.get(this.url, data, config);
			}
		},
		save: {
			url: `${config.API_CONF}/v1/table/save`,
			name: "保存表",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		update: {
			url: `${config.API_CONF}/v1/table/update`,
			name: "更新表",
			put: async function(data, config={headers:{}}){
				return await http.put(this.url, data, config);
			}
		},
		delete: {
			url: `${config.API_CONF}/v1/table/delete`,
			name: "删除表",
			delete: async function(data, config={headers:{}}){
				return await http.get(this.url , data, config);
			}
		},
	}
}