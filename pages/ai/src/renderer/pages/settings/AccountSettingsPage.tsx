import React, { useCallback, useEffect, useState } from 'react';
import { Button, Message, Select, Switch, Input, InputNumber, Tag, Space, Divider, Typography, Spin } from '@arco-design/web-react';
import { httpRequest } from '@/common/adapter/httpBridge';

const { Text, Title } = Typography;

interface PoolStats {
  [key: string]: { total: number; active: number; inactive: number };
}

interface AccountItem {
  id: string;
  email: string;
  password: string;
  token: string;
  platformType: string;
  active: boolean;
  createdAt: number;
  lastUsedAt: number;
}

const PLATFORM_TYPES = [
  { label: 'Grok (xAI)', value: 'GROK' },
  { label: 'Twitter/X', value: 'TWITTER' },
  { label: 'Discord', value: 'DISCORD' },
  { label: 'Reddit', value: 'REDDIT' },
  { label: 'Custom', value: 'CUSTOM' },
];

const EMAIL_PROVIDERS = [
  { label: 'FreeCustom (FCE)', value: 'fce' },
  { label: 'mail.tm', value: 'mail-tm' },
  { label: 'MailNest', value: 'mailnest' },
  { label: 'LuckMail', value: 'luckmail' },
];

const AccountSettingsPage: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [yescaptchaKey, setYesCaptchaKey] = useState('');
  const [emailProvider, setEmailProvider] = useState('fce');
  const [proxy, setProxy] = useState('');
  const [autoCount, setAutoCount] = useState(0);
  const [stats, setStats] = useState<PoolStats>({});
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('GROK');
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await httpRequest('GET', '/api/account/settings');
      if (res) {
        setEnabled(res.enable || false);
        setYesCaptchaKey(res.yescaptchaKey || '');
        setEmailProvider(res.emailProvider || 'fce');
        setProxy(res.proxy || '');
        setAutoCount(res.autoRegisterCount || 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await httpRequest('GET', '/api/account/stats');
      if (res) setStats(res);
    } catch {
      // ignore
    }
  }, []);

  const loadAccounts = useCallback(async (platform?: string) => {
    const p = platform || selectedPlatform;
    try {
      const res = await httpRequest('GET', `/api/account/list/${p}`);
      if (Array.isArray(res)) setAccounts(res as AccountItem[]);
    } catch {
      // ignore
    }
  }, [selectedPlatform]);

  useEffect(() => { loadSettings(); loadStats(); }, []);
  useEffect(() => { loadAccounts(); }, [selectedPlatform, loadAccounts]);

  const handleSave = useCallback(async () => {
    try {
      await httpRequest('POST', '/api/account/settings', {
        enable: enabled,
        yescaptchaKey,
        emailProvider,
        proxy,
        autoRegisterCount: autoCount,
      });
      Message.success('已保存');
    } catch {
      Message.error('保存失败');
    }
  }, [enabled, yescaptchaKey, emailProvider, proxy, autoCount]);

  const handleRegister = useCallback(async (count = 1) => {
    setRegistering(true);
    try {
      const res = await httpRequest('POST', `/api/account/register-batch/${selectedPlatform}?count=${count}&emailProvider=${emailProvider}`);
      if (Array.isArray(res)) {
        Message.success(`注册成功 ${res.length} 个`);
        setAccounts(prev => [...res, ...prev]);
      }
    } catch {
      Message.error('注册失败');
    } finally {
      setRegistering(false);
    }
  }, [selectedPlatform, emailProvider]);

  const handleRelease = useCallback(async (account: AccountItem) => {
    try {
      await httpRequest('POST', `/api/account/release/${selectedPlatform}/${account.id}`);
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, active: false } : a));
      Message.success('已释放');
      loadStats();
    } catch {
      Message.error('操作失败');
    }
  }, [selectedPlatform]);

  const handleReplenish = useCallback(async () => {
    setRegistering(true);
    try {
      const res = await httpRequest('POST', `/api/account/replenish/${selectedPlatform}?count=2`);
      if (Array.isArray(res)) {
        Message.success(`补号成功 ${res.length} 个`);
        setAccounts(prev => [...res, ...prev]);
      }
    } catch {
      Message.error('补号失败');
    } finally {
      setRegistering(false);
    }
  }, [selectedPlatform]);

  const handleRefresh = useCallback(() => {
    loadStats();
    loadAccounts();
  }, [loadStats, loadAccounts]);

  return (
    <div style={{ padding: '24px', maxWidth: 900 }}>
      <Title heading={3} style={{ marginBottom: 24 }}>账号管理</Title>

      {/* 配置区域 */}
      <div style={{ background: '#fafafa', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <Title heading={5} style={{ marginBottom: 16 }}>全局配置</Title>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text>启用自动注册</Text>
            <Switch checked={enabled} onChange={setEnabled} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text style={{ width: 120 }}>YesCaptcha Key</Text>
            <Input.Password
              value={yescaptchaKey}
              onChange={setYesCaptchaKey}
              placeholder="fce_xxxxx..."
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text style={{ width: 120 }}>邮箱提供商</Text>
            <Select
              value={emailProvider}
              onChange={setEmailProvider}
              options={EMAIL_PROVIDERS}
              style={{ width: 200 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text style={{ width: 120 }}>代理地址</Text>
            <Input
              value={proxy}
              onChange={setProxy}
              placeholder="http://127.0.0.1:7897"
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text style={{ width: 120 }}>启动预注册</Text>
            <InputNumber value={autoCount} onChange={v => setAutoCount(v || 0)} min={0} max={20} style={{ width: 100 }} />
            <Text type="secondary">个</Text>
          </div>
          <Button type="primary" onClick={handleSave} style={{ alignSelf: 'flex-start' }}>保存配置</Button>
        </Space>
      </div>

      {/* 账号池统计 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title heading={5} style={{ margin: 0 }}>账号池</Title>
        <Space>
          <Button size="small" onClick={handleRefresh}>刷新</Button>
          <Button size="small" type="primary" loading={registering} onClick={() => handleRegister(1)}>注册1个</Button>
          <Button size="small" type="outline" loading={registering} onClick={handleReplenish}>自动补号</Button>
        </Space>
      </div>

      {/* 平台选择 */}
      <Select
        value={selectedPlatform}
        onChange={setSelectedPlatform}
        options={PLATFORM_TYPES}
        style={{ width: 200, marginBottom: 16 }}
      />

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {Object.entries(stats).map(([type, s]) => (
          <div key={type} style={{ background: '#f6f8fa', borderRadius: 8, padding: '12px 20px', minWidth: 120 }}>
            <Text type="secondary">{type}</Text>
            <div style={{ fontSize: 24, fontWeight: 600 }}>
              <span style={{ color: '#165dff' }}>{s.active}</span>
              <Text type="secondary"> / {s.total}</Text>
            </div>
          </div>
        ))}
      </div>

      {/* 账号列表 */}
      <Spin loading={loading}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {accounts.map(acc => (
            <div
              key={acc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                background: acc.active ? '#f6f8fa' : '#fff1f0',
                borderRadius: 6,
                border: `1px solid ${acc.active ? '#d9d9d9' : '#ffa39e'}`,
              }}
            >
              <Tag color={acc.active ? 'blue' : 'red'}>{acc.active ? '活跃' : '已释放'}</Tag>
              <Text strong style={{ minWidth: 200 }}>{acc.email}</Text>
              <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {acc.token ? acc.token.substring(0, 12) + '...' : '-'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                创建: {new Date(acc.createdAt).toLocaleString()}
              </Text>
              <Button
                size="mini"
                type="text"
                danger
                onClick={() => handleRelease(acc)}
                disabled={ !acc.active}
              >
                释放
              </Button>
            </div>
          ))}
          {accounts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无账号，点击「注册」创建
            </div>
          )}
        </div>
      </Spin>
    </div>
  );
};

export default AccountSettingsPage;
