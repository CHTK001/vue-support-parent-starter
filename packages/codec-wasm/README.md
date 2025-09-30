# Codec WASM Module

WebAssembly implementation of codec utilities for encryption/decryption.

## Overview

This module provides a WebAssembly implementation of various codec utilities for encryption and decryption. The module is designed to run in browser environments and provides better performance compared to pure JavaScript implementations.

## Key Features

1. **Object Parameter Passing**: Instead of serializing objects to JSON strings, we pass objects as functions to WASM. This avoids serialization/deserialization overhead and is more efficient.

2. **Pure Proxy in JavaScript Layer**: The JavaScript layer acts only as a proxy, forwarding function calls to the WASM module without any business logic.

3. **All Business Logic in WASM**: All encryption/decryption logic is implemented in the AssemblyScript code, ensuring better performance and security.

## Architecture

```
JavaScript Layer (Proxy) -> WASM Module (Business Logic)
```

### JavaScript Layer

The JavaScript layer ([src/index.js](file:///H:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/src/index.js)) contains only proxy functions that forward calls to the WASM module. It does not contain any business logic.

### WASM Module

The WASM module contains all the business logic for encryption and decryption. There are two implementations available:

1. **AssemblyScript Implementation** ([assembly/index.ts](file:///H:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/assembly/index.ts)) - Original implementation
2. **Rust Implementation** ([src-rust/lib.rs](file:///H:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/src-rust/lib.rs)) - New implementation using mature Rust cryptographic libraries

The JavaScript wrapper automatically tries to load the Rust implementation first, falling back to the AssemblyScript implementation if the Rust version is not available.

## Usage

### Installation

```bash
npm install @repo/codec-wasm
```

### Initialization

```javascript
import { isWasmLoaded } from '@repo/codec-wasm';

// WASM module is automatically initialized in main.ts
// Check if the WASM module is loaded
if (isWasmLoaded()) {
  console.log('WASM module is loaded');
}
```

### Using the Functions

```javascript
import { uu2_wasm, uu1_wasm, uu3_wasm, uu4_wasm } from '@repo/codec-wasm';

// Example usage of uu2_wasm
const request = {
  method: 'POST',
  url: '/api/test',
  data: { name: 'test', value: 'data' },
  headers: { 'Content-Type': 'application/json' }
};

const processedRequest = uu2_wasm(request);
```

## Functions

### uu2_wasm

Request encryption processing function. This function receives a PureHttpRequestConfig object and processes encryption based on configuration.

If encryption is enabled in the configuration, it encrypts GET requests and JSON requests using SM4 encryption:
- Generates a random encryption key
- Encrypts the request data with the random key
- Encrypts the random key with the codec request key
- Adds both keys to the request headers

Usage:
```javascript
// Example usage of uu2_wasm
const request = {
  method: 'POST',
  url: '/api/test',
  data: { name: 'test', value: 'data' },
  headers: { 'Content-Type': 'application/json' }
};

const processedRequest = uu2_wasm(request);
```

### uu1_wasm

Response decryption processing function.

If the response contains an 'access-control-origin-key' header, it treats the response data as encrypted and processes it accordingly:
- Decrypts the data using the provided keys
- Replaces response.data with the decrypted content
- Removes encryption-related headers from the response

Usage:
```javascript
// Example usage of uu1_wasm
const response = {
  status: 200,
  data: '{"data":"encrypted_content"}',
  headers: {
    'access-control-origin-key': 'some_key',
    'access-control-timestamp-user': 'timestamp'
  }
};

const processedResponse = uu1_wasm(response);
```

### encryptStorageKey

Storage key encryption function. Encrypts storage keys using SM4 encryption with the provided system code as the encryption key.

Usage:
```javascript
// Example usage of encryptStorageKey
const encryptedKey = encryptStorageKey('user_preferences', 'system_secret_code');
```

### encryptStorageValue

Storage value encryption function. Encrypts storage values using either SM4 or AES encryption based on the storageEncode parameter.

Usage:
```javascript
// Example usage of encryptStorageValue
const encryptedValue = encryptStorageValue('sensitive_data', 'encryption_key', 'system_code', 'storage_key', 'SM4');
```

### decryptStorageValue

Storage value decryption function. Decrypts storage values using either SM4 or AES decryption based on the storageEncode parameter.

Usage:
```javascript
// Example usage of decryptStorageValue
const decryptedValue = decryptStorageValue('encrypted_data', 'encryption_key', 'system_code', 'storage_key', 'SM4');
```

### uu3_wasm

AES decryption utility function.

### uu4_wasm

Special response decryption processing function.

### sm4Encrypt

SM4 encryption function.

### sm2Encrypt

SM2 encryption function.

### sm2Decrypt

SM2 decryption function.

### aesEncrypt

AES encryption function.

### aesDecrypt

AES decryption function.

## Development

### Building

To build the AssemblyScript implementation:
```bash
npm run build:as
```

To build the Rust implementation:
```bash
npm run build:rust
```

To build (defaulting to Rust implementation):
```bash
npm run build
```

### Testing

Testing should be done in a browser environment since the WASM module is designed for browser use.

For Rust WASM tests:
```bash
wasm-pack test --headless --firefox
```

Or for Chrome:
```bash
wasm-pack test --headless --chrome
```

## Rust Implementation

This project now includes a Rust implementation of the codec utilities which uses mature cryptographic libraries:

- `sm2` crate for SM2 encryption/decryption
- `sm3` crate for SM3 hashing
- `sm4` crate for SM4 encryption/decryption
- `md5` crate for MD5 hashing

See [BUILD_RUST.md](file:///H:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/BUILD_RUST.md) for detailed instructions on building and using the Rust implementation.

## License

MIT