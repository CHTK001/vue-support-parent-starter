import config from "@/config"
import http from "@/utils/request"

export default {

    protocol: {

        page: {
            url: `${config.API_URL}/v1/file/storage/protocol/page`,
            name: "查询协议",
            get: async function(params){
                return await http.get(this.url, params);
            }
        },
        save: {
            url: `${config.API_URL}/v1/file/storage/protocol/save`,
            name: "新增协议",
            post: async function(params){
                return await http.post(this.url, params);
            }
        },
        update: {
            url: `${config.API_URL}/v1/file/storage/protocol/update`,
            update: "更新协议",
            put: async function(params){
                return await http.put(this.url, params);
            }
        },
        start: {
            url: `${config.API_URL}/v1/file/storage/protocol/start`,
            update: "开启协议",
            put: async function(params){
                return await http.get(this.url, params);
            }
        },
        stop: {
            url: `${config.API_URL}/v1/file/storage/protocol/stop`,
            update: "停止协议",
            put: async function(params){
                return await http.get(this.url, params);
            }
        },
        delete: {
            url: `${config.API_URL}/v1/file/storage/protocol/delete`,
            name: "查询协议",
            delete: async function(params){
                return await http.delete(this.url+ `?id=${params.id}`, params);
            }
        },
    },
    page: {
        url: `${config.API_URL}/v1/file/storage/page`,
        name: "查询协议",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    viewer: {
        url: `${config.API_URL}/v1/file/storage/viewer`,
        name: "查询协议",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    save: {
        url: `${config.API_URL}/v1/file/storage/save`,
        name: "新增协议",
        post: async function(params){
            return await http.post(this.url, params);
        }
    },
    update: {
        url: `${config.API_URL}/v1/file/storage/update`,
        update: "更新协议",
        put: async function(params){
            return await http.put(this.url, params);
        }
    },
    delete: {
        url: `${config.API_URL}/v1/file/storage/delete`,
        name: "查询协议",
        delete: async function(params){
            return await http.delete(this.url+ `?id=${params.id}`, params);
        }
    },
}