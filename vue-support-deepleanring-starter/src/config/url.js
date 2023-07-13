import Constant from "@/config/common"
const HOST = Constant.PREFIX + "/api/v1";
const URL = {
    CONFIG: HOST + "/options",
    COMPARE_CONFIG: HOST + "/options/compare",
}

export default URL;