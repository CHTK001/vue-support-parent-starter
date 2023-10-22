import config from "@/config"
import http from "@/utils/request"

export default {
	manufacturer: {
        save: {
			url: `${config.API_CONF}/v1/device/manufacturer/save`,
			name: "保存厂家配置",
			post: async function(data, config={headers:{}}){
				return await http.post(this.url, data, config);
			}
		},
		update: {
			url: `${config.API_CONF}/v1/device/manufacturer/update`,
			name: "更新厂家配置",
			put: async function(data, config={headers:{}}){
				return await http.put(this.url, data, config);
			}
		},
		delete: {
			url: `${config.API_CONF}/v1/device/manufacturer/delete`,
			name: "删除厂家配置",
			delete: async function(data, config={headers:{}}){
				return await http.delete(this.url + `?id=${data.id}` , data, config);
			}
		},
		page: {
			url: `${config.API_CONF}/v1/device/manufacturer/page`,
			name: "查询厂家信息",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url , data, config);
			}
		},
        list: {
			url: `${config.API_CONF}/v1/device/manufacturer/list`,
			name: "查询厂家信息",
			get: async function(data, config={headers:{}}){
				return await http.get(this.url , data, config);
			}
		},
    },
	cloud: {
		platform: {
			save: {
				url: `${config.API_CONF}/v1/device/cloud/platform/save`,
				name: "保存厂家配置",
				post: async function(data, config={headers:{}}){
					return await http.post(this.url, data, config);
				}
			},
			update: {
				url: `${config.API_CONF}/v1/device/cloud/platform/update`,
				name: "更新厂家配置",
				put: async function(data, config={headers:{}}){
					return await http.put(this.url, data, config);
				}
			},
			delete: {
				url: `${config.API_CONF}/v1/device/cloud/platform/delete`,
				name: "删除厂家配置",
				delete: async function(data, config={headers:{}}){
					return await http.delete(this.url + `?id=${data.id}` , data, config);
				}
			},
			page: {
				url: `${config.API_CONF}/v1/device/cloud/platform/page`,
				name: "查询厂家信息",
				get: async function(data, config={headers:{}}){
					return await http.get(this.url , data, config);
				}
			},
			list: {
				url: `${config.API_CONF}/v1/device/cloud/platform/list`,
				name: "查询厂家信息",
				get: async function(data, config={headers:{}}){
					return await http.get(this.url , data, config);
				}
			},
		}
       
    },
	
}