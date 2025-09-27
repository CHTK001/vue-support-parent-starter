// 测试WASM storage key加密功能
import { encryptStorageKey, encryptStorageValue, decryptStorageValue } from '../src/index.js';

async function testStorageEncryption() {
  console.log('Testing WASM storage encryption functions...');
  
  try {
    // 测试encryptStorageKey函数
    console.log('\n1. Testing encryptStorageKey...');
    const key = 'test-key';
    const systemCode = 'SYS001';
    const encryptedKey = await encryptStorageKey(key, systemCode);
    console.log('Original key:', key);
    console.log('Encrypted key:', encryptedKey);
    
    if (encryptedKey === systemCode + key) {
      console.log('✓ encryptStorageKey test passed');
    } else {
      console.log('✗ encryptStorageKey test failed: invalid result');
    }
    
    // 测试特殊key（以responsive-开头）
    console.log('\n2. Testing special key (responsive- prefix)...');
    const specialKey = 'responsive-test';
    const encryptedSpecialKey = await encryptStorageKey(specialKey, systemCode);
    console.log('Special key:', specialKey);
    console.log('Encrypted special key:', encryptedSpecialKey);
    
    if (encryptedSpecialKey === specialKey) {
      console.log('✓ Special key encryption test passed');
    } else {
      console.log('✗ Special key encryption test failed: should not encrypt');
    }
    
    // 测试encryptStorageValue函数
    console.log('\n3. Testing encryptStorageValue...');
    const value = 'test-value';
    const storageKey = 'storage-secret-key';
    const encryptedValue = await encryptStorageValue(value, key, systemCode, storageKey, true);
    console.log('Original value:', value);
    console.log('Encrypted value:', encryptedValue);
    
    if (encryptedValue.startsWith('AES_ENCRYPTED_')) {
      console.log('✓ encryptStorageValue test passed');
    } else {
      console.log('✗ encryptStorageValue test failed: invalid encryption');
    }
    
    // 测试decryptStorageValue函数
    console.log('\n4. Testing decryptStorageValue...');
    const decryptedValue = await decryptStorageValue(encryptedValue, key, systemCode, storageKey, true);
    console.log('Decrypted value:', decryptedValue);
    
    if (decryptedValue === value) {
      console.log('✓ decryptStorageValue test passed');
    } else {
      console.log('✗ decryptStorageValue test failed: decryption mismatch');
    }
    
    console.log('\n✓ All storage encryption tests completed');
  } catch (error) {
    console.error('Error testing storage encryption:', error);
  }
}

// 运行测试
testStorageEncryption();