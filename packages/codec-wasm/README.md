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

The WASM module ([assembly/index.ts](file:///H:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/assembly/index.ts)) contains all the business logic for encryption and decryption.

## Usage

### Installation

```bash
npm install @repo/codec-wasm
```

### Initialization

```javascript
import { initializeWasmModule, isWasmLoaded } from '@repo/codec-wasm';

// Initialize the WASM module
await initializeWasmModule();

// Check if the WASM module is loaded
if (isWasmLoaded()) {
  console.log('WASM module is loaded');
}
```

### Using the Functions

```javascript
import { uu2_wasm, uu1_wasm, uu3_wasm, uu4_wasm } from '@repo/codec-wasm';

// Example usage of uu2_wasm
const requestData = '{"name":"test","value":"data"}';
const requestUrl = '/api/test';
const configOpenStr = 'true';
const codecRequestKey = 'encryption_key';

const result = uu2_wasm(requestData, requestUrl, configOpenStr, codecRequestKey);
```

## Functions

### uu2_wasm

Request encryption processing function.

### uu1_wasm

Response decryption processing function.

### uu3_wasm

AES decryption utility function.

### uu4_wasm

Special response decryption processing function.

## Development

### Building

```bash
npm run build
```

### Testing

Testing should be done in a browser environment since the WASM module is designed for browser use.

## License

MIT