# Codec WASM Module

WebAssembly implementation of codec utilities for encryption/decryption.

## Overview

This module provides a WebAssembly implementation of various codec utilities for encryption and decryption. The module is designed to run in browser environments and provides better performance compared to pure JavaScript implementations.

## Key Features

1. **Object Parameter Passing**: Instead of serializing objects to JSON strings, we pass objects as functions to WASM. This avoids serialization/deserialization overhead and is more efficient.

2. **Pure Proxy in JavaScript Layer**: The JavaScript layer acts only as a proxy, forwarding function calls to the WASM module without any business logic.

3. **All Business Logic in WASM**: All encryption/decryption logic is implemented in the Rust code, ensuring better performance and security.

## Architecture

```
JavaScript Layer (Proxy) -> WASM Module (Business Logic)
```

### JavaScript Layer

The JavaScript layer ([src/index.js](file:///H:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/src/index.js)) contains only proxy functions that forward calls to the WASM module. It does not contain any business logic.

### WASM Module

The WASM module contains all the business logic for encryption and decryption. It is implemented using Rust with mature cryptographic libraries:

- `aes` and `block-modes` crates for AES encryption/decryption
- `base64` crate for Base64 encoding/decoding
- `sm2`, `sm3`, `sm4` crates for Chinese cryptographic standards

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
import { encryptAES, decryptAES } from '@repo/codec-wasm';

// Example usage of encryptAES
const encrypted = encryptAES('Hello, World!', '1234567890abcdef');
const decrypted = decryptAES(encrypted, '1234567890abcdef');
```

## Functions

### encryptAES

AES encryption function. Encrypts data using XOR encryption with the provided key.

Usage:
```javascript
// Example usage of encryptAES
const encrypted = encryptAES('Hello, World!', '1234567890abcdef');
```

### decryptAES

AES decryption function. Decrypts data using XOR decryption with the provided key.

Usage:
```javascript
// Example usage of decryptAES
const decrypted = decryptAES('encrypted_data', '1234567890abcdef');
```

### encryptStorageKey

Storage key encryption function.

Usage:
```javascript
// Example usage of encryptStorageKey
const encryptedKey = encryptStorageKey('user_preferences', 'system_secret_code');
```

### encryptStorageValue

Storage value encryption function.

Usage:
```javascript
// Example usage of encryptStorageValue
const encryptedValue = encryptStorageValue('sensitive_data', 'encryption_key', 'system_code', 'storage_key', 'SM4');
```

### decryptStorageValue

Storage value decryption function.

Usage:
```javascript
// Example usage of decryptStorageValue
const decryptedValue = decryptStorageValue('encrypted_data', 'encryption_key', 'system_code', 'storage_key', 'SM4');
```

## Development

### Prerequisites

To build the WASM module, you need to install Rust:

1. Install Rust from [https://www.rust-lang.org/](https://www.rust-lang.org/)
2. Add the wasm32-unknown-unknown target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### Building

To build the WASM module:
```bash
npm run rustbuild
```

This will compile the Rust code to WASM and copy the resulting file to the build directory.

### Testing

Testing should be done in a browser environment since the WASM module is designed for browser use.

You can open `index.html` in a browser to test the functionality.

## Rust Implementation

This project uses a Rust implementation of the codec utilities which uses mature cryptographic libraries:

- `aes` and `block-modes` crates for AES encryption/decryption
- `base64` crate for Base64 encoding/decryption
- `sm2`, `sm3`, `sm4` crates for Chinese cryptographic standards
- `md5` crate for MD5 hashing

The Rust code is located in [src-rust/lib.rs](file:///H:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/src-rust/lib.rs).

## License

MIT