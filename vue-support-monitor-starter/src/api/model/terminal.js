import config from "@/config"
import http from "@/utils/request"

export default {
    start: {
        url: `${config.API_URL}/v1/terminal/start`,
        name: "启动服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    stop: {
        url: `${config.API_URL}/v1/terminal/stop`,
        name: "暂停服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    list: {
        url: `${config.API_URL}/v1/terminal/list`,
        name: "查询服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    page: {
        url: `${config.API_URL}/v1/terminal/page`,
        name: "查询服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    save: {
        url: `${config.API_URL}/v1/terminal/save`,
        name: "添加服务",
        post: async function(params){
            return await http.post(this.url, params);
        }
    },
    update: {
        url: `${config.API_URL}/v1/terminal/update`,
        name: "修改服务",
        put: async function(params){
            return await http.put(this.url, params);
        }
    },
    delete: {
        url: `${config.API_URL}/v1/terminal/delete`,
        name: "删除服务",
        delete: async function(params){
            return await http.delete(this.url + `?id=${params.id}`, params);
        }
    },
}