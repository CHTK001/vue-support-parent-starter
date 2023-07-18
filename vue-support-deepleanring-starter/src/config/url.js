import Constant from "@/config/common"
const HOST = Constant.PREFIX + "/api/v1";
const URL = {
    CONFIG: HOST + "/options",
    COMPARE_CONFIG: HOST + "/options/compare",
    STYLE_CONFIG: HOST + "/options/style",
    STYLE: HOST + "/style"
}

export default URL;