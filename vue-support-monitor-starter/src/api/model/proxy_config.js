import config from "@/config"
import http from "@/utils/request"

export default {
    list: {
        url: `${config.API_URL}/v1/proxy/config/list`,
        name: "查询服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    save: {
        url: `${config.API_URL}/v1/proxy/config/save`,
        name: "添加服务",
        post: async function(params){
            return await http.post(this.url, params);
        }
    },
    filter :{
        save: {
            url: `${config.API_URL}/v1/proxy/plugin/save`,
            name: "添加服务",
            post: async function(params, config={headers:{}}){
                config.headers['Content-Type'] = 'application/json'
                return await http.post(this.url, params, config);
            }
        },
        list: {
            url: `${config.API_URL}/v1/proxy/plugin/list`,
            name: "添加服务",
            get: async function(params){
                return await http.get(this.url, params);
            }
        },
    },
    setting :{
        save: {
            url: `${config.API_URL}/v1/proxy/plugin/config/save`,
            name: "添加服务",
            post: async function(params, config={headers:{}}){
                config.headers['Content-Type'] = 'application/json'
                return await http.post(this.url, params, config);
            }
        },
        list: {
            url: `${config.API_URL}/v1/proxy/plugin/config/list`,
            name: "添加服务",
            get: async function(params){
                return await http.get(this.url, params);
            }
        },
    }
}