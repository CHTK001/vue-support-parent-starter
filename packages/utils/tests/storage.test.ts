import { describe, it, expect } from 'vitest';
import { syncLocalStorageProxy, syncSessionStorageProxy } from '../src/storage';

describe('Sync Storage Proxy', () => {
  it('should set and get item from sync local storage', () => {
    const storage = syncLocalStorageProxy();
    const testKey = 'test-key';
    const testValue = 'test-value';
    
    storage.setItem(testKey, testValue);
    const result = storage.getItem(testKey);
    
    expect(result).toBe(testValue);
  });

  it('should set and get item from sync session storage', () => {
    const storage = syncSessionStorageProxy();
    const testKey = 'test-session-key';
    const testValue = 'test-session-value';
    
    storage.setItem(testKey, testValue);
    const result = storage.getItem(testKey);
    
    expect(result).toBe(testValue);
  });

  it('should remove item from sync local storage', () => {
    const storage = syncLocalStorageProxy();
    const testKey = 'test-remove-key';
    const testValue = 'test-remove-value';
    
    storage.setItem(testKey, testValue);
    storage.removeItem(testKey);
    const result = storage.getItem(testKey);
    
    expect(result).toBeNull();
  });

  it('should clear all items from sync local storage', () => {
    const storage = syncLocalStorageProxy();
    const testKey1 = 'test-clear-key-1';
    const testKey2 = 'test-clear-key-2';
    const testValue = 'test-clear-value';
    
    storage.setItem(testKey1, testValue);
    storage.setItem(testKey2, testValue);
    storage.clear();
    
    const result1 = storage.getItem(testKey1);
    const result2 = storage.getItem(testKey2);
    
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });
});