import { describe, expect, it } from 'vitest';
import { pickListenPid, type NetProcessInfo } from '../api/hostRuntime';

/**
 * 端口反查 PID 的判定规则。
 *
 * <p>这条规则决定「服务详情里显示的 CPU/内存是不是这个服务自己的」：
 * 取错行就会把客户端进程的资源算到服务头上。</p>
 */
describe('pickListenPid 按端口挑监听进程', () => {
  it('命中 LISTEN 行时返回其 PID', () => {
    const rows: NetProcessInfo[] = [
      { protocol: 'tcp', localPort: 18080, port: 18080, state: 'LISTEN', pid: 4321, process: 'java' },
    ];
    expect(pickListenPid(rows, 18080)).toBe(4321);
  });

  it('UDP 的 UNCONN 行同样视为监听', () => {
    const rows: NetProcessInfo[] = [
      { protocol: 'udp', localPort: 5060, port: 5060, state: 'UNCONN', pid: 77, process: 'sip' },
    ];
    expect(pickListenPid(rows, 5060)).toBe(77);
  });

  it('只有 ESTABLISHED 时不认作服务进程', () => {
    const rows: NetProcessInfo[] = [
      { protocol: 'tcp', localPort: 18080, port: 18080, state: 'ESTABLISHED', pid: 9, process: 'curl' },
    ];
    expect(pickListenPid(rows, 18080)).toBe(0);
  });

  it('同一端口同时有监听和已连接时优先取监听行', () => {
    const rows: NetProcessInfo[] = [
      { protocol: 'tcp', localPort: 18080, port: 18080, state: 'ESTABLISHED', pid: 9, process: 'curl' },
      { protocol: 'tcp', localPort: 18080, port: 18080, state: 'LISTEN', pid: 4321, process: 'java' },
    ];
    expect(pickListenPid(rows, 18080)).toBe(4321);
  });

  it('端口不匹配时返回 0', () => {
    const rows: NetProcessInfo[] = [
      { protocol: 'tcp', localPort: 9999, port: 9999, state: 'LISTEN', pid: 11, process: 'x' },
    ];
    expect(pickListenPid(rows, 18080)).toBe(0);
  });

  it('监听行 PID 为 0（权限不足）时返回 0', () => {
    const rows: NetProcessInfo[] = [
      { protocol: 'tcp', localPort: 18080, port: 18080, state: 'LISTEN', pid: 0, process: '' },
    ];
    expect(pickListenPid(rows, 18080)).toBe(0);
  });

  it('port 缺省时回退读 localPort', () => {
    const rows: NetProcessInfo[] = [
      { protocol: 'tcp', localPort: 18080, state: 'LISTEN', pid: 55, process: 'java' },
    ];
    expect(pickListenPid(rows, 18080)).toBe(55);
  });

  it('端口为 0 或空列表时安全返回 0', () => {
    expect(pickListenPid([{ protocol: 'tcp', port: 0, state: 'LISTEN', pid: 1 }], 0)).toBe(0);
    expect(pickListenPid([], 18080)).toBe(0);
  });
});
