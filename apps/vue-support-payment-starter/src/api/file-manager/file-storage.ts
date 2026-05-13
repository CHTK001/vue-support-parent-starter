// Stub for protocol module
import request from "@/api/config";

export const fileStorageList = (params: any) => request({ url: "/api/file-manager/file-storage/list", method: "get", params });

export default { fileStorageList };
