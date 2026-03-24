// Storage使用示例

import { syncLocalStorageProxy, syncSessionStorageProxy, localStorageProxy, sessionStorageProxy } from '../src/storage';

// 同步版本使用示例（无需await）
console.log('=== 同步Storage使用示例 ===');
const syncLocal = syncLocalStorageProxy();
const syncSession = syncSessionStorageProxy();

// 存储数据
syncLocal.setItem('sync-local-key', 'sync-local-value');
syncSession.setItem('sync-session-key', 'sync-session-value');

// 读取数据
const localValue = syncLocal.getItem('sync-local-key');
const sessionValue = syncSession.getItem('sync-session-key');

console.log('同步本地存储值:', localValue);
console.log('同步会话存储值:', sessionValue);

// 异步版本使用示例（需要await）
console.log('\n=== 异步Storage使用示例 ===');
const asyncLocal = localStorageProxy();
const asyncSession = sessionStorageProxy();

async function testAsyncStorage() {
  // 存储数据
  await asyncLocal.setItem('async-local-key', 'async-local-value');
  await asyncSession.setItem('async-session-key', 'async-session-value');
  
  // 读取数据
  const asyncLocalValue = await asyncLocal.getItem('async-local-key');
  const asyncSessionValue = await asyncSession.getItem('async-session-key');
  
  console.log('异步本地存储值:', asyncLocalValue);
  console.log('异步会话存储值:', asyncSessionValue);
}

testAsyncStorage().catch(console.error);