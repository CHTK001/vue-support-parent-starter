import Constant from "@/config/common"
const HOST = Constant.PREFIX + "/oss";
const URL = {
    OSS_PREFIX: HOST + "/release/preview/",
    OPTIONS: HOST + "/release/options",
    SAVE: HOST +  "/release/save",
    UPDATE: HOST +  "/release/update",
    DELETE: HOST +  "/release/delete",
    UPLOAD: HOST + "/release/upload",
    PAGE: HOST + "/release/page",
    DELETE_OBJECT: HOST + "/release/deleteObject",
    LIST_OBJECT: HOST + "/release/listObjects",
    TREE_OBJECT: HOST + "/release/preview/{ossBucket}/{id}" 
    
}

export default URL;