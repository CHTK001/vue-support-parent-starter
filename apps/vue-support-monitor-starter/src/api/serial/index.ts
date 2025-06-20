import { http, type ReturnResult } from "@repo/utils";
import type { MonitorSysGenSerial } from "./types";

const PREFIX = "v1/gen/serial";

/**
 * 获取有效的串口
 * @param params 参数
 * @returns
 */
export const fetchSerialAvailablePorts = (params: any) => {
  return http.request("get", `${PREFIX}/available-ports`, { params });
};
/**
 *
 * 查询串口数据
 * @param params 参数
 * @returns
 */
export const fetchSerialPage = (params: any) => {
  return http.request("get", `${PREFIX}/page`, { params });
};

/**
 * 保存串口数据
 * @param data 数据
 * @returns
 */
export const fetchSerialSave = (data: MonitorSysGenSerial) => {
  return http.request("post", `${PREFIX}/save`, { data: data });
};

/**
 *
 * 更新串口数据
 * @param data 数据
 * @returns
 */
export const fetchSerialUpdate = (data: MonitorSysGenSerial) => {
  return http.request("put", `${PREFIX}/update`, { data: data });
};
/**
 * 删除串口数据
 * @param id 主键（字符串类型，支持批量删除）
 * @returns
 */
export const fetchSerialDelete = (id: string | number) => {
  return http.request("delete", `${PREFIX}/delete`, { params: { id: String(id) } });
};

/**
 *
 * 启动链接
 * @param id 主键
 * @returns
 */
export const fetchSerialStart = (id: number) => {
  return http.request("get", `${PREFIX}/start`, { params: { id: id } });
};

/**
 *
 * 停止链接
 * @param id 主键
 * @returns
 */
export const fetchSerialStop = (id: number) => {
  return http.request("get", `${PREFIX}/stop`, { params: { id: id } });
};
