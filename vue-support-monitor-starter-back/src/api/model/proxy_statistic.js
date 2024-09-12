import config from "@/config"
import http from "@/utils/request"

export default {
    page: {
        url: `${config.API_URL}/v1/proxy/statistic/page`,
        name: "查询服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    save: {
        url: `${config.API_URL}/v1/proxy/statistic/save`,
        name: "添加服务",
        post: async function(params){
            return await http.post(this.url, params);
        }
    },
    update: {
        url: `${config.API_URL}/v1/proxy/statistic/update`,
        name: "修改服务",
        put: async function(params){
            return await http.put(this.url, params);
        }
    },
    delete: {
        url: `${config.API_URL}/v1/proxy/statistic/delete`,
        name: "删除服务",
        delete: async function(params){
            return await http.delete(this.url + `?id=${params.id}`, params);
        }
    },
}