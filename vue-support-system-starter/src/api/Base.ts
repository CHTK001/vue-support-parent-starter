import request from "@/utils/request";
import {AxiosResponse} from "axios";
import {reactive} from "vue";
import {ElMessage} from "element-plus";
import {PageState} from "@/api/vo/PageState";
import {local} from "@/utils/storage";

const func = function (url: string, param: any) {
    let newUrl = url;
    for (let key of Object.keys(param)) {
        newUrl = newUrl.replace("{" + key + "}", param[key]);
    }

    return newUrl;
}

export declare interface Base<T> {
    /**
     * 刷新数据
     * @param t 对象
     */
    doSearch(t: any): Promise<AxiosResponse<any>>;

    /**
     * 刷新数据
     * @param t 对象
     */
    doDefaultSearch(t: any, func: Function): void;

    /**
     * 查询数据
     * @param t
     */
    doUpdate(t: any): Promise<AxiosResponse<any>>;

    /**
     * 查询数据
     * @param t
     * @param func
     */
    doDefaultUpdate(t: any, func: Function): void;

    /**
     * 删除数据
     * @param t
     */
    doDelete(t: any): Promise<AxiosResponse<any>>

    /**
     * 查询数据
     * @param t
     * @param func
     */
    doDefaultDelete(t: any, func: Function): void;

    /**
     * 添加数据
     * @param t
     */
    doSave(t: any): Promise<AxiosResponse<any>>

    /**
     * 数据详情
     * @param t
     */
    doDetail(t: any): Promise<AxiosResponse<any>>

    /**
     * 数据详情
     * @param t
     */
    doList(t: any): Promise<AxiosResponse<any>>

    /**
     * 重置缓存
     */
    reset(): void

    /**
     * 注册值
     * @param user 用户信息
     */
    register(t: any): void
}


export class DefaultBase<T> implements Base<T> {
    searchUrl?: any;
    deleteUrl?: any;
    updateUrl?: any;
    detailUrl?: any;
    saveUrl?: any;
    stateConfig: any;

    pageConfig: any;

    self: DefaultBase<any>;
    listUrl?: any;

    constructor(saveUrl?: any, deleteUrl?: any, updateUrl?: any, searchUrl?: any, detailUrl?: any, listUrl?: any) {
        this.updateUrl = updateUrl;
        this.searchUrl = searchUrl;
        this.deleteUrl = deleteUrl;
        this.detailUrl = detailUrl;
        this.listUrl = listUrl;
        this.saveUrl = saveUrl;
        this.pageConfig = reactive(new PageState())
        this.self = this;
    }

    doDefaultDelete(t: any, func: Function = () => {
    }): void {
        this.doDelete(t)
            .then(xhr => {
                func(xhr);
            })
    }

    reset(): void {
        for (let key of Object.keys(this.stateConfig)) {
            this.stateConfig[key] = null;
        }
    }

    doDelete(t: any): Promise<AxiosResponse<any>> {
        if (!this.deleteUrl) {
            ElMessage({
                type: 'error',
                message: "无权限访问",
                showClose: true,
                grouping: true
            })
            // @ts-ignore
            return false;
        }
        let header: any = {};
        header['x-oauth-token'] = local.get("accessToken");
        return request.get(func(this.deleteUrl, t) as any, {
            params: t,
            headers: header
        });
    }

    doSave(t: any): Promise<AxiosResponse<any>> {
        if (!this.saveUrl) {
            ElMessage({
                type: 'error',
                message: "无权限访问",
                showClose: true,
                grouping: true
            })
            // @ts-ignore
            return false;
        }
        let header: any = {};
        header['x-oauth-token'] = local.get("accessToken");
        return request.post(func(this.saveUrl, t) as any, t, {
            headers: header
        });
    }

    doSearch(t: any): Promise<AxiosResponse<any>> {
        if (!this.searchUrl) {
            ElMessage({
                type: 'error',
                message: "无权限访问",
                showClose: true,
                grouping: true
            })
            // @ts-ignore
            return false;
        }
        let header: any = {};
        header['x-oauth-token'] = local.get("accessToken");
        return request.get(func(this.searchUrl, t) as any, {
            params: t,
            headers: header
        });

    }

    doDefaultSearch(t: any, func: Function = () => {
    }): boolean {
        if (!this.searchUrl) {
            ElMessage({
                type: 'error',
                message: "无权限访问",
                showClose: true,
                grouping: true
            })
            // @ts-ignore
            return false;
        }
        this.doSearch(t)
            .then(xhr => {
                this.pageConfig.data.length = 0;
                this.pageConfig.data = xhr.data['records'] || [];
                this.pageConfig.total = this.pageConfig.data.length
                func(xhr);
            })

        return false;
    }

    doUpdate(t: any): Promise<AxiosResponse<any>> {
        if (!this.updateUrl) {
            ElMessage({
                type: 'error',
                message: "无权限访问",
                showClose: true,
                grouping: true
            })
            // @ts-ignore
            return false;
        }
        let header: any = {};
        header['x-oauth-token'] = local.get("accessToken");
        return request.post(func(this.updateUrl, t) as any, t, {
            headers: header
        });
    }

    doDefaultUpdate(t: any, func: Function = () => {
    }): void {
        if (!this.updateUrl) {
            ElMessage({
                type: 'error',
                message: "无权限访问",
                showClose: true,
                grouping: true
            })
            // @ts-ignore
            return false;
        }
        this.doUpdate(t).then((xhr) => {
            ElMessage({
                //@ts-ignore
                message: xhr.message,
                //@ts-ignore
                type: !xhr.code ? 'success' : "error",
                showClose: true,
                grouping: true
            })
            func(xhr);
            return false;
        })
    }

    register(t: any): void {
        if (!t) {
            return
        }

        for (let key of Object.keys(this.stateConfig)) {
            this.stateConfig[key] = t[key]
        }

        let element = t['ext'];
        if (!!element) {
            for (let key of Object.keys(this.stateConfig)) {
                let element1 = element[key];
                if (!element1) {
                    continue
                }
                // @ts-ignore
                this.stateConfig[key] = element1;
            }
        }
    }

    doDetail(t: any): Promise<AxiosResponse<any>> {
        if (!this.detailUrl) {
            ElMessage({
                type: 'error',
                message: "无权限访问",
                showClose: true,
                grouping: true
            })
            // @ts-ignore
            return false;
        }
        let header: any = {};
        header['x-oauth-token'] = local.get("accessToken");
        return request.get(func(this.detailUrl, t) as any, {
            params: t,
            headers: header
        });
    }

    doList(t: any): Promise<AxiosResponse<any>> {
        if (!this.listUrl) {
            ElMessage({
                type: 'error',
                message: "无权限访问",
                showClose: true,
                grouping: true
            })
            // @ts-ignore
            return false;
        }
        let header: any = {};
        header['x-oauth-token'] = local.get("accessToken");
        return request.get(func(this.listUrl, t) as any, {
            params: t,
            headers: header
        });
    }


}
