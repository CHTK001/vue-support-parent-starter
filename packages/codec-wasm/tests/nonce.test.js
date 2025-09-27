// 测试WASM generateNonce函数
import { generateNonce } from '../src/index.js';

async function testGenerateNonce() {
  console.log('Testing WASM generateNonce function...');
  
  try {
    const nonce = await generateNonce();
    console.log('Generated nonce:', nonce);
    console.log('Nonce length:', nonce.length);
    
    // 验证nonce是否符合预期
    if (typeof nonce === 'string' && nonce.length >= 32) {
      console.log('✓ WASM generateNonce test passed');
    } else {
      console.log('✗ WASM generateNonce test failed: invalid nonce format');
    }
    
    // 生成多个nonce验证唯一性
    const nonces = [];
    for (let i = 0; i < 5; i++) {
      const n = await generateNonce();
      nonces.push(n);
      console.log(`Nonce ${i+1}:`, n);
    }
    
    // 检查是否有重复的nonce
    const uniqueNonces = new Set(nonces);
    if (uniqueNonces.size === nonces.length) {
      console.log('✓ All generated nonces are unique');
    } else {
      console.log('✗ Some nonces are duplicated');
    }
  } catch (error) {
    console.error('Error testing generateNonce:', error);
  }
}

// 运行测试
testGenerateNonce();