import Constant from "@/config/common"
const HOST1 = Constant.PREFIX + '/task';

const URL = {
    PAGE: HOST1 + '/page',
    OPTIONS: HOST1 + "/options",
    CREATE: HOST1 + "/createTask",
    DELETE: HOST1 + "/deleteByTaskId",
    EMIT: HOST1 + "/subscribe",
}

export default URL;