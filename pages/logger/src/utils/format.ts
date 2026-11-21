/**
 * 时间展示工具：兼容 epoch 毫秒与常见字符串时间格式。
 */
import dayjs from "dayjs";

function toDayjs(ts: string | number | undefined | null) {
  if (ts === undefined || ts === null || ts === "") return null;
  const raw = typeof ts === "number" || /^\d+$/.test(String(ts)) ? Number(ts) : ts;
  const d = dayjs(raw);
  return d.isValid() ? d : null;
}

/** 格式化事件时间；withDate=false 时只显示时分秒（实时流场景） */
export function formatTs(ts: string | number | undefined, withDate = false): string {
  const d = toDayjs(ts);
  if (!d) return ts === undefined || ts === null || ts === "" ? "-" : String(ts);
  return withDate ? d.format("YYYY-MM-DD HH:mm:ss") : d.format("HH:mm:ss");
}

/** 相对时间（应用实例「最近上报」）：x 秒/分钟/小时/天前 */
export function relativeTime(ts: string | number | undefined): string {
  const d = toDayjs(ts);
  if (!d) return ts === undefined || ts === null || ts === "" ? "-" : String(ts);
  const diffMs = Date.now() - d.valueOf();
  if (diffMs < 0) return "刚刚";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  return `${Math.floor(hr / 24)} 天前`;
}
