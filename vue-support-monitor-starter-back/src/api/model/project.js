import config from "@/config"
import http from "@/utils/request"

export default {
    start: {
        url: `${config.API_URL}/v1/terminal/project/start`,
        name: "启动服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    stop: {
        url: `${config.API_URL}/v1/terminal/project/stop`,
        name: "暂停服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    logstart: {
        url: `${config.API_URL}/v1/terminal/project/log/start`,
        name: "开启日志",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    logstop: {
        url: `${config.API_URL}/v1/terminal/project/log/stop`,
        name: "停止日志",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    logpause: {
        url: `${config.API_URL}/v1/terminal/project/log/pause`,
        name: "暂停日志",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    baseDelete: {
        url: `${config.API_URL}/v1/terminal/base/delete`,
        name: "暂停服务",
        delete: async function(params){
            return await http.delete(this.url+ `?id=${params.id}`, params);
        }
    },
    uploadFile: {
        url: `${config.API_URL}/v1/terminal/project/uploadFile`,
        name: "上传文件",
        post: async function(params, config={headers:{}}){
            const formDataItem = new FormData();
            Object.keys(params).forEach(key => {
                formDataItem.append(key, params[key]);
            });
            return await http.post(this.url, formDataItem, {'Content-Type': 'multipart/form-data'});
        }
    },
    list: {
        url: `${config.API_URL}/v1/terminal/project/list`,
        name: "查询服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    page: {
        url: `${config.API_URL}/v1/terminal/project/page`,
        name: "查询服务",
        get: async function(params){
            return await http.get(this.url, params);
        }
    },
    save: {
        url: `${config.API_URL}/v1/terminal/project/save`,
        name: "添加服务",
        post: async function(params){
            return await http.post(this.url, params);
        }
    },
    update: {
        url: `${config.API_URL}/v1/terminal/project/update`,
        name: "修改服务",
        put: async function(params){
            return await http.put(this.url, params);
        }
    },
    delete: {
        url: `${config.API_URL}/v1/terminal/project/delete`,
        name: "删除服务",
        delete: async function(params){
            return await http.delete(this.url + `?id=${params.id}`, params);
        }
    },
}