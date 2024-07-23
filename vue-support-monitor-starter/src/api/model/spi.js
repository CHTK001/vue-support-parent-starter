import config from "@/config"
import http from "@/utils/request"

export default {
    get: {
        url: `${config.API_URL}/v1/option/get`,
        name: "查询选项",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    objects: {
        url: `${config.API_URL}/v1/option/objects/get`,
        name: "查询选项",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    list: {
        url: `${config.API_URL}/v1/option/list`,
        name: "查询选项",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
}