/**
 * MarketSettingsPanel — 市场设置面板（技能/插件/模型市场等复用）。
 *
 * 提供：搜索栏、标签分类切换、来源切换、刷新、网格/列表展示、添加操作。
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Spin, Tabs, Tag } from '@arco-design/web-react';
import { Refresh } from '@icon-park/react';
import classNames from 'classnames';

export interface MarketItem {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  url?: string;
  source?: string;
  [key: string]: unknown;
}

export interface MarketSettingsPanelProps {
  title: string;
  description?: string;
  sources: { id: string; name: string; url: string; enabled: boolean }[];
  cacheKey: string;
  autoSyncKey: string;
  defaultSource?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  enableTagFilter?: boolean;
  testIdPrefix?: string;
  addedStateLoading?: boolean;
  isAdded: (item: MarketItem) => boolean;
  text: {
    syncSuccess?: string;
    syncKeptCache?: string;
    syncEmpty?: string;
    syncError?: string;
    openFailed?: string;
    openInBrowser?: string;
    noSearchMatch?: (query: string, sourceLabel?: string) => string;
    noFilterMatch?: string;
    lastUpdated?: (time: string) => string;
  };
  onAdd: (item: MarketItem) => Promise<void>;
  onAddClicked?: (item: MarketItem) => void;
}

type SortKey = 'name' | 'stars' | 'downloads';
type SortOrder = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: '名称' },
  { key: 'stars', label: '热度' },
  { key: 'downloads', label: '下载量' },
];

export const MarketSettingsPanel: React.FC<MarketSettingsPanelProps> = (props) => {
  const {
    title,
    description,
    sources = [],
    cacheKey,
    autoSyncKey,
    defaultSource = sources[0]?.id || '',
    searchPlaceholder = '搜索…',
    emptyText = '暂无数据',
    enableTagFilter = false,
    addedStateLoading = false,
    isAdded,
    text = {},
    onAdd,
    onAddClicked,
  } = props;

  const [activeSource, setActiveSource] = useState(defaultSource);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('stars');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const activeSourceObj = useMemo(
    () => sources.find((s) => s.id === activeSource) || sources[0],
    [sources, activeSource],
  );

  const fetchItems = useCallback(async (useCache = true) => {
    setLoading(true);
    try {
      const resp = await fetch(activeSourceObj?.url || '');
      const data = await resp.json();
      const list: MarketItem[] = Array.isArray(data) ? data : data?.data || [];
      setItems(list);
      if (useCache) {
        try { localStorage.setItem(cacheKey, JSON.stringify(list)); } catch { /* ignore */ }
      }
    } catch {
      if (useCache) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) setItems(JSON.parse(cached));
        } catch { /* ignore */ }
      }
      // eslint-disable-next-line no-console
      console.error('Market fetch failed', text.syncError);
    } finally {
      setLoading(false);
    }
  }, [activeSourceObj, cacheKey, text.syncError]);

  useEffect(() => {
    void fetchItems(true);
    const timer = setInterval(() => void fetchItems(true), 60_000);
    return () => clearInterval(timer);
  }, [fetchItems]);

  const filtered = useMemo(() => {
    let result = items;
    const q = searchQuery.trim().toLowerCase();
    if (q) result = result.filter((i) =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q) ||
      (i.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
    if (enableTagFilter && activeTag !== 'all') {
      result = result.filter((i) => (i.tags || []).includes(activeTag));
    }
    result = [...result].sort((a, b) => {
      const va = (a[sortKey] as number) || 0;
      const vb = (b[sortKey] as number) || 0;
      return sortOrder === 'desc' ? vb - va : va - vb;
    });
    return result;
  }, [items, searchQuery, activeTag, sortKey, sortOrder, enableTagFilter]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((i) => (i.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [items]);

  const handleRefresh = useCallback(async () => {
    try {
      const resp = await fetch(activeSourceObj?.url || '');
      const data = await resp.json();
      const list: MarketItem[] = Array.isArray(data) ? data : data?.data || [];
      if (list.length > 0) {
        setItems(list);
        try { localStorage.setItem(cacheKey, JSON.stringify(list)); } catch { /* ignore */ }
        // eslint-disable-next-line no-console
        console.log(text.syncSuccess || 'Market updated');
      } else {
        text.syncEmpty;
      }
    } catch {
      // eslint-disable-next-line no-console
      console.error(text.syncError || 'Sync failed');
    }
  }, [activeSourceObj, cacheKey, text]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortOrder('desc'); }
  };

  return (
    <div className='flex h-full w-full flex-col'>
      {/* 页面标题 */}
      <div className='mb-16px'>
        <h2 className='text-20px font-600 leading-28px text-t-primary'>{title}</h2>
        {description && (
          <p className='mt-4px text-13px leading-18px text-t-tertiary'>{description}</p>
        )}
      </div>

      {/* 来源切换 + 搜索 + 排序 */}
      <div className='mb-16px flex flex-wrap items-center gap-12px'>
        <Tabs
          type='line'
          size='small'
          value={activeSource}
          onChange={(v: string) => { setActiveSource(v); setSearchQuery(''); setActiveTag('all'); }}
          className='!border-b-0'
        >
          {sources.filter((s) => s.enabled).map((s) => (
            <Tabs.Tab key={s.id} value={s.id} title={
              <span className='flex items-center gap-4px'>
                <span className={classNames('h-6px w-6px rounded-full', s.enabled ? 'bg-success' : 'bg-[var(--color-text-4)]')} />
                {s.name}
              </span>
            } />
          ))}
        </Tabs>

        <div className='ml-auto flex items-center gap-8px'>
          <Input
            className='w-200px max-w-full'
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(v) => setSearchQuery(v)}
            allowClear
          />
          <Button
            type='text'
            size='small'
            icon={<Refresh theme='outline' size='14' fill='currentColor' strokeWidth={4} />}
            onClick={() => void handleRefresh()}
          />
        </div>
      </div>

      {/* 排序 */}
      <div className='mb-12px flex items-center gap-8px'>
        {SORT_OPTIONS.map((opt) => {
          const active = sortKey === opt.key;
          const asc = active && sortOrder === 'asc';
          return (
            <button
              key={opt.key}
              type='button'
              className={classNames(
                'flex items-center gap-4px rounded-6px px-8px py-4px text-12px transition-colors',
                active ? 'bg-primary-1/10 text-primary-6' : 'text-t-secondary hover:bg-fill-1 hover:text-t-primary',
              )}
              onClick={() => handleSort(opt.key)}
            >
              {opt.label}
              {active && <span className='text-t-tertiary'>{asc ? '↑' : '↓'}</span>}
            </button>
          );
        })}
      </div>

      {/* 标签筛选 */}
      {enableTagFilter && allTags.length > 0 && (
        <div className='mb-12px flex flex-wrap items-center gap-6px'>
          <Tag
            key='all'
            color='blue'
            className={classNames('cursor-pointer text-11px', activeTag === 'all' ? '!bg-primary-1 !text-primary-6' : '')}
            onClick={() => setActiveTag('all')}
          >
            全部
          </Tag>
          {allTags.map((tag) => (
            <Tag
              key={tag}
              className={classNames('cursor-pointer text-11px', activeTag === tag ? '!bg-primary-1 !text-primary-6' : '')}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </Tag>
          ))}
        </div>
      )}

      {/* 网格列表 */}
      {loading ? (
        <div className='flex items-center justify-center py-40px'><Spin /></div>
      ) : filtered.length === 0 ? (
        <div className='flex items-center justify-center py-40px'>
          <Empty description={searchQuery ? (text.noSearchMatch?.(searchQuery, activeSourceObj?.name) || '未找到匹配项') : (text.noFilterMatch || emptyText)} />
        </div>
      ) : (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-12px'>
          {filtered.map((item) => {
            const installed = isAdded(item);
            return (
              <div
                key={item.id}
                className='group flex flex-col gap-8px rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-1 p-12px transition-all duration-200 hover:border-[var(--color-border-3)] hover:shadow-sm'
              >
                <div className='flex-1'>
                  <div className='mb-4px flex items-start justify-between gap-8px'>
                    <span className='truncate text-13px font-500 text-t-primary' title={item.name}>{item.name}</span>
                    {installed && <Tag color='green' className='text-10px'>已添加</Tag>}
                  </div>
                  {item.description && (
                    <p className='truncate text-11px leading-16px text-t-tertiary' title={item.description}>{item.description}</p>
                  )}
                  {(item.tags || []).length > 0 && (
                    <div className='mt-4px flex flex-wrap gap-4px'>
                      {item.tags!.slice(0, 3).map((tag) => (
                        <Tag key={tag} className='text-10px' />
                      ))}
                    </div>
                  )}
                </div>
                <div className='flex items-center justify-between gap-8px'>
                  {(item.stars !== undefined || item.downloads !== undefined) && (
                    <div className='flex items-center gap-8px text-11px text-t-tertiary'>
                      {item.stars !== undefined && <span>⭐ {item.stars}</span>}
                      {item.downloads !== undefined && <span>📥 {item.downloads}</span>}
                    </div>
                  )}
                  <Button
                    type={installed ? 'default' : 'primary'}
                    size='small'
                    shape='round'
                    loading={addedStateLoading}
                    disabled={installed}
                    onClick={() => {
                      onAddClicked?.(item);
                      void onAdd(item).then(() => {});
                    }}
                  >
                    {installed ? '已安装' : (text.openInBrowser || '添加')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MarketSettingsPanel;
