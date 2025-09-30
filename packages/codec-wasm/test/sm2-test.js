// SM2测试文件
import { initializeWasmModule, smCrypto } from '../src/index.js';

async function runSM2Test() {
    console.log('开始SM2测试...');
    
    try {
        // 初始化WASM模块
        await initializeWasmModule();
        console.log('WASM模块初始化完成');
        
        // 测试数据
        const testData = "Hello, World!";
        const testKey = "1234567890abcdef";
        
        console.log('测试数据:', testData);
        console.log('测试密钥:', testKey);
        
        // JavaScript版本测试
        try {
            console.log('正在使用JavaScript版本进行SM2加密...');
            if (smCrypto && smCrypto.sm2) {
                const jsEncryptedResult = smCrypto.sm2.doEncrypt(testData, testKey, 1); // 1表示C1C3C2格式
                console.log('JavaScript sm-crypto库加密结果:', jsEncryptedResult);
                
                const jsDecryptedResult = smCrypto.sm2.doDecrypt(jsEncryptedResult, testKey, 1); // 1表示C1C3C2格式
                console.log('JavaScript sm-crypto库解密结果:', jsDecryptedResult);
            } else {
                console.error('sm-crypto库未正确加载');
            }
        } catch (error) {
            console.error('JavaScript sm-crypto库处理出错:', error);
        }
        
        // WASM版本测试
        try {
            console.log('正在使用WASM版本进行SM2加密...');
            // 确保WASM模块已正确加载
            const wasmModule = await import('../build/codec_wasm.js');
            if (wasmModule) {
                const wasmEncryptedResult = wasmModule.sm2_encrypt(testData, testKey);
                console.log('WASM加密结果:', wasmEncryptedResult);
                
                const wasmDecryptedResult = wasmModule.sm2_decrypt(wasmEncryptedResult, testKey);
                console.log('WASM解密结果:', wasmDecryptedResult);
            } else {
                console.error('WASM模块未正确加载');
            }
        } catch (error) {
            console.error('WASM处理出错:', error);
        }
        
        console.log('SM2测试完成');
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 运行测试
runSM2Test();