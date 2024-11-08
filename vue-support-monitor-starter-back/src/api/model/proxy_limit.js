import config from "@/config"
import http from "@/utils/request"

export default {
    page: {
        url: `${config.API_URL}/v1/proxy/limit/page`,
        name: "查询服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    save: {
        url: `${config.API_URL}/v1/proxy/limit/save`,
        name: "添加服务",
        post: async function(params){
            return await http.post(this.url, params);
        }
    },
    update: {
        url: `${config.API_URL}/v1/proxy/limit/update`,
        name: "修改服务",
        put: async function(params){
            return await http.put(this.url, params);
        }
    },
    delete: {
        url: `${config.API_URL}/v1/proxy/limit/delete`,
        name: "删除服务",
        delete: async function(params){
            return await http.delete(this.url + `?id=${params.id}`, params);
        }
    },
    log: {
        statistic: {
            url: `${config.API_URL}/v1/proxy/limit/log/statistic`,
            name: "查询服务",
            get: async function(params){
                return await http.get(this.url, params);
            }
        },
        page: {
            url: `${config.API_URL}/v1/proxy/limit/log/page`,
            name: "查询服务",
            get: async function(params){
                return await http.get(this.url, params);
            }
        },
        delete: {
            url: `${config.API_URL}/v1/proxy/limit/log/delete`,
            name: "删除日志",
            delete: async function(params){
                return await http.delete(this.url + "?limitMonth=" + params['limitMonth'], params);
            }
        },
    }
}