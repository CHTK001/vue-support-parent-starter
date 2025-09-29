// WASM模块测试文件
import { uu1_wasm, uu2_wasm, uu3_wasm, uu4_wasm, initWasm } from '../src/index.js';

// 初始化WASM模块
initWasm();

// 测试uu2_wasm函数
console.log('Testing uu2_wasm...');
const mockRequestFunc = (key) => {
  switch (key) {
    case 'data':
      return '{"message": "Hello World"}';
    case 'url':
      return '/api/test';
    default:
      return '';
  }
};

const mockGetConfig = (key) => {
  switch (key) {
    case 'requestCodecOpen':
      return 'true';
    case 'codecRequestKey':
      return 'testkey123';
    default:
      return '';
  }
};

try {
  const result = uu2_wasm(mockRequestFunc, mockGetConfig);
  console.log('uu2_wasm result:', result);
} catch (error) {
  console.error('Error in uu2_wasm:', error);
}

// 测试uu1_wasm函数
console.log('\nTesting uu1_wasm...');
const mockResponseFunc = (key) => {
  switch (key) {
    case 'status':
      return '200';
    case 'data':
      return '02encrypteddata1234';
    case 'headers':
      return '{"access-control-origin-key": "testkey", "access-control-timestamp-user": "1234567890"}';
    default:
      return '';
  }
};

try {
  const result = uu1_wasm(mockResponseFunc);
  console.log('uu1_wasm result:', result);
} catch (error) {
  console.error('Error in uu1_wasm:', error);
}

// 测试uu3_wasm函数
console.log('\nTesting uu3_wasm...');
try {
  const result = uu3_wasm('encryptedValue', mockGetConfig);
  console.log('uu3_wasm result:', result);
} catch (error) {
  console.error('Error in uu3_wasm:', error);
}

// 测试uu4_wasm函数
console.log('\nTesting uu4_wasm...');
const mockSpecialResponseFunc = (key) => {
  switch (key) {
    case 'data':
      return '02specialdata1234';
    case 'uuid':
      return 'testuuid';
    case 'timestamp':
      return '1234567890';
    default:
      return '';
  }
};

try {
  const result = uu4_wasm(mockSpecialResponseFunc);
  console.log('uu4_wasm result:', result);
} catch (error) {
  console.error('Error in uu4_wasm:', error);
}

console.log('\nAll tests completed.');