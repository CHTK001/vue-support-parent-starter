import { describe, expect, it } from 'vitest';
import {
  resolveLiveMode,
  fallbackAfterSseLost,
  liveModeText,
  liveModeTone,
  type LiveState,
} from '../liveChannel';

/**
 * 告警实时通道降级规则。
 *
 * <p>这条规则决定了告警能不能收到，因此每个分支都要钉死：
 * 错误地把状态判成「已实时」会让用户以为一切正常，实际一条告警都收不到。</p>
 */
describe('resolveLiveMode 通道优先级', () => {
  const base: LiveState = { sseConnected: false, socketAvailable: false, windowElapsed: false };

  it('SSE 已连接时优先用 SSE', () => {
    expect(resolveLiveMode({ ...base, sseConnected: true })).toBe('sse');
  });

  it('SSE 已连接且 socket 也可用时仍用 SSE（不走依赖队列的通道）', () => {
    expect(resolveLiveMode({ ...base, sseConnected: true, socketAvailable: true })).toBe('sse');
  });

  it('SSE 未连上但 socket 可用时用 socket', () => {
    expect(resolveLiveMode({ ...base, socketAvailable: true })).toBe('socket');
  });

  it('两者都不可用且建连窗口已过时降级轮询', () => {
    expect(resolveLiveMode({ ...base, windowElapsed: true })).toBe('poll');
  });

  it('建连窗口内两者都未就绪时保持 off，不抢先启动轮询', () => {
    expect(resolveLiveMode(base)).toBe('off');
  });
});

describe('fallbackAfterSseLost SSE 断开回落', () => {
  it('socket 可用时回落到 socket', () => {
    expect(fallbackAfterSseLost(true)).toBe('socket');
  });

  it('socket 不可用时回落到轮询', () => {
    expect(fallbackAfterSseLost(false)).toBe('poll');
  });
});

describe('通道状态展示', () => {
  it('各通道文案正确', () => {
    expect(liveModeText('sse', 30)).toBe('实时推送');
    expect(liveModeText('socket', 30)).toBe('Socket 推送');
    expect(liveModeText('poll', 30)).toBe('轮询 30s');
    expect(liveModeText('off', 30)).toBe('未连接');
  });

  it('只有 SSE 是成功色，轮询与 socket 都是警告色，未连接是危险色', () => {
    expect(liveModeTone('sse')).toBe('success');
    expect(liveModeTone('socket')).toBe('warning');
    expect(liveModeTone('poll')).toBe('warning');
    expect(liveModeTone('off')).toBe('danger');
  });
});
