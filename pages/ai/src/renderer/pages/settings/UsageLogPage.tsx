import React, { useCallback, useEffect, useRef, useState } from 'react';
import { httpRequest } from '@/common/adapter/httpBridge';
import { Button } from '@arco-design/web-react';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import { Refresh } from '@icon-park/react';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

const LOGS_API = '/v2/usage/logs';
const LEVEL_COLORS: Record<string, string> = {
  INFO: 'var(--color-text-2)',
  WARN: 'var(--color-warning-5)',
  ERROR: 'var(--color-danger-5)',
};

/**
 * 将 ISO 时间戳格式化为 "[yyyy-MM-dd HH:mm:ss]"。
 *
 * @param iso ISO 时间字符串（如 2026-09-05T12:59:39.0527666）
 * @return 格式化后的时间文本；解析失败时原样返回
 */
function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `[${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} `
    + `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}]`;
}

const UsageLogPage: React.FC = () => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<LogEntry[]>('GET', LOGS_API);
      setEntries(res ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  useEffect(() => {
    if (!autoScroll) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, autoScroll]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    intervalRef.current = setInterval(() => { void loadLogs(); }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadLogs]);

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        {/* 顶栏 */}
        <div className='flex items-center gap-8px px-[32px] pt-16px pb-12px'>
          <span className='text-14px font-600 text-el-text'>用量同步日志</span>
          <span className='text-12px text-el-text-secondary'>每 5 秒自动刷新</span>
          <Button
            size='small'
            type={autoScroll ? 'primary' : 'outline'}
            onClick={() => setAutoScroll(v => !v)}
            style={{ marginLeft: 'auto' }}
          >
            {autoScroll ? '自动滚动' : '手动滚动'}
          </Button>
          <Button size='small' icon={<Refresh />} loading={loading} onClick={() => void loadLogs()}>
            刷新
          </Button>
        </div>

        {/* 日志列表 */}
        <div className='flex-1 min-h-0 px-[32px] pb-16px overflow-auto'>
          {entries.length === 0 && !loading ? (
            <div className='text-center py-24px text-el-text-secondary text-13px'>
              暂无日志，等待下次同步执行
            </div>
          ) : (
            <div className='font-mono text-12px leading-relaxed'>
              {entries.map((e, i) => (
                <div
                  key={i}
                  className='flex gap-8px py-2px hover:bg-fill-2 rd-4px px-8px'
                >
                  <span className='text-el-text-secondary shrink-0'>{fmtTimestamp(e.timestamp)}</span>
                  <span
                    className='shrink-0 font-600'
                    style={{ color: LEVEL_COLORS[e.level] ?? LEVEL_COLORS.INFO }}
                  >
                    [{e.level}]
                  </span>
                  <span className='text-el-text break-all'>{e.message}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default UsageLogPage;
