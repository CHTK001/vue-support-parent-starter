import request from "@/utils/request";
import Global from "@/config/global";
import {LogQuery} from "@/api/log/types";

/**
 * 查询日志
 *
 * @param queryParams queryParams
 */
export function page(queryParams?: LogQuery) {
    return request({
        url: Global.HOST + '/api/v1/log/page',
        method: 'get',
        params: queryParams
    });
}
