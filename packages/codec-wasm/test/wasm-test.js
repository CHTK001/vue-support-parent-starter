// 简单的WASM测试文件
import { initWasm, isWasmLoaded, uu1_wasm, uu2_wasm, uu3_wasm, uu4_wasm, generateNonce, md5Hash } from '../src/index.js';

// Mock config function
const mockGetConfig = (key) => {
  const config = {
    requestCodecOpen: 'true',
    codecRequestKey: '1234567890123456',
    responseCodecOpen: 'true',
    codecResponseKey: '1234567890123456'
  };
  return config[key] || '';
};

async function runTests() {
  try {
    console.log('Initializing WASM module...');
    await initWasm();
    console.log('WASM module initialized:', isWasmLoaded());
    
    if (!isWasmLoaded()) {
      console.error('WASM module failed to load');
      return;
    }
    
    // 测试generateNonce函数
    console.log('Testing generateNonce...');
    const nonce = generateNonce();
    console.log('Generated nonce:', nonce);
    
    // 测试MD5哈希函数
    console.log('Testing md5Hash...');
    const hash = md5Hash('test string');
    console.log('MD5 hash:', hash);
    
    // 测试uu2_wasm函数
    console.log('Testing uu2_wasm...');
    const requestFunc = (key) => {
      switch (key) {
        case 'data': return '{"name":"test","value":"data"}';
        case 'url': return '/api/test';
        default: return '';
      }
    };
    
    const encryptedResult = uu2_wasm(requestFunc, mockGetConfig);
    console.log('uu2_wasm result:', encryptedResult);
    
    // 测试uu3_wasm函数
    console.log('Testing uu3_wasm...');
    const simpleEncrypted = uu3_wasm('Hello World', mockGetConfig);
    console.log('uu3_wasm result:', simpleEncrypted);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// 运行测试
runTests();