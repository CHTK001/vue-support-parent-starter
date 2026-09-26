/**
 * 站内消息 HTTP 适配器（@repo/core）
 *
 * 将后端「当前用户站内消息」接口封装为 useStationMessage / useMessageStore
 * 所需的 StationMessageAdapter（loadHistory / getUnreadCount / markRead）。
 * 接口地址从 getConfig().message 读取（listUrl / unreadUrl / readUrl），
 * 不依赖 Socket；前端拉取历史与未读、标记已读全部走 HTTP。
 *
 * 用法：
 *   // 全局注册（createApp 时调用一次）
 *   initStationMessageAdapter();
 *   // 任意处取用
 *   const adapter = getStationMessageAdapter();
 *   await adapter?.loadHistory({ page: 1, pageSize: 20 });
 */
import { getConfig } from "@repo/config";
import { getApiHttp } from "./index";

/** 站内消息请求短超时（毫秒）：这些请求只服务铃铛/浮窗，不应拖慢页面 */
const STATION_MESSAGE_TIMEOUT = 8000;

/** 站内消息项（后端 /v2/message/sys-message/page 返回结构） */
export interface StationMessageItem {
  /** 消息ID（已读游标） */
  id?: number;
  /** 消息主题 */
  subject?: string;
  /** 消息内容 */
  content?: string;
  /** 发送时间（yyyy-MM-dd HH:mm:ss） */
  sendTime?: string;
  /** 已读状态：0-未读 / 1-已读 */
  readStatus?: number;
  [key: string]: unknown;
}

/** 通用返回结构（后端 ReturnResult） */
interface ApiResult<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

/** 分页返回结构（后端 ReturnPageResult.data 为 PageResult） */
interface PageData<T = unknown> {
  data?: T[];
  total?: number;
  pageNo?: number;
  pageSize?: number;
  totalPages?: number;
}

/** 站内消息适配器实例 */
let stationMessageAdapter: import("../hooks/useStationMessage").StationMessageAdapter | null = null;

/**
 * 构建站内消息 HTTP 适配器
 *
 * 后端返回统一 { code, data } 包装；分页接口 data 为 { data: [], total }。
 */
export function initStationMessageAdapter(): import("../hooks/useStationMessage").StationMessageAdapter {
  if (stationMessageAdapter) {
    return stationMessageAdapter;
  }
  const cfg = getConfig().message;
  const http = getApiHttp();

  stationMessageAdapter = {
    /** 分页拉取历史消息；返回列表 + 服务端未读总数（短超时，避免拖慢页面） */
    async loadHistory(params) {
      try {
        const res = await http
          .get(cfg.listUrl)
          .timeout(STATION_MESSAGE_TIMEOUT)
          .query({
            page: params?.page ?? 1,
            pageSize: params?.pageSize ?? 20,
            ...(params?.cursor !== undefined ? { cursor: params.cursor } : {}),
          })
          .then<ApiResult<PageData<StationMessageItem>>>((r) => r.data);
        const page = res?.data;
        return {
          list: (page?.data ?? []).map(toStationMessage),
          total: page?.total,
        };
      } catch {
        return { list: [] };
      }
    },

    /** 未读数（短超时，避免拖慢页面） */
    async getUnreadCount() {
      try {
        const res = await http
          .get(cfg.unreadUrl)
          .timeout(STATION_MESSAGE_TIMEOUT)
          .then<ApiResult<number>>((r) => r.data);
        return typeof res?.data === "number" ? res.data : 0;
      } catch {
        return 0;
      }
    },

    /** 标记已读（lastId 为空表示全部已读；短超时，避免拖慢页面） */
    async markRead(lastId) {
      try {
        await http
          .put(cfg.readUrl)
          .timeout(STATION_MESSAGE_TIMEOUT)
          .query(lastId !== undefined ? { lastId } : {})
          .then<ApiResult<boolean>>((r) => r.data);
      } catch {
        // 忽略
      }
    },
  };

  return stationMessageAdapter;
}

/** 获取全局站内消息适配器（未初始化返回 null） */
export function getStationMessageAdapter(): import("../hooks/useStationMessage").StationMessageAdapter | null {
  return stationMessageAdapter;
}

/** 后端站内消息项 → 前端 StationMessage 结构 */
function toStationMessage(item: StationMessageItem): import("../hooks/useStationMessage").StationMessage {
  return {
    id: item.id,
    subject: item.subject,
    content: item.content,
    sendTime: item.sendTime,
    readStatus: item.readStatus,
    isRead: item.readStatus === 1,
    ...item,
  };
}
