import config from "@/config"
import http from "@/utils/request"

export default {
	database: {
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
				config.headers['Content-Type'] = 'multipart/form-data'
				return await http.post(this.url, data, config);
			}
		},
		update: {
			url: `${config.API_CONF}/v1/db/update`,
			name: "更新数据源",
			put: async function(data, config={headers:{}}){
				config.headers['Content-Type'] = 'multipart/form-data'
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
	table: {
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