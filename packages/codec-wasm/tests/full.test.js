// 测试完整的WASM功能
import { uu2_wasm, uu1_wasm, generateNonce, processRequest, processResponse } from '../src/index.js';

// 模拟配置函数
const mockGetConfig = (key) => {
  const config = {
    'requestCodecOpen': true,
    'codecRequestKey': 'test-key-12345'
  };
  return config[key];
};

// 模拟请求对象
const mockRequest = {
  url: '/api/test',
  data: {
    username: 'testuser',
    password: 'testpass'
  },
  headers: {}
};

// 模拟响应对象
const mockResponse = {
  status: 200,
  data: '02ENCRYPTED_{"username":"testuser","password":"testpass"}_WITH_test-key-_DECRYPTED_WITH_12345678',
  headers: {
    'access-control-origin-key': 'origin-key-value',
    'access-control-timestamp-user': '1234567890'
  }
};

async function testFullWasmFunctionality() {
  console.log('Testing full WASM functionality...');
  
  try {
    // 测试generateNonce函数
    console.log('\n1. Testing generateNonce...');
    const nonce = await generateNonce();
    console.log('Generated nonce:', nonce);
    console.log('Nonce length:', nonce.length);
    
    if (typeof nonce === 'string' && nonce.length >= 32) {
      console.log('✓ generateNonce test passed');
    } else {
      console.log('✗ generateNonce test failed: invalid nonce format');
    }
    
    // 测试processRequest函数
    console.log('\n2. Testing processRequest...');
    const requestData = JSON.stringify(mockRequest.data);
    const result = await processRequest(requestData, mockRequest.url, true, 'test-key-12345');
    console.log('Process request result:', result);
    
    if (typeof result === 'string' && result.includes('ENCRYPTED_')) {
      console.log('✓ processRequest test passed');
    } else {
      console.log('✗ processRequest test failed: invalid result format');
    }
    
    // 测试uu2_wasm函数
    console.log('\n3. Testing uu2_wasm...');
    const encryptedRequest = await uu2_wasm({...mockRequest}, mockGetConfig);
    console.log('Encrypted request:', encryptedRequest);
    
    if (encryptedRequest.data && encryptedRequest.headers) {
      console.log('✓ uu2_wasm test passed');
    } else {
      console.log('✗ uu2_wasm test failed: invalid request format');
    }
    
    console.log('\n✓ All WASM functionality tests completed');
  } catch (error) {
    console.error('Error testing WASM functionality:', error);
  }
}

// 运行测试
testFullWasmFunctionality();