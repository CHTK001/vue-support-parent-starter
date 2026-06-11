import type { ReturnResult } from "@repo/utils";
import { datalakeRequest } from "./request";

/** SPI 条目 */
export interface SpiItem {
  name: string;
}

/** 节点类型及 SPI 列表 */
export interface NodeType {
  type: string;
  spis: SpiItem[];
}

/** 节点类型列表 */
export const fetchNodeList = () =>
  datalakeRequest<ReturnResult<NodeType[]>>("get", "/v2/datalake/node/list");

/** 指定节点类型的 SPI 列表 */
export const fetchNodeSpis = (type: string) =>
  datalakeRequest<ReturnResult<SpiItem[]>>("get", `/v2/datalake/node/${type}/spis`);
