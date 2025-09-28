// 综合测试WASM功能
import { 
  generateNonce, 
  processRequest, 
  processResponse, 
  encryptAES, 
  decryptAES, 
  encryptStorageKey, 
  encryptStorageValue, 
  decryptStorageValue,
  getCurrentTimestamp,
  add
} from '../src/index.js';

function runComprehensiveTests() {
  console.log('Running comprehensive WASM tests...');
  
  try {
    // 测试基础数学函数
    console.log('\n1. Testing basic math functions...');
    const sum = add(5, 3);
    console.log('5 + 3 =', sum);
    if (sum === 8) {
      console.log('✓ Basic math test passed');
    } else {
      console.log('✗ Basic math test failed');
    }
    
    // 测试时间戳函数
    console.log('\n2. Testing timestamp function...');
    const timestamp = getCurrentTimestamp();
    console.log('Current timestamp:', timestamp);
    if (typeof timestamp === 'number' && timestamp > 0) {
      console.log('✓ Timestamp test passed');
    } else {
      console.log('✗ Timestamp test failed');
    }
    
    // 测试nonce生成
    console.log('\n3. Testing nonce generation...');
    const nonce = generateNonce();
    console.log('Generated nonce:', nonce);
    console.log('Nonce length:', nonce.length);
    if (typeof nonce === 'string' && nonce.length >= 32) {
      console.log('✓ Nonce generation test passed');
    } else {
      console.log('✗ Nonce generation test failed');
    }
    
    // 测试AES加密解密
    console.log('\n4. Testing AES encryption/decryption...');
    const testData = 'Hello, World!';
    const testKey = 'secret-key-12345';
    const encrypted = encryptAES(testData, testKey);
    console.log('Original data:', testData);
    console.log('Encrypted data:', encrypted);
    const decrypted = decryptAES(encrypted, testKey);
    console.log('Decrypted data:', decrypted);
    if (decrypted === testData) {
      console.log('✓ AES encryption/decryption test passed');
    } else {
      console.log('✗ AES encryption/decryption test failed');
    }
    
    // 测试存储key加密
    console.log('\n5. Testing storage key encryption...');
    const storageKey = 'user-preferences';
    const systemCode = 'SYS001';
    const encryptedStorageKey = encryptStorageKey(storageKey, systemCode);
    console.log('Original storage key:', storageKey);
    console.log('Encrypted storage key:', encryptedStorageKey);
    if (encryptedStorageKey === systemCode + storageKey) {
      console.log('✓ Storage key encryption test passed');
    } else {
      console.log('✗ Storage key encryption test failed');
    }
    
    // 测试特殊存储key（不应加密）
    console.log('\n6. Testing special storage key...');
    const specialKey = 'responsive-test-key';
    const encryptedSpecialKey = encryptStorageKey(specialKey, systemCode);
    console.log('Special key:', specialKey);
    console.log('Encrypted special key:', encryptedSpecialKey);
    if (encryptedSpecialKey === specialKey) {
      console.log('✓ Special storage key test passed');
    } else {
      console.log('✗ Special storage key test failed');
    }
    
    // 测试存储值加密解密
    console.log('\n7. Testing storage value encryption/decryption...');
    const storageValue = 'user-setting-value';
    const encryptedStorageValue = encryptStorageValue(storageValue, storageKey, systemCode, testKey, true);
    console.log('Original storage value:', storageValue);
    console.log('Encrypted storage value:', encryptedStorageValue);
    const decryptedStorageValue = decryptStorageValue(encryptedStorageValue, storageKey, systemCode, testKey, true);
    console.log('Decrypted storage value:', decryptedStorageValue);
    if (decryptedStorageValue === storageValue) {
      console.log('✓ Storage value encryption/decryption test passed');
    } else {
      console.log('✗ Storage value encryption/decryption test failed');
    }
    
    // 测试请求处理
    console.log('\n8. Testing request processing...');
    const requestData = JSON.stringify({ username: 'testuser', action: 'login' });
    const requestUrl = '/api/login';
    const processedRequest = processRequest(requestData, requestUrl, true, testKey);
    console.log('Processed request:', processedRequest);
    if (typeof processedRequest === 'string' && processedRequest.includes('data')) {
      console.log('✓ Request processing test passed');
    } else {
      console.log('✗ Request processing test failed');
    }
    
    console.log('\n✓ All comprehensive tests completed successfully!');
  } catch (error) {
    console.error('Error in comprehensive tests:', error);
  }
}

// 运行测试
runComprehensiveTests();