/**
 * PageErrorBoundary — 页面级错误边界
 *
 * 单个路由页面渲染报错时，在内容区内展示友好错误页（图标 + 提示 + 重试），
 * 避免整应用白屏；侧边栏等外壳不受影响。
 */
import React from 'react';
import { Button } from '@arco-design/web-react';
import { Info, Reload } from '@icon-park/react';

interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class PageErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 开发环境便于排查
    // eslint-disable-next-line no-console
    console.error('[PageErrorBoundary] 页面渲染失败:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      // 默认：重新加载当前页内容（通过重置 state 让 children 重新挂载）
      // 这里优先 reset state；若仍报错再整页刷新
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    const message = this.state.error?.message || '未知错误';
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 24,
        }}
      >
        <div
          className="ai-card"
          style={{
            maxWidth: 560,
            width: '100%',
            textAlign: 'center',
            padding: '40px 32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Info theme="outline" size={48} strokeWidth={3} fill="currentColor" style={{ color: '#f76965' }} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>页面加载失败</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-3, #9a9aa5)' }}>
            当前页面出现异常，可点击重试；若问题持续，请联系管理员。
          </p>
          <details style={{ textAlign: 'left', margin: '0 0 20px', fontSize: 12, color: 'var(--color-text-3, #9a9aa5)' }}>
            <summary style={{ cursor: 'pointer' }}>查看错误详情</summary>
            <pre
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 6,
                background: 'var(--color-fill-2, #f5f6f7)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {message}
            </pre>
          </details>
          <Button type="primary" icon={<Reload size={14} />} onClick={this.handleReset}>
            重试
          </Button>
        </div>
      </div>
    );
  }
}
