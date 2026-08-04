/**
 * decodeResponse 纯函数——可执行测试脚本
 *
 * 用法：npx tsx tests/decodeResponse.test.ts
 *
 * 覆盖场景：
 * 1. 正常解密（无噪声）
 * 2. 带 x-ot=2 噪声剔除后解密
 * 3. 缺失 x-ec → 跳过
 * 4. x-ec 不为 "1" → 跳过
 * 5. 缺失 x-ck → 跳过
 * 6. 响应体为空 → 跳过
 * 7. 非 JSON 解密 → 返回字符串
 * 8. 边界：噪声等级大于数据长度
 */

import {
  decodeResponse,
  ENCRYPT_HEADER,
  KEY_HEADER,
  NOISE_LEVEL_HEADER,
} from "../src/httpCrypto";
import type { CryptoModule } from "../src/crypto/types";

// ── Mock CryptoModule ──
// 模拟 AES 解密：逐字节 XOR key 的第一个字节
// 这样调用方可以构造确定的已知输入/输出
function createMockCrypto(): Pick<CryptoModule, "aesDecrypt"> {
  return {
    aesDecrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
      const k = key.length > 0 ? key[0] : 0;
      const out = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        out[i] = data[i] ^ k;
      }
      return out;
    },
  };
}

// ── 辅助：用 mock 加密的逆操作（XOR key）构造"加密"后的数据 ──
function encryptPlain(plainText: string, key: Uint8Array): Uint8Array {
  const plainBytes = new TextEncoder().encode(plainText);
  const k = key.length > 0 ? key[0] : 0;
  const out = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    out[i] = plainBytes[i] ^ k;
  }
  return out;
}

// ── 辅助：字节数组转 base64 ──
function bytesToBase64Manual(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const crypto = createMockCrypto();
const KEY = new Uint8Array([0x42]);
const KEY_B64 = bytesToBase64Manual(KEY);

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, msg: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  assert(a === e, `${msg} (got ${a}, expected ${e})`);
}

function assertNotEqual(actual: unknown, expected: unknown, msg: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  assert(a !== e, msg);
}

// ======================================================
// 场景 1：正常解密（无噪声）
// ======================================================
console.log("\n◎ 场景 1：正常解密（无噪声）");

{
  const plainJson = JSON.stringify({ code: 0, msg: "ok" });
  const encrypted = encryptPlain(plainJson, KEY);
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64 },
    encrypted,
    crypto,
  );
  assert(result.decoded === true, "decoded 应为 true");
  assertDeepEqual(result.data, { code: 0, msg: "ok" }, "JSON 解密正确");
}

{
  const plainText = "hello, world";
  const encrypted = encryptPlain(plainText, KEY);
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64 },
    encrypted,
    crypto,
  );
  assert(result.decoded === true, "decoded 应为 true");
  assert(result.data === plainText, `非 JSON 解密为字符串: ${result.data}`);
}

// ======================================================
// 场景 2：带 x-ot 噪声剔除后解密
// ======================================================
console.log("\n◎ 场景 2：x-ot 噪声剔除");

{
  const plainJson = JSON.stringify({ id: 42 });
  const encrypted = encryptPlain(plainJson, KEY);
  const noisy = new Uint8Array([0xaa, 0xbb, ...encrypted, 0xcc, 0xdd]);
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64, [NOISE_LEVEL_HEADER]: "2" },
    noisy,
    crypto,
  );
  assert(result.decoded === true, "x-ot=2 时 decoded 应为 true");
  assertDeepEqual(result.data, { id: 42 }, "x-ot=2 噪声剔除后解密正确");
}

{
  const plainJson = JSON.stringify({ ok: true });
  const encrypted = encryptPlain(plainJson, KEY);
  const noisy = new Uint8Array([0x01, 0x02, 0x03, ...encrypted, 0xfe, 0xfd, 0xfc]);
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64, [NOISE_LEVEL_HEADER]: "3" },
    noisy,
    crypto,
  );
  assert(result.decoded === true, "x-ot=3 时 decoded 应为 true");
  assertDeepEqual(result.data, { ok: true }, "x-ot=3 噪声剔除后解密正确");
}

