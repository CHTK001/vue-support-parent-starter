// Stub for protocol module
import request from "@/api/config";

export const fetchOptionObjectsList = (params: any) => request({ url: "/api/spi/option-objects", method: "get", params });

export default { fetchOptionObjectsList };
