/**
 * UsageSyncLogPage — 用量同步日志
 *
 * 上半：实时日志（内存缓冲 /v2/usage/logs，自动轮询）；
 * 下半：历史日志（持久化 /v2/usage/sync-logs，分页 + 级别过滤）。
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, Pagination, Spin, Switch } from '@arco-design/web-react';
import { FileText, Refresh } from '@icon-park/react';
import { usageApi, SyncLogEntry, SyncLogRow } from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const LEVEL_META: Record<string, { label: string; color: string }> = {
  INFO: { label: 'INFO', color: 'var(--color-success, #00b42a)' },
  WARN: { label: 'WARN', color: 'var(--color-warning, #ff7d00)' },
  ERROR: { label: 'ERROR', color: 'var(--color-danger, #f53f3f)' },
};

const PAGE_SIZE = 20;

export default function UsageSyncLogPage() {
  const { t } = useTranslation('settings');

  const [live, setLive] = useState<SyncLogEntry[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [rows, setRows] = useState<SyncLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<string | undefined>(undefined);
  const [listLoading, setListLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveBoxRef = useRef<HTMLDivElement | null>(null);

  const loadLive = useCallback(async () => {
    setLiveLoading(true);
    try {
      const list = await usageApi.syncLogsLive();
      setLive(list ?? []);
    } catch {
      /* 内存缓冲接口失败时静默保留旧数据 */
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const loadList = useCallback(
    async (p: number, lv?: string) => {
      setListLoading(true);
      try {
        const res = await usageApi.syncLogs(p, PAGE_SIZE, lv);
        setRows(res.records ?? []);
        setTotal(res.total ?? 0);
      } catch {
        Message.error(t('console.syncLogs.loadFailed', '历史日志加载失败'));
      } finally {
        setListLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    loadLive();
    loadList(1);
  }, [loadLive, loadList]);

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(loadLive, 10_000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, loadLive]);

  useEffect(() => {
    if (liveBoxRef.current) {
      liveBoxRef.current.scrollTop = liveBoxRef.current.scrollHeight;
    }
  }, [live]);

  const handleLevel = (lv: string | undefined) => {
    setLevel(lv);
    setPage(1);
    loadList(1, lv);
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <FileText theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.syncLogs.title', '用量同步日志')}</h1>
          <p className="desc">{t('console.syncLogs.desc', '查看定时同步、手动触发与数据源解析器的执行日志')}</p>
        </div>
      </div>

      {/* 实时日志（内存缓冲） */}
      <div className="ai-card" style={{ marginTop: 18 }}>
        <div className="ai-card-head">
          <span className="ai-card-title">{t('console.syncLogs.liveTitle', '实时日志（内存缓冲）')}</span>
          <span className="ai-card-extra">
            <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} uncheckedText={t('console.syncLogs.autoOff', '自动刷新关闭')} checkedText={t('console.syncLogs.autoOn', '自动刷新')} />
          </span>
          <Button size="small" icon={<Refresh size={13} />} onClick={loadLive} loading={liveLoading}>
            {t('console.syncLogs.refresh', '刷新')}
          </Button>
        </div>
        <div
          ref={liveBoxRef}
          style={{
            maxHeight: 260,
            overflowY: 'auto',
            background: 'var(--color-fill-2, #f5f5f7)',
            borderRadius: 'var(--ai-radius-sm)',
            padding: '6px 0',
            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: 12,
            lineHeight: '20px',
          }}
        >
          {live.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-4, #b4b4be)' }}>
              {t('console.syncLogs.noLive', '暂无实时日志，等待下一次同步任务…')}
            </div>
          ) : (
            live.map((l, i) => {
              const meta = LEVEL_META[l.level ?? 'INFO'] ?? LEVEL_META.INFO;
              return (
                <div className="ai-log-line" key={`${l.timestamp}-${i}`} style={{ borderRadius: 0 }}>
                  <span className="log-time">{l.timestamp ?? ''}</span>
                  <span style={{ flexShrink: 0, width: 46, color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                  <span className="log-msg" style={{ color: 'var(--color-text-1, #1d1d1f)' }}>
                    {l.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 历史日志（持久化） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 10 }}>
        <span className="ai-section-title" style={{ margin: 0 }}>
          {t('console.syncLogs.historyTitle', '历史日志（持久化）')}
        </span>
        <div className="ai-pills" role="group" aria-label={t('console.syncLogs.levelFilter', '级别筛选')}>
          <button type="button" aria-pressed={level === undefined} className={level === undefined ? 'selected' : ''} onClick={() => handleLevel(undefined)}>
            {t('console.syncLogs.all', '全部')}
          </button>
          {Object.entries(LEVEL_META).map(([k, v]) => (
            <button key={k} type="button" aria-pressed={level === k} className={level === k ? 'selected' : ''} onClick={() => handleLevel(k)}>
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button size="small" icon={<Refresh size={13} />} onClick={() => loadList(page, level)} />
      </div>

      <div className="ai-table">
        <div className="table-head hidden md:grid" style={{ gridTemplateColumns: '120px 70px 90px 1fr 170px' }}>
          <span>{t('console.syncLogs.colTime', '时间')}</span>
          <span>{t('console.syncLogs.colLevel', '级别')}</span>
          <span>{t('console.syncLogs.colSource', '来源')}</span>
          <span>{t('console.syncLogs.colMessage', '内容')}</span>
          <span>{t('console.syncLogs.colId', 'ID')}</span>
        </div>
        {listLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin size={26} />
          </div>
        ) : rows.length === 0 ? (
          <div className="ai-empty">
            <span className="icon">
              <FileText size={26} />
            </span>
            <span className="title">{t('console.syncLogs.emptyTitle', '暂无历史日志')}</span>
            <span className="hint">{t('console.syncLogs.emptyHint', '执行「用量管理」中的同步或聚合任务后，这里会记录持久化日志')}</span>
          </div>
        ) : (
          rows.map((r) => {
            const meta = LEVEL_META[r.level ?? 'INFO'] ?? LEVEL_META.INFO;
            return (
              <div className="table-row" key={r.id} style={{ gridTemplateColumns: '120px 70px 90px 1fr 170px' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-3, #9a9aa5)' }}>{r.createTime?.replace('T', ' ').slice(0, 19) ?? '—'}</span>
                <span>
                  <span className="ai-badge" style={{ color: meta.color, background: 'color-mix(in srgb, ' + meta.color + ' 10%, transparent)', borderColor: 'color-mix(in srgb, ' + meta.color + ' 25%, transparent)' }}>
                    <span className="dot" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                </span>
                <span>
                  <span className="ai-model-chip" style={{ fontSize: 11 }}>
                    {r.source ?? '—'}
                  </span>
                </span>
                <span style={{ wordBreak: 'break-all' }}>{r.message ?? '—'}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-4, #b4b4be)' }}>{r.id ?? '—'}</span>
              </div>
            );
          })
        )}
      </div>

      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <Pagination current={page} pageSize={PAGE_SIZE} total={total} showTotal onChange={(p) => {
            setPage(p);
            loadList(p, level);
          }} />
        </div>
      )}
    </div>
  );
}