{
  const plainJson = JSON.stringify({ a: 1 });
  const encrypted = encryptPlain(plainJson, KEY);
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64, [NOISE_LEVEL_HEADER]: "0" },
    encrypted,
    crypto,
  );
  assert(result.decoded === true, "x-ot=0 时 decoded 应为 true");
  assertDeepEqual(result.data, { a: 1 }, "x-ot=0 不剔除噪声，直接解密");
}

// ======================================================
// 场景 3：缺失 x-ec → 跳过解密
// ======================================================
console.log("\n◎ 场景 3：缺失 x-ec → 跳过");

{
  const rawData = new Uint8Array([0x01, 0x02, 0x03]);
  const result = decodeResponse(
    { [KEY_HEADER]: KEY_B64 },
    rawData,
    crypto,
  );
  assert(result.decoded === false, "缺失 x-ec 时 decoded 应为 false");
  assert(result.data === rawData, "缺失 x-ec 时返回原始数据");
}

// ======================================================
// 场景 4：x-ec 不为 "1" → 跳过解密
// ======================================================
console.log("\n◎ 场景 4：x-ec 不为 '1' → 跳过");

{
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "0", [KEY_HEADER]: KEY_B64 },
    new Uint8Array([0x01]),
    crypto,
  );
  assert(result.decoded === false, "x-ec=0 时 decoded 应为 false");
}

{
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "", [KEY_HEADER]: KEY_B64 },
    new Uint8Array([0x01]),
    crypto,
  );
  assert(result.decoded === false, "x-ec='' 时 decoded 应为 false");
}

// ======================================================
// 场景 5：缺失 x-ck → 跳过解密
// ======================================================
console.log("\n◎ 场景 5：缺失 x-ck → 跳过");

{
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1" },
    new Uint8Array([0x01, 0x02]),
    crypto,
  );
  assert(result.decoded === false, "缺失 x-ck 时 decoded 应为 false");
}

{
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: "" },
    new Uint8Array([0x01]),
    crypto,
  );
  assert(result.decoded === false, "x-ck 为空字符串时 decoded 应为 false");
}

// ======================================================
// 场景 6：响应体为空 → 跳过解密
// ======================================================
console.log("\n◎ 场景 6：响应体为空 → 跳过");

{
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64 },
    "",
    crypto,
  );
  assert(result.decoded === false, "data 为空字符串时 decoded 应为 false");
}

{
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64 },
    undefined as unknown as Uint8Array,
    crypto,
  );
  assert(result.decoded === false, "data 为 undefined 时 decoded 应为 false");
}

// ======================================================
// 场景 7：base64 字符串输入
// ======================================================
console.log("\n◎ 场景 7：base64 字符串输入");

{
  const plainJson = JSON.stringify({ str: "test" });
  const encrypted = encryptPlain(plainJson, KEY);
  const b64 = bytesToBase64Manual(encrypted);
  const result = decodeResponse(
    { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64 },
    b64,
    crypto,
  );
  assert(result.decoded === true, "base64 字符串输入时 decoded 应为 true");
}

// ======================================================
// 场景 8：x-ot 噪声等级大于数据长度（边界保护）
// ======================================================
console.log("\n◎ 场景 8：边界保护");

{
  const data = new Uint8Array([0x01, 0x02, 0x03]);
  let threw = false;
  try {
    decodeResponse(
      { [ENCRYPT_HEADER]: "1", [KEY_HEADER]: KEY_B64, [NOISE_LEVEL_HEADER]: "5" },
      data,
      crypto,
    );
  } catch {
    threw = true;
  }
  assert(!threw, "x-ot 大于数据长度时不应抛异常");
}

// ======================================================
// 汇总
// ======================================================
console.log("\n" + "=".repeat(40));
console.log(`结果：通过 ${passed} 项，失败 ${failed} 项`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("全部通过 ✓");
}