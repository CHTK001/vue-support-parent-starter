import GLOBAL_URL from "@/config/common"

const HOST = GLOBAL_URL + '/vuesql';
const URL = {
    GENERATOR: HOST + '/generator',
    OPEN_TABLE: HOST + '/table/open/{configId}/{realName}',
    KEYWORD: HOST + '/table/keyword/{configId}',
    EXECUTE: HOST + '/table/execute/{configId}',
    EXPLAIN: HOST + '/table/explain/{configId}',
    LIST_DATASOURCE: HOST + "/database/list",
    UPDATE_DATABASE: HOST + "/database/save",
    DELETE_DATABASE: HOST + "/database/delete/{configId}",
    DATABASE_TYPES: HOST + "/database/type",
    GET_TABLE_INFO: HOST + "/table/{configId}",
    UPDATE_TABLE: HOST + "/table/update",
    CLEAR_TABLE: HOST + "/table/clear/{configId}/{realName}"
}

export default URL;